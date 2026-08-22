"""Aggregates all pillar content modules into one ordered list.

Each content/topic_<slug>.py module defines a PILLAR dict matching the
schema documented at the top of content/topic_math.py (the reference
implementation).
"""

import warnings


def _load(slug):
    try:
        module = __import__(f"content.topic_{slug}", fromlist=["PILLAR"])
        return module.PILLAR
    except ImportError as e:
        warnings.warn(f"content/topic_{slug}.py missing ({e}) — building without it")
        return None


# Order comes from site.PILLAR_ORDER so navigation stays consistent.
def get_pillars(order):
    out = []
    for slug in order:
        pillar = _load(slug)
        if pillar is not None:
            out.append(pillar)
    return out
