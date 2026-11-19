#!/usr/bin/env python3
"""Read-only mechanical scan for mainline drift and artifact bloat."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable


PRUNE_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "dist",
    "build",
    "__pycache__",
    ".pytest_cache",
    ".ruff_cache",
}
ARTIFACT_ROOT_NAMES = {
    "artifacts",
    "mlruns",
    "qlib_mlruns",
    "outputs",
    "runs",
}
BULKY_RUN_FILES = {
    "factor_panel.parquet",
    "backtest_factor_frame.parquet",
    "positions.pkl",
    "orders.parquet",
    "trades.parquet",
}
WRITE_LITERAL_PATTERNS = {
    "factor_panel.parquet",
    "backtest_factor_frame.parquet",
    "positions.pkl",
    "mlruns",
    "qlib_mlruns",
}
EXPERIMENT_NAME_RE = re.compile(
    r"(^|[_-])(round|phase|wave|milestone)[_-]?\d+|20\d{6,}|(^|[_-])r\d+([_-]|$)",
    re.IGNORECASE,
)
SOURCE_SUFFIXES = {".py", ".ts", ".tsx", ".js", ".jsx", ".sh"}
TEXT_SUFFIXES = SOURCE_SUFFIXES | {".toml"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--large-mib", type=int, default=64)
    return parser.parse_args()


def git_root(path: Path) -> Path:
    result = subprocess.run(
        ["git", "-C", str(path), "rev-parse", "--show-toplevel"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        return Path(result.stdout.strip()).resolve()
    return path.resolve()


def iter_files(root: Path) -> Iterable[Path]:
    for current, dirs, files in os.walk(root):
        dirs[:] = [name for name in dirs if name not in PRUNE_DIRS]
        base = Path(current)
        for name in files:
            yield base / name


def relative(path: Path, root: Path) -> str:
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return str(path)


def directory_size(root: Path) -> tuple[int, int]:
    total = 0
    count = 0
    for path in iter_files(root):
        try:
            total += path.stat().st_size
            count += 1
        except OSError:
            continue
    return total, count


def detect_nested_absolute_paths(root: Path) -> list[str]:
    findings: list[str] = []
    repo_name = root.name
    for current, dirs, _ in os.walk(root):
        dirs[:] = [name for name in dirs if name not in PRUNE_DIRS]
        base = Path(current)
        rel_parts = base.relative_to(root).parts
        if "home" in rel_parts:
            index = rel_parts.index("home")
            if len(rel_parts) - index >= 4:
                findings.append(relative(base, root))
                dirs[:] = []
                continue
        if rel_parts.count(repo_name) > 0:
            findings.append(relative(base, root))
            dirs[:] = []
    return sorted(set(findings))


def detect_source_smells(root: Path) -> tuple[list[str], list[dict[str, Any]]]:
    named: list[str] = []
    literals: list[dict[str, Any]] = []
    for path in iter_files(root):
        rel = relative(path, root)
        parts = path.relative_to(root).parts
        if any(part in ARTIFACT_ROOT_NAMES or part == "data" for part in parts):
            continue
        if path.suffix in SOURCE_SUFFIXES and EXPERIMENT_NAME_RE.search(path.stem):
            named.append(rel)
        if path.suffix not in TEXT_SUFFIXES:
            continue
        try:
            if path.stat().st_size > 2 * 1024 * 1024:
                continue
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for line_no, line in enumerate(text.splitlines(), start=1):
            hits = sorted(value for value in WRITE_LITERAL_PATTERNS if value in line)
            if hits:
                literals.append(
                    {"path": rel, "line": line_no, "matches": hits, "text": line.strip()[:240]}
                )
    return sorted(named), literals


def scan_artifacts(root: Path, large_bytes: int) -> dict[str, Any]:
    roots: list[Path] = []
    for current, dirs, _ in os.walk(root):
        dirs[:] = [name for name in dirs if name not in PRUNE_DIRS]
        base = Path(current)
        if "data" in base.relative_to(root).parts:
            continue
        selected = [name for name in dirs if name in ARTIFACT_ROOT_NAMES]
        for name in selected:
            roots.append(base / name)
            dirs.remove(name)

    summaries: list[dict[str, Any]] = []
    basename_totals: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    large_files: list[dict[str, Any]] = []
    bulky_files: list[dict[str, Any]] = []

    for artifact_root in sorted(set(roots)):
        size, count = directory_size(artifact_root)
        summaries.append(
            {"path": relative(artifact_root, root), "bytes": size, "files": count}
        )
        for path in iter_files(artifact_root):
            try:
                file_size = path.stat().st_size
            except OSError:
                continue
            basename_totals[path.name][0] += 1
            basename_totals[path.name][1] += file_size
            item = {"path": relative(path, root), "bytes": file_size}
            if file_size >= large_bytes:
                large_files.append(item)
            if path.name in BULKY_RUN_FILES:
                bulky_files.append(item)

    repeated = [
        {"name": name, "count": values[0], "bytes": values[1]}
        for name, values in basename_totals.items()
        if values[0] >= 2 and values[1] >= large_bytes
    ]
    return {
        "roots": sorted(summaries, key=lambda item: item["bytes"], reverse=True),
        "repeated_names": sorted(repeated, key=lambda item: item["bytes"], reverse=True)[:50],
        "large_files": sorted(large_files, key=lambda item: item["bytes"], reverse=True)[:100],
        "known_bulky_run_files": sorted(
            bulky_files, key=lambda item: item["bytes"], reverse=True
        )[:100],
    }


def git_evidence(root: Path) -> dict[str, Any]:
    def run(*args: str) -> list[str]:
        result = subprocess.run(
            ["git", "-C", str(root), *args],
            check=False,
            capture_output=True,
            text=True,
        )
        return result.stdout.splitlines() if result.returncode == 0 else []

    return {
        "status": run("status", "--short"),
        "worktrees": run("worktree", "list", "--porcelain"),
    }


def format_bytes(value: int) -> str:
    units = ["B", "KiB", "MiB", "GiB", "TiB"]
    size = float(value)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f}{unit}"
        size /= 1024
    return str(value)


def print_text(result: dict[str, Any]) -> None:
    print(f"root: {result['root']}")
    print(f"AGENTS.md: {len(result['agents_files'])}")
    print(f"dirty entries: {len(result['git']['status'])}")
    print(f"suspicious nested paths: {len(result['nested_absolute_paths'])}")
    for path in result["nested_absolute_paths"][:20]:
        print(f"  PATH {path}")
    print(f"experiment-named source files: {len(result['experiment_named_source'])}")
    for path in result["experiment_named_source"][:30]:
        print(f"  SRC  {path}")
    print(f"suspicious source literals: {len(result['source_literals'])}")
    for item in result["source_literals"][:30]:
        print(f"  LIT  {item['path']}:{item['line']} {','.join(item['matches'])}")
    print("artifact roots:")
    for item in result["artifacts"]["roots"]:
        print(f"  {format_bytes(item['bytes']):>10} {item['files']:>7} {item['path']}")
    print("repeated artifact names:")
    for item in result["artifacts"]["repeated_names"][:20]:
        print(
            f"  {format_bytes(item['bytes']):>10} {item['count']:>7} {item['name']}"
        )


def main() -> int:
    args = parse_args()
    root = git_root(args.root)
    source_named, source_literals = detect_source_smells(root)
    result = {
        "root": str(root),
        "agents_files": sorted(relative(path, root) for path in root.rglob("AGENTS.md")),
        "git": git_evidence(root),
        "nested_absolute_paths": detect_nested_absolute_paths(root),
        "experiment_named_source": source_named,
        "source_literals": source_literals,
        "artifacts": scan_artifacts(root, args.large_mib * 1024 * 1024),
    }
    if args.as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print_text(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
