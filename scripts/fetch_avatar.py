#!/usr/bin/env python3
"""Fetch the TuffyCoder YouTube avatar and save it locally.

Runs at BUILD time only (never at runtime) so site visitors never make a
third-party request — the avatar is bundled as a first-party asset.

Uses only the Python standard library.
"""

import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "img" / "creator-avatar.jpg"
CHANNEL = "https://www.youtube.com/@TuffyCoder"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read()


def main():
    try:
        html = fetch(CHANNEL).decode("utf-8", "ignore")
    except Exception as e:  # noqa: BLE001
        print(f"!! could not fetch channel page: {e}")
        sys.exit(1)

    m = (
        re.search(r'property="og:image" content="([^"]+)"', html)
        or re.search(r'"avatar":\{"url":"([^"]+)"', html)
    )
    if not m:
        print("!! no avatar URL found on the channel page (layout changed?)")
        sys.exit(1)

    data = fetch(m.group(1).replace("\\u0026", "&").replace("&amp;", "&"))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_bytes(data)
    print(f"✔ avatar saved: {OUT} ({len(data) // 1024} KB)")


if __name__ == "__main__":
    main()
