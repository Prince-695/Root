#!/usr/bin/env bash
# Create (or recreate notes for) GitHub Release v0.1.0 with the root-scaffold tarball.
# Prerequisites: `gh auth login` once. Tag v0.1.0 should already be on origin (or will be created).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pnpm prepare-publish
(
  cd release/root-scaffold
  npm pack
)
TARBALL="$ROOT/release/root-scaffold/root-scaffold-0.1.0.tgz"

if ! git rev-parse v0.1.0 >/dev/null 2>&1; then
  git tag -a v0.1.0 -m "Root public preview 0.1.0"
fi
git push origin v0.1.0 2>/dev/null || true

if gh release view v0.1.0 --repo Prince-695/Root >/dev/null 2>&1; then
  gh release upload v0.1.0 "$TARBALL" --repo Prince-695/Root --clobber
  echo "Updated assets on existing release v0.1.0"
else
  gh release create v0.1.0 \
    --repo Prince-695/Root \
    --title "Root v0.1.0 — Public Preview" \
    --notes-file docs/release-notes-v0.1.0.md \
    "$TARBALL"
  echo "Created https://github.com/Prince-695/Root/releases/tag/v0.1.0"
fi
