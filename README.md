# StudyBonk 🦊⚡

**A free, ethical, privacy-first study platform — with Duolingo-style gamification and a local AI tutor.**

🌐 **Live:** https://tuffycoder.github.io/StudyBonk/
📦 **Source:** https://github.com/TuffyCoder/StudyBonk
👤 **Creator:** [TuffyCoder](https://www.youtube.com/@TuffyCoder) · ethical developer, privacy-focused builder, open-source contributor

---

## What is StudyBonk?

StudyBonk is a complete study toolkit that respects students:

- 🃏 **Flashcards** with Leitner spaced repetition — 40+ built-in decks
- 🎯 **Practice quizzes** with instant, explained feedback
- ⏱️ **Pomodoro focus timer** with mascot hype
- 🤖 **Bonk AI** — a tiny-but-smart tutor running **100% in your browser** (Instant Mode + optional local quantized LLMs via WebGPU — no API, ever)
- 🔥 **Gamification**: XP, levels, streaks (with freezes), daily quests, weekly challenges, 15 badges, Bonk Challenges
- 🌙 Light/dark mode, offline support (PWA), zero sign-up

**Privacy architecture:** no accounts · no cookies · no analytics · no third-party scripts · no server-side storage · everything in `localStorage` on the user's device. Verifiable — the code is right here.

## Built with

![Built with Python](https://img.shields.io/badge/built%20with-Python-3776AB) ![HTML & CSS](https://img.shields.io/badge/powered%20by-HTML%20%26%20CSS-E34F26) ![Enhanced with JavaScript](https://img.shields.io/badge/enhanced%20with-JavaScript-F7DF1E) ![Hosted on GitHub Pages](https://img.shields.io/badge/hosted%20on-GitHub%20Pages-181717) ![AI via OpenAI API](https://img.shields.io/badge/AI-OpenAI%20API%20(bring%20your%20own%20free%20key)-412991)

- **Python** — the static-site generator (`scripts/build.py`, stdlib only)
- **HTML & CSS** — hand-crafted semantic markup + design system
- **JavaScript** — vanilla ES2020 modules, zero frameworks, zero trackers
- **GitHub Pages** — free static hosting straight from the repo
- **Local AI** — vendored WebLLM + Transformers.js; quantized Qwen 2.5 / Phi-3.5 Mini / Gemma 2 models

## Repository layout

```
scripts/build.py          # static site generator (run: python3 scripts/build.py)
scripts/fetch_avatar.py   # build-time creator avatar refresh (privacy-safe)
content/                  # ALL site content lives here
  site.py                 #   brand, nav, badges, compliance, testimonials
  pages.py                #   copy for home/tools/about/trust/security pages
  topic_*.py              #   pillar content (7 pillars × 6 clusters each)
  faqs.py / compare.py / marketing.py / legal.py
assets/
  css/style.css           # design system (tokens, themes, components)
  js/                     # storage, gamification, flashcards, quiz, focus,
                          # dashboard, ai, theme, nav, components, sw boot
  vendor/                 # webllm.js + transformers.js.mjs (vendored, no CDN scripts)
  img/ fonts/             # SVG logo/mascot, icons, fonts (bundled locally)
index.html …              # generated output (committed for zero-build deploys)
sw.js manifest.webmanifest robots.txt sitemap.xml
```

## Development

```bash
# build the site (regenerates all HTML + study-data.js + sitemap + sw)
python3 scripts/build.py

# preview locally
python3 -m http.server 8080   # → http://localhost:8080

# refresh the creator avatar from YouTube (build-time only — never at runtime)
python3 scripts/fetch_avatar.py
```

The generated HTML is committed, so GitHub Pages deploys with **no build step**. After editing `content/` or `assets/`, re-run `build.py` and commit the result.

## Deployment (GitHub Pages)

The site is published from the repo itself: push to `main`, then GitHub serves the root as a static site at `https://tuffycoder.github.io/StudyBonk/`. No build command, no output directory — the committed HTML *is* the site. Because it serves from a `/StudyBonk/` subpath, the generator rewrites every asset link to a relative path at build time, so it works unchanged at any base URL. A `<meta>` CSP ships the security policy (GitHub Pages can't set HTTP headers).

## The local AI

Bonk AI defaults to **Instant Mode** — a zero-download engine with intent detection, retrieval over the built-in knowledge base (400+ flashcards of real content), a flashcard generator, quiz builder, homework explainer, safe arithmetic, meme mode and coaching.

Opt-in **Model Mode** loads a distilled, quantized model into the browser:

| Model | Size | RAM | Engine |
|---|---|---|---|
| Bonk Lite — Qwen 2.5 0.5B Q4 | ~400 MB download | ~600 MB | WebGPU |
| Bonk Core — Qwen 2.5 1.5B Q4 | ~900 MB | ~1.2 GB | WebGPU |
| Bonk Pro — Phi-3.5 Mini Q4 | ~2.2 GB | ~2.6 GB | WebGPU |
| WASM fallback — Qwen 2.5 0.5B Q8 | ~510 MB | ~500 MB | WASM |

Models are downloaded once from public model CDNs (the only cross-origin request StudyBonk ever makes, and it contains zero user data), cached by the browser, and run fully offline afterwards. Chat history is AES-GCM encrypted in `localStorage` with a one-click destroy button.

## Security & disclosure

See [SECURITY.md](SECURITY.md). Report vulnerabilities via
[GitHub Security Advisories](https://github.com/TuffyCoder/StudyBonk/security/advisories/new).
Confirmed reporters join the **Hall of Bonk** 🏅

## License

Dual-licensed: **MIT** for code, **CC BY 4.0** for content. See [LICENSE](LICENSE).

---

Made with 💛 and zero trackers by **TuffyCoder** · Stay curious, stay bonky. 🦊
