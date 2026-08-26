#!/usr/bin/env python3
"""Build the Fish Wiki render registry from real Tide FishData and owning-mod render sources.

This scanner deliberately does not convert or approximate entity models. It inventories the
actual entity textures, model/renderer classes and geometry resources so the in-game exporter
can instantiate the Fish Display entity and delegate to Minecraft's EntityRenderDispatcher.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import tomllib
import zipfile

RENDER_CLASS_HINTS = ("render", "renderer", "model", "texture", "variant", "fishdisplay", "displaydata", "gecko", "geo", "client")
KEEP_ASSET_FRAGMENTS = ("/textures/entity/", "/textures/mob/", "/models/", "/geo/", "/animations/")
KEEP_DATA_FRAGMENTS = ("/fishing/fish/", "/tags/")
METADATA_FILES = ("fabric.mod.json", "quilt.mod.json", "META-INF/neoforge.mods.toml", "META-INF/mods.toml", "pack.mcmeta")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def safe_json(z: zipfile.ZipFile, name: str):
    try:
        return json.loads(z.read(name).decode("utf-8"))
    except Exception:
        return None


def safe_toml(z: zipfile.ZipFile, name: str):
    try:
        return tomllib.loads(z.read(name).decode("utf-8"))
    except Exception:
        return None


def metadata(z: zipfile.ZipFile, archive_name: str) -> dict:
    fabric = safe_json(z, "fabric.mod.json")
    if isinstance(fabric, dict):
        return {"id": fabric.get("id") or Path(archive_name).stem, "name": fabric.get("name") or fabric.get("id") or Path(archive_name).stem, "version": fabric.get("version"), "loader": "fabric", "depends": fabric.get("depends") or {}, "suggests": fabric.get("suggests") or {}}
    quilt = safe_json(z, "quilt.mod.json")
    if isinstance(quilt, dict):
        ql = quilt.get("quilt_loader") or {}
        qmeta = ql.get("metadata") or {}
        return {"id": ql.get("id") or Path(archive_name).stem, "name": qmeta.get("name") or ql.get("id") or Path(archive_name).stem, "version": ql.get("version"), "loader": "quilt", "depends": ql.get("depends") or [], "suggests": ql.get("provides") or []}
    for file, loader in (("META-INF/neoforge.mods.toml", "neoforge"), ("META-INF/mods.toml", "forge")):
        data = safe_toml(z, file)
        if isinstance(data, dict):
            mods = data.get("mods") or []
            if mods and isinstance(mods[0], dict):
                mod = mods[0]
                return {"id": mod.get("modId") or Path(archive_name).stem, "name": mod.get("displayName") or mod.get("modId") or Path(archive_name).stem, "version": mod.get("version"), "loader": loader, "depends": {}, "suggests": {}}
    pack = safe_json(z, "pack.mcmeta")
    if isinstance(pack, dict):
        return {"id": re.sub(r"[^a-z0-9_]+", "_", Path(archive_name).stem.lower()).strip("_"), "name": Path(archive_name).stem, "version": None, "loader": "datapack", "depends": {}, "suggests": {}}
    return {"id": Path(archive_name).stem, "name": Path(archive_name).stem, "version": None, "loader": "unknown", "depends": {}, "suggests": {}}


def looks_like_fish_definition(obj) -> bool:
    return isinstance(obj, dict) and isinstance(obj.get("fish"), str) and isinstance(obj.get("display_data"), dict) and isinstance(obj.get("journal_profile"), dict)


def namespace(resource_id: str | None) -> str | None:
    return resource_id.split(":", 1)[0] if resource_id and ":" in resource_id else None


def archive_resource_namespaces(names: set[str]) -> list[str]:
    found = set()
    for name in names:
        parts = PurePosixPath(name).parts
        if len(parts) >= 3 and parts[0] in {"assets", "data"}:
            found.add(parts[1].lower())
    return sorted(found)


def archive_owner_aliases(inventory: dict) -> set[str]:
    """Return conservative owning-mod IDs for one supplied archive.

    Resource namespaces are not ownership proof because mods may bundle compatibility assets
    for other mods. Metadata mod IDs are authoritative. BetterEnd's supplied archive does not
    expose loader metadata that this lightweight scanner recognizes, so its filename is used as
    the one known fallback alias.
    """
    if inventory["mod"].get("loader") == "datapack":
        return set()
    aliases = set()
    mod_id = str(inventory["mod"].get("id") or "").lower()
    if mod_id:
        aliases.add(mod_id)
    archive_low = str(inventory.get("archive") or "").lower()
    if archive_low.startswith("betterend-"):
        aliases.add("betterend")
    return aliases


def texture_paths(names: set[str], entity_id: str | None) -> list[str]:
    if not entity_id or ":" not in entity_id:
        return []
    ns, path = entity_id.split(":", 1)
    exacts = [f"assets/{ns}/textures/entity/{path}.png", f"assets/{ns}/textures/entity/fish/{path}.png", f"assets/{ns}/textures/mob/{path}.png", f"assets/{ns}/textures/entity/{path}/{path}.png"]
    exact = [p for p in exacts if p in names]
    stem = PurePosixPath(path).name.lower()
    fuzzy = [p for p in names if p.startswith(f"assets/{ns}/textures/") and p.lower().endswith(".png") and stem in PurePosixPath(p).stem.lower()]
    return exact + [p for p in sorted(fuzzy) if p not in exact][:24]


def model_paths(names: set[str], entity_id: str | None) -> list[str]:
    if not entity_id or ":" not in entity_id:
        return []
    ns, path = entity_id.split(":", 1)
    stem = PurePosixPath(path).name.lower()
    candidates = []
    for name in names:
        low = name.lower()
        if name.endswith(".class"):
            if stem in low and any(h in low for h in ("model", "render")):
                candidates.append(name)
        elif name.endswith(".json") and name.startswith(f"assets/{ns}/"):
            if stem in low and any(h in low for h in ("/geo/", "/models/", "/animations/")):
                candidates.append(name)
    return sorted(candidates)[:48]


def should_extract(name: str) -> bool:
    low = name.lower()
    if name in METADATA_FILES:
        return True
    if name.startswith("data/") and name.endswith(".json") and any(fragment in low for fragment in KEEP_DATA_FRAGMENTS):
        return True
    if name.startswith("assets/"):
        if any(fragment in low for fragment in KEEP_ASSET_FRAGMENTS):
            return True
        if "/lang/" in low and name.endswith(".json"):
            return True
    if name.endswith(".class") and any(hint in low for hint in RENDER_CLASS_HINTS):
        return True
    return False


def scan_archive(path: Path, out_dir: Path) -> tuple[dict, list[dict], set[str]]:
    with zipfile.ZipFile(path) as z:
        names = set(z.namelist())
        meta = metadata(z, path.name)
        archive_out = out_dir / "extracted" / path.stem
        archive_out.mkdir(parents=True, exist_ok=True)
        extracted = 0
        for name in sorted(names):
            if name.endswith("/") or not should_extract(name):
                continue
            target = archive_out / name
            target.parent.mkdir(parents=True, exist_ok=True)
            try:
                target.write_bytes(z.read(name))
                extracted += 1
            except Exception:
                pass

        fish_defs: list[dict] = []
        for name in sorted(names):
            if not (name.startswith("data/") and name.endswith(".json")):
                continue
            obj = safe_json(z, name)
            if not looks_like_fish_definition(obj):
                continue
            fish_id = obj["fish"]
            display = obj.get("display_data") or {}
            entity_id = display.get("entity")
            journal = obj.get("journal_profile") or {}
            owner = namespace(entity_id) or namespace(fish_id) or meta["id"]
            associated_mods = obj.get("associated_mods") or []
            if isinstance(associated_mods, str):
                associated_mods = [associated_mods]
            fish_defs.append({
                "key": fish_id,
                "source_archive": path.name,
                "definition_source_mod": meta["id"],
                "source_mod": owner,
                "source_data_path": name,
                "group": journal.get("group"),
                "fish_id": fish_id,
                "item_id": fish_id,
                "bucket_id": obj.get("bucket"),
                "entity_id": entity_id,
                "entity_mod": namespace(entity_id),
                "associated_mods": associated_mods,
                "display_data": display,
                "journal_profile": journal,
                "size": obj.get("size") or {},
                "selection_weight": obj.get("selection_weight"),
                "selection_quality": obj.get("selection_quality"),
                "speed": obj.get("speed"),
                "strength": obj.get("strength"),
                "behavior": obj.get("behavior"),
                "conditions": obj.get("conditions", []),
                "modifiers": obj.get("modifiers", []),
                "renderer_strategy": "tide_display" if entity_id else "unavailable_no_display_entity",
                "texture_candidates": [],
                "model_or_renderer_candidates": [],
            })

        inventory = {
            "archive": path.name,
            "sha256": sha256(path),
            "bytes": path.stat().st_size,
            "mod": meta,
            "resource_namespaces": archive_resource_namespaces(names),
            "fish_definition_count": len(fish_defs),
            "extracted_file_count": extracted,
            "render_class_count": sum(1 for n in names if n.endswith(".class") and any(h in n.lower() for h in RENDER_CLASS_HINTS)),
            "entity_texture_count": sum(1 for n in names if n.startswith("assets/") and "/textures/entity/" in n.lower() and n.lower().endswith(".png")),
            "geo_json_count": sum(1 for n in names if n.startswith("assets/") and "/geo/" in n.lower() and n.lower().endswith(".json")),
            "animation_json_count": sum(1 for n in names if n.startswith("assets/") and "/animations/" in n.lower() and n.lower().endswith(".json")),
        }
        return inventory, fish_defs, names


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mods", required=True, help="Folder containing downloaded JAR/ZIP sources")
    parser.add_argument("--out", required=True, help="Output folder")
    args = parser.parse_args()

    mods_dir = Path(args.mods)
    out_dir = Path(args.out)
    registry_dir = out_dir / "registry"
    registry_dir.mkdir(parents=True, exist_ok=True)
    archives = sorted({*mods_dir.glob("*.jar"), *mods_dir.glob("*.zip")})
    if not archives:
        raise SystemExit(f"No .jar or .zip files found in {mods_dir}")

    inventories: list[dict] = []
    fish_defs: list[dict] = []
    source_names: dict[str, set[str]] = {}
    for archive in archives:
        try:
            inv, defs, names = scan_archive(archive, out_dir)
            inventories.append(inv)
            fish_defs.extend(defs)
            source_names[archive.name] = names
            print(f"SCAN_OK archive={archive.name} fish_data={len(defs)} loader={inv['mod']['loader']} mod={inv['mod']['id']}")
        except zipfile.BadZipFile:
            print(f"SCAN_SKIP invalid_archive={archive.name}")

    available_namespaces = {"minecraft"}
    for inv in inventories:
        available_namespaces.update(archive_owner_aliases(inv))

    merged: dict[str, dict] = {}
    duplicates: dict[str, list[dict]] = {}
    for entry in fish_defs:
        key = entry["key"]
        if key in merged:
            duplicates.setdefault(key, [{"archive": merged[key]["source_archive"], "path": merged[key]["source_data_path"]}]).append({"archive": entry["source_archive"], "path": entry["source_data_path"]})
            if entry.get("entity_id"):
                merged[key] = entry
        else:
            merged[key] = entry

    unsupported: dict[str, dict] = {}
    for key, entry in list(merged.items()):
        owner = str(entry.get("entity_mod") or entry.get("source_mod") or "").lower()
        required = {str(x).lower() for x in (entry.get("associated_mods") or []) if x}
        # Vanilla entity renderers are self-contained even when the caught item belongs to an
        # optional integration mod. For non-vanilla entities, associated_mods can carry a real
        # cross-mod render dependency, such as Aquaculture's starshell turtle requiring Twilight Forest.
        enforced_requirements = set() if owner == "minecraft" else required
        missing_requirements = sorted(enforced_requirements - available_namespaces)
        if owner not in available_namespaces or missing_requirements:
            unsupported[key] = {
                "fish_id": entry.get("fish_id"),
                "entity_id": entry.get("entity_id"),
                "owner_namespace": owner,
                "associated_mods": sorted(required),
                "missing_requirements": missing_requirements,
                "reason": "owning_mod_not_supplied" if owner not in available_namespaces else "associated_mod_not_supplied"
            }
            del merged[key]

    for entry in merged.values():
        tex = []
        model = []
        for archive_name, names in source_names.items():
            for candidate in texture_paths(names, entry.get("entity_id")):
                tex.append({"source_archive": archive_name, "path": candidate})
            for candidate in model_paths(names, entry.get("entity_id")):
                model.append({"source_archive": archive_name, "path": candidate})
        entry["texture_candidates"] = tex
        entry["model_or_renderer_candidates"] = model
        entry["render_notes"] = [
            "Construct the real fish ItemStack with its components/NBT.",
            "Call FishDisplayBlockEntity#setDisplayStack and use its DisplayData.",
            "Let Tide instantiate the entity, apply compatibility variants, then delegate to EntityRenderDispatcher.",
            "Do not substitute item sprites or manually approximated geometry for a failed entity render."
        ]

    fish = sorted(merged.values(), key=lambda e: (e.get("source_mod") or "", e.get("fish_id") or ""))
    by_mod: dict[str, int] = {}
    by_group: dict[str, int] = {}
    no_entity = []
    for entry in fish:
        mod = entry.get("source_mod") or "unknown"
        group = entry.get("group") or "unknown"
        by_mod[mod] = by_mod.get(mod, 0) + 1
        by_group[group] = by_group.get(group, 0) + 1
        if not entry.get("entity_id"):
            no_entity.append(entry["fish_id"])

    registry = {
        "schema_version": 3,
        "generator": "tools/fish-render-source/extract_fish_render_sources.py",
        "render_contract": {
            "primary_renderer": "com.li64.tide.client.FishDisplayRenderer",
            "display_block_entity": "com.li64.tide.registries.blocks.entities.FishDisplayBlockEntity",
            "display_data_class": "com.li64.tide.data.fishing.DisplayData",
            "dispatcher": "net.minecraft.client.render.entity.EntityRenderDispatcher",
            "principle": "Render real Minecraft entities offscreen. Never fake 3D fish from flat item sprites.",
            "transparent_output": True
        },
        "archive_count": len(inventories),
        "fish_count": len(fish),
        "counts_by_source_mod": dict(sorted(by_mod.items())),
        "counts_by_group": dict(sorted(by_group.items())),
        "available_owner_namespaces": sorted(available_namespaces),
        "unsupported_count": len(unsupported),
        "unsupported": dict(sorted(unsupported.items())),
        "no_display_entity": no_entity,
        "mods": [i["mod"] for i in inventories],
        "fish": fish,
        "duplicates": duplicates
    }
    (registry_dir / "fish-render-registry.json").write_text(json.dumps(registry, indent=2) + "\n", encoding="utf-8")
    (registry_dir / "archive-render-inventory.json").write_text(json.dumps(inventories, indent=2) + "\n", encoding="utf-8")
    summary = {"archives_scanned": len(inventories), "fish_entries": len(fish), "unsupported": len(unsupported), "duplicates": len(duplicates), "no_display_entity": len(no_entity), "counts_by_source_mod": registry["counts_by_source_mod"], "counts_by_group": registry["counts_by_group"]}
    (registry_dir / "source-import-report.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print("IMPORT_SUMMARY " + json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
