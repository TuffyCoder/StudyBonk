/* StudyBonk theme: light/dark with localStorage persistence.
 * Defaults to the OS preference on first visit. */
(function () {
  "use strict";
  const KEY = "theme";
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#1A1A1A" : "#4A90E2");
  }

  const saved = (() => {
    try { return localStorage.getItem("sb." + KEY); } catch { return null; }
  })();
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  apply(saved === "light" || saved === "dark" ? saved : prefersDark ? "dark" : "light");

  // Apply before paint on future loads (inline snippet in <head> handles
  // first paint; this guards dynamic navigation).
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector("[data-theme-toggle]");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("sb." + KEY, next); } catch {}
      document.dispatchEvent(new CustomEvent("sb:theme", { detail: { theme: next } }));
    });
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("sb." + KEY)) apply(e.matches ? "dark" : "light");
      });
    }
  });
})();
