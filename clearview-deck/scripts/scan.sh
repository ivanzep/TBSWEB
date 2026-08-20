#!/bin/sh
# Convenience wrapper — run this after adding/removing/renaming files in any
# versions/<id>/assets/ folder, or adding/removing a version folder itself.
# Regenerates versions/versions-index.js and every versions/<id>/data.js.
cd "$(dirname "$0")/.." || exit 1
node scripts/generate-version-data.js
