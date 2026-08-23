# Deploying StudyBonk to Cloudflare Pages 🚀

## One-time setup

1. Push this repo to `github.com/TuffyCoder/StudyBonk`.
2. Go to the Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** and select the repo.
3. Settings:
   - **Framework preset:** Other
   - **Build command:** *(leave empty)*
   - **Output directory:** *(leave empty — repo root)*
4. Deploy. Done — the generated HTML, `assets/`, `sw.js`, `manifest.webmanifest`, `robots.txt` and `sitemap.xml` are all committed, so there is nothing to build.

`_headers` (Cloudflare Pages header rules) automatically applies:
- strict security headers (CSP with `script-src 'self'`, X-Frame-Options DENY, no-referrer, HSTS, Permissions-Policy)
- immutable caching for `/assets/*`

(The legacy `vercel.json` is kept for Vercel compatibility — Cloudflare Pages reads `_headers` instead.)

## Daily workflow

```bash
# edit content…
vim content/topic_biology.py

# rebuild (also validates internal links)
python3 scripts/build.py

# preview
python3 -m http.server 8080

# commit generated output with your changes
git add -A && git commit -m "content: new biology cluster" && git push
```

Cloudflare Pages deploys every push to `main` automatically (production) and every other branch (preview).

## Refreshing the creator avatar

```bash
python3 scripts/fetch_avatar.py   # build-time YouTube fetch (privacy-safe)
```

## Updating vendored AI libraries

```bash
curl -L "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@<version>/lib/index.js" -o assets/vendor/webllm.js
curl -L "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5" -o assets/vendor/transformers.js.mjs
python3 scripts/build.py
```

Then update the `wasmPaths` version pinned inside `assets/js/ai.js` if you bumped transformers.

## Checklist after each deploy

- [ ] `https://studybonk.pages.dev` loads with no console errors
- [ ] `/sitemap.xml` reachable
- [ ] DevTools → Network: zero third-party requests on a normal page
- [ ] Toggle light/dark, earn some XP, reload — progress persists
- [ ] `/sw.js` registered (Application tab) and offline mode works
