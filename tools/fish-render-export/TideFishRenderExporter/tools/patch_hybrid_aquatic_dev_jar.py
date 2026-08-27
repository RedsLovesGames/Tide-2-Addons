#!/usr/bin/env python3
"""Patch Hybrid Aquatic's Fabric jar for Loom's named dev runtime.

Hybrid Aquatic 1.6.x contains ArgonautEntity methods named setGlowing(boolean)
and isGlowing(). In the published Fabric/intermediary jar those are harmless custom
methods, but Loom remaps Minecraft's Entity methods back to Yarn named symbols for
the development runtime. That makes ArgonautEntity appear to override the final
Entity#setGlowing(boolean), so the JVM rejects the class before Hybrid Aquatic can
finish registering entities.

The fish renderer only needs Hybrid Aquatic's real fish EntityTypes and GeckoLib
renderers. This script performs a same-length constant-pool rename inside the
unrelated ArgonautEntity class before Loom remaps the dependency. It does not touch
any fish entity, model, texture, renderer, animation, or resource.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import zipfile
from pathlib import Path

ARGONAUT_CLASS = "dev/hybridlabs/aquatic/entity/misc/ArgonautEntity.class"
REPLACEMENTS = {
    b"setGlowing": b"setHAglowx",  # 10 bytes -> 10 bytes
    b"isGlowing": b"isHAglowx",    # 9 bytes -> 9 bytes
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def patch(input_jar: Path, output_jar: Path) -> dict[str, object]:
    if not input_jar.is_file():
        raise SystemExit(f"input jar does not exist: {input_jar}")
    if input_jar.resolve() == output_jar.resolve():
        raise SystemExit("input and output jars must be different files")

    output_jar.parent.mkdir(parents=True, exist_ok=True)
    patched_class = False
    replacement_counts = {old.decode(): 0 for old in REPLACEMENTS}

    with zipfile.ZipFile(input_jar, "r") as src, zipfile.ZipFile(output_jar, "w") as dst:
        names = set(src.namelist())
        if ARGONAUT_CLASS not in names:
            candidates = sorted(name for name in names if name.endswith("/ArgonautEntity.class"))
            raise SystemExit(
                f"expected {ARGONAUT_CLASS} not found; candidates={candidates or 'none'}"
            )

        for info in src.infolist():
            data = src.read(info.filename)
            if info.filename == ARGONAUT_CLASS:
                for old, new in REPLACEMENTS.items():
                    count = data.count(old)
                    if count <= 0:
                        raise SystemExit(
                            f"{old.decode()} not found in {ARGONAUT_CLASS}; upstream bytecode changed"
                        )
                    data = data.replace(old, new)
                    replacement_counts[old.decode()] = count
                patched_class = True

            # Recreate the entry with the original metadata where possible.
            copied = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            copied.compress_type = info.compress_type
            copied.comment = info.comment
            copied.extra = info.extra
            copied.internal_attr = info.internal_attr
            copied.external_attr = info.external_attr
            copied.create_system = info.create_system
            copied.flag_bits = info.flag_bits
            dst.writestr(copied, data)

    if not patched_class:
        raise SystemExit("ArgonautEntity class was not patched")

    # Re-open and prove the collision-causing names are gone from ArgonautEntity
    # while the replacement names are present.
    with zipfile.ZipFile(output_jar, "r") as patched:
        argonaut = patched.read(ARGONAUT_CLASS)
        for old, new in REPLACEMENTS.items():
            if old in argonaut:
                raise SystemExit(f"unpatched {old.decode()} remains in {ARGONAUT_CLASS}")
            if new not in argonaut:
                raise SystemExit(f"replacement {new.decode()} missing from {ARGONAUT_CLASS}")

    evidence = {
        "input": str(input_jar),
        "output": str(output_jar),
        "input_sha256": sha256(input_jar),
        "output_sha256": sha256(output_jar),
        "patched_class": ARGONAUT_CLASS,
        "replacement_counts": replacement_counts,
        "scope": "Loom dev-runtime bootstrap only; no fish classes/resources modified",
    }
    return evidence


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input_jar", type=Path)
    parser.add_argument("output_jar", type=Path)
    parser.add_argument("--evidence", type=Path)
    args = parser.parse_args()

    evidence = patch(args.input_jar, args.output_jar)
    encoded = json.dumps(evidence, indent=2, sort_keys=True) + "\n"
    if args.evidence:
        args.evidence.parent.mkdir(parents=True, exist_ok=True)
        args.evidence.write_text(encoded, encoding="utf-8")
    sys.stdout.write(encoded)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
