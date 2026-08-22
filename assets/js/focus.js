/* StudyBonk pomodoro focus timer: 25/5/15 cycles with a hyped mascot,
 * XP rewards, persisted settings and session stats. */
(function () {
  "use strict";
  const mount = document.getElementById("focus-app");
  if (!mount || !window.SB) return;
  const S = window.SB.storage;
  const G = window.SB.gamification;

  const settings = Object.assign(
    { focus: 25, short: 5, long: 15 },
    S.get("focusSettings", {})
  );

  let mode = "focus"; // focus | short | long
  let remaining = settings.focus * 60;
  let running = false;
  let completedFocus = 0; // this cycle chain
  let timerId = null;
  const CIRC = 2 * Math.PI * 124; // dial circumference

  const $ = (id) => document.getElementById(id);

  function fmt(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function paint() {
    $("timer-time").textContent = fmt(remaining);
    $("timer-mode").textContent = mode === "focus" ? "Focus" : mode === "short" ? "Short break" : "Long break";
    const total = (mode === "focus" ? settings.focus : mode === "short" ? settings.short : settings.long) * 60;
    $("dial-fg").style.strokeDashoffset = String(CIRC * (1 - remaining / total));
    $("dial-fg").style.stroke = mode === "focus" ? "var(--blue)" : "var(--green)";
    $("timer-dial").classList.toggle("break", mode !== "focus");
    $("timer-mascot").classList.toggle("hyped", running);
    $("timer-toggle").textContent = running ? "Pause" : mode === "focus" && remaining === settings.focus * 60 ? "Start focus" : "Resume";
    const dayKey = new Date().toISOString().slice(0, 10);
    const stats = S.get("focusStats", {});
    const today = stats[dayKey] || 0;
    $("timer-stats").textContent =
      "Sessions completed today: " + today + " · Cycle: " + completedFocus + "/4 until long break";
    document.title = running ? fmt(remaining) + " · StudyBonk Focus" : "Focus Timer — StudyBonk";
  }

  function tick() {
    remaining -= 1;
    if (remaining <= 0) {
      chime();
      complete();
    } else {
      paint();
    }
  }

  function complete() {
    running = false;
    clearInterval(timerId);
    if (mode === "focus") {
      completedFocus += 1;
      const dayKey = new Date().toISOString().slice(0, 10);
      const stats = S.get("focusStats", {});
      stats[dayKey] = (stats[dayKey] || 0) + 1;
      S.set("focusStats", stats);
      const xp = G.award("focus_session");
      window.SB.ui.confetti(1500);
      window.SB.ui.toast("🎉 Focus session complete! +" + xp + " XP", "good");
      mode = completedFocus % 4 === 0 ? "long" : "short";
    } else {
      window.SB.ui.toast("☕ Break's over — back to it!", "info");
      mode = "focus";
    }
    remaining = (mode === "focus" ? settings.focus : mode === "short" ? settings.short : settings.long) * 60;
    paint();
  }

  function chime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = f;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + i * 0.18 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.55);
      });
    } catch { /* audio blocked — silent is fine */ }
  }

  $("timer-toggle").addEventListener("click", () => {
    running = !running;
    if (running) {
      timerId = setInterval(tick, 1000);
      if (remaining === settings.focus * 60) window.SB.ui.toast("🧠 25 minutes. Just start. Bonk!", "info");
    } else {
      clearInterval(timerId);
    }
    paint();
  });

  $("timer-reset").addEventListener("click", () => {
    running = false;
    clearInterval(timerId);
    mode = "focus";
    remaining = settings.focus * 60;
    paint();
  });

  $("timer-settings").addEventListener("click", () => {
    const focus = prompt("Focus minutes (5–90):", settings.focus);
    if (focus === null) return;
    const short = prompt("Short break minutes (1–30):", settings.short);
    if (short === null) return;
    const long = prompt("Long break minutes (5–45):", settings.long);
    if (long === null) return;
    const clamp = (v, lo, hi, d) => { const n = +v; return isNaN(n) ? d : Math.min(hi, Math.max(lo, n)); };
    settings.focus = clamp(focus, 5, 90, 25);
    settings.short = clamp(short, 1, 30, 5);
    settings.long = clamp(long, 5, 45, 15);
    S.set("focusSettings", settings);
    if (!running) { mode = "focus"; remaining = settings.focus * 60; }
    paint();
    window.SB.ui.toast("⚙️ Timer updated — saved locally", "good");
  });

  paint();
})();
