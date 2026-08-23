"""Copy for core (non-pillar) pages: home, learn hub, tools, about, trust,
security, FAQ framing, 404. Consumed by scripts/build.py."""

REPO = "https://github.com/TuffyCoder/StudyBonk"

HOME = {
    "hero_title": "Bonk your brain into shape.",
    "hero_sub": (
        "The 100% free, 100% private study platform. Flashcards with spaced "
        "repetition, practice quizzes, a focus timer, Duolingo-style XP and "
        "streaks, and a local AI tutor that runs entirely inside your "
        "browser. No sign-up. No ads. No tracking. Ever."
    ),
    "how_title": "How StudyBonk works",
    "how_sub": (
        "Three steps, zero accounts. Everything happens on your device and "
        "saves right in your browser."
    ),
    "how_steps": [
        {
            "emoji": "1️⃣",
            "title": "Pick a topic",
            "body": (
                "Choose from free guides covering math, biology, chemistry, "
                "physics, history, SAT prep and study skills — or jump "
                "straight into flashcards and quizzes."
            ),
        },
        {
            "emoji": "2️⃣",
            "title": "Study with bonks",
            "body": (
                "Flip flashcards, answer quizzes with instant explanations, "
                "and run focus sessions. Every rep earns XP and feeds your "
                "streak."
            ),
        },
        {
            "emoji": "3️⃣",
            "title": "Level up",
            "body": (
                "Finish daily quests, keep your streak alive, unlock badges "
                "and climb from Bonk Novice to Bonk Legend. Progress saves "
                "locally — automatically."
            ),
        },
    ],
    "gamification_title": "Studying that feels like a game (because it is one)",
    "gamification_sub": (
        "Motivation is the missing feature in most study tools. StudyBonk "
        "borrows the psychology that makes language apps sticky and aims it "
        "at your actual syllabus."
    ),
    "gamification_points": [
        ("⚡", "XP for everything", "Every card, correct answer and focus session earns XP — with a 2× Daily Boost to kick off your day."),
        ("🔥", "Streaks with freezes", "Study daily to build your streak. Miss a day? A streak freeze (max 2) has your back."),
        ("🎯", "Daily quests", "Three fresh quests every day plus a weekly 500 XP challenge keep sessions focused."),
        ("🏅", "Badges & levels", "Fifteen achievements and eleven levels from Bonk Novice to Bonk Legend."),
        ("🥊", "Bonk Challenges", "Timed speed rounds for when you want to turn practice into a boss fight."),
        ("🌙", "Dark mode built in", "Study at 2am without searing your retinas. One tap toggles light/dark."),
    ],
    "ai_title": "Meet Bonk AI — tiny, smart, and it never phones home",
    "ai_sub": (
        "Most \"AI study apps\" ship your questions to a server. Bonk AI runs "
        "a distilled, quantized language model (1–2B parameters) directly in "
        "your browser using WebGPU — no API, no account, no data leaving "
        "your device. Instant Mode works on any hardware with zero download."
    ),
    "ai_points": [
        ("🃏", "Flashcard generator", "Type a topic, get a deck. Saved locally, ready to drill."),
        ("🎯", "Quiz generator", "Auto-built practice sets with an answer key."),
        ("📚", "Homework explainer", "Structured breakdowns: definition, steps, example, self-check."),
        ("😂", "Meme mode", "Study help with the correct amount of brainrot. Responsibly dosed."),
        ("🧠", "Productivity coach", "Pomodoro plans, anti-procrastination scripts, energy management."),
        ("🔒", "Zero telemetry", "Your chats live in local storage on your device. One click clears them forever."),
    ],
    "faq_title": "Questions students actually ask",
}

LEARN = {
    "meta_title": "Free Study Guides by Topic — Learn Hub | StudyBonk",
    "meta_description": "Browse free study guides, flashcards and quizzes by topic: math, biology, chemistry, physics, history, SAT prep and study skills. No sign-up, no ads.",
    "h1": "Free Study Guides by Topic",
    "lead": (
        "Seven topic pillars, dozens of deep-dive guides, hundreds of "
        "flashcards and practice questions. Every guide includes plain-English "
        "lessons, worked examples, key terms, study tips and a mini quiz. "
        "Pick your battlefield."
    ),
    "how_to_use_title": "How to use a StudyBonk topic cluster",
    "how_to_use": [
        ("Read the cluster guide", "Skim the lesson sections — short paragraphs, zero fluff, worked examples for the hard parts."),
        ("Drill the key terms", "Every guide ships a matching flashcard deck with spaced repetition scheduling."),
        ("Take the mini quiz", "Instant feedback with explanations for every answer choice."),
        ("Earn XP and repeat", "Your reps feed streaks, quests and levels across all topics."),
    ],
}

TOOL_PAGES = {
    "flashcards": {
        "path": "/flashcards/",
        "nav": "Flashcards",
        "meta_title": "Free Flashcard Maker & Spaced Repetition | StudyBonk",
        "meta_description": "Free online flashcards with spaced repetition: built-in decks for every topic or create your own. No sign-up, works offline, 100% private.",
        "h1": "Free Flashcards That Actually Stick",
        "lead": (
            "Flip, recall, repeat. StudyBonk flashcards pair active recall "
            "with a Leitner spaced-repetition schedule, so cards you're "
            "about to forget come back exactly when you need them. Use "
            "built-in decks for any topic or build your own in seconds."
        ),
        "keywords": [
            "free flashcards",
            "flashcard maker",
            "spaced repetition",
            "online flashcards no sign up",
            "study flashcards",
            "active recall tool",
        ],
        "longtail": [
            "best free flashcard app without account",
            "how to make flashcards online for free",
            "spaced repetition flashcards free no subscription",
            "convert pdf to flashcards free online",
            "turn notes into flashcards automatically",
            "how does the leitner system work",
            "flashcards that work offline in browser",
            "how many flashcards should i study per day",
            "free alternative to quizlet flashcards",
            "private flashcard app no tracking",
            "how to study flashcards effectively",
            "make flashcards from a website url free",
            "flashcard generator from text free no signup",
            "create custom flashcard decks and export them",
        ],
        "sections": [
            {
                "h2": "Built-in decks for every topic",
                "paras": [
                    "Every topic guide on StudyBonk ships with a matching flashcard deck — key terms, formulas, dates and concepts, written to be quizzable, not just readable. Open the deck library, pick a topic, and start flipping.",
                    "Decks are organized by pillar (math, biology, chemistry, physics, history, SAT prep, study skills), so you can always find the deck that matches what's on tomorrow's test.",
                ],
                "bullets": [
                    "One deck per topic guide, dozens of decks in total",
                    "Flip with click, tap, or the space bar",
                    "Rate each card Again / Hard / Good / Easy",
                    "Scheduling is automatic — due cards surface first",
                ],
            },
            {
                "h2": "Spaced repetition without the setup",
                "paras": [
                    "StudyBonk uses the Leitner system: every card lives in a box (1–6). Answer well and the card moves up a box and comes back later; forget it and it drops back to box one. The result is the forgetting curve being interrupted at exactly the right moments.",
                    "Your box positions and due dates are saved locally in your browser, so your schedule follows you between sessions on the same device — no account required.",
                ],
                "bullets": [
                    "Box intervals: today → 1 day → 3 days → 7 days → 16 days → 35 days",
                    "\"Again\" always resets a card to box one",
                    "Due cards are shuffled to the front of each session",
                    "Everything stores locally — private by default",
                ],
            },
            {
                "h2": "Instant importer: PDF, notes or URL to flashcards",
                "paras": [
                    "Got a lecture PDF, messy notes, or an article open in another tab? Drop it into the instant importer and StudyBonk builds a deck on the spot — no account, no upload, no waiting. The PDF is parsed entirely inside your browser; the file never leaves your device.",
                    "The importer recognizes the formats students actually use: “term | definition” lines, “Q:/A:” pairs, “term - definition” lists, and definition sentences (“Osmosis is…”). When the text has no clear structure, it falls back to cloze cards — the sentence with its key term blanked out, which is one of the strongest memory formats there is.",
                ],
                "bullets": [
                    "Upload a PDF (up to 60 pages, parsed locally), .txt, .md or .csv",
                    "Paste any text — notes, chapters, vocab lists",
                    "Fetch a URL directly (works where sites allow cross-site reading)",
                    "Automatic format detection: pipes, Q/A, definitions, cloze",
                    "Every imported deck is saved locally, exportable as JSON",
                ],
            },
            {
                "h2": "Build your own decks (and keep them)",
                "paras": [
                    "Paste your notes as \"front | back\" lines and StudyBonk builds a custom deck instantly. Custom decks live in your browser alongside your progress, and you can export them as JSON to back up or share with a friend — the file goes device to device, never through a server.",
                ],
                "bullets": [
                    "Create decks from \"front | back\" lines in seconds",
                    "Export and import any deck as a JSON file",
                    "Custom decks earn the Deck Builder badge",
                    "Delete anything, any time — it's your data",
                ],
            },
        ],
        "faqs": [
            ("Are StudyBonk flashcards really free?",
             "Yes — every deck, every feature, no premium tier hiding behind the good parts. StudyBonk has no ads and no paywalls, and the code is open-source so you can verify that."),
            ("Do I need an account to save my flashcard progress?",
             "No. There are no accounts. Your decks, box positions and due dates are saved in your browser's local storage on your device."),
            ("Do flashcards work offline?",
             "Yes. After your first visit, the whole app is cached and works offline — flashcards included. Changes save locally and sync nowhere, because there's nothing to sync to."),
            ("What's better: flashcards or re-reading notes?",
             "Flashcards, by a wide margin — the research on the testing effect is unambiguous. Re-reading feels productive but builds familiarity, not recall. Flashcards force retrieval, which is what strengthens memory."),
            ("Can I turn a PDF into flashcards?",
             "Yes — the instant importer on the flashcards page accepts PDFs up to 60 pages, parses them locally in your browser (the file is never uploaded anywhere), and converts the text into a deck automatically. Text-based PDFs work best; scanned images without a text layer can't be read locally, so copy-paste those."),
            ("Can I share a custom deck with a friend?",
             "Yes — export it as a JSON file and send it however you like (chat, email, USB stick). The file is plain data your friend imports into their own StudyBonk."),
        ],
    },
    "quiz": {
        "path": "/quiz/",
        "nav": "Quiz",
        "meta_title": "Free Practice Quizzes with Explanations | StudyBonk",
        "meta_description": "Free online practice quizzes for math, science, history and SAT prep — every answer explained. Instant scoring, XP rewards, no sign-up required.",
        "h1": "Free Practice Quizzes That Explain Every Answer",
        "lead": (
            "A score at the end teaches you nothing. StudyBonk quizzes give "
            "instant feedback on every question with a full explanation of "
            "why the right answer is right — so every wrong answer becomes "
            "a lesson instead of a bruise."
        ),
        "keywords": [
            "free practice quiz",
            "online quiz with explanations",
            "test practice questions",
            "study quiz",
            "practice test free",
            "quiz maker for students",
        ],
        "longtail": [
            "free online quizzes with answer explanations",
            "practice quizzes that explain why answers are right",
            "best free quiz app for students no login",
            "turn a pdf into a quiz with ai free",
            "generate quiz from text online free",
            "how to practice for tests without paying",
            "math practice quiz with step by step solutions",
            "biology practice questions with explanations free",
            "history quiz questions for students free",
            "SAT practice questions with explanations",
            "how to learn from wrong answers on practice tests",
            "gamified quiz app with XP and streaks free",
            "ai quiz generator from notes offline",
            "make a quiz from a website article free",
        ],
        "sections": [
            {
                "h2": "Bonk AI quiz maker: PDF, notes or URL to quiz",
                "paras": [
                    "Upload a lecture PDF, paste your notes, or drop in an article URL, and Bonk AI — a real language model running entirely inside your browser — writes a multiple-choice quiz with four options per question and a one-line explanation for every answer. The PDF is parsed on your device and never uploaded anywhere.",
                    "Imported quizzes are saved locally and listed under \"Your Bonk AI quizzes\" so you can retake them any time, share via export, or delete with one click. Without the model, a True/False generator keeps the feature working on any device.",
                ],
                "bullets": [
                    "Paste text, upload a PDF (up to 60 pages) or fetch a URL",
                    "6–10 AI-written questions with plausible wrong answers",
                    "Every question ships with an explanation",
                    "Saved locally — retake, replay, yours forever",
                    "True/False fallback when the model isn't loaded",
                ],
            },
            {
                "h2": "Question banks for every topic",
                "paras": [
                    "Every topic guide contributes its practice questions to the quiz engine. Pick a topic — algebra, cells, the Cold War, SAT grammar, memory techniques — choose your quiz length, and go.",
                    "Questions are written to test understanding, not trivia: wrong answer choices are the classic mistakes, and each explanation addresses why the trap answer is tempting.",
                ],
                "bullets": [
                    "Pick any topic, any length (5, 10, or full bank)",
                    "Instant feedback — no waiting for the end",
                    "Explanations written like a tutor, not an answer key",
                    "XP for every correct answer, even a little for wrong ones",
                ],
            },
            {
                "h2": "Why instant feedback beats end-of-test scoring",
                "paras": [
                    "When you see why an answer is wrong while the question is still warm in your head, the correction lands in long-term memory. Delay the feedback until the end of the test and the lesson is already fading.",
                    "That's why StudyBonk reveals each answer immediately — and why getting one wrong isn't punished, it's paid: wrong answers earn a small XP reward too, because a corrected mistake is one of the best teachers you have.",
                ],
                "bullets": [
                    "Feedback within a second of answering",
                    "Trap answers called out in the explanation",
                    "Perfect scores unlock the Flawless badge",
                    "Retry any quiz — questions reshuffle every time",
                ],
            },
            {
                "h2": "Bonk Challenges: quizzes as boss fights",
                "paras": [
                    "Want pressure? Bonk Challenges are timed speed rounds — ten questions, sixty seconds, no explanations until the end. They're the closest thing to exam-day time pressure you can practice in a browser.",
                ],
                "bullets": [
                    "Speed round: 10 questions, 60 seconds",
                    "Memory sprint: 20 flashcards as fast as you can",
                    "Challenge completions earn the Challenger badge",
                    "Leader of your own scoreboard — it's just you vs. you",
                ],
            },
        ],
        "faqs": [
            ("Can AI turn my PDF into a quiz?",
             "Yes — the Bonk AI quiz maker on this page accepts PDFs (parsed locally on your device), pasted text and URLs, and generates a multiple-choice quiz with explanations. One-time ~874 MB model download, cached for offline use after that. No model? A True/False generator still works."),
            ("Are the quizzes free and unlimited?",
             "Yes. Take any quiz, any number of times, forever free. No streak-gates, no hearts that run out, no paywall disguised as a \"premium question bank\"."),
            ("Where do the questions come from?",
             "They're written alongside each StudyBonk topic guide by the site's author, with wrong answers modeled on real student mistakes. Everything is open-source and viewable on GitHub."),
            ("Can quizzes help if I keep scoring low?",
             "Low scores are diagnostic gold: they show exactly which cluster guide to re-read. Open the matching guide, drill its flashcard deck for a day, then retake the quiz."),
            ("Does the quiz tool track my scores?",
             "Your scores and XP save locally in your browser for your dashboard. Nothing is sent to any server — there is no server."),
        ],
    },
    "focus": {
        "path": "/focus/",
        "nav": "Focus",
        "meta_title": "Free Pomodoro Focus Timer for Studying | StudyBonk",
        "meta_description": "A free pomodoro focus timer with a study mascot, session XP and streak rewards. 25/5 cycles, dark mode, works offline. No sign-up needed.",
        "h1": "The Focus Timer That Makes Starting Easy",
        "lead": (
            "The hardest part of studying is the first four minutes. The "
            "StudyBonk focus timer uses the pomodoro technique — 25 minutes "
            "on, 5 off — and celebrates every session you finish, because a "
            "completed pomodoro is a habit rep, not just a chunk of time."
        ),
        "keywords": [
            "pomodoro timer",
            "focus timer free",
            "study timer online",
            "25 minute timer",
            "pomodoro technique",
            "study focus app",
        ],
        "longtail": [
            "best free pomodoro timer for students",
            "how long should pomodoro sessions be for studying",
            "free online focus timer no sign up",
            "pomodoro timer that works offline",
            "how to stop procrastinating and start studying",
            "why does the pomodoro technique work",
            "study timer with breaks and rewards",
            "dark mode pomodoro timer free",
            "how many pomodoros should i do per day",
            "focus timer that gives you xp for studying",
        ],
        "sections": [
            {
                "h2": "Pomodoro, bonked",
                "paras": [
                    "The timer runs the classic cycle: 25-minute focus blocks, 5-minute short breaks, and a 15-minute long break after four rounds. The dial fills as you go, and Bonk the mascot gets visibly more hyped the longer you stay on task.",
                    "Finish a session and it counts: +25 XP, quest progress, streak fuel. You can adjust every duration in settings if your brain runs on 50/10 cycles instead — the technique should fit you, not the reverse.",
                ],
                "bullets": [
                    "Classic 25/5/15 cycle, fully adjustable",
                    "Long break after every 4 focus sessions",
                    "+25 XP per completed session",
                    "Gentle chime at transitions — no jarring alarms",
                ],
            },
            {
                "h2": "Why pomodoro works (the 30-second science)",
                "paras": [
                    "Two reasons. First, a timer converts \"study all evening\" (vague, dreadful) into \"25 minutes\" (specific, survivable) — and starting is where procrastination actually lives. Second, scheduled breaks stop the fake-break spiral where you 'rest' for 45 minutes because you never officially started resting.",
                    "The technique also matches how attention actually behaves: alertness cycles over roughly 20–30 minute windows. Working with the wave beats paddling against it.",
                ],
                "bullets": [
                    "Small, timed commitments defeat task dread",
                    "Breaks become official — and therefore finite",
                    "Matches natural attention cycles (~25 minutes)",
                    "Finished sessions stack into streaks and levels",
                ],
            },
        ],
        "faqs": [
            ("Is this pomodoro timer free?",
             "Completely free, no account, no ads, works offline after first load. It's open-source, like everything else on StudyBonk."),
            ("Can I change the 25-minute duration?",
             "Yes — focus, short break, and long break durations are all adjustable in settings, and your preferences save locally in your browser."),
            ("What happens if I close the tab mid-session?",
             "The timer runs while the tab is open. Close it and the session pauses; the honest move is starting a fresh pomodoro — a session only earns XP when it completes."),
            ("How many pomodoros should I do per day?",
             "Start with 4–6 (about 2–3 focused hours) and scale up. Elite study days are built from a dozen; burnout days are built from pretending twenty is a goal."),
        ],
    },
    "dashboard": {
        "path": "/dashboard/",
        "nav": "Dashboard",
        "meta_title": "Your Study Dashboard — XP, Streaks & Quests | StudyBonk",
        "meta_description": "Track XP, level, streaks, daily quests, badges and study activity — all stored privately in your browser. Free study dashboard, no account needed.",
        "h1": "Your Study Dashboard",
        "lead": (
            "Every card you flip, question you answer and focus session you "
            "finish lands here: XP and level, streak flames, daily quests, "
            "badges, and a heatmap of your study activity. All of it stored "
            "in your browser — this page has never heard of a server."
        ),
        "keywords": [
            "study tracker",
            "study dashboard free",
            "xp and streak tracker",
            "study progress tracker",
            "habit tracker for students",
        ],
        "longtail": [
            "free study progress tracker no account",
            "how to track my study hours for free",
            "study dashboard that saves progress locally",
            "gamified study tracker with levels and badges",
            "daily study quest tracker free",
            "streak tracker for studying every day",
            "private study statistics without signing up",
            "how to see how much i studied this week",
            "xp system for studying like duolingo",
            "reset study progress in browser storage",
        ],
        "sections": [
            {
                "h2": "Everything you've bonked, in one place",
                "paras": [
                    "The dashboard reads your local progress and renders it honestly: no inflated stats, no fake leaderboards. Your XP ring shows the climb to your next level, the streak flame shows consecutive study days, and the quest list shows today's three objectives plus the weekly challenge.",
                    "Below that: every badge you've earned (and the ones still locked), and a twelve-week activity heatmap. Consistency should be visible — it's the whole game.",
                ],
                "bullets": [
                    "XP ring with level and next-level progress",
                    "Streak flame with best-streak history and freezes",
                    "Daily quests + weekly 500 XP challenge",
                    "15 badges to unlock, from First Bonk to XP Hoarder",
                    "12-week activity heatmap",
                ],
            },
            {
                "h2": "Your data, your device, your delete button",
                "paras": [
                    "Everything on this page is read from your browser's local storage. Export it as a JSON file to move devices or back it up. Want it gone? One button resets everything — and because nothing was ever uploaded, deletion is actually, provably complete.",
                ],
                "bullets": [
                    "Export all progress as JSON",
                    "Import it on another device",
                    "One-click reset, no \"are you sure\" guilt trips (okay, one confirm)",
                    "Zero servers involved — verified by the open-source code",
                ],
            },
        ],
        "faqs": [
            ("Where is my dashboard data stored?",
             "In your browser's local storage, under your control. It never leaves your device — StudyBonk has no servers that store anything and no accounts to attach data to."),
            ("Can I move my progress to a new computer?",
             "Yes — export your progress from the dashboard as a JSON file, then import it on the other device. The file is yours; send it however you like."),
            ("What happens if I clear my browser data?",
             "Clearing site data for StudyBonk erases your local progress — that's the one real risk of local-only storage. Export a backup before clearing, or before switching browsers."),
            ("Is there a leaderboard?",
             "No — there's no server, so there's no leaderboard. StudyBonk's competition is you-yesterday, which happens to be the only opponent that makes you better."),
        ],
    },
    "ai": {
        "path": "/ai/",
        "nav": "Bonk AI",
        "meta_title": "Local AI Study Tutor — No API, No Account | StudyBonk",
        "meta_description": "A tiny but smart AI tutor that runs fully in your browser: flashcards, quizzes, homework help and study coaching. No API, no sign-up, works offline.",
        "h1": "Bonk AI: A Study Tutor That Lives in Your Browser",
        "lead": (
            "Bonk AI is a tiny-but-smart assistant that runs 100% on your "
            "device. Instant Mode answers in milliseconds with zero download. "
            "Or activate the full Bonk AI — a real quantized language model "
            "that runs locally in your browser — no API, no server, no data "
            "ever leaving your browser."
        ),
        "keywords": [
            "local ai tutor",
            "free ai study assistant",
            "ai flashcard generator",
            "offline ai assistant",
            "browser ai no api",
            "private ai tutor",
        ],
        "longtail": [
            "free ai study assistant without account",
            "ai tutor that runs locally in the browser",
            "private ai flashcard generator no data collection",
            "how to use ai to make flashcards for free",
            "ai homework explainer that works offline",
            "does studybonk ai send my chats to a server",
            "webgpu ai assistant in browser free",
            "quantized small language model in browser",
            "ai study help without api keys",
            "meme mode ai study assistant",
        ],
        "sections": [
            {
                "h2": "Tiny, smart, and entirely yours",
                "paras": [
                    "Most AI study tools are wrappers around cloud APIs: your questions, your homework, your doubts — shipped to someone else's server. Bonk AI flips the model. The model comes to you: a distilled 1–2B parameter language model, quantized to 4-bit weights, running on your own GPU (or CPU via WASM) inside this tab.",
                    "Your conversations are stored only in your browser's local storage. There is no telemetry, no account, no server-side log, and a Clear Memory button that deletes everything instantly. You can read the code — it's open-source.",
                ],
                "bullets": [
                    "Instant Mode: zero download, zero-latency template intelligence",
                    "Bonk AI: a real quantized language model, cached for offline use",
                    "Runs on any device — GPU acceleration when available, CPU otherwise",
                    "One activation button — the engine picks the best path automatically",
                    "Flashcard + quiz generation from PDFs, notes and URLs",
                    "WebGPU acceleration with automatic CPU fallback",
                ],
            },
            {
                "h2": "What it's good at",
                "paras": [
                    "Bonk AI is deliberately scoped to studying: explaining concepts simply, generating flashcard decks, building practice quizzes, breaking down homework prompts, coaching you through procrastination, and delivering the correct amount of meme-flavored encouragement.",
                    "It's a 2-billion-parameter brain, not a 500-billion one — so it will tell you when it's unsure, and it's calibrated to admit it rather than invent facts. For high-stakes answers, it shows its reasoning structure so you can verify each step.",
                ],
                "bullets": [
                    "Generate flashcard decks from any topic or pasted notes",
                    "Build practice quizzes with an answer key",
                    "Homework breakdowns: define → decompose → example → self-check",
                    "Productivity coaching with real techniques (pomodoro, 2-minute rule, active recall)",
                    "Meme mode: help, but make it brainrot-adjacent",
                ],
            },
            {
                "h2": "How the memory works",
                "paras": [
                    "Bonk AI keeps your last few turns of conversation in local storage so follow-up questions work, and nothing more. No profile is built, no history is analyzed, nothing is retained after you press Clear Memory. That's not a policy promise — it's the architecture.",
                ],
                "bullets": [
                    "Short-term context stored locally, encrypted at rest",
                    "Clear Memory wipes all history instantly",
                    "No sensitive data is ever requested or stored",
                    "Works offline once loaded — airplane mode is a feature",
                ],
            },
        ],
        "faqs": [
            ("Does Bonk AI send my questions to a server?",
             "No. In Instant Mode there's no network activity at all. In model mode, the only network traffic is the one-time download of the model weights from a public model CDN — it contains none of your data. Your prompts and chats are processed on your device and stored only locally."),
            ("Why does the model need to download once?",
             "Quantized models are 300MB–1.4GB of weights. The download happens once, is cached by your browser, and after that Bonk AI runs fully offline. Instant Mode skips this entirely with zero download."),
            ("What devices can run the full model?",
             "Any device with WebGPU (Chrome, Edge, or recent Safari on desktop; Chrome on Android) handles Bonk Lite comfortably in ~600MB of RAM. Without WebGPU, StudyBonk falls back to WASM (slower) or Instant Mode. Detection is automatic."),
            ("Can Bonk AI do my homework for me?",
             "It can help you understand it — breaking down what a problem asks, explaining the method, checking your steps. It won't just hand over answers to paste, because that would bonk your education. Ethical AI is the whole brand."),
            ("Is my chat history really deleted when I clear it?",
             "Yes. History lives in your browser's local storage only. Clear Memory removes it from your device — and since it was never uploaded anywhere, deletion is absolute."),
        ],
    },
}

ABOUT = {
    "meta_title": "About StudyBonk & TuffyCoder — Creator Story",
    "meta_description": "Meet TuffyCoder, the ethical developer behind StudyBonk: why a privacy-focused, open-source, free study platform exists and how it stays free.",
    "h1": "The Story Behind the Bonk",
    "sections": [
        {
            "h2": "Hi, I'm TuffyCoder",
            "paras": [
                "I'm a solo developer who got tired of the same loop: a student finds a study app, the app demands an account, the account demands an email, the email gets ads, and the actual studying becomes the least important product feature.",
                "StudyBonk is my counter-argument: a complete study platform — flashcards, quizzes, focus tools, gamification, even a local AI tutor — with no accounts, no ads, no tracking, and no data collection. Not as a free trial of those values. As the whole product.",
                "Everything is open-source on GitHub, so you never have to take my word for what this site does. Read the code. Fork it. Question it. That's the point.",
            ],
        },
        {
            "h2": "Why privacy-first isn't a feature — it's the foundation",
            "paras": [
                "Students are minors surprisingly often, and the study-tool market treats their data like a resource to mine. StudyBonk runs zero analytics, sets zero cookies, loads zero third-party scripts, and stores everything — progress, decks, chats — locally in your browser.",
                "This isn't just ethics; it's also engineering honesty. A site that can't collect data can't leak data, can't sell data, and can't subpoena data. Privacy by architecture beats privacy by policy every time.",
            ],
        },
        {
            "h2": "How StudyBonk stays free",
            "paras": [
                "Static hosting on Cloudflare Pages' generous free tier, zero server costs (there are no servers), fonts bundled locally, and an AI that runs on your hardware instead of a paid API. The marginal cost of one more student is approximately zero — so the price is zero.",
                "No premium tier is coming. No \"StudyBonk Pro.\" If it ever can't run for free, it shuts down honestly rather than becoming another freemium trap.",
            ],
        },
        {
            "h2": "Come say hi",
            "paras": [
                "I build in public on YouTube, share dev content on TikTok, discuss projects on Reddit, and push all the code to GitHub. Feature ideas, bug reports, and memes are all welcome.",
            ],
        },
    ],
    "longtail": [
        "who made studybonk",
        "is studybonk trustworthy",
        "tuffycoder developer study app",
        "ethical developer free study tools",
        "open source study platform github",
        "who runs studybonk website",
        "independent developer study apps no ads",
        "privacy focused developer open source",
        "why is studybonk free",
        "studybonk creator youtube channel",
    ],
    "faqs": [
        ("Who created StudyBonk?",
         "TuffyCoder — an ethical developer, privacy-focused builder, and open-source contributor who builds free educational tools and documents the process publicly on YouTube."),
        ("Why should I trust StudyBonk?",
         "Three reasons: the code is fully open-source (verify every claim yourself), the site collects no data at all (no accounts, cookies, or analytics), and the creator is a public, accountable person with active social channels and a responsible disclosure policy."),
        ("How does StudyBonk make money?",
         "It doesn't. Zero revenue, zero ads, zero data selling. Static hosting plus local-only architecture means the running costs are effectively zero."),
        ("Can I contribute to StudyBonk?",
         "Yes — it's open-source. Bug reports, content improvements, and new topic guides are all welcome via GitHub pull requests."),
    ],
}

TRUST = {
    "meta_title": "Why You Can Trust StudyBonk — Privacy Proof",
    "meta_description": "The verifiable case for trusting StudyBonk: open-source code, zero trackers, zero cookies, local-only storage, security headers and responsible disclosure.",
    "h1": "Why You Can Trust StudyBonk",
    "lead": (
        "Trust shouldn't be a vibe — it should be verifiable. Here is "
        "StudyBonk's trust case in full: what the site does, what it "
        "provably doesn't do, and how to check every claim yourself."
    ),
    "verify_title": "Verify it yourself in 60 seconds",
    "verify_steps": [
        ("Open your browser dev tools → Network tab, reload any page", "You'll see requests for this site's own files only. No analytics, no ad networks, no trackers. In Instant Mode, not even a model download."),
        ("Check Application → Cookies", "Zero cookies. Ever. StudyBonk uses localStorage — device-local storage that is never transmitted to any server."),
        ("Read the source on GitHub", "Every line of this site is public. Search for any fetch/XHR call — outside the one-time opt-in model download, there are none."),
        ("Disconnect from the internet and keep using it", "StudyBonk is a progressive web app that caches itself. Offline studying is the proof of local-first architecture."),
    ],
    "faq_title": "Trust questions, answered plainly",
    "faqs": [
        ("Does StudyBonk collect any data at all?",
         "No. No accounts, no analytics, no cookies, no trackers, no server-side storage, no hidden APIs. Your progress and chats exist only in your browser's local storage on your own device."),
        ("Could StudyBonk start tracking me later?",
         "The code is open-source, so any change to that would be public, visible in the repo history, and reversible by anyone who forks the previous version. Privacy-by-architecture is auditable."),
        ("Is StudyBonk safe for kids?",
         "It's designed to be: no ads (so no ad-network exposure), no chat with strangers, no accounts, and an AI tutor that refuses to request personal information. Common-sense parental guidance still applies, as with any study tool."),
        ("What security measures does StudyBonk have?",
         "Strict security headers (including a strict Content-Security-Policy), no third-party scripts, no server attack surface beyond static file hosting, client-side encryption for sensitive local data, and a public responsible-disclosure policy."),
        ("What happens to my data if StudyBonk disappears?",
         "Nothing — because your data was never on StudyBonk's side. It's in your browser, exportable as a JSON file, usable offline. If every server vanished tonight, your copy of StudyBonk would keep working."),
    ],
    "longtail": [
        "is studybonk safe to use",
        "does studybonk track you",
        "study app that doesn t collect data",
        "is studybonk legit or a scam",
        "study website without cookies or trackers",
        "open source study app privacy",
        "how to verify a website doesn t track you",
        "safe study apps for students no ads",
        "zero data collection study tool",
        "studybonk privacy policy explained",
    ],
}

SECURITY = {
    "meta_title": "Security & Responsible Disclosure | StudyBonk",
    "meta_description": "StudyBonk's security architecture: strict CSP, no third-party scripts, zero server-side storage — plus a responsible disclosure invitation and bug bounty.",
    "h1": "Security at StudyBonk",
    "lead": (
        "Secure by design: static pages, strict headers, no user data to "
        "breach. Found a vulnerability? Here's how to report it — and get "
        "thanked in the Hall of Bonk."
    ),
    "sections": [
        {
            "h2": "Architecture",
            "paras": [
                "StudyBonk is a fully static site: HTML, CSS and client-side JavaScript served from Cloudflare's global edge network. There is no backend, no database, no login system, and no server-side storage. The most common web attack surfaces simply do not exist here.",
                "What remains is hardened: a strict Content-Security-Policy that forbids third-party scripts, X-Frame-Options and frame-ancestors to prevent clickjacking, referrer policy, and no cookies for attackers to hijack. Sensitive local data (like AI chat history) is encrypted at rest with a device-local key via the WebCrypto API.",
            ],
            "bullets": [
                "Strict CSP: scripts and styles load from this origin only",
                "No third-party scripts, ever — the entire supply chain is auditable",
                "Zero cookies — nothing session-shaped to steal",
                "Client-side AES-GCM encryption for sensitive localStorage entries",
                "Zero data retention: there is no server-side retention because there is no server-side",
            ],
        },
        {
            "h2": "The local AI's security model",
            "paras": [
                "Bonk AI runs inside your browser sandbox. In Instant Mode there is no network activity at all. When you opt into a full model, the only network request is a one-time download of public, read-only model weights from a public model CDN — it contains no information about you, and model weights can't record prompts.",
                "Prompts are processed by your own GPU/CPU, and history is stored encrypted in local storage with a one-click destroy button.",
            ],
        },
        {
            "h2": "Responsible disclosure & bug bounty",
            "paras": [
                "Found a security issue? Please report it privately via GitHub Security Advisories on the StudyBonk repository (github.com/TuffyCoder/StudyBonk/security/advisories/new) — or open a private security advisory if you prefer. Please don't test destructive techniques or try to degrade service for others.",
                "StudyBonk's bug bounty is gratitude-based: confirmed reporters earn a permanent place in the Hall of Bonk below, a shout-out in release notes, and the warm glow of protecting students. (There's no cash bounty — this is a free, zero-revenue project. But the thanks are extremely sincere.)",
            ],
        },
        {
            "h2": "Hall of Bonk",
            "paras": [
                "No entries yet — the hall awaits its first hero. Could be you.",
            ],
        },
    ],
    "longtail": [
        "studybonk security policy",
        "how to report a security vulnerability",
        "responsible disclosure policy example",
        "static site security best practices",
        "content security policy for static sites",
        "client side encryption webcrypto local storage",
        "website without third party scripts",
        "bug bounty for open source projects",
        "is static hosting more secure",
        "zero data retention website",
    ],
}

FAQ_PAGE = {
    "meta_title": "StudyBonk FAQ — Everything You're Wondering",
    "meta_description": "Is StudyBonk free? Is it private? Does the AI work offline? Straight answers to every common question about the free, private study platform.",
    "h1": "StudyBonk FAQ",
    "lead": (
        "Short, honest answers about what StudyBonk is, what it costs "
        "(nothing), and what it does with your data (also nothing)."
    ),
}

ERROR404 = {
    "h1": "This page got bonked out of existence.",
    "lead": (
        "The page you're looking for doesn't exist — maybe it moved, maybe "
        "it never did, maybe it's studying somewhere quiet. Try one of these "
        "instead."
    ),
}
