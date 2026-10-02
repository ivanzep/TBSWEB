# LB-MAKER — Leave-Behind PDF Assembler

Static, no-build web page for assembling a custom version of the *TBS Company Profiles* PDF.

```
cd LB-MAKER && python3 -m http.server 8000     # then open http://localhost:8000
```
(Serve it over http so the page can load the source PDF; otherwise it asks you to pick `company-profiles.pdf`.)

## Using it
1. **Assemble** – every page of the source PDF is a card. Tick the pages to include, use ◀ ▶ to reorder, filter by section.
   Each card shows its **new page number**; export renumbers the printed page numbers (options: first page number, date label).
2. **Add project** – name / location / type / role / description / program overview, a layout matching the PDF's
   Work Samples formats, photos, optional plan/site-map image and italic callout. Live preview; inserted into the deck
   (default: end of Work Samples); can be edited, reordered or deleted.
3. **Export PDF** – one PDF of the selected pages + projects, in order, built in the browser (nothing is uploaded).

Added projects and selections persist in the browser (IndexedDB).

## Notes
- Original pages are copied losslessly from the source PDF. The printed number is covered with a background-colour patch and the new number drawn on top (the old number stays as hidden text underneath).
- Added pages are 1224 × 792 pt, set in Antonio / Arimo / Montserrat Light / Tinos (stand-ins for the PDF's Antonio, Arial, Nexa, Dutch 801).
- To rebuild thumbnails + `data/pages.json` from a new PDF: replace `assets/company-profiles.pdf`, update titles in `tools/build_pages.py`, run it (needs poppler + ImageMagick).
- Vendored libraries: pdf-lib, @pdf-lib/fontkit.
