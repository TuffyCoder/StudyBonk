/* StudyBonk flashcards: deck library, Leitner spaced repetition sessions,
 * instant importer (text / PDF / file / URL -> deck) with JSON import/export.
 * Requires storage.js, gamification.js, components.js and study-data.js. */
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

  /* ---------- instant importer: text / file / PDF / URL -> deck ---------- */

  const STOPWORDS = new Set(("the a an and or but of to in on for with is are was were be been it its this that these those " +
    "as at by from into if then than so such can could will would should may might must not no you your they their we our " +
    "he she his her one two also more most other some any each about over under between during after before").split(" "));

  function extractCards(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const cards = [];
    const seen = new Set();
    const push = (f, b) => {
      f = String(f).trim(); b = String(b).trim();
      if (f.length < 2 || b.length < 1 || f.length > 300 || b.length > 500) return;
      const key = f.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      cards.push([f, b]);
    };

    // 1) explicit "front | back" lines
    // 2) "Q: ... / A: ..." pairs
    // 3) definition patterns — keep the richest structured result, then fall back to cloze.
    const best = [];
    for (const l of lines) {
      const parts = l.split("|");
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) push(parts[0], parts.slice(1).join("|"));
    }
    if (cards.length > best.length) best.splice(0, best.length, ...cards);
    if (best.length >= 3) return best.slice(0, 60);

    cards.length = 0; seen.clear();
    for (let i = 0; i < lines.length - 1; i++) {
      const q = lines[i].match(/^Q[:.)]?\s+(.+)/i);
      const a = lines[i + 1].match(/^A[:.)]?\s+(.+)/i);
      if (q && a) push(q[1], a[1]);
    }
    if (cards.length > best.length) best.splice(0, best.length, ...cards);
    if (best.length >= 3) return best.slice(0, 60);

    cards.length = 0; seen.clear();
    for (const l of lines) {
      const m = l.match(/^([A-Z][^.?!]{2,60}?)\s+(?:is|are|means|refers to|is defined as)\s+([^.]{10,}[.!?]?)/);
      if (m) push("What is " + m[1].trim() + "?", m[2].trim());
      else {
        const s = l.match(/^(.{2,60}?)\s+[-\u2013\u2014]\s+(.{3,300})$/) || l.match(/^([^:]{2,40}):\s+(.{10,300})$/);
        if (s) push(s[1].trim(), s[2].trim());
      }
    }
    if (cards.length > best.length) best.splice(0, best.length, ...cards);
    if (best.length >= 2) return best.slice(0, 60);

    // 4) fallback: cloze deletion on substantive sentences
    cards.length = 0; seen.clear();
    const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter((s) => s.split(" ").length >= 8 && s.length < 320);
    for (const s of sentences) {
      const words = s.split(" ").map((w) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ""));
      let key = null;
      for (const w of words) {
        if (w.length < 5 || STOPWORDS.has(w.toLowerCase())) continue;
        if (!key || w.length > key.length) key = w;
      }
      if (!key) continue;
      const re = new RegExp("\\b" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
      if (!re.test(s)) continue;
      push(s.replace(re, "______"), key);
      if (cards.length >= 40) break;
    }
    return cards.length >= 3 ? cards.slice(0, 60) : best.concat(cards).slice(0, 60);
  }

  async function pdfToText(file) {
    const pdfjs = await import("/assets/vendor/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdf.worker.min.mjs";
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const parts = [];
    for (let p = 1; p <= doc.numPages && p <= 60; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      parts.push(content.items.map((i) => i.str).join(" "));
    }
    return parts.join("\n");
  }

  async function urlToText(url) {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error("the site responded with HTTP " + res.status);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    let body = await res.text();
    if (ct.includes("html") || /^\s*<(!doctype|html)/i.test(body)) {
      body = body
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    }
    return body;
  }

  function finishImport(title, cards, feedbackEl) {
    if (!cards || cards.length < 3) {
      if (feedbackEl) feedbackEl.textContent = "Couldn't find enough card material (need 3+). Tip: lines like 'term | definition' work best, or paste richer text.";
      return;
    }
    const id = "user-" + Date.now().toString(36);
    const decks = userDecks();
    decks.push({ id, title: title || "Imported deck", topic: "Custom", cards, custom: true });
    setUserDecks(decks);
    G.award("card", { deck_builder: true });
    window.SB.ui.confetti(1200);
    window.SB.ui.toast("⚡ " + cards.length + " flashcards created — saved locally!", "good");
    openDeck(id);
  }

  /* ---------- AI-powered generation (real local model via bonk-model.js) ---------- */

  const AI_SYSTEM_PROMPT =
    "You are a flashcard generator. From the user's study material, create flashcards. " +
    "Output ONLY lines in the exact format: front | back — one card per line, no numbering, " +
    "no bullets, no extra text before or after. Make 8 to 14 cards. Fronts are clear questions " +
    "or terms; backs are one concise answer. Use only information from the material.";

  function parseAiCards(output) {
    const cards = [];
    const seen = new Set();
    for (const line of String(output).split(/\r?\n/)) {
      const m = line.replace(/^\s*[-*\d.)\]]+\s*/, "").match(/^(.{2,200}?)\s*\|\s*(.{1,300})$/);
      if (!m) continue;
      const key = m[1].trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push([m[1].trim(), m[2].trim()]);
      if (cards.length >= 40) break;
    }
    return cards;
  }

  async function ensureModel(feedbackEl) {
    if (!window.SB.model) {
      feedbackEl.textContent = "AI engine unavailable in this browser — using the smart extractor instead.";
      return false;
    }
    if (window.SB.model.info().ready) return true;
    const gpu = window.SB.model.hasWebGPU();
    feedbackEl.textContent = (gpu ? "🧠 Loading Bonk Core (Qwen 2.5 1.5B, ~900 MB, one-time)…" : "🧊 No WebGPU — loading the WASM model (Qwen 2.5 0.5B, ~510 MB, one-time)…") +
      " Runs 100% locally; cached for offline after this.";
    try {
      const info = await window.SB.model.load(gpu ? "core" : "wasm", (progress, text) => {
        feedbackEl.textContent = "🧠 Downloading & compiling — " + Math.round((progress || 0) * 100) + "% · " + String(text).slice(0, 90);
      });
      feedbackEl.textContent = "✅ " + info.model.name + " loaded — generating flashcards locally…";
      return true;
    } catch (err) {
      feedbackEl.textContent = "⚠️ Model couldn't load (" + String(err && err.message || err).slice(0, 100) + ") — using the smart extractor instead.";
      return false;
    }
  }

  async function aiGenerateCards(text, feedbackEl) {
    const ok = await ensureModel(feedbackEl);
    if (!ok) return null;
    const messages = [
      { role: "system", content: AI_SYSTEM_PROMPT },
      { role: "user", content: "Create flashcards from this material:\n\n" + text.slice(0, 4000) },
    ];
    const out = await window.SB.model.generate(messages, { temperature: 0.3, maxTokens: 700 });
    const cards = parseAiCards(out);
    return cards.length >= 3 ? cards : null;
  }

  /* ---------- library view ---------- */
  function renderLibrary() {
    const decks = allDecks();
    const groups = {};
    for (const d of decks) (groups[d.topic] = groups[d.topic] || []).push(d);

    // subject icon lookup from the pillar data
    const topicEmoji = {};
    if (window.SB_DATA) for (const p of window.SB_DATA.pillars) topicEmoji[p.title] = p.emoji;

    let html = "";
    for (const [topic, list] of Object.entries(groups)) {
      const cards = list.map((d) => {
        const body =
          '<div class="card-kicker">' + topic + (d.custom ? " · your deck" : "") + "</div>" +
          "<h3>" + d.title.replace(/^[^:]+:\s*/, "") + "</h3>" +
          '<div class="topic-meta"><span class="chip chip-blue">' + d.cards.length + " cards</span>" +
          '<span class="chip chip-yellow">' + dueCount(d) + " due now</span></div>";
        if (d.custom) {
          return (
            '<div class="card card-hover" style="position:relative">' +
            '<a href="?deck=' + encodeURIComponent(d.id) + '" style="all:unset;cursor:pointer;display:block;color:inherit">' + body + "</a>" +
            '<button class="btn btn-ghost btn-sm deck-delete" data-delete-deck="' + d.id + '" title="Delete this deck" aria-label="Delete deck ' + esc(d.title) + '" style="position:absolute;top:12px;right:12px;padding:6px 10px">🗑️</button>' +
            "</div>"
          );
        }
        return '<a class="card card-hover card-link" href="?deck=' + encodeURIComponent(d.id) + '">' + body + "</a>";
      }).join("");
      html += '<section class="mb-3"><h2>' + (topicEmoji[topic] ? topicEmoji[topic] + " " : "") + topic + '</h2><div class="deck-grid">' + cards + "</div></section>";
    }

    mount.innerHTML =
      '<div class="btn-row mb-3" style="justify-content:space-between">' +
      "<h2 style='margin:0'>Deck library</h2>" +
      '<div class="btn-row">' +
      '<button class="btn btn-primary btn-sm" id="new-blank-deck">➕ New deck</button>' +
      '<button class="btn btn-ghost btn-sm" id="import-deck-btn">📥 Import JSON</button>' +
      "</div></div>" + html +
      '<div class="card card-glass mt-3" id="instant-importer">' +
      "<h2 class='mt-0'>⚡ Instant importer — anything to flashcards</h2>" +
      "<p class='muted'>Paste notes, upload a <strong>PDF</strong> or text file, or drop a URL. StudyBonk detects 'term | definition', 'Q:/A:' pairs, 'term - definition' and definition sentences — and falls back to smart cloze cards. Everything is processed on your device; nothing is uploaded anywhere.</p>" +
      '<div class="mode-switch mb-2" id="import-tabs">' +
      '<button class="active" data-tab="paste" type="button">📝 Paste text</button>' +
      '<button data-tab="file" type="button">📄 Upload PDF / file</button>' +
      '<button data-tab="url" type="button">🔗 From URL</button>' +
      "</div>" +
      '<input id="new-deck-title" type="text" placeholder="Deck name (optional — e.g. Bio Chapter 4)" maxlength="60" style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)">' +
      '<label class="chip chip-purple mt-2" style="cursor:pointer;display:inline-flex"><input type="checkbox" id="ai-toggle" style="accent-color:var(--purple);width:16px;height:16px"> 🧠 Generate with a real local AI model (better on messy text — one-time download, runs on-device)</label>' +
      '<div id="import-tab-paste" class="mt-2">' +
      '<textarea id="paste-text" rows="6" placeholder="Paste anything: class notes, a chapter, vocab lists…\n\nFormats it understands:\nMitochondria | The cell power plant\nQ: What is osmosis?\nA: Water moving across a membrane" style="width:100%;padding:12px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)"></textarea>' +
      '<button class="btn btn-primary mt-2" id="paste-go">⚡ Turn it into flashcards</button>' +
      "</div>" +
      '<div id="import-tab-file" class="mt-2" hidden>' +
      '<label class="btn btn-yellow" style="cursor:pointer" for="file-input">📄 Choose PDF, .txt or .md</label>' +
      '<input id="file-input" type="file" accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/plain" hidden>' +
      '<p class="small muted mt-2 mb-0" id="file-status">PDFs are parsed locally in your browser (first import loads a small local parser).</p>' +
      "</div>" +
      '<div id="import-tab-url" class="mt-2" hidden>' +
      '<div class="grid grid-2">' +
      '<input id="url-input" type="url" placeholder="https://example.com/article" style="padding:12px 16px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)">' +
      '<button class="btn btn-primary" id="url-go">🔗 Fetch and convert</button></div>' +
      '<p class="small muted mt-2 mb-0">Only works on pages that allow cross-site reading (many don\'t — if it fails, copy the text and use Paste). The fetch happens directly from your browser.</p>' +
      "</div>" +
      '<p class="small muted mb-0 mt-2" id="deck-feedback"></p>' +
      "</div>";

    document.getElementById("import-deck-btn").onclick = importDeck;

    // delete custom decks
    mount.querySelectorAll("[data-delete-deck]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.deleteDeck;
        const deck = userDecks().find((d) => d.id === id);
        if (!deck) return;
        if (!confirm("Delete deck '" + deck.title + "' (" + deck.cards.length + " cards) and its study schedule? This can't be undone.")) return;
        setUserDecks(userDecks().filter((d) => d.id !== id));
        const srs = getSrs();
        delete srs[id];
        setSrs(srs);
        window.SB.ui.toast("🗑️ Deck deleted", "info");
        renderLibrary();
      };
    });

    // new blank deck (add cards inside the deck session)
    document.getElementById("new-blank-deck").onclick = () => {
      const title = prompt("Deck name:", "My deck");
      if (title === null) return;
      const clean = title.trim() || "My deck";
      const id = "user-" + Date.now().toString(36);
      const decks = userDecks();
      decks.push({ id, title: clean, topic: "Custom", cards: [], custom: true });
      setUserDecks(decks);
      G.award("card", { deck_builder: true });
      openDeck(id); // opens with the add-cards panel ready
    };

    const tabs = document.getElementById("import-tabs");
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      ["paste", "file", "url"].forEach((t) => {
        document.getElementById("import-tab-" + t).hidden = t !== btn.dataset.tab;
      });
    });

    const feedback = document.getElementById("deck-feedback");
    const aiOn = () => document.getElementById("ai-toggle").checked;

    // Shared funnel: raw text -> (optional) local AI generation -> deck
    async function processText(text, title, fb) {
      if (aiOn()) {
        fb.textContent = "🧠 Asking the local AI model to write your flashcards…";
        try {
          const aiCards = await aiGenerateCards(text, fb);
          if (aiCards) {
            finishImport(title, aiCards, fb);
            return;
          }
          fb.textContent = "ℹ️ The model's output wasn't clean card format — using the smart extractor instead.";
        } catch (e) {
          fb.textContent = "ℹ️ AI generation unavailable (" + String(e && e.message || e).slice(0, 80) + ") — using the smart extractor.";
        }
      }
      finishImport(title, extractCards(text), fb);
    }

    document.getElementById("paste-go").onclick = () => {
      const text = document.getElementById("paste-text").value.trim();
      if (text.length < 20) { feedback.textContent = "Paste some text first (a few sentences at least)."; return; }
      processText(text, document.getElementById("new-deck-title").value.trim(), feedback);
    };

    document.getElementById("file-input").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const status = document.getElementById("file-status");
      const title = document.getElementById("new-deck-title").value.trim() || file.name.replace(/\.(pdf|txt|md|markdown|csv)$/i, "");
      try {
        status.textContent = "📖 Reading " + file.name + " locally…";
        let text;
        if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
          status.textContent = "📖 Parsing PDF on your device (a few seconds)…";
          text = await pdfToText(file);
        } else {
          text = await file.text();
        }
        status.textContent = "⚡ Extracting flashcards…";
        await processText(text, title, status);
      } catch (err) {
        status.textContent = "⚠️ Couldn't read that file (" + (err.message || "unknown error").slice(0, 100) + "). Scanned PDFs without a text layer can't be read locally — copy the text and paste it instead.";
      }
    };

    document.getElementById("url-go").onclick = async () => {
      const url = document.getElementById("url-input").value.trim();
      let parsed;
      try {
        parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("bad protocol");
      } catch (e2) {
        feedback.textContent = "That doesn't look like a valid URL (include http:// or https://).";
        return;
      }
      feedback.textContent = "🔗 Fetching page directly in your browser…";
      try {
        const text = await urlToText(url);
        let title = document.getElementById("new-deck-title").value.trim();
        if (!title) {
          try { title = parsed.hostname.replace(/^www\./, ""); } catch (e3) { title = "Imported deck"; }
        }
        await processText(text, title, feedback);
      } catch (err) {
        feedback.textContent = "⚠️ Couldn't fetch that URL (" + (err.message || "blocked").slice(0, 100) + "). Most sites block cross-site reading — open the page, copy its text, and use the Paste tab.";
      }
    };
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
          window.SB.ui.toast("📥 Imported '" + deck.title + "' (" + cards.length + " cards)", "good");
          renderLibrary();
        } catch (e) {
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

  function intervalLabel(days) {
    if (days <= 0) return "today";
    if (days === 1) return "1 day";
    if (days >= 30) return "35 days";
    return days + " days";
  }

  function renderCard() {
    const { deck, queue, pos } = session;
    if (deck.cards.length === 0) return renderAddCards(true);
    if (pos >= queue.length) return finishSession();
    const card = deck.cards[queue[pos].idx];
    const box = queue[pos].state.box || 1;
    // compute the next interval each rating produces (Leitner boxes 1-6)
    const nextBox = { again: 1, hard: Math.max(1, box), good: Math.min(6, box + 1), easy: Math.min(6, box + 2) };
    const nextHint = session.lastRating
      ? " · last card: " + session.lastRating
      : "";
    mount.innerHTML =
      '<div class="text-center mb-2"><a href="/flashcards/" class="btn btn-ghost btn-sm">← All decks</a> ' +
      '<span class="chip chip-blue">' + esc(deck.title) + "</span> " +
      '<span class="chip">' + (pos + 1) + " / " + queue.length + "</span>" +
      '<span class="chip chip-green">box ' + box + "/6</span>" +
      (deck.custom
        ? ' <button class="btn btn-ghost btn-sm" id="add-cards-btn">➕ Add cards</button>' +
          ' <button class="btn btn-ghost btn-sm" id="export-this">📤 Export</button>' +
          ' <button class="btn btn-ghost btn-sm" id="delete-this" style="border-color:var(--red);color:var(--red)">🗑️ Delete deck</button>'
        : "") + "</div>" +
      '<div id="add-cards-panel"></div>' +
      '<div class="flashcard-stage"><div class="flashcard" id="flashcard" role="button" tabindex="0" aria-label="Flashcard — press to flip">' +
      '<div class="flashcard-face flashcard-front"><span class="face-label">Question — tap to flip</span><div class="face-text">' + esc(card[0]) + "</div></div>" +
      '<div class="flashcard-face flashcard-back"><span class="face-label">Answer</span><div class="face-text">' + esc(card[1]) + "</div></div>" +
      "</div></div>" +
      '<div class="quiz-progress mt-3" id="fc-progress">' + progressDots() + "</div>" +
      '<div class="btn-row mt-3" id="rating-row" style="justify-content:center;visibility:hidden">' +
      '<button class="btn btn-ghost btn-sm" data-rate="again" title="Reset to box 1 — you will see this card again today">😵 Again<br><span class="small">returns ' + intervalLabel(BOX_DAYS[0]) + "</span></button>" +
      '<button class="btn btn-ghost btn-sm" data-rate="hard" title="Keep the current interval">🤔 Hard<br><span class="small">returns ' + intervalLabel(BOX_DAYS[nextBox.hard - 1]) + "</span></button>" +
      '<button class="btn btn-primary btn-sm" data-rate="good" title="Move up one box (longer interval)">😀 Good<br><span class="small">returns ' + intervalLabel(BOX_DAYS[nextBox.good - 1]) + "</span></button>" +
      '<button class="btn btn-yellow btn-sm" data-rate="easy" title="Move up two boxes (much longer interval)">🚀 Easy<br><span class="small">returns ' + intervalLabel(BOX_DAYS[nextBox.easy - 1]) + "</span></button>" +
      "</div>" +
      '<p class="flashcard-hint">Click the card or press <kbd>space</kbd> to flip · <kbd>1</kbd>–<kbd>4</kbd> to rate' + nextHint + "</p>" +
      '<p class="small muted mb-0">Spaced repetition (Leitner): rate honestly — <strong>Again</strong> relearns today, <strong>Good</strong> climbs the 1→3→7→16→35 day ladder, <strong>Easy</strong> skips ahead. The interval shown on each button is exactly when this card returns.</p>';

    const el = document.getElementById("flashcard");
    el.addEventListener("click", flip);
    el.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
    document.getElementById("rating-row").addEventListener("click", (e) => {
      const rate = e.target.closest("[data-rate]");
      if (rate) rateCard(rate.dataset.rate);
    });
    if (deck.custom) {
      document.getElementById("add-cards-btn").onclick = () => renderAddCards(false);
      document.getElementById("export-this").onclick = () => exportDeck(deck);
      document.getElementById("delete-this").onclick = () => {
        if (!confirm("Delete deck '" + deck.title + "' (" + deck.cards.length + " cards) and its schedule? This can't be undone.")) return;
        setUserDecks(userDecks().filter((d) => d.id !== deck.id));
        const srs = getSrs();
        delete srs[deck.id];
        setSrs(srs);
        session = null;
        document.onkeydown = null;
        window.SB.ui.toast("🗑️ Deck deleted", "info");
        history.replaceState(null, "", "/flashcards/");
        renderLibrary();
      };
    }
    document.onkeydown = keyHandler;
  }

  /* add-cards panel for custom decks (inline, no prompts) */
  function renderAddCards(empty) {
    const deck = session ? session.deck : null;
    if (!deck) return;
    document.onkeydown = null;
    mount.innerHTML =
      '<div class="text-center mb-2"><a href="/flashcards/" class="btn btn-ghost btn-sm">← All decks</a> ' +
      '<span class="chip chip-blue">' + esc(deck.title) + "</span> " +
      '<span class="chip">' + deck.cards.length + " cards</span></div>" +
      '<div class="card card-glass" style="max-width:620px;margin-inline:auto">' +
      "<h2 class='mt-0' style='font-size:1.3rem'>➕ Add cards to this deck</h2>" +
      "<p class='muted small mb-2'>One card per line, formatted <code>front | back</code>.</p>" +
      '<textarea id="add-cards-input" rows="6" placeholder="Term | Definition&#10;Question | Answer" style="width:100%;padding:12px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)"></textarea>' +
      '<div class="btn-row mt-2">' +
      '<button class="btn btn-primary" id="add-cards-save">Save cards</button>' +
      (empty ? "" : '<button class="btn btn-ghost" id="add-cards-cancel">Cancel</button>') +
      "</div>" +
      '<p class="small muted mb-0 mt-2" id="add-cards-feedback"></p></div>';
    const back = () => openDeck(deck.id);
    document.getElementById("add-cards-save").onclick = () => {
      const raw = document.getElementById("add-cards-input").value.trim();
      const fb = document.getElementById("add-cards-feedback");
      const decks = userDecks();
      const mine = decks.find((d) => d.id === deck.id);
      if (!mine) { fb.textContent = "This deck no longer exists."; return; }
      const added = raw.split("\n").map((l) => l.split("|"))
        .filter((p) => p.length >= 2 && p[0].trim() && p[1].trim())
        .map((p) => [p[0].trim(), p.slice(1).join("|").trim()]);
      if (!added.length) { fb.textContent = "No valid cards found — use 'front | back', one per line."; return; }
      mine.cards = mine.cards.concat(added);
      setUserDecks(decks);
      window.SB.ui.toast("➕ " + added.length + " cards added to '" + mine.title + "'", "good");
      back();
    };
    const cancel = document.getElementById("add-cards-cancel");
    if (cancel) cancel.onclick = back;
    document.getElementById("add-cards-input").focus();
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

  function intervalLabel(days) {
    if (days <= 0) return "relearn today";
    if (days === 1) return "back tomorrow";
    return "back in " + days + " days";
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

    const label = { again: "😵 Again", hard: "🤔 Hard", good: "😀 Good", easy: "🚀 Easy" }[rating];
    session.lastRating = label + " → " + intervalLabel(BOX_DAYS[st.box - 1]);

    // "Again" re-queues the card for another pass in THIS session
    if (rating === "again") session.queue.push({ idx: queue[pos].idx, state: st });

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
      '<a class="btn btn-primary" href="/flashcards/">Back to decks</a></div></div>';
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
