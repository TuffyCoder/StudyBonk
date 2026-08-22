/* StudyBonk AI — a tiny-but-smart, fully local study tutor.
 *
 * Instant Mode: zero-download template intelligence with retrieval over the
 *   built-in knowledge base (420+ flashcards of real educational content),
 *   a flashcard generator, quiz builder, homework explainer, safe arithmetic,
 *   meme mode and productivity coaching. Runs offline on any device.
 * Model Mode: distilled, quantized LLMs (Qwen 2.5, Phi-3.5 Mini, Gemma 2)
 *   running in-browser via WebGPU (vendored WebLLM) with a WASM fallback
 *   (vendored Transformers.js + SmolLM2). No API. No data leaves the device.
 *
 * Chat history is stored encrypted (AES-GCM, device-local key) in
 * localStorage with a one-click Clear Memory.
 */
(function () {
  "use strict";
  const mount = document.getElementById("ai-app");
  if (!mount || !window.SB) return;
  const S = window.SB.storage;
  const G = window.SB.gamification;

  const SYSTEM_PROMPT = [
    "You are StudyBonk AI.",
    "You are tiny but smart.",
    "You explain things simply.",
    "You generate flashcards.",
    "You generate quizzes.",
    "You help students learn fast.",
    "You use memes when helpful.",
    "You run fully local.",
    "You use almost no RAM.",
    "Rules: stay on studying and learning topics — kindly redirect anything else.",
    "Keep answers short and structured with short lines and lists.",
    "If you are not sure of a fact, say so and tell the student to double-check — never invent dates, formulas, or numbers.",
    "Never ask for personal information.",
    "If asked to complete graded homework, teach the method instead of handing a paste-ready answer.",
    "Tone: encouraging, playful, slightly goofy. Your mascot is Bonk, a blue graduation-cap blob.",
  ].join("\n");

  const MODELS = [
    { key: "lite",  name: "Bonk Lite",  emoji: "🐤", id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",       ram: "~600 MB RAM · 400 MB download", note: "Fits most laptops & phones" },
    { key: "core",  name: "Bonk Core",  emoji: "🧠", id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",       ram: "~1.2 GB RAM · 900 MB download", note: "The daily driver", recommended: true },
    { key: "pro",   name: "Bonk Pro",   emoji: "🎓", id: "Phi-3.5-mini-instruct-q4f16_1-MLC",       ram: "~2.6 GB RAM · 2.2 GB download", note: "Maximum brain (desktop)" },
    { key: "gemma", name: "Bonk Gemma", emoji: "💎", id: "gemma-2-2b-it-q4f16_1-MLC",               ram: "~1.7 GB RAM · 1.4 GB download", note: "Google's little gem" },
  ];

  /* ================= memory (encrypted local storage) ================= */

  async function loadHistory() {
    const enc = S.get("ai.history.enc", null);
    if (enc) {
      const plain = await window.SB.crypto.decryptString(enc);
      if (plain) { try { return JSON.parse(plain); } catch { /* corrupted */ } }
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
    } catch { /* not math */ }
    return null;
  }

  function makeCardsFromText(text, topic) {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 10);
    const cards = [];
    for (const line of lines) {
      const words = line.split(/\s+/);
      const key = words.filter((w) => /^[A-Z]/.test(w) && w.length > 3).sort((a, b) => b.length - a.length)[0];
      if (key && line.includes(key)) {
        cards.push([line.replace(new RegExp("\\b" + key + "\\b"), "______"), key.replace(/[.,]$/, "")]);
      } else if (words.length > 6) {
        const h = words[Math.floor(words.length / 2)].replace(/[.,]$/, "");
        if (h.length > 3) cards.push([line.replace(h, "______"), h]);
      }
      if (cards.length >= 8) break;
    }
    if (cards.length < 3) return null;
    return { title: topic || "Custom deck", cards };
  }

  function deckAction(cards) {
    const id = "user-" + Date.now().toString(36);
    const decks = S.get("userDecks", []);
    decks.push({ id, title: cards.title, topic: "Custom", cards: cards.cards, custom: true });
    S.set("userDecks", decks);
    return { label: "Open your new deck →", href: "/flashcards/?deck=" + id };
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
    {
      name: "The 2-Minute Launch",
      body: "Commit to just two minutes of the task. Starting is the hard part; momentum does the rest. 9 times out of 10 you'll keep going past two minutes.",
      href: "/focus/",
    },
    {
      name: "Pomodoro Protocol",
      body: "25 minutes on, 5 off, long break every 4 rounds. Small timed chunks make dreadful work survivable — and finishable.",
      href: "/focus/",
    },
    {
      name: "Active Recall Switch",
      body: "Close the notes and make yourself produce answers from memory (flashcards, blank page brain dump). It feels harder because it's working.",
      href: "/flashcards/",
    },
    {
      name: "The One-Thing Rule",
      body: "Pick exactly one topic for today. Not 'study biology' — 'master the organelles'. Small targets get hit; vague ones get scrolled past.",
      href: "/learn/",
    },
    {
      name: "Energy First",
      body: "Match tasks to energy: hard thinking when you're fresh, flashcard grinding when you're tired. Studying at 5% battery is mostly vibes.",
      href: "/focus/",
    },
  ];

  function instantReply(raw) {
    const text = raw.trim();
    const lower = text.toLowerCase();
    const name = mem().name;
    const heyName = name ? name : "friend";

    /* -- identity / trust -- */
    if (/who (are|r) (you|u)|what are you|are you (real|ai|chatgpt|gpt)/i.test(lower)) {
      return { html: "I'm <strong>Bonk AI</strong> — StudyBonk's study tutor" + (name ? ", at your service, " + esc(name) : "") + ". I run <strong>100% inside your browser</strong>: no API, no account, no server, no data leaving this device. Small brain, big heart. 🦊", actions: [{ label: "How I work", href: "/ai/#how-it-works" }] };
    }
    if (/private|track|data collect|spy|telemetr|do you store/i.test(lower)) {
      return { html: "Short answer: <strong>nothing leaves your device</strong>. Our chat is stored encrypted in your browser's local storage, and the Clear Memory button deletes it for good. There is no server — you can read the code, it's open-source.", actions: [{ label: "Privacy proof", href: "/trust/" }, { label: "Privacy policy", href: "/privacy/" }] };
    }
    if (/who made (you|studybonk)|creator|tuffy/i.test(lower)) {
      return { html: "<strong>TuffyCoder</strong> — an ethical developer who builds free, privacy-first tools for students and documents it all on YouTube. I'm the mascot-with-a-job of that mission.", actions: [{ label: "Meet the creator", href: "/about/" }] };
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
            actions: [{ label: "Study this deck →", href: "/flashcards/?deck=" + deck.id }],
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
        const action = deckAction({ title: "Study starters: " + topic, cards: starter });
        return {
          html: "Deck created! These are <strong>active-recall starters</strong> for \"" + esc(topic) + "\" — the kind of questions that force your brain to produce answers instead of recognizing them. Edit or add cards in the deck tool.\n\nWant factual cards? Try one of our topic guides — they have ready-made decks.",
          actions: [action, { label: "Browse topic decks", href: "/flashcards/" }],
        };
      }
      const fromNotes = makeCardsFromText(text.replace(/^[^:]*:/, ""), topic || "Pasted notes");
      if (fromNotes) {
        const action = deckAction(fromNotes);
        return {
          html: "Bonk! I pulled <strong>" + fromNotes.cards.length + " cloze-style cards</strong> out of your text (key terms blanked out — the strongest card format for memorization). Saved to your decks.",
          actions: [action, { label: "All decks", href: "/flashcards/" }],
        };
      }
      return { html: "Happy to make flashcards! Try:\n• <code>flashcards about the periodic table</code>\n• or paste your notes and say <code>make flashcards</code>", };
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
              actions: [{ label: "Start this quiz →", href: "/quiz/?topic=" + quiz.id }],
            };
          }
        }
        const topics = window.SB_DATA.pillars.map((p) => p.emoji + " " + p.title).join(" · ");
        return {
          html: "Let's do this. I have explained question banks for: " + md(topics) + ".\n\nTry <code>quiz me on algebra</code> — or hit a speed round if you're feeling bold.",
          actions: [{ label: "All quizzes", href: "/quiz/" }, { label: "⚡ Speed round", href: "/quiz/?challenge=1" }],
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
        actions: [{ label: "Drill this topic →", href: "/flashcards/?deck=" + deckId }, { label: "Quiz me on it", href: "/quiz/?topic=" + deckId }],
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

  /* ================= Model Mode (WebLLM / Transformers.js) ================= */

  let engine = null;       // webllm engine
  let hfPipe = null;       // transformers.js pipeline
  let activeMode = "instant";
  let engineKind = null;   // "webgpu" | "wasm"
  let busy = false;

  const modeSwitch = document.getElementById("ai-mode-switch");
  const modelPanel = document.getElementById("model-panel");
  const modelStatus = document.getElementById("model-status");

  function hasWebGPU() {
    return !!navigator.gpu;
  }

  function renderModelPanel() {
    const webgpu = hasWebGPU();
    let cards = MODELS.map((m) => {
      const rec = m.recommended ? '<span class="model-tag chip chip-yellow">recommended</span>' : "";
      return (
        '<button class="card model-card' + (m.recommended ? " recommended" : "") + '" data-model="' + m.key + '" type="button">' + rec +
        '<div class="model-emoji">' + m.emoji + "</div><h3>" + m.name + "</h3>" +
        '<p class="small muted mb-1">' + m.note + "</p>" +
        '<div class="model-ram">' + m.ram + "</div></button>"
      );
    }).join("");
    modelStatus.innerHTML =
      "<h3>Pick a local model</h3>" +
      "<p class='small muted'>Distilled + quantized (Q4) models streamed once, cached forever, run on <strong>your</strong> " +
      (webgpu ? "GPU (WebGPU detected 🚀)" : "device. WebGPU not detected — a slower WASM fallback (SmolLM2 360M) will be used, or stick with Instant Mode.") + "</p>" +
      '<div class="model-cards">' + cards + "</div>" +
      '<div class="progress-track mt-2" id="dl-bar" hidden><div></div></div>' +
      '<p class="small muted mt-1 mb-0" id="dl-text"></p>';
    modelPanel.querySelectorAll("[data-model]").forEach((btn) => {
      btn.addEventListener("click", () => loadModel(btn.dataset.model));
    });
  }

  async function loadModel(key) {
    if (busy) return;
    busy = true;
    const bar = document.getElementById("dl-bar");
    const txt = document.getElementById("dl-text");
    const m = MODELS.find((x) => x.key === key);
    try {
      if (hasWebGPU()) {
        txt.textContent = "Loading Bonk's WebGPU engine…";
        bar.hidden = false;
        const webllm = await import("/assets/vendor/webllm.js");
        engine = await webllm.CreateMLCEngine(m.id, {
          initProgressCallback: (p) => {
            bar.firstElementChild.style.width = Math.round((p.progress || 0) * 100) + "%";
            txt.textContent = p.text || "Downloading & compiling…";
          },
        });
        engineKind = "webgpu";
        txt.textContent = "✅ " + m.name + " ready — running locally on your GPU.";
      } else {
        txt.textContent = "No WebGPU — falling back to WASM (SmolLM2 360M)…";
        bar.hidden = false;
        bar.firstElementChild.style.width = "35%";
        const tr = await import("/assets/vendor/transformers.js.mjs");
        tr.env.allowLocalModels = false;
        if (tr.env.backends && tr.env.backends.onnx && tr.env.backends.onnx.wasm) {
          tr.env.backends.onnx.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/dist/";
        }
        hfPipe = await tr.pipeline("text-generation", "onnx-community/SmolLM2-360M-Instruct", {
          dtype: "q8",
          progress_callback: (p) => {
            if (p.status === "progress" && p.total) {
              bar.firstElementChild.style.width = Math.round((p.loaded / p.total) * 100) + "%";
              txt.textContent = "Downloading model chunk " + p.file + "…";
            }
          },
        });
        engineKind = "wasm";
        txt.textContent = "✅ WASM model ready — smaller brain, same privacy.";
      }
      statusLine.textContent = "🧠 " + m.name + " · local model · cached for offline";
      addMsg("ai", "🧠 <strong>" + m.name + " online.</strong> A whole language model, running inside this tab — no API, no server. Ask me anything study-shaped. (I'm small: I'll flag what you should double-check.)");
    } catch (err) {
      engine = null; hfPipe = null; engineKind = null;
      txt.textContent = "⚠️ Couldn't load the model (" + (err && err.message ? err.message.slice(0, 120) : "unknown error") + "). Instant Mode still works perfectly.";
      statusLine.textContent = "⚡ Instant Mode · model load failed · still fully local";
    }
    busy = false;
  }

  async function modelReply(userText, history) {
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
    const memory = mem().name ? [{ role: "system", content: "The student's preferred name is " + mem().name + "." }] : [];
    messages.push(...memory, ...history.slice(-10), { role: "user", content: userText });

    if (engine && engineKind === "webgpu") {
      let out = "";
      const chunks = await engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.6,
        max_tokens: 420,
      });
      for await (const chunk of chunks) {
        const delta = chunk.choices[0]?.delta?.content || "";
        out += delta;
      }
      return out.trim() || "…my brain glitched. Try again?";
    }
    if (hfPipe && engineKind === "wasm") {
      const out = await hfPipe(messages, { max_new_tokens: 260, do_sample: true, temperature: 0.6 });
      const text = Array.isArray(out) ? out[0].generated_text : out.generated_text;
      // pipeline returns full chat text; strip prompt echoes
      const str = Array.isArray(text) ? text[text.length - 1].content : String(text);
      const cleaned = str.split("<|im_end|>")[0].trim();
      return cleaned || "…WASM brain sputtered. Try again?";
    }
    throw new Error("no engine");
  }

  /* ================= wiring ================= */

  async function handleSend(userText) {
    if (busy) { window.SB.ui.toast("Bonk is thinking… one sec 🦊", "info"); return; }
    busy = true;
    addMsg("user", md(userText));
    const history = await loadHistory();
    const typing = addTyping();

    const useModel = activeMode === "model" && (engine || hfPipe);
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
    } catch {
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

  modeSwitch.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mode]");
    if (!btn) return;
    activeMode = btn.dataset.mode;
    modeSwitch.querySelectorAll("button").forEach((b) => {
      const on = b === btn;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", String(on));
    });
    modelPanel.hidden = activeMode !== "model";
    if (activeMode === "model" && !engine && !hfPipe) renderModelPanel();
    statusLine.textContent = activeMode === "model"
      ? "🧠 Model mode · " + (engine || hfPipe ? "ready" : "pick a model below") + " · runs locally, cached offline"
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
      : "Hey, I'm <strong>Bonk AI</strong> 🦊 — a tiny-but-smart study tutor that runs <strong>entirely in your browser</strong>. No API, no account, no data leaving this device.\n\nInstant Mode is on: flashcard generation, quiz building, homework breakdowns and study coaching at zero download. Want a real language model instead? Switch to <strong>Full Model</strong> — a quantized Qwen/Phi/Gemma brain that runs locally via WebGPU.\n\nTry: <code>flashcards about cell biology</code>");
  }

  greet();
})();
