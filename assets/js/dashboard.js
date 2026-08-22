/* StudyBonk dashboard: renders local gamification state — XP ring, level,
 * streak, quests, badges, heatmap, export/import/reset. */
(function () {
  "use strict";
  const mount = document.getElementById("dashboard-app");
  if (!mount || !window.SB) return;
  const S = window.SB.storage;
  const G = window.SB.gamification;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  const stats = G.getStats();

  /* ---------- top row: XP ring + streak + quick stats ---------- */
  const ringC = 2 * Math.PI * 55;
  const ringOffset = ringC * (1 - stats.levelProgress / 100);

  const questList = stats.quests.list.map((q) => {
    const pct = Math.round((q.progress / q.target) * 100);
    return (
      '<div class="quest ' + (q.done ? "done" : "") + '">' +
      '<div class="quest-icon">' + q.icon + "</div>" +
      '<div class="quest-info"><strong>' + esc(q.label) + "</strong>" +
      '<div class="level-bar"><div style="width:' + pct + '%"></div></div>' +
      '<span class="quest-meta">' + q.progress + "/" + q.target + (q.done ? " · ✓ done (+" + q.reward + " XP)" : " · reward: " + q.reward + " XP") + "</span></div></div>"
    );
  }).join("");

  const weekPct = Math.min(100, Math.round((stats.weekly.xp / stats.weekly.target) * 100));
  const weeklyHtml =
    '<div class="quest ' + (stats.weekly.done ? "done" : "") + '">' +
    '<div class="quest-icon">🏅</div><div class="quest-info"><strong>Weekly quest: earn ' + stats.weekly.target + " XP</strong>" +
    '<div class="level-bar"><div style="width:' + weekPct + '%"></div></div>' +
    '<span class="quest-meta">' + stats.weekly.xp + "/" + stats.weekly.target + " · reward: " + stats.weekly.reward + " XP" + (stats.weekly.done ? " · ✓" : "") + "</span></div></div>";

  /* ---------- badges ---------- */
  const badges = Object.entries(G.BADGES).map(([id, b]) => {
    const earned = stats.badges[id];
    return (
      '<div class="badge-tile ' + (earned ? "" : "locked") + '" title="' + esc(b.desc) + '">' +
      '<span class="badge-emoji">' + b.emoji + "</span><strong>" + esc(b.name) + "</strong>" +
      "<span>" + (earned ? "Earned " + earned : esc(b.desc)) + "</span></div>"
    );
  }).join("");

  /* ---------- heatmap: last 12 weeks ---------- */
  function heatCells() {
    const cells = [];
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 83); // 12 weeks
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // align Monday
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      const xp = stats.activity[key] || 0;
      const level = xp === 0 ? 0 : xp < 50 ? 1 : xp < 150 ? 2 : xp < 300 ? 3 : 4;
      cells.push('<div class="heatmap-cell" data-level="' + level + '" title="' + key + ": " + xp + ' XP"></div>');
    }
    return cells.join("");
  }

  const totalCards = stats.counters.cards_total || 0;

  mount.innerHTML =
    '<div class="grid grid-3 mb-3">' +
    /* XP ring */
    '<div class="card text-center"><div class="xp-ring">' +
    '<svg viewBox="0 0 130 130" width="130" height="130" aria-hidden="true">' +
    '<circle class="ring-bg" cx="65" cy="65" r="55"></circle>' +
    '<circle class="ring-fg" cx="65" cy="65" r="55" stroke-dasharray="' + ringC + '" stroke-dashoffset="' + ringOffset + '"></circle></svg>' +
    '<div class="ring-label"><strong>' + stats.xp.toLocaleString() + "</strong><span>total XP</span></div></div>" +
    "<h3 style='margin-top:1rem'>" + esc(stats.levelName) + "</h3>" +
    "<p class='muted mb-0'>Level " + stats.level + " · " + (stats.xpToNext > 0 ? stats.xpToNext + " XP to next level" : "max level — legend status") + "</p></div>" +
    /* streak */
    '<div class="card text-center">' +
    '<div style="font-size:3.4rem" class="' + (stats.streak.current > 0 ? "streak-flame lit" : "") + '">🔥</div>' +
    "<h3 style='margin-top:.4rem'>" + stats.streak.current + "-day streak</h3>" +
    "<p class='muted'>Best: " + stats.streak.best + " days · 🧊 Freezes: " + stats.streak.freezes + "</p>" +
    '<p class="small muted mb-0">Study anything today to keep the flame alive.</p></div>' +
    /* totals */
    '<div class="card"><h3 class="mt-0">All-time bonks</h3><div class="stat-row" style="grid-template-columns:1fr 1fr">' +
    '<div class="stat-box"><strong>' + totalCards + "</strong><span>cards</span></div>" +
    '<div class="stat-box"><strong>' + (stats.counters.perfect_quizzes || 0) + "</strong><span>perfect quizzes</span></div>" +
    '<div class="stat-box"><strong>' + (stats.counters.focus_total || 0) + "</strong><span>focus sessions</span></div>" +
    '<div class="stat-box"><strong>' + Object.keys(stats.badges).length + "/" + Object.keys(G.BADGES).length + "</strong><span>badges</span></div>" +
    "</div></div></div>" +
    /* quests */
    '<div class="grid grid-2 mb-3"><div class="card"><h2 class="mt-0" style="font-size:1.3rem">🎯 Today\'s quests</h2><div class="quest-list">' +
    questList + weeklyHtml + "</div>" +
    '<div class="btn-row mt-3"><a class="btn btn-primary btn-sm" href="/flashcards/">Flashcards</a>' +
    '<a class="btn btn-ghost btn-sm" href="/quiz/">Quiz</a>' +
    '<a class="btn btn-ghost btn-sm" href="/focus/">Focus</a></div></div>' +
    /* heatmap */
    '<div class="card"><h2 class="mt-0" style="font-size:1.3rem">📅 Last 12 weeks</h2>' +
    '<div class="heatmap">' + heatCells() + "</div>" +
    '<p class="small muted mt-2 mb-0">Each square is a day — darker means more XP. Consistency compounds.</p></div></div>' +
    /* badges */
    '<div class="card"><h2 style="font-size:1.3rem">🏅 Badges</h2><div class="badge-grid">' + badges + "</div></div>" +
    /* data controls */
    '<div class="card card-glass mt-3"><h3>💾 Your data, your device</h3>' +
    "<p class='muted'>Everything above lives in this browser's local storage. Export it to move devices, or reset to start fresh. Nothing was ever uploaded.</p>" +
    '<div class="btn-row">' +
    '<button class="btn btn-ghost btn-sm" id="export-all">📤 Export progress</button>' +
    '<button class="btn btn-ghost btn-sm" id="import-all">📥 Import progress</button>' +
    '<button class="btn btn-ghost btn-sm" id="reset-all" style="border-color:var(--red);color:var(--red)">🗑️ Reset everything</button>' +
    "</div></div>";

  document.getElementById("export-all").onclick = () => {
    const blob = new Blob([S.exportAll()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "studybonk-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    window.SB.ui.toast("📤 Progress exported — it never touched a server", "good");
  };

  document.getElementById("import-all").onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const f = input.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          S.importAll(r.result);
          window.SB.ui.toast("📥 Progress imported!", "good");
          setTimeout(() => location.reload(), 800);
        } catch {
          window.SB.ui.toast("That file isn't a StudyBonk export.", "info");
        }
      };
      r.readAsText(f);
    };
    input.click();
  };

  document.getElementById("reset-all").onclick = () => {
    if (confirm("Reset ALL StudyBonk progress on this device? This deletes XP, streaks, badges, decks and AI history. It cannot be undone.")) {
      G.reset();
      S.remove("userDecks");
      S.remove("srs");
      S.remove("ai.history");
      window.SB.ui.toast("🗑️ Everything bonked back to zero.", "info");
      setTimeout(() => location.reload(), 800);
    }
  };
})();
