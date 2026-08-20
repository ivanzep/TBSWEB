# Clearview Deck — Concept Studies

Client concept-deck site for The Brown Studio, built from `CLEARVIEW_DECK_2026-04-30_CONCEPTS.pdf`
(7 pergola/pool-terrace directions: V5, V5.2, V5.2b, V5.3, V5.4, V5.5, V5.6).

Static site, no build step — open `index.html` directly or serve the folder.

## Structure

```
clearview-deck/
  index.html                    Homepage (hero, overview, versions grid, compare, download, contact)
  assets/
    css/style.css                Theme tokens at :root, then component styles
    js/
      project-data.js            Site-level data (studio, hero reel, PDF/Drive links) — see below
      common.js                  Shared header/nav/scroll/reveal/modal helpers, used by every page
      version-loader.js          Loads versions-index.js + each version's data.js as <script> tags
      main.js                    Homepage renderer
      version-page.js            Renderer for every versions/<id>/index.html subpage
    downloads/                   Downloadable concept-deck PDF
  versions/
    versions-index.js            ← registry: which version folders exist and in what order
    _template/                   Starter folder — copy this to add a new version
      data.js                    Template: id, label, note, thumb, images[], videos[]
      index.html                 Generic subpage shell (identical for every version, no per-version edits)
      assets/                    Empty — drop that version's images/videos here
    v5/                          One real folder per concept direction
      data.js
      index.html                 (copy of _template/index.html)
      assets/                    6 renderings (aerial/wide/detail-a/detail-b/side-a/side-b)
    v5-2/, v5-2b/, v5-3/, v5-4/, v5-5/, v5-6/    Same pattern
```

Each design version now lives entirely in its own folder — its content (`data.js`), its
own subpage (`index.html`), and its own assets, all together. The homepage grid links
each card straight to that version's subpage, which shows a full image gallery (with a
lightbox) and, if provided, a video gallery — plus prev/next navigation between versions.

## Adding a new design version

1. Copy `versions/_template/` to `versions/your-id/` (e.g. `versions/v6/`).
2. Edit `versions/your-id/data.js` — set `id`, `label`, `note`, `thumb`, and the `images[]`
   list (each `{ src, caption }`, paths relative to that folder — just `assets/whatever.jpg`).
   Add `videos[]` too if you have any (YouTube: `{ type: "youtube", youtubeId, caption }`;
   local file: `{ type: "file", src, poster, caption }`) — omit or leave empty otherwise.
3. Drop the image/video files into `versions/your-id/assets/`.
4. Add `"your-id"` to the array in `versions/versions-index.js`.

`versions/your-id/index.html` needs **no edits** — it's a pure copy of the template; the
page figures out which version it's showing from its own folder name at runtime. Step 4
is the only "central" touch — a static site with no build step and no server-side
directory listing needs the homepage to be told what versions exist somehow, and this is
the smallest way to do that (one line, versus touching a big shared data file).

Removing a version: delete its folder and its line in `versions-index.js`.
Reordering: reorder the lines in `versions-index.js` — that's the display order everywhere.

## Reusing this template for a new project

1. Duplicate this whole folder (e.g. `cp -r clearview-deck new-project-slug`).
2. Delete the `v5*` folders under `versions/`, keep `_template/`, and build new version
   folders per the steps above. Drop a new PDF into `assets/downloads/`.
3. Edit `assets/js/project-data.js`:
   - `studio` — firm name/tagline/email (leave as-is if same firm).
   - `name`, `subtitle`, `client`, `location`, `scope`, `status`, `summary`.
   - Hero reel — set **one** of, in priority order:
     - `heroPlaylistId` — an actual YouTube playlist ID, loops the whole playlist.
     - `heroVideoIds` — an array of standalone video IDs; cycles through them in
       order, then loops back to the first.
     - `heroVideoId` — a single video ID, loops on itself.
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
  no external dependency. A Google Drive folder was created for the full-resolution
  archive/handoff — see `driveFolderUrl` in `project-data.js`.
- **Videos**: no per-version walkthrough videos were supplied yet, so every version's
  `videos: []` is empty and each subpage's Video Gallery section stays hidden. Fill in
  a version's `data.js` `videos[]` array to switch it on for that version.
- **Download PDF**: `assets/downloads/Clearview-Deck-Concept-Studies.pdf` is a
  web-sized rebuild of the concept deck (~1.3 MB) so the download button works out of
  the box. Swap in the original full-resolution PDF, or a Drive link, at any time via
  `pdfDownloadUrl`.
