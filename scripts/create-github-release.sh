#!/usr/bin/env bash
# Create GitHub Release v0.1.0 with the root-scaffold tarball.
# Requires: gh auth login (once), git push access to origin.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm prepare-publish
cd release/root-scaffold
npm pack
TARBALL="$ROOT/release/root-scaffold/root-scaffold-0.1.0.tgz"
cd "$ROOT"

if ! git rev-parse v0.1.0 >/dev/null 2>&1; then
  git tag -a v0.1.0 -m "Root public preview 0.1.0"
fi

git push origin v0.1.0

gh release create v0.1.0 \
  --title "Root v0.1.0 — Public Preview" \
  --notes-file docs/release-notes-v0.1.0.md \
  "$TARBALL"

echo "Released https://github.com/Prince-695/Root/releases/tag/v0.1.0"
