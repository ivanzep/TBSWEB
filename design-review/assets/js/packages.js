/*
 * REVIEW PACKAGES — the folder structure the site presents.
 *
 * This is the hand-authored manifest used whenever a project has no live
 * Drive folder — see Drive.loadPackages() in drive.js. In the multi-project
 * site, that in practice means: the demo project in projects.js, and any
 * other project entry someone adds there without a driveFolderId of its own.
 * Each package is one review set — a drawing issue, a rendering batch, a
 * reference pack. Order here is the order shown on the site.
 *
 * ── An item ────────────────────────────────────────────────────────────────
 *   {
 *     id:    "1AbC...",              Google Drive file ID  (use this OR src)
 *     src:   "./assets/foo.jpg",     local/absolute URL instead of Drive
 *     name:  "A1.0 — Site Plan",     display name
 *     type:  "pdf" | "image",        omitted → inferred from name/extension
 *     sheet: "A1.0",                 optional sheet number, shown as a tag
 *     note:  "Revised stair"         optional one-line description
 *   }
 *
 * ══ TWO THINGS TO FIX WHEN YOU GET A MINUTE ═══════════════════════════════
 *
 * 1. THE NAMES. Every file below is called "Image 42"–"Image 45", which is
 *    what the exporter named them, not what they are. A client paging through
 *    "Image 43" learns nothing. Renaming is a one-string edit per line — the
 *    `name` is display text only, nothing keys off it:
 *
 *        { id: "1T2ocz3…", name: "Image 42" }
 *      →  { id: "1T2ocz3…", name: "Pool Terrace — Dusk", sheet: "R-01" }
 *
 *    Comments already made stay attached through a rename: they're filed under
 *    the Drive ID, not the name.
 *
 * 2. THE GROUPING. The 15 IDs supplied were numbered 42,43,44,45 / 42,43 /
 *    42 / 42,43,44,45 / 42,43,44,45 — the counter restarts five times, which
 *    almost certainly means five source folders or documents. That's the split
 *    used below, but it is an INFERENCE from the numbering, not something read
 *    off Drive. If the real grouping differs, move the lines between the
 *    `items` arrays — nothing else needs to change.
 *
 * Set titles are placeholders too. Rename `title` freely; `slug` is what
 * appears in the URL (package.html?p=set-1), so changing a slug breaks any
 * link already shared for that set.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * No PDFs are listed yet — all 15 files supplied were images. Drawing sets
 * drop in exactly the same way, with `type: "pdf"`:
 *
 *     { id: "1XyZ…", name: "A1.0 — Site Plan", type: "pdf", sheet: "A1.0" }
 *
 * ── Getting a Drive file ID ────────────────────────────────────────────────
 * Right-click the file in Drive → Share → Copy link:
 *   https://drive.google.com/file/d/1AbC...XyZ/view?usp=drivesdk
 * The ID is the part between /d/ and /view.
 *
 * ── Sharing ────────────────────────────────────────────────────────────────
 * Every file below must be shared "Anyone with the link → Viewer" or it can't
 * be embedded. Files that aren't show a "couldn't load — check sharing"
 * placeholder in the viewer rather than failing silently.
 */
window.PACKAGES = [
  {
    slug: "set-1",
    title: "Review Set 1",
    issued: "",
    note: "",
    driveFolderId: "",
    items: [
      { id: "1T2ocz3NUDHV64dBGm-X7C7AQ7aa3Nqu7", name: "Image 42", type: "image" },
      { id: "1LVjE89T7YGkTlokoYOIV6ARyGst4a73Q", name: "Image 43", type: "image" },
      { id: "1b13AtwsYNWU0PmIE5uPM-P5d61qHgcJC", name: "Image 44", type: "image" },
      { id: "1KBQ0Ptz5eRNH52jK8rrQ1pWj-wZ4yRs_", name: "Image 45", type: "image" }
    ]
  },

  {
    slug: "set-2",
    title: "Review Set 2",
    issued: "",
    note: "",
    driveFolderId: "",
    items: [
      { id: "1_M5l8174bDU5HDsCsNExfPosTCeIUz7o", name: "Image 42", type: "image" },
      { id: "1PexKIBM96T1oTW4H0tzAvVBmoFlS1Y-w", name: "Image 43", type: "image" }
    ]
  },

  {
    slug: "set-3",
    title: "Review Set 3",
    issued: "",
    note: "",
    driveFolderId: "",
    items: [
      { id: "1hN8ZWABhJVw4O1b89FUyiDFhMuALttGg", name: "Image 42", type: "image" }
    ]
  },

  {
    slug: "set-4",
    title: "Review Set 4",
    issued: "",
    note: "",
    driveFolderId: "",
    items: [
      { id: "1FszemPbhqBegTYyUk1i9S8B64EXMVvF1", name: "Image 42", type: "image" },
      { id: "18wHaWWnWRIa3912DS-a1Y1OEWNGB8n5K", name: "Image 43", type: "image" },
      { id: "1iXRWBupSvdQXZdj1JR9gWd2MAHdFWbEH", name: "Image 44", type: "image" },
      { id: "1nd4D2rtX3r9roqcp1E4EuVpLqKngqBOk", name: "Image 45", type: "image" }
    ]
  },

  {
    slug: "set-5",
    title: "Review Set 5",
    issued: "",
    note: "",
    driveFolderId: "",
    items: [
      { id: "11Uxqmv6hEIvZydLekHh3OqRj2ysUaLzs", name: "Image 42", type: "image" },
      { id: "1ZWKzSzYR2bp5rqKVs8tKd6TRDQ4uCEI5", name: "Image 43", type: "image" },
      { id: "1qdz0pH1KoYUMOb6Xvvdndd7fV8kMV_Ib", name: "Image 44", type: "image" },
      { id: "10IQElsYiBFUeeLNMugyxftWzLcPQanaK", name: "Image 45", type: "image" }
    ]
  }
];
