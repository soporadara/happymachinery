#!/usr/bin/env bash
# Quick Git Push Script
set -e
cd "$(dirname "$0")"

MSG="${1:-}"
if [ -n "$MSG" ]; then
  python3 push.py -m "$MSG"
else
  python3 push.py
fi
