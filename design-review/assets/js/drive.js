/*
 * GOOGLE DRIVE LAYER — URL builders, plus the optional live folder listing.
 *
 * Every other script talks to Drive through here, so there is exactly one place
 * that knows Drive's URL shapes. An "item" is either a Drive file (has `id`) or
 * a plain local/remote file (has `src`); both flow through the same builders,
 * which is what lets a package mix Drive files and local assets freely.
 */
window.Drive = (function () {
  "use strict";

  var IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp|tiff?)$/i;
  var PDF_EXT = /\.pdf$/i;

  /* ── Type ──────────────────────────────────────────────────────────────── */

  // Explicit `type` wins; otherwise infer from the Drive MIME type, then from
  // the file extension on src/name. Anything unrecognized is treated as a file
  // (linked, not embedded) rather than guessed at.
  function inferType(item) {
    if (item.type) return item.type;
    var mime = item.mimeType || "";
    if (mime.indexOf("image/") === 0) return "image";
    if (mime === "application/pdf") return "pdf";
    var probe = item.src || item.name || "";
    if (IMAGE_EXT.test(probe)) return "image";
    if (PDF_EXT.test(probe)) return "pdf";
    return "file";
  }

  /* ── URL builders ──────────────────────────────────────────────────────── */

  // Grid/carousel thumbnail. Drive's thumbnail endpoint renders PDFs too — a
  // sheet gets a real page-one preview instead of a generic file icon.
  function thumbUrl(item, width) {
    if (item.src) return isImageSrc(item.src) ? item.src : "";
    if (!item.id) return "";
    return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(item.id) +
      "&sz=w" + (width || 1200);
  }

  // Full-size image for the carousel stage.
  function fullUrl(item) {
    if (item.src) return item.src;
    if (!item.id) return "";
    return "https://drive.google.com/thumbnail?id=" + encodeURIComponent(item.id) + "&sz=w2400";
  }

  // Secondary source tried if fullUrl 404s — Drive serves the same file from
  // this host, and which one works varies with how the file was shared.
  function fullUrlFallback(item) {
    if (item.src || !item.id) return "";
    return "https://lh3.googleusercontent.com/d/" + encodeURIComponent(item.id) + "=w2400";
  }

  // Embedded viewer (PDF sheets). Drive's /preview renders a full paginated
  // viewer inside the iframe; local files fall back to the browser's own.
  function embedUrl(item) {
    if (item.src) return item.src + "#view=FitH";
    if (!item.id) return "";
    return "https://drive.google.com/file/d/" + encodeURIComponent(item.id) + "/preview";
  }

  function downloadUrl(item) {
    if (item.src) return item.src;
    if (!item.id) return "";
    return "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(item.id);
  }

  // "Open in Drive" — the real Drive UI, where comments and version history live.
  function openUrl(item) {
    if (!item.id) return item.src || "";
    return "https://drive.google.com/file/d/" + encodeURIComponent(item.id) + "/view";
  }

  function folderUrl(folderId) {
    if (!folderId || folderId.indexOf("PASTE_") === 0) return "";
    return "https://drive.google.com/drive/folders/" + encodeURIComponent(folderId);
  }

  function isImageSrc(src) { return IMAGE_EXT.test(src || ""); }

  /* ── Normalizing ───────────────────────────────────────────────────────── */

  // Gives every item a stable uid, a resolved type and a display name. The uid
  // is what notes and statuses are filed under, so it must stay stable across
  // reloads: it keys off the Drive ID (or src path) scoped to the package, so
  // the same drawing reviewed in two different sets keeps two separate threads.
  function normalizeItem(item, pkgSlug, index) {
    var type = inferType(item);
    var key = item.id || item.src || ("idx-" + index);
    return {
      uid: pkgSlug + "::" + key,
      id: item.id || "",
      src: item.src || "",
      name: item.name || prettyName(item.src) || "Untitled",
      type: type,
      sheet: item.sheet || "",
      note: item.note || "",
      modified: item.modifiedTime || "",
      pkgSlug: pkgSlug
    };
  }

  function normalizePackage(pkg, i) {
    var slug = pkg.slug || ("package-" + (i + 1));
    return {
      slug: slug,
      title: pkg.title || slug,
      issued: pkg.issued || "",
      note: pkg.note || "",
      driveFolderId: pkg.driveFolderId || "",
      items: (pkg.items || []).map(function (it, n) {
        return normalizeItem(it, slug, n);
      })
    };
  }

  function prettyName(src) {
    if (!src) return "";
    var base = src.split("/").pop().replace(/\.[^.]+$/, "");
    return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* ── Live folder listing (optional) ────────────────────────────────────── */

  function apiList(folderId) {
    var url = "https://www.googleapis.com/drive/v3/files" +
      "?q=" + encodeURIComponent("'" + folderId + "' in parents and trashed = false") +
      "&key=" + encodeURIComponent(window.SITE.driveApiKey) +
      "&fields=" + encodeURIComponent("files(id,name,mimeType,modifiedTime)") +
      "&orderBy=" + encodeURIComponent("folder,name") +
      "&pageSize=1000" +
      "&supportsAllDrives=true&includeItemsFromAllDrives=true";

    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("Drive API " + res.status);
      return res.json();
    }).then(function (json) { return json.files || []; });
  }

  function ignored(name) {
    var list = window.SITE.liveIgnore || [];
    var lower = (name || "").toLowerCase();
    return list.some(function (bad) { return lower === String(bad).toLowerCase(); });
  }

  var FOLDER_MIME = "application/vnd.google-apps.folder";

  // Top folder → one package per subfolder, plus a package for any loose files
  // sitting at the top level so nothing in the folder is invisible on the site.
  function listLive() {
    var root = window.SITE.driveFolderId;
    return apiList(root).then(function (files) {
      var kept = files.filter(function (f) { return !ignored(f.name); });
      var folders = kept.filter(function (f) { return f.mimeType === FOLDER_MIME; });
      var loose = kept.filter(function (f) { return f.mimeType !== FOLDER_MIME; });

      var jobs = folders.map(function (folder) {
        return apiList(folder.id).then(function (children) {
          return {
            slug: slugify(folder.name),
            title: folder.name,
            driveFolderId: folder.id,
            note: "",
            items: children
              .filter(function (c) { return c.mimeType !== FOLDER_MIME && !ignored(c.name); })
              .map(toItem)
          };
        });
      });

      return Promise.all(jobs).then(function (packages) {
        if (loose.length) {
          packages.unshift({
            slug: "project-files",
            title: "Project Files",
            driveFolderId: root,
            note: "Files sitting at the top level of the project folder.",
            items: loose.map(toItem)
          });
        }
        return packages.filter(function (p) { return p.items.length; });
      });
    });
  }

  function toItem(f) {
    return {
      id: f.id,
      name: stripExt(f.name),
      mimeType: f.mimeType,
      modifiedTime: f.modifiedTime,
      sheet: sheetFromName(f.name)
    };
  }

  function stripExt(name) { return String(name || "").replace(/\.[^.]+$/, ""); }

  // Pulls a leading sheet number out of a filename ("A1.0 Site Plan" → "A1.0")
  // so live-listed drawings tag the same way hand-authored ones do.
  function sheetFromName(name) {
    var m = /^([A-Z]{1,3}[-.]?\d+(?:\.\d+)?)\b/i.exec(String(name || "").trim());
    return m ? m[1].toUpperCase() : "";
  }

  function slugify(s) {
    return String(s || "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "package";
  }

  /* ── Public loader ─────────────────────────────────────────────────────── */

  // Resolves to { packages, source, error }. Live mode is attempted only when
  // it's switched on AND has both a folder and a key; any failure falls back to
  // the manifest so the site never comes up empty because of a bad key.
  function loadPackages() {
    var manifest = (window.PACKAGES || []).map(normalizePackage);
    var canGoLive = window.SITE.liveFolderMode &&
      window.SITE.driveApiKey &&
      !window.SITE.isUnconfigured();

    if (!canGoLive) {
      return Promise.resolve({ packages: manifest, source: "manifest", error: null });
    }

    return listLive().then(function (live) {
      var packages = live.map(normalizePackage);
      if (!packages.length) {
        return { packages: manifest, source: "manifest", error: "Drive folder is empty." };
      }
      return { packages: packages, source: "live", error: null };
    }).catch(function (err) {
      return { packages: manifest, source: "manifest", error: err.message || String(err) };
    });
  }

  return {
    inferType: inferType,
    thumbUrl: thumbUrl,
    fullUrl: fullUrl,
    fullUrlFallback: fullUrlFallback,
    embedUrl: embedUrl,
    downloadUrl: downloadUrl,
    openUrl: openUrl,
    folderUrl: folderUrl,
    normalizePackage: normalizePackage,
    loadPackages: loadPackages,
    slugify: slugify
  };
})();
