/* StudyBonk shared UI: toasts, confetti, scroll reveal, level-up modal. */
(function () {
  "use strict";
  window.SB = window.SB || {};
  const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Toasts ---------- */
  let zone = null;
  function toastZone() {
    if (!zone) {
      zone = document.createElement("div");
      zone.className = "toast-zone";
      zone.setAttribute("aria-live", "polite");
      document.body.appendChild(zone);
    }
    return zone;
  }
  function toast(message, kind) {
    const el = document.createElement("div");
    el.className = "toast toast-" + (kind || "info");
    el.textContent = message;
    toastZone().appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 350);
    }, 3200);
  }

  /* ---------- Confetti ---------- */
  let canvas = null;
  function confetti(durationMs) {
    if (REDUCED) return;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "confetti-canvas";
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ["#4A90E2", "#F5C542", "#2FB47C", "#8A6CF0", "#F28C3B"];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * innerWidth,
      y: -20 - Math.random() * innerHeight * 0.3,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      vy: 2 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      color: colors[(Math.random() * colors.length) | 0],
    }));
    const end = performance.now() + (durationMs || 1600);
    (function frame(now) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of pieces) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (now < end) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(performance.now());
  }

  /* ---------- Level-up modal ---------- */
  function levelUpModal(level, name) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-label="Level up">' +
      '<span class="modal-emoji">🎉</span>' +
      '<h2 style="margin-bottom:.2em">Level ' + level + "!</h2>" +
      '<p class="muted" style="font-size:1.1rem">You are now a <strong>' + name + "</strong></p>" +
      '<p class="small muted">Keep the streak alive — the Bonk is strong with you.</p>' +
      '<button class="btn btn-primary mt-2" data-close>Keep bonking</button>' +
      "</div>";
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("open"));
    const close = () => {
      overlay.classList.remove("open");
      setTimeout(() => overlay.remove(), 300);
    };
    overlay.querySelector("[data-close]").addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    setTimeout(close, 6000);
  }

  /* ---------- Scroll reveal ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const els = document.querySelectorAll(".reveal");
    if (!els.length || REDUCED || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
  });

  window.SB.ui = { toast, confetti, levelUpModal, reducedMotion: REDUCED };

  /* ---------- Nav XP chip (live update) ---------- */
  function renderNavXp() {
    const chip = document.querySelector("[data-nav-xp]");
    if (!chip || !window.SB.gamification) return;
    const s = window.SB.gamification.getStats();
    chip.textContent = "⚡ " + s.xp.toLocaleString() + " XP · Lv " + s.level;
    chip.title = s.levelName + " — " + s.xpToNext + " XP to next level";
  }
  document.addEventListener("DOMContentLoaded", renderNavXp);
  document.addEventListener("sb:xp", renderNavXp);
})();
