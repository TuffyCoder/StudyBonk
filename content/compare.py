"""Honest competitor comparison pages for StudyBonk (/vs/<slug>/).

Schema (consumed by scripts/build.py::vs_page):
COMPARES = [{slug, name, meta_title<=62 ending " | StudyBonk",
meta_description<=160, h1, intro[2 paras], quick_answer (40-60 words,
featured-snippet style), rows[(feature, studybonk, other) x 8] plain
strings, verdict (1 para), faqs[(q, a) x 4], longtail[10+], keywords[6]}]

Fairness rule: competitors are described accurately and hedged where
their pricing or features may change ("typically", "check their current
pricing"). StudyBonk's edge is stated as verifiable fact: 100% free with
zero paywalls, no account, no ads or trackers, gamified XP/streaks/
quests, a local AI tutor, and open-source code.
"""

COMPARES = [
    {
        "slug": "quizlet",
        "name": "Quizlet",
        "meta_title": "StudyBonk vs Quizlet: Free, No Ads, No Account | StudyBonk",
        "meta_description": "StudyBonk vs Quizlet, compared honestly: price, accounts, ads, flashcards, quizzes, gamification and AI. StudyBonk is 100% free with no account and no paywalls.",
        "h1": "StudyBonk vs Quizlet: The Honest, No-Paywall Comparison",
        "intro": [
            "Quizlet is one of the most recognizable names in studying, and for good reason: well over a decade of user-made decks, slick mobile apps, and study modes that millions of students already know by heart. If you have a vocabulary list due tomorrow, someone has probably made a Quizlet set for it already.",
            "StudyBonk makes a different bet. Instead of a freemium subscription and an account wall, it gives away every feature: flashcards with spaced repetition, explained quizzes, XP, streaks, daily quests, and an AI tutor that runs locally in your browser. This page compares the two honestly, feature by feature, so you can pick the right tool for your next study session.",
        ],
        "quick_answer": (
            "StudyBonk vs Quizlet: both offer flashcards, quizzes and study "
            "modes, but StudyBonk is 100% free with no account, no ads and "
            "no paywalled features, while Quizlet typically places advanced "
            "modes behind a paid subscription. StudyBonk adds XP, streaks, "
            "daily quests and a local AI tutor that runs entirely in your "
            "browser."
        ),
        "rows": [
            ("Price", "100% free, no premium tier, no trial",
             "Free tier plus a paid subscription (check their current pricing)"),
            ("Account required", "No — open the site and study",
             "Yes — sign-up is required for most features"),
            ("Ads & trackers", "Zero ads, zero trackers, zero cookies",
             "Ads on the free tier; trackers per their privacy policy"),
            ("Flashcards & spaced repetition",
             "Built-in decks plus automatic spaced-repetition scheduling",
             "Huge library of user-made decks; spaced repetition in Learn mode"),
            ("Quizzes", "Explained practice quizzes with instant feedback",
             "Practice tests typically limited or premium-gated"),
            ("Gamification", "XP, streaks, daily quests, levels, mascot",
             "Streaks and some progress stats"),
            ("AI tutor", "Local AI that runs in your browser, no API, no account",
             "AI study features typically tied to the paid plan"),
            ("Source code", "Fully open-source on GitHub", "Closed source"),
        ],
        "verdict": (
            "Choose Quizlet if you rely on its enormous library of "
            "community-made decks, you like its specific study modes, or "
            "your class already runs on it — and check their current "
            "pricing, because the free tier has changed over the years. "
            "Choose StudyBonk if you want every feature free with no "
            "account, no ads and no subscription prompt mid-session, plus "
            "gamification and a private, local AI tutor. Plenty of students "
            "happily use both: Quizlet for a shared class set, StudyBonk "
            "for the daily reps that actually build memory."
        ),
        "faqs": [
            ("Is StudyBonk a good Quizlet alternative?",
             "For daily studying, yes: StudyBonk offers flashcards with spaced repetition, explained quizzes, XP, streaks and a local AI tutor, all free with no account and no ads. Quizlet's edge is its massive library of community-made decks — if your class already has a Quizlet set, that's hard to beat."),
            ("Is Quizlet still free?",
             "Quizlet keeps a free tier, but over the years it has typically limited some study modes and placed its premium features, including its AI tools, behind a paid subscription, with ads on free accounts. Check their current pricing for today's lineup. StudyBonk, by contrast, has no premium tier at all."),
            ("Does StudyBonk have as many decks as Quizlet?",
             "No, and we won't pretend otherwise. Quizlet has years of user-generated content. StudyBonk instead ships curated decks across seven school pillars — math, biology, chemistry, physics, history, SAT and study skills — plus custom decks you can build yourself or generate with the local AI tutor."),
            ("Do I need an account to save my progress on StudyBonk?",
             "No. StudyBonk has no accounts at all. Your XP, streaks, decks and quiz history are saved in your browser's local storage on your own device, and you can export a backup as JSON from the dashboard any time."),
        ],
        "longtail": [
            "is quizlet still free in 2026",
            "quizlet alternatives free no account",
            "studybonk vs quizlet which is better",
            "free flashcard app without ads",
            "quizlet learn mode paywall alternatives",
            "is there a free quizlet alternative with spaced repetition",
            "quizlet without premium reddit",
            "best free study app for students 2026",
            "private study app no sign up",
            "quizlet free vs paid what do you get",
            "flashcard app that works offline free",
            "open source quizlet alternative",
        ],
        "keywords": [
            "quizlet alternative",
            "free quizlet alternative",
            "quizlet vs studybonk",
            "flashcards without account",
            "free study app no ads",
            "quizlet free tier",
        ],
    },
    {
        "slug": "anki",
        "name": "Anki",
        "meta_title": "StudyBonk vs Anki: Gamified & Zero Setup | StudyBonk",
        "meta_description": "StudyBonk vs Anki compared honestly: spaced repetition, setup time, gamification, AI tutor, price and open source. Which study tool fits your routine?",
        "h1": "StudyBonk vs Anki: Zero-Setup Studying vs Power Spaced Repetition",
        "intro": [
            "Anki is the undisputed heavyweight of spaced repetition. Its scheduling algorithm is deeply configurable, its add-on ecosystem is vast, and generations of med students and language learners swear by it. If you want maximum control over exactly when each card comes back, Anki earned that reputation.",
            "StudyBonk is built for a different student: the one who wants to open a tab and start studying in ten seconds, with zero installation, zero deck configuration, and a layer of motivation — XP, streaks, daily quests — on top. Here is an honest look at where each tool wins.",
        ],
        "quick_answer": (
            "StudyBonk vs Anki: Anki is the gold standard for customizable "
            "spaced repetition, while StudyBonk focuses on making daily "
            "study feel like a game — XP, streaks and quests — with "
            "built-in decks, explained quizzes and a local AI tutor. "
            "StudyBonk needs no install and no setup; Anki rewards users "
            "who invest time in configuring it."
        ),
        "rows": [
            ("Price", "100% free on every device",
             "Free on desktop and Android; the iOS app is a paid one-time purchase"),
            ("Account required", "No — nothing to sign up for",
             "Optional AnkiWeb account for syncing"),
            ("Setup time", "Zero — works instantly in the browser",
             "Download, install and configure decks before studying"),
            ("Spaced repetition", "Built-in automatic scheduling for every deck",
             "Best-in-class, deeply configurable algorithm"),
            ("Gamification", "XP, streaks, daily quests, levels, mascot",
             "Review streaks only; motivation is self-supplied"),
            ("Quizzes & lessons", "Explained quizzes and short guides per topic",
             "Flashcards only — no built-in lessons or quizzes"),
            ("AI tutor", "Local AI tutor in the browser, no install",
             "No built-in AI; third-party add-ons exist"),
            ("Source code", "Fully open-source on GitHub",
             "Open-source on desktop; the iOS app is closed"),
        ],
        "verdict": (
            "Choose Anki if you are a power user — med school, law, "
            "languages — and you want the most configurable "
            "spaced-repetition scheduler ever built, and you're willing to "
            "invest the setup time (and, on iOS, the one-time app purchase "
            "— check their current pricing). Choose StudyBonk if you want "
            "zero-friction daily studying: open the browser, earn XP, "
            "protect a streak, quiz yourself with explanations, and chat "
            "with an AI tutor that never leaves your device. Anki rewards "
            "investment; StudyBonk rewards showing up."
        ),
        "faqs": [
            ("Which is better for spaced repetition, Anki or StudyBonk?",
             "Anki, honestly: its scheduling algorithm is more configurable and battle-tested by decades of learners. StudyBonk's built-in spaced repetition covers the core job — resurfacing cards right before you'd forget them — with zero setup, which fits most students' daily routine better."),
            ("Is Anki really free?",
             "Anki is free and open-source on desktop, and free on Android via AnkiDroid. The iOS app, AnkiMobile, is a paid one-time purchase that funds development, and optional AnkiWeb syncing is free — check their current pricing. StudyBonk is free on every device because it runs in the browser."),
            ("Does StudyBonk work offline like Anki?",
             "Yes. After your first visit, StudyBonk caches itself as an app in your browser, and flashcards, quizzes, the focus timer and even the AI tutor work offline. Progress saves locally on your device, so there's nothing to sync and no account needed."),
            ("Do I need to install or configure anything to use StudyBonk?",
             "No. StudyBonk runs in any modern browser with no installation, no plugins and no deck configuration — open it and start studying. Anki's power comes from setup and tuning; StudyBonk trades some of that depth for zero friction."),
        ],
        "longtail": [
            "anki vs quizlet for spaced repetition",
            "free anki alternative no setup",
            "is anki free on iphone",
            "anki alternative with gamification",
            "studybonk vs anki for beginners",
            "easiest spaced repetition app to use",
            "anki too complicated alternative",
            "flashcard app with streaks and xp",
            "does anki have an ai tutor",
            "anki in the browser without installing",
            "best free spaced repetition flashcards 2026",
            "gamified flashcard app like duolingo",
        ],
        "keywords": [
            "anki alternative",
            "anki vs studybonk",
            "free flashcard app",
            "spaced repetition app",
            "anki for beginners",
            "gamified flashcards",
        ],
    },
    {
        "slug": "kahoot",
        "name": "Kahoot",
        "meta_title": "StudyBonk vs Kahoot: Solo Study, No Host | StudyBonk",
        "meta_description": "StudyBonk vs Kahoot compared: live games vs self-paced study, price, accounts, explanations, flashcards and gamification. Free solo alternative to Kahoot.",
        "h1": "StudyBonk vs Kahoot: Solo Study vs Live Quiz Games",
        "intro": [
            "Kahoot! turned quizzing into a spectator sport: a host starts a game, players punch in a PIN, and the leaderboard does the rest. It is genuinely fun, and for live classrooms, club nights and training sessions it remains the go-to.",
            "StudyBonk is not trying to host your class party. It is built for the solo grind: self-paced quizzes where every answer comes with an explanation, flashcards with spaced repetition, a focus timer, and XP-style progression that makes twenty minutes of daily practice feel like a game. Here is how the two stack up.",
        ],
        "quick_answer": (
            "StudyBonk vs Kahoot: Kahoot shines at live, teacher-hosted quiz "
            "competitions, while StudyBonk is built for solo studying — "
            "self-paced quizzes with instant explanations, flashcards, a "
            "focus timer and XP-style motivation. StudyBonk needs no host, "
            "no account and no game PIN, and every feature is free with no "
            "player limits."
        ),
        "rows": [
            ("Best for", "Solo studying at your own pace",
             "Live group quiz games hosted by a teacher or presenter"),
            ("Price", "100% free, every feature unlocked",
             "Free host tier with limits; paid plans for more players and features"),
            ("Account required", "No — just open the site",
             "Hosts need an account; players join with a game PIN"),
            ("Studying solo", "Self-paced quizzes built for one",
             "Built around live multiplayer; solo study modes are secondary"),
            ("Explanations", "Every question explained instantly",
             "Focuses on the game; explanations depend on the host and quiz"),
            ("Flashcards & spaced repetition",
             "Flashcards with automatic spaced-repetition scheduling",
             "Not a flashcard tool"),
            ("Gamification", "XP, streaks, daily quests, levels",
             "Points, leaderboards and podiums during live games"),
            ("Source code", "Fully open-source on GitHub", "Closed source"),
        ],
        "verdict": (
            "Choose Kahoot! when the goal is a live event — a classroom "
            "review game, a club night, a training session — where a host "
            "and a shared leaderboard create the energy, and check their "
            "current plans for player limits. Choose StudyBonk when the "
            "goal is your own learning: self-paced quizzes with "
            "explanations, flashcards, a focus timer and a streak to "
            "protect, all free with no host, no PIN and no account. "
            "Different tools for different moments — but for the daily "
            "solo grind, StudyBonk is purpose-built."
        ),
        "faqs": [
            ("Can my class play StudyBonk together like Kahoot?",
             "Not in the live-hosted sense: StudyBonk has no game PINs, shared rooms or global leaderboard, because it has no accounts and no servers storing player data. Everyone can still work through the same quiz on their own devices at the same time — it just isn't a party game."),
            ("Is StudyBonk as free as Kahoot's free tier?",
             "Free-er. StudyBonk has one tier with everything unlocked: no player limits, no question limits, no ads and no account. Kahoot's free tier typically caps live-game players and features, with paid plans unlocking more — check their current plans."),
            ("Does StudyBonk have a leaderboard?",
             "Your progress is the leaderboard: XP, levels from Bonk Novice to Bonk Legend, streaks and daily quests, all stored privately in your browser. There's no public ranking of students, because nothing about you ever leaves your device."),
            ("Do I need a game PIN or a host account to use StudyBonk?",
             "No. There is no host, no PIN and no account — open studybonk.pages.dev and you're studying in seconds. Kahoot is built around a host creating games; StudyBonk is built around you, alone, getting better."),
        ],
        "longtail": [
            "kahoot alternatives free for students",
            "studybonk vs kahoot for solo studying",
            "free quiz game without account",
            "kahoot free player limits",
            "solo study alternative to kahoot",
            "quiz app with explanations for wrong answers",
            "how to study alone like kahoot",
            "free self paced quiz tool",
            "classroom quiz game alternatives 2026",
            "study game with xp and streaks",
            "no sign up quiz tool for studying",
            "gamified study app free no ads",
        ],
        "keywords": [
            "kahoot alternative",
            "free quiz tool",
            "kahoot vs studybonk",
            "solo study quiz app",
            "quiz app with explanations",
            "study game no account",
        ],
    },
]
