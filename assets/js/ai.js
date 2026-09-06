/* StudyBonk AI — a tiny-but-smart, fully local study tutor.
 *
 * Instant Mode: zero-download template intelligence with retrieval over the
 *   built-in knowledge base (420+ flashcards of real educational content),
 *   a flashcard generator, quiz builder, homework explainer, safe arithmetic,
 *   meme mode and productivity coaching. Runs offline on any device.
 * Model Mode: distilled, quantized LLMs (Qwen 2.5, Phi-3.5 Mini, Gemma 2)
 *   running in-browser via WebGPU with a WASM fallback — no API, no server,
 *   no data leaving the device. Engine shared via bonk-model.js
 *   (also powers the /flashcards/ AI importer).
 *
 * Chat history is stored encrypted (AES-GCM, device-local key) in
 * localStorage with a one-click Clear Memory. */
(function () {
  "use strict";
  const mount = document.getElementById("ai-app");
  if (!mount || !window.SB || !window.SB.model) return;
  const S = window.SB.storage;
  const G = window.SB.gamification;
  const M = window.SB.model;

  const SYSTEM_PROMPT = [
    "You are StudyBonk AI.",
    "You are tiny but smart.",
    "You explain things simply.",
    "You generate flashcards.",
    "You generate quizzes.",
    "You help students learn fast.",
    "You use memes when helpful.",
    "You are connected via the student's own OpenAI API key.",
    "Rules: stay on studying and learning topics — kindly redirect anything else.",
    "Keep answers short and structured with short lines and lists.",
    "If you are not sure of a fact, say so and tell the student to double-check — never invent dates, formulas, or numbers.",
    "Never ask for personal information.",
    "If asked to complete graded homework, teach the method instead of handing a paste-ready answer.",
    "Tone: encouraging, playful, slightly goofy. Your mascot is Bonk, a blue graduation-cap blob.",
  ].join("\n");

  /* ================= memory (encrypted local storage) ================= */

  async function loadHistory() {
    const enc = S.get("ai.history.enc", null);
    if (enc) {
      const plain = await window.SB.crypto.decryptString(enc);
      if (plain) { try { return JSON.parse(plain); } catch (e) { /* corrupted */ } }
    }
    return S.get("ai.history", []); // legacy plaintext fallback
  }
  async function saveHistory(history) {
    const enc = await window.SB.crypto.encryptString(JSON.stringify(history.slice(-40)));
    S.set("ai.history.enc", enc);
    S.remove("ai.history");
  }
  const mem = () => S.get("ai.memory", {});

  /* ================= chat UI ================= */

  const log = document.getElementById("chat-log");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const statusLine = document.getElementById("ai-status-line");

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function addMsg(role, html, actions) {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg " + (role === "user" ? "user" : "ai");
    const avatar = role === "user" ? "🧑‍🎓" : "<img src='/assets/img/logo.svg' alt='' width='26' height='26'>";
    let actionsHtml = "";
    if (actions && actions.length) {
      actionsHtml = '<div class="chat-actions">' + actions.map((a) =>
        '<a class="btn btn-ghost btn-sm" href="' + a.href + '">' + esc(a.label) + "</a>").join("") + "</div>";
    }
    wrap.innerHTML = '<div class="chat-avatar">' + avatar + '</div><div class="chat-bubble">' + html + actionsHtml + "</div>";
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement("div");
    wrap.className = "chat-msg ai";
    wrap.innerHTML = "<div class='chat-avatar'><img src='/assets/img/logo.svg' alt='' width='26' height='26'></div>" +
      "<div class='chat-bubble'><span class='chat-typing'><span></span><span></span><span></span></span></div>";
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return wrap;
  }

  const md = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");

  /* ================= Instant Mode brain ================= */

  function allCards() {
    return (window.SB_DATA ? window.SB_DATA.decks : []).flatMap((d) =>
      d.cards.map(([f, b]) => ({ deck: d.title, front: f, back: b, id: d.id }))
    );
  }

  function searchCards(query, limit) {
    const q = query.toLowerCase();
    const terms = q.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((t) => t.length > 3);
    const scored = [];
    for (const c of allCards()) {
      let score = 0;
      const hay = (c.front + " " + c.back).toLowerCase();
      for (const t of terms) if (hay.includes(t)) score += t.length;
      if (c.front.toLowerCase().includes(q) || hay.includes(q)) score += 50;
      if (score > 0) scored.push({ c, score });
    }
    return scored.sort((a, b) => b.score - a.score).slice(0, limit || 4).map((x) => x.c);
  }

  function safeMath(expr) {
    const clean = expr.replace(/[×x]/gi, "*").replace(/÷/g, "/").replace(/\^/g, "**").replace(/[^0-9+\-*/().%\s*]/g, "");
    if (!/[0-9]/.test(clean) || !/[+\-*/%]/.test(clean)) return null;
    try {
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict";return (' + clean + ")")();
      if (typeof val === "number" && isFinite(val)) {
        return "**" + expr.trim() + " = " + Math.round(val * 1e6) / 1e6 + "**\n\n(computed locally — no calculator API was harmed 🦊)";
      }
    } catch (e) { /* not math */ }
    return null;
  }

  const MEMES = [
    "your brain: *has 86 billion neurons* · also your brain: what's 7×8",
    "me and the boys studying at 11:58pm for a 8am exam 🕐",
    "POV: the formula you skipped is on the test. It's always on the test.",
    "grading rubric: 10% effort, 90% whether you labeled your units",
    "nothing hits harder than getting a flashcard right that you got wrong 3 times",
    "the syllabus said 'light review'. the syllabus lied.",
  ];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  const COACHES = [
    { name: "The 2-Minute Launch", body: "Commit to just two minutes of the task. Starting is the hard part; momentum does the rest. 9 times out of 10 you'll keep going past two minutes.", href: (window.SB_BASE || "/") + "focus/" },
    { name: "Pomodoro Protocol", body: "25 minutes on, 5 off, long break every 4 rounds. Small timed chunks make dreadful work survivable — and finishable.", href: (window.SB_BASE || "/") + "focus/" },
    { name: "Active Recall Switch", body: "Close the notes and make yourself produce answers from memory (flashcards, blank page brain dump). It feels harder because it's working.", href: "/flashcards/" },
    { name: "The One-Thing Rule", body: "Pick exactly one topic for today. Not 'study biology' — 'master the organelles'. Small targets get hit; vague ones get scrolled past.", href: (window.SB_BASE || "/") + "learn/" },
    { name: "Energy First", body: "Match tasks to energy: hard thinking when you're fresh, flashcard grinding when you're tired. Studying at 5% battery is mostly vibes.", href: (window.SB_BASE || "/") + "focus/" },
  ];

  function instantReply(raw) {
    const text = raw.trim();
    const lower = text.toLowerCase();
    const name = mem().name;
    const heyName = name ? name : "friend";

    /* -- identity / trust -- */
    if (/who (are|r) (you|u)|what are you|are you (real|ai|chatgpt|gpt)/i.test(lower)) {
      return { html: "I'm <strong>Bonk AI</strong> — StudyBonk's study tutor" + (name ? ", at your service, " + esc(name) : "") + ". I run <strong>100% inside your browser</strong>: no API, no account, no server, no data leaving this device. Small brain, big heart. 🦊", actions: [{ label: "How I work", href: (window.SB_BASE || "/") + "ai/#how-it-works" }] };
    }
    if (/private|track|data collect|spy|telemetr|do you store/i.test(lower)) {
      return { html: "Short answer: <strong>nothing leaves your device</strong>. Our chat is stored encrypted in your browser's local storage, and the Clear Memory button deletes it for good. There is no server — you can read the code, it's open-source.", actions: [{ label: "Privacy proof", href: (window.SB_BASE || "/") + "trust/" }, { label: "Privacy policy", href: (window.SB_BASE || "/") + "privacy/" }] };
    }
    if (/who made (you|studybonk)|creator|tuffy/i.test(lower)) {
      return { html: "<strong>TuffyCoder</strong> — an ethical developer who builds free, privacy-first tools for students and documents it all on YouTube. I'm the mascot-with-a-job of that mission.", actions: [{ label: "Meet the creator", href: (window.SB_BASE || "/") + "about/" }] };
    }
    if (/call me ([a-z0-9 ]{1,20})/i.test(lower)) {
      const nick = text.match(/call me ([a-z0-9 ]{1,20})/i)[1].trim();
      const m = mem(); m.name = nick; S.set("ai.memory", m);
      return { html: "Bonk! You're <strong>" + esc(nick) + "</strong> now. (Saved locally, deletable anytime — I keep no other notes about you.)" };
    }

    /* -- arithmetic -- */
    const mathExpr = text.replace(/^(what('s| is)|calculate|compute|solve)\s*/i, "");
    if (/^[\d\s+\-*/().%^×÷x]+$/i.test(mathExpr) && /[+\-*/%^×÷]/.test(mathExpr)) {
      const r = safeMath(mathExpr);
      if (r) return { html: md(r) };
    }

    /* -- flashcards -- */
    if (/flash\s?cards?|make.*(deck|cards)|turn.*(notes?|this)/i.test(lower)) {
      const topicMatch = text.match(/(?:about|on|for)\s+(.+)$/i);
      const topic = topicMatch ? topicMatch[1].trim() : null;
      if (topic && window.SB_DATA) {
        const deck = window.SB_DATA.decks.find((d) => d.title.toLowerCase().includes(topic.toLowerCase().slice(0, 12)));
        if (deck) {
          return {
            html: "Bonk! I found a ready-made deck: <strong>" + esc(deck.title) + "</strong> — " + deck.cards.length + " cards with spaced-repetition scheduling.\n\nSample:\n• <strong>" + esc(deck.cards[0][0]) + "</strong> → " + esc(deck.cards[0][1]),
            actions: [{ label: "Study this deck →", href: (window.SB_BASE || "/") + "flashcards/?deck=" + deck.id }],
          };
        }
      }
      if (topic && topic.split(/\s+/).length <= 5) {
        const starter = [
          ["What is " + topic + " (in your own words)?", "Write the definition from memory first — then check."],
          ["Why does " + topic + " matter?", "Connect it to the bigger topic it belongs to."],
          ["Give an example of " + topic, "One concrete example beats three abstract ones."],
          ["What do people usually get wrong about " + topic + "?", "Common misconception → name it and correct it."],
          ["How would you explain " + topic + " to a 10-year-old?", "If you can't simplify it, you haven't learned it yet."],
        ];
        const decks = S.get("userDecks", []);
        const id = "user-" + Date.now().toString(36);
        decks.push({ id, title: "Study starters: " + topic, topic: "Custom", cards: starter, custom: true });
        S.set("userDecks", decks);
        return {
          html: "Deck created! These are <strong>active-recall starters</strong> for '" + esc(topic) + "' — the kind of questions that force your brain to produce answers instead of recognizing them. Want cards from YOUR notes or a PDF? Use the instant importer on the flashcards page (it can even use a full local AI model).",
          actions: [{ label: "Open the deck →", href: (window.SB_BASE || "/") + "flashcards/?deck=" + id }, { label: "Instant importer (PDF → cards)", href: "/flashcards/" }],
        };
      }
      return { html: "Happy to make flashcards! Try:\n• <code>flashcards about the periodic table</code>\n• or paste your notes into the <strong>instant importer</strong> on the flashcards page — it handles PDFs, text files and URLs, with optional AI-powered generation.", actions: [{ label: "Open the importer →", href: "/flashcards/" }] };
    }

    /* -- quiz -- */
    if (/quiz|test me|practice questions?/i.test(lower)) {
      const topicMatch = text.match(/(?:on|about|for)\s+(.+)$/i);
      if (window.SB_DATA) {
        if (topicMatch) {
          const q = topicMatch[1].trim().toLowerCase();
          const quiz = window.SB_DATA.quizzes.find((x) => x.title.toLowerCase().includes(q.slice(0, 12)));
          if (quiz) {
            const sample = quiz.questions[0];
            return {
              html: "Found it: <strong>" + esc(quiz.title) + "</strong> — " + quiz.questions.length + " questions, every answer explained.\n\nWarm-up:\n" + md(sample.q) + "\n(No spoilers — answers are in the quiz.)",
              actions: [{ label: "Start this quiz →", href: (window.SB_BASE || "/") + "quiz/?topic=" + quiz.id }],
            };
          }
        }
        const topics = window.SB_DATA.pillars.map((p) => p.emoji + " " + p.title).join(" · ");
        return {
          html: "Let's do this. I have explained question banks for: " + md(topics) + ".\n\nTry <code>quiz me on algebra</code> — or hit a speed round if you're feeling bold.",
          actions: [{ label: "All quizzes", href: (window.SB_BASE || "/") + "quiz/" }, { label: "⚡ Speed round", href: (window.SB_BASE || "/") + "quiz/?challenge=1" }],
        };
      }
    }

    /* -- meme mode -- */
    if (/meme|funny|roast|brainrot|humor|joke/i.test(lower)) {
      return {
        html: pick([
          ".real. " + pick(MEMES) + "\n\nNow back to it — one more flashcard and then you may scroll. 🦊",
          "certified studying moment: " + pick(MEMES) + "\n\nThe grind recognizes the grind. Back to work, " + esc(heyName) + ". 💪",
        ]),
      };
    }

    /* -- coach mode -- */
    if (/procrast|motivat|lazy|can'?t (start|focus)|unfocus|distract|tired|burn ?out|overwhelm|stress|coach|pomodoro/i.test(lower)) {
      const c = pick(COACHES);
      return {
        html: "<strong>" + c.name + "</strong>\n" + c.body + "\n\nRule zero: lower the bar until it's impossible to fail. Two honest minutes count.",
        actions: [{ label: "Start a focus session →", href: c.href }],
      };
    }

    /* -- explain / homework: retrieval over the knowledge base -- */
    const matches = searchCards(text, 4);
    if (matches.length && /what|why|how|explain|define|difference|mean/i.test(lower)) {
      const found = matches.slice(0, 3).map((m) => "• <strong>" + esc(m.front) + "</strong> → " + esc(m.back)).join("\n");
      const deckId = matches[0].id;
      return {
        html: "Here's what our study guides say:\n\n" + found + "\n\nFor the full lesson (with examples, tips and a quiz), open the guide — and verify anything exam-critical against your own materials too. I'm a tiny brain; your textbook is the boss. 🦊",
        actions: [{ label: "Drill this topic →", href: (window.SB_BASE || "/") + "flashcards/?deck=" + deckId }, { label: "Quiz me on it", href: (window.SB_BASE || "/") + "quiz/?topic=" + deckId }],
      };
    }

    /* -- greetings -- */
    if (/^(hi|hey|hello|yo|sup|bonk|good (morning|evening|afternoon))\b/i.test(lower)) {
      return {
        html: "Hey" + (name ? " " + esc(name) : "") + "! 👋 Bonk AI here — tiny, smart, and living entirely in your browser. I can:\n\n• 🃏 <strong>generate flashcards</strong> from a topic or your notes\n• 🎯 <strong>build quizzes</strong> with explanations\n• 📚 <strong>explain concepts</strong> from our study guides\n• 🧠 coach you through procrastination\n• 😂 occasional memes (responsibly dosed)\n\nWhat are we bonking today?",
      };
    }

    /* -- default: structured homework-help template -- */
    const subject = text.replace(/^(explain|what is|how does|why (is|do|does)|help me (with|understand))\s*/i, "").trim();
    return {
      html: "Let's break down <strong>" + md(subject.slice(0, 80)) + "</strong> the Bonk way:\n\n**1. What is it?** Write the definition in one sentence — from memory if you can.\n**2. Why does it exist?** What problem does it solve, or what does it explain?\n**3. One example.** The smallest concrete example you can think of.\n**4. One non-example.** What looks similar but isn't it?\n**5. Common trap.** Where do people usually slip on this?\n\nAnswer those five and you understand it. I'm in Instant Mode (a few KB of brain 🦊) — for open-ended tutoring, enable a local model above, and double-check specifics against your textbook.",
    };
  }

  /* ================= Model Mode (shared engine in bonk-model.js) ================= */

  let activeMode = "instant";
  let busy = false;

  const modeSwitch = document.getElementById("ai-mode-switch");
  const modelPanel = document.getElementById("model-panel");
  const modelStatus = document.getElementById("model-status");

  function renderModelPanel() {
    modelStatus.innerHTML =
      '<div class="card card-glass model-card recommended" style="max-width:520px;margin-inline:auto;text-align:center;padding:2rem">' +
      '<div style="font-size:2.4rem">🦊</div>' +
      "<h3 style='margin:.4rem 0 .2rem'>Bonk AI — API Mode</h3>" +
      "<p class='small mb-1' style='color:var(--text-2)'>Connect your own <strong>free OpenAI API key</strong>. It is stored encrypted on your device and requests go straight from your browser to OpenAI — StudyBonk has no server in between.</p>" +
      '<div class="mt-2" style="text-align:left;max-width:420px;margin-inline:auto">' +
      '<p class="small" style="margin:0 0 .4rem"><strong>How to get a free API key:</strong></p>' +
      '<ol class="small" style="margin:0 0 .8rem;color:var(--text-2)">' +
      '<li>Create an account at <a href="https://platform.openai.com/signup" target="_blank" rel="noopener">platform.openai.com/signup</a></li>' +
      '<li>Open <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">platform.openai.com/api-keys</a></li>' +
      '<li>Click <strong>"Create new secret key"</strong> and copy it (starts with <code>sk-</code>)</li>' +
      '<li>Paste it below — done. New accounts get free trial credit.</li>' +
      "</ol></div>" +
      '<div class="btn-row" style="justify-content:center">' +
      '<input id="openai-key" type="password" placeholder="sk-..." autocomplete="off" style="flex:1;min-width:200px;padding:12px 16px;border-radius:12px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-family:var(--font-body)">' +
      '<button class="btn btn-primary" id="connect-openai" type="button">🔑 Connect key</button>' +
      "</div>" +
      '<p class="small mt-2 mb-0" id="connect-status" style="color:var(--text-2)"></p>' +
      "</div>";
    const btn = document.getElementById("connect-openai");
    if (btn) {
      btn.addEventListener("click", async () => {
        const input = document.getElementById("openai-key");
        const status = document.getElementById("connect-status");
        if (!input.value.trim()) { status.textContent = "Paste your API key first (it starts with sk-)."; return; }
        btn.disabled = true;
        status.textContent = "Verifying your key with OpenAI…";
        try {
          await M.setKey(input.value.trim());
          status.textContent = "✅ Key connected and stored encrypted on this device.";
          input.value = "";
          statusLine.textContent = "🌐 Bonk AI · API Mode · connected";
          addMsg("ai", "🌐 <strong>Bonk AI connected.</strong> Your OpenAI key is stored encrypted on this device and requests go straight to OpenAI. Full-power flashcards, quizzes and tutoring unlocked. Your key stays on this device only.");
        } catch (err) {
          status.textContent = "⚠️ " + (err && err.message ? err.message : "Connection failed");
        }
        btn.disabled = false;
      });
    }
  }

  async function loadModel() {
    if (busy) return;
    busy = true;
    try {
      await M.load(null, null);
      statusLine.textContent = "🌐 Bonk AI · API Mode · connected";
    } catch (err) {
      statusLine.textContent = "🌐 API Mode · not connected · open the panel to add your key";
    }
    busy = false;
  }

  async function modelReply(userText, history) {
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    if (mem().name) messages.push({ role: "system", content: "The student's preferred name is " + mem().name + "." });
    messages.push(...history.slice(-10), { role: "user", content: userText });
    return M.generate(messages, { temperature: 0.6, maxTokens: 420 });
  }

  /* ================= wiring ================= */

  async function handleSend(userText) {
    if (busy) { window.SB.ui.toast("Bonk is thinking… one sec 🦊", "info"); return; }
    busy = true;
    addMsg("user", md(userText));
    const history = await loadHistory();
    const typing = addTyping();

    const useModel = activeMode === "model" && (await M.isReady());
    let reply;
    try {
      if (useModel) {
        reply = await modelReply(userText, history);
      } else {
        await new Promise((r) => setTimeout(r, 220 + Math.random() * 240)); // tiny human-feel delay
        const res = instantReply(userText);
        typing.remove();
        addMsg("ai", res.html.replace(/\n/g, "<br>"), res.actions);
        history.push({ role: "user", content: userText }, { role: "assistant", content: res.html.replace(/<[^>]+>/g, "") });
        await saveHistory(history);
        G.award("ai_chat", { ai_pioneer: !S.get("ai.used", false) });
        S.set("ai.used", true);
        busy = false;
        return;
      }
    } catch (e) {
      reply = "Hmm, my model brain hiccuped. Falling back to Instant Mode…\n\n" + instantReply(userText).html;
    }

    typing.remove();
    addMsg("ai", md(reply));
    history.push({ role: "user", content: userText }, { role: "assistant", content: reply });
    await saveHistory(history);
    G.award("ai_chat", { ai_pioneer: !S.get("ai.used", false) });
    S.set("ai.used", true);
    busy = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    input.value = "";
    handleSend(v);
  });

  document.getElementById("quick-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".quick-chip");
    if (!chip) return;
    const label = chip.textContent.replace(/^[^\w]+/, "").trim();
    if (/Make flashcards|Quiz me|Explain|Meme|Coach/i.test(label)) {
      input.value = label.startsWith("Make") ? "Make flashcards about " : label.startsWith("Quiz") ? "Quiz me on " : label.startsWith("Explain") ? "Explain " : label === "Meme mode" ? "meme mode" : "Coach me";
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  });

  modeSwitch.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn) return;
    activeMode = btn.dataset.mode;
    modeSwitch.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    modelPanel.hidden = activeMode !== "model";
    if (activeMode === "model" && !(await M.isReady()) && !modelPanel.querySelector("#connect-openai")) renderModelPanel();
    statusLine.textContent = activeMode === "model"
      ? "🌐 API Mode · " + ((await M.isReady()) ? "connected" : "add your OpenAI key below")
      : "⚡ Instant Mode · runs offline · zero download";
  });

  document.getElementById("chat-clear").addEventListener("click", () => {
    if (!confirm("Clear all Bonk AI history on this device? This is instant and permanent.")) return;
    S.remove("ai.history.enc");
    S.remove("ai.history");
    S.remove("ai.memory");
    log.innerHTML = "";
    greet();
    window.SB.ui.toast("🗑️ Memory cleared — I remember nothing now.", "good");
  });

  document.getElementById("chat-export").addEventListener("click", () => {
    loadHistory().then((h) => {
      const blob = new Blob([JSON.stringify({ app: "StudyBonk", ai: "Bonk AI", exported: new Date().toISOString(), messages: h }, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "bonk-ai-chat.json";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  });

  async function greet() {
    const history = await loadHistory();
    const returning = history.length > 0;
    addMsg("ai", returning
      ? "Welcome back" + (mem().name ? ", <strong>" + esc(mem().name) + "</strong>" : "") + "! 🦊 Your last " + history.filter((m) => m.role === "user").length + " questions are still in local memory. What are we bonking today?"
      : "Hey, I'm <strong>Bonk AI</strong> 🦊 — a tiny-but-smart study tutor that runs <strong>entirely in your browser</strong>. No API, no account, no data leaving this device.\n\nInstant Mode is on: study coaching, quiz finding and homework breakdowns at zero download. Want full-power AI? Switch to <strong>API Mode</strong> and connect your own free OpenAI API key (takes about a minute — instructions in the panel).\n\nTry: <code>flashcards about cell biology</code>");
  }

  greet();
})();
