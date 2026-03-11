/* Leaderboard page script (patched for multi-page setup) */
const SAVE_KEY = "epstein_clicker_bigint_owned_v1";

function _loadScore10FromSave(){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    if(!raw) return 0n;
    const data = JSON.parse(raw);
    if(!data || !data.score10) return 0n;
    return BigInt(data.score10);
  }catch(e){ return 0n; }
}
function _writeScore10ToSave(score10){
  try{
    const raw = localStorage.getItem(SAVE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data.score10 = (score10 ?? 0n).toString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }catch(e){}
}

// Ensure score10 exists for legacy code below
let score10 = _loadScore10FromSave();
window.score10 = score10;

function setLbListHtml(html){
  const el = document.getElementById("lbList");
  if(el) el.innerHTML = html;
}

// Only init Firebase and rest when DOM and Firebase SDK are ready
function initLeaderboard(){
  if (typeof firebase === "undefined" || typeof firebase.firestore === "undefined") {
    setLbListHtml("<div class='lbError'>Leaderboard unavailable: Firebase did not load. Check your connection or ad-blocker.</div>");
    var countEl = document.getElementById("lbPlayerCount");
    if (countEl) countEl.textContent = "0";
    setTimeout(initLeaderboard, 400);
    return;
  }

/* ========= Firebase Leaderboard (no sign-in) ========= */
const firebaseConfig = {
  apiKey: "AIzaSyAmdKfNp-9_I12DUxBP3ueFVWtk6cZIkio",
  authDomain: "epsteinclicker.firebaseapp.com",
  projectId: "epsteinclicker",
  storageBucket: "epsteinclicker.firebasestorage.app",
  messagingSenderId: "283677573494",
  appId: "1:283677573494:web:4d890064f1dcbd2ec63a57",
  measurementId: "G-MVXGJXLC3C"
};

try{
  firebase.initializeApp(firebaseConfig);
}catch(e){
  if (!e.code || e.code !== "app/duplicate-app") console.warn("Firebase init:", e);
}
const db = firebase.firestore();

function getDeviceId(){
  let id = localStorage.getItem("lb_deviceId");
  if(!id){
    id = crypto.getRandomValues(new Uint8Array(16))
      .reduce((s,b)=>s + b.toString(16).padStart(2,'0'), '');
    localStorage.setItem("lb_deviceId", id);
  }
  return id;
}
const deviceId = getDeviceId();

const lbName = document.getElementById("lbName");
const joinBtn = document.getElementById("joinBtn");
const saveBtn = document.getElementById("saveBtn");
const lbMsg  = document.getElementById("lbMsg");
const lbList = document.getElementById("lbList");

function setMsg(t){ if (lbMsg) lbMsg.textContent = t || ""; }
function normalizeName(n){ return (n||"").trim().replace(/\s+/g," "); }
function canUseName(n){ n = normalizeName(n); return n.length >= 8 && n.length <= 20; }

const nameKey = "lb_name";
let playerName = localStorage.getItem(nameKey) || "";

// --- Convert BigInt points to a Firestore NUMBER (double) safely-ish.
// Firestore stores a double; for huge BigInt we approximate so it still increases.
function bigIntToDoubleApprox(bi){
  if (bi <= 0n) return 0;
  const s = bi.toString();
  if (s.length <= 15) return Number(s); // exact
  // Take first 16 digits and scale by 10^(len-16)
  const lead = s.slice(0, 16);
  const exp = s.length - 16;
  let x = Number(lead) * Math.pow(10, exp);
  // cap to max finite double (approx)
  if (!Number.isFinite(x)) x = Number.MAX_VALUE;
  return x;
}

function getPointsNumber(){
  // score10 is defined in the main game script (BigInt tenths)
  try{
    if (typeof score10 === "bigint") {
      const whole = score10 / 10n; // integer points
      return bigIntToDoubleApprox(whole);
    }
  }catch(e){}
  // fallback: try localStorage key used by game (if you ever change it)
  return 0;
}

function fmtInt(n){
  if (!Number.isFinite(n) || n <= 0) return "0";
  // Use locale formatting when possible
  if (n < 1e21) return Math.floor(n).toLocaleString("en-US");
  // Past this, JS will go scientific no matter what; keep it readable
  return n.toExponential(2).replace("+", "");
}

function scoreCellHtml(sc){
  const txt = fmtInt(sc);
  // shrink font for long strings, and ellipsis if needed
  let px = 12;
  const len = txt.length;
  if (len <= 10) px = 12;
  else if (len <= 14) px = 11;
  else if (len <= 18) px = 10;
  else px = 9;
  return `<div style="min-width:84px; max-width:140px; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:${px}px;">${txt}</div>`;
}

async function joinOrChangeName(){
  if (!lbName) return;
  const gate = (window.__canSubmitLeaderboard ? window.__canSubmitLeaderboard() : {ok:true,msg:""});
  if(!gate.ok){ setMsg(gate.msg); return; }
  const n = normalizeName(lbName.value);

  try{
    const ref = db.collection("leaderboard").doc(deviceId);
    const snap = await ref.get();
    const pts = getPointsNumber();
    const scoreNum = Number.isFinite(pts) ? pts : 0;

    if(!snap.exists){
      if(!canUseName(n)){
        setMsg("Name must be 8–20 characters.");
        return;
      }
      // New join: create doc. Name is locked after this.
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
      // Already joined: only update score (name is locked)
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
  }catch(e){
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

async function saveScore(){
  const gate = (window.__canSubmitLeaderboard ? window.__canSubmitLeaderboard() : {ok:true,msg:""});
  if(!gate.ok){ setMsg(gate.msg); return; }
  if(!playerName){
    setMsg("Join first.");
    return;
  }
  const pts = getPointsNumber();
  try{
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
      if(!snap.exists) throw new Error("Not joined");
      tx.update(ref, {
        score: pts,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    setMsg("Saved score: " + fmtInt(pts));
  }catch(e){
    console.error(e);
    setMsg("Save failed. Check rules.");
  }
}

// Auto-sync game score to Firebase (CHEAP: no reads, throttled)
let lastSyncedScore = 0n;
let lastSyncAtMs = 0;
const LB_MIN_SYNC_INTERVAL_MS = 15000; // 15s
const LB_MIN_DELTA_POINTS = 1n;        // only sync if points changed

function syncScoreToFirebase() {
  if (!playerName) return;
  if (document.hidden) return;

  const now = Date.now();
  if (now - lastSyncAtMs < LB_MIN_SYNC_INTERVAL_MS) return;

  // Access score10 from window or try to get it from the game script
  const currentScore10 =
    window.score10 !== undefined ? window.score10 :
    (typeof score10 !== "undefined" ? score10 : 0n);

  const currentScore = currentScore10 / 10n; // whole points
  if (currentScore <= 0n) return;

  const delta = (currentScore > lastSyncedScore) ? (currentScore - lastSyncedScore) : 0n;
  if (currentScore === lastSyncedScore) return;
  if (delta < LB_MIN_DELTA_POINTS && lastSyncedScore !== 0n) return;

  lastSyncedScore = currentScore;
  lastSyncAtMs = now;

  const pts = bigIntToDoubleApprox(currentScore);
  const ref = db.collection("leaderboard").doc(deviceId);

  // Only update score (name is locked after join; don't overwrite)
  ref.update({
    score: pts,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(e => console.error("Auto-sync failed:", e));
}

// === Weekly reset: zero out local score and remove from leaderboard once per week ===
const WEEK_RESET_KEY = "epstein_weekly_reset_v1";

function getWeekKey(){
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfYear) / 86400000);
  const weekNum = Math.floor(days / 7) + 1;
  return d.getFullYear() + "-W" + weekNum;
}

function performWeeklyResetIfNeeded(){
  try{
    const weekKey = getWeekKey();
    const lastKey = localStorage.getItem(WEEK_RESET_KEY);
    if (lastKey === weekKey) return;

    // Reset local score (keep upgrades/progression)
    try{
      score10 = 0n;
      window.score10 = 0n;
      _writeScore10ToSave(0n);
    }catch(e){}
    try{
      if (typeof autoCarry !== "undefined") autoCarry = 0n;
    }catch(e){}

    try{
      if (typeof save === "function") save();
    }catch(e){}
    try{
      if (typeof fullUpdate === "function") fullUpdate();
      else if (typeof updateTopUI === "function") updateTopUI();
    }catch(e){}

    // Remove this device from leaderboard (score is 0 = not on board)
    try{
      if(typeof db !== "undefined" && typeof deviceId !== "undefined"){
        const ref = db.collection("leaderboard").doc(deviceId);
        ref.get().then(snap => {
          if(snap.exists) ref.delete().catch(e => console.error("Weekly leaderboard delete failed:", e));
        }).catch(e => console.error("Weekly leaderboard check failed:", e));
      }
    } catch(e){
      console.error("Firebase weekly reset error:", e);
    }

    localStorage.setItem(WEEK_RESET_KEY, weekKey);
  }catch(e){
    console.error("performWeeklyResetIfNeeded error:", e);
  }
}

if (joinBtn) joinBtn.addEventListener("click", joinOrChangeName);
if (saveBtn) saveBtn.addEventListener("click", saveScore);
const lbRefreshBtn = document.getElementById("lbRefreshBtn");
if (lbRefreshBtn) lbRefreshBtn.addEventListener("click", function(){ fetchLeaderboard(); setMsg("Refreshed."); });

// Always allow typing in the name field on load. Only lock after we confirm with Firestore that this device has joined.
if (lbName) {
  lbName.disabled = false;
  lbName.removeAttribute("readonly");
}
if (joinBtn) joinBtn.style.display = "";
setMsg("Enter a name (8–20 chars) and click JOIN.");

// Check Firestore: if this device already has a leaderboard doc, then lock name and show SAVE SCORE only
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

// Leaderboard reads:
// - No live listener (onSnapshot) because it can explode reads
// - Fetch full leaderboard on a slow timer
const LB_REFRESH_MS = 60000; // 60s
let lbIntervalId = null;

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

async function fetchLeaderboard(){
  const topTenEl = document.getElementById("lbTopTen");
  const countEl = document.getElementById("lbPlayerCount");
  if (lbList) lbList.innerHTML = "<div class='lbLoading'>Loading…</div>";
  if (topTenEl) topTenEl.innerHTML = "<div class='lbLoading'>Loading…</div>";
  if (countEl) countEl.textContent = "…";
  try{
    const snap = await db.collection("leaderboard").limit(500).get();

    // Build array and filter: only valid entries with score > 0 and a name
    const entries = [];
    snap.forEach((docx) => {
      const d = docx.data() || {};
      const sc = Number(d.score);
      if (sc <= 0 || !Number.isFinite(sc)) return;
      const name = String(d.name || "").trim();
      if (!name) return;
      entries.push({ id: docx.id, name, score: sc });
    });

    // Sort by score descending so highest is first (don't trust Firestore order)
    entries.sort((a, b) => b.score - a.score);

    // Duplicate names: show "Name (2)", "Name (3)" so same-name entries are distinct
    const nameCount = {};
    entries.forEach(function (e) {
      const key = e.name;
      nameCount[key] = (nameCount[key] || 0) + 1;
    });
    const nameUsed = {};
    entries.forEach(function (e) {
      const key = e.name;
      const n = nameCount[key];
      if (n > 1) {
        nameUsed[key] = (nameUsed[key] || 0) + 1;
        e.displayName = e.name + " (" + nameUsed[key] + ")";
      } else {
        e.displayName = e.name;
      }
    });

    let out = "";
    let topTenOut = "";
    const playerCount = entries.length;
    entries.forEach((entry, idx) => {
      const rank = idx + 1;
      const nameEscaped = (entry.displayName || entry.name).replace(/</g,"&lt;").replace(/>/g,"&gt;");
      const isMe = entry.id === deviceId;
      const row = oneRowHtml(rank, nameEscaped, entry.score, isMe);
      out += row;
      if (rank <= 10) topTenOut += row;
    });

    if (lbList) lbList.innerHTML = out || "<div style='opacity:.8'>No scores yet.</div>";
    if (topTenEl) topTenEl.innerHTML = topTenOut || "<div style='opacity:.8'>No scores yet.</div>";
    if (countEl) countEl.textContent = String(playerCount);
  }catch(e){
    console.error("Leaderboard fetch failed:", e);
    if (lbList) lbList.innerHTML = "<div class='lbError'>Leaderboard unavailable. Check your connection or try again.</div>";
    if (topTenEl) topTenEl.innerHTML = "<div class='lbError'>Unavailable</div>";
    if (countEl) countEl.textContent = "0";
    if (typeof fetchLeaderboardRetry === "undefined" || !window._lbRetried) {
      window._lbRetried = true;
      setTimeout(function(){ window._lbRetried = false; fetchLeaderboard(); }, 3000);
    }
  }
}

function startLeaderboardPolling(){
  if (lbIntervalId) return;
  fetchLeaderboard();
  lbIntervalId = setInterval(() => {
    if (document.hidden) return;
    fetchLeaderboard();
  }, LB_REFRESH_MS);
}

function stopLeaderboardPolling(){
  if (!lbIntervalId) return;
  clearInterval(lbIntervalId);
  lbIntervalId = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopLeaderboardPolling();
  else startLeaderboardPolling();
});

// Kick it off after short delay so Firebase is ready
setTimeout(function(){
  applyJoinedState();
  startLeaderboardPolling();
  performWeeklyResetIfNeeded();
  setInterval(performWeeklyResetIfNeeded, 60 * 60 * 1000);
}, 200);
}
// Run when DOM and Firebase scripts are loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLeaderboard);
} else {
  initLeaderboard();
}