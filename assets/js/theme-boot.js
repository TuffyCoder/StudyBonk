/* StudyBonk boot snippet: applies saved theme before first paint, derives
 * the site base path (GitHub Pages subpath safe) and registers the service
 * worker. Loaded synchronously in <head> (tiny, no dependencies). */
(function () {
  "use strict";
  var base = "/";
  try {
    if (document.currentScript && document.currentScript.src) {
      base = new URL(document.currentScript.src).pathname.replace(/assets\/js\/theme-boot\.js.*$/, "");
    }
  } catch (e) { /* fall back to "/" */ }
  window.SB_BASE = base;
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
      navigator.serviceWorker.register(base + "sw.js").catch(function () {
        /* offline support unavailable — site still works fine online */
      });
    });
  }
})();
