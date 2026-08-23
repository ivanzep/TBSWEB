/*
 * VERSION LOADER — loads an index script (versions/versions-index.js) plus
 * every listed version's data.js as plain <script> tags (works when the
 * site is opened directly via file://, unlike fetch()/XHR which CORS-block
 * local files). Used by both main.js and version-page.js.
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

  // basePath: relative path to versions/ from the current page, e.g.
  // "./versions/" from the homepage.
  function loadAll(basePath, indexFile, idsGlobalName) {
    indexFile = indexFile || "versions-index.js";
    idsGlobalName = idsGlobalName || "VERSION_IDS";
    return loadScript(basePath + indexFile).then(function () {
      var ids = window[idsGlobalName] || [];
      return Promise.all(
        ids.map(function (id) { return loadScript(basePath + id + "/data.js"); })
      ).then(function () { return ids; });
    });
  }

  return { loadScript: loadScript, loadAll: loadAll };
})();
