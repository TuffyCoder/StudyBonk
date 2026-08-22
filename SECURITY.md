# Security Policy 🛡️

StudyBonk is secure by design: a fully static site with no backend, no
database, no accounts, and no cookies. Strict security headers (including a
strict Content-Security-Policy that forbids third-party scripts) ship with
every response via `vercel.json`.

## Architecture highlights

- **Zero server-side storage** — there is no server to breach beyond static file hosting on Vercel's edge network.
- **Strict CSP** — `script-src 'self'`: scripts load from this origin only (model weights and the optional WASM runtime are data, fetched over allowed `connect-src` hosts).
- **Zero cookies** — nothing session-shaped to steal or hijack.
- **Client-side encryption** — sensitive local data (Bonk AI chat history) is encrypted at rest with a device-local AES-GCM key via WebCrypto.
- **Zero data retention** — we cannot retain what we never collect.
- **Local AI sandbox** — models run inside the browser sandbox; prompts never leave the device.

## Responsible disclosure 🐞

Found a vulnerability? Please report it privately:

**➡️ https://github.com/TuffyCoder/StudyBonk/security/advisories/new**

Please do not:
- test destructive techniques,
- attempt denial of service,
- degrade the experience for other users.

## Bug bounty 🏅

StudyBonk is a free, zero-revenue project, so the bounty is gratitude-based:

- Permanent listing in the **Hall of Bonk** (on `/security/`)
- Shout-out in release notes
- Extremely sincere thanks, on the record, forever

## Hall of Bonk

*No entries yet — the hall awaits its first hero. Could be you.*
