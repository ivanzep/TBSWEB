/*
 * SITE CONFIG — the one file to edit when standing this site up for a project.
 *
 * Everything the site needs to point at a Google Drive folder lives here. The
 * review packages themselves (the folder structure) live in packages.js.
 *
 * ── Getting the Drive folder ready ────────────────────────────────────────
 * 1. In Google Drive, open the project folder → Share → General access →
 *    "Anyone with the link" → Viewer.
 *    Files that aren't link-shared cannot be embedded; the site will show a
 *    "can't load" placeholder for them rather than failing silently.
 * 2. Copy the folder ID out of the address bar. For
 *      https://drive.google.com/drive/folders/1AbC...XyZ
 *    the ID is everything after /folders/ → "1AbC...XyZ".
 * 3. Paste it into driveFolderId below.
 */
window.SITE = {
  studio: {
    name: "The Brown Studio",
    tagline: "Design + Build",
    site: "thebrownstudio.com",
    email: "hello@thebrownstudio.com"
  },

  project: {
    name: "Clearview Deck",
    subtitle: "Design Review",
    client: "Private Residence",
    location: "Placeholder, CA",
    scope: "Outdoor Pergola · Pool Deck · Fireplace",
    phase: "Design Development",
    year: "2026",
    summary:
      "Every drawing set, rendering and revision for the project lives in one Google " +
      "Drive folder. This site reads that folder directly — renderings open in a " +
      "full-screen carousel, PDF sheets open in an embedded viewer, and any of them " +
      "can be marked up and commented on so nothing gets lost between sets."
  },

  /* ── Google Drive ───────────────────────────────────────────────────────
   * driveFolderId  The top-level project folder. Powers the "Open in Drive"
   *                links, and — in live mode — the folder listing itself.
   *                Leave as the PLACEHOLDER string and the site runs in demo
   *                mode with an on-screen setup notice.
   */
  driveFolderId: "1LMkGxtyunIvuBy_hg2xfdiCzfOkmdtFF",

  /* ── Live folder mode (optional) ────────────────────────────────────────
   * Off by default. With it off, the site renders the hand-authored manifest
   * in packages.js — dependable, no keys, nothing to expire.
   *
   * Turn it on and the site lists the Drive folder live at page load: every
   * subfolder becomes a review package, every file inside becomes an item, and
   * dropping a new PDF into Drive makes it appear on the site with no code
   * change. That is the mode to use if the folder changes often.
   *
   * To enable:
   *   1. console.cloud.google.com → create/pick a project → enable the
   *      "Google Drive API" → Credentials → Create credentials → API key.
   *   2. Restrict the key: Application restrictions → Websites → add the site's
   *      domain; API restrictions → Google Drive API only.
   *   3. Set driveApiKey below and flip liveFolderMode to true.
   *
   * The key is visible in client-side source — that is expected for a browser
   * key, which is why the referrer + API restrictions in step 2 matter. A
   * restricted key can only ever read files already shared "anyone with link".
   * If the listing call fails for any reason the site falls back to packages.js
   * automatically, so the page never comes up empty.
   */
  liveFolderMode: false,
  driveApiKey: "",

  /* Files/folders the live listing should ignore, matched case-insensitively
   * against the name. Handy for working folders you don't want clients seeing. */
  liveIgnore: ["_wip", "_archive", "working", ".DS_Store"],

  /* Shown in the hero when no package cover image is available yet. */
  fallbackHeroImage: "../clearview-deck/versions/v5-2b/assets/poolside-terrace.jpg"
};

/* True while config still carries the shipped placeholder — the pages use this
 * to show the setup notice instead of pretending the folder is wired up. */
window.SITE.isUnconfigured = function () {
  return !window.SITE.driveFolderId ||
    window.SITE.driveFolderId.indexOf("PASTE_") === 0;
};
