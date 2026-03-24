/* Leaderboard page script — optimized for minimal Firebase reads/writes.
 *
 * FIREBASE USAGE RULES (to avoid high bills):
 * 1. WRITE: Only when the user explicitly ends a "session" — i.e. JOIN (first time) or SAVE SCORE. No writes during gameplay or on every click.
 * 2. READ: Only on page load (one fetch of top entries). No live listeners (onSnapshot), no polling loops.
 * 3. REFRESH: Manual refresh is rate-limited to at most once every 30 seconds; otherwise we render from in-memory cache.
 * 4. QUERY: We fetch only the top 10–20 scores using orderBy + limit to minimize read count.
 * 5. CACHE: Results are cached in memory so the UI can show/update without extra Firebase requests.
 * 6. No setInterval, no onSnapshot, no visibility-based re-fetch that would cause continuous reads.
 */
const SAVE_KEY = "epstein_clicker_bigint_owned_v1";

function _loadScore10FromSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return 0n;
    const data = JSON.parse(raw);
    if (!data || !data.score10) return 0n;
    return BigInt(data.score10);
  } catch (e) { return 0n; }
}
function _writeScore10ToSave(score10) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data.score10 = (score10 ?? 0n).toString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {}
}

let score10 = _loadScore10FromSave();
window.score10 = score10;

function setLbListHtml(html) {
  const el = document.getElementById("lbList");
  if (el) el.innerHTML = html;
}

function initLeaderboard() {
  if (typeof firebase === "undefined" || typeof firebase.firestore === "undefined") {
    setLbListHtml("<div class='lbError'>Leaderboard unavailable: Firebase did not load. Check your connection or ad-blocker.</div>");
    const countEl = document.getElementById("lbPlayerCount");
    if (countEl) countEl.textContent = "0";
    setTimeout(initLeaderboard, 400);
    return;
  }

  /* ========= Firebase config (leaderboard only, no sign-in) ========= */
  const firebaseConfig = {
    apiKey: "AIzaSyAmdKfNp-9_I12DUxBP3ueFVWtk6cZIkio",
    authDomain: "epsteinclicker.firebaseapp.com",
    projectId: "epsteinclicker",
    storageBucket: "epsteinclicker.firebasestorage.app",
    messagingSenderId: "283677573494",
    appId: "1:283677573494:web:4d890064f1dcbd2ec63a57",
    measurementId: "G-MVXGJXLC3C"
  };

  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    if (!e.code || e.code !== "app/duplicate-app") console.warn("Firebase init:", e);
  }
  const db = firebase.firestore();

  function getDeviceId() {
    let id = localStorage.getItem("lb_deviceId");
    if (!id) {
      id = crypto.getRandomValues(new Uint8Array(16))
        .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
      localStorage.setItem("lb_deviceId", id);
    }
    return id;
  }
  const deviceId = getDeviceId();

  const lbName = document.getElementById("lbName");
  const joinBtn = document.getElementById("joinBtn");
  const saveBtn = document.getElementById("saveBtn");
  const lbMsg = document.getElementById("lbMsg");
  const lbList = document.getElementById("lbList");

  function setMsg(t) { if (lbMsg) lbMsg.textContent = t || ""; }
  function normalizeName(n) { return (n || "").trim().replace(/\s+/g, " "); }
  function canUseName(n) { n = normalizeName(n); return n.length >= 8 && n.length <= 20; }

  const nameKey = "lb_name";
  let playerName = localStorage.getItem(nameKey) || "";

  function bigIntToDoubleApprox(bi) {
    if (bi <= 0n) return 0;
    const s = bi.toString();
    if (s.length <= 15) return Number(s);
    const lead = s.slice(0, 16);
    const exp = s.length - 16;
    let x = Number(lead) * Math.pow(10, exp);
    if (!Number.isFinite(x)) x = Number.MAX_VALUE;
    return x;
  }

  function getPointsNumber() {
    try {
      if (typeof score10 === "bigint") {
        const whole = score10 / 10n;
        return bigIntToDoubleApprox(whole);
      }
    } catch (e) {}
    return 0;
  }

  function fmtInt(n) {
    if (!Number.isFinite(n) || n <= 0) return "0";
    if (n < 1e21) return Math.floor(n).toLocaleString("en-US");
    return n.toExponential(2).replace("+", "");
  }

  function scoreCellHtml(sc) {
    const txt = fmtInt(sc);
    let px = 12;
    const len = txt.length;
    if (len <= 10) px = 12;
    else if (len <= 14) px = 11;
    else if (len <= 18) px = 10;
    else px = 9;
    return `<div style="min-width:84px; max-width:140px; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:${px}px;">${txt}</div>`;
  }

  // --- WRITES: Only on explicit user action (JOIN or SAVE SCORE). Never during gameplay or on a timer. ---
  async function joinOrChangeName() {
    if (!lbName) return;
    const gate = (window.__canSubmitLeaderboard ? window.__canSubmitLeaderboard() : { ok: true, msg: "" });
    if (!gate.ok) { setMsg(gate.msg); return; }
    const n = normalizeName(lbName.value);

    try {
      const ref = db.collection("leaderboard").doc(deviceId);
      const snap = await ref.get();
      const pts = getPointsNumber();
      const scoreNum = Number.isFinite(pts) ? pts : 0;

      if (!snap.exists) {
        if (!canUseName(n)) {
          setMsg("Name must be 8–20 characters.");
          return;
        }
        const payload = {
          deviceId: String(deviceId),
          name: String(n),
          score: scoreNum,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await ref.set(payload);
        setMsg("Joined! Name is locked. Use SAVE SCORE to update your score.");
        playerName = n;
      } else {
        const data = snap.data() || {};
        const old = Number(data.score);
        const next = Math.max(old, scoreNum);
        await ref.update({
          score: next,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setMsg("Score updated: " + fmtInt(next));
        playerName = (data.name && String(data.name).trim()) || playerName || n;
        if (lbName) lbName.value = playerName;
      }

      localStorage.setItem(nameKey, playerName);
      joinBtn.textContent = "SAVE SCORE";
      joinBtn.style.display = "none";
      if (lbName) lbName.disabled = true;
      saveBtn.disabled = false;
    } catch (e) {
      console.error(e);
      const code = (e && e.code) || "";
      const msg = (e && e.message) || String(e);
      if (code === "permission-denied" || msg.indexOf("permission") !== -1) {
        setMsg("Join failed: permission denied. Check Firestore security rules (allow create for leaderboard).");
      } else if (code === "unavailable" || msg.indexOf("unavailable") !== -1) {
        setMsg("Join failed: network error. Try again.");
      } else {
        setMsg("Join failed: " + (msg.slice(0, 60) || "Check console."));
      }
    }
  }

  async function saveScore() {
    const gate = (window.__canSubmitLeaderboard ? window.__canSubmitLeaderboard() : { ok: true, msg: "" });
    if (!gate.ok) { setMsg(gate.msg); return; }
    if (!playerName) {
      setMsg("Join first.");
      return;
    }
    const pts = getPointsNumber();
    try {
      const ref = db.collection("leaderboard").doc(deviceId);
      if (pts <= 0) {
        const snap = await ref.get();
        if (snap.exists) {
          await ref.delete();
          setMsg("Score is 0; removed from leaderboard.");
        } else {
          setMsg("Not on leaderboard.");
        }
        return;
      }
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists) throw new Error("Not joined");
        tx.update(ref, {
          score: pts,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      setMsg("Saved score: " + fmtInt(pts));
    } catch (e) {
      console.error(e);
      setMsg("Save failed. Check rules.");
    }
  }

  // --- No auto-sync during gameplay: syncScoreToFirebase removed. Writes only on JOIN / SAVE SCORE above. ---

  const WEEK_RESET_KEY = "epstein_weekly_reset_v1";
  function getWeekKey() {
    const d = new Date();
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / 86400000);
    const weekNum = Math.floor(days / 7) + 1;
    return d.getFullYear() + "-W" + weekNum;
  }
  function performWeeklyResetIfNeeded() {
    try {
      const weekKey = getWeekKey();
      const lastKey = localStorage.getItem(WEEK_RESET_KEY);
      if (lastKey === weekKey) return;

      try {
        score10 = 0n;
        window.score10 = 0n;
        _writeScore10ToSave(0n);
      } catch (e) {}
      try { if (typeof autoCarry !== "undefined") autoCarry = 0n; } catch (e) {}
      try { if (typeof save === "function") save(); } catch (e) {}
      try {
        if (typeof fullUpdate === "function") fullUpdate();
        else if (typeof updateTopUI === "function") updateTopUI();
      } catch (e) {}

      try {
        if (typeof db !== "undefined" && typeof deviceId !== "undefined") {
          const ref = db.collection("leaderboard").doc(deviceId);
          ref.get().then(snap => {
            if (snap.exists) ref.delete().catch(e => console.error("Weekly leaderboard delete failed:", e));
          }).catch(e => console.error("Weekly leaderboard check failed:", e));
        }
      } catch (e) {
        console.error("Firebase weekly reset error:", e);
      }
      localStorage.setItem(WEEK_RESET_KEY, weekKey);
    } catch (e) {
      console.error("performWeeklyResetIfNeeded error:", e);
    }
  }

  if (joinBtn) joinBtn.addEventListener("click", joinOrChangeName);
  if (saveBtn) saveBtn.addEventListener("click", saveScore);
  const lbRefreshBtn = document.getElementById("lbRefreshBtn");
  if (lbRefreshBtn) lbRefreshBtn.addEventListener("click", onRefreshClick);

  if (lbName) {
    lbName.disabled = false;
    lbName.removeAttribute("readonly");
  }
  if (joinBtn) joinBtn.style.display = "";
  setMsg("Enter a name (8–20 chars) and click JOIN.");

  // Single read on load to determine if this device has already joined (lock name, show SAVE SCORE).
  async function applyJoinedState() {
    try {
      const ref = db.collection("leaderboard").doc(deviceId);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() || {};
        playerName = (data.name && String(data.name).trim()) || "";
        if (playerName && lbName) {
          lbName.value = playerName;
          lbName.disabled = true;
        }
        if (joinBtn) joinBtn.style.display = "none";
        if (saveBtn) saveBtn.disabled = false;
        setMsg("Joined as: " + playerName + ". Use SAVE SCORE to update.");
      } else {
        if (lbName) lbName.disabled = false;
        if (joinBtn) joinBtn.style.display = "";
        if (saveBtn) saveBtn.disabled = true;
        setMsg("Enter a name (8–20 chars) and click JOIN.");
      }
    } catch (e) {
      if (lbName) lbName.disabled = false;
      if (joinBtn) joinBtn.style.display = "";
      setMsg("Enter a name (8–20 chars) and click JOIN.");
    }
  }

  // --- In-memory cache: UI renders from this so we do not need Firebase reads for display. ---
  const LEADERBOARD_CACHE = {
    entries: [],
    playerCount: 0,
    fetchedAt: 0
  };

  const LB_QUERY_LIMIT = 20;  // Only fetch top 20 to reduce read count.
  const LB_MIN_REFRESH_MS = 30000;  // Manual refresh at most once every 30 seconds.

  function oneRowHtml(rank, name, sc, isMe) {
    return `
      <div class="row">
        <div>#${rank}</div>
        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; ${isMe ? "text-shadow:0 0 10px rgba(0,255,90,.7);" : ""}">
          ${name}${isMe ? " (YOU)" : ""}
        </div>
        ${scoreCellHtml(sc)}
      </div>
    `;
  }

  // Renders from cache only — no Firebase read. Keeps UI responsive without extra reads.
  function renderLeaderboardFromCache() {
    const entries = LEADERBOARD_CACHE.entries;
    const topTenEl = document.getElementById("lbTopTen");
    const countEl = document.getElementById("lbPlayerCount");
    if (countEl) countEl.textContent = String(LEADERBOARD_CACHE.playerCount);
    if (entries.length === 0) {
      if (lbList) lbList.innerHTML = "<div style='opacity:.8'>No scores yet. Join and save to appear.</div>";
      if (topTenEl) topTenEl.innerHTML = "<div style='opacity:.8'>No scores yet.</div>";
      return;
    }
    const nameCount = {};
    entries.forEach(e => { nameCount[e.name] = (nameCount[e.name] || 0) + 1; });
    const nameUsed = {};
    entries.forEach(e => {
      const n = nameCount[e.name];
      if (n > 1) {
        nameUsed[e.name] = (nameUsed[e.name] || 0) + 1;
        e.displayName = e.name + " (" + nameUsed[e.name] + ")";
      } else {
        e.displayName = e.name;
      }
    });
    let out = "";
    let topTenOut = "";
    entries.forEach((entry, idx) => {
      const rank = idx + 1;
      const nameEscaped = (entry.displayName || entry.name).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const isMe = entry.id === deviceId;
      const row = oneRowHtml(rank, nameEscaped, entry.score, isMe);
      out += row;
      if (rank <= 10) topTenOut += row;
    });
    if (lbList) lbList.innerHTML = out;
    if (topTenEl) topTenEl.innerHTML = topTenOut;
  }

  // Single fetch from Firestore: only top N by score, one read per doc (up to LB_QUERY_LIMIT). No polling.
  async function fetchLeaderboard() {
    const topTenEl = document.getElementById("lbTopTen");
    const countEl = document.getElementById("lbPlayerCount");
    if (lbList) lbList.innerHTML = "<div class='lbLoading'>Loading…</div>";
    if (topTenEl) topTenEl.innerHTML = "<div class='lbLoading'>Loading…</div>";
    if (countEl) countEl.textContent = "…";
    try {
      // Limit reads: only fetch top 20 by score. Requires Firestore index on (score desc) if not auto-created.
      const snap = await db.collection("leaderboard")
        .orderBy("score", "desc")
        .limit(LB_QUERY_LIMIT)
        .get();

      const entries = [];
      snap.forEach((docx) => {
        const d = docx.data() || {};
        const sc = Number(d.score);
        if (sc <= 0 || !Number.isFinite(sc)) return;
        const name = String(d.name || "").trim();
        if (!name) return;
        entries.push({ id: docx.id, name, score: sc });
      });
      // Already ordered by query; keep descending
      entries.sort((a, b) => b.score - a.score);

      LEADERBOARD_CACHE.entries = entries;
      LEADERBOARD_CACHE.playerCount = entries.length;
      LEADERBOARD_CACHE.fetchedAt = Date.now();
      renderLeaderboardFromCache();
    } catch (e) {
      console.error("Leaderboard fetch failed:", e);
      if (lbList) lbList.innerHTML = "<div class='lbError'>Leaderboard unavailable. Check your connection or try again.</div>";
      if (topTenEl) topTenEl.innerHTML = "<div class='lbError'>Unavailable</div>";
      if (countEl) countEl.textContent = "0";
      if (!window._lbRetried) {
        window._lbRetried = true;
        setTimeout(() => { window._lbRetried = false; fetchLeaderboard(); }, 3000);
      }
    }
  }

  // Manual refresh: rate-limited to at most once every 30s to prevent excessive reads.
  function onRefreshClick() {
    const now = Date.now();
    if (now - LEADERBOARD_CACHE.fetchedAt < LB_MIN_REFRESH_MS && LEADERBOARD_CACHE.entries.length > 0) {
      setMsg("Refreshed (cached). Wait 30s for a new fetch.");
      renderLeaderboardFromCache();
      return;
    }
    setMsg("Refreshing…");
    fetchLeaderboard().then(() => setMsg("Refreshed."));
  }

  // No polling: we do one read on page load only. No setInterval, no onSnapshot, no visibility-based re-fetch.
  setTimeout(() => {
    applyJoinedState();
    fetchLeaderboard();
    performWeeklyResetIfNeeded();
    setInterval(performWeeklyResetIfNeeded, 60 * 60 * 1000);
  }, 200);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLeaderboard);
} else {
  initLeaderboard();
}
