# Clearview Deck — Concept Studies

Client concept-deck site for The Brown Studio, built from `CLEARVIEW_DECK_2026-04-30_CONCEPTS.pdf`
(7 pergola/pool-terrace directions: V5, V5.2, V5.2b, V5.3, V5.4, V5.5, V5.6).

Static site, no build step — open `index.html` directly or serve the folder.

## Structure

```
clearview-deck/
  index.html              All markup/sections (hero, overview, versions, download, contact)
  assets/
    css/style.css         Theme tokens at :root, then component styles
    js/
      project-data.js     ← the only file most edits touch (see below)
      main.js             Generic renderer: reads project-data.js, builds the DOM
    images/                6 renderings per version (aerial/wide/detail-a/detail-b/side-a/side-b)
    downloads/             Downloadable concept-deck PDF
```

## Reusing this template for a new project

1. Duplicate this whole folder (e.g. `cp -r clearview-deck new-project-slug`).
2. Drop new renderings into `assets/images/` and a new PDF into `assets/downloads/`.
3. Edit `assets/js/project-data.js` only:
   - `studio` — firm name/tagline/email (leave as-is if same firm).
   - `name`, `subtitle`, `client`, `location`, `scope`, `status`, `summary`.
   - `heroVideoId` — a YouTube ID for the looping background reel. Leave `""` to fall
     back to `heroImage` as a static (subtly animated) hero background.
   - `pdfDownloadUrl` — local path by default; swap for a Google Drive direct-download
     link once uploaded: `https://drive.google.com/uc?export=download&id=FILE_ID`.
   - `driveFolderUrl` — link to the full-resolution renderings archive.
   - `versions[]` — one object per concept direction (`id`, `label`, `hero`, `detail`, `note`).
4. Optionally retune the palette in `assets/css/style.css` under `:root` (`--color-*`).

Everything else — nav, hero, overview stats, the version grid, the compare tool,
the lightbox and the download/contact sections — renders itself from that data.

## Notes on this build

- **Hero video**: no client reel was supplied, so `heroVideoId` is left empty and the
  hero falls back to the `heroImage` rendering. Paste a YouTube video ID into
  `project-data.js` to switch on the looping video reel — no other changes needed.
- **Images**: hosted locally in `assets/images/` (extracted from the concept PDF at
  print quality) so the site works immediately with no external dependency. A Google
  Drive folder was created for the full-resolution archive/handoff — see
  `driveFolderUrl` in `project-data.js`.
- **Download PDF**: `assets/downloads/Clearview-Deck-Concept-Studies.pdf` is a
  web-sized rebuild of the concept deck (~1.3 MB) so the download button works out of
  the box. Swap in the original full-resolution PDF, or a Drive link, at any time via
  `pdfDownloadUrl`.
