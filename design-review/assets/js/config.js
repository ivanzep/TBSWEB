/*
 * SITE CONFIG — studio branding and the one Drive folder the whole site hangs
 * off of.
 *
 * This is a multi-project portal: one Google Drive folder holds one subfolder
 * per project, and the site discovers projects by listing that folder live —
 * add a subfolder in Drive, it shows up on the landing page with no code
 * change. Each project's own subfolder works exactly the same way one level
 * down: subfolders of IT become that project's review sets, and files inside
 * those become the reviewable items. So the whole hierarchy is:
 *
 *   Master folder (driveFolderId below)
 *     Project A/              → a project
 *       Design Development/   → a review set
 *         A1.0 Site Plan.pdf  → an item
 *       Schematic Design/
 *         ...
 *     Project B/
 *       ...
 *
 * ── Getting the master folder ready ───────────────────────────────────────
 * 1. Create (or pick) a Drive folder to hold every project. Inside it, one
 *    subfolder per project; inside each of those, one subfolder per review
 *    set, same as any single project folder already looks like.
 * 2. Share the WHOLE tree "Anyone with the link → Viewer" — right-click the
 *    master folder → Share sets it for everything inside unless a subfolder
 *    overrides it. Anything not link-shared can't be listed or embedded; the
 *    site shows a "can't load — check sharing" placeholder rather than
 *    failing silently, but it still won't be visible to a client.
 * 3. Copy the master folder's ID out of its address bar. For
 *      https://drive.google.com/drive/folders/1AbC...XyZ
 *    the ID is everything after /folders/ → "1AbC...XyZ". Paste it below.
 * 4. Get a Drive API key (auto-discovery needs one — there's no manifest
 *    fallback for "what projects exist" the way there is within a project):
 *      console.cloud.google.com → enable the "Google Drive API" →
 *      Credentials → Create credentials → API key.
 *    Restrict it — Application restrictions → Websites → this site's domain;
 *    API restrictions → Google Drive API only. The key is visible in
 *    client-side source, as any browser key is; that's what the restriction
 *    is for. A restricted key can only ever read files already shared
 *    "anyone with link".
 *
 * Until both are set, the landing page shows the single demo project in
 * projects.js (which in turn reads its packages from packages.js) with an
 * on-screen setup notice — so the site is never blank while this is unwired.
 */
window.SITE = {
  studio: {
    name: "The Brown Studio",
    tagline: "Design + Build",
    site: "thebrownstudio.com",
    email: "hello@thebrownstudio.com"
  },

  /* ── Google Drive ───────────────────────────────────────────────────────
   * driveFolderId  The MASTER folder — one subfolder per project. Powers the
   *                landing page's project list and the "Open in Drive" link
   *                there. Leave as the PLACEHOLDER string and the site runs
   *                on the demo project in projects.js instead.
   * driveApiKey    Required to discover projects live. Without it the site
   *                can't list Drive at all and always shows the demo project,
   *                even if driveFolderId is set.
   */
  driveFolderId: "PASTE_MASTER_DRIVE_FOLDER_ID_HERE",
  driveApiKey: "",

  /* Files/folders the live listing should ignore at every level (projects,
   * review sets, and items alike), matched case-insensitively against the
   * name. Handy for working folders no client should see. */
  liveIgnore: ["_wip", "_archive", "working", ".DS_Store"],

  /* Shown in a project's hero when it has no cover image of its own yet. */
  fallbackHeroImage: "../clearview-deck/versions/v5-2b/assets/poolside-terrace.jpg",

  /* The "Sync Drive Data" footer link — jumps straight to the GitHub Action
   * that regenerates packages.js/folder-tree.js/projects.js from the Drive
   * sheet (see design-review/README.md → "Keeping it in sync
   * automatically"). Deliberately just a deep link, not a one-click
   * trigger: actually dispatching the workflow needs an authenticated
   * GitHub API call, and there's no way to make that call from a public
   * static page without embedding a write-capable token in client-side
   * code — which anyone viewing the site could then use to spam-trigger
   * (or worse) the workflow. One extra click on GitHub's own "Run
   * workflow" button avoids ever shipping that credential.
   */
  syncWorkflowUrl: "https://github.com/ivanzep/TBSWEB/actions/workflows/sync-drive-sheet.yml"
};

/* True while config still carries the shipped placeholder — the pages use this
 * to show the setup notice and fall back to the demo project instead of
 * pretending Drive is wired up. */
window.SITE.isUnconfigured = function () {
  return !window.SITE.driveFolderId ||
    window.SITE.driveFolderId.indexOf("PASTE_") === 0;
};
