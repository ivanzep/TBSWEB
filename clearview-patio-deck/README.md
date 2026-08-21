# Clearview Deck — Patio Deck (DV5.5-1)

Client showcase site for The Brown Studio, built from
`CLEARVIEW_DECK-20260820-DV5.5-1-PATIO_DECK.pdf` — the design-development drawing set
(dimensioned plan, two building sections, and a 3D massing study) for the pool deck,
developed from Concept Version 5.5 of the `clearview-deck` concept-studies site — paired
with the full rendering set and walkthrough videos for that same design.

Duplicated from the `clearview-deck` template, then trimmed down: this single-version
site has no Overview, Compare, or Reference Images sections (see "Differences from the
`clearview-deck` template" below). See that project's README for the full scan-tool
architecture this site still shares.

Static site, no build step — open `index.html` directly or serve the folder.

## Structure

```
clearview-patio-deck/
  index.html                    Homepage (hero, versions grid, download, contact)
  assets/
    css/style.css                Theme tokens at :root, then component styles
    js/
      project-data.js            Site-level data (studio, hero reel, PDF link) — see below
      common.js                  Shared header/nav/scroll/reveal/modal helpers, used by every page
      youtube-url.js             Turns any YouTube link into a bare video/playlist ID
      version-loader.js          Loads an index script + each version's data.js as <script> tags
      main.js                    Homepage renderer
      version-page.js            Renderer for every versions/<id>/index.html subpage
    downloads/                   Downloadable DV5.5-1 drawing-set PDF
  scripts/
    generate-version-data.js     ← SCAN TOOL for versions/ — run after touching any assets/ folder
    scan.sh                      Thin wrapper: `./scripts/scan.sh` runs the scan tool
    lib/
      read-image-title.js        Dependency-free JPEG Title-metadata reader
      scan-common.js             Shared scan utilities (natural sort, humanize, etc.)
  versions/
    versions-index.js            AUTO-GENERATED — do not hand-edit
    _template/                   Starter folder — copy this to add another version
      meta.json                  Hand-authored: { "label": "...", "note": "..." }
      index.html                 Generic subpage shell (identical for every version, no per-version edits)
      assets/                    Empty — drop that version's images/videos here
    dv5-5-1/                     The only version so far — DV5.5-1 drawing set + renderings
      meta.json                  Hand-authored label/note/hero
      data.js                    AUTO-GENERATED — do not hand-edit
      index.html                 (copy of _template/index.html)
      videos.json                Hand-authored YouTube walkthrough links
      assets/                    Drawing-sheet crops + AI renderings — whatever's in here becomes the gallery
```

Each design version lives entirely in its own folder — its content, its own subpage
(`index.html`), and its own assets, all together. The homepage grid links each card
straight to that version's subpage, which shows a full image gallery (with a lightbox)
and, if provided, a video gallery — plus prev/next navigation between versions (a no-op
today with only one version).

## The scan tool

`versions/<id>/data.js` and `versions/versions-index.js` are **generated files** — never
edit them by hand, edits get overwritten. Instead, run the scan tool whenever you add,
remove, or rename a file in any `assets/` folder under `versions/`, or add/remove a
whole version folder:

```
./scripts/scan.sh
```

That runs `node scripts/generate-version-data.js`. It walks `versions/`, and for every
subfolder (except `_template`) it:

- Rebuilds `versions-index.js` from whatever version folders exist — natural-sorted by
  folder name, which is the display order everywhere. Add a folder, it's on the homepage
  after the next scan; delete a folder, it drops off.
- Rebuilds that version's `images[]` from whatever image files (`.jpg/.jpeg/.png/.webp/.gif`)
  are in its `assets/` folder — any number, in natural-sorted order. Caption comes from
  the image's embedded **Title metadata** if it has any (checks XMP `dc:title`, IPTC
  Object Name, then EXIF XPTitle/ImageDescription), otherwise a humanized version of the
  filename (`pool-terrace.jpg` → "Pool Terrace"). None of the current images carry title
  metadata, so every caption today is filename-derived — hence the numbered, hyphenated
  filenames in `versions/dv5-5-1/assets/`, chosen to read well once humanized.
- Picks the thumbnail: a file named `thumb.*`/`cover.*` if present, else the first image
  in sorted order (name files starting with e.g. `01-` if you want a specific one first).
- Rebuilds `videos[]` from any video files (`.mp4/.webm/.mov/.m4v`) in the same `assets/`
  folder (poster = a same-basename image if one exists, else the version's thumbnail).
  For videos that aren't local files (YouTube), add them in an optional
  `versions/<id>/videos.json`:
  `[{ "type": "youtube", "url": "<paste any youtube.com/youtu.be link>", "caption": "..." }]`
  — the scan merges these in alongside any discovered local files. `url` accepts a full
  link in any form (watch, `youtu.be`, shorts, embed, with or without extra tracking
  params) or an already-bare video ID; either way the scan resolves it to a clean ID
  before writing `data.js`, so the browser never parses a URL at runtime.

  **Don't want to hand-write that JSON?** Open `tools/add-videos.html` directly in a
  browser (no server needed). Pick the version, paste links, and it builds the file for
  you — with a live thumbnail preview per link, and either a one-click save straight into
  the version's folder (Chrome/Edge, via a native folder picker) or a copy/download for
  pasting into GitHub's web UI. It's a standalone page, not part of the published site.

The one thing that has no natural source in a folder of images is narrative copy, so
`versions/<id>/meta.json` (`{ "label": "...", "note": "..." }`) stays hand-authored — it's
the only file you ever type into by hand for an existing version.

`meta.json` can also carry a looping video for that version's own title-header banner
(the section at the top of its subpage) — same three fields, same priority, and same
link-or-bare-ID handling as the homepage hero below: `heroPlaylistId`, `heroVideoIds`
(array), `heroVideoId`. Leave all three empty/absent to keep the static thumbnail
background. `versions/dv5-5-1/meta.json` sets `heroPlaylistId` to the same reel as the
site-level hero. Built with `tools/add-videos.html`'s "Version Title Header" tab, same as
the homepage hero and the gallery videos above.

**Why a scan step exists at all**, rather than the browser just reading the folder live:
a static site with no server and no build step has no way to list a folder's contents or
read a file's metadata at page-load time — `fetch()` of local files is CORS-blocked when
the site is opened via `file://`, and there's no directory-listing API in the browser at
all. Node can do both, so the scan step is what turns "drop files in a folder" into the
plain generated JS the actual site loads. It's not a build step you need before every
deploy (the generated files are committed, plain, and load instantly like everything
else) — just something to re-run after you change what's in an `assets/` folder.

**You don't have to run it yourself.** `.github/workflows/scan-clearview-patio-deck.yml`
runs the scan script automatically on every push that touches an `assets/` folder or a
`meta.json`/`videos.json` under `clearview-patio-deck/versions/` — including files added
straight through GitHub's web "Upload files" button, which is a real push/commit like any
other and fires this the same way. If the scan produces a different result, the workflow
commits the regenerated files back to the same branch itself, so `./scripts/scan.sh` is
only needed for previewing the result locally before you push, not as a required manual
step. Two things worth knowing:
- It commits straight to the branch it ran on — if that branch has protection rules
  blocking direct pushes (required reviews, etc.), the workflow's push step will fail;
  either exempt `github-actions[bot]`, or run the scan locally and commit yourself.
- It watches inputs only (`assets/**`, `meta.json`, `versions/*/videos.json`, `scripts/**`)
  and never the generated outputs, specifically so its own commit can't retrigger itself.

## Adding a new design version

1. Copy `versions/_template/` to `versions/your-id/` (e.g. `versions/dv5-6-1/`).
2. Edit `versions/your-id/meta.json` — set `label` and `note`.
3. Drop image/video files into `versions/your-id/assets/` — any names, any quantity.
4. Run `./scripts/scan.sh`.

That's it — no `data.js` to write, no line to add anywhere else; the scan discovers the
new folder and generates everything. `versions/your-id/index.html` needs **no edits**
either — it's a pure copy of the template; the page figures out which version it's
showing from its own folder name at runtime.

Removing a version: delete its folder, then run the scan tool.
Reordering: rename folders to change natural-sort order, then scan.

## Differences from the `clearview-deck` template

This site was trimmed down from the full `clearview-deck` template it was duplicated
from, since a single-version drawing-set showcase doesn't need everything that template
offers:
- **No Overview section** — the client/location/scope/status stat block and project
  summary paragraph are gone from the homepage; `renderStats()`/`overviewText` and the
  `#overview` section were removed from `main.js`/`index.html`.
- **No Compare tool** — comparing concept directions side-by-side only makes sense with
  multiple versions. The floating compare bar, compare modal, "Add to Compare" checkbox
  on each version card, and all supporting JS were removed from `main.js`/`index.html`.
- **No Reference Images page** — `reference-images.html`, `assets/js/reference-page.js`,
  the `reference/` folder, and `scripts/generate-reference-data.js` were all deleted;
  `scripts/scan.sh` and the CI workflow only run the versions scanner now.

If this site later grows more design versions and reference imagery, that scanner
architecture is exactly what `clearview-deck` still uses — copy `generate-reference-data.js`
and `reference-page.js`/`reference-images.html` back over from that project rather than
rebuilding them.

## Notes on this build

- **Source PDF**: `CLEARVIEW_DECK-20260820-DV5.5-1-PATIO_DECK.pdf` is a single 36"x24"
  drawing sheet (Brown Studio Inc., dated 08/18/26, printed 08/20/26) — a dimensioned
  site/deck plan, two 1/4"-scale building sections (`V5.5.Section.1`, `V5.5.Section.2`),
  and a 3D massing axonometric, all developed from Concept Version 5.5 of the
  `clearview-deck` site. There's only one drawing set so far, so `versions/` holds a
  single folder, `dv5-5-1` — the homepage version grid and per-version subpage still work
  the same way with one card.
- **Hero video**: `heroPlaylistId` is set to the *same* YouTube playlist as the
  `clearview-deck` concept-studies site, per the client's request to reuse it here — both
  the site-level hero (`project-data.js`) and the `dv5-5-1` version's own title-header
  banner (`versions/dv5-5-1/meta.json`). Swap to `heroVideoIds`/`heroVideoId`, or clear
  all three, at any time.
- **Images**: `versions/dv5-5-1/assets/` holds two sets. Five are the DV5.5-1 sheet
  itself, rasterized at 300dpi and cropped — the full sheet, the plan, each section, and
  the axonometric (`axonometric-massing-view.jpg`, `deck-and-pool-plan.jpg`,
  `full-drawing-sheet.jpg`, `section-1.jpg`, `section-2.jpg`). The other sixteen
  (`01-` through `16-`) are the AI-rendered walkthrough of the finished design — aerials,
  pool/pergola views, the dining terrace, the BBQ kitchen, and outdoor movie nights at
  the fire pit — carried over from the `clearview-deck` site's `vX` version and
  re-compressed for the web (~21MB → ~5MB combined). Numbered filenames put the
  renderings first in the gallery, ahead of the technical drawings, since the scan tool's
  natural sort is filename-driven. No Google Drive archive exists for this drawing set
  yet, so `driveFolderUrl` is left blank in `project-data.js` (the Drive button hides
  itself automatically when that field is empty).
- **Videos**: `versions/dv5-5-1/videos.json` lists six YouTube walkthroughs — Fire Pit,
  Sun Study, Projection Screen (×2), and Flythrough (×2) — also carried over from the
  `clearview-deck` site's `vX` version.
- **Download PDF**: `assets/downloads/Clearview-Deck-DV5.5-1-Patio-Deck.pdf` is the
  original PDF as supplied (~3.2 MB), so the download button works out of the box.
