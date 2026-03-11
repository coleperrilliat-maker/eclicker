const SAVE_KEY = "epstein_clicker_bigint_owned_v1";

    // score stored in tenths (score10 = score * 10) so +0.1 is visible
    let score10 = 0n;
    // Make score10 globally accessible for Firebase sync
    window.score10 = score10;
    let perClick = 1n;

    // total upgrades purchased (across all types)
    let upgradesOwned = 0n;

    const upgrades = [
      // early game - balanced progression
      { id:"cursor",   name:"Cursor",                cost: 1000n,              add: 10n,               owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 1000n },
      { id:"diddy",    name:"Diddy Factory",         cost: 8000n,             add: 25n,               owned: 0n, scaleNum: 130n, scaleDen: 100n, initialCost: 8000n },
      { id:"mega",     name:"Mega Factory",          cost: 15000n,             add: 50n,               owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 15000n },
      { id:"oil",      name:"Baby Oil Factory",      cost: 40000n,             add: 150n,              owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 40000n },
      { id:"degree",   name:"Epstein Degree",        cost: 80000n,            add: 400n,              owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 80000n },
      { id:"nyc",      name:"NYC Apartment",         cost: 500000n,           add: 2000n,             owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 500000n },
      { id:"mex",      name:"Mexico House",          cost: 3000000n,          add: 15000n,            owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 3000000n },
      { id:"island",   name:"Epstein Island",        cost: 15000000n,          add: 80000n,            owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 15000000n },

      // mid game - steady scaling
      { id:"jet",      name:"Gulfstream Jet",         cost: 80000000n,         add: 400000n,           owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 80000000n },
      { id:"runway",   name:"Private Island Runway",  cost: 500000000n,        add: 2500000n,          owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 500000000n },
      { id:"shell",    name:"Shell Company Empire",   cost: 3000000000n,       add: 15000000n,        owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 3000000000n },
      { id:"offshore", name:"Offshore Money Network", cost: 20000000000n,      add: 100000000n,       owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 20000000000n },
      { id:"media",    name:"Media Control Machine",  cost: 150000000000n,     add: 750000000n,       owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 150000000000n },
      { id:"lobby",    name:"Global Lobbying Force",  cost: 1000000000000n,    add: 5000000000n,      owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 1000000000000n },
      { id:"access",   name:"Shadow Access Pass",     cost: 8000000000000n,    add: 40000000000n,     owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 8000000000000n },
      { id:"grid",     name:"World Influence Grid",   cost: 60000000000000n,   add: 300000000000n,    owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 60000000000000n },
      { id:"protocol", name:"Reality Protocol",       cost: 500000000000000n,  add: 2500000000000n,   owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 500000000000000n },
      { id:"final",    name:"The Untouchable",        cost: 4000000000000000n, add: 20000000000000n,  owned: 0n, scaleNum: 135n, scaleDen: 100n, initialCost: 4000000000000000n },
      
      // late game - much more affordable (reduced costs by ~1000x)
      { id:"cabal",    name:"The Cabal Engine",        cost: 200000000000000n,   add: 1000000000000000n,   owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 200000000000000n },
      { id:"sing",     name:"Singularity Core",        cost: 10000000000000000n,   add: 50000000000000000n,  owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 10000000000000000n },
      { id:"vault",    name:"Black Vault Network",     cost: 500000000000000000n, add: 2500000000000000000n,  owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 500000000000000000n },
      { id:"oracle",   name:"Oracle Array",            cost: 25000000000000000000n, add: 125000000000000000000n, owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 25000000000000000000n },
      { id:"zeit",     name:"Zeit Control",            cost: 1250000000000000000000n, add: 6250000000000000000000n, owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 1250000000000000000000n },
      { id:"rift",     name:"Rift Generator",          cost: 62500000000000000000000n, add: 312500000000000000000000n, owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 62500000000000000000000n },
      { id:"dynasty",  name:"Dynasty Protocol",        cost: 3125000000000000000000000n, add: 15625000000000000000000000n, owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 3125000000000000000000000n },
      { id:"omega",    name:"Omega Directive",         cost: 156250000000000000000000000n, add: 781250000000000000000000000n, owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 156250000000000000000000000n },
      { id:"eclipse",  name:"Eclipse Authority",       cost: 7812500000000000000000000000n, add: 39062500000000000000000000000n, owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 7812500000000000000000000000n },
      { id:"godmode",  name:"Godmode Override",        cost: 390625000000000000000000000000n, add: 1953125000000000000000000000000n, owned: 0n, scaleNum: 125n, scaleDen: 100n, initialCost: 390625000000000000000000000000n }

    ];

    // DOM
    const scoreEl = document.getElementById("score");
    const perClickEl = document.getElementById("perClick");
    const perSecEl = document.getElementById("perSec");
    const upgradeCountEl = document.getElementById("upgradeCount");
    const shopEl = document.getElementById("shop");
    const btn = document.getElementById("clickBtn");
    const resetBtn = document.getElementById("resetBtn");
    
    // Stat tracking
    const STATS_KEY = "epstein_clicker_stats_v1";
    let rawClicks = 0;
    let sessionStartTime = Date.now();
    let totalPlayTime = 0; // in milliseconds
    let firstPlayTime = null;
    
    // Level system (1000 levels based on upgrade costs)
    // Level progression uses cumulative score to make it challenging
    // Based on upgrade cost scaling patterns
    function calculateLevelRequirement(level) {
      if (level <= 1) return 0n;
      if (level > 1000) return calculateLevelRequirement(1000);
      
      // Use upgrade costs as reference points
      // First upgrade starts at 1000, scales by 1.25-1.65
      // We'll create a challenging progression
      const levelNum = BigInt(level);
      
      if (level <= 50) {
        // Early levels: 1000 * level^1.5 (moderate)
        const base = 1000n;
        return base * levelNum * levelNum / 50n;
      } else if (level <= 200) {
        // Mid-early: exponential growth
        const base50 = calculateLevelRequirement(50);
        const excess = levelNum - 50n;
        return base50 + (base50 * excess * excess) / 20n;
      } else if (level <= 500) {
        // Mid levels: more aggressive
        const base200 = calculateLevelRequirement(200);
        const excess = levelNum - 200n;
        return base200 + (base200 * excess * excess * excess) / 1000n;
      } else if (level <= 800) {
        // Late-mid: very aggressive
        const base500 = calculateLevelRequirement(500);
        const excess = levelNum - 500n;
        return base500 + (base500 * excess * excess * excess * excess) / 100000n;
      } else {
        // Final levels: extremely challenging
        const base800 = calculateLevelRequirement(800);
        const excess = levelNum - 800n;
        return base800 + (base800 * excess * excess * excess * excess * excess) / 10000000n;
      }
    }
    
    function getCurrentLevel() {
      // Calculate level based on total score accumulated
      const totalScore = score10 / 10n;
      
      // Find level based on totalScore
      for (let lvl = 1; lvl <= 1000; lvl++) {
        const req = calculateLevelRequirement(lvl + 1);
        if (totalScore < req) {
          return lvl;
        }
      }
      return 1000;
    }
    
    function getNextLevelRequirement(currentLevel) {
      if (currentLevel >= 1000) return 0n;
      return calculateLevelRequirement(currentLevel + 1);
    }
    
    function formatLargeNumber(num) {
      if (num < 1000n) return commaBigInt(num);
      if (num < 1000000n) return commaBigInt(num / 1000n) + "K";
      if (num < 1000000000n) return commaBigInt(num / 1000000n) + "M";
      if (num < 1000000000000n) return commaBigInt(num / 1000000000n) + "B";
      if (num < 1000000000000000n) return commaBigInt(num / 1000000000000n) + "T";
      // For very large numbers, show in quadrillions
      return commaBigInt(num / 1000000000000000n) + "Q";
    }
    
    function getLevelProgress(currentLevel) {
      if (currentLevel >= 1000) return 100;
      const totalScore = score10 / 10n;
      const currentReq = calculateLevelRequirement(currentLevel);
      const nextReq = calculateLevelRequirement(currentLevel + 1);
      const progress = nextReq > currentReq 
        ? Number((totalScore - currentReq) * 100n / (nextReq - currentReq))
        : 0;
      return Math.max(0, Math.min(100, progress));
    }

    // Formatting
    function commaBigInt(x) {
      const s = x.toString();
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function fmtScore10(v10) {
      const neg = v10 < 0n;
      let v = neg ? -v10 : v10;
      const whole = v / 10n;
      const tenth = v % 10n;
      return (neg ? "-" : "") + commaBigInt(whole) + "." + tenth.toString();
    }

    // perSec = perClick/10 => perSec10 (tenths/sec) == perClick
    function fmtPerSec10(perSec10) {
      const whole = perSec10 / 10n;
      const tenth = perSec10 % 10n;
      return commaBigInt(whole) + "." + tenth.toString();
    }

    // Save/Load
    function save() {
      // Keep global reference in sync
      window.score10 = score10;
      
      const upgradeCosts = {};
      const upgradeOwned = {};
      upgrades.forEach(u => {
        upgradeCosts[u.id] = u.cost.toString();
        upgradeOwned[u.id] = u.owned.toString();
      });

      localStorage.setItem(SAVE_KEY, JSON.stringify({
        score10: score10.toString(),
        perClick: perClick.toString(),
        upgradesOwned: upgradesOwned.toString(),
        upgradeCosts,
        upgradeOwned
      }));
      
      // Save stats
      const now = Date.now();
      const sessionTime = now - sessionStartTime;
      const statsData = {
        rawClicks: rawClicks,
        totalPlayTime: totalPlayTime + sessionTime,
        firstPlayTime: firstPlayTime || now,
        lastSessionEnd: now
      };
      localStorage.setItem(STATS_KEY, JSON.stringify(statsData));
    }

    (function load() {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw);
        if (data.score10) {
          score10 = BigInt(data.score10);
          window.score10 = score10; // Update global reference
        }
        if (data.perClick) perClick = BigInt(data.perClick);
        if (data.upgradesOwned) upgradesOwned = BigInt(data.upgradesOwned);

        if (data.upgradeCosts && typeof data.upgradeCosts === "object") {
          upgrades.forEach(u => {
            const c = data.upgradeCosts[u.id];
            if (typeof c === "string") u.cost = BigInt(c);
          });
        }

        if (data.upgradeOwned && typeof data.upgradeOwned === "object") {
          upgrades.forEach(u => {
            const o = data.upgradeOwned[u.id];
            if (typeof o === "string") u.owned = BigInt(o);
          });
        }
      } catch (e) {}
      
      // Load stats
      try {
        const statsRaw = localStorage.getItem(STATS_KEY);
        if (statsRaw) {
          const statsData = JSON.parse(statsRaw);
          rawClicks = statsData.rawClicks || 0;
          totalPlayTime = statsData.totalPlayTime || 0;
          firstPlayTime = statsData.firstPlayTime || Date.now();
          
          // Add time since last session end to total play time
          if (statsData.lastSessionEnd) {
            const timeSinceLastSession = Date.now() - statsData.lastSessionEnd;
            // Cap at reasonable idle time (e.g., 1 hour max per session gap)
            totalPlayTime += Math.min(timeSinceLastSession, 3600000);
          }
        } else {
          firstPlayTime = Date.now();
        }
      } catch (e) {
        firstPlayTime = Date.now();
      }
      sessionStartTime = Date.now();
    })();

    // Floating text
    function spawnFloat(x, y, text) {
      const el = document.createElement("div");
      el.className = "floatText";
      el.textContent = text;
      el.style.left = x + "px";
      el.style.top = y + "px";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 750);
    }

    // Shop UI
    let rendered = false;

    function renderShop() {
      shopEl.innerHTML = "";
      upgrades.forEach(u => {
        const row = document.createElement("div");
        row.className = "row";

        const left = document.createElement("div");
        left.id = "left_" + u.id;

        const b = document.createElement("button");
        b.id = "btn_" + u.id;
        b.textContent = "BUY";
        b.onclick = () => buy(u.id);

        row.appendChild(left);
        row.appendChild(b);
        shopEl.appendChild(row);
      });

      rendered = true;
      refreshShopUI();
    }

    function refreshShopUI() {
      upgrades.forEach(u => {
        const left = document.getElementById("left_" + u.id);
        const b = document.getElementById("btn_" + u.id);
        if (!left || !b) return;

        left.innerHTML =
          `<b>${u.name}</b><br>` +
          `Owned: x${commaBigInt(u.owned)}<br>` +
          `+${commaBigInt(u.add)} per click<br>` +
          `Cost: $${commaBigInt(u.cost)}`;

        b.textContent = "BUY $" + commaBigInt(u.cost);
        b.disabled = score10 < (u.cost * 10n);
      });
    }

    // Top UI
    function updateTopUI() {
      scoreEl.textContent = fmtScore10(score10);
      perClickEl.textContent = commaBigInt(perClick);

      const perSec10 = perClick;
      perSecEl.textContent = fmtPerSec10(perSec10);

      upgradeCountEl.textContent = commaBigInt(upgradesOwned);
    }
    
    // Stat Board UI
    function updateStatBoard() {
      const now = Date.now();
      const sessionTime = now - sessionStartTime;
      const totalTime = totalPlayTime + sessionTime;
      
      // Hours Played
      const hoursPlayed = totalTime / (1000 * 60 * 60);
      const hoursEl = document.getElementById("hoursPlayed");
      if (hoursEl) hoursEl.textContent = hoursPlayed.toFixed(2);
      
      // Session Time
      const hours = Math.floor(sessionTime / 3600000);
      const minutes = Math.floor((sessionTime % 3600000) / 60000);
      const seconds = Math.floor((sessionTime % 60000) / 1000);
      const sessionTimeEl = document.getElementById("sessionTime");
      if (sessionTimeEl) {
        sessionTimeEl.textContent = 
          String(hours).padStart(2, '0') + ":" +
          String(minutes).padStart(2, '0') + ":" +
          String(seconds).padStart(2, '0');
      }
      
      // Raw Clicks
      const rawClicksEl = document.getElementById("rawClicks");
      if (rawClicksEl) rawClicksEl.textContent = commaBigInt(BigInt(rawClicks));
      
      // Per Click
      const statPerClickEl = document.getElementById("statPerClick");
      if (statPerClickEl) statPerClickEl.textContent = commaBigInt(perClick);
      
      // Per Sec
      const statPerSecEl = document.getElementById("statPerSec");
      if (statPerSecEl) {
        const perSec10 = perClick;
        statPerSecEl.textContent = fmtPerSec10(perSec10);
      }
      
      // Level
      const currentLevel = getCurrentLevel();
      const currentLevelEl = document.getElementById("currentLevel");
      if (currentLevelEl) currentLevelEl.textContent = currentLevel;
      
      // Next Level
      const nextLevelReq = getNextLevelRequirement(currentLevel);
      const nextLevelEl = document.getElementById("nextLevel");
      if (nextLevelEl) {
        if (currentLevel >= 1000) {
          nextLevelEl.textContent = "MAX";
        } else {
          nextLevelEl.textContent = formatLargeNumber(nextLevelReq);
        }
      }
      
      // Level Progress
      const progress = getLevelProgress(currentLevel);
      const progressEl = document.getElementById("levelProgress");
      if (progressEl) progressEl.textContent = progress.toFixed(1) + "%";
      
      // Progress Bar
      const progressBar = document.getElementById("progressBar");
      if (progressBar) {
        progressBar.style.width = progress + "%";
      }
      
      // Clicks per minute (stats page only)
      const clicksPerMinEl = document.getElementById("clicksPerMin");
      if (clicksPerMinEl) {
        const mins = sessionTime / 60000;
        const cpm = mins > 0 ? (rawClicks / mins).toFixed(1) : "0";
        clicksPerMinEl.textContent = cpm;
      }
      
      // Total upgrades (stats page only)
      const totalUpgradesStatEl = document.getElementById("totalUpgradesStat");
      if (totalUpgradesStatEl) totalUpgradesStatEl.textContent = commaBigInt(upgradesOwned);
      
      // Upgrade breakdown (stats page only)
      const breakdownEl = document.getElementById("upgradeBreakdown");
      if (breakdownEl && typeof upgrades !== "undefined") {
        const rows = upgrades
          .filter(u => u.owned > 0n)
          .map(u => {
            const name = u.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return `<div class="statRow retroRow"><div class="statLabel"><span class="retroBullet">></span><span>${name}</span></div><div class="statValue retroGreen">x${commaBigInt(u.owned)}</div></div>`;
          });
        breakdownEl.innerHTML = rows.length ? rows.join("") : "<div class=\"statRow retroRow\"><div class=\"statLabel\"><span class=\"retroBullet\">></span><span>NONE YET</span></div><div class=\"statValue\">—</div></div>";
      }
    }

    function fullUpdate() {
      updateTopUI();
      updateStatBoard();
      if (!rendered) renderShop();
      else refreshShopUI();
      save();
    }

    // Buying
    function buy(id) {
      const u = upgrades.find(x => x.id === id);
      if (!u) return;

      const cost10 = u.cost * 10n;
      if (score10 < cost10) return;

      score10 -= cost10;
      window.score10 = score10; // Update global reference
      perClick += u.add;

      upgradesOwned += 1n;
      u.owned += 1n;

      u.cost = (u.cost * u.scaleNum) / u.scaleDen;

      fullUpdate();
    }


    /* ===== Idle + Anti-cheat (client-side) ===== */
    window.__gamePaused = false;
    window.__pauseReason = "";

    window.__cheatFlag = false;
    window.__cheatReason = "";

    window.__flagCheat = function(reason){
      // Always set the flag and reason (don't return early - allow repeated detection)
      window.__cheatFlag = true;
      window.__cheatReason = String(reason || "suspicious activity");
      
      // Reset suspicion score and timer so it can detect again if they continue cheating
      if(typeof __suspicionScore !== "undefined") {
        __suspicionScore = 0;
      }
      if(typeof __suspiciousBehaviorStartTime !== "undefined") {
        __suspiciousBehaviorStartTime = null;
      }
      
      // Log for debugging
      console.warn("Anti-cheat triggered:", reason);
      
      // Penalty: reset EVERYTHING if cheating is detected (works repeatedly)
      try{
        // Reset score
        if(typeof score10 !== "undefined") {
          score10 = 0n;
          window.score10 = 0n;
        }
        if(typeof autoCarry !== "undefined") autoCarry = 0n;
        
        // Reset ALL upgrades to 0 and reset their costs
        if(typeof upgrades !== "undefined" && Array.isArray(upgrades)) {
          upgrades.forEach(u => {
            u.owned = 0n;
            // Reset cost to initial value using initialCost property
            if(u.initialCost !== undefined) {
              u.cost = u.initialCost;
            }
          });
        }
        
        // Reset upgrades owned count
        if(typeof upgradesOwned !== "undefined") {
          upgradesOwned = 0n;
        }
        
        // Reset per-click to base value
        if(typeof perClick !== "undefined") {
          perClick = 10n; // base value
        }
        
        // Reset leaderboard score in Firebase
        try {
          if(typeof db !== "undefined" && typeof deviceId !== "undefined") {
            const ref = db.collection("leaderboard").doc(deviceId);
            ref.get().then(snap => {
              if(snap.exists) {
                ref.update({
                  score: 0,
                  updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(e => console.error("Leaderboard reset failed:", e));
              }
            }).catch(e => console.error("Leaderboard reset check failed:", e));
          }
        } catch(e) {
          console.error("Firebase reset error:", e);
        }
        
        // Clear localStorage to prevent cheating via save manipulation
        try {
          localStorage.removeItem(SAVE_KEY);
          localStorage.removeItem(STATS_KEY);
        } catch(e) {}
        
        // Update UI
        if(typeof fullUpdate === "function") fullUpdate();
        
        // Show big popup (will show each time cheating is detected)
        const cheatOverlay = document.getElementById("cheatOverlay");
        if(cheatOverlay) {
          cheatOverlay.style.display = "flex";
        }
      }catch(e){
        console.error("Cheat reset error:", e);
      }
      try{
        const s = document.getElementById("score");
        if(s) s.style.textShadow = "0 0 12px rgba(255,59,48,.65)";
      }catch(e){}
    };

    function __setPaused(p, reason){
      window.__gamePaused = !!p;
      window.__pauseReason = String(reason || (p ? "paused" : ""));
      const ov = document.getElementById("idleOverlay");
      if(ov){
        ov.style.display = window.__gamePaused ? "flex" : "none";
      }
    }

    const __IDLE_MS = 20 * 60 * 1000;
    let __lastActive = Date.now();

    window.__noteActivity = function(){
      __lastActive = Date.now();
    };

    function __idleTick(){
      const now = Date.now();
      const idleFor = now - __lastActive;
      if(idleFor >= __IDLE_MS && !window.__gamePaused){
        __setPaused(true, "inactive 20 minutes");
      }
    }

    ["pointerdown","mousedown","keydown","touchstart"].forEach(ev=>{
      window.addEventListener(ev, (e)=>{
        if(e && e.isTrusted) window.__noteActivity();
      }, {passive:true});
    });

    document.addEventListener("visibilitychange", ()=>{
      if(document.hidden){
        __setPaused(true, "tab hidden");
      }
    });

    setInterval(__idleTick, 1000);

    (function(){
      const b = document.getElementById("idleResumeBtn");
      if(b){
        b.addEventListener("click", (e)=>{
          if(e && e.isTrusted){
            window.__noteActivity();
            __setPaused(false, "");
          }
        });
      }
    })();

    // Cheat acknowledge button handler
    (function(){
      const b = document.getElementById("cheatAcknowledgeBtn");
      if(b){
        b.addEventListener("click", (e)=>{
          if(e && e.isTrusted){
            const cheatOverlay = document.getElementById("cheatOverlay");
            if(cheatOverlay) {
              cheatOverlay.style.display = "none";
            }
          }
        });
      }
    })();

    // Enhanced anti-cheat tracking
    let __clickTimes = [];
    let __clickPositions = [];
    let __clickIntervals = [];
    let __mouseMovements = [];
    let __lastClickTime = 0;
    let __lastMouseMove = Date.now();
    let __suspicionScore = 0;
    let __suspiciousBehaviorStartTime = null; // Track when suspicious behavior started
    const __REQUIRED_SUSPICIOUS_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Track mouse movement
    document.addEventListener("mousemove", (e) => {
      if (e && e.isTrusted) {
        __lastMouseMove = Date.now();
        __mouseMovements.push({
          time: Date.now(),
          x: e.clientX,
          y: e.clientY
        });
        // Keep only last 50 movements
        if (__mouseMovements.length > 50) __mouseMovements.shift();
      }
    }, {passive: true});
    
    window.__noteTrustedClick = function(x, y){
      const t = performance.now();
      const now = Date.now();
      
      // Store click data
      __clickTimes.push(t);
      if (x !== undefined && y !== undefined) {
        __clickPositions.push({x, y, time: t});
      }
      
      // Calculate interval since last click
      if (__lastClickTime > 0) {
        const interval = t - __lastClickTime;
        __clickIntervals.push(interval);
        if (__clickIntervals.length > 100) __clickIntervals.shift();
      }
      __lastClickTime = t;
      
      // Clean old data (keep last 5 minutes for analysis)
      const cutoff = t - (5 * 60 * 1000);
      while(__clickTimes.length && __clickTimes[0] < cutoff) __clickTimes.shift();
      while(__clickPositions.length && __clickPositions[0].time < cutoff) __clickPositions.shift();
      while(__clickIntervals.length > 500) __clickIntervals.shift();

      // Check for sustained suspicious behavior over 5+ minutes
      let isCurrentlySuspicious = false;
      let suspiciousReasons = [];

      // Detection 1: Click rate (much higher threshold - need sustained high rate)
      const cutoff2 = t - 10000; // Check last 10 seconds
      let recent2 = 0;
      for(const x of __clickTimes) if(x >= cutoff2) recent2++;
      const cps = recent2 / 10; // clicks per second over 10 second window

      // Only suspicious if consistently above 25 clicks/sec for extended period
      if(cps > 25){
        isCurrentlySuspicious = true;
        suspiciousReasons.push("high click rate: " + cps.toFixed(1) + "/sec");
      }

      // Detection 2: Perfect timing patterns (require more samples and stricter criteria)
      if(__clickIntervals.length >= 200){ // Need 200+ intervals (much more data)
        const recent = __clickIntervals.slice(-200); // Analyze last 200 clicks
        const avg = recent.reduce((a,b)=>a+b,0) / recent.length;
        const variance = recent.reduce((a,b)=>a+Math.pow(b-avg,2),0) / recent.length;
        const std = Math.sqrt(variance);
        const cv = std / avg; // Coefficient of variation
        
        // Much stricter: CV < 0.02 (less than 2% variation) AND very fast clicking
        if(avg < 100 && cv < 0.02 && avg > 0){
          isCurrentlySuspicious = true;
          suspiciousReasons.push("machine-like timing (CV: " + cv.toFixed(4) + ")");
        }
        
        // Detection 3: Too consistent intervals (extremely strict)
        if(avg < 150 && std < 0.5 && avg > 0){ // std < 0.5ms is extremely consistent
          isCurrentlySuspicious = true;
          suspiciousReasons.push("perfect timing consistency");
        }
      }

      // Detection 4: Click position analysis (require more samples)
      if(__clickPositions.length >= 100){ // Need 100+ position samples
        const recent = __clickPositions.slice(-100);
        const xs = recent.map(p => p.x);
        const ys = recent.map(p => p.y);
        
        const avgX = xs.reduce((a,b)=>a+b,0) / xs.length;
        const avgY = ys.reduce((a,b)=>a+b,0) / ys.length;
        
        const varianceX = xs.reduce((a,b)=>a+Math.pow(b-avgX,2),0) / xs.length;
        const varianceY = ys.reduce((a,b)=>a+Math.pow(b-avgY,2),0) / ys.length;
        const stdX = Math.sqrt(varianceX);
        const stdY = Math.sqrt(varianceY);
        
        // Much stricter: clicks within 1 pixel (extremely precise)
        if(stdX < 1 && stdY < 1){
          isCurrentlySuspicious = true;
          suspiciousReasons.push("identical click positions");
        }
      }

      // Detection 5: No mouse movement (require much longer period)
      const timeSinceMouseMove = now - __lastMouseMove;
      if(__clickTimes.length >= 500 && timeSinceMouseMove > 300000){ // 5 minutes of no movement
        isCurrentlySuspicious = true;
        suspiciousReasons.push("no mouse movement for 5+ minutes");
      }

      // Detection 6: Human timing patterns (require more identical intervals)
      if(__clickIntervals.length >= 300){
        const recent = __clickIntervals.slice(-300);
        let identicalCount = 0;
        for(let i = 1; i < recent.length; i++){
          if(Math.abs(recent[i] - recent[i-1]) < 0.5) identicalCount++; // Within 0.5ms
        }
        // Require 80%+ identical (extremely consistent)
        if(identicalCount > recent.length * 0.8){
          isCurrentlySuspicious = true;
          suspiciousReasons.push("unnatural timing consistency");
        }
      }

      // Check if suspicious behavior is sustained
      if(isCurrentlySuspicious){
        // Start tracking suspicious behavior time
        if(__suspiciousBehaviorStartTime === null){
          __suspiciousBehaviorStartTime = now;
        }
        
        // Check if suspicious behavior has been sustained for 5+ minutes
        const suspiciousDuration = now - __suspiciousBehaviorStartTime;
        if(suspiciousDuration >= __REQUIRED_SUSPICIOUS_TIME){
          // They've been suspicious for 5+ minutes straight - flag as cheating
          const reason = suspiciousReasons.join(", ");
          window.__flagCheat("sustained suspicious behavior for " + Math.floor(suspiciousDuration/1000) + " seconds: " + reason);
          return;
        }
      } else {
        // Not currently suspicious - reset the timer
        __suspiciousBehaviorStartTime = null;
      }

      // Gradually reduce suspicion score over time (if not currently suspicious)
      if(__suspicionScore > 0 && !isCurrentlySuspicious) {
        __suspicionScore = Math.max(0, __suspicionScore - 0.2);
      }
    };

    window.__canSubmitLeaderboard = function(){
      if(window.__gamePaused) return {ok:false, msg:"Paused: click I'M BACK to resume."};
      if(window.__cheatFlag) return {ok:false, msg:"Anti-cheat: " + (window.__cheatReason || "flagged")};
      if(document.hidden) return {ok:false, msg:"Anti-cheat: tab must be visible."};
      
      // Additional checks
      if(__suspicionScore >= 8) {
        return {ok:false, msg:"Anti-cheat: suspicious activity detected"};
      }
      
      // Check for automation tools
      if(navigator.webdriver === true){
        return {ok:false, msg:"Anti-cheat: automation detected"};
      }
      
      return {ok:true, msg:""};
    };
    
    // Periodic check for automation indicators
    setInterval(() => {
      // Check for common automation indicators
      if(navigator.webdriver === true){
        window.__flagCheat("webdriver automation detected");
      }
      
      // Check for headless browser indicators
      if(navigator.plugins.length === 0 && navigator.languages.length === 0){
        __suspicionScore += 2;
      }
      
      // Check if window properties are missing (some automation tools)
      if(!window.chrome && !window.safari && navigator.userAgent.includes("Headless")){
        window.__flagCheat("headless browser detected");
      }
    }, 5000);


    // Clicking with enhanced validation (stopPropagation so ad scripts don't redirect on game click)
    btn.addEventListener("click", (e) => {
      if(e) { e.stopPropagation(); e.stopImmediatePropagation(); }
      if(window.__gamePaused) return;
      if(!e || !e.isTrusted){ window.__flagCheat("scripted click"); return; }

      // Additional checks for synthetic events
      if(e.detail === 0 && e.isTrusted === false){
        window.__flagCheat("synthetic click event");
        return;
      }

      // Check for missing mouse properties (some auto-clickers don't set these)
      if(e.type === "click" && (e.clientX === undefined || e.clientY === undefined)){
        window.__flagCheat("invalid click event");
        return;
      }

      // Check for programmatic clicks (no user interaction)
      if(e.detail === 0 && !e.isTrusted){
        window.__flagCheat("programmatic click");
        return;
      }

      // Validate event has proper mouse coordinates
      const rect = btn.getBoundingClientRect();
      if(e.clientX < rect.left || e.clientX > rect.right || 
         e.clientY < rect.top || e.clientY > rect.bottom){
        // Click outside button bounds but still triggered - suspicious
        __suspicionScore += 2;
      }

      window.__noteActivity();
      window.__noteTrustedClick(e.clientX, e.clientY);

      rawClicks++;
      if (rawClicks === 1000 && typeof window.ecShowDiscordPopupAt1000 === "function") window.ecShowDiscordPopupAt1000();
      score10 += perClick * 10n;
      window.score10 = score10; // Update global reference
      spawnFloat(e.clientX, e.clientY, "+" + commaBigInt(perClick));
      fullUpdate();
    }, {capture: true});
    
    // Also listen on mousedown for better detection (stop propagation so ads don't redirect)
    btn.addEventListener("mousedown", (e) => {
      if(e) { e.stopPropagation(); e.stopImmediatePropagation(); }
      if(!e || !e.isTrusted) return;
      // Track mouse down events for pattern analysis
      window.__noteActivity();
    }, {capture: true});

    // Auto: exact rule auto/sec = perClick/10
    const TICKS_PER_SEC = 20n;
    let autoCarry = 0n;

    setInterval(() => {
      if(window.__gamePaused || document.hidden) return;
      autoCarry += perClick; // perSec10
      const addNow = autoCarry / TICKS_PER_SEC; // tenths to add now
      autoCarry = autoCarry % TICKS_PER_SEC;

      if (addNow > 0n) {
        score10 += addNow;
        window.score10 = score10; // Update global reference
      }
      updateTopUI();
      updateStatBoard();
    }, 50);

    // Floating auto animation once per second (no button movement)
    setInterval(() => {
      if(window.__gamePaused || document.hidden) return;
      const perSec10 = perClick;
      const r = btn.getBoundingClientRect();
      spawnFloat(r.left + r.width / 2, r.top + 18, "+" + fmtPerSec10(perSec10));
    }, 1000);

    // Refresh shop buttons + save (no leaderboard auto-sync; use SAVE SCORE button)
    setInterval(() => {
      if (rendered) refreshShopUI();
      save();
    }, 500);

    // Reset
    resetBtn.addEventListener("click", () => {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(STATS_KEY);
      location.reload();
    });

    // Init
    fullUpdate();
// Keep ticker score live + constant
  (function(){
    function syncTicker(){
      const scoreEl = document.getElementById('score');
      if(!scoreEl) return;
      const v = (scoreEl.textContent || '0');
      document.querySelectorAll('.tickerScore').forEach(el=>{ el.textContent = v; });
    }
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){
        syncTicker();
        setInterval(syncTicker, 200);
      });
    } else {
      syncTicker();
      setInterval(syncTicker, 200);
    }
  })();
/* ===== No abbreviations + auto-fit score text ===== */
(function(){
  const scoreEl = document.getElementById("score");
  if(!scoreEl) return;

  function fit(){
    const t = (scoreEl.textContent || "").trim();
    const len = t.length;

    // Default is whatever CSS sets; we override to keep it fitting.
    let px = 18;
    if (len <= 10) px = 18;
    else if (len <= 14) px = 16;
    else if (len <= 18) px = 14;
    else if (len <= 22) px = 12;
    else px = 10;

    scoreEl.style.fontSize = px + "px";
  }

  // Run often (cheap) because score updates fast
  setInterval(fit, 150);
  fit();
})();