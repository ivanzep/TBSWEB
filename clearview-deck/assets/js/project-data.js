/*
 * PROJECT DATA — the one file to edit when reusing this template for a new project.
 * Duplicate the /clearview-deck folder, drop new images into assets/images and a new
 * PDF into assets/downloads, then update everything below. index.html, style.css and
 * main.js are all generic and read from this object at runtime.
 */
window.PROJECT = {
  studio: {
    name: "The Brown Studio",
    tagline: "Design + Build",
    site: "thebrownstudio.com",
    email: "hello@thebrownstudio.com"
  },

  name: "Clearview Deck",
  subtitle: "Concept Studies",
  client: "Private Residence",
  location: "Placeholder, CA",
  scope: "Outdoor Pergola · Pool Deck · Fireplace",
  status: "Concept Phase",
  year: "2026",

  summary:
    "A rear-yard renovation wraps the existing single-story residence in a continuous " +
    "wood pergola, connecting the main living spaces to a new pool terrace and a " +
    "freestanding concrete fireplace tower. Seven concept directions explore how the " +
    "roof plane, shade coverage and outdoor rooms can be organized around the pool.",

  // YouTube video ID for the looping hero reel. Leave empty to fall back to
  // heroImage as a static (subtly animated) hero background.
  heroVideoId: "",
  heroImage: "./assets/images/v5-2b-wide.jpg",

  // Local download by default (works immediately, no setup). Once the PDF is uploaded
  // to the Google Drive folder below, swap this for the Drive "download" link, e.g.
  // "https://drive.google.com/uc?export=download&id=FILE_ID".
  pdfDownloadUrl: "./assets/downloads/Clearview-Deck-Concept-Studies.pdf",
  pdfLabel: "Download Concept Deck (PDF)",

  // Handoff / archive folder for full-resolution renderings and source files.
  driveFolderUrl: "https://drive.google.com/drive/folders/1ZRuQFsOuvBx99QZtTs_xGQzFOdroAJT-",

  versions: [
    {
      id: "v5",
      label: "Version 5",
      note:
        "Staggered pergola runs bridge the main house to a sculptural concrete " +
        "fireplace tower, framing the pool in dappled light.",
      thumb: "./assets/images/v5-aerial.jpg",
      gallery: [
        { src: "./assets/images/v5-aerial.jpg", caption: "Aerial Overview" },
        { src: "./assets/images/v5-wide.jpg", caption: "Poolside Terrace" },
        { src: "./assets/images/v5-detail-a.jpg", caption: "Interior Transition" },
        { src: "./assets/images/v5-detail-b.jpg", caption: "Fireplace Detail" },
        { src: "./assets/images/v5-side-a.jpg", caption: "Dining Terrace" },
        { src: "./assets/images/v5-side-b.jpg", caption: "Courtyard View" }
      ]
    },
    {
      id: "v5-2",
      label: "Version 5.2",
      note:
        "A single continuous pergola line replaces the staggered run for a " +
        "cleaner, more unified roofline over the pool deck.",
      thumb: "./assets/images/v5-2-aerial.jpg",
      gallery: [
        { src: "./assets/images/v5-2-aerial.jpg", caption: "Aerial Overview" },
        { src: "./assets/images/v5-2-wide.jpg", caption: "Poolside Terrace" },
        { src: "./assets/images/v5-2-detail-a.jpg", caption: "Interior Transition" },
        { src: "./assets/images/v5-2-detail-b.jpg", caption: "Fireplace Detail" },
        { src: "./assets/images/v5-2-side-a.jpg", caption: "Dining Terrace" },
        { src: "./assets/images/v5-2-side-b.jpg", caption: "Courtyard View" }
      ]
    },
    {
      id: "v5-2b",
      label: "Version 5.2b",
      note:
        "The pergola extends further past the fireplace with a woven shade " +
        "panel, adding a dedicated lounge run of chaises.",
      thumb: "./assets/images/v5-2b-aerial.jpg",
      gallery: [
        { src: "./assets/images/v5-2b-aerial.jpg", caption: "Aerial Overview" },
        { src: "./assets/images/v5-2b-wide.jpg", caption: "Poolside Terrace" },
        { src: "./assets/images/v5-2b-detail-a.jpg", caption: "Interior Transition" },
        { src: "./assets/images/v5-2b-detail-b.jpg", caption: "Fireplace Detail" },
        { src: "./assets/images/v5-2b-side-a.jpg", caption: "Dining Terrace" },
        { src: "./assets/images/v5-2b-side-b.jpg", caption: "Courtyard View" }
      ]
    },
    {
      id: "v5-3",
      label: "Version 5.3",
      note:
        "Alternating solid and slatted roof bays introduce rhythm and partial " +
        "rain cover while keeping the fireplace tower as the anchor.",
      thumb: "./assets/images/v5-3-aerial.jpg",
      gallery: [
        { src: "./assets/images/v5-3-aerial.jpg", caption: "Aerial Overview" },
        { src: "./assets/images/v5-3-wide.jpg", caption: "Poolside Terrace" },
        { src: "./assets/images/v5-3-detail-a.jpg", caption: "Interior Transition" },
        { src: "./assets/images/v5-3-detail-b.jpg", caption: "Fireplace Detail" },
        { src: "./assets/images/v5-3-side-a.jpg", caption: "Dining Terrace" },
        { src: "./assets/images/v5-3-side-b.jpg", caption: "Courtyard View" }
      ]
    },
    {
      id: "v5-4",
      label: "Version 5.4",
      note:
        "A full solid panel shifts coverage toward the dining terrace, opening " +
        "the pool run to sky and a slimmer slat section.",
      thumb: "./assets/images/v5-4-aerial.jpg",
      gallery: [
        { src: "./assets/images/v5-4-aerial.jpg", caption: "Aerial Overview" },
        { src: "./assets/images/v5-4-wide.jpg", caption: "Poolside Terrace" },
        { src: "./assets/images/v5-4-detail-a.jpg", caption: "Interior Transition" },
        { src: "./assets/images/v5-4-detail-b.jpg", caption: "Fireplace Detail" },
        { src: "./assets/images/v5-4-side-a.jpg", caption: "Dining Terrace" },
        { src: "./assets/images/v5-4-side-b.jpg", caption: "Courtyard View" }
      ]
    },
    {
      id: "v5-5",
      label: "Version 5.5",
      note:
        "A skylight cutout lets an existing tree grow through the roof plane, " +
        "softening the structure above a row of loungers.",
      thumb: "./assets/images/v5-5-aerial.jpg",
      gallery: [
        { src: "./assets/images/v5-5-aerial.jpg", caption: "Aerial Overview" },
        { src: "./assets/images/v5-5-wide.jpg", caption: "Poolside Terrace" },
        { src: "./assets/images/v5-5-detail-a.jpg", caption: "Interior Transition" },
        { src: "./assets/images/v5-5-detail-b.jpg", caption: "Fireplace Detail" },
        { src: "./assets/images/v5-5-side-a.jpg", caption: "Dining Terrace" },
        { src: "./assets/images/v5-5-side-b.jpg", caption: "Courtyard View" }
      ]
    },
    {
      id: "v5-6",
      label: "Version 5.6",
      note:
        "The shaded bay becomes an outdoor living room, pairing the fireplace " +
        "with lounge seating just off the kitchen.",
      thumb: "./assets/images/v5-6-aerial.jpg",
      gallery: [
        { src: "./assets/images/v5-6-aerial.jpg", caption: "Aerial Overview" },
        { src: "./assets/images/v5-6-wide.jpg", caption: "Poolside Terrace" },
        { src: "./assets/images/v5-6-detail-a.jpg", caption: "Interior Transition" },
        { src: "./assets/images/v5-6-detail-b.jpg", caption: "Fireplace Detail" },
        { src: "./assets/images/v5-6-side-a.jpg", caption: "Dining Terrace" },
        { src: "./assets/images/v5-6-side-b.jpg", caption: "Courtyard View" }
      ]
    }
  ]
};
