(function () {
  var KEY_FIRST_VISIT = "ec_discord_first_visit_shown";
  var KEY_1000_CLICKS = "ec_discord_1000_shown";

  var overlay = document.getElementById("discordOverlay");
  var closeHint = overlay && overlay.querySelector(".discordCloseHint");

  var currentReason = null;

  function hide() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    if (currentReason === "first_visit") localStorage.setItem(KEY_FIRST_VISIT, "1");
    if (currentReason === "1000_clicks") localStorage.setItem(KEY_1000_CLICKS, "1");
    currentReason = null;
  }

  function show(reason) {
    if (!overlay) return;
    currentReason = reason;
    overlay.classList.add("is-open");
  }

  if (closeHint) closeHint.addEventListener("click", hide);
  if (overlay) overlay.addEventListener("click", function (e) { if (e.target === overlay) hide(); });

  function onLoad() {
    var isHome = window.location.pathname === "" || window.location.pathname === "/" || /index\.html$/i.test(window.location.pathname);
    if (isHome && !localStorage.getItem(KEY_FIRST_VISIT)) show("first_visit");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onLoad);
  } else {
    onLoad();
  }

  window.ecShowDiscordPopupAt1000 = function () {
    if (localStorage.getItem(KEY_1000_CLICKS)) return;
    show("1000_clicks");
  };
})();
