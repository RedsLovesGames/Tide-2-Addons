#!/usr/bin/env python3
"""Production gate for the static Tideborne Fish Wiki payload.

This validator intentionally checks only things that can be established from the
committed artifacts. It never certifies that a render is the correct Minecraft
model or texture. Visual/source authenticity remains a separate manual gate.
"""

from __future__ import annotations

import collections
import gzip
import json
import math
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow is required for atlas decode validation") from exc

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ERRORS: list[str] = []
WARNINGS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


def warn(message: str) -> None:
    WARNINGS.append(message)


def load_json(path: Path):
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as exc:
        error(f"{path.relative_to(ROOT)} failed JSON decode: {exc}")
        return None


def load_gzip_json(path: Path):
    try:
        with gzip.open(path, "rt", encoding="utf-8") as handle:
            return json.load(handle)
    except Exception as exc:
        error(f"{path.relative_to(ROOT)} failed gzip/JSON decode: {exc}")
        return None


def finite_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def stable_slug(identifier: str) -> str:
    return identifier.replace(":", "__", 1)


def canonical_id(value: str) -> str:
    return value.replace("__", ":", 1) if "__" in value and ":" not in value else value


def require_file(path: Path) -> None:
    if not path.is_file():
        error(f"Missing required file: {path.relative_to(ROOT)}")


for relative in (
    "fish/index.html",
    "assets/fish-wiki.css",
    "assets/fish-wiki.js",
    "assets/fish-site-search.js",
    "assets/fish-search-index.json",
    "assets/fish-wiki-data-0.json.gz",
    "assets/fish-wiki-data-1.json.gz",
):
    require_file(ROOT / relative)

shard_paths = [ASSETS / "fish-wiki-data-0.json.gz", ASSETS / "fish-wiki-data-1.json.gz"]
shards = [load_gzip_json(path) for path in shard_paths if path.is_file()]
shards = [item for item in shards if isinstance(item, dict)]

records: list[dict] = []
meta: dict = {}
if shards:
    meta = shards[0].get("meta") or {}
    if not isinstance(meta, dict):
        error("First FishData shard has no object-valued meta block")
        meta = {}
    for index, shard in enumerate(shards):
        rows = shard.get("records")
        if not isinstance(rows, list):
            error(f"FishData shard {index} has no records array")
            continue
        if not all(isinstance(row, dict) for row in rows):
            error(f"FishData shard {index} contains non-object records")
            continue
        records.extend(rows)

ids: list[str] = []
coordinates: dict[tuple[int, int, int], str] = {}
preview_counts: collections.Counter[str] = collections.Counter()
group_counts: collections.Counter[str] = collections.Counter()
namespace_counts: collections.Counter[str] = collections.Counter()
rarity_counts: collections.Counter[str] = collections.Counter()
source_counts: collections.Counter[str] = collections.Counter()

allowed_preview = {
    "exact",
    "representative",
    "no_entity",
    "source_missing",
    "vanilla_model",
    "unreconstructed",
}

atlas_meta = meta.get("atlas") if isinstance(meta.get("atlas"), dict) else {}
cols = atlas_meta.get("cols", 0)
rows_per_sheet = atlas_meta.get("rowsPerSheet", 4)
if records:
    if not isinstance(cols, int) or cols <= 0:
        error("meta.atlas.cols must be a positive integer")
        cols = 0
    if not isinstance(rows_per_sheet, int) or rows_per_sheet <= 0:
        error("meta.atlas.rowsPerSheet must be a positive integer when present")
        rows_per_sheet = 4

for row_index, record in enumerate(records):
    rid = record.get("id")
    if not isinstance(rid, str) or not rid or ":" not in rid:
        error(f"Record {row_index} has invalid namespace-aware id: {rid!r}")
        continue
    ids.append(rid)
    namespace = rid.split(":", 1)[0]
    namespace_counts[namespace] += 1
    if record.get("namespace") not in (None, namespace):
        error(f"{rid}: namespace field does not match id prefix")

    name = record.get("name")
    if not isinstance(name, str) or not name.strip():
        error(f"{rid}: missing species name")

    for field, counter in (("group", group_counts), ("rarity", rarity_counts), ("mod", source_counts)):
        value = record.get(field)
        if not isinstance(value, str) or not value.strip():
            error(f"{rid}: missing {field}")
        else:
            counter[value] += 1

    low, high, record_high = record.get("typicalLow"), record.get("typicalHigh"), record.get("recordHigh")
    numeric = [finite_number(value) for value in (low, high, record_high)]
    if all(numeric):
        if low > high:
            error(f"{rid}: typicalLow exceeds typicalHigh")
        if high > record_high:
            error(f"{rid}: typicalHigh exceeds recordHigh")
    elif any(value is not None for value in (low, high, record_high)) and not all(numeric):
        warn(f"{rid}: incomplete or non-numeric size envelope")

    preview = record.get("preview")
    if not isinstance(preview, dict):
        error(f"{rid}: preview must be an object")
        continue
    status = preview.get("status")
    if status not in allowed_preview:
        error(f"{rid}: unknown preview status {status!r}")
        continue
    preview_counts[status] += 1

    if status in {"exact", "representative"}:
        prow, pcol = preview.get("row"), preview.get("col")
        if not isinstance(prow, int) or prow < 0 or not isinstance(pcol, int) or pcol < 0:
            error(f"{rid}: rendered preview needs non-negative integer row/col")
            continue
        if cols and pcol >= cols:
            error(f"{rid}: preview col {pcol} is outside atlas cols={cols}")
        sheet = prow // rows_per_sheet
        local_row = prow % rows_per_sheet
        key = (sheet, local_row, pcol)
        if key in coordinates:
            error(f"Duplicate atlas coordinate {key}: {coordinates[key]} and {rid}")
        else:
            coordinates[key] = rid

if len(ids) != len(set(ids)):
    duplicates = [key for key, count in collections.Counter(ids).items() if count > 1]
    error(f"Duplicate stable IDs: {', '.join(sorted(duplicates))}")

if records:
    expected_records = meta.get("records")
    if expected_records != len(records):
        error(f"meta.records={expected_records!r} but decoded record count is {len(records)}")
    expected_namespaces = meta.get("namespaces")
    if expected_namespaces != len(namespace_counts):
        error(f"meta.namespaces={expected_namespaces!r} but decoded namespace count is {len(namespace_counts)}")
    meta_preview = meta.get("previewCounts")
    if isinstance(meta_preview, dict):
        for key in sorted(set(meta_preview) | set(preview_counts)):
            if int(meta_preview.get(key, 0)) != int(preview_counts.get(key, 0)):
                error(
                    f"meta.previewCounts[{key!r}]={meta_preview.get(key, 0)!r} "
                    f"but decoded count is {preview_counts.get(key, 0)}"
                )
    else:
        error("meta.previewCounts must be an object")

max_sheet = max((sheet for sheet, _, _ in coordinates), default=-1)
expected_atlas_paths = [ASSETS / f"fish-wiki-atlas-{index}.webp" for index in range(max_sheet + 1)]
for path in expected_atlas_paths:
    require_file(path)

actual_atlas_paths = sorted(ASSETS.glob("fish-wiki-atlas-*.webp"))
expected_names = {path.name for path in expected_atlas_paths}
for path in actual_atlas_paths:
    if path.name not in expected_names:
        warn(f"Unused atlas shard present: {path.relative_to(ROOT)}")

atlas_images: dict[int, Image.Image] = {}
for path in expected_atlas_paths:
    if not path.is_file():
        continue
    try:
        image = Image.open(path)
        image.load()
        if image.format != "WEBP":
            error(f"{path.relative_to(ROOT)} decoded as {image.format}, expected WEBP")
        if image.width <= 0 or image.height <= 0:
            error(f"{path.relative_to(ROOT)} has invalid dimensions {image.size}")
        if cols and image.width % cols != 0:
            error(f"{path.relative_to(ROOT)} width {image.width} is not divisible by atlas cols {cols}")
        if rows_per_sheet and image.height % rows_per_sheet != 0:
            error(
                f"{path.relative_to(ROOT)} height {image.height} is not divisible by rowsPerSheet {rows_per_sheet}"
            )
        atlas_images[int(path.stem.rsplit("-", 1)[1])] = image.convert("RGBA")
    except Exception as exc:
        error(f"{path.relative_to(ROOT)} failed image decode: {exc}")

for (sheet, local_row, col), rid in coordinates.items():
    image = atlas_images.get(sheet)
    if image is None or not cols:
        continue
    cell_width = image.width // cols
    cell_height = image.height // rows_per_sheet
    left = col * cell_width
    top = local_row * cell_height
    right = left + cell_width
    bottom = top + cell_height
    if not (0 <= left < right <= image.width and 0 <= top < bottom <= image.height):
        error(f"{rid}: sprite bounds {(left, top, right, bottom)} exceed atlas-{sheet} {image.size}")
        continue
    crop = image.crop((left, top, right, bottom))
    alpha = crop.getchannel("A")
    if alpha.getbbox() is None:
        error(f"{rid}: source-backed atlas sprite is blank")
    extrema = alpha.getextrema()
    if extrema == (255, 255):
        error(f"{rid}: source-backed atlas sprite has no transparent pixels")

search_path = ASSETS / "fish-search-index.json"
if search_path.is_file():
    search_index = load_json(search_path)
    if isinstance(search_index, list):
        search_ids: list[str] = []
        for index, item in enumerate(search_index):
            if not isinstance(item, dict):
                error(f"Search index row {index} is not an object")
                continue
            raw_id = item.get("id")
            if not isinstance(raw_id, str) or not raw_id:
                error(f"Search index row {index} has no id")
                continue
            search_ids.append(canonical_id(raw_id))
        if len(search_ids) != len(set(search_ids)):
            error("Search index contains duplicate fish IDs")
        if records:
            missing = set(ids) - set(search_ids)
            extra = set(search_ids) - set(ids)
            if missing:
                error(f"Search index is missing {len(missing)} fish IDs")
            if extra:
                error(f"Search index contains {len(extra)} unknown fish IDs")
    elif search_index is not None:
        error("fish-search-index.json must contain a JSON array")

print("Fish Wiki validation summary")
print(f"  records: {len(records)}")
print(f"  namespaces: {len(namespace_counts)}")
print(f"  atlas shards expected: {len(expected_atlas_paths)}")
print(f"  atlas shards present: {len(actual_atlas_paths)}")
print(f"  preview statuses: {dict(sorted(preview_counts.items()))}")
print(f"  journal groups: {dict(sorted(group_counts.items()))}")
print(f"  rarity counts: {dict(sorted(rarity_counts.items()))}")
print(f"  source-mod counts: {dict(sorted(source_counts.items()))}")
print("  render authenticity: NOT programmatically certifiable; manual source/model comparison required")

for message in WARNINGS:
    print(f"WARNING: {message}", file=sys.stderr)
for message in ERRORS:
    print(f"ERROR: {message}", file=sys.stderr)

if ERRORS:
    raise SystemExit(1)
