/* StudyBonk quiz engine: topic picker, instant feedback with explanations,
 * Bonk Challenges (timed speed rounds). Requires storage.js, gamification.js,
 * components.js, study-data.js. */
(function () {
  "use strict";
  const mount = document.getElementById("quiz-app");
  if (!mount || !window.SB_DATA) return;
  const G = window.SB.gamification;

  const params = new URLSearchParams(location.search);
  const LETTERS = ["A", "B", "C", "D"];

  function shuffle(a) {
    const x = a.slice();
    for (let i = x.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [x[i], x[j]] = [x[j], x[i]];
    }
    return x;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ================= instant importer: PDF / text / URL → quiz ================= */

  function userQuizzes() { return window.SB.storage.get("userQuizzes", []); }
  function setUserQuizzes(list) { window.SB.storage.set("userQuizzes", list); }

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

  const QUIZ_AI_PROMPT =
    "You create multiple-choice quizzes from study material. Output ONLY a valid JSON array and NOTHING else — " +
    "no markdown fences, no commentary. Each element must be exactly: " +
    '{"q": "question text", "choices": ["A", "B", "C", "D"], "answer": 0, "explain": "one short sentence why"} ' +
    "where answer is the 0-3 index of the correct choice. Create 6 to 10 questions of mixed difficulty using only " +
    "information present in the material. Wrong choices must be plausible.";

  function parseAiQuiz(output) {
    if (!output) return null;
    let text = String(output).trim();
    // strip code fences / preambles / epilogues around the JSON array
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start === -1 || end === -1 || end <= start) return null;
    text = text.slice(start, end + 1);
    let items;
    try { items = JSON.parse(text); } catch (e) { return null; }
    if (!Array.isArray(items)) return null;
    const questions = [];
    for (const it of items) {
      if (!it || typeof it.q !== "string" || !Array.isArray(it.choices)) continue;
      const choices = it.choices.map(String).slice(0, 4).map((c) => c.trim()).filter(Boolean);
      if (choices.length < 2) continue;
      let answer = parseInt(it.answer, 10);
      if (isNaN(answer) || answer < 0 || answer >= choices.length) answer = 0;
      questions.push({
        q: it.q.trim().slice(0, 400),
        choices,
        answer,
        explain: typeof it.explain === "string" && it.explain.trim() ? it.explain.trim().slice(0, 400) : "The correct answer is " + choices[answer] + ".",
      });
      if (questions.length >= 15) break;
    }
    return questions.length >= 3 ? questions : null;
  }

  // No-model fallback: True/False quiz from definition-shaped sentences.
  function tfQuizFromText(text) {
    const sentences = text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/)
      .filter((s) => s.split(" ").length >= 8 && s.length < 260)
      .slice(0, 40);
    const defs = sentences
      .map((s) => s.match(/^([A-Z][^.?!]{2,60}?)\s+(?:is|are|means|refers to|was|were)\s+([^.]{8,180})/))
      .filter(Boolean)
      .slice(0, 10);
    if (defs.length < 3) return null;
    return defs.map(([full, term, defn], i) => {
      const makeTrue = Math.random() >= 0.5;
      const borrowed = defs[(i + 1) % defs.length];
      const shownDef = makeTrue ? defn : borrowed[2];
      return {
        q: "True or false: " + term.trim() + " is " + shownDef.trim(),
        choices: ["True", "False"],
        answer: makeTrue ? 0 : 1,
        explain: makeTrue
          ? "True — straight from the material."
          : "False — that definition belongs to " + borrowed[1].trim() + ", not " + term.trim() + ".",
      };
    });
  }

  async function aiQuizFromText(text, fb) {
    if (!window.SB.model || !(await ensureModel(fb))) return null;
    const out = await window.SB.model.generate(
      [{ role: "system", content: QUIZ_AI_PROMPT }, { role: "user", content: "Create a quiz from this material:\n\n" + text.slice(0, 4000) }],
      { temperature: 0.3, maxTokens: 900 }
    );
    return parseAiQuiz(out);
  }

  async function ensureModel(fb) {
    if (!window.SB.model) { fb.textContent = "Bonk AI unavailable here — using the True/False generator."; return false; }
    if (window.SB.model.info().ready) return true;
    fb.textContent = "🦊 Loading Bonk AI (one-time ~874 MB download, cached offline, runs on-device)…";
    try {
      await window.SB.model.load(null, (p, t) => {
        fb.textContent = "🦊 Bonk AI — " + Math.round((p || 0) * 100) + "% · " + String(t).slice(0, 90);
      });
      fb.textContent = "🦊 Bonk AI ready — writing your quiz locally…";
      return true;
    } catch (e) {
      fb.textContent = "⚠️ Bonk AI couldn't load (" + String(e && e.message || e).slice(0, 90) + ") — using the True/False generator.";
      return false;
    }
  }

  function saveAndPlayQuiz(title, questions, fb) {
    const q = { id: "userquiz-" + Date.now().toString(36), title: title || "Imported quiz", topic: "Custom", questions, custom: true };
    const list = userQuizzes();
    list.push(q);
    setUserQuizzes(list);
    window.SB.ui.confetti(1200);
    window.SB.ui.toast("🎯 " + questions.length + " questions generated — saved locally!", "good");
    startQuiz(shuffle(questions), q.title, false);
  }

  async function processTextToQuiz(text, title, fb) {
    fb.textContent = "🦊 Asking Bonk AI to write your quiz…";
    try {
      const ai = await aiQuizFromText(text, fb);
      if (ai) { saveAndPlayQuiz(title, ai, fb); return; }
      fb.textContent = "ℹ️ Bonk AI's output wasn't clean quiz JSON — trying the True/False generator…";
    } catch (e) {
      fb.textContent = "ℹ️ Bonk AI unavailable (" + String(e && e.message || e).slice(0, 80) + ") — trying the True/False generator…";
    }
    const tf = tfQuizFromText(text);
    if (tf) {
      fb.textContent = "ℹ️ Generated a True/False quiz without the model. Turn on Bonk AI above for full multiple-choice.";
      saveAndPlayQuiz(title, tf, fb);
    } else {
      fb.textContent = "Couldn't build a quiz from that text (need a few full sentences with definitions). Try richer material, or use the flashcard importer.";
    }
  }

  function renderImporter() {
    const wrap = document.createElement("div");
    wrap.className = "card card-glass mt-3";
    wrap.innerHTML =
      "<h2 class='mt-0' style='font-size:1.25rem'>🦊 Bonk AI quiz maker — PDF, notes or URL to quiz</h2>" +
      "<p class='muted small'>Upload a PDF, paste text, or drop a URL. Bonk AI (a real language model running inside your browser) writes multiple-choice questions with explanations. Falls back to a True/False generator without the model.</p>" +
      '<div class="mode-switch mb-2" id="quiz-import-tabs">' +
      '<button class="active" data-tab="paste" type="button">📝 Paste text</button>' +
      '<button data-tab="file" type="button">📄 Upload PDF / file</button>' +
      '<button data-tab="url" type="button">🔗 From URL</button></div>' +
      '<input id="quiz-title" type="text" placeholder="Quiz name (optional — e.g. Chapter 4 review)" maxlength="60" style="width:100%;padding:12px 16px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)">' +
      '<div id="qtab-paste" class="mt-2"><textarea id="quiz-paste" rows="5" placeholder="Paste your notes, chapter or article…" style="width:100%;padding:12px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)"></textarea>' +
      '<button class="btn btn-primary mt-2" id="quiz-paste-go">🦊 Generate quiz with Bonk AI</button></div>' +
      '<div id="qtab-file" class="mt-2" hidden><label class="btn btn-yellow" style="cursor:pointer" for="quiz-file">📄 Choose PDF, .txt or .md</label>' +
      '<input id="quiz-file" type="file" accept=".pdf,.txt,.md,.markdown,.csv,application/pdf,text/plain" hidden>' +
      '<p class="small muted mt-2 mb-0" id="quiz-file-status">PDFs parsed locally — files never leave your device.</p></div>' +
      '<div id="qtab-url" class="mt-2" hidden><div class="grid grid-2">' +
      '<input id="quiz-url" type="url" placeholder="https://example.com/article" style="padding:12px 16px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)">' +
      '<button class="btn btn-primary" id="quiz-url-go">🔗 Fetch and quiz</button></div>' +
      '<p class="small muted mt-2 mb-0">Only sites that allow cross-site reading (many don\'t — paste instead if it fails).</p></div>' +
      '<p class="small muted mb-0 mt-2" id="quiz-feedback"></p>';
    return wrap;
  }

  function wireImporter(container) {
    const importer = renderImporter();
    container.appendChild(importer);
    const fb = document.getElementById("quiz-feedback");
    const tabs = document.getElementById("quiz-import-tabs");
    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      ["paste", "file", "url"].forEach((t) => { document.getElementById("qtab-" + t).hidden = t !== btn.dataset.tab; });
    });
    document.getElementById("quiz-paste-go").onclick = () => {
      const text = document.getElementById("quiz-paste").value.trim();
      if (text.length < 40) { fb.textContent = "Paste some more text first (a paragraph or two at least)."; return; }
      processTextToQuiz(text, document.getElementById("quiz-title").value.trim(), fb);
    };
    document.getElementById("quiz-file").onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const status = document.getElementById("quiz-file-status");
      const title = document.getElementById("quiz-title").value.trim() || file.name.replace(/\.(pdf|txt|md|markdown|csv)$/i, "");
      try {
        status.textContent = "📖 Reading " + file.name + " locally…";
        const text = (/\.pdf$/i.test(file.name) || file.type === "application/pdf") ? await pdfToText(file) : await file.text();
        await processTextToQuiz(text, title, status);
      } catch (err) {
        status.textContent = "⚠️ Couldn't read that file (" + (err.message || "error").slice(0, 90) + "). Scanned PDFs need pasting instead.";
      }
    };
    document.getElementById("quiz-url-go").onclick = async () => {
      const url = document.getElementById("quiz-url").value.trim();
      let parsed;
      try {
        parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      } catch (e2) { fb.textContent = "That doesn't look like a valid URL (include http:// or https://)."; return; }
      fb.textContent = "🔗 Fetching page in your browser…";
      try {
        const text = await urlToText(url);
        const title = document.getElementById("quiz-title").value.trim() || parsed.hostname.replace(/^www\./, "");
        await processTextToQuiz(text, title, fb);
      } catch (err) {
        fb.textContent = "⚠️ Couldn't fetch that URL (" + (err.message || "blocked").slice(0, 90) + ") — copy the text and paste it instead.";
      }
    };
  }

  /* ---------- start screen ---------- */
  function renderStart() {
    const topics = window.SB_DATA.quizzes.reduce((acc, q) => {
      (acc[q.topic] = acc[q.topic] || []).push(q);
      return acc;
    }, {});
    const pillars = window.SB_DATA.pillars;
    let html = '<div class="section-head"><span class="eyebrow">Pick your battle</span><h2 style="margin-top:.2em">Choose a quiz</h2></div>';
    for (const p of pillars) {
      if (!topics[p.title]) continue;
      const chips = topics[p.title].map((q) =>
        '<a class="chip" style="cursor:pointer" href="?topic=' + encodeURIComponent(q.id) + "&len=5\">" + q.title.replace(/^[^:]+:\s*/, "") + "</a>"
      ).join(" ");
      html += '<div class="card card-hover mb-2"><h3>' + p.emoji + " " + esc(p.title) + '</h3><div class="topic-meta">' + chips + "</div></div>";
    }
    // user-imported quizzes (with delete buttons)
    const mine = userQuizzes();
    if (mine.length) {
      const rows = mine.slice().reverse().map((q) =>
        '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
        '<a class="chip chip-yellow" style="cursor:pointer" href="?topic=' + encodeURIComponent(q.id) + "&len=all\">" + esc(q.title) + " · " + q.questions.length + " Q</a>" +
        '<button class="btn btn-ghost btn-sm" data-del-quiz="' + q.id + '" title="Delete this quiz" aria-label="Delete quiz ' + esc(q.title) + '" style="padding:4px 9px;border-color:var(--red);color:var(--red)">✕</button>' +
        "</div>"
      ).join("");
      html += '<div class="card card-glass mb-2"><h3>🦊 Your Bonk AI quizzes</h3><div class="topic-meta" style="flex-direction:column;align-items:flex-start;gap:10px">' + rows + "</div></div>";
    }
    html += '<div class="card card-glass mt-3 text-center"><h3>🥊 Bonk Challenge</h3><p class="muted">Speed round: 10 random questions, 60 seconds, explanations after the buzzer.</p><button class="btn btn-yellow" id="challenge-btn">Start speed round</button></div>';
    mount.innerHTML = html;
    document.getElementById("challenge-btn").onclick = () => startQuiz(shuffle(allQuestions()).slice(0, 10), "⚡ Bonk Challenge: Speed Round", true);
    mount.querySelectorAll("[data-del-quiz]").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.delQuiz;
        const q = userQuizzes().find((x) => x.id === id);
        if (!q) return;
        if (!confirm("Delete quiz '" + q.title + "' (" + q.questions.length + " questions)? This can't be undone.")) return;
        setUserQuizzes(userQuizzes().filter((x) => x.id !== id));
        window.SB.ui.toast("🗑️ Quiz deleted", "info");
        renderStart();
      };
    });
    wireImporter(mount);
    history.replaceState(null, "", "/quiz/");
  }

  function allQuestions() {
    return window.SB_DATA.quizzes.flatMap((q) => q.questions.map((qq) => ({ ...qq, from: q.title })));
  }

  /* ---------- quiz session ---------- */
  let quiz = null;

  function startQuiz(questions, title, isChallenge) {
    quiz = { questions, title, pos: 0, correct: 0, answered: false, isChallenge: !!isChallenge, startedAt: Date.now() };
    history.replaceState(null, "", quiz.isChallenge ? "/quiz/?challenge=1" : location.search);
    renderQuestion();
  }

  function progressDots() {
    const n = quiz.questions.length;
    const dots = Math.min(n, 20);
    let out = "";
    for (let i = 0; i < dots; i++) out += "<span class='" + (i < quiz.pos ? "done" : i === quiz.pos ? "current" : "") + "'></span>";
    return out;
  }

  function renderQuestion() {
    if (quiz.pos >= quiz.questions.length) return finishQuiz();
    const q = quiz.questions[quiz.pos];
    const choices = q.choices.map((c, i) =>
      '<button class="quiz-choice" data-choice="' + i + '" type="button"><span class="choice-letter">' + LETTERS[i] + "</span>" + esc(c) + "</button>"
    ).join("");
    const timer = quiz.isChallenge ? '<span class="chip chip-yellow" id="challenge-timer">⏱️ 60s</span>' : "";
    mount.innerHTML =
      '<div class="card card-glass" style="max-width:720px;margin-inline:auto">' +
      '<div class="btn-row mb-2" style="justify-content:space-between">' +
      '<span class="chip chip-blue">' + esc(quiz.title) + "</span>" + timer + "</div>" +
      '<div class="quiz-progress">' + progressDots() + "</div>" +
      '<p class="quiz-question">' + esc(q.q) + "</p>" +
      '<div class="quiz-choices">' + choices + "</div>" +
      '<div id="quiz-feedback"></div>' +
      '<div class="btn-row mt-3" style="justify-content:space-between"><a href="/quiz/" class="btn btn-ghost btn-sm">Quit</a>' +
      '<button class="btn btn-primary" id="quiz-next" style="visibility:hidden">Next →</button></div></div>';

    mount.querySelector(".quiz-choices").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-choice]");
      if (btn) answer(+btn.dataset.choice);
    });
    document.getElementById("quiz-next").onclick = next;
    if (quiz.isChallenge) startChallengeTimer();
  }

  function startChallengeTimer() {
    const el = document.getElementById("challenge-timer");
    const end = quiz.startedAt + 60000;
    const tick = setInterval(() => {
      const left = Math.max(0, end - Date.now());
      if (el) el.textContent = "⏱️ " + Math.ceil(left / 1000) + "s";
      if (left <= 0 || !quiz) { clearInterval(tick); if (quiz && quiz.pos < quiz.questions.length) finishQuiz(true); }
    }, 250);
    quiz._timer = tick;
  }

  function answer(choice) {
    if (quiz.answered) return;
    quiz.answered = true;
    const q = quiz.questions[quiz.pos];
    const buttons = mount.querySelectorAll(".quiz-choice");
    buttons.forEach((b) => (b.disabled = true));
    buttons[choice].classList.add(choice === q.answer ? "correct" : "wrong");
    if (!quiz.isChallenge) buttons[q.answer].classList.add("correct");

    const right = choice === q.answer;
    if (right) quiz.correct += 1;
    G.award(right ? "answer_correct" : "answer_wrong");

    const feedback = document.getElementById("quiz-feedback");
    feedback.innerHTML =
      "<div class='quiz-explain'><strong>" + (right ? "✅ Correct!" : "❌ Not quite — the answer is " + LETTERS[q.answer] + ".") +
      "</strong><br>" + esc(q.explain) + "</div>";
    document.getElementById("quiz-next").style.visibility = "visible";
    document.getElementById("quiz-next").textContent = quiz.pos === quiz.questions.length - 1 ? "See results →" : "Next →";
    document.getElementById("quiz-next").focus();
  }

  function next() {
    quiz.pos += 1;
    quiz.answered = false;
    renderQuestion();
  }

  function finishQuiz(timeUp) {
    if (quiz._timer) clearInterval(quiz._timer);
    const total = quiz.questions.length;
    const pct = total ? Math.round((quiz.correct / total) * 100) : 0;
    const perfect = pct === 100 && total >= 5;
    G.award("quiz_complete", { perfect });
    if (quiz.isChallenge) G.award("challenge_complete");
    if (perfect) window.SB.ui.confetti(1800);

    const grade = pct === 100 ? "🏆 Flawless!" : pct >= 80 ? "🎉 Excellent!" : pct >= 60 ? "💪 Solid — keep going!" : "🌱 Every wrong answer taught you something.";

    mount.innerHTML =
      '<div class="card card-glass text-center pop-in" style="max-width:560px;margin-inline:auto;padding:2.5rem">' +
      '<div style="font-size:3rem">' + (pct >= 80 ? "🏅" : "🌱") + "</div>" +
      "<h2>" + grade + "</h2>" +
      "<p class='muted'>" + (timeUp ? "⏱️ Time's up! " : "") + "You scored <strong>" + quiz.correct + " / " + total + "</strong> (" + pct + "%) on <strong>" + esc(quiz.title) + "</strong>.</p>" +
      '<div class="stat-row mb-2">' +
      '<div class="stat-box"><strong>' + quiz.correct + "</strong><span>correct</span></div>" +
      '<div class="stat-box"><strong>' + pct + "%</strong><span>score</span></div>" +
      '<div class="stat-box"><strong>+' + (quiz.correct * 15 + 20) + "</strong><span>XP earned</span></div></div>" +
      '<div class="btn-row" style="justify-content:center">' +
      '<a class="btn btn-primary" href="' + location.pathname + location.search + '">Retry quiz</a>' +
      '<a class="btn btn-ghost" href="/quiz/">Pick another topic</a>' +
      '<a class="btn btn-ghost" href="/dashboard/">Dashboard →</a></div></div>';
    quiz = null;
    history.replaceState(null, "", "/quiz/");
  }

  /* ---------- boot ---------- */
  const topicId = params.get("topic");
  const challenge = params.get("challenge");
  if (challenge) {
    startQuiz(shuffle(allQuestions()).slice(0, 10), "⚡ Bonk Challenge: Speed Round", true);
  } else if (topicId) {
    const q = window.SB_DATA.quizzes.find((x) => x.id === topicId) || userQuizzes().find((x) => x.id === topicId);
    if (q) {
      const len = params.get("len");
      const questions = len === "all" ? shuffle(q.questions) : shuffle(q.questions).slice(0, Math.min(+(len || 5) || 5, q.questions.length));
      startQuiz(questions, q.title, false);
    } else renderStart();
  } else renderStart();
})();
