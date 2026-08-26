#!/usr/bin/env python3
"""Download and SHA-256 verify the render-source manifest without committing third-party archives."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import time
import urllib.request

USER_AGENT = "TideborneFishWikiSourceImporter/2.0"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", default="tools/fish-render-source/source-manifest.json")
    parser.add_argument("--out", required=True)
    parser.add_argument("--resolved-manifest", default=None)
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    sources = manifest.get("sources") or []
    if not sources:
        raise SystemExit(f"No sources in {manifest_path}")

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    resolved = []

    for source in sources:
        url = source["url"]
        filename = source["filename"]
        expected = source.get("sha256")
        target = out / filename
        last_error: Exception | None = None
        for attempt in range(1, 4):
            try:
                request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = response.read()
                got = sha256_bytes(data)
                if expected and got.lower() != expected.lower():
                    raise RuntimeError(f"SHA-256 mismatch for {filename}: expected {expected}, got {got}")
                target.write_bytes(data)
                print(f"SOURCE_OK id={source['id']} bytes={len(data)} sha256={got} file={filename}")
                row = dict(source)
                row["resolved_sha256"] = got
                row["bytes"] = len(data)
                resolved.append(row)
                break
            except Exception as exc:
                last_error = exc
                if attempt < 3:
                    time.sleep(attempt * 2)
        else:
            raise SystemExit(f"Failed to download {source['id']} after 3 attempts: {last_error}")

    resolved_doc = {
        "schema_version": manifest.get("schema_version", 1),
        "minecraft_version": manifest.get("minecraft_version"),
        "sources": resolved,
    }
    resolved_path = Path(args.resolved_manifest) if args.resolved_manifest else out.parent / "resolved-source-manifest.json"
    resolved_path.parent.mkdir(parents=True, exist_ok=True)
    resolved_path.write_text(json.dumps(resolved_doc, indent=2) + "\n", encoding="utf-8")
    print(f"RESOLVED_MANIFEST {resolved_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
