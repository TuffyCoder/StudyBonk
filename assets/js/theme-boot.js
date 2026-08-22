/* StudyBonk boot snippet: applies saved theme before first paint and
 * registers the service worker for offline support. Loaded synchronously
 * in <head> (tiny, no dependencies). */
(function () {
  "use strict";
  try {
    var t = localStorage.getItem("sb.theme");
    if (t !== "light" && t !== "dark") {
      t = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", t);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js").catch(function () {
        /* offline support unavailable — site still works fine online */
      });
    });
  }
})();
