#!/usr/bin/env bash
# Lightweight secret/PII scan (CLAUDE.md §2.2 — no real BVNs, credentials, or
# production API keys anywhere in this repo). Not a substitute for a full
# secret-scanning tool, but catches the patterns this project explicitly bans.
set -euo pipefail

fail=0

echo "Checking no real .env file is tracked by git..."
if git ls-files | grep -E '(^|/)\.env$' >/dev/null; then
  echo "FAIL: a .env file is tracked by git. Only .env.example may be committed."
  fail=1
fi

echo "Scanning tracked files for live-looking API keys..."
# Paystack live keys, AWS access key IDs, generic "live" secret markers.
if git grep -InE '(sk_live_[A-Za-z0-9]+|pk_live_[A-Za-z0-9]+|AKIA[0-9A-Z]{16})' -- \
  ':!*.lock' ':!package-lock.json' >/tmp/secret-scan-keys.txt; then
  echo "FAIL: possible live API key(s) found:"
  cat /tmp/secret-scan-keys.txt
  fail=1
fi

echo "Scanning tracked files for real-looking BVNs (11-digit numbers other than the fake 00000000000)..."
if git grep -IinE 'bvn["'"'"']?\s*[:=]\s*["'"'"']?[0-9]{11}' -- \
  ':!*.lock' ':!package-lock.json' | grep -v '00000000000' >/tmp/secret-scan-bvn.txt; then
  echo "FAIL: possible real BVN found (fixtures must use 00000000000):"
  cat /tmp/secret-scan-bvn.txt
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "Secret scan failed — see above. Fix before merging (CLAUDE.md §2.2)."
  exit 1
fi

echo "Secret scan passed."
