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
  subtitle: "Patio Deck",
  client: "Private Residence",
  location: "Placeholder, CA",
  scope: "Pool Deck · Outdoor Kitchen · Dining & Seating",
  status: "Design Development",
  year: "2026",

  summary:
    "Design-development drawings for the Clearview Dr Residence pool deck, developed " +
    "from Concept Version 5.5: a dimensioned site and deck plan laying out the BBQ " +
    "kitchen, dining, lounge seating, baja-bench pool and fire pit, paired with two " +
    "building sections through the pergola bay and a 3D massing study of the roof " +
    "plane over the terrace.",

  // Hero reel — checked in this order, first match wins. All three loop forever.
  // Each accepts either a full YouTube link (any youtube.com/youtu.be URL —
  // watch, playlist, shorts, whatever's in the address bar) or a bare ID;
  // paste straight from the browser, no need to extract IDs by hand.
  // 1) heroPlaylistId: an actual YouTube playlist link or ID.
  // 2) heroVideoIds: an array of standalone video links/IDs, cycled then looped.
  // 3) heroVideoId: a single video link/ID, looped on itself.
  // Leave all three empty/blank to fall back to heroImage as a static hero background.
  heroPlaylistId: "PLL5c6ekNKKMA",
  heroVideoIds: [],
  heroVideoId: "",
  // Homepage-only, so it can stay relative to index.html directly.
  heroImage: "./versions/V5.5/assets/01-aerial-site-overview.jpg",

  // Local download by default (works immediately, no setup). Stored root-relative
  // (no leading "./") since SiteCommon.renderChrome() prefixes it per page depth.
  pdfDownloadUrl: "assets/downloads/Clearview-Deck-DV5.5-1-Patio-Deck.pdf",
  pdfLabel: "Download Patio Deck Drawings (PDF)",

  // No full-resolution archive folder for this drawing set yet — leave blank to
  // hide the "Drive" button (SiteCommon.renderChrome() does this automatically).
  driveFolderUrl: ""
};
