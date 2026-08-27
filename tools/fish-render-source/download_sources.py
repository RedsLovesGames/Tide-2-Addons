#!/usr/bin/env python3
"""Download and SHA-256 verify pinned render/FishData source archives.

The manifest is the authoritative URL/version/hash input. Downloads are streamed to
disk, can be filtered by source ID, and reuse an already verified target file.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import time
import urllib.request

USER_AGENT = "TideborneFishWikiSourceImporter/3.0"
CHUNK_SIZE = 1024 * 1024


def sha256_path(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(CHUNK_SIZE), b""):
            h.update(chunk)
    return h.hexdigest()


def download(url: str, target: Path) -> tuple[str, int]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    tmp = target.with_name(target.name + ".part")
    h = hashlib.sha256()
    size = 0
    try:
        with urllib.request.urlopen(request, timeout=120) as response, tmp.open("wb") as out:
            while True:
                chunk = response.read(CHUNK_SIZE)
                if not chunk:
                    break
                out.write(chunk)
                h.update(chunk)
                size += len(chunk)
        tmp.replace(target)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise
    return h.hexdigest(), size


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="tools/fish-render-source/source-manifest.json")
    parser.add_argument("--out", required=True)
    parser.add_argument("--resolved-manifest", default=None)
    parser.add_argument(
        "--id",
        dest="source_ids",
        action="append",
        default=[],
        help="Download only this source ID. Repeat for multiple IDs; omit to download all.",
    )
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    sources = manifest.get("sources") or []
    if not sources:
        raise SystemExit(f"No sources in {manifest_path}")

    requested = set(args.source_ids)
    known_ids = {str(source.get("id")) for source in sources}
    missing_ids = sorted(requested - known_ids)
    if missing_ids:
        raise SystemExit(f"Unknown source IDs requested: {', '.join(missing_ids)}")
    if requested:
        sources = [source for source in sources if source.get("id") in requested]

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    resolved: list[dict] = []

    for source in sources:
        source_id = str(source["id"])
        url = str(source["url"])
        filename = str(source["filename"])
        if Path(filename).name != filename:
            raise SystemExit(f"Unsafe filename in source manifest for {source_id}: {filename!r}")
        expected = source.get("sha256")
        target = out / filename

        got: str | None = None
        size = 0
        if target.is_file():
            existing = sha256_path(target)
            if expected and existing.lower() == str(expected).lower():
                got = existing
                size = target.stat().st_size
                print(f"SOURCE_CACHE_HIT id={source_id} bytes={size} sha256={got} file={filename}")
            elif not expected:
                got = existing
                size = target.stat().st_size
                print(f"SOURCE_CACHE_HIT_UNPINNED id={source_id} bytes={size} sha256={got} file={filename}")
            else:
                target.unlink()

        last_error: Exception | None = None
        if got is None:
            for attempt in range(1, 4):
                try:
                    got, size = download(url, target)
                    if expected and got.lower() != str(expected).lower():
                        target.unlink(missing_ok=True)
                        raise RuntimeError(
                            f"SHA-256 mismatch for {filename}: expected {expected}, got {got}"
                        )
                    print(f"SOURCE_OK id={source_id} bytes={size} sha256={got} file={filename}")
                    break
                except Exception as exc:
                    last_error = exc
                    if attempt < 3:
                        time.sleep(attempt * 2)
            else:
                raise SystemExit(f"Failed to download {source_id} after 3 attempts: {last_error}")

        row = dict(source)
        row["resolved_sha256"] = got
        row["bytes"] = size
        resolved.append(row)

    resolved_doc = {
        "schema_version": manifest.get("schema_version", 1),
        "minecraft_version": manifest.get("minecraft_version"),
        "requested_ids": sorted(requested) if requested else None,
        "sources": resolved,
    }
    resolved_path = (
        Path(args.resolved_manifest)
        if args.resolved_manifest
        else out.parent / "resolved-source-manifest.json"
    )
    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    resolved_path.write_text(json.dumps(resolved_doc, indent=2) + "\n", encoding="utf-8")
    print(f"RESOLVED_MANIFEST {resolved_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
