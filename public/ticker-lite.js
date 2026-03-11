(function(){
  const SAVE_KEY = "epstein_clicker_bigint_owned_v1";
  function getScore(){
    try{
      const raw = localStorage.getItem(SAVE_KEY);
      if(!raw) return 0n;
      const data = JSON.parse(raw);
      if(!data || !data.score10) return 0n;
      return BigInt(data.score10) / 10n;
    }catch(e){ return 0n; }
  }
  function tick(){
    const s = getScore().toString();
    var nodes = document.querySelectorAll && document.querySelectorAll(".tickerScore");
    if (nodes && nodes.length) nodes.forEach(function(el){ el.textContent = s; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick);
  else tick();
  setInterval(tick, 1000);
})();