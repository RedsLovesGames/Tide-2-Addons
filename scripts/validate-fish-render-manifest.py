#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'assets' / 'fish-render-manifest.json'


def fail(msg: str) -> None:
    raise SystemExit(f'fish-render-manifest: {msg}')


def validate_png(path: Path) -> None:
    if not path.is_file():
        fail(f'missing claimed render: {path.relative_to(ROOT)}')
    try:
        with Image.open(path) as im:
            im.load()
            if im.format != 'PNG':
                fail(f'claimed render is not PNG: {path.relative_to(ROOT)}')
            rgba = im.convert('RGBA')
            if rgba.width < 2 or rgba.height < 2:
                fail(f'render dimensions are invalid: {path.relative_to(ROOT)}')
            alpha = rgba.getchannel('A')
            lo, hi = alpha.getextrema()
            if hi == 0:
                fail(f'render is fully transparent: {path.relative_to(ROOT)}')
            if lo == 255:
                fail(f'render has no transparent pixels: {path.relative_to(ROOT)}')
            bbox = alpha.getbbox()
            if not bbox:
                fail(f'render has no visible alpha bounds: {path.relative_to(ROOT)}')
            left, top, right, bottom = bbox
            if left == 0 or top == 0 or right == rgba.width or bottom == rgba.height:
                fail(f'render touches an image edge and lacks safe transparent padding: {path.relative_to(ROOT)}')
    except OSError as exc:
        fail(f'cannot decode {path.relative_to(ROOT)}: {exc}')


def main() -> None:
    if not MANIFEST.is_file():
        fail('assets/fish-render-manifest.json is missing')
    data = json.loads(MANIFEST.read_text('utf-8'))
    fish = data.get('fish') or {}
    claimed = {k: 0 for k in ('normal','scarred','parasite_ridden','albino','iridescent','perfect_specimen')}
    for fish_id, entry in fish.items():
        if ':' not in fish_id:
            fail(f'invalid fish id {fish_id!r}')
        variants = entry.get('variants') or {}
        for condition, variant in variants.items():
            file = variant.get('file')
            status = variant.get('status')
            if file:
                if status not in {'source_backed_documentation','source_backed_export'}:
                    fail(f'{fish_id}/{condition} has a file but non-source-backed status {status!r}')
                if condition in claimed:
                    claimed[condition] += 1
                validate_png(ROOT / 'assets' / file)
            elif status != 'unavailable':
                fail(f'{fish_id}/{condition} has no file and must be explicitly unavailable')
    expected = data.get('counts') or {}
    for condition, count in claimed.items():
        if int(expected.get(condition, 0)) != count:
            fail(f'count mismatch for {condition}: manifest says {expected.get(condition, 0)}, found {count}')
    print('Fish render manifest OK:', ', '.join(f'{k}={v}' for k,v in claimed.items()))


if __name__ == '__main__':
    main()
