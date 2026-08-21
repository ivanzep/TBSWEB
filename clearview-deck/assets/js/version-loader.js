/*
 * VERSION LOADER — loads an index script (e.g. versions/versions-index.js)
 * plus every listed item's data.js as plain <script> tags (works when the
 * site is opened directly via file://, unlike fetch()/XHR which CORS-block
 * local files). Despite the name, this is generic over any "folder of
 * folders, each with a data.js, plus one index script listing the folder
 * names" collection — used for both versions/ (main.js, version-page.js)
 * and reference/ (reference-page.js), so there's one loader implementation
 * instead of two near-identical copies.
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

  // basePath: relative path to the collection's folder from the current
  // page, e.g. "./versions/" from the homepage. indexFile/idsGlobalName
  // default to the versions/ collection's names; reference/ passes its own
  // ("sections-index.js" / "SECTION_IDS").
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
