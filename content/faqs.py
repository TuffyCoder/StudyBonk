"""Global StudyBonk FAQs — shown on the homepage (top 6) and the /faq/ page.
Used for FAQPage JSON-LD schema. Answers must stay accurate to the site's
real architecture (no accounts, no tracking, local storage, local AI)."""

FAQS = [
    ("Is StudyBonk really 100% free?",
     "Yes — every guide, deck, quiz, timer and AI feature is free with no premium tier, no ads and no paywalls. StudyBonk runs on free static hosting with zero servers, so it stays free by design, not as a trial."),
    ("How is StudyBonk private if it has no accounts?",
     "Because there is nothing to log in to. StudyBonk sets no cookies, loads no third-party scripts, and runs no analytics. Your progress is stored in your browser's local storage, on your own device — the site literally cannot see it."),
    ("Where is my progress saved?",
     "In your browser's local storage on your device: XP, streaks, badges, flashcard schedules, custom decks, focus stats and AI chat history. Export everything as a JSON file from the dashboard to back it up or move devices."),
    ("Does the Bonk AI send my questions to a server?",
     "No. Instant Mode has zero network activity. The optional full models run entirely in your browser via WebGPU — the only network request is the one-time model download (public weights, no user data), cached for offline use afterward."),
    ("Can I use StudyBonk offline?",
     "Yes. After your first visit, StudyBonk caches itself as a progressive web app. Guides, flashcards, quizzes, the timer and Instant Mode AI all work offline; earned XP syncs nowhere because there's nothing to sync to."),
    ("Is StudyBonk open source?",
     "Completely. The generator, design system, tools and AI integration are on GitHub (github.com/TuffyCoder/StudyBonk) — code under MIT, content under CC BY 4.0. You can verify every privacy claim yourself."),
    ("Who made StudyBonk?",
     "TuffyCoder — a solo ethical developer who builds privacy-first, free educational tools and documents the process on YouTube (@TuffyCoder). StudyBonk is his counter-argument to ad-driven, account-hungry study apps."),
    ("Does StudyBonk work on mobile?",
     "Yes — the whole platform is mobile-first: touch-friendly flashcards, quizzes, timers and chat, plus installable as an app (PWA) from your browser menu. Light and dark mode included."),
    ("What topics does StudyBonk cover?",
     "Seven pillars — math, biology, chemistry, physics, history, SAT prep and study skills — each with six deep-dive guides, a flashcard deck and explained quizzes for every guide. More pillars ship over time."),
    ("Do I need to install anything?",
     "No. StudyBonk runs in any modern browser at studybonk.vercel.app. Optionally install it as an app (PWA) for a home-screen icon and offline access."),
    ("What happens if I clear my browser data?",
     "Clearing site data erases your local progress — the one real cost of a no-account design. Export a backup from the dashboard before clearing, switching browsers, or using private mode."),
    ("Is StudyBonk safe for kids?",
     "It's built to be: no ads (so no ad-network exposure), no accounts, no chat between users, and an AI tutor that never requests personal information. As with any study tool, common-sense parental guidance still applies."),
]
