/*
 * FOLDER TREE — how a project's leaf sets (packages.js) nest under Drive
 * subfolders, for display only: the sidebar (sidebar.js) and the project
 * page's review-sets grid (project-page.js) both read this to mirror the
 * real Drive folder structure instead of showing every set as one flat list.
 *
 * Keyed by project slug, same as packages.js. A project with no entry here —
 * every live-discovered project, and any manifest project whose sets aren't
 * nested — falls back to a flat list of its own sets in package order; see
 * Drive.buildTree() in drive.js. Only add an entry when a project's Drive
 * folder actually nests review sets under an intermediate subfolder.
 *
 * ── A node ─────────────────────────────────────────────────────────────────
 *   {
 *     title:    "Bungalow A",     shown in the tree; falls back to the
 *                                 resolved set's own title when omitted
 *     set:      "some-slug",      optional — a packages.js slug for THIS
 *                                 project. Present → the node is itself a
 *                                 review-set page, not just a label.
 *     children: [ ... ]           optional — nested nodes. A node can have
 *                                 both `set` and `children` (a Drive folder
 *                                 that holds files of its own AND a
 *                                 subfolder, e.g. Bungalow A/20260416-…-AI).
 *   }
 * A node with neither `set` nor `children` is dropped — nothing to show.
 */
window.FOLDER_TREE = {

  "la-costa": [
    {
      title: "20260826",
      children: [
        { set: "v26" },
        { set: "v26-b" },
        { set: "v26-c" },
        { set: "v28-1" },
        { set: "v28-1-b" }
      ]
    },
    {
      title: "Bungalow A",
      children: [
        { set: "ba-20260331" },
        {
          title: "20260416 — Bungalow A (AI)",
          set: "ba-20260416-ai",
          children: [
            { set: "ba-20260416-ai-archive" }
          ]
        },
        { set: "ba-20260526-ai" },
        { set: "ba-20260708-decks" },
        { set: "ba-20260824" },
        {
          title: "20260825 — Bungalow A",
          children: [
            { set: "ba-20260825-v26" }
          ]
        }
      ]
    }
  ]

};
