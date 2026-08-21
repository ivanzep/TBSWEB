# Clearview Deck — Concept Studies

Client concept-deck site for The Brown Studio, built from `CLEARVIEW_DECK_2026-04-30_CONCEPTS.pdf`
(7 pergola/pool-terrace directions: V5, V5.2, V5.2b, V5.3, V5.4, V5.5, V5.6).

Static site, no build step — open `index.html` directly or serve the folder.

## Structure

```
clearview-deck/
  index.html                    Homepage (hero, overview, versions grid, compare, download, contact)
  reference-images.html         Reference Images moodboard page — see below
  assets/
    css/style.css                Theme tokens at :root, then component styles
    js/
      project-data.js            Site-level data (studio, hero reel, PDF/Drive links) — see below
      common.js                  Shared header/nav/scroll/reveal/modal helpers, used by every page
      youtube-url.js             Turns any YouTube link into a bare video/playlist ID
      version-loader.js          Loads an index script + each item's data.js as <script> tags
                                  (used for both versions/ and reference/ — same collection shape)
      main.js                    Homepage renderer
      version-page.js            Renderer for every versions/<id>/index.html subpage
      reference-page.js          Renderer for reference-images.html
    downloads/                   Downloadable concept-deck PDF
  scripts/
    generate-version-data.js     ← SCAN TOOL for versions/ — run after touching any assets/ folder
    generate-reference-data.js   ← SCAN TOOL for reference/ — same idea, for reference sections
    scan.sh                      Thin wrapper: `./scripts/scan.sh` runs both of the above
    lib/
      read-image-title.js        Dependency-free JPEG Title-metadata reader
      scan-common.js             Shared scan utilities (natural sort, humanize, etc.) both
                                  generator scripts use, so the logic isn't duplicated
  versions/
    versions-index.js            AUTO-GENERATED — do not hand-edit
    _template/                   Starter folder — copy this to add a new version
      meta.json                  Hand-authored: { "label": "...", "note": "..." }
      index.html                 Generic subpage shell (identical for every version, no per-version edits)
      assets/                    Empty — drop that version's images/videos here
    v5/                          One real folder per concept direction
      meta.json                  Hand-authored label/note
      data.js                    AUTO-GENERATED — do not hand-edit
      index.html                 (copy of _template/index.html)
      assets/                    Renderings — whatever's in here becomes the gallery
    v5-2/, v5-2b/, v5-3/, v5-4/, v5-5/, v5-6/    Same pattern
  reference/
    sections-index.js            AUTO-GENERATED — do not hand-edit
    _template/                   Starter folder — copy this to add a new reference section
      meta.json                  Hand-authored: { "title": "...", "note": "" }
      assets/                    Empty — drop that section's images here
    (no real sections yet — see "Reference Images" below)
```

Each design version lives entirely in its own folder — its content, its own subpage
(`index.html`), and its own assets, all together. The homepage grid links each card
straight to that version's subpage, which shows a full image gallery (with a lightbox)
and, if provided, a video gallery — plus prev/next navigation between versions.

## The scan tool

`versions/<id>/data.js`, `versions/versions-index.js`, and their `reference/` equivalents
are **generated files** — never edit them by hand, edits get overwritten. Instead, run the
scan tool whenever you add, remove, or rename a file in any `assets/` folder under
`versions/` or `reference/`, or add/remove a whole version/section folder:

```
./scripts/scan.sh
```

That runs both `node scripts/generate-version-data.js` and
`node scripts/generate-reference-data.js` — run either individually if you only need one.
The versions scanner walks `versions/`, and for every subfolder (except `_template`) it:

- Rebuilds `versions-index.js` from whatever version folders exist — natural-sorted by
  folder name, which is the display order everywhere. Add a folder, it's on the homepage
  after the next scan; delete a folder, it drops off.
- Rebuilds that version's `images[]` from whatever image files (`.jpg/.jpeg/.png/.webp/.gif`)
  are in its `assets/` folder — any number, in natural-sorted order. Caption comes from
  the image's embedded **Title metadata** if it has any (checks XMP `dc:title`, IPTC
  Object Name, then EXIF XPTitle/ImageDescription — i.e. whatever Photoshop, Bridge,
  Lightroom or `exiftool` write when you set a file's "Title"), otherwise a humanized
  version of the filename (`pool-terrace.jpg` → "Pool Terrace"). None of the current
  renders carry title metadata, so today every caption is filename-derived — embed a
  Title on a file whenever you want a caption that doesn't have to match the filename.
- Picks the thumbnail: a file named `thumb.*`/`cover.*` if present, else the first image
  in sorted order (name files starting with e.g. `01-` if you want a specific one first).
- Rebuilds `videos[]` from any video files (`.mp4/.webm/.mov/.m4v`) in the same `assets/`
  folder (poster = a same-basename image if one exists, else the version's thumbnail).
  For videos that aren't local files (YouTube), add them in an optional
  `versions/<id>/videos.json`:
  `[{ "type": "youtube", "url": "<paste any youtube.com/youtu.be link>", "caption": "..." }]`
  — the scan merges these in alongside the discovered local files. `url` accepts a full
  link in any form (watch, `youtu.be`, shorts, embed, with or without extra tracking
  params) or an already-bare video ID; either way the scan resolves it to a clean ID
  before writing `data.js`, so the browser never parses a URL at runtime.

  **Don't want to hand-write that JSON?** Open `tools/add-videos.html` directly in a
  browser (no server needed). Pick the version, paste links, and it builds the file for
  you — with a live thumbnail preview per link, and either a one-click save straight into
  the version's folder (Chrome/Edge, via a native folder picker) or a copy/download for
  pasting into GitHub's web UI. It's a standalone page, not part of the published site.

The reference-sections scanner works the same way but simpler — no thumb, hero video,
local-video, or `videos.json` concepts, just a folder of images and a title. See
"Reference Images" further down.

The one thing that has no natural source in a folder of images is narrative copy, so
`versions/<id>/meta.json` (`{ "label": "...", "note": "..." }`) stays hand-authored — it's
the only file you ever type into by hand for an existing version.

`meta.json` can also carry a looping video for that version's own title-header banner
(the section at the top of its subpage) — same three fields, same priority, and same
link-or-bare-ID handling as the homepage hero below: `heroPlaylistId`, `heroVideoIds`
(array), `heroVideoId`. Leave all three empty/absent to keep the static thumbnail
background. Built with `tools/add-videos.html`'s "Version Title Header" tab, same as
the homepage hero and the gallery videos above.

**Why a scan step exists at all**, rather than the browser just reading the folder live:
a static site with no server and no build step has no way to list a folder's contents or
read a file's metadata at page-load time — `fetch()` of local files is CORS-blocked when
the site is opened via `file://`, and there's no directory-listing API in the browser at
all. Node can do both, so the scan step is what turns "drop files in a folder" into the
plain generated JS the actual site loads. It's not a build step you need before every
deploy (the generated files are committed, plain, and load instantly like everything
else) — just something to re-run after you change what's in an `assets/` folder.

**You don't have to run it yourself.** `.github/workflows/scan-clearview-deck.yml` runs
both scan scripts automatically on every push that touches an `assets/` folder or a
`meta.json` under `clearview-deck/versions/` or `clearview-deck/reference/`, or a
`videos.json` under `versions/` — including files added straight through GitHub's web
"Upload files" button, which is a real push/commit like any other and fires this the same
way. If either scan produces a different result, the workflow commits the regenerated
files back to the same branch itself, so `./scripts/scan.sh` is only needed for previewing
the result locally before you push, not as a required manual step. Two things worth
knowing:
- It commits straight to the branch it ran on — if that branch has protection rules
  blocking direct pushes (required reviews, etc.), the workflow's push step will fail;
  either exempt `github-actions[bot]`, or run the scan locally and commit yourself.
- It watches inputs only (`assets/**`, `meta.json`, `versions/*/videos.json`, `scripts/**`)
  and never the generated outputs, specifically so its own commit can't retrigger itself.

## Adding a new design version

1. Copy `versions/_template/` to `versions/your-id/` (e.g. `versions/v6/`).
2. Edit `versions/your-id/meta.json` — set `label` and `note`.
3. Drop image/video files into `versions/your-id/assets/` — any names, any quantity.
4. Run `./scripts/scan.sh`.

That's it — no `data.js` to write, no line to add anywhere else; the scan discovers the
new folder and generates everything. `versions/your-id/index.html` needs **no edits**
either — it's a pure copy of the template; the page figures out which version it's
showing from its own folder name at runtime.

Removing a version: delete its folder, then run the scan tool.
Reordering: rename folders to change natural-sort order (e.g. `v5-2` before `v5-3`), then scan.

## Reference Images

`reference-images.html` is a standalone moodboard page, separate from the versions —
inspiration imagery organized into titled sections, each rendered as a genuine
Pinterest-style masonry: images keep their natural aspect ratio (nothing is cropped to
fit a grid cell), columns settle at uneven heights, and one consistent gap value holds
between every image both directions. That's plain CSS multi-column layout
(`column-count` + `break-inside: avoid`) — no masonry JS library. Click any image to
open it full-screen in a lightbox that flows through every image on the page in order,
across section boundaries.

It's driven by `reference/` the same way `versions/` drives the version subpages —
same scan-tool architecture, same rules:

1. Copy `reference/_template/` to `reference/your-id/` (e.g. `reference/materials/`).
2. Edit `reference/your-id/meta.json` — set `title` (required) and optionally `note`.
3. Drop image files into `reference/your-id/assets/` — any names, any quantity, any
   aspect ratio. Captions come from embedded Title metadata or a humanized filename,
   exactly like a design version's gallery images.
4. Run `./scripts/scan.sh` (or push — the CI workflow covers `reference/` too).

No real sections exist yet — the page currently renders an empty state. Add one and
it appears on `reference-images.html` automatically, in natural-sort order by folder
name, with no other file to touch and no edits to `reference-images.html` itself.

## Reusing this template for a new project

1. Duplicate this whole folder (e.g. `cp -r clearview-deck new-project-slug`).
2. Delete the `v5*` folders under `versions/`, keep `_template/`, and build new version
   folders per the steps above. Drop a new PDF into `assets/downloads/`.
3. Edit `assets/js/project-data.js`:
   - `studio` — firm name/tagline/email (leave as-is if same firm).
   - `name`, `subtitle`, `client`, `location`, `scope`, `status`, `summary`.
   - Hero reel — set **one** of, in priority order (each accepts a full YouTube link
     pasted straight from the address bar, or a bare ID — same as `videos.json` above):
     - `heroPlaylistId` — a YouTube playlist link/ID, loops the whole playlist.
     - `heroVideoIds` — an array of standalone video links/IDs; cycles through them in
       order, then loops back to the first.
     - `heroVideoId` — a single video link/ID, loops on itself.
     - Leave all three empty to fall back to `heroImage` as a static hero background.
   - `pdfDownloadUrl` — root-relative local path by default (e.g. `assets/downloads/foo.pdf`,
     no leading `./` — both the homepage and subpages prefix it correctly for their depth);
     swap for a Google Drive direct-download link once uploaded:
     `https://drive.google.com/uc?export=download&id=FILE_ID`.
   - `driveFolderUrl` — link to the full-resolution renderings archive.
4. Optionally retune the palette in `assets/css/style.css` under `:root` (`--color-*`).

Everything else — nav, hero, overview stats, the version grid + subpages, the compare
tool, the lightboxes and the download/contact sections — renders itself from that data.

## Notes on this build

- **Hero video**: `heroPlaylistId` is set to the client's YouTube playlist, so the hero
  loops that playlist continuously. Swap to `heroVideoIds`/`heroVideoId`, or clear all
  three to fall back to the static `heroImage`, at any time in `project-data.js`.
- **Images**: hosted locally, one folder per version under `versions/<id>/assets/`
  (extracted from the concept PDF at print quality) so the site works immediately with
  no external dependency, and discovered by the scan tool rather than listed by hand —
  see "The scan tool" above. A Google Drive folder was created for the full-resolution
  archive/handoff — see `driveFolderUrl` in `project-data.js`.
- **Videos**: no per-version walkthrough videos were supplied yet, so every version's
  `assets/` folder has no video files and each subpage's Video Gallery section stays
  hidden. Drop a video file into a version's `assets/` folder (or add a YouTube entry to
  its `videos.json`) and re-run the scan tool to switch it on for that version.
- **Download PDF**: `assets/downloads/Clearview-Deck-Concept-Studies.pdf` is a
  web-sized rebuild of the concept deck (~1.3 MB) so the download button works out of
  the box. Swap in the original full-resolution PDF, or a Drive link, at any time via
  `pdfDownloadUrl`.
