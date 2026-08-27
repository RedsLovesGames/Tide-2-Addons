#!/usr/bin/env python3
"""Validate the published Fish Wiki render manifest and its claimed PNGs.

The manifest uses repository-relative render paths. Structural/image integrity is
validated here. Runtime authenticity is established by the canonical runtime bundle
import contract and its preserved provenance reports.
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets" / "fish-render-manifest.json"
CONDITIONS = (
    "normal",
    "scarred",
    "parasite_ridden",
    "albino",
    "iridescent",
    "giant",
    "dwarf",
    "perfect_specimen",
)
FILE_BACKED_STATUSES = {
    "source_backed_documentation",
    "source_backed_export",
    "source_backed_runtime",
    "source_backed_runtime_entity",
}
NO_FILE_STATUSES = {
    "unavailable",
    "pending",
    "pending_later_runtime_entity",
    "source_missing",
    "unreconstructed",
    "no_entity",
    "vanilla_model",
}


def resolve_render_path(raw: str) -> Path:
    path = Path(raw)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"render path must be repository-relative: {raw!r}")

    repo_relative = ROOT / path
    if repo_relative.is_file():
        return repo_relative

    assets_relative = ROOT / "assets" / path
    if assets_relative.is_file():
        return assets_relative

    return repo_relative


def validate_png(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        rel = path.relative_to(ROOT)
    except ValueError:
        return [f"render resolves outside repository: {path}"]

    if not path.is_file():
        return [f"missing claimed render: {rel}"]

    try:
        with Image.open(path) as im:
            im.load()
            if im.format != "PNG":
                errors.append(f"claimed render is not PNG: {rel}")
            rgba = im.convert("RGBA")
            if rgba.width < 2 or rgba.height < 2:
                errors.append(f"render dimensions are invalid: {rel}")
            alpha = rgba.getchannel("A")
            lo, hi = alpha.getextrema()
            if hi == 0:
                errors.append(f"render is fully transparent: {rel}")
            if lo == 255:
                errors.append(f"render has no transparent pixels: {rel}")
            bbox = alpha.getbbox()
            if not bbox:
                errors.append(f"render has no visible alpha bounds: {rel}")
            else:
                left, top, right, bottom = bbox
                if left == 0 or top == 0 or right == rgba.width or bottom == rgba.height:
                    errors.append(f"render touches an image edge and lacks safe transparent padding: {rel}")
    except OSError as exc:
        errors.append(f"cannot decode {rel}: {exc}")
    return errors


def main() -> None:
    errors: list[str] = []
    warnings: list[str] = []

    if not MANIFEST.is_file():
        raise SystemExit("fish-render-manifest: assets/fish-render-manifest.json is missing")
    try:
        data = json.loads(MANIFEST.read_text("utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"fish-render-manifest: cannot read manifest: {exc}") from exc

    schema_version = data.get("schemaVersion", data.get("schema_version"))
    if not isinstance(schema_version, int) or schema_version < 2:
        errors.append(f"unsupported or missing render manifest schema version: {schema_version!r}")

    fish = data.get("fish")
    if not isinstance(fish, dict) or not fish:
        errors.append("manifest fish must be a non-empty object")
        fish = {}

    claimed = {k: 0 for k in CONDITIONS}
    used_paths: dict[str, str] = {}

    for fish_id, entry in fish.items():
        if not isinstance(fish_id, str) or ":" not in fish_id:
            errors.append(f"invalid fish id {fish_id!r}")
            continue
        if not isinstance(entry, dict):
            errors.append(f"{fish_id}: manifest entry must be an object")
            continue

        variants = entry.get("variants") or {}
        if not isinstance(variants, dict):
            errors.append(f"{fish_id}: variants must be an object")
            continue

        for condition, variant in variants.items():
            if not isinstance(variant, dict):
                errors.append(f"{fish_id}/{condition}: variant must be an object")
                continue

            file = variant.get("file")
            status = variant.get("status")

            if file:
                if not isinstance(file, str):
                    errors.append(f"{fish_id}/{condition}: file must be a string")
                    continue
                if status not in FILE_BACKED_STATUSES:
                    errors.append(f"{fish_id}/{condition} has a file but unsupported source-backed status {status!r}")
                    continue
                try:
                    resolved = resolve_render_path(file)
                except ValueError as exc:
                    errors.append(f"{fish_id}/{condition}: {exc}")
                    continue
                normalized = resolved.as_posix()
                previous = used_paths.get(normalized)
                if previous and previous != fish_id:
                    errors.append(f"render path collision: {fish_id} and {previous} both claim {file}")
                else:
                    used_paths[normalized] = fish_id
                if condition in claimed:
                    claimed[condition] += 1
                errors.extend(validate_png(resolved))
            else:
                if status not in NO_FILE_STATUSES:
                    errors.append(f"{fish_id}/{condition} has no file and unknown non-file status {status!r}")

    expected = data.get("counts") or {}
    if not isinstance(expected, dict):
        errors.append("counts must be an object when present")
        expected = {}

    supported = expected.get("supported_fish")
    if supported is not None:
        try:
            if int(supported) != len(fish):
                errors.append(f"supported_fish count mismatch: manifest says {supported}, found {len(fish)} entries")
        except (TypeError, ValueError):
            errors.append(f"supported_fish count is not an integer: {supported!r}")

    for condition, count in claimed.items():
        if condition not in expected:
            continue
        try:
            expected_count = int(expected[condition])
        except (TypeError, ValueError):
            errors.append(f"count for {condition} is not an integer: {expected[condition]!r}")
            continue
        if expected_count != count:
            errors.append(f"count mismatch for {condition}: manifest says {expected_count}, found {count}")

    requested = expected.get("requested_fish")
    if requested is not None:
        try:
            if int(requested) < len(fish):
                errors.append(f"requested_fish={requested} cannot be smaller than supported entries={len(fish)}")
        except (TypeError, ValueError):
            errors.append(f"requested_fish count is not an integer: {requested!r}")

    if data.get("pipelineStatus") == "canonical_runtime_bundle":
        bundle = data.get("bundle") or {}
        contract = bundle.get("renderContract") or {}
        if contract.get("renderer") != "com.li64.tide.client.FishDisplayRenderer":
            errors.append("canonical runtime bundle must name Tide FishDisplayRenderer")
        if contract.get("direct_entity_fallback") is not False:
            errors.append("canonical runtime bundle must disable direct entity fallback")
        if contract.get("transparent_framebuffer") is not True:
            errors.append("canonical runtime bundle must use transparent framebuffer output")
        if not bundle.get("sha256"):
            errors.append("canonical runtime bundle is missing bundle SHA-256 provenance")

    if not data.get("generatedBy"):
        warnings.append("manifest has no generatedBy provenance string")
    if not data.get("pipelineStatus"):
        warnings.append("manifest has no pipelineStatus")

    if warnings:
        print("Fish render manifest warnings:")
        for warning in warnings:
            print(f"  - {warning}")

    if errors:
        print("Fish render manifest FAILED:")
        for error in errors:
            print(f"  - {error}")
        raise SystemExit(1)

    print("Fish render manifest OK:", f"fish={len(fish)}", ", ".join(f"{k}={v}" for k, v in claimed.items()))


if __name__ == "__main__":
    main()
