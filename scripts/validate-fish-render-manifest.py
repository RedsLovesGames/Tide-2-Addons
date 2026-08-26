#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'assets' / 'fish-render-manifest.json'
CONDITIONS = ('normal', 'scarred', 'parasite_ridden', 'albino', 'iridescent', 'perfect_specimen')


def validate_png(path: Path) -> list[str]:
    errors: list[str] = []
    rel = path.relative_to(ROOT)
    if not path.is_file():
        return [f'missing claimed render: {rel}']
    try:
        with Image.open(path) as im:
            im.load()
            if im.format != 'PNG':
                errors.append(f'claimed render is not PNG: {rel}')
            rgba = im.convert('RGBA')
            if rgba.width < 2 or rgba.height < 2:
                errors.append(f'render dimensions are invalid: {rel}')
            alpha = rgba.getchannel('A')
            lo, hi = alpha.getextrema()
            if hi == 0:
                errors.append(f'render is fully transparent: {rel}')
            if lo == 255:
                errors.append(f'render has no transparent pixels: {rel}')
            bbox = alpha.getbbox()
            if not bbox:
                errors.append(f'render has no visible alpha bounds: {rel}')
            else:
                left, top, right, bottom = bbox
                if left == 0 or top == 0 or right == rgba.width or bottom == rgba.height:
                    errors.append(f'render touches an image edge and lacks safe transparent padding: {rel}')
    except OSError as exc:
        errors.append(f'cannot decode {rel}: {exc}')
    return errors


def main() -> None:
    errors: list[str] = []
    if not MANIFEST.is_file():
        raise SystemExit('fish-render-manifest: assets/fish-render-manifest.json is missing')
    try:
        data = json.loads(MANIFEST.read_text('utf-8'))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f'fish-render-manifest: cannot read manifest: {exc}') from exc

    fish = data.get('fish') or {}
    claimed = {k: 0 for k in CONDITIONS}
    for fish_id, entry in fish.items():
        if ':' not in fish_id:
            errors.append(f'invalid fish id {fish_id!r}')
        variants = entry.get('variants') or {}
        for condition, variant in variants.items():
            file = variant.get('file')
            status = variant.get('status')
            if file:
                if status not in {'source_backed_documentation', 'source_backed_export'}:
                    errors.append(f'{fish_id}/{condition} has a file but non-source-backed status {status!r}')
                if condition in claimed:
                    claimed[condition] += 1
                errors.extend(validate_png(ROOT / 'assets' / file))
            elif status != 'unavailable':
                errors.append(f'{fish_id}/{condition} has no file and must be explicitly unavailable')

    expected = data.get('counts') or {}
    for condition, count in claimed.items():
        if int(expected.get(condition, 0)) != count:
            errors.append(f'count mismatch for {condition}: manifest says {expected.get(condition, 0)}, found {count}')

    if errors:
        print('Fish render manifest FAILED:')
        for error in errors:
            print(f'  - {error}')
        raise SystemExit(1)

    print('Fish render manifest OK:', ', '.join(f'{k}={v}' for k, v in claimed.items()))


if __name__ == '__main__':
    main()
