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
   *                landing page's live project list. Leave as the PLACEHOLDER
   *                string and the site runs on the demo project in
   *                projects.js instead.
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

  /* ── Comments → Google Sheet (optional) ────────────────────────────────
   * Lets the Review Log page's "Save to Sheet" / "Load from Sheet" buttons
   * push/pull comments through a Google Apps Script Web App instead of
   * only the manual Download JSON / Import Comments files. See
   * design-review/apps-script/Code.gs and README.md → "Saving comments to
   * a spreadsheet" for what to deploy and where these two values come from.
   *
   * commentsSyncUrl    The deployed Web App's /exec URL. Leave blank and
   *                    the Save/Load-to-Sheet buttons just don't appear —
   *                    Download JSON / Import Comments keep working either
   *                    way, so this is purely additive.
   * commentsSyncToken  A shared secret the script checks before it'll read
   *                    or write anything — must match the SYNC_TOKEN
   *                    Script Property set on the Apps Script project.
   *                    Like driveApiKey above, this ships in public
   *                    client-side source, so treat it as a spam deterrent
   *                    (keeps a stray bot that finds the URL from writing
   *                    junk into the sheet), not real access control —
   *                    don't reuse a password-strength secret here.
   */
  commentsSyncUrl: "https://script.google.com/macros/s/AKfycbyRq9ZTvBxwPQVbW3VgQxI4Nhq1VqhAd47-atXRipwF3jv1l4WZZazXZ5HDtUJBZL2N/exec",
  commentsSyncToken: "wMd8d08FxQV1OZSNiyjMg5Zhmt1m06SU"
};

/* True while config still carries the shipped placeholder — the pages use this
 * to show the setup notice and fall back to the demo project instead of
 * pretending Drive is wired up. */
window.SITE.isUnconfigured = function () {
  return !window.SITE.driveFolderId ||
    window.SITE.driveFolderId.indexOf("PASTE_") === 0;
};
