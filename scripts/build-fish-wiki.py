#!/usr/bin/env python3
"""Build the Tideborne Fish Wiki payload from authoritative Tide FishData.

The script deliberately does not synthesize entity artwork. A preview is only marked
source-backed when a validated atlas is supplied by a separate rendering pipeline.
"""
from __future__ import annotations

import argparse
import collections
import copy
import gzip
import json
import pathlib
import re
from typing import Any

RARITY_STARS = {
    "common": 1,
    "uncommon": 2,
    "rare": 3,
    "very_rare": 4,
    "very rare": 4,
    "epic": 4,
    "legendary": 5,
}

MOD_NAMES = {
    "tide": "Tide",
    "minecraft": "Minecraft",
    "hybrid-aquatic": "Hybrid Aquatic",
    "hybrid_aquatic": "Hybrid Aquatic",
    "hybridaquatic": "Hybrid Aquatic",
    "alexscaves": "Alex's Caves",
    "alexsmobs": "Alex's Mobs",
    "aquaculture": "Aquaculture 2",
    "fishofthieves": "Fish of Thieves",
    "finsandtails": "Fins and Tails",
    "naturalist": "Naturalist",
    "upgrade_aquatic": "Upgrade Aquatic",
    "spawn": "Spawn",
    "undergarden": "The Undergarden",
    "nether_additions": "Nether Additions",
    "luminousworld": "Luminous World",
    "youkaishomecoming": "Youkai's Homecoming",
    "clutter": "Clutter",
}


def deep_merge(base: Any, override: Any) -> Any:
    if isinstance(base, dict) and isinstance(override, dict):
        out = copy.deepcopy(base)
        for key, value in override.items():
            out[key] = deep_merge(out[key], value) if key in out else copy.deepcopy(value)
        return out
    return copy.deepcopy(override)


def humanize(token: str) -> str:
    token = token.strip().replace("-", "_")
    return " ".join(p.capitalize() for p in token.split("_") if p)


def mod_name(mod_id: str) -> str:
    return MOD_NAMES.get(mod_id, humanize(mod_id))


def location_label(value: Any) -> str:
    if not value:
        return "Unknown habitat"
    if not isinstance(value, str):
        return json.dumps(value, sort_keys=True, separators=(",", ":"))
    last = value.rsplit(".", 1)[-1].rsplit(":", 1)[-1]
    return humanize(last)


def resource_aliases(path: pathlib.Path, root: pathlib.Path, data: dict[str, Any]) -> set[str]:
    aliases: set[str] = set()
    fish = data.get("fish")
    if isinstance(fish, str):
        aliases.add(fish)
    try:
        rel = path.relative_to(root)
        parts = rel.parts
        i = parts.index("data")
        namespace = parts[i + 1]
        fi = parts.index("fish", i + 2)
        tail = pathlib.PurePosixPath(*parts[fi + 1 :]).with_suffix("").as_posix()
        aliases.add(f"{namespace}:{tail}")
        aliases.add(f"{namespace}:fishing/fish/{tail}")
        aliases.add(f"{namespace}:{path.stem}")
    except (ValueError, IndexError):
        pass
    return aliases


def infer_namespace(path: pathlib.Path, root: pathlib.Path) -> str:
    rel = path.relative_to(root)
    parts = rel.parts
    try:
        i = parts.index("data")
        return parts[i + 1]
    except (ValueError, IndexError):
        return "unknown"


def infer_group(path: pathlib.Path) -> str:
    parts = path.parts
    try:
        i = len(parts) - 1 - list(reversed(parts)).index("fish")
        return parts[i + 1] if i + 1 < len(parts) - 1 else "misc"
    except ValueError:
        return "misc"


def collect(root: pathlib.Path, source: str) -> list[dict[str, Any]]:
    rows = []
    for path in sorted(root.glob("data/*/fishing/fish/**/*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise RuntimeError(f"Could not decode {path}: {exc}") from exc
        rows.append({
            "path": path,
            "source": source,
            "namespace": infer_namespace(path, root),
            "path_group": infer_group(path),
            "data": data,
            "aliases": resource_aliases(path, root, data),
            "source_path": path.relative_to(root).as_posix(),
        })
    return rows


def resolve_inheritance(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[str]]:
    alias_map: dict[str, dict[str, Any]] = {}
    for row in rows:
        for alias in row["aliases"]:
            alias_map.setdefault(alias, row)

    cache: dict[int, dict[str, Any]] = {}
    unresolved: list[str] = []

    def resolve(row: dict[str, Any], stack: tuple[int, ...] = ()) -> dict[str, Any]:
        key = id(row)
        if key in cache:
            return copy.deepcopy(cache[key])
        if key in stack:
            raise RuntimeError(f"FishData parent cycle at {row['source_path']}")
        data = copy.deepcopy(row["data"])
        parent = data.get("parent")
        if parent:
            candidates: list[str] = []
            if isinstance(parent, str):
                candidates.append(parent)
                if ":" not in parent:
                    candidates += [f"{row['namespace']}:{parent}", f"{row['namespace']}:{row['path_group']}/{parent}"]
            parent_row = next((alias_map.get(c) for c in candidates if alias_map.get(c)), None)
            if parent_row is None:
                # Last-resort unique suffix match. This keeps the resolver strict while
                # supporting parent identifiers whose codec omits a resource prefix.
                suffix = str(parent).split(":", 1)[-1]
                matches = {id(v): v for a, v in alias_map.items() if a.split(":", 1)[-1].endswith(suffix)}
                if len(matches) == 1:
                    parent_row = next(iter(matches.values()))
            if parent_row is None:
                unresolved.append(f"{row['source_path']} -> {parent!r}")
            else:
                data = deep_merge(resolve(parent_row, stack + (key,)), data)
        data.pop("parent", None)
        cache[key] = data
        return copy.deepcopy(data)

    out = []
    for row in rows:
        r = dict(row)
        r["data"] = resolve(row)
        out.append(r)
    return out, unresolved


def combine_rows(tide_rows: list[dict[str, Any]], extra_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[str]]:
    merged: dict[str, dict[str, Any]] = {}
    duplicates: list[str] = []
    anonymous: list[dict[str, Any]] = []

    for row in tide_rows + extra_rows:
        data = row["data"]
        fish = data.get("fish")
        if not isinstance(fish, str) or ":" not in fish:
            anonymous.append(row)
            continue
        if fish not in merged:
            merged[fish] = dict(row)
            merged[fish]["source_paths"] = [f"{row['source']}:{row['source_path']}"]
        else:
            duplicates.append(fish)
            previous = merged[fish]
            previous["data"] = deep_merge(previous["data"], data)
            previous["source_paths"].append(f"{row['source']}:{row['source_path']}")
            previous["source"] = "Tide 2.1.1 + Tide Extra Compatibility 2.2.0"
            previous["source_path"] = row["source_path"]
            previous["namespace"] = row["namespace"]
            previous["path_group"] = row["path_group"]

    if anonymous:
        raise RuntimeError("FishData files missing canonical fish IDs: " + ", ".join(r["source_path"] for r in anonymous))
    return list(merged.values()), duplicates


def make_preview(fish_id: str, entity: Any, source: str) -> dict[str, Any]:
    if not isinstance(entity, str) or not entity:
        return {"status": "no_entity", "note": "FishData does not provide a Fish Display entity."}
    entity_ns = entity.split(":", 1)[0]
    if entity_ns == "minecraft":
        return {"status": "vanilla_model", "note": "Vanilla entity model source was not reconstructed into the validated atlas."}
    if entity_ns == "tide":
        return {"status": "unreconstructed", "note": "Tide entity and DisplayData are known, but no validated atlas sprite is attached to this build."}
    return {"status": "source_missing", "note": f"The {entity_ns} entity source is not packaged with Tide/Tide Extra, so no substitute render is shown."}


def record_from(row: dict[str, Any]) -> dict[str, Any] | None:
    d = row["data"]
    if d.get("show_in_journal") is False:
        return None
    fish_id = d["fish"]
    namespace, path = fish_id.split(":", 1)
    profile = d.get("journal_profile") or {}
    size = d.get("size") or {}
    display = d.get("display_data") or {}
    rarity = str(profile.get("rarity") or "common").lower().replace(" ", "_")
    group = str(profile.get("group") or row.get("path_group") or "misc")
    if group not in {"freshwater", "saltwater", "underground", "lava", "void", "misc"}:
        group = "misc"
    associated = [str(x) for x in d.get("associated_mods", []) if x]
    source_mod = associated[0] if associated else namespace
    loc_key = profile.get("location")
    entity = display.get("entity") if isinstance(display, dict) else None
    return {
        "id": fish_id,
        "name": humanize(path.rsplit("/", 1)[-1]),
        "namespace": namespace,
        "modKey": source_mod,
        "mod": mod_name(source_mod),
        "associatedMods": associated,
        "group": group,
        "location": location_label(loc_key),
        "locationKey": loc_key if isinstance(loc_key, str) else "",
        "rarity": rarity,
        "stars": RARITY_STARS.get(rarity, 1),
        "typicalLow": size.get("typical_low_cm"),
        "typicalHigh": size.get("typical_high_cm"),
        "recordHigh": size.get("record_high_cm"),
        "strength": d.get("strength"),
        "speed": d.get("speed"),
        "weight": d.get("selection_weight"),
        "behavior": d.get("behavior"),
        "bucket": d.get("bucket"),
        "entity": entity,
        "displayData": display,
        "conditions": d.get("conditions") or [],
        "modifiers": d.get("modifiers") or [],
        "journalProfile": profile,
        "sourceJar": row["source"],
        "sourcePath": " | ".join(row.get("source_paths") or [row["source_path"]]),
        "preview": make_preview(fish_id, entity, row["source"]),
    }


def write_gzip_json(path: pathlib.Path, obj: Any) -> None:
    payload = json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
    with path.open("wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, compresslevel=9, mtime=0) as gz:
            gz.write(payload)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--tide-root", required=True, type=pathlib.Path)
    ap.add_argument("--extra-root", required=True, type=pathlib.Path)
    ap.add_argument("--out", default="assets", type=pathlib.Path)
    ap.add_argument("--report", default="scripts/fish-build-report.txt", type=pathlib.Path)
    args = ap.parse_args()

    tide_raw = collect(args.tide_root, "Tide 2.1.1")
    extra_raw = collect(args.extra_root, "Tide Extra Compatibility 2.2.0")
    tide, unresolved_tide = resolve_inheritance(tide_raw)
    extra, unresolved_extra = resolve_inheritance(extra_raw)
    unresolved = unresolved_tide + unresolved_extra
    combined, duplicates = combine_rows(tide, extra)

    records = []
    hidden = []
    for row in combined:
        rec = record_from(row)
        if rec is None:
            hidden.append(row["data"].get("fish", row["source_path"]))
        else:
            records.append(rec)
    records.sort(key=lambda r: r["id"])

    by_id = [r["id"] for r in records]
    if len(by_id) != len(set(by_id)):
        raise RuntimeError("Duplicate final fish IDs remain")

    preview_counts = collections.Counter(r["preview"]["status"] for r in records)
    meta = {
        "records": len(records),
        "namespaces": len({r["namespace"] for r in records}),
        "previewCounts": dict(sorted(preview_counts.items())),
        "atlas": {"cols": 1, "rowsPerSheet": 4},
        "sources": {
            "tide": {"version": "2.1.1", "commit": "876b95f31328f4e698d5150f7d840ab033d1b06d", "fishFiles": len(tide_raw)},
            "tideExtraCompatibility": {"version": "2.2.0", "modrinthVersion": "Uz6Vlhjs", "fishFiles": len(extra_raw)},
        },
        "renderPolicy": "No preview is marked exact or representative without a separately validated source-backed atlas.",
    }

    midpoint = (len(records) + 1) // 2
    args.out.mkdir(parents=True, exist_ok=True)
    write_gzip_json(args.out / "fish-wiki-data-0.json.gz", {"meta": meta, "records": records[:midpoint]})
    write_gzip_json(args.out / "fish-wiki-data-1.json.gz", {"meta": meta, "records": records[midpoint:]})
    search = [{k: r.get(k) for k in ("id", "name", "mod", "group", "rarity", "location")} for r in records]
    (args.out / "fish-search-index.json").write_text(json.dumps(search, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n", encoding="utf-8")

    group_counts = collections.Counter(r["group"] for r in records)
    rarity_counts = collections.Counter(r["rarity"] for r in records)
    mod_counts = collections.Counter(r["mod"] for r in records)
    namespace_counts = collections.Counter(r["namespace"] for r in records)
    lines = [
        "Authoritative Fish Wiki Build Report",
        "===================================",
        f"Tide FishData source files: {len(tide_raw)}",
        f"Tide Extra FishData source files: {len(extra_raw)}",
        f"Raw source files total: {len(tide_raw) + len(extra_raw)}",
        f"Overlapping canonical fish IDs merged: {len(set(duplicates))}",
        f"Hidden show_in_journal=false rows: {len(hidden)}",
        f"Final visible fish records: {len(records)}",
        f"Final namespaces: {meta['namespaces']}",
        f"Unresolved parent references: {len(unresolved)}",
        "",
        "Preview status counts:",
        *[f"  {k}: {v}" for k, v in sorted(preview_counts.items())],
        "",
        "Journal category counts:",
        *[f"  {k}: {v}" for k, v in sorted(group_counts.items())],
        "",
        "Rarity counts:",
        *[f"  {k}: {v}" for k, v in sorted(rarity_counts.items())],
        "",
        "Source mod counts:",
        *[f"  {k}: {v}" for k, v in sorted(mod_counts.items(), key=lambda kv: (-kv[1], kv[0].lower()))],
        "",
        "Namespace counts:",
        *[f"  {k}: {v}" for k, v in sorted(namespace_counts.items())],
    ]
    if duplicates:
        lines += ["", "Merged duplicate fish IDs:", *[f"  {x}" for x in sorted(set(duplicates))]]
    if hidden:
        lines += ["", "Hidden fish IDs:", *[f"  {x}" for x in sorted(hidden)]]
    if unresolved:
        lines += ["", "UNRESOLVED PARENTS:", *[f"  {x}" for x in unresolved]]
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("\n".join(lines[:15]))
    if unresolved:
        raise RuntimeError("Unresolved FishData parent references. See build report.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
