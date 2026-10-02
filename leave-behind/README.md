# Leave Behind — Company Profiles

Static, no-build website presenting the Oct 2026 *TBS Company Profiles* PDF
([Drive source](https://drive.google.com/file/d/1ipsi488adMkMMAuCi283b-b8V0k-tfMS/view)).
Open `index.html` directly or serve the folder (`python3 -m http.server`).

## Structure

```
leave-behind/
  index.html              Sections: Company, Team, Design Studio, Construction, Foundry, Retail, Projects, Contact
  assets/css/style.css    Theme tokens at :root, then components
  assets/js/projects-data.js   Project dataset + North County list (edit text here)
  assets/js/common.js     Header, mobile nav, scroll progress, scrollspy, reveal-on-scroll, count-up, parallax
  assets/js/main.js       Featured carousel, filterable grid, project modal, image detection
  assets/img/             logo.png + project images (below)
```

## Images

Images were extracted from the compressed company-profiles PDF (`pdfimages -j -p`) and mapped to projects by page.
Location maps (North County, Tahoe) are cropped from PDF page 8–9 into `assets/img/maps/`; Grays Crossing, 260 Broadway, Palisades and Santa Fe include site plans cropped from their pages. Section photos live in `assets/img/sections/`.

## Adding or replacing images

Images are detected automatically by filename — no code changes needed. Projects without
images show a placeholder tile.

| File | Used for |
| --- | --- |
| `assets/img/hero.jpg` | Home hero background |
| `assets/img/team/lindsay-brown.jpg`, `rory-brown.jpg` | Team portraits |
| `assets/img/<slug>/cover.jpg` | Project card + first modal slide |
| `assets/img/<slug>/01.jpg … 12.jpg` | Extra modal gallery slides (contiguous numbering) |

`<slug>` values are the `slug` fields in `projects-data.js` (e.g. `four-seasons-aspen`, `palisades`, `la-costa-hotel`).
To pull images out of the PDF locally: `pdfimages -j TBS-20261001-COMPANY\ PROFILES.pdf out/`
(or `pdftoppm -jpeg -r 110 -f 17 -l 17 …` to render a single page), then rename into the folders above.
