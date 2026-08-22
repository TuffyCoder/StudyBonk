"""Legal pages: Terms of Use, Privacy Policy, Cookie-Free Notice and
Open-Source License.

Schema (consumed by scripts/build.py::legal_page): each dict has
meta_title<=62 ending " | StudyBonk", meta_description<=160, h1,
intro[1-2 paras] and sections — each section is a 3-tuple of
(h2, [paragraphs], [bullets or empty list]).

Written for a zero-data-collection architecture: no accounts, no
analytics, no cookies, no trackers, no server-side storage. The code is
MIT-licensed and the written content is CC BY 4.0 at
github.com/TuffyCoder/StudyBonk.
"""

TERMS = {
    "meta_title": "Terms of Use | StudyBonk",
    "meta_description": "The plain-English terms for using StudyBonk: a free, open-source study tool with no accounts, no ads and no data collection. Here's what that means for you.",
    "h1": "Terms of Use",
    "intro": [
        "StudyBonk is free, open-source and account-free, so these terms are shorter than most. The short version: use the site freely, keep ownership of everything you create, and remember that the AI tutor can make mistakes. The longer version is below, written in plain English rather than legalese.",
        "By using studybonk.vercel.app you agree to these terms. If you disagree with them, simply stop using the site — since there are no accounts, there is nothing to cancel.",
    ],
    "sections": [
        ("Acceptance of terms", [
            "These Terms of Use govern your use of StudyBonk, a free educational website available at studybonk.vercel.app. By accessing or using the site, you accept these terms in full. If you do not accept them, please do not use the site.",
            "Because StudyBonk has no accounts or sign-ups, there is no click-through agreement to accept — your use of the site is the agreement. These terms apply to every page and feature, including the flashcards, quizzes, focus timer and AI tutor.",
        ], []),
        ("What StudyBonk is", [
            "StudyBonk is a free educational tool designed to help students study more effectively. It is a static website hosted on Vercel, built and maintained by TuffyCoder, and paid for at zero cost to you.",
        ], [
            "Study guides across math, science, history, SAT prep and study skills",
            "Flashcards with built-in spaced repetition",
            "Practice quizzes with explanations for every answer",
            "A focus timer and progress dashboard",
            "Gamification: XP, streaks, daily quests and levels",
            "A local AI tutor that runs entirely in your browser",
        ]),
        ("No accounts & acceptable use", [
            "StudyBonk has no user accounts, no profiles and no user-to-user messaging. You never provide an email address, name or payment information, and the site never asks for one.",
            "You agree to use StudyBonk lawfully and for its intended purpose: learning. Specifically, you agree not to attack or overload the site, not to attempt to identify other users (there is no data to find, but still), not to misrepresent the site as your own commercial product, and not to use the tools for academic dishonesty. StudyBonk is a study aid, not a cheating service — how you use what you learn is your responsibility and your school's.",
        ], []),
        ("Your content & local storage", [
            "Any content you create on StudyBonk — custom flashcard decks, AI chat history, focus statistics, gamification progress and settings — belongs entirely to you. It is stored in your browser's local storage on your own device, is never transmitted to the site's servers, and cannot be read by StudyBonk.",
            "This ownership comes with one practical consequence: because your content lives only in your browser, clearing your browser's site data or switching devices without a backup will erase it. StudyBonk is not responsible for lost local data, and you can export a JSON backup of everything from the dashboard at any time.",
        ], [
            "You own everything you create on StudyBonk.",
            "Your content stays in your browser's local storage — it is never uploaded.",
            "Clearing site data permanently deletes your progress; export a backup first.",
        ]),
        ("Intellectual property", [
            "StudyBonk is proudly open-source and dual-licensed. The source code — the build system, design and features — is released under the MIT License. The written content, including study guides and this very page, is released under Creative Commons Attribution 4.0 (CC BY 4.0).",
            "The full details, including exactly what you may reuse and how to attribute it, are on the Open-Source License page and in the repository at github.com/TuffyCoder/StudyBonk. Trademarks belonging to third parties, if mentioned for comparison, remain the property of their owners.",
        ], [
            "Code: MIT License — use, modify and republish, with the license notice kept.",
            "Content: CC BY 4.0 — share and adapt with attribution to StudyBonk by TuffyCoder.",
            "Everything is public and auditable on GitHub.",
        ]),
        ("The local AI assistant", [
            "StudyBonk includes an AI tutor that runs locally in your browser. It is a small language model, not an infallible oracle: it can and occasionally will produce answers that are outdated, incorrect or confidently wrong. Use it as a study companion, not as a final authority.",
            "Verify important facts against your textbook, teacher or other reliable sources before acting on them, especially for graded work. The AI's output does not constitute professional advice of any kind — not medical, legal, financial or otherwise.",
        ], []),
        ("Disclaimer of warranties", [
            "StudyBonk is provided on an 'as is' and 'as available' basis, without warranties of any kind, express or implied. Every effort is made to keep the study content accurate and the site available, but accuracy is pursued, not guaranteed.",
        ], [
            "No warranty that the service will be uninterrupted, secure or error-free.",
            "No warranty that study content is complete, current or exam-aligned for your curriculum.",
            "No warranty of fitness for a particular purpose — your exam results are yours.",
            "Always cross-check anything that matters with your teacher or textbook.",
        ]),
        ("Limitation of liability", [
            "To the maximum extent permitted by law, StudyBonk and its creator shall not be liable for any indirect, incidental or consequential damages arising from your use of the site — including lost data (such as progress erased by clearing browser storage), lost profits, or academic outcomes. Your use of StudyBonk is entirely at your own risk, which is thankfully low: the site cannot lose your data because it never holds it.",
        ], []),
        ("Changes to the service and these terms", [
            "StudyBonk is an evolving open-source project, so features may be added, changed or removed over time. These terms may also be updated occasionally; the 'Last updated' date on this page reflects the current version, and continued use of the site after changes means you accept the revised terms. Because the project is open-source, even the history of these pages is public on GitHub.",
        ], []),
        ("Contact", [
            "The fastest way to reach the creator is through GitHub: open an issue or discussion at github.com/TuffyCoder/StudyBonk. Security researchers, see the responsible disclosure invitation in the repository's SECURITY.md. There is no support email because there is no support team — there is one developer and a public issue tracker.",
        ], []),
    ],
}

PRIVACY = {
    "meta_title": "Privacy Policy — We Collect Nothing | StudyBonk",
    "meta_description": "StudyBonk collects nothing: no accounts, no analytics, no cookies, no trackers. Everything, even AI chats, stays in your browser. The full zero-data policy.",
    "h1": "Privacy Policy",
    "intro": [
        "This privacy policy is short for a reason: StudyBonk's architecture makes most of it unnecessary. There are no accounts, no analytics, no cookies, no trackers and no server-side storage — so there is no database of user data to describe, protect or leak. The details below explain exactly what does exist and where it lives.",
    ],
    "sections": [
        ("Summary: we collect nothing", [
            "StudyBonk does not collect, store, transmit or sell any personal data. When you study, the site cannot know who you are, what device you use beyond serving the page, or how you performed — because nothing about your activity is ever sent anywhere.",
            "Most privacy policies explain how your data is handled. This one mostly explains why there is no data to handle: every feature that would normally require a server — progress, decks, gamification, the AI tutor — was engineered to run entirely in your browser instead.",
        ], []),
        ("What we do not collect", [
            "For the avoidance of doubt, here is the full inventory of what StudyBonk does not have. We run no analytics of any kind and keep no server logs of user activity beyond what Vercel's standard static hosting necessarily does at the network edge to serve pages (routing and denial-of-service protection, for example). Those infrastructure-level functions are operated by Vercel, not StudyBonk, and are not used to profile users.",
        ], [
            "No accounts, emails, names or passwords",
            "No analytics or usage statistics",
            "No cookies of any kind",
            "No third-party trackers, ad networks or scripts",
            "No server-side storage of anything you do",
            "No AI prompts or chats sent to any server",
        ]),
        ("Local storage: what lives in your browser", [
            "StudyBonk saves your progress in your browser's local storage — a small amount of data written by the site itself, stored on your device, and readable only by StudyBonk in that browser. It is never transmitted anywhere, and if you never tell anyone, no one — including the site's creator — can see it. Here is the complete list of keys StudyBonk uses and what each one stores.",
        ], [
            "sb.theme — your light or dark mode preference.",
            "sb.gamification — XP, level, streaks, badges and daily quest progress.",
            "sb.srs — spaced-repetition review schedules for your flashcards.",
            "sb.userDecks — custom flashcard decks you create or generate.",
            "sb.focusSettings — your focus timer configuration, such as session lengths.",
            "sb.focusStats — completed focus sessions and total study time.",
            "sb.ai.history.enc — your AI tutor chat history, stored encrypted.",
            "sb.ai.memory — short notes the AI tutor keeps to stay useful across chats.",
            "sb.devicekey — a locally generated key used to encrypt sensitive values like AI history.",
        ]),
        ("The local AI", [
            "StudyBonk's AI tutor runs entirely in your browser. Your prompts, questions and files are processed on your device and never leave it — there is no AI API, no server-side model and no chat log anywhere but your own machine. After the first load, the AI even works offline.",
            "The single exception is the first time you enable the full model: the model weights are downloaded once from public model CDNs. This is the only external request the AI feature ever makes, and it contains no user data — it is functionally the same download any visitor of the CDN would make.",
        ], [
            "Prompts and chats: processed on-device, never uploaded.",
            "AI history: encrypted in local storage (sb.ai.history.enc) with a local key (sb.devicekey).",
            "External requests: one-time model download from public CDNs, containing no user data.",
        ]),
        ("Children's privacy", [
            "StudyBonk is designed to be safe for students aged 13 and up, and the zero-collection architecture applies equally to younger visitors: the site collects no personal information from anyone, of any age, because it collects no information at all. There are no ads, no chat between users and no prompts asking children for personal details. As with any study tool, parents should still use common sense about screen time and content.",
        ], []),
        ("Your rights", [
            "Under privacy laws like GDPR and CCPA you have rights to access, export and delete your personal data. Because StudyBonk holds none of it, those rights are fully satisfied by you alone: you already have every byte.",
        ], [
            "Export: download everything as a JSON file from the dashboard.",
            "Delete: clear StudyBonk's site data in your browser settings (see the Cookie-Free Notice for how).",
            "Move devices: export from the old device, import on the new one.",
            "There is no server-side copy to request or delete — there never was one.",
        ]),
        ("Third parties", [
            "StudyBonk shares data with no third parties, because it has no data to share. There are no advertisers, analytics vendors, font CDNs or embedded social buttons. The only third party involved in operating the site is Vercel, which statically hosts the pages and serves them from its edge network; Vercel serves files and never receives your study activity from StudyBonk. The AI model download described above comes from public model CDNs without any user data attached.",
        ], []),
        ("Changes to this policy", [
            "If StudyBonk's architecture ever changes in a way that affects privacy, this policy will be updated here with a new 'Last updated' date, and — because the site is open-source — the change will be visible in the repository's history before it ever reaches you. The commitment this page documents is architectural, not aspirational: no collection, by design.",
        ], []),
        ("Contact", [
            "Questions about this policy can be raised publicly on GitHub at github.com/TuffyCoder/StudyBonk — open an issue and the creator will respond. If you believe the site behaves in a way that contradicts this policy, please report it; verified privacy bugs are taken extremely seriously.",
        ], []),
    ],
}

COOKIES = {
    "meta_title": "Cookie-Free Notice | StudyBonk",
    "meta_description": "StudyBonk sets zero cookies and zero trackers, so there's no consent banner. See what localStorage it uses instead and how to clear it from your browser.",
    "h1": "Cookie-Free Notice",
    "intro": [
        "You may have noticed something missing from StudyBonk: a cookie consent banner. That's not an oversight or a design shortcut — StudyBonk sets zero cookies and loads zero trackers, so there is nothing to consent to. This page explains what that means and what the site uses instead.",
    ],
    "sections": [
        ("Zero cookies, zero trackers", [
            "StudyBonk does not set any cookies — not analytics cookies, not advertising cookies, not even strictly-necessary ones. It also loads no third-party scripts, pixels or fingerprinting libraries of any kind.",
            "You don't have to take this on faith. The site is open-source at github.com/TuffyCoder/StudyBonk, and you can inspect every page's network activity in your browser's developer tools: the cookies tab for studybonk.vercel.app will stay empty.",
        ], []),
        ("What we use instead: localStorage", [
            "To remember your progress between visits, StudyBonk uses your browser's localStorage — a standard web feature that lets a site save small amounts of data on your own device. Your XP, streaks, flashcard decks, focus stats, theme preference and encrypted AI chat history are written there.",
            "The crucial property: localStorage data never leaves your device. It is not attached to requests, not readable by other websites, and never transmitted to StudyBonk's servers — the site keeps no servers of its own to send it to.",
        ], [
            "sb.theme — light or dark mode preference.",
            "sb.gamification — XP, streaks, badges and quests.",
            "sb.srs and sb.userDecks — review schedules and custom decks.",
            "sb.focusSettings and sb.focusStats — timer settings and session history.",
            "sb.ai.history.enc, sb.ai.memory and sb.devicekey — encrypted local AI data.",
        ]),
        ("How localStorage differs from cookies", [
            "Cookies and localStorage are both browser storage, but they behave very differently where privacy is concerned — which is why a site full of localStorage can honestly call itself cookie-free.",
        ], [
            "Cookies are sent to a server with every request; localStorage stays on your device, always.",
            "Cookies are the backbone of ad tracking and session profiling; localStorage here holds only your own study data.",
            "Third-party cookies can follow you across sites; StudyBonk's localStorage is readable by no other site.",
            "Clearing cookies in your browser does not necessarily clear localStorage — see the next section.",
        ]),
        ("How to clear your StudyBonk data", [
            "If you want a fresh start — or you're on a shared computer — you can wipe everything StudyBonk has saved. In most browsers: open Settings, find the privacy or site-data section, view site data for studybonk.vercel.app, and delete it. Browsers usually also let you clear site data for the site you're currently on via the padlock icon in the address bar.",
            "One friendly warning: clearing site data erases your XP, streaks, decks and AI history permanently — that's the flip side of a no-account design. Export a JSON backup from the dashboard first if you want to keep your progress.",
        ], [
            "Browser settings → Privacy → Site data → studybonk.vercel.app → delete.",
            "Or: padlock icon next to the address bar → site settings → clear data.",
            "Export a dashboard backup first if you want to keep your progress.",
        ]),
        ("Theme preference", [
            "The one thing that might feel like personalization is your light or dark mode choice, stored under the sb.theme key. Even that stays in your browser — switch devices and the site starts in its default theme until you choose again. No advertising ID, no cross-site profile, no 'personalized experience' built from your data: just a preference flag on your own machine.",
        ], []),
    ],
}

LICENSE_PAGE = {
    "meta_title": "Open-Source License: MIT & CC BY 4.0 | StudyBonk",
    "meta_description": "StudyBonk is dual-licensed: code under MIT, written content under CC BY 4.0. Learn what you can reuse, how to attribute it, and where to contribute.",
    "h1": "Open-Source License",
    "intro": [
        "StudyBonk is open-source under a simple dual license: the code is MIT-licensed and the written content is CC BY 4.0. In plain English, that means you can use, fork, modify and republish nearly everything here, as long as you give credit. This page explains the details.",
    ],
    "sections": [
        ("Dual licensing, in plain English", [
            "StudyBonk is two kinds of work in one project: software (the Python build script, the design system, the JavaScript features) and writing (study guides, FAQs, even this license page). Each gets the license that fits it best.",
        ], [
            "Code — including the build system and every feature: MIT License.",
            "Written content — guides, explanations and page copy: CC BY 4.0.",
            "Both licenses let you reuse the work freely, with attribution and no additional restrictions.",
        ]),
        ("The code: MIT License", [
            "The MIT License is one of the most permissive open-source licenses in existence. The full text lives in the LICENSE file of the repository, but the practical version is short: do whatever you want with the code, just don't blame the author and keep the license notice when you redistribute it.",
        ], [
            "Use StudyBonk's code commercially, personally or in the classroom.",
            "Copy it, modify it and build your own study platform on top of it.",
            "Redistribute it, provided the original copyright and license notice are included.",
            "Provided as-is: no warranty, express or implied.",
        ]),
        ("The written content: CC BY 4.0", [
            "All written StudyBonk content — the study guides, flashcard content, quizzes text and explanatory copy — is licensed under Creative Commons Attribution 4.0 International. That means you are free to share and adapt the material in any format, including commercially, under two conditions: you credit the original, and you indicate if you made changes.",
        ], [
            "Share: copy and redistribute the content in any medium or format.",
            "Adapt: remix, transform and build upon it for any purpose, even commercially.",
            "Attribute: give appropriate credit and link to the license.",
            "No additional restrictions: don't add legal terms or technology that limit others' reuse.",
        ]),
        ("How to attribute", [
            "Attribution should name the source and link back. The recommended form is a line like: 'StudyBonk by TuffyCoder (studybonk.vercel.app), licensed under CC BY 4.0' — placed wherever you would naturally cite a source: a caption, a footer or a credits page. For code, keeping the LICENSE file and a mention of the repository is sufficient under MIT.",
        ], [
            "Credit line: StudyBonk by TuffyCoder.",
            "Link: https://studybonk.vercel.app (and/or github.com/TuffyCoder/StudyBonk for code).",
            "Note changes if you modified the content.",
        ]),
        ("Where the source lives", [
            "Everything — the generator, the content files, the design system and the documentation — is public at github.com/TuffyCoder/StudyBonk. Clone it, read it, or diff it against the live site; what you see online is exactly what is in the repository.",
        ], []),
        ("Contributing is welcome", [
            "Found a typo, a wrong answer or a topic StudyBonk should cover? Contributions are genuinely welcome: open an issue to report it, or fork the repository and submit a pull request. Corrections to study content are especially appreciated, because accurate free education is the whole point of the project.",
        ], []),
    ],
}
