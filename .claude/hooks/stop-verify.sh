#!/usr/bin/env bash
# Session-end verification hook.
# 1. Warn if .env files are staged (secret leak risk).
# 2. Run TypeScript type-check to catch compile errors before committing.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"

# --- .env guard ---
if git -C "$REPO_ROOT" diff --cached --name-only 2>/dev/null | grep -qE '\.env(\.local)?$'; then
  echo "[Stop Hook] WARNING: .env file is staged for commit — review before pushing." >&2
fi

# --- TypeScript check ---
echo "[Stop Hook] Running TypeScript check..."
cd "$REPO_ROOT"

if npm run typecheck 2>&1; then
  echo "[Stop Hook] TypeScript check passed."
else
  echo "[Stop Hook] TypeScript errors found — fix before committing." >&2
  exit 1
fi
