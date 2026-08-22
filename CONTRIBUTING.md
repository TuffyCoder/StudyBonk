# Contributing to StudyBonk 🦊

Thanks for wanting to help — contributions are welcome, and the code being
open is the whole point.

## Ways to contribute

- **Content**: new topic clusters, better explanations, more practice questions (edit `content/topic_*.py`)
- **Bug reports**: open an issue with steps to reproduce
- **Features**: gamification ideas, tool improvements, AI prompts
- **Translations**: the content system is structured for future i18n

## Ground rules

1. **Privacy is non-negotiable.** No trackers, no analytics, no third-party scripts, no accounts, no server-side storage — ever. PRs adding any of these will be closed.
2. **Keep it vanilla.** HTML + CSS + dependency-free JavaScript + stdlib Python. The zero-dependency build is a feature.
3. **Content quality**: plain English, grade 8–10 reading level, friendly tone, no filler. Every claim should be accurate.
4. **Run the build** before committing:
   ```bash
   python3 scripts/build.py   # regenerates pages + validates internal links
   ```
5. Commit regenerated HTML together with your content changes.

## Content schema

Pillar content lives in `content/topic_<pillar>.py` — see `content/topic_math.py`
for the reference implementation of the schema (pillar → clusters → sections,
key concepts, study tips, practice questions, flashcards, FAQs, PAA, keywords).

## Reporting security issues

Please use [GitHub Security Advisories](https://github.com/TuffyCoder/StudyBonk/security/advisories/new),
not public issues. See [SECURITY.md](SECURITY.md).
