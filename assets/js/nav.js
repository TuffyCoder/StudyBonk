/* StudyBonk navigation: mobile drawer, active link, XP chip sync. */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".nav-burger");
    const links = document.querySelector(".nav-links");
    if (burger && links) {
      burger.addEventListener("click", () => {
        const open = links.classList.toggle("open");
        burger.setAttribute("aria-expanded", String(open));
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      document.addEventListener("click", (e) => {
        if (links.classList.contains("open") && !links.contains(e.target) && !burger.contains(e.target)) {
          links.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && links.classList.contains("open")) {
          links.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        }
      });
    }
    // Highlight current page
    const here = location.pathname.replace(/index\.html$/, "");
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href && href !== "/" && (here === href || here.startsWith(href))) {
        a.setAttribute("aria-current", "page");
      }
    });
  });
})();
