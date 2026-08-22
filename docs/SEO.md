# StudyBonk SEO Strategy 📈

How StudyBonk pursues a 100/100 SEO score on every page — with a long-tail
first strategy, structured data everywhere, and honest E-E-A-T signals.

## Technical foundation (every page)

| Element | Implementation |
|---|---|
| Meta title ≤60 chars | CTR-optimized with power words + `| StudyBonk` suffix |
| Meta description ≤155 | benefit + free + no sign-up hook |
| Keywords + long-tail meta | 10–20 question-based keywords per page |
| Canonical URLs | `https://studybonk.vercel.app` + clean paths |
| OpenGraph + Twitter cards | bundled og-image (1200×630, first-party) |
| JSON-LD | see schema matrix below |
| Internal linking | pillar ↔ clusters ↔ tools, breadcrumbs on all pages |
| Performance | zero third-party scripts, local fonts, deferred vanilla JS, SVG art, PWA caching |
| Indexation | `sitemap.xml` (all URLs), `robots.txt`, clean URL folders (`/math/algebra-basics/`) |

## JSON-LD schema matrix

| Page type | Schema |
|---|---|
| Home | WebSite, Organization, SoftwareApplication, FAQPage |
| Pillar hub | BreadcrumbList, CollectionPage, FAQPage |
| Cluster guide | BreadcrumbList, Article, FAQPage (+ HowTo on Study Skills pages) |
| Tools (flashcards/quiz/focus/dashboard/AI) | BreadcrumbList, WebApplication, FAQPage |
| Comparisons | BreadcrumbList, Article, FAQPage |
| Marketing kit | BreadcrumbList, VideoObject × scripts |
| About | BreadcrumbList, Article, Person (TuffyCoder) |
| Legal | BreadcrumbList |
| FAQ | BreadcrumbList, FAQPage |

## Topic cluster architecture

7 pillars, each with 6 cluster pages + matching flashcard deck + quiz bank:

- **Math** — algebra basics, fractions/decimals/percents, geometry, trigonometry, linear equations, word problems
- **Biology** — cells, photosynthesis, DNA & genetics, body systems, ecosystems, mitosis vs meiosis
- **Chemistry** — atomic structure, periodic table, bonding, reactions, moles, acids & bases
- **Physics** — motion & forces, energy, waves & sound, electricity, magnetism, light & optics
- **History** — ancient civilizations, American Revolution, WWI, WWII, Cold War, civil rights
- **SAT Prep** — reading, writing & grammar, math strategies, vocabulary, test-day, study schedule
- **Study Skills** — pomodoro, active recall, spaced repetition, note-taking, exam anxiety, memory techniques

Every cluster page includes: unique 500–700 word lesson, key concepts, study
tips, mini quiz, flashcard deck CTA, 4 FAQs, People-Also-Ask block, 10–20
long-tail keywords.

## Long-tail keyword strategy

Primary patterns woven through titles, H2s, FAQs and PAA blocks:

1. **Question-based**: "how to study math effectively", "why do I keep making careless mistakes"
2. **Comparison**: "studybonk vs quizlet", "anki vs quizlet for spaced repetition", "best free quizlet alternative"
3. **Problem-solving**: "how to catch up in math when you're behind", "how to stop panicking at word problems"
4. **Student struggle**: "is trigonometry hard", "why are word problems so hard"
5. **Intent-based (transactional-free)**: "free flashcard app without account", "practice quizzes with explanations"
6. **Privacy angle** (differentiator): "private study app no tracking", "study website without cookies"

Head terms (free study app, flashcards, study tool, learn fast, student help,
study online, study motivation, privacy study app) anchor the homepage and hub.

## E-E-A-T signals (every page)

- **Experience**: built by a real student-tool user, documented build-in-public on YouTube
- **Expertise**: named author byline (TuffyCoder + credentials) on every content page
- **Authoritativeness**: Organization + Person schema, public socials, open-source code
- **Trust**: "Why you can trust StudyBonk" block, verifiable zero-tracking claims, honest illustrative-only testimonials labeling, responsible disclosure policy

## CTR optimization

- Numbers and specificity in titles ("42 free guides", "3-minute read")
- Emoji where the SERP supports it (brand personality)
- Description formula: `[what you get] + [free/no sign-up] + [emotional hook]`
- Featured-snippet-shaped blocks: definition-first paragraphs, numbered steps, comparison tables
