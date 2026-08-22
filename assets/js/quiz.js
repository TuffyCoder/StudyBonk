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
    html += '<div class="card card-glass mt-3 text-center"><h3>🥊 Bonk Challenge</h3><p class="muted">Speed round: 10 random questions, 60 seconds, explanations after the buzzer.</p><button class="btn btn-yellow" id="challenge-btn">Start speed round</button></div>';
    mount.innerHTML = html;
    document.getElementById("challenge-btn").onclick = () => startQuiz(shuffle(allQuestions()).slice(0, 10), "⚡ Bonk Challenge: Speed Round", true);
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
    const q = window.SB_DATA.quizzes.find((x) => x.id === topicId);
    if (q) {
      const len = params.get("len");
      const questions = len === "all" ? shuffle(q.questions) : shuffle(q.questions).slice(0, Math.min(+(len || 5) || 5, q.questions.length));
      startQuiz(questions, q.title, false);
    } else renderStart();
  } else renderStart();
})();
