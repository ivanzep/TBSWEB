#!/bin/sh
# Convenience wrapper — run this after adding/removing/renaming files in any
# versions/<id>/assets/ or reference/<id>/assets/ folder, or adding/removing
# a version/section folder itself. Regenerates versions/versions-index.js +
# every versions/<id>/data.js, and reference/sections-index.js + every
# reference/<id>/data.js.
cd "$(dirname "$0")/.." || exit 1
node scripts/generate-version-data.js
node scripts/generate-reference-data.js
