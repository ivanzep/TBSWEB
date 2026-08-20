/*
 * VERSION LOADER — loads versions/versions-index.js and every registered
 * version's data.js as plain <script> tags (works when the site is opened
 * directly via file://, unlike fetch()/XHR which CORS-block local files).
 * Populates window.VERSION_IDS and window.VERSIONS. Used by main.js (loads
 * every version, for the homepage grid) and version-page.js (loads just its
 * own folder's data.js).
 */
window.VersionLoader = (function () {
  "use strict";

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  // basePath: relative path to the /versions/ folder from the current page,
  // e.g. "./versions/" from the homepage.
  function loadAll(basePath) {
    return loadScript(basePath + "versions-index.js").then(function () {
      var ids = window.VERSION_IDS || [];
      return Promise.all(
        ids.map(function (id) { return loadScript(basePath + id + "/data.js"); })
      ).then(function () { return ids; });
    });
  }

  return { loadScript: loadScript, loadAll: loadAll };
})();
