/*
 * PROJECT DATA — site-level info (studio, hero, PDF/Drive links). Read on every
 * page — the homepage and every versions/<id>/index.html subpage — via
 * SiteCommon.renderChrome(). Per-version content (label, note, images, videos)
 * lives in each version's own versions/<id>/data.js instead; see
 * versions/versions-index.js and versions/_template/ for how to add a version.
 *
 * Reusing this template for a new project: duplicate /clearview-deck, drop a new
 * PDF into assets/downloads, replace the versions/ folders with new ones (copy
 * versions/_template/ per direction), then update everything below.
 */
window.PROJECT = {
  studio: {
    name: "The Brown Studio",
    tagline: "Design + Build",
    site: "thebrownstudio.com",
    email: "hello@thebrownstudio.com"
  },

  name: "Clearview Deck",
  subtitle: "Concept Studies",
  client: "Private Residence",
  location: "Placeholder, CA",
  scope: "Outdoor Pergola · Pool Deck · Fireplace",
  status: "Concept Phase",
  year: "2026",

  summary:
    "A rear-yard renovation wraps the existing single-story residence in a continuous " +
    "wood pergola, connecting the main living spaces to a new pool terrace and a " +
    "freestanding concrete fireplace tower. Seven concept directions explore how the " +
    "roof plane, shade coverage and outdoor rooms can be organized around the pool.",

  // Hero reel — checked in this order, first match wins. All three loop forever.
  // 1) heroPlaylistId: an actual YouTube playlist ID (from a "...list=PL..." URL).
  // 2) heroVideoIds: an array of standalone video IDs, cycled in order then looped.
  // 3) heroVideoId: a single video ID, looped on itself.
  // Leave all three empty/blank to fall back to heroImage as a static hero background.
  heroPlaylistId: "PLFgzgcOzYDN0",
  heroVideoIds: [],
  heroVideoId: "",
  // Homepage-only, so it can stay relative to index.html directly.
  heroImage: "./versions/v5-2b/assets/poolside-terrace.jpg",

  // Local download by default (works immediately, no setup). Once the PDF is uploaded
  // to the Google Drive folder below, swap this for the Drive "download" link, e.g.
  // "https://drive.google.com/uc?export=download&id=FILE_ID". Stored root-relative
  // (no leading "./") since SiteCommon.renderChrome() prefixes it per page depth.
  pdfDownloadUrl: "assets/downloads/Clearview-Deck-Concept-Studies.pdf",
  pdfLabel: "Download Concept Deck (PDF)",

  // Handoff / archive folder for full-resolution renderings and source files.
  driveFolderUrl: "https://drive.google.com/drive/folders/1ZRuQFsOuvBx99QZtTs_xGQzFOdroAJT-"
};
