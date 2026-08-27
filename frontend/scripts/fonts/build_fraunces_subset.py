#!/usr/bin/env python3
"""Rebuild public/fonts/fraunces-600-var.woff2.

Why this script exists (26 Aug 2026):

The file it replaces, fraunces-600.woff2, was a STATIC instance of Fraunces
cut at a small optical size (it rendered identically to Google's opsz=14
"text" instance). Fraunces is an optical-size family: its text cuts carry
exaggerated stroke contrast and chunky serifs so they survive at 14px. Used
as the site's only display face, at 40-60px headings and 150px+ wordmarks,
those compensations read as distorted letterforms. That was reported twice
from the live site before it was diagnosed.

Two traps in this family make the mistake easy, and both are why this is a
script rather than a one-off download:

  - `opsz` defaults to 9, the very smallest cut, not to something neutral.
  - `WONK` defaults to 1, i.e. the deliberately wonky alternate glyphs are
    ON unless you explicitly turn them off.

So instancing Fraunces without naming those two axes gives you the most
idiosyncratic possible version of it.

This builds a VARIABLE subset instead: weight pinned to 600, SOFT and WONK
pinned to 0, and `opsz` deliberately left live. Browsers apply
`font-optical-sizing: auto` by default, so every heading gets the optical
size it was actually drawn for, with no per-size CSS. Costs about 6KB more
than the static file did.

Requires: pip install fonttools brotli
Run from frontend/:  python3 scripts/fonts/build_fraunces_subset.py
"""
import hashlib
import io
import os
import sys
import urllib.request

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

# Pinned to a commit, not to `main`, and checked against a known digest.
# Fetching a font from a moving branch and feeding it straight into the build
# means an upstream change (or a compromised mirror) silently ships different
# letterforms to every visitor, and nobody would notice until someone looked
# closely at a headline. Pinning makes the input reproducible; the digest makes
# a substitution loud instead of silent.
#
# To take a newer upstream Fraunces: bump SOURCE_COMMIT, run this once, and it
# will fail on the digest. Check the diff is one you actually want, then update
# SOURCE_SHA256 to the value the error reports. Never delete the check.
SOURCE_COMMIT = '6a003b5eb672dc8bf5bff5937cf5863f8b175445'
SOURCE_SHA256 = '177ff6c0f14e5550a3c624247cd1189611d4eb65d000b14944c63d967958abbb'
SOURCE = (
    f'https://raw.githubusercontent.com/google/fonts/{SOURCE_COMMIT}/ofl/fraunces/'
    'Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf'
)
OUT = os.path.join('public', 'fonts', 'fraunces-600-var.woff2')

# Latin basic, the accented characters most likely to appear in a name, the
# typographic punctuation the site uses, and the Thai baht sign, which shows
# up in every price line the display face ever sets.
UNICODES = (
    list(range(0x20, 0x7F))
    + [0x00A0, 0x00E1, 0x00E9, 0x00E8, 0x00EA, 0x00ED, 0x00F1, 0x00F3, 0x00FA, 0x00FC]
    + [0x2018, 0x2019, 0x201C, 0x201D, 0x2013, 0x2014, 0x2026, 0x00B7, 0x00A9, 0x00AE]
    + [0x0E3F]
)


def main():
    print(f'fetching variable Fraunces, pinned at {SOURCE_COMMIT[:12]}...')
    raw = urllib.request.urlopen(SOURCE, timeout=120).read()
    if len(raw) < 100_000:
        sys.exit(f'unexpected download size ({len(raw)} bytes), aborting')

    digest = hashlib.sha256(raw).hexdigest()
    if digest != SOURCE_SHA256:
        sys.exit(
            'upstream font does not match the pinned digest, refusing to build.\n'
            f'  expected {SOURCE_SHA256}\n'
            f'  got      {digest}\n'
            'Someone changed the source, or it was served by something other than '
            'GitHub. Verify the change is intentional before touching SOURCE_SHA256.'
        )
    print(f'  digest verified ({len(raw)} bytes)')

    font = TTFont(io.BytesIO(raw))
    axes = {a.axisTag: (a.minValue, a.defaultValue, a.maxValue) for a in font['fvar'].axes}
    print('  source axes:', axes)

    # Pin everything except opsz. See this file's docstring for why.
    inst = instantiateVariableFont(font, {'wght': 600, 'SOFT': 0, 'WONK': 0})
    remaining = [a.axisTag for a in inst['fvar'].axes]
    if remaining != ['opsz']:
        sys.exit(f'expected only opsz to remain variable, got {remaining}')

    buf = io.BytesIO()
    inst.save(buf)
    buf.seek(0)

    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.desubroutinize = True
    opts.layout_features = ['kern', 'liga', 'calt', 'ccmp', 'locl', 'mark', 'mkmk']
    opts.name_IDs = ['*']
    opts.name_legacy = True
    opts.name_languages = ['*']
    opts.recalc_bounds = True

    subset_font = subset.load_font(buf, opts)
    subsetter = subset.Subsetter(options=opts)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(subset_font)
    subset.save_font(subset_font, OUT, opts)

    print(f'  wrote {OUT} ({os.path.getsize(OUT)} bytes)')
    check = TTFont(OUT)
    print('  final axes:', [(a.axisTag, a.minValue, a.maxValue) for a in check['fvar'].axes])
    print('  glyphs:', check['maxp'].numGlyphs)


if __name__ == '__main__':
    main()
