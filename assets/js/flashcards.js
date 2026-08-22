/* StudyBonk flashcards: deck library, Leitner spaced repetition sessions,
 * custom deck builder with JSON import/export. Requires storage.js,
 * gamification.js, components.js and study-data.js. */
(function () {
  "use strict";
  const mount = document.getElementById("flashcard-app");
  if (!mount || !window.SB || !window.SB_DATA) return;
  const S = window.SB.storage;
  const G = window.SB.gamification;

  const BOX_DAYS = [0, 1, 3, 7, 16, 35];
  const params = new URLSearchParams(location.search);
  const wantedDeck = params.get("deck");

  /* ---------- SRS state ---------- */
  function getSrs() { return S.get("srs", {}); }
  function setSrs(srs) { S.set("srs", srs); }
  function cardState(deckId, idx) {
    return (getSrs()[deckId] || {})[idx] || { box: 1, due: 0 };
  }

  /* ---------- custom decks ---------- */
  function userDecks() { return S.get("userDecks", []); }
  function setUserDecks(d) { S.set("userDecks", d); }

  function allDecks() {
    return window.SB_DATA.decks.concat(userDecks());
  }

  function dueCount(deck) {
    const srs = getSrs()[deck.id] || {};
    const now = Date.now();
    return deck.cards.filter((c, i) => {
      const st = srs[i] || { box: 1, due: 0 };
      return st.due <= now;
    }).length;
  }

  /* ---------- library view ---------- */
  function renderLibrary() {
    const decks = allDecks();
    const groups = {};
    for (const d of decks) (groups[d.topic] = groups[d.topic] || []).push(d);

    let html = "";
    for (const [topic, list] of Object.entries(groups)) {
      const cards = list.map((d) =>
        '<a class="card card-hover card-link" href="?deck=' + encodeURIComponent(d.id) + '">' +
        '<div class="card-kicker">' + topic + (d.custom ? " · your deck" : "") + "</div>" +
        "<h3>" + d.title.replace(/^[^:]+:\s*/, "") + "</h3>" +
        '<div class="topic-meta"><span class="chip chip-blue">' + d.cards.length + " cards</span>" +
        '<span class="chip chip-yellow">' + dueCount(d) + " due now</span></div></a>"
      ).join("");
      html += '<section class="mb-3"><h2>' + topic + '</h2><div class="deck-grid">' + cards + "</div></section>";
    }

    mount.innerHTML =
      '<div class="btn-row mb-3" style="justify-content:space-between">' +
      "<h2 style='margin:0'>Deck library</h2>" +
      '<div class="btn-row">' +
      '<button class="btn btn-ghost btn-sm" id="new-deck-btn">➕ New custom deck</button>' +
      '<button class="btn btn-ghost btn-sm" id="import-deck-btn">📥 Import JSON</button>' +
      "</div></div>" + html +
      '<div class="card card-glass mt-3"><h3>Make your own deck</h3>' +
      "<p class='muted'>One card per line, formatted <code>front | back</code>. Your decks stay on this device — export anytime.</p>" +
      '<div class="grid grid-2"><input id="new-deck-title" type="text" placeholder="Deck name (e.g. Bio Chapter 4)" maxlength="60">' +
      '<button class="btn btn-primary" id="create-deck-btn">Create deck</button></div>' +
      '<textarea id="new-deck-cards" rows="5" placeholder="Mitochondria | The cell\'s power plant&#10;Ribosome | Builds proteins" style="width:100%;margin-top:12px;padding:12px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)"></textarea>' +
      '<p class="small muted mb-0" id="deck-feedback"></p></div>';

    document.getElementById("new-deck-btn").onclick = () =>
      document.getElementById("new-deck-title").focus();
    document.getElementById("create-deck-btn").onclick = createDeck;
    document.getElementById("import-deck-btn").onclick = importDeck;
  }

  function createDeck() {
    const title = document.getElementById("new-deck-title").value.trim();
    const raw = document.getElementById("new-deck-cards").value.trim();
    const fb = document.getElementById("deck-feedback");
    if (!title) { fb.textContent = "Give your deck a name first."; return; }
    const cards = raw.split("\n").map((l) => l.split("|")).filter((p) => p.length >= 2 && p[0].trim() && p[1].trim()).map((p) => [p[0].trim(), p.slice(1).join("|").trim()]);
    if (!cards.length) { fb.textContent = "No valid cards found — use “front | back”, one per line."; return; }
    const id = "user-" + Date.now().toString(36);
    const decks = userDecks();
    decks.push({ id, title, topic: "Custom", cards, custom: true });
    setUserDecks(decks);
    G.award("card", { deck_builder: true });
    window.SB.ui.toast("🏗️ Deck created: " + title + " (" + cards.length + " cards)", "good");
    location.hash = "";
    openDeck(id);
  }

  function importDeck() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const deck = parsed.deck || parsed;
          if (!deck.title || !Array.isArray(deck.cards)) throw new Error("bad format");
          const cards = deck.cards.map((c) => Array.isArray(c) ? [String(c[0]), String(c[1])] : [String(c.front), String(c.back)]);
          const decks = userDecks();
          decks.push({ id: "user-" + Date.now().toString(36), title: deck.title, topic: "Custom", cards, custom: true });
          setUserDecks(decks);
          window.SB.ui.toast("📥 Imported “" + deck.title + "” (" + cards.length + " cards)", "good");
          renderLibrary();
        } catch {
          window.SB.ui.toast("That file doesn't look like a StudyBonk deck.", "info");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function exportDeck(deck) {
    const blob = new Blob([JSON.stringify({ app: "StudyBonk", deck: { title: deck.title, cards: deck.cards } }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = deck.id + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ---------- study session ---------- */
  let session = null;

  function openDeck(id) {
    const deck = allDecks().find((d) => d.id === id);
    if (!deck) { renderLibrary(); return; }
    const srs = getSrs()[id] || {};
    const now = Date.now();
    let queue = deck.cards.map((c, i) => ({ idx: i, state: srs[i] || { box: 1, due: 0 } }));
    const due = queue.filter((q) => q.state.due <= now);
    const later = queue.filter((q) => q.state.due > now);
    queue = shuffle(due).concat(shuffle(later).slice(0, 5));

    session = { deck, queue, pos: 0, flipped: false, reviewed: 0 };
    history.replaceState(null, "", "?deck=" + encodeURIComponent(id));
    renderCard();
  }

  function shuffle(a) {
    const x = a.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  }

  function renderCard() {
    const { deck, queue, pos } = session;
    if (pos >= queue.length) return finishSession();
    const card = deck.cards[queue[pos].idx];
    mount.innerHTML =
      '<div class="text-center mb-2"><a href="/flashcards/" class="btn btn-ghost btn-sm">← All decks</a> ' +
      '<span class="chip chip-blue">' + deck.title + "</span> " +
      '<span class="chip">' + (pos + 1) + " / " + queue.length + "</span>" +
      (deck.custom ? ' <button class="btn btn-ghost btn-sm" id="export-this">📤 Export</button>' : "") + "</div>" +
      '<div class="flashcard-stage"><div class="flashcard" id="flashcard" role="button" tabindex="0" aria-label="Flashcard — press to flip">' +
      '<div class="flashcard-face flashcard-front"><span class="face-label">Question — tap to flip</span><div class="face-text">' + esc(card[0]) + "</div></div>" +
      '<div class="flashcard-face flashcard-back"><span class="face-label">Answer</span><div class="face-text">' + esc(card[1]) + "</div></div>" +
      "</div></div>" +
      '<div class="quiz-progress mt-3" id="fc-progress">' + progressDots() + "</div>" +
      '<div class="btn-row mt-3" id="rating-row" style="justify-content:center;visibility:hidden">' +
      '<button class="btn btn-ghost btn-sm" data-rate="again">😵 Again</button>' +
      '<button class="btn btn-ghost btn-sm" data-rate="hard">🤔 Hard</button>' +
      '<button class="btn btn-primary btn-sm" data-rate="good">😀 Good</button>' +
      '<button class="btn btn-yellow btn-sm" data-rate="easy">🚀 Easy</button>' +
      "</div>" +
      '<p class="flashcard-hint">Click the card or press <kbd>space</kbd> to flip · <kbd>1</kbd>–<kbd>4</kbd> to rate</p>';

    const el = document.getElementById("flashcard");
    el.addEventListener("click", flip);
    el.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
    document.getElementById("rating-row").addEventListener("click", (e) => {
      const rate = e.target.closest("[data-rate]");
      if (rate) rateCard(rate.dataset.rate);
    });
    if (deck.custom) document.getElementById("export-this").onclick = () => exportDeck(deck);
    document.onkeydown = keyHandler;
  }

  function progressDots() {
    const n = session.queue.length;
    const dots = Math.min(n, 20);
    let out = "";
    for (let i = 0; i < dots; i++) {
      out += "<span class='" + (i < session.pos ? "done" : i === session.pos ? "current" : "") + "'></span>";
    }
    return out;
  }

  function flip() {
    if (!session || session.flipped) return;
    session.flipped = true;
    document.getElementById("flashcard").classList.add("flipped");
    document.getElementById("rating-row").style.visibility = "visible";
  }

  function rateCard(rating) {
    if (!session.flipped) return;
    const { deck, queue, pos } = session;
    const srs = getSrs();
    srs[deck.id] = srs[deck.id] || {};
    const st = queue[pos].state;
    if (rating === "again") st.box = 1;
    else if (rating === "hard") st.box = Math.max(1, st.box);
    else if (rating === "easy") st.box = Math.min(6, st.box + 2);
    else st.box = Math.min(6, st.box + 1);
    st.due = Date.now() + BOX_DAYS[st.box - 1] * 86400000;
    srs[deck.id][queue[pos].idx] = st;
    setSrs(srs);
    G.award("card");
    session.reviewed += 1;
    session.pos += 1;
    session.flipped = false;
    renderCard();
  }

  function keyHandler(e) {
    if (!session) return;
    if (e.key === " ") { e.preventDefault(); flip(); }
    else if (["1", "2", "3", "4"].includes(e.key)) rateCard(["again", "hard", "good", "easy"][+e.key - 1]);
  }

  function finishSession() {
    document.onkeydown = null;
    G.award("deck_complete");
    if (session.reviewed >= 10) window.SB.ui.confetti(1400);
    mount.innerHTML =
      '<div class="card card-glass text-center pop-in" style="max-width:520px;margin-inline:auto;padding:2.5rem">' +
      '<div style="font-size:3rem">🎉</div>' +
      "<h2>Deck session complete!</h2>" +
      "<p class='muted'>You reviewed <strong>" + session.reviewed + "</strong> cards from <strong>" + esc(session.deck.title) + "</strong>. " +
      "Cards you rated Easy will come back later — that's spaced repetition doing its thing.</p>" +
      '<div class="stat-row mb-2"><div class="stat-box"><strong>+' + (session.reviewed * 10 + 20) + "</strong><span>XP this session</span></div>" +
      '<div class="stat-box"><strong>' + session.reviewed + "</strong><span>cards reviewed</span></div></div>" +
      '<div class="btn-row" style="justify-content:center">' +
      '<a class="btn btn-primary" href="/quiz/?topic=' + encodeURIComponent(session.deck.id) + '">Quiz me on this →</a>' +
      '<a class="btn btn-ghost" href="/flashcards/">Back to decks</a></div></div>';
    session = null;
    history.replaceState(null, "", "/flashcards/");
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- boot ---------- */
  if (wantedDeck && allDecks().some((d) => d.id === wantedDeck)) openDeck(wantedDeck);
  else renderLibrary();
})();
