/*
 * YOUTUBE URL PARSER — turns any YouTube link (watch, youtu.be, embed,
 * shorts, live, or a link with extra tracking params) into a bare video or
 * playlist ID. A bare ID passed in comes back unchanged, so every call site
 * that used to require a pre-extracted ID now accepts either.
 *
 * Loaded two ways from the same file (no duplicated logic):
 *   - Node: const { parseVideoId, parsePlaylistId } = require("./youtube-url.js");
 *   - Browser: <script src=".../assets/js/youtube-url.js"></script> exposes
 *     window.YouTubeUrl = { parseVideoId, parsePlaylistId }.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.YouTubeUrl = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var ID_RE = /^[A-Za-z0-9_-]{11}$/;

  function parseVideoId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (!s) return null;
    if (ID_RE.test(s)) return s;

    var m = s.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];

    m = s.match(/\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
    if (m) return m[1];

    m = s.match(/[?&]v=([A-Za-z0-9_-]{11})/);
    if (m) return m[1];

    return null;
  }

  function parsePlaylistId(input) {
    if (!input) return null;
    var s = String(input).trim();
    if (!s) return null;
    // No URL structure and no whitespace: treat as an already-bare playlist ID.
    if (!/^https?:\/\//i.test(s) && !/\s/.test(s)) return s;

    var m = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (m) return m[1];

    return null;
  }

  return { parseVideoId: parseVideoId, parsePlaylistId: parsePlaylistId };
});
