# Deploying StudyBonk to Vercel 🚀

## One-time setup

1. Push this repo to `github.com/TuffyCoder/StudyBonk`.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Settings:
   - **Framework preset:** Other
   - **Build command:** *(leave empty)*
   - **Output directory:** *(leave empty — repo root)*
4. Deploy. Done — the generated HTML, `assets/`, `sw.js`, `manifest.webmanifest`, `robots.txt` and `sitemap.xml` are all committed, so there is nothing to build.

`vercel.json` automatically applies:
- strict security headers (CSP with `script-src 'self'`, X-Frame-Options DENY, no-referrer, HSTS, Permissions-Policy)
- immutable caching for `/assets/*`
- clean URLs

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

Vercel deploys every push to `main` automatically.

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

- [ ] `https://studybonk.vercel.app` loads with no console errors
- [ ] `/sitemap.xml` reachable
- [ ] DevTools → Network: zero third-party requests on a normal page
- [ ] Toggle light/dark, earn some XP, reload — progress persists
- [ ] `/sw.js` registered (Application tab) and offline mode works
