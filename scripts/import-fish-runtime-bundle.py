#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from collections import Counter
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUNDLE = ROOT / "fish" / "render-bundles" / "current-runtime-export.zip"
VARIANT_MAP = {
    "default": "normal",
    "iridescent": "iridescent",
    "scarred": "scarred",
    "parasite_ridden": "parasite_ridden",
    "albino": "albino",
    "giant": "giant",
    "dwarf": "dwarf",
}
EXPECTED_RENDERER = "com.li64.tide.client.FishDisplayRenderer"
SAFE_RENDER_RE = re.compile(r"^renders/[A-Za-z0-9_.-]+\.png$")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_json(zf: zipfile.ZipFile, name: str) -> dict:
    try:
        return json.loads(zf.read(name).decode("utf-8"))
    except KeyError as exc:
        raise SystemExit(f"runtime bundle missing required file: {name}") from exc
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise SystemExit(f"runtime bundle has invalid JSON in {name}: {exc}") from exc


def validate_member_name(name: str) -> None:
    path = PurePosixPath(name)
    if path.is_absolute() or ".." in path.parts or "\\" in name:
        raise SystemExit(f"unsafe bundle member path: {name!r}")


def normalize_variant(value: str) -> str:
    key = str(value or "").strip().lower().replace("-", "_")
    if key not in VARIANT_MAP:
        raise SystemExit(f"unsupported runtime bundle variant: {value!r}")
    return VARIANT_MAP[key]


def main() -> None:
    parser = argparse.ArgumentParser(description="Import the canonical Tide Fish runtime export bundle into the Fish Wiki.")
    parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--keep-stale-renders", action="store_true")
    args = parser.parse_args()

    root = args.root.resolve()
    bundle = args.bundle if args.bundle.is_absolute() else root / args.bundle
    renders_dir = root / "fish" / "assets" / "renders"
    manifest_path = root / "assets" / "fish-render-manifest.json"
    provenance_dir = root / "fish" / "render-data" / "runtime-bundle"
    import_report_path = provenance_dir / "import-report.json"

    if not bundle.is_file():
        raise SystemExit(f"runtime bundle does not exist: {bundle}")

    bundle_sha256 = hashlib.sha256(bundle.read_bytes()).hexdigest()
    try:
        bundle_label = str(bundle.relative_to(root)).replace("\\", "/")
    except ValueError:
        bundle_label = bundle.name

    with zipfile.ZipFile(bundle) as zf:
        names = zf.namelist()
        if len(names) != len(set(names)):
            raise SystemExit("runtime bundle contains duplicate ZIP member names")
        for name in names:
            validate_member_name(name)

        bundle_manifest = read_json(zf, "manifest.json")
        environment = read_json(zf, "environment.json")
        catalog = read_json(zf, "fish-catalog.json")
        render_report = read_json(zf, "render-report.json")
        failures_report = read_json(zf, "failures.json")

        if bundle_manifest.get("bundle_type") != "tide_fish_runtime_export":
            raise SystemExit(f"unexpected bundle_type: {bundle_manifest.get('bundle_type')!r}")
        if catalog.get("source") != "runtime:TideData.FISH":
            raise SystemExit(f"unexpected fish catalog source: {catalog.get('source')!r}")
        if render_report.get("renderer") != "TideFishRuntimeExporter":
            raise SystemExit(f"unexpected renderer report owner: {render_report.get('renderer')!r}")
        contract = render_report.get("render_contract") or {}
        if contract.get("renderer") != EXPECTED_RENDERER:
            raise SystemExit(f"runtime bundle did not use Tide FishDisplayRenderer: {contract.get('renderer')!r}")
        if contract.get("direct_entity_fallback") is not False:
            raise SystemExit("runtime bundle enables a direct entity fallback; canonical publication requires Tide Fish Display only")
        if not contract.get("transparent_framebuffer"):
            raise SystemExit("runtime bundle is not marked as transparent-framebuffer output")

        fish_rows = catalog.get("fish") or []
        if not isinstance(fish_rows, list) or not fish_rows:
            raise SystemExit("runtime fish catalog is empty")
        fish_by_id: dict[str, dict] = {}
        for row in fish_rows:
            fish_id = row.get("fish_id")
            if not isinstance(fish_id, str) or ":" not in fish_id:
                raise SystemExit(f"invalid runtime fish id: {fish_id!r}")
            if fish_id in fish_by_id:
                raise SystemExit(f"duplicate runtime fish id: {fish_id}")
            fish_by_id[fish_id] = row

        if int(bundle_manifest.get("fish_count", -1)) != len(fish_by_id):
            raise SystemExit("bundle manifest fish_count does not match fish-catalog.json")
        if int(render_report.get("fish_count", -1)) != len(fish_by_id):
            raise SystemExit("render report fish_count does not match fish-catalog.json")

        successes = render_report.get("successes") or []
        failures = render_report.get("failures") or []
        if int(render_report.get("successful", -1)) != len(successes):
            raise SystemExit("render-report successful count mismatch")
        if int(render_report.get("failed", -1)) != len(failures):
            raise SystemExit("render-report failed count mismatch")
        if int(failures_report.get("failed", -1)) != len(failures_report.get("failures") or []):
            raise SystemExit("failures.json count mismatch")

        success_by_key: dict[tuple[str, str], dict] = {}
        failure_by_key: dict[tuple[str, str], dict] = {}
        render_payloads: dict[str, bytes] = {}

        for row in successes:
            fish_id = row.get("fish_id")
            if fish_id not in fish_by_id:
                raise SystemExit(f"render report success references fish outside runtime catalog: {fish_id!r}")
            variant = normalize_variant(row.get("variant"))
            key = (fish_id, variant)
            if key in success_by_key or key in failure_by_key:
                raise SystemExit(f"duplicate render result for {fish_id}/{variant}")
            png_name = row.get("png")
            if not isinstance(png_name, str) or not SAFE_RENDER_RE.fullmatch(png_name):
                raise SystemExit(f"unsafe or invalid render path for {fish_id}/{variant}: {png_name!r}")
            try:
                payload = zf.read(png_name)
            except KeyError as exc:
                raise SystemExit(f"bundle report claims missing PNG: {png_name}") from exc
            expected_hash = row.get("png_sha256")
            actual_hash = sha256_bytes(payload)
            if expected_hash and expected_hash != actual_hash:
                raise SystemExit(f"PNG hash mismatch for {fish_id}/{variant}: report={expected_hash} actual={actual_hash}")
            if not payload.startswith(b"\x89PNG\r\n\x1a\n"):
                raise SystemExit(f"claimed render is not PNG: {png_name}")
            if png_name in render_payloads and render_payloads[png_name] != payload:
                raise SystemExit(f"conflicting duplicate render payload: {png_name}")
            render_payloads[png_name] = payload
            success_by_key[key] = row

        for row in failures:
            fish_id = row.get("fish_id")
            if fish_id not in fish_by_id:
                raise SystemExit(f"render report failure references fish outside runtime catalog: {fish_id!r}")
            variant = normalize_variant(row.get("variant"))
            key = (fish_id, variant)
            if key in success_by_key or key in failure_by_key:
                raise SystemExit(f"duplicate render result for {fish_id}/{variant}")
            failure_by_key[key] = row

        expected_jobs = len(fish_by_id) * len(VARIANT_MAP)
        if int(render_report.get("jobs", -1)) != expected_jobs:
            raise SystemExit(f"render report jobs={render_report.get('jobs')} but expected {expected_jobs}")
        if len(success_by_key) + len(failure_by_key) != expected_jobs:
            raise SystemExit("runtime bundle does not contain exactly one success/failure result per fish and canonical visual variant")

        fish_manifest: dict[str, dict] = {}
        successful_counts = Counter()
        failed_counts = Counter()
        fish_with_any_failure: set[str] = set()
        fish_without_normal: set[str] = set()

        for fish_id in sorted(fish_by_id):
            source = fish_by_id[fish_id]
            variants: dict[str, dict] = {}
            entity = source.get("entity_id")
            for canonical_variant in VARIANT_MAP.values():
                key = (fish_id, canonical_variant)
                success = success_by_key.get(key)
                failure = failure_by_key.get(key)
                if success:
                    png_name = success["png"]
                    repo_path = "fish/assets/renders/" + PurePosixPath(png_name).name
                    variants[canonical_variant] = {
                        "file": repo_path,
                        "status": "source_backed_runtime",
                        "renderMode": "tide_fish_display",
                        "renderer": EXPECTED_RENDERER,
                        "pngSha256": success.get("png_sha256") or sha256_bytes(render_payloads[png_name]),
                        "resolvedEntity": success.get("resolved_entity_id"),
                        "entityRenderer": success.get("entity_renderer"),
                        "lengthCm": success.get("length_cm"),
                    }
                    entity = entity or success.get("resolved_entity_id")
                    successful_counts[canonical_variant] += 1
                elif failure:
                    variants[canonical_variant] = {
                        "status": "unavailable",
                        "failureCode": failure.get("failure_code") or "unknown",
                        "error": failure.get("error"),
                    }
                    failed_counts[canonical_variant] += 1
                    fish_with_any_failure.add(fish_id)
                    if canonical_variant == "normal":
                        fish_without_normal.add(fish_id)
                else:
                    raise AssertionError(f"missing result for {fish_id}/{canonical_variant}")

            fish_manifest[fish_id] = {
                "source": f"Runtime TideData.FISH from {source.get('source_mod') or fish_id.split(':', 1)[0]}",
                "dataKey": source.get("data_key"),
                "item": source.get("item_id") or fish_id,
                "entity": entity,
                "showInJournal": source.get("show_in_journal"),
                "original": source.get("original"),
                "associatedMods": source.get("associated_mods") or [],
                "runtimeSize": source.get("size") or {},
                "variants": variants,
            }

        counts = {
            "requested_fish": len(fish_manifest),
            "supported_fish": len(fish_manifest),
            "normal": successful_counts["normal"],
            "scarred": successful_counts["scarred"],
            "parasite_ridden": successful_counts["parasite_ridden"],
            "albino": successful_counts["albino"],
            "iridescent": successful_counts["iridescent"],
            "giant": successful_counts["giant"],
            "dwarf": successful_counts["dwarf"],
            "variant_renders": sum(successful_counts[v] for v in successful_counts if v != "normal"),
            "failed_render_jobs": len(failure_by_key),
            "fish_with_failures": len(fish_with_any_failure),
            "normal_unavailable": len(fish_without_normal),
        }

        published_manifest = {
            "schemaVersion": 3,
            "generatedBy": "scripts/import-fish-runtime-bundle.py from Tide Fish Runtime Exporter bundle",
            "pipelineStatus": "canonical_runtime_bundle",
            "policy": "Published Fish Wiki images come only from the uploaded running-modpack TideData.FISH bundle rendered through Tide FishDisplayBlockEntity and FishDisplayRenderer. Runtime failures stay unavailable; there is no item-sprite, reconstructed-model, AI-art, or direct-entity publication fallback.",
            "bundle": {
                "repositoryPath": bundle_label,
                "sha256": bundle_sha256,
                "generatedAt": bundle_manifest.get("generated_at"),
                "environmentFingerprint": bundle_manifest.get("environment_fingerprint"),
                "catalogFingerprint": bundle_manifest.get("catalog_fingerprint"),
                "cacheKey": bundle_manifest.get("cache_key"),
                "sourceOfTruth": bundle_manifest.get("source_of_truth"),
                "renderer": render_report.get("renderer"),
                "renderContract": contract,
            },
            "counts": counts,
            "fish": fish_manifest,
        }

        renders_dir.mkdir(parents=True, exist_ok=True)
        if not args.keep_stale_renders:
            for old in renders_dir.glob("*.png"):
                old.unlink()
        for png_name, payload in sorted(render_payloads.items()):
            (renders_dir / PurePosixPath(png_name).name).write_bytes(payload)

        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(published_manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        provenance_dir.mkdir(parents=True, exist_ok=True)
        provenance_files = {
            "bundle-manifest.json": bundle_manifest,
            "environment.json": environment,
            "fish-catalog.json": catalog,
            "render-report.json": render_report,
            "failures.json": failures_report,
        }
        for name, payload in provenance_files.items():
            (provenance_dir / name).write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        import_report = {
            "schemaVersion": 1,
            "bundle": bundle_label,
            "bundleSha256": bundle_sha256,
            "fish": len(fish_manifest),
            "renderFiles": len(render_payloads),
            "successfulRenderJobs": len(success_by_key),
            "failedRenderJobs": len(failure_by_key),
            "fishWithFailures": sorted(fish_with_any_failure),
            "fishWithoutNormalRender": sorted(fish_without_normal),
            "successfulByVariant": dict(sorted(successful_counts.items())),
            "failedByVariant": dict(sorted(failed_counts.items())),
            "canonicalRenderer": EXPECTED_RENDERER,
            "directEntityFallback": False,
        }
        import_report_path.write_text(json.dumps(import_report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(
        "Runtime fish bundle imported:",
        f"fish={len(fish_manifest)}",
        f"pngs={len(render_payloads)}",
        f"successful_jobs={len(success_by_key)}",
        f"failed_jobs={len(failure_by_key)}",
        f"normal_unavailable={len(fish_without_normal)}",
    )


if __name__ == "__main__":
    main()
