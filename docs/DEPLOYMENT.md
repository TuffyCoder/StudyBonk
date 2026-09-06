# Deploying StudyBonk to GitHub Pages 🚀

## One-time setup

1. Push this repo to `github.com/TuffyCoder/StudyBonk`.
2. Repo → **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Pick **Branch: `main` / Folder: `/ (root)`** and save. Done — the generated HTML, `assets/`, `sw.js`, `manifest.webmanifest`, `robots.txt` and `sitemap.xml` are all committed, so there is nothing to build.
4. The site goes live at **https://tuffycoder.github.io/StudyBonk/** (first deploy takes a minute or two).

Because GitHub Pages serves project sites from the `/StudyBonk/` subpath, the generator (`scripts/build.py`) rewrites every `href`/`src` to a relative path per page and derives the service-worker/manifest base from the site URL — the site works unchanged at any base URL. A `<meta http-equiv="Content-Security-Policy">` ships the security policy in-page (GitHub Pages cannot set custom HTTP headers, so `_headers` is not used).

## Daily workflow

```bash
# edit content…
vim content/topic_biology.py

# rebuild (also validates internal links)
python3 scripts/build.py

# preview at the real subpath
mkdir -p /tmp/ghpages && rm -rf /tmp/ghpages/StudyBonk && cp -r . /tmp/ghpages/StudyBonk && rm -rf /tmp/ghpages/StudyBonk/.git
python3 -m http.server 8090 --directory /tmp/ghpages   # → http://localhost:8090/StudyBonk/

# commit generated output with your changes
git add -A && git commit -m "content: new biology cluster" && git push
```

GitHub Pages redeploys automatically on every push to `main` (usually live within ~90 seconds).

## Refreshing the creator avatar

```bash
python3 scripts/fetch_avatar.py   # build-time YouTube fetch (privacy-safe)
```

## AI configuration

The AI ("Bonk AI") runs on the OpenAI API using each student's own free key, entered on `/ai/` and stored encrypted (AES-GCM) in their browser. There is no server-side key or model — nothing to configure at deploy time. The model id is pinned in `assets/js/bonk-model.js` (`DEFAULT_MODEL`).

## Checklist after each deploy

- [ ] `https://tuffycoder.github.io/StudyBonk/` loads with no console errors
- [ ] `/StudyBonk/sitemap.xml` reachable
- [ ] DevTools → Network: zero third-party requests on a normal page (OpenAI calls happen only in API Mode after you connect a key)
- [ ] Toggle light/dark, earn some XP, reload — progress persists
- [ ] `/StudyBonk/sw.js` registered (Application tab) and offline mode works
- [ ] Connect a free OpenAI key on `/ai/` → Bonk AI replies; the key survives reload, and Delete removes it
