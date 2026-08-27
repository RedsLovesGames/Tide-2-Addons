#!/usr/bin/env python3
"""Fast repository hygiene checks for branch/workflow/AI-maintenance contracts."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
ERRORS: list[str] = []

REQUIRED = (
    "AGENTS.md",
    ".ai/state.json",
    ".ai/repo-map.json",
    ".ai/generated-files.json",
    ".gitignore",
    "justfile",
)
STALE_BRANCHES = (
    "fish-wiki-production",
    "fish-render-source-import",
    "bugfix/fish-wiki-ux-pass",
)


def error(message: str) -> None:
    ERRORS.append(message)


for relative in REQUIRED:
    if not (ROOT / relative).is_file():
        error(f"missing repository maintenance file: {relative}")

for relative in (".ai/state.json", ".ai/repo-map.json", ".ai/generated-files.json"):
    path = ROOT / relative
    if not path.is_file():
        continue
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        error(f"{relative} is not valid JSON: {exc}")
        continue
    if data.get("schemaVersion") != 1:
        error(f"{relative} must declare schemaVersion=1")

if not WORKFLOWS.is_dir():
    error(".github/workflows is missing")
else:
    for path in sorted(WORKFLOWS.glob("*.y*ml")):
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)
        for branch in STALE_BRANCHES:
            if branch in text:
                error(f"{rel}: references deleted historical branch {branch!r}")

        # Development automation may publish back to dev, but may not mutate production main.
        if re.search(r"git\s+push[^\n]*(?:HEAD:main|\borigin\s+main\b)", text):
            error(f"{rel}: workflow contains a direct git push to production main")

        # CI must compile checked-in Java/Gradle source rather than a temporary rewritten program.
        for line_no, line in enumerate(text.splitlines(), 1):
            low = line.lower()
            if "sed -i" in low and (".java" in low or "build.gradle" in low or 'src=' in low):
                error(f"{rel}:{line_no}: CI source mutation via sed is prohibited")

state_path = ROOT / ".ai" / "state.json"
if state_path.is_file():
    try:
        state = json.loads(state_path.read_text(encoding="utf-8"))
        branches = state.get("branches") or {}
        if branches.get("integration") != "dev":
            error(".ai/state.json integration branch must be dev")
        if branches.get("production") != "main":
            error(".ai/state.json production branch must be main")
        if branches.get("devPreviewMayWriteMain") is not False:
            error(".ai/state.json must forbid dev preview writes to main")
    except Exception:
        pass

if ERRORS:
    print("Repository structure validation FAILED:")
    for message in ERRORS:
        print(f"  - {message}")
    raise SystemExit(1)

print("Repository structure validation OK")
