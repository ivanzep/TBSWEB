/*
 * VERSION REGISTRY — the one line that makes a new version folder show up on the
 * homepage grid. Each entry is the folder name under /versions/ (e.g. "v5-2" means
 * /versions/v5-2/). Order here is the display order everywhere.
 *
 * To add a new concept version:
 *   1. Copy versions/_template/ to versions/your-id/.
 *   2. Fill in versions/your-id/data.js and drop images/videos into versions/your-id/assets/.
 *   3. Add "your-id" to the array below.
 * versions/your-id/index.html needs no edits — it reads its own id from the folder it's in.
 */
window.VERSION_IDS = [
  "v5",
  "v5-2",
  "v5-2b",
  "v5-3",
  "v5-4",
  "v5-5",
  "v5-6"
];
