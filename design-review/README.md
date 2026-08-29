# Design Review

A client-facing review portal for The Brown Studio, listing every project on
one landing page. Each project points at its own Google Drive folder and gets
the full review experience on its own: renderings open in a full-screen
carousel, PDF drawings open in an embedded viewer, and anything in either can
be marked up and commented on — independently of every other project's.

Static site, no build step — open `index.html` directly or serve the folder.
Theme tokens match `/clearview-deck` and `/clearview-patio-deck`, so the three
sites read as one family.

## How the site is organized

Everything hangs off one Drive hierarchy:

```
Master folder (config.js → driveFolderId)
  Project A/                 → a project
    Design Development/      → a review set
      A1.0 Site Plan.pdf     → an item
    Schematic Design/
      ...
  Project B/
    ...
```

The landing page lists live subfolders of the master folder as projects.
Clicking one goes to that project's own page — the review-sets grid, drive
link, etc. — which in turn lists live subfolders of *that* project's folder as
review sets, exactly the way a single-project version of this site already
worked. Add a project by adding a subfolder to Drive; no code change, no new
files to create.

Four page **templates** serve every project — there's no per-project copy of
`package.html` etc. — a `?proj=<slug>` query param says which project a page
is scoped to (`project.html` uses `?p=<slug>` instead, since the project *is*
the page's whole subject there). Internal links carry this automatically.

## Structure

```
design-review/
  index.html            Landing page — lists every project
  project.html           One project (?p=<slug>) — overview + review sets grid
  package.html            One review set (?proj=<slug>&p=<setSlug>) — item grid + viewer
  all-files.html            Every item in one project, one grid, sortable + filterable
  review-log.html            Every comment in one project, with export/import
  assets/
    css/style.css        Theme tokens at :root, then components
    img/logo.png         Studio mark (shared with the sibling sites)
    js/
      config.js          ← START HERE. Studio branding + the master Drive folder
      projects.js        ← The project list, when not auto-discovering from Drive
      packages.js        ← Review sets for any project without a live Drive folder
      drive.js           Drive URL builders + the two levels of live listing
      store.js           Comments and markups (localStorage), namespaced per project
      common.js          Shared header/nav/scroll/reveal/modal + helpers
      viewer.js          The carousel, the PDF viewer and the markup pins
      landing.js         Landing-page renderer
      project-page.js    Project-page renderer
      package-page.js    Review-set page renderer
      all-files.js       All Files page renderer — flattens every set, sorts/filters
      review-log.js      Review log renderer + export/import
```

## Setting it up

### 1. Share the Drive tree

Right-click the master folder → **Share** → **General access** →
**Anyone with the link** → **Viewer**. That covers everything under it unless
a subfolder overrides it. Anything not link-shared can't be listed or
embedded; the site shows a "couldn't load — check sharing" placeholder rather
than failing silently, but it still won't be visible to a client — so if a
whole project or set seems to be missing, sharing is the first thing to check.

### 2. Point the site at the master folder

In `assets/js/config.js`:

- `driveFolderId` — the master folder's ID, from its URL:
  `https://drive.google.com/drive/folders/1AbC...XyZ` → `1AbC...XyZ`.
- `driveApiKey` — required to discover projects live; there's no manifest
  fallback for "what projects exist" the way there is for a project's own
  review sets. Get one: console.cloud.google.com → enable the **Google Drive
  API** → Credentials → **API key**. Restrict it — Application restrictions →
  Websites → this site's domain; API restrictions → Drive API only. The key is
  visible in client-side source, as any browser key is; that's what the
  restriction is for.

Until both are set, the landing page falls back to the single demo project in
`projects.js` and shows an on-screen setup notice.

### 3. Add a project

Nothing to do beyond adding a subfolder to the master Drive folder, named
whatever the project should be called. It appears on the landing page on the
next load. Inside it, one subfolder per review set (Design Development,
Schematic Design, whatever fits) — same pattern as any single-project version
of this site already used.

Want richer project metadata than a bare folder name gives you (client,
location, scope, a summary paragraph)? Add an entry to `window.PROJECTS` in
`assets/js/projects.js` whose `slug` matches the folder's name, slugified
(lowercased, non-alphanumerics → `-`) — see the comment at the top of that
file. It applies as an override on top of the live-discovered folder; it
doesn't replace live discovery.

### The demo project

`projects.js` ships with one entry ("Clearview Deck") that has its own
`driveFolderId` — the project shows up on the landing page from the manifest
(since there's no master folder configured yet) but goes live for its *own*
review sets once you also set `driveApiKey`, the same way a live-discovered
project would. If you clear that `driveFolderId` too, it falls back further,
to the local review-set manifest in `packages.js` — so the site is never
blank at any stage of wiring it up.

## Reviewing

- **All Files** — every item in the current project in one grid. Filter by
  type (image/PDF), by set, or to items with comments; sort by name, sheet
  number, type, comment count, or (in live folder mode) recently modified;
  search by name/sheet/set. Opens the same carousel/PDF viewer as a single
  set, except arrowing through it crosses set boundaries instead of stopping
  at one set's edge — whatever's on screen after filtering is what the viewer
  pages through.
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

**In the reviewer's own browser (localStorage), not on a server**, and
**namespaced per project** — a comment made on one project never shows up on
another, even in the same browser, even though every project shares the same
four page templates. This is a static site — there's no backend to sync to —
so:

- Comments are private to that person, that browser, and that project.
- Clearing site data deletes them. The **Clear All** button warns before
  wiping, and only wipes the project you're currently on.
- They travel by export, not automatically.

On a project's **Review Log** page:

- **Copy for Email** — a plain-text roll-up of that project's comments,
  grouped by set and sheet, ready to paste into an email.
- **Download JSON** — that project's full review file.
- **Import Comments** — reads a JSON export back in, into the *current*
  project. It *merges* rather than replaces, de-duplicating by comment id, so
  two reviewers' files can be combined into one master set without either
  overwriting the other.

Each log row links back to the exact item the comment is on, inside its
project.

If comments ever need to be shared live instead of exported, that needs a
backend (or Drive's own commenting) — the **Open original** link in the viewer
goes straight to the file in Drive, where Drive's native comments work
normally.

## Adding a review set by hand

`window.PACKAGES` in `assets/js/packages.js` is keyed by project slug, since
more than one project can be manifest-only at once. Add a set under the
matching key (create the key if the project doesn't have one yet):

```js
window.PACKAGES = {
  "clearview-deck": [ /* ... */ ],

  "some-other-project": [
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
  ]
};
```

`type` is `"pdf"`, `"image"`, or `"video"` — inferred from the MIME type or
extension when omitted. A `"video"` item opens in the same embedded viewer a
PDF does (Drive's file preview plays video natively there). Order within a
project's array is the order shown on the site. This manifest only applies to
a project with no `driveFolderId` of its own — a live-discovered project's
review sets come from its Drive subfolders instead, with no manifest involved.

## Notes

- `packages.js` points at renderings already in this repo so the demo project
  is viewable before any Drive wiring exists.
- Drive's thumbnail endpoint renders PDFs too, so Drive-hosted sheets get a
  real page-one preview on their cards and in the Review Log. Local PDFs
  can't, and show a placeholder.
- A project card with no `thumbnail` set and no live cover image shows a
  plain "No preview" placeholder rather than guessing at one from its review
  sets — set `thumbnail` on the `projects.js` entry to give it a real cover.
