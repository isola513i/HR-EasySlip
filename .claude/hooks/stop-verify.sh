#!/usr/bin/env bash
# Session-end: warn if .env files have staged changes that might leak secrets.
if git -C "$(git rev-parse --show-toplevel 2>/dev/null)" diff --cached --name-only 2>/dev/null | grep -qE '\.env(\.local)?$'; then
  echo "[Stop Hook] WARNING: .env file is staged for commit — review before pushing." >&2
fi
