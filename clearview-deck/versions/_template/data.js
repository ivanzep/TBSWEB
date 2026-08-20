/*
 * VERSION DATA TEMPLATE — copy this whole _template/ folder to versions/your-id/,
 * fill in the fields below, and drop the matching image/video files into your new
 * folder's assets/ subfolder. Paths here are relative to THIS file's own folder
 * (i.e. just "assets/whatever.jpg" — no "./versions/your-id/" prefix needed).
 *
 * Don't forget to add "your-id" to versions/versions-index.js so it shows on the
 * homepage grid — that's the only other file you need to touch.
 */
window.VERSIONS = window.VERSIONS || {};
window.VERSIONS["_template"] = {
  id: "_template",
  label: "Version Label",
  note: "One or two sentences describing what this concept direction explores.",

  // Used as the homepage grid thumbnail and the subpage hero background.
  thumb: "assets/aerial.jpg",

  // Image gallery — shown in order on this version's subpage. Each entry needs a
  // src (relative to this folder) and a caption.
  images: [
    { src: "assets/aerial.jpg", caption: "Aerial Overview" }
  ],

  // Video gallery — optional, omit or leave empty if none. Two supported shapes:
  //   { type: "youtube", youtubeId: "VIDEO_ID", caption: "..." }
  //   { type: "file", src: "assets/walkthrough.mp4", poster: "assets/aerial.jpg", caption: "..." }
  videos: []
};
