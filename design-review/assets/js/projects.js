/*
 * PROJECTS — the demo/fallback project list.
 *
 * Used when the master Drive folder in config.js isn't set, or when listing
 * it fails for any reason — same "never come up empty" fallback pattern as
 * packages.js one level down. Each entry here is a full project in its own
 * right: it can point at its own Drive folder (driveFolderId) and go live for
 * ITS review sets even while the site-level project LIST is running off this
 * manifest — exactly how a single package can be Drive-backed while the
 * package list itself is hand-authored.
 *
 * ── An entry ─────────────────────────────────────────────────────────────
 *   {
 *     slug: "clearview-deck",        used in URLs: project.html?p=clearview-deck
 *     title: "Clearview Deck",
 *     client: "...", location: "...", scope: "...", phase: "...", year: "...",
 *     summary: "...",
 *     driveFolderId: "1AbC...",      optional — this project's OWN Drive
 *                                    folder (its review sets live under it).
 *                                    Leave "" to use the local packages.js
 *                                    manifest for this project instead.
 *   }
 *
 * Once config.js's master driveFolderId + driveApiKey are set, the landing
 * page lists live subfolders of that folder as projects instead of this list
 * — each becomes { slug: slugified folder name, title: folder name,
 * driveFolderId: that subfolder's id }. An entry here whose `slug` matches a
 * live-discovered folder's slugified name still applies as a metadata
 * override (title/client/location/etc.) on top of it, the same way a
 * review-set's meta.json overrides a live-listed folder's bare name — see
 * Drive.listProjects() in drive.js.
 */
window.PROJECTS = [
  {
    slug: "clearview-deck",
    title: "Clearview Deck",
    client: "Private Residence",
    location: "Placeholder, CA",
    scope: "Outdoor Pergola · Pool Deck · Fireplace",
    phase: "Design Development",
    year: "2026",
    summary:
      "Every drawing set, rendering and revision for the project lives in one Google " +
      "Drive folder. This site reads that folder directly — renderings open in a " +
      "full-screen carousel, PDF sheets open in an embedded viewer, and any of them " +
      "can be marked up and commented on so nothing gets lost between sets.",
    // Wired to the project's own Drive folder — its review sets list live
    // from here even though the project LIST above is the local fallback.
    driveFolderId: "1LMkGxtyunIvuBy_hg2xfdiCzfOkmdtFF"
  }
];
