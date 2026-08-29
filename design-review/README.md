# Design Review

A client-facing review portal for The Brown Studio. It points at one Google Drive
folder and turns it into a reviewable set: renderings open in a full-screen
carousel, PDF drawings open in an embedded viewer, and anything in either can be
marked up and commented on.

Static site, no build step — open `index.html` directly or serve the folder.
Theme tokens match `/clearview-deck` and `/clearview-patio-deck`, so the three
sites read as one family.

## Structure

```
design-review/
  index.html            Homepage — hero, overview, review sets
  package.html          One review set (?p=<slug>) — item grid + the viewer overlay
  all-files.html        Every item from every set in one grid, sortable + filterable
  review-log.html       Every comment in one list, with export/import
  assets/
    css/style.css        Theme tokens at :root, then components
    img/logo.png         Studio mark (shared with the sibling sites)
    js/
      config.js          ← START HERE. Studio, project, Drive folder
      packages.js        ← The review sets, when not using live folder mode
      drive.js           Drive URL builders + the optional live folder listing
      store.js           Comments and markups (localStorage)
      common.js          Shared header/nav/scroll/reveal/modal + helpers
      viewer.js          The carousel, the PDF viewer and the markup pins
      home.js            Homepage renderer
      package-page.js    Review-set page renderer
      all-files.js       All Files page renderer — flattens every set, sorts/filters
      review-log.js      Review log renderer + export/import
```

## Setting it up for a project

### 1. Share the Drive folder

In Drive: open the project folder → **Share** → **General access** →
**Anyone with the link** → **Viewer**.

Files that aren't link-shared can't be embedded. The site shows a "couldn't
load — check sharing" placeholder for those rather than failing silently, so a
missed file is visible instead of invisible.

### 2. Point the site at it

In `assets/js/config.js`, set `driveFolderId` to the ID from the folder's URL —
for `https://drive.google.com/drive/folders/1AbC...XyZ` that's `1AbC...XyZ`.
Then fill in the `project` block (name, client, scope, phase, summary).

Until that ID is set, the site runs on the demo content in `packages.js` and
shows an on-screen setup notice.

### 3. Choose how files get listed

**Manifest mode (default).** List the sets and their files in
`assets/js/packages.js`. Nothing to expire, no keys, and the site shows exactly
what you put in front of the client. Each item takes either an `id` (a Drive
file ID — from the file's share link, the part between `/d/` and `/view`) or a
`src` (a local or absolute URL). A set can mix both.

**Live folder mode (optional).** Set `liveFolderMode: true` and supply a
`driveApiKey`, and the site lists the Drive folder at page load instead: every
subfolder becomes a review set, every file inside becomes an item, and dropping
a new sheet into Drive puts it on the site with no code change. Use this when
the folder changes often.

To get the key: console.cloud.google.com → enable the **Google Drive API** →
Credentials → **API key**. Then restrict it — Application restrictions →
Websites → the site's domain; API restrictions → Drive API only.

The key is visible in client-side source, as any browser key is; that's what
the restrictions are for. A restricted key can only read files that are already
shared "anyone with link". If the listing call fails for any reason the site
falls back to `packages.js`, so it never comes up empty.

## Reviewing

- **All Files** — every item from every review set in one grid. Filter by type
  (image/PDF), by set, or to items with comments; sort by name, sheet number,
  type, comment count, or (in live folder mode) recently modified; search by
  name/sheet/set. Opens the same carousel/PDF viewer as a single set, except
  arrowing through it crosses set boundaries instead of stopping at one set's
  edge — whatever's on screen after filtering is what the viewer pages through.
- **Carousel** — click any item, or **Open Carousel**. Arrow keys or the
  filmstrip move through the set; the filmstrip dot shows whether the item has
  open comments, all-resolved comments, or none. Scroll to zoom, drag to pan,
  swipe on touch.
- **PDF sheets** — open in Drive's embedded viewer with its own page navigation.
  Comments on a sheet can carry a page number.
- **Markups** — on an image, **Add Markup** (or `M`), then click the spot. A
  numbered pin drops and the comment attaches to it. Pins are stored as
  fractions of the image, so they land on the same detail at any screen size,
  and they zoom and pan with the drawing.
- **Comment counts** — each item card and filmstrip thumbnail shows whether it
  has open comments (a dot or count), so it's obvious at a glance what still
  needs a look.

Keyboard: `←` `→` move, `M` markup, `+` `−` zoom, `0` reset, `Esc` close,
`Ctrl/Cmd+Enter` posts a comment.

## Where comments live

**In the reviewer's own browser (localStorage), not on a server.** This is a
static site — there's no backend to sync to. So:

- Comments are private to that person and that browser.
- Clearing site data deletes them. The **Clear All** button warns before wiping.
- They travel by export, not automatically.

On the **Review Log** page:

- **Copy for Email** — a plain-text roll-up of every comment, grouped by set and
  sheet, ready to paste into an email.
- **Download JSON** — the full review file.
- **Import Comments** — reads a JSON export back in. It *merges* rather than
  replaces, de-duplicating by comment id, so two reviewers' files can be
  combined into one master set without either overwriting the other.

Each log row links back to the exact item the comment is on.

If comments ever need to be shared live instead of exported, that needs a
backend (or Drive's own commenting) — the **Open original** link in the viewer
goes straight to the file in Drive, where Drive's native comments work normally.

## Adding a review set by hand

Add an entry to `window.PACKAGES` in `assets/js/packages.js`:

```js
{
  slug: "cd-set",                      // used in the URL: package.html?p=cd-set
  title: "Construction Documents",
  issued: "2026-10-02",                // optional
  note: "Permit set.",                 // optional
  driveFolderId: "1AbC...",            // optional — "Open in Drive" for this set
  items: [
    { id: "1XyZ...", name: "A1.0 — Site Plan", type: "pdf", sheet: "A1.0" },
    { id: "1QrS...", name: "Pool Terrace — Dusk" }
  ]
}
```

`type` is inferred from the MIME type or extension when omitted. Order in the
array is the order on the site.

## Notes

- The demo `packages.js` points at renderings already in this repo so the site
  is viewable before any Drive wiring exists. Replace those entries with real
  Drive files (or switch on live folder mode) when standing up a project.
- Drive's thumbnail endpoint renders PDFs too, so Drive-hosted sheets get a real
  page-one preview on their cards and in the Review Log. Local PDFs can't, and
  show a placeholder.
