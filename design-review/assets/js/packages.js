/*
 * REVIEW PACKAGES — the folder structure the site presents.
 *
 * This is the hand-authored manifest used when SITE.liveFolderMode is false
 * (the default). Each package is one review set — a drawing issue, a rendering
 * batch, a reference pack — and mirrors one subfolder of the project's Drive
 * folder. Order here is the order shown on the site.
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
 * ── Getting a Drive file ID ────────────────────────────────────────────────
 * Right-click the file in Drive → Share → Copy link. You get
 *   https://drive.google.com/file/d/1AbC...XyZ/view?usp=drivesdk
 * The ID is the part between /d/ and /view → "1AbC...XyZ".
 * The file must be shared "Anyone with the link → Viewer" to embed.
 *
 * ── Note ───────────────────────────────────────────────────────────────────
 * The packages below are seeded with the repo's existing local renderings so
 * the site is viewable before any Drive wiring exists. Replace `src` with `id`
 * as the real files land in Drive — or skip this file entirely and turn on
 * SITE.liveFolderMode to have the Drive folder generate all of this itself.
 */
window.PACKAGES = [
  {
    slug: "dd-set",
    title: "Design Development Set",
    issued: "2026-08-14",
    note: "Current issue for client review. Sheets are the controlling documents; " +
      "renderings are illustrative.",
    driveFolderId: "",
    items: [
      {
        src: "../clearview-deck/assets/downloads/Clearview-Deck-Concept-Studies.pdf",
        name: "Full Drawing Set",
        type: "pdf",
        sheet: "DD-00",
        note: "All sheets, current issue."
      },
      {
        src: "../clearview-patio-deck/versions/V5.6/assets/CLEARVIEW-DECK-DV5.6-1-PATIO-DECK.pdf",
        name: "Patio Deck — Plan + Elevations",
        type: "pdf",
        sheet: "DD-01"
      },
      {
        src: "../clearview-deck/versions/v5-4/assets/aerial-overview.jpg",
        name: "Aerial Overview",
        sheet: "R-01"
      },
      {
        src: "../clearview-deck/versions/v5-4/assets/poolside-terrace.jpg",
        name: "Poolside Terrace",
        sheet: "R-02"
      },
      {
        src: "../clearview-deck/versions/v5-4/assets/dining-terrace.jpg",
        name: "Dining Terrace",
        sheet: "R-03"
      },
      {
        src: "../clearview-deck/versions/v5-4/assets/fireplace-detail.jpg",
        name: "Fireplace Detail",
        sheet: "R-04"
      },
      {
        src: "../clearview-deck/versions/v5-4/assets/courtyard-view.jpg",
        name: "Courtyard View",
        sheet: "R-05"
      },
      {
        src: "../clearview-deck/versions/v5-4/assets/interior-transition.jpg",
        name: "Interior Transition",
        sheet: "R-06"
      }
    ]
  },

  {
    slug: "sd-set",
    title: "Schematic Design Set",
    issued: "2026-05-22",
    note: "Superseded by the DD set — kept for reference and to track which " +
      "comments carried forward.",
    driveFolderId: "",
    items: [
      {
        src: "../clearview-patio-deck/versions/V5.5/assets/CLEARVIEW-DECK-DV5.5-1-PATIO-DECK.pdf",
        name: "Patio Deck — Schematic",
        type: "pdf",
        sheet: "SD-01"
      },
      {
        src: "../clearview-deck/versions/v5-5/assets/aerial-overview.jpg",
        name: "Aerial Overview",
        sheet: "R-01"
      },
      {
        src: "../clearview-deck/versions/v5-5/assets/poolside-terrace.jpg",
        name: "Poolside Terrace",
        sheet: "R-02"
      },
      {
        src: "../clearview-deck/versions/v5-5/assets/dining-terrace.jpg",
        name: "Dining Terrace",
        sheet: "R-03"
      }
    ]
  },

  {
    slug: "reference",
    title: "Reference + Materials",
    issued: "",
    note: "Precedent imagery and material direction. Not for construction.",
    driveFolderId: "",
    items: [
      {
        src: "../clearview-deck/reference/TRELLIS/assets/2.jpg",
        name: "Trellis Precedent 01"
      },
      {
        src: "../clearview-deck/reference/TRELLIS/assets/3.jpg",
        name: "Trellis Precedent 02"
      },
      {
        src: "../clearview-deck/reference/TRELLIS/assets/4.jpg",
        name: "Trellis Precedent 03"
      },
      {
        src: "../clearview-deck/reference/TRELLIS/assets/16.jpg",
        name: "Trellis Precedent 04"
      }
    ]
  }
];
