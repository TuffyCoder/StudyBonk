#!/usr/bin/env python3
"""StudyBonk static site generator.

Reads content from content/*.py and emits the complete site (HTML pages,
sitemap.xml, robots.txt, manifest, service worker, study-data.js) into the
repository root, ready for Vercel.

Zero dependencies — Python 3.9+ standard library only.
Run:  python3 scripts/build.py
"""

import html
import json
import sys
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from content import site, topics, pages, faqs as faqs_mod  # noqa: E402

try:
    from content.compare import COMPARES
    from content.marketing import MARKETING
    from content.legal import TERMS, PRIVACY, COOKIES, LICENSE_PAGE
except ImportError as e:
    print(f"!! content modules missing: {e}")
    COMPARES, MARKETING = [], {}
    TERMS = PRIVACY = COOKIES = LICENSE_PAGE = None

S = site.SITE
PILLARS = topics.get_pillars(site.PILLAR_ORDER)
TODAY = date.today().isoformat()
NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

E = html.escape


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

def ul(items, cls=""):
    c = f' class="{cls}"' if cls else ""
    lis = "".join(f"<li>{E(i)}</li>" for i in items)
    return f"<ul{c}>{lis}</ul>"

def paras(items):
    return "".join(f"<p>{E(p)}</p>" for p in items)

def link_list(links):
    return "".join(f'<a href="{href}">{E(label)}</a>' for label, href in links)


# --------------------------------------------------------------------------
# JSON-LD builders
# --------------------------------------------------------------------------

def schema_website():
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": S["name"],
        "url": S["url"],
        "description": S["description"],
        "inLanguage": "en",
        "publisher": {"@id": S["url"] + "/#organization"},
    }

def schema_organization():
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": S["url"] + "/#organization",
        "name": S["name"],
        "url": S["url"],
        "logo": S["url"] + "/assets/img/logo.svg",
        "description": S["description"],
        "founder": {
            "@type": "Person",
            "name": site.CREATOR["name"],
            "url": site.CREATOR["channel"],
            "sameAs": [s["url"] for s in site.SOCIALS],
        },
        "sameAs": [s["url"] for s in site.SOCIALS],
    }

def schema_software_app():
    return {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": S["name"],
        "url": S["url"],
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Any (web browser)",
        "description": S["description"],
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "author": {"@type": "Person", "name": site.CREATOR["name"]},
    }

def schema_breadcrumb(trail):
    # trail: [(name, path), ...] starting with Home
    items = []
    for i, (name, path) in enumerate(trail, 1):
        items.append({
            "@type": "ListItem",
            "position": i,
            "name": name,
            "item": S["url"] + path,
        })
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}

def schema_faq(faq_list):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in faq_list
        ],
    }

def schema_article(h1, path, description, author=True):
    out = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": h1,
        "description": description,
        "mainEntityOfPage": S["url"] + path,
        "datePublished": TODAY,
        "dateModified": TODAY,
        "image": S["url"] + "/assets/img/og-image.png",
        "publisher": {"@id": S["url"] + "/#organization"},
    }
    if author:
        out["author"] = {
            "@type": "Person",
            "name": site.CREATOR["name"],
            "url": site.CREATOR["channel"],
            "jobTitle": "Ethical developer · Privacy-focused builder · Open-source contributor",
        }
    return out

def schema_webapp(name, path, description):
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": name,
        "url": S["url"] + path,
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Any (web browser)",
        "description": description,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "author": {"@type": "Person", "name": site.CREATOR["name"]},
        "publisher": {"@id": S["url"] + "/#organization"},
    }

def schema_howto(name, description, steps):
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": name,
        "description": description,
        "totalTime": "PT25M",
        "step": [
            {"@type": "HowToStep", "position": i, "name": s[:80], "text": s}
            for i, s in enumerate(steps, 1)
        ],
    }


# --------------------------------------------------------------------------
# Head + layout
# --------------------------------------------------------------------------

SOCIAL_ICONS = {
    "github": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.72-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
    "youtube": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z"/></svg>',
    "tiktok": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.13V9.4a6.33 6.33 0 0 0-1-.05A6.34 6.34 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z"/></svg>',
    "reddit": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 11.78a2.76 2.76 0 0 0-4.72-1.94 13.66 13.66 0 0 0-6.68-2.14l1.32-4.24 3.63.77a1.93 1.93 0 1 0 .2-1.1l-4.42-.94a.55.55 0 0 0-.65.37l-1.58 5.08a13.68 13.68 0 0 0-6.92 2.15 2.76 2.76 0 1 0-3.05 4.48 5.5 5.5 0 0 0-.05.82c0 4.2 4.63 7.6 10.34 7.6s10.34-3.4 10.34-7.6a5.5 5.5 0 0 0-.05-.82A2.76 2.76 0 0 0 24 11.78ZM7.6 13.65a1.38 1.38 0 1 1 1.38 1.38 1.38 1.38 0 0 1-1.38-1.38Zm7.15 4.34a4.71 4.71 0 0 1-3.39 1.13 4.71 4.71 0 0 1-3.38-1.13.55.55 0 0 1 .77-.78 3.72 3.72 0 0 0 2.61.81 3.72 3.72 0 0 0 2.62-.81.55.55 0 1 1 .77.78Zm-.21-2.96a1.38 1.38 0 1 1 1.38-1.38 1.38 1.38 0 0 1-1.38 1.38Z"/></svg>',
}

def head_html(page):
    path = page["path"]
    canonical = S["url"] + ("" if path == "/" else path)
    kw = list(page.get("keywords", [])) + list(page.get("longtail", []))
    schemas = page.get("schema", [])
    ld = "\n".join(
        '<script type="application/ld+json">' + json.dumps(s, ensure_ascii=False) + "</script>"
        for s in schemas
    )
    return f"""<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{E(page['title'])}</title>
<meta name="description" content="{E(page['description'])}">
<meta name="keywords" content="{E(', '.join(kw))}">
<meta name="author" content="TuffyCoder">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="StudyBonk">
<meta property="og:title" content="{E(page['title'])}">
<meta property="og:description" content="{E(page['description'])}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{S['url']}/assets/img/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{E(page['title'])}">
<meta name="twitter:description" content="{E(page['description'])}">
<meta name="twitter:image" content="{S['url']}/assets/img/og-image.png">
<meta name="theme-color" content="#4A90E2" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1A1A1A" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<link rel="stylesheet" href="/assets/css/style.css">
<script src="/assets/js/theme-boot.js"></script>
{ld}
</head>"""


def nav_html(active):
    links = ""
    for item in site.NAV:
        badge = f'<span class="nav-badge">{E(item["badge"])}</span>' if item.get("badge") else ""
        links += f'<li><a href="{item["href"]}">{E(item["label"])}{badge}</a></li>'
    return f"""<a class="skip-link" href="#main">Skip to content</a>
<header class="nav-wrap">
<nav class="nav container" aria-label="Main navigation">
  <a class="brand" href="/" aria-label="StudyBonk home">
    <img class="brand-logo" src="/assets/img/logo.svg" alt="" width="38" height="38">
    <span class="brand-name">Study<em>Bonk</em></span>
  </a>
  <ul class="nav-links">{links}</ul>
  <div class="nav-actions">
    <span class="chip chip-yellow nowrap" data-nav-xp title="Your XP — saved locally">⚡ 0 XP</span>
    <button class="theme-toggle" data-theme-toggle aria-label="Toggle light and dark mode" type="button">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4"/></svg>
    </button>
    <a class="btn btn-primary btn-sm nav-cta-desktop" href="/learn/">Start free</a>
    <button class="nav-burger" aria-expanded="false" aria-label="Open menu" type="button"><span></span><span></span><span></span></button>
  </div>
</nav>
</header>"""


def footer_html():
    cols = ""
    for col in site.FOOTER_COLUMNS:
        links = "".join(
            f'<li><a href="{href}">{E(label)}</a></li>' for label, href in col["links"]
        )
        cols += f'<nav class="footer-col" aria-label="{E(col["title"])}"><h3>{E(col["title"])}</h3><ul>{links}</ul></nav>'
    socials = "".join(
        f'<a class="social-btn" href="{s["url"]}" rel="noopener me" target="_blank" aria-label="TuffyCoder on {E(s["name"])}">{SOCIAL_ICONS[s["icon"]]}{E(s["name"])}</a>'
        for s in site.SOCIALS
    )
    badges = "".join(f'<span class="chip" title="{E(d)}">{E(t)}</span>' for t, d in site.TECH_BADGES)
    compliance = "".join(f"<li>{E(c)}</li>" for c in site.COMPLIANCE)
    creds = "".join(f'<span class="chip chip-blue">{E(c)}</span>' for c in site.CREATOR["credentials"])
    reminders = "".join(f'<span class="reminder">{icon} {E(txt)}</span>' for icon, txt in site.REMINDERS)
    year = date.today().year
    return f"""<section class="section-sm" aria-label="Promises">
  <div class="container reminders">{reminders}</div>
</section>
<footer class="footer">
<div class="container">
  <div class="footer-grid">
    <div class="footer-brand">
      <a class="brand" href="/" aria-label="StudyBonk home">
        <img class="brand-logo" src="/assets/img/logo.svg" alt="" width="38" height="38">
        <span class="brand-name">Study<em>Bonk</em></span>
      </a>
      <p>{E(S['tagline'])} A free, ethical, privacy-focused study platform: flashcards, quizzes, focus timer, XP and a local AI tutor. Created by <a href="/about/">TuffyCoder</a>.</p>
      <div class="social-row">{socials}</div>
      <div class="mt-2 creator-creds">{creds}</div>
      <p class="creator-sign mt-2">{E(site.CREATOR['signature'])}</p>
    </div>
    {cols}
  </div>
  <details class="mt-3 compliance-strip">
    <summary style="cursor:pointer;font-weight:800;padding:10px 0">🔒 Privacy &amp; security guarantees (click to expand)</summary>
    <ul class="mt-1">{compliance}</ul>
  </details>
  <div class="footer-bottom">
    <span>© {year} StudyBonk · Made with 💛 &amp; zero trackers · <a href="/license/">Open-source</a></span>
    <div class="tech-badges">{badges}</div>
  </div>
</div>
</footer>
<a class="fab" href="/ai/" aria-label="Ask Bonk AI — local, private AI tutor">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/><circle cx="12" cy="12" r="4"/></svg>
  <span class="fab-label">Ask Bonk AI</span>
</a>"""


def render(page, body):
    scripts = "".join(
        f'<script src="{s}" defer></script>'
        for s in [
            "/assets/js/storage.js",
            "/assets/js/components.js",
            "/assets/js/gamification.js",
            "/assets/js/nav.js",
            "/assets/js/theme.js",
        ]
        + page.get("scripts", [])
    )
    active = page.get("nav_active", "")
    marker = ""
    if active:
        marker = f'<script type="application/json" id="sb-active-nav">{json.dumps(active)}</script>'
    return f"""<!doctype html>
<html lang="en">
{head_html(page)}
<body>
{nav_html(active)}
<main id="main">
{body}
</main>
{footer_html()}
{marker}
{scripts}
</body>
</html>"""


# --------------------------------------------------------------------------
# Shared page components
# --------------------------------------------------------------------------

def faq_section(faq_list, title="Frequently asked questions", eyebrow="FAQ"):
    if not faq_list:
        return ""
    items = "".join(
        f'<details class="faq"><summary>{E(q)}</summary><div class="faq-body">{E(a)}</div></details>'
        for q, a in faq_list
    )
    return f"""
<section class="section" aria-labelledby="faq-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">{E(eyebrow)}</span>
      <h2 id="faq-h">{E(title)}</h2>
    </div>
    <div class="faq-list">{items}</div>
  </div>
</section>"""


def paa_section(paa_list):
    if not paa_list:
        return ""
    items = "".join(
        f'<details class="faq"><summary>{E(q)}</summary><div class="faq-body">{E(a)}</div></details>'
        for q, a in paa_list
    )
    return f"""
<section class="section-sm" aria-labelledby="paa-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">People also ask</span>
      <h2 id="paa-h">Questions students also ask</h2>
    </div>
    <div class="faq-list">{items}</div>
  </div>
</section>"""


def byline_block():
    c = site.CREATOR
    return f"""
<div class="byline mt-3">
  <img src="{c['avatar']}" alt="TuffyCoder, creator of StudyBonk" width="60" height="60" loading="lazy">
  <div class="byline-text">
    <strong>Written by {E(c['name'])}</strong>
    <span>Ethical developer · Privacy-focused builder · Open-source contributor · <a href="/about/">About the creator</a></span>
  </div>
</div>"""


def trust_band():
    items = "".join(
        f'<div class="card card-hover trust-item reveal"><div class="card-icon">{t["icon"]}</div>'
        f'<h3>{E(t["title"])}</h3><p>{E(t["body"])}</p></div>'
        for t in site.TRUST_REASONS[:3]
    )
    return f"""
<section class="section-sm" aria-labelledby="trustband-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Why you can trust StudyBonk</span>
      <h2 id="trustband-h">No accounts. No tracking. Open-source.</h2>
      <p>Every promise on this page is verifiable — <a href="/trust/">see the proof</a> or <a href="{E(pages.REPO)}">read the code</a>.</p>
    </div>
    <div class="grid grid-3">{items}</div>
  </div>
</section>"""


def cta_band(title="Ready to bonk your brain into shape?", sub=None, cta="Start studying free", href="/learn/"):
    sub = sub or (
        "No sign-up. No ads. No tracking. Your progress saves automatically "
        "in your browser — start in the next ten seconds."
    )
    return f"""
<section class="section" aria-labelledby="cta-h">
  <div class="container">
    <div class="cta-band reveal">
      <span class="eyebrow" style="background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.4);color:#fff">100% free · forever</span>
      <h2 id="cta-h">{E(title)}</h2>
      <p>{E(sub)}</p>
      <div class="btn-row" style="justify-content:center;margin-top:1.5rem">
        <a class="btn btn-lg" href="{href}">{E(cta)}</a>
        <a class="btn btn-lg" href="/ai/" style="background:transparent;color:#fff;border-color:rgba(255,255,255,.6)">Try Bonk AI</a>
      </div>
    </div>
  </div>
</section>"""


def breadcrumb_html(trail):
    parts = []
    for i, (name, path) in enumerate(trail):
        last = i == len(trail) - 1
        if last:
            parts.append(f'<span aria-current="page">{E(name)}</span>')
        else:
            parts.append(f'<a href="{path}">{E(name)}</a>')
    sep = '<span class="sep" aria-hidden="true">›</span>'
    return f'<nav class="breadcrumb" aria-label="Breadcrumb">{sep.join(parts)}</nav>'


def page_hero(h1, lead, eyebrow=None, chips=None):
    eyebrow_html = f'<span class="eyebrow">{E(eyebrow)}</span>' if eyebrow else ""
    chips_html = ""
    if chips:
        chips_html = '<div class="hero-badges">' + "".join(
            f'<span class="chip">{E(c)}</span>' for c in chips
        ) + "</div>"
    return f"""
<section class="hero" style="padding-bottom:0">
  <div class="container">
    {eyebrow_html}
    <h1>{h1}</h1>
    <p class="lead">{E(lead)}</p>
    {chips_html}
  </div>
</section>"""


def content_sections_html(sections):
    out = []
    for sec in sections:
        body = paras(sec.get("paras", []))
        if sec.get("bullets"):
            body += ul(sec["bullets"])
        if sec.get("example"):
            ex = sec["example"]
            body += (
                f'<div class="example-box"><div class="example-title">💡 {E(ex["title"])}</div>'
                f"<p>{E(ex['body'])}</p></div>"
            )
        out.append(f"<h2>{E(sec['h2'])}</h2>{body}")
    return "".join(out)


# --------------------------------------------------------------------------
# Home page
# --------------------------------------------------------------------------

def total_cards():
    return sum(len(c["flashcards"]) for p in PILLARS for c in p["clusters"])

def total_questions():
    return sum(len(c["practice"]) for p in PILLARS for c in p["clusters"])

def total_guides():
    return sum(len(p["clusters"]) for p in PILLARS)

def home_page():
    h = pages.HOME
    stat_chips = [
        f"{total_guides()} free topic guides",
        f"{total_cards()}+ built-in flashcards",
        f"{total_questions()}+ explained quiz questions",
        "100% free · no account",
    ]
    features = "".join(
        f'<div class="card card-hover feature-card reveal">'
        f'<div class="card-icon">{f["icon"]}</div><h3>{E(f["title"])}</h3><p>{E(f["body"])}</p>'
        f'<div class="btn-row"><a class="btn btn-ghost btn-sm" href="{f["href"]}">Open tool →</a></div></div>'
        for f in site.FEATURES
    )
    steps = "".join(
        f'<div class="card card-hover reveal"><div class="card-icon yellow">{s["emoji"]}</div>'
        f'<h3>{E(s["title"])}</h3><p>{E(s["body"])}</p></div>'
        for s in h["how_steps"]
    )
    game_points = "".join(
        f'<div class="card card-hover reveal"><div class="card-icon green">{icon}</div>'
        f'<h3>{E(title)}</h3><p>{E(body)}</p></div>'
        for icon, title, body in h["gamification_points"]
    )
    ai_points = "".join(
        f'<div class="card card-hover reveal"><div class="card-icon purple">{icon}</div>'
        f'<h3>{E(title)}</h3><p>{E(body)}</p></div>'
        for icon, title, body in h["ai_points"]
    )
    testimonials = "".join(
        f'<div class="card testimonial reveal"><span class="testimonial-quote-mark" aria-hidden="true">&ldquo;</span>'
        f'<blockquote>{E(t["quote"])}</blockquote>'
        f'<div class="testimonial-author"><div class="testimonial-avatar">{t["emoji"]}</div>'
        f'<div><strong>{E(t["name"])}</strong><span>{E(t["role"])}</span></div></div></div>'
        for t in site.TESTIMONIALS
    )
    topic_cards = "".join(
        f'<a class="card card-hover topic-card card-link" href="/{p["slug"]}/">'
        f'<div class="topic-emoji" aria-hidden="true">{p["emoji"]}</div>'
        f'<h3>{E(p["title"])}</h3><p>{E(p["summary"])}</p>'
        f'<div class="topic-meta"><span class="chip chip-blue">{len(p["clusters"])} guides</span>'
        f'<span class="chip">{len(p["clusters"]) * 10} flashcards</span></div></a>'
        for p in PILLARS
    )
    compare_cards = ""
    for card in site.COMPARISON_CARDS:
        highlight = " highlight" if card["highlight"] else ""
        rows = ""
        for feat, val in card["features"]:
            if val is True:
                rows += f'<li><span class="compare-yes">✓</span> {E(feat)}</li>'
            elif val is False:
                rows += f'<li><span class="compare-no">✗</span> {E(feat)}</li>'
            else:
                rows += f'<li><span class="compare-mid">~</span> {E(feat)} — <em>{E(val)}</em></li>'
        cta = ""
        if card["cta"]:
            label, href = card["cta"]
            cta = f'<a class="btn btn-primary" href="{href}">{E(label)}</a>'
        else:
            cta = '<span class="chip">The freemium usual</span>'
        compare_cards += (
            f'<div class="card compare-card{highlight}"><h3>{E(card["name"])}</h3>'
            f'<p class="card-kicker">{E(card["tag"])}</p><p class="compare-price">{E(card["price"])}</p>'
            f'<ul class="compare-rows">{rows}</ul><div class="btn-row" style="justify-content:center">{cta}</div></div>'
        )
    hero_chips = "".join(f'<span class="chip">{E(c)}</span>' for c in stat_chips)
    game_faqs = faqs_mod.FAQS[:6]

    body = f"""
<section class="hero">
  <div class="container hero-grid">
    <div>
      <span class="eyebrow">🚀 Free forever · No sign-up · Open-source</span>
      <h1>{E(h['hero_title'])}</h1>
      <p class="lead">{E(h['hero_sub'])}</p>
      <div class="btn-row mt-3">
        <a class="btn btn-yellow btn-lg" href="/learn/">Start studying free</a>
        <a class="btn btn-ghost btn-lg" href="/ai/">Meet Bonk AI 🤖</a>
      </div>
      <div class="hero-badges">{hero_chips}</div>
    </div>
    <div class="hero-art">
      <img class="hero-mascot" src="/assets/img/mascot.svg" alt="Bonk, the StudyBonk mascot, waving with a graduation cap" width="340" height="386">
      <div class="float-chip chip-1">🔥 <span>12-day streak<small> · saved locally</small></span></div>
      <div class="float-chip chip-2">⚡ <span>Level 7<small> · Streak Knight</small></span></div>
      <div class="float-chip chip-3">🔒 <span>No trackers<small> · verify it</small></span></div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="features-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Everything you need</span>
      <h2 id="features-h">A complete study toolkit — every piece free</h2>
      <p>Flashcards with spaced repetition, explained quizzes, a focus timer, XP and streaks, and a private local AI tutor. Built for how students actually study.</p>
    </div>
    <div class="grid grid-3">{features}</div>
  </div>
</section>

<section class="section" aria-labelledby="how-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">How it works</span>
      <h2 id="how-h">{E(h['how_title'])}</h2>
      <p>{E(h['how_sub'])}</p>
    </div>
    <div class="grid grid-3">{steps}</div>
  </div>
</section>

<section class="section" aria-labelledby="topics-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Topic clusters</span>
      <h2 id="topics-h">Pick your subject, we'll bring the bonks</h2>
      <p>Deep guides, matching flashcard decks and explained quizzes — organized into topic clusters so you always know what to study next.</p>
    </div>
    <div class="grid grid-3">{topic_cards}</div>
    <div class="btn-row mt-3" style="justify-content:center"><a class="btn btn-ghost" href="/learn/">Browse all topics →</a></div>
  </div>
</section>

<section class="section" aria-labelledby="game-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Gamification</span>
      <h2 id="game-h">{E(h['gamification_title'])}</h2>
      <p>{E(h['gamification_sub'])}</p>
    </div>
    <div class="grid grid-3">{game_points}</div>
    <div class="btn-row mt-3" style="justify-content:center"><a class="btn btn-primary" href="/dashboard/">See your dashboard →</a></div>
  </div>
</section>

<section class="section" aria-labelledby="ai-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Local AI · No API</span>
      <h2 id="ai-h">{E(h['ai_title'])}</h2>
      <p>{E(h['ai_sub'])}</p>
    </div>
    <div class="grid grid-3">{ai_points}</div>
    <div class="btn-row mt-3" style="justify-content:center"><a class="btn btn-primary" href="/ai/">Chat with Bonk AI →</a></div>
  </div>
</section>

<section class="section" aria-labelledby="testi-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Testimonials</span>
      <h2 id="testi-h">{E(h['testimonials_title'])}</h2>
      <p>{E(h['testimonials_note'])}</p>
    </div>
    <div class="grid grid-2">{testimonials}</div>
  </div>
</section>

<section class="section" aria-labelledby="compare-h">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Free vs "free"</span>
      <h2 id="compare-h">StudyBonk vs the typical study app</h2>
      <p>Everything is free here — so what's the catch? There isn't one. That's the whole point.</p>
    </div>
    <div class="compare-grid">{compare_cards}</div>
    <p class="text-center small muted mt-2">Fair comparisons with specific apps: <a href="/vs/quizlet/">StudyBonk vs Quizlet</a> · <a href="/vs/anki/">vs Anki</a> · <a href="/vs/kahoot/">vs Kahoot</a></p>
  </div>
</section>

{trust_band()}
{faq_section(game_faqs, h['faq_title'])}
{cta_band()}"""

    return render(
        {
            "path": "/",
            "title": S["name"] + " — Free Study App with Local AI | No Sign-Up",
            "description": (
                "Free gamified study platform: flashcards, explained quizzes, focus timer, XP & streaks, "
                "plus a local AI tutor. No ads, no tracking, no account."
            ),
            "keywords": S["keywords"],
            "longtail": [
                "free study app without account",
                "private flashcard app no tracking",
                "gamified study tool like duolingo for school",
                "free ai study tutor that runs locally",
                "study website that works offline",
                "no sign up quiz maker for students",
            ],
            "schema": [
                schema_website(),
                schema_organization(),
                schema_software_app(),
                schema_faq(game_faqs),
            ],
            "nav_active": "/",
        },
        body,
    )


# --------------------------------------------------------------------------
# Learn hub + pillar + cluster pages
# --------------------------------------------------------------------------

def learn_page():
    cards = ""
    for p in PILLARS:
        clusters = "".join(
            f'<li><a href="/{p["slug"]}/{c["slug"]}/">{E(c["title"])}</a></li>'
            for c in p["clusters"]
        )
        cards += (
            f'<div class="card card-hover topic-card reveal">'
            f'<div class="topic-emoji" aria-hidden="true">{p["emoji"]}</div>'
            f'<h3><a href="/{p["slug"]}/">{E(p["title"])}</a></h3>'
            f'<p>{E(p["tagline"])}</p>'
            f'<div class="topic-meta"><span class="chip chip-blue">{len(p["clusters"])} guides</span>'
            f'<span class="chip chip-yellow">deck + quiz included</span></div>'
            f'<ul class="mt-2" style="font-size:.92rem">{clusters}</ul></div>'
        )
    how = "".join(
        f'<div class="card card-hover reveal"><h3>{i+1}. {E(t)}</h3><p>{E(d)}</p></div>'
        for i, (t, d) in enumerate(pages.LEARN["how_to_use"])
    )
    body = f"""
{page_hero(pages.LEARN['h1'], pages.LEARN['lead'], eyebrow='Topic hub', chips=['No sign-up required', 'Everything saved in your browser', 'Light & dark mode'])}
<section class="section" aria-labelledby="pillars-h">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Pillar topics</span><h2 id="pillars-h">Seven pillars, one bonk at a time</h2></div>
    <div class="grid grid-2">{cards}</div>
  </div>
</section>
<section class="section-sm" aria-labelledby="howuse-h">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Study loop</span><h2 id="howuse-h">{E(pages.LEARN['how_to_use_title'])}</h2></div>
    <div class="grid grid-4">{how}</div>
  </div>
</section>
{trust_band()}
{cta_band()}"""
    return render(
        {
            "path": "/learn/",
            "title": pages.LEARN["meta_title"],
            "description": pages.LEARN["meta_description"],
            "keywords": ["free study guides", "study topics", "learn online free"] + S["keywords"],
            "longtail": [
                "free study guides for every subject",
                "where to study online for free without an account",
                "topic by topic study plan free",
                "best free website to study for exams",
            ],
            "schema": [
                schema_breadcrumb([("Home", "/"), ("Learn", "/learn/")]),
            ],
            "nav_active": "/learn/",
        },
        body,
    )


def pillar_page(p):
    trail = [("Home", "/"), ("Learn", "/learn/"), (p["title"], f"/{p['slug']}/")]
    cluster_cards = ""
    for c in p["clusters"]:
        cluster_cards += (
            f'<a class="card card-hover card-link reveal" href="/{p["slug"]}/{c["slug"]}/">'
            f'<div class="card-kicker">{E(p["title"])} guide</div>'
            f'<h3>{E(c["title"])}</h3><p>{E(c["summary"])}</p>'
            f'<div class="topic-meta"><span class="chip chip-blue">Guide</span>'
            f'<span class="chip chip-yellow">{len(c["flashcards"])} flashcards</span>'
            f'<span class="chip chip-green">{len(c["practice"])} quiz questions</span></div></a>'
        )
    bullets = ul(p["bullets"])
    intro = paras(p["intro"])
    body = f"""
<section class="hero" style="padding-bottom:0">
  <div class="container">
    {breadcrumb_html(trail)}
    <span class="eyebrow">{p['emoji']} {E(p['title'])} pillar</span>
    <h1>{E(p['h1'])}</h1>
    <p class="lead">{E(p['tagline'])}</p>
    <div class="hero-badges"><span class="chip">🎟️ No sign-up required</span><span class="chip">💾 Saves in your browser</span><span class="chip">🌙 Dark mode ready</span></div>
  </div>
</section>
<section class="section-sm"><div class="container grid grid-2" style="align-items:center">
  <div class="article"><h2 class="mt-0">What you'll learn</h2>{intro}{bullets}</div>
  <div class="card card-glass">
    <h3>Quick stats</h3>
    <div class="stat-row">
      <div class="stat-box"><strong>{len(p['clusters'])}</strong><span>guides</span></div>
      <div class="stat-box"><strong>{sum(len(c['flashcards']) for c in p['clusters'])}</strong><span>flashcards</span></div>
      <div class="stat-box"><strong>{sum(len(c['practice']) for c in p['clusters'])}</strong><span>quiz Qs</span></div>
    </div>
    <div class="btn-row mt-3">
      <a class="btn btn-primary" href="/flashcards/?deck={p['slug']}">Open flashcards</a>
      <a class="btn btn-ghost" href="/quiz/?topic={p['slug']}">Take a quiz</a>
    </div>
  </div>
</div></section>
<section class="section" aria-labelledby="clusters-h">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Cluster guides</span><h2 id="clusters-h">Every {E(p['title'].lower())} guide</h2></div>
    <div class="grid grid-3">{cluster_cards}</div>
  </div>
</section>
{paa_section(p['paa'])}
{byline_block()}
{trust_band()}
{faq_section(p['faqs'])}
{cta_band('Ready to master ' + p['title'] + '?', None, 'Start with the flashcards', '/flashcards/?deck=' + p['slug'])}"""

    return render(
        {
            "path": f"/{p['slug']}/",
            "title": p["meta_title"],
            "description": p["meta_description"],
            "keywords": p["keywords"],
            "longtail": p["longtail"],
            "schema": [
                schema_breadcrumb(trail),
                schema_faq(p["faqs"]),
                {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": p["h1"],
                    "description": p["meta_description"],
                    "url": S["url"] + f"/{p['slug']}/",
                    "publisher": {"@id": S["url"] + "/#organization"},
                    "hasPart": [
                        {
                            "@type": "Article",
                            "name": c["title"],
                            "url": S["url"] + f"/{p['slug']}/{c['slug']}/",
                        }
                        for c in p["clusters"]
                    ],
                },
            ],
            "nav_active": "/learn/",
        },
        body,
    )


def cluster_page(p, c):
    path = f"/{p['slug']}/{c['slug']}/"
    trail = [
        ("Home", "/"),
        ("Learn", "/learn/"),
        (p["title"], f"/{p['slug']}/"),
        (c["title"], path),
    ]
    toc_items = "".join(
        f'<li><a href="#section-{i}">{E(sec["h2"])}</a></li>'
        for i, sec in enumerate(c["sections"])
    )
    sections_html = ""
    for i, sec in enumerate(c["sections"]):
        sections_html += f'<div id="section-{i}">' + content_sections_html([sec]) + "</div>"
    concepts = "".join(
        f'<div class="concept"><strong>{E(t)}</strong><span>{E(d)}</span></div>'
        for t, d in c["key_concepts"]
    )
    tips = ul(c["study_tips"])
    body = f"""
<section class="hero" style="padding-bottom:0">
  <div class="container">
    {breadcrumb_html(trail)}
    <span class="eyebrow">{p['emoji']} {E(p['title'])} · {E(c['title'])}</span>
    <h1>{E(c['h1'])}</h1>
    <p class="lead">{E(c['summary'])}</p>
    <div class="hero-badges">
      <span class="chip">🎟️ No sign-up</span>
      <span class="chip">💾 Saved locally</span>
      <span class="chip chip-yellow">⚡ Earns XP</span>
    </div>
  </div>
</section>
<div class="container section-sm">
  <div class="toc"><strong>On this page</strong><ul>{toc_items}</ul></div>
  <article class="article">
    {sections_html}
    <h2>Key concepts to memorize</h2>
    <div class="concept-list">{concepts}</div>
    <div class="lesson-box">
      <h3>🎯 Study tips for this topic</h3>
      {tips}
      <div class="btn-row mt-2">
        <a class="btn btn-primary btn-sm" href="/flashcards/?deck={p['slug']}-{c['slug']}">Drill {len(c['flashcards'])} flashcards →</a>
        <a class="btn btn-ghost btn-sm" href="/quiz/?topic={p['slug']}-{c['slug']}">Take the mini quiz →</a>
      </div>
    </div>
  </article>
  {byline_block()}
</div>
{paa_section(c['paa'])}
{faq_section(c['faqs'], 'Questions about ' + c['title'].lower())}
{trust_band()}
{cta_band('Learn ' + c['title'] + ' the bonky way', 'Read it, drill it, quiz it — that loop is how memories are made. Free, private, no account.', 'Open the flashcards', '/flashcards/?deck=' + p['slug'] + '-' + c['slug'])}"""

    schema = [
        schema_breadcrumb(trail),
        schema_article(c["h1"], path, c["meta_description"]),
        schema_faq(c["faqs"]),
    ]
    if p["slug"] == "skills":
        schema.append(
            schema_howto(c["h1"], c["meta_description"], c["study_tips"])
        )
    return render(
        {
            "path": path,
            "title": c["meta_title"],
            "description": c["meta_description"],
            "keywords": c["keywords"],
            "longtail": c["longtail"],
            "schema": schema,
            "nav_active": "/learn/",
        },
        body,
    )


# --------------------------------------------------------------------------
# Tool pages
# --------------------------------------------------------------------------

TOOL_MOUNTS = {
    "flashcards": """
<section class="section-sm"><div class="container" id="flashcard-app" data-tool="flashcards">
  <div class="card card-glass text-center" style="padding:3rem 1.5rem">
    <img src="/assets/img/mascot.svg" alt="" width="90" style="margin:0 auto .8rem" aria-hidden="true">
    <h2 style="margin-bottom:.3em">Loading your decks…</h2>
    <p class="muted mb-0">One second — everything is read locally from your browser.</p>
    <noscript><p class="mt-2"><strong>JavaScript is off.</strong> The flashcard tool needs JavaScript, but the study guides, flashcard content and FAQs on every topic page work without it.</p></noscript>
  </div>
</div></section>""",
    "quiz": """
<section class="section-sm"><div class="container" id="quiz-app" data-tool="quiz">
  <div class="card card-glass text-center" style="padding:3rem 1.5rem">
    <img src="/assets/img/mascot.svg" alt="" width="90" style="margin:0 auto .8rem" aria-hidden="true">
    <h2 style="margin-bottom:.3em">Loading question banks…</h2>
    <p class="muted mb-0">Questions load instantly — they're bundled with the page.</p>
    <noscript><p class="mt-2"><strong>JavaScript is off.</strong> The quiz tool needs JavaScript, but every topic guide includes a full written lesson without it.</p></noscript>
  </div>
</div></section>""",
    "focus": """
<section class="section-sm"><div class="container" id="focus-app" data-tool="focus">
  <div class="card card-glass" style="max-width:560px;margin-inline:auto;text-align:center">
    <div class="timer-dial" id="timer-dial" role="timer" aria-live="off">
      <svg viewBox="0 0 280 280" aria-hidden="true">
        <circle class="dial-bg" cx="140" cy="140" r="124"></circle>
        <circle class="dial-fg" id="dial-fg" cx="140" cy="140" r="124" stroke-dasharray="779" stroke-dashoffset="0"></circle>
      </svg>
      <div class="dial-center">
        <div class="timer-time" id="timer-time">25:00</div>
        <div class="timer-mode" id="timer-mode">Focus</div>
      </div>
    </div>
    <img class="timer-mascot mt-2" id="timer-mascot" src="/assets/img/mascot.svg" alt="Bonk the mascot cheering you on" width="64">
    <div class="btn-row mt-2" style="justify-content:center">
      <button class="btn btn-primary" id="timer-toggle" type="button">Start focus</button>
      <button class="btn btn-ghost" id="timer-reset" type="button">Reset</button>
      <button class="btn btn-ghost btn-sm" id="timer-settings" type="button">⚙️ Settings</button>
    </div>
    <p class="small muted mt-2 mb-0" id="timer-stats">Sessions completed today: 0 · Total XP earned: 0</p>
    <noscript><p class="mt-2"><strong>JavaScript is off</strong> — the timer needs it. A regular clock works too: 25 minutes on, 5 off.</p></noscript>
  </div>
</div></section>""",
    "dashboard": """
<section class="section-sm"><div class="container" id="dashboard-app" data-tool="dashboard">
  <div class="card card-glass text-center" style="padding:3rem 1.5rem">
    <img src="/assets/img/mascot.svg" alt="" width="90" style="margin:0 auto .8rem" aria-hidden="true">
    <h2 style="margin-bottom:.3em">Loading your progress…</h2>
    <p class="muted mb-0">Reading from local storage — nothing is downloaded.</p>
    <noscript><p class="mt-2"><strong>JavaScript is off.</strong> The dashboard needs JavaScript to read your local progress.</p></noscript>
  </div>
</div></section>""",
    "ai": """
<section class="section-sm"><div class="container" id="ai-app" data-tool="ai">
  <div class="mode-switch mb-2" id="ai-mode-switch" role="tablist" aria-label="AI engine mode">
    <button class="active" data-mode="instant" role="tab" aria-selected="true" type="button">⚡ Instant Mode</button>
    <button data-mode="model" role="tab" aria-selected="false" type="button">🧠 Full Model (local)</button>
  </div>
  <div class="card card-glass mb-2" id="model-panel" hidden>
    <div id="model-status"></div>
  </div>
  <div class="chat-window">
    <div class="chat-log" id="chat-log" aria-live="polite"></div>
    <div class="quick-chips" id="quick-chips">
      <button class="quick-chip" type="button">🃏 Make flashcards about…</button>
      <button class="quick-chip" type="button">🎯 Quiz me on…</button>
      <button class="quick-chip" type="button">📚 Explain…</button>
      <button class="quick-chip" type="button">😂 Meme mode</button>
      <button class="quick-chip" type="button">🧠 Coach me</button>
    </div>
    <form class="chat-input-row" id="chat-form">
      <input id="chat-input" type="text" placeholder="Ask Bonk AI anything about studying…" autocomplete="off" maxlength="500" aria-label="Message Bonk AI">
      <button class="chat-send" type="submit" aria-label="Send message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
      </button>
    </form>
  </div>
  <div class="btn-row mt-2" style="justify-content:space-between">
    <span class="small muted" id="ai-status-line">⚡ Instant Mode · runs offline · zero download</span>
    <div class="btn-row">
      <button class="btn btn-ghost btn-sm" id="chat-export" type="button">Export chat</button>
      <button class="btn btn-ghost btn-sm" id="chat-clear" type="button">🗑️ Clear memory</button>
    </div>
  </div>
  <noscript><p class="mt-2"><strong>JavaScript is off</strong> — the AI tutor runs entirely client-side, so it needs JavaScript to run at all.</p></noscript>
</div></section>""",
}

TOOL_SCRIPTS = {
    "flashcards": ["/assets/js/study-data.js", "/assets/js/flashcards.js"],
    "quiz": ["/assets/js/study-data.js", "/assets/js/quiz.js"],
    "focus": ["/assets/js/focus.js"],
    "dashboard": ["/assets/js/dashboard.js"],
    "ai": ["/assets/js/study-data.js", "/assets/js/ai.js"],
}

def tool_page(key):
    t = pages.TOOL_PAGES[key]
    sections = content_sections_html(t["sections"])
    body = f"""
{page_hero(t['h1'], t['lead'], eyebrow='Free tool · no sign-up', chips=['🎟️ No account needed', '💾 Progress saved locally', '🌙 Light & dark mode', '🚫 Zero trackers'])}
{TOOL_MOUNTS[key]}
<section class="section-sm"><div class="container article">{sections}</div></section>
{faq_section(t['faqs'], 'Flashcard FAQ' if key == 'flashcards' else 'FAQ')}
{trust_band()}
{cta_band()}"""
    return render(
        {
            "path": t["path"],
            "title": t["meta_title"],
            "description": t["meta_description"],
            "keywords": t["keywords"],
            "longtail": t["longtail"],
            "schema": [
                schema_breadcrumb([("Home", "/"), (t["nav"], t["path"])]),
                schema_webapp(t["nav"], t["path"], t["meta_description"]),
                schema_faq(t["faqs"]),
            ],
            "nav_active": t["path"],
            "scripts": TOOL_SCRIPTS[key],
        },
        body,
    )


# --------------------------------------------------------------------------
# Static-ish pages: about, trust, security, faq, vs, marketing, legal, 404
# --------------------------------------------------------------------------

def about_page():
    a = pages.ABOUT
    c = site.CREATOR
    sections = content_sections_html(a["sections"])
    socials = "".join(
        f'<a class="social-btn" href="{s["url"]}" rel="noopener me" target="_blank">{SOCIAL_ICONS[s["icon"]]}{E(s["name"])}</a>'
        for s in site.SOCIALS
    )
    creds = "".join(f'<span class="chip chip-blue">{E(x)}</span>' for x in c["credentials"])
    body = f"""
<section class="hero" style="padding-bottom:0"><div class="container">
  {breadcrumb_html([('Home','/'),('About','/about/')])}
  <span class="eyebrow">Creator</span>
  <h1>{E(a['h1'])}</h1>
  <div class="creator-band mt-2">
    <img src="{c['avatar']}" alt="TuffyCoder avatar" width="96" height="96" style="border-radius:50%;border:4px solid var(--yellow)">
    <div>
      <h2 style="margin:0 0 .3em">{E(c['name'])}</h2>
      <div class="creator-creds">{creds}</div>
    </div>
  </div>
</div></section>
<section class="section-sm"><div class="container article">
  {sections}
  <div class="social-row mt-3">{socials}</div>
  <p class="creator-sign mt-3">{E(c['signature'])}</p>
</div></section>
{faq_section(a['faqs'], 'About StudyBonk — FAQ')}
{trust_band()}
{cta_band()}"""
    return render(
        {
            "path": "/about/",
            "title": a["meta_title"],
            "description": a["meta_description"],
            "keywords": ["tuffycoder", "studybonk creator", "ethical developer"],
            "longtail": a["longtail"],
            "schema": [
                schema_breadcrumb([("Home", "/"), ("About", "/about/")]),
                schema_article(a["h1"], "/about/", a["meta_description"]),
                {
                    "@context": "https://schema.org",
                    "@type": "Person",
                    "name": c["name"],
                    "url": S["url"] + "/about/",
                    "image": S["url"] + c["avatar"],
                    "jobTitle": "Ethical developer · Privacy-focused builder · Open-source contributor",
                    "description": c["bio"],
                    "sameAs": [s["url"] for s in site.SOCIALS],
                },
                schema_faq(a["faqs"]),
            ],
            "nav_active": "",
        },
        body,
    )


def trust_page():
    t = pages.TRUST
    reasons = "".join(
        f'<div class="card card-hover trust-item reveal"><div class="card-icon">{r["icon"]}</div>'
        f'<h3>{E(r["title"])}</h3><p>{E(r["body"])}</p></div>'
        for r in site.TRUST_REASONS
    )
    steps = "".join(
        f'<div class="card card-hover reveal"><div class="card-icon yellow">🔍</div><h3>{E(title)}</h3><p>{E(d)}</p></div>'
        for title, d in t["verify_steps"]
    )
    body = f"""
{page_hero(t['h1'], t['lead'], eyebrow='E-E-A-T · Trust', chips=['Open-source', 'Zero cookies', 'Zero trackers', 'No accounts'])}
<section class="section-sm" aria-labelledby="why-h"><div class="container">
  <div class="section-head"><span class="eyebrow">The case</span><h2 id="why-h">Six reasons, zero vibes</h2></div>
  <div class="trust-grid">{reasons}</div>
</div></section>
<section class="section-sm" aria-labelledby="verify-h"><div class="container">
  <div class="section-head"><span class="eyebrow">Don't take our word</span><h2 id="verify-h">{E(t['verify_title'])}</h2></div>
  <div class="grid grid-2">{steps}</div>
</div></section>
{faq_section(t['faqs'], t['faq_title'])}
{cta_band()}"""
    return render(
        {
            "path": "/trust/",
            "title": t["meta_title"],
            "description": t["meta_description"],
            "keywords": ["studybonk trust", "safe study app", "private study tool"],
            "longtail": t["longtail"],
            "schema": [
                schema_breadcrumb([("Home", "/"), ("Trust", "/trust/")]),
                schema_article(t["h1"], "/trust/", t["meta_description"]),
                schema_faq(t["faqs"]),
            ],
            "nav_active": "",
        },
        body,
    )


def security_page():
    t = pages.SECURITY
    sections = content_sections_html(t["sections"])
    body = f"""
{page_hero(t['h1'], t['lead'], eyebrow='Security', chips=['Responsible disclosure', 'Bug bounty', 'CSP enforced', 'Static architecture'])}
<section class="section-sm"><div class="container article">{sections}
  <p class="small muted">Found something? Report privately: <a href="{E(pages.REPO)}/security/advisories/new" rel="noopener">GitHub Security Advisory</a>.</p>
</div></section>
{trust_band()}
{cta_band()}"""
    return render(
        {
            "path": "/security/",
            "title": t["meta_title"],
            "description": t["meta_description"],
            "keywords": ["security policy", "responsible disclosure", "bug bounty"],
            "longtail": t["longtail"],
            "schema": [
                schema_breadcrumb([("Home", "/"), ("Security", "/security/")]),
                schema_article(t["h1"], "/security/", t["meta_description"]),
            ],
            "nav_active": "",
        },
        body,
    )


def faq_page():
    f = pages.FAQ_PAGE
    items = "".join(
        f'<details class="faq"><summary>{E(q)}</summary><div class="faq-body">{E(a)}</div></details>'
        for q, a in faqs_mod.FAQS
    )
    body = f"""
{page_hero(f['h1'], f['lead'], eyebrow='FAQ', chips=['Honest answers only'])}
<section class="section-sm"><div class="container">
  <div class="faq-list">{items}</div>
</div></section>
{trust_band()}
{cta_band()}"""
    return render(
        {
            "path": "/faq/",
            "title": f["meta_title"],
            "description": f["meta_description"],
            "keywords": ["studybonk faq", "is studybonk free"],
            "longtail": ["studybonk frequently asked questions", "how does studybonk work"],
            "schema": [
                schema_breadcrumb([("Home", "/"), ("FAQ", "/faq/")]),
                schema_faq(faqs_mod.FAQS),
            ],
            "nav_active": "",
        },
        body,
    )


def vs_hub_page():
    cards = "".join(
        f'<a class="card card-hover card-link" href="/vs/{c["slug"]}/"><h3>StudyBonk vs {E(c["name"])}</h3><p>{E(c["quick_answer"])}</p></a>'
        for c in COMPARES
    )
    body = f"""
{page_hero('StudyBonk vs the Competition', 'Honest, side-by-side comparisons with the study apps you already know. No fake losers — just facts, priced at zero.', eyebrow='Comparisons')}
<section class="section-sm"><div class="container"><div class="grid grid-3">{cards}</div></div></section>
{trust_band()}
{cta_band()}"""
    return render(
        {
            "path": "/vs/",
            "title": "StudyBonk vs Quizlet, Anki & Kahoot | StudyBonk",
            "description": "Honest comparisons: StudyBonk vs Quizlet, Anki and Kahoot on price, privacy, features and gamification. Free and private wins.",
            "keywords": ["quizlet alternative free", "anki alternative", "kahoot alternative"],
            "longtail": [
                "best free quizlet alternative 2026",
                "is there a free private anki alternative",
                "study apps compared without ads",
            ],
            "schema": [schema_breadcrumb([("Home", "/"), ("Comparisons", "/vs/")])],
            "nav_active": "",
        },
        body,
    )


def vs_page(c):
    path = f"/vs/{c['slug']}/"
    trail = [("Home", "/"), ("Comparisons", "/vs/"), (f"vs {c['name']}", path)]
    rows = ""
    for feat, ours, theirs in c["rows"]:
        rows += f"<tr><td>{E(feat)}</td><td><strong>{E(ours)}</strong></td><td>{E(theirs)}</td></tr>"
    intro = paras(c["intro"])
    body = f"""
{page_hero(c['h1'], c['quick_answer'], eyebrow='Comparison · ' + c['name'], chips=['100% free', 'No account', 'Open-source'])}
<section class="section-sm"><div class="container article">
  {breadcrumb_html(trail)}
  {intro}
  <h2>Feature by feature</h2>
  <div class="table-wrap"><table class="compare-table">
    <thead><tr><th>Feature</th><th>StudyBonk</th><th>{E(c['name'])}</th></tr></thead>
    <tbody>{rows}</tbody>
  </table></div>
  <div class="lesson-box"><h3>🏁 The verdict</h3><p class="mb-0">{E(c['verdict'])}</p></div>
  {byline_block()}
</div></section>
{faq_section(c['faqs'], c['name'] + ' vs StudyBonk — FAQ')}
{trust_band()}
{cta_band()}"""
    return render(
        {
            "path": path,
            "title": c["meta_title"],
            "description": c["meta_description"],
            "keywords": c["keywords"],
            "longtail": c["longtail"],
            "schema": [
                schema_breadcrumb(trail),
                schema_article(c["h1"], path, c["meta_description"]),
                schema_faq(c["faqs"]),
            ],
            "nav_active": "",
        },
        body,
    )


def marketing_page():
    m = MARKETING
    hooks = ul(m["hooks"])
    captions = ul(m["captions"])
    povs = ul(m["pov_ideas"])
    shorts_html = ""
    video_schema = []
    for s in m["shorts"]:
        beats = ""
        for ts, visual, line in s["beats"]:
            beats += f'<tr><td class="nowrap"><strong>{E(ts)}</strong></td><td>{E(visual)}</td><td>{E(line)}</td></tr>'
        shorts_html += (
            f'<div class="card card-hover reveal"><h3>🎬 {E(s["title"])}</h3>'
            f'<div class="table-wrap mt-2"><table class="compare-table"><thead><tr><th>Time</th><th>Visual</th><th>Line</th></tr></thead><tbody>{beats}</tbody></table></div></div>'
        )
        video_schema.append({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": s["title"],
            "description": f"YouTube Short script: {s['title']} — promoting StudyBonk, the free private study platform.",
            "thumbnailUrl": S["url"] + "/assets/img/og-image.png",
            "uploadDate": NOW_ISO,
            "duration": s.get("duration", "PT45S"),
            "contentUrl": S["url"] + "/marketing/",
            "embedUrl": S["url"] + "/marketing/",
            "isFamilyFriendly": True,
        })
    body = f"""
{page_hero('The StudyBonk Creator Kit', 'Ready-to-film hooks, Shorts scripts, captions and POV concepts for spreading the bonk. Everything here is yours to use — no attribution required, though a link to studybonk.vercel.app is always appreciated.', eyebrow='Marketing kit', chips=['Free to use', 'Meme-friendly', 'Creator-approved'])}
<section class="section-sm" aria-labelledby="hooks-h"><div class="container">
  <div class="section-head"><span class="eyebrow">TikTok</span><h2 id="hooks-h">10 scroll-stopping hooks</h2></div>
  <div class="article" style="margin-inline:auto">{hooks}</div>
</div></section>
<section class="section-sm" aria-labelledby="shorts-h"><div class="container">
  <div class="section-head"><span class="eyebrow">YouTube Shorts</span><h2 id="shorts-h">Ready-to-film scripts</h2></div>
  <div class="grid">{shorts_html}</div>
</div></section>
<section class="section-sm" aria-labelledby="caps-h"><div class="container grid grid-2">
  <div><div class="section-head"><span class="eyebrow">Captions</span><h2 id="caps-h">Social captions</h2></div>{captions}</div>
  <div><div class="section-head"><span class="eyebrow">POV</span><h2>Viral POV concepts</h2></div>{povs}</div>
</div></section>
<section class="section-sm"><div class="container"><div class="cta-band reveal">
  <h2>{E(m.get('cta_line', 'Study free at studybonk.vercel.app'))}</h2>
  <div class="btn-row" style="justify-content:center;margin-top:1.2rem"><a class="btn btn-lg" href="/">Open StudyBonk</a></div>
</div></div></section>
{trust_band()}"""
    return render(
        {
            "path": "/marketing/",
            "title": "StudyBonk Creator Marketing Kit — Hooks & Scripts",
            "description": "Free marketing kit for spreading StudyBonk: TikTok hooks, YouTube Shorts scripts, captions and POV video ideas. Use everything, attribution optional.",
            "keywords": ["studybonk marketing", "tiktok hooks", "youtube shorts scripts"],
            "longtail": [
                "viral hooks for study tiktok videos",
                "youtube shorts scripts for apps",
                "pov video ideas for students",
                "social captions for study apps",
            ],
            "schema": [
                schema_breadcrumb([("Home", "/"), ("Creator Kit", "/marketing/")]),
            ] + video_schema,
            "nav_active": "",
        },
        body,
    )


def legal_page(doc, path, label, extra_schema=None, keywords=None):
    sections = ""
    for h2, paras_, bullets in doc["sections"]:
        s = f"<h2>{E(h2)}</h2>" + paras(paras_)
        if bullets:
            s += ul(bullets)
        sections += s
    schema = [schema_breadcrumb([("Home", "/"), (label, path)])]
    if extra_schema:
        schema += extra_schema
    body = f"""
{page_hero(doc['h1'], doc['intro'][0] if doc['intro'] else '', eyebrow='Legal')}
<section class="section-sm"><div class="container article">
  {breadcrumb_html([('Home','/'),(label,path)])}
  {paras(doc['intro'])}
  {sections}
  <p class="small muted">Last updated: {TODAY} · Questions? Open an issue on <a href="{E(pages.REPO)}" rel="noopener">GitHub</a>.</p>
</div></section>
{trust_band()}"""
    return render(
        {
            "path": path,
            "title": doc["meta_title"],
            "description": doc["meta_description"],
            "keywords": keywords or [label.lower(), "studybonk", "free study app"],
            "longtail": [
                f"studybonk {label.lower()}",
                f"studybonk {label.lower()} explained",
            ],
            "schema": schema,
            "nav_active": "",
        },
        body,
    )


def error404_page():
    e = pages.ERROR404
    body = f"""
<section class="error-hero container">
  <p class="error-code">404</p>
  <img class="hero-mascot" src="/assets/img/mascot.svg" alt="Bonk the mascot looking sheepish" width="200">
  <h1>{E(e['h1'])}</h1>
  <p class="lead" style="margin-inline:auto">{E(e['lead'])}</p>
  <div class="btn-row mt-3" style="justify-content:center">
    <a class="btn btn-primary btn-lg" href="/">Back to home</a>
    <a class="btn btn-ghost btn-lg" href="/learn/">Browse topics</a>
    <a class="btn btn-ghost btn-lg" href="/ai/">Ask Bonk AI</a>
  </div>
</section>"""
    return render(
        {
            "path": "/404.html",
            "title": "Page not found (404) | StudyBonk",
            "description": "This StudyBonk page doesn't exist — but the free study tools do. Head back and keep the streak alive.",
            "keywords": ["studybonk", "free study app", "page not found"],
            "longtail": [],
            "schema": [],
            "nav_active": "",
        },
        body,
    )


# --------------------------------------------------------------------------
# Generated data files
# --------------------------------------------------------------------------

def study_data_js():
    decks = []
    quizzes = []
    pillar_meta = []
    for p in PILLARS:
        clusters_meta = []
        for c in p["clusters"]:
            deck_id = f"{p['slug']}-{c['slug']}"
            decks.append({
                "id": deck_id,
                "title": f"{p['title']}: {c['title']}",
                "topic": p["title"],
                "cards": [[f, b] for f, b in c["flashcards"]],
            })
            quizzes.append({
                "id": deck_id,
                "title": f"{p['title']}: {c['title']}",
                "topic": p["title"],
                "questions": c["practice"],
            })
            clusters_meta.append({"slug": c["slug"], "title": c["title"]})
        pillar_meta.append({
            "slug": p["slug"], "title": p["title"], "emoji": p["emoji"],
            "clusters": clusters_meta,
        })
    data = {"decks": decks, "quizzes": quizzes, "pillars": pillar_meta}
    return "/* Generated by scripts/build.py — deck + quiz data from content/topics*.py */\n" \
           "window.SB_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"


def manifest_json():
    return json.dumps({
        "name": "StudyBonk — Free Study App",
        "short_name": "StudyBonk",
        "description": S["description"],
        "start_url": "/",
        "display": "standalone",
        "background_color": "#f6f9fd",
        "theme_color": "#4A90E2",
        "icons": [
            {"src": "/assets/img/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/assets/img/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/assets/img/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }, indent=2)


def robots_txt():
    return f"User-agent: *\nAllow: /\n\nSitemap: {S['url']}/sitemap.xml\n"


def sitemap_xml(all_pages):
    urls = "".join(
        f"<url><loc>{S['url']}{path}</loc><lastmod>{TODAY}</lastmod>"
        f"<changefreq>weekly</changefreq><priority>{'1.0' if path == '/' else '0.8'}</priority></url>"
        for path in all_pages
    )
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n'


def service_worker_js(all_paths):
    # Precache the app shell only (keep first-visit light); pages cache on demand.
    cache_files = [
        "/", "/learn/", "/flashcards/", "/quiz/", "/focus/", "/ai/", "/dashboard/",
        "/manifest.webmanifest",
        "/assets/css/style.css", "/assets/fonts/fonts.css",
        "/assets/js/storage.js", "/assets/js/components.js", "/assets/js/gamification.js",
        "/assets/js/nav.js", "/assets/js/theme.js", "/assets/js/theme-boot.js",
        "/assets/js/study-data.js", "/assets/js/flashcards.js", "/assets/js/quiz.js",
        "/assets/js/focus.js", "/assets/js/dashboard.js", "/assets/js/ai.js",
        "/assets/img/mascot.svg", "/assets/img/logo.svg", "/assets/img/favicon.svg",
        "/assets/img/og-image.png", "/assets/img/creator-avatar.jpg",
        "/assets/fonts/Baloo2-normal-800.woff2", "/assets/fonts/Nunito-normal-400.woff2",
        "/assets/fonts/Nunito-normal-700.woff2",
    ]
    files_json = json.dumps(cache_files)
    cache_version = "studybonk-" + datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"""// Generated by scripts/build.py — StudyBonk service worker.
// Precaches the app shell; pages are cached on first visit (runtime caching).
const CACHE = "{cache_version}";
const PRECACHE = {files_json};

self.addEventListener("install", (e) => {{
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
}});

self.addEventListener("activate", (e) => {{
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
}});

self.addEventListener("fetch", (e) => {{
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // never touch cross-origin (model CDN etc.)
  e.respondWith(
    caches.match(e.request, {{ ignoreSearch: true }}).then((hit) => {{
      const fetching = fetch(e.request).then((res) => {{
        if (res && res.ok) {{
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }}
        return res;
      }});
      return hit ? Promise.resolve(hit) : fetching;
    }}).catch(() =>
      caches.match("/").then((shell) => shell || new Response("Offline", {{ status: 503, headers: {{ "Content-Type": "text/plain" }} }}))
    )
  );
}});
"""


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------

def write(path_str, content):
    if path_str.endswith("index.html") or path_str == "404.html":
        target = ROOT / path_str
    else:
        target = ROOT / path_str
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.name == "index.html":
        pass
    target.write_text(content, encoding="utf-8")
    return target

def check_internal_links(files):
    """Verify every internal href/src in generated HTML resolves on disk."""
    import re
    broken = []
    for t in files:
        if t.suffix != ".html":
            continue
        text = t.read_text(encoding="utf-8")
        for match in re.findall(r'(?:href|src)="/([^"?#]+)[?#]?[^"]*"', text):
            if not match:
                continue
            target = ROOT / match
            if not (target.is_file() or (target.is_dir() and (target / "index.html").is_file())):
                broken.append((str(t.relative_to(ROOT)), match))
    return broken


def main():
    pages_out = []

    def emit(path_str, content):
        pages_out.append(write(path_str, content))

    # Core
    emit("index.html", home_page())
    emit("learn/index.html", learn_page())
    for key in pages.TOOL_PAGES:
        t = pages.TOOL_PAGES[key]
        emit(t["path"].lstrip("/").rstrip("/") + "/index.html" if t["path"] != "/" else "index.html", tool_page(key))
    emit("about/index.html", about_page())
    emit("trust/index.html", trust_page())
    emit("security/index.html", security_page())
    emit("faq/index.html", faq_page())
    emit("404.html", error404_page())

    # Pillars + clusters
    for p in PILLARS:
        emit(p["slug"] + "/index.html", pillar_page(p))
        for c in p["clusters"]:
            emit(f"{p['slug']}/{c['slug']}/index.html", cluster_page(p, c))

    # Comparisons
    if COMPARES:
        emit("vs/index.html", vs_hub_page())
        for c in COMPARES:
            emit(f"vs/{c['slug']}/index.html", vs_page(c))

    # Marketing
    if MARKETING:
        emit("marketing/index.html", marketing_page())

    # Legal
    if TERMS:
        emit("terms/index.html", legal_page(TERMS, "/terms/", "Terms", keywords=["terms of use", "studybonk terms", "free study app terms"]))
        emit("privacy/index.html", legal_page(PRIVACY, "/privacy/", "Privacy", keywords=["privacy policy", "no data collection", "private study app", "studybonk privacy"]))
        emit("cookies/index.html", legal_page(COOKIES, "/cookies/", "Cookies", keywords=["cookie-free website", "no cookies notice", "cookieless study app"]))
        emit("license/index.html", legal_page(LICENSE_PAGE, "/license/", "License", keywords=["open source license", "mit license study app", "cc by 4.0"]))

    # Data files
    write("assets/js/study-data.js", study_data_js())
    write("manifest.webmanifest", manifest_json())
    write("robots.txt", robots_txt())

    # Sitemap + SW over all html pages
    all_paths = ["/"] + [
        "/" + str(t.relative_to(ROOT)).replace("index.html", "")
        for t in pages_out if t.name == "index.html" and str(t.relative_to(ROOT)) != "index.html"
    ]
    write("sitemap.xml", sitemap_xml(all_paths))
    write("sw.js", service_worker_js(all_paths))

    # Report
    html_files = [t for t in pages_out]
    broken = check_internal_links(pages_out)
    print(f"✔ Built {len(html_files)} pages + sitemap/robots/manifest/sw/study-data")
    print(f"  Decks: {len(PILLARS) * 6} · flashcards: {total_cards()} · quiz questions: {total_questions()}")
    if broken:
        print(f"✘ BROKEN LINKS ({len(broken)}):")
        for f, l in broken[:20]:
            print(f"   {f} -> /{l}")
        sys.exit(1)
    print("✔ Internal link check passed")


if __name__ == "__main__":
    main()
