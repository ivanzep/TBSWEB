/*
 * GOOGLE DRIVE LAYER — URL builders, plus the two levels of live folder listing.
 *
 * Every other script talks to Drive through here, so there is exactly one place
 * that knows Drive's URL shapes. An "item" is either a Drive file (has `id`) or
 * a plain local/remote file (has `src`); both flow through the same builders,
 * which is what lets a package mix Drive files and local assets freely.
 *
 * Two listing levels mirror the folder hierarchy:
 *   listProjects()          master folder  → one project per subfolder
 *   listLive(rootFolderId)  a project's folder → one review set per subfolder
 * Both take an explicit root rather than reading a single global, since a
 * multi-project site has one master root (config.js) but a different root per
 * project (each project's own driveFolderId) — see loadPackages().
 */
window.Drive = (function () {
  "use strict";

  var IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|bmp|tiff?)$/i;
  var PDF_EXT = /\.pdf$/i;
  var VIDEO_EXT = /\.(mp4|mov|webm|m4v)$/i;

  /* ── Type ──────────────────────────────────────────────────────────────── */

  // Explicit `type` wins; otherwise infer from the Drive MIME type, then from
  // the file extension on src/name. Anything unrecognized is treated as a file
  // (linked, not embedded) rather than guessed at. A "video" item rides the
  // same embed path a PDF does — viewer.js treats anything that isn't
  // "image" as embeddable, and Drive's /preview iframe plays video natively —
  // so no separate viewer code was needed to add this type.
  function inferType(item) {
    if (item.type) return item.type;
    var mime = item.mimeType || "";
    if (mime.indexOf("image/") === 0) return "image";
    if (mime === "application/pdf") return "pdf";
    if (mime.indexOf("video/") === 0) return "video";
    var probe = item.src || item.name || "";
    if (IMAGE_EXT.test(probe)) return "image";
    if (PDF_EXT.test(probe)) return "pdf";
    if (VIDEO_EXT.test(probe)) return "video";
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
  // is what notes are filed under, so it must stay stable across reloads: it
  // keys off the Drive ID (or src path) scoped to the package, so the same
  // drawing reviewed in two different sets keeps two separate threads. It is
  // NOT scoped to a project — that isolation is Store's job (see store.js
  // init()), keyed by project slug — so a uid only needs to be unique within
  // one project's own packages, which package-scoping already guarantees.
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

  // Same shape whether a project came from projects.js or from a live-listed
  // Drive subfolder — see listProjects().
  function normalizeProject(p, i) {
    var slug = p.slug || ("project-" + (i + 1));
    return {
      slug: slug,
      title: p.title || slug,
      client: p.client || "",
      location: p.location || "",
      scope: p.scope || "",
      phase: p.phase || "",
      year: p.year || "",
      summary: p.summary || "",
      thumbnail: p.thumbnail || "",
      driveFolderId: p.driveFolderId || ""
    };
  }

  function prettyName(src) {
    if (!src) return "";
    var base = src.split("/").pop().replace(/\.[^.]+$/, "");
    return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim()
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  /* ── Live folder listing ──────────────────────────────────────────────── */

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

  // One project's folder → one package per subfolder, plus a package for any
  // loose files sitting at the top level so nothing in the folder is invisible.
  function listLive(rootFolderId) {
    return apiList(rootFolderId).then(function (files) {
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
            driveFolderId: rootFolderId,
            note: "Files sitting at the top level of the project folder.",
            items: loose.map(toItem)
          });
        }
        return packages.filter(function (p) { return p.items.length; });
      });
    });
  }

  // The master folder → one project per subfolder. Loose files at the master
  // level are ignored (a project must be a folder — there's nowhere for a
  // stray file to go, since it has no review sets of its own underneath it).
  function listProjectFolders(masterFolderId) {
    return apiList(masterFolderId).then(function (files) {
      return files.filter(function (f) { return f.mimeType === FOLDER_MIME && !ignored(f.name); });
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
      .replace(/^-+|-+$/g, "") || "item";
  }

  /* ── Public loaders ───────────────────────────────────────────────────── */

  // One project's review sets. `rootFolderId` is that project's OWN Drive
  // folder (from projects.js or from a live-discovered project) — falsy means
  // "no Drive folder for this project," which resolves straight to that
  // project's own entry in the packages.js manifest (keyed by `projectSlug`,
  // since more than one project can be manifest-only at once — see that
  // file's header) rather than attempting a call that could never succeed.
  // Any live failure falls back the same way, so a project page never comes
  // up empty over a bad key or a network blip.
  function loadPackages(rootFolderId, projectSlug) {
    var manifest = ((window.PACKAGES || {})[projectSlug] || []).map(normalizePackage);
    var canGoLive = !!rootFolderId && !!window.SITE.driveApiKey;

    if (!canGoLive) {
      return Promise.resolve({ packages: manifest, source: "manifest", error: null });
    }

    return listLive(rootFolderId).then(function (live) {
      var packages = live.map(normalizePackage);
      if (!packages.length) {
        return { packages: manifest, source: "manifest", error: "Drive folder is empty." };
      }
      return { packages: packages, source: "live", error: null };
    }).catch(function (err) {
      return { packages: manifest, source: "manifest", error: err.message || String(err) };
    });
  }

  // The site's project list. Live-lists the master folder's subfolders when
  // config.js has both a folder and a key; a projects.js entry whose `slug`
  // matches a live-discovered folder's slugified name applies as a metadata
  // override (title/client/location/etc.) on top of it — same pattern a
  // review-set's own meta uses. Falls back to projects.js entirely on any
  // failure, same "never come up empty" contract as loadPackages().
  function listProjects() {
    var manifest = (window.PROJECTS || []).map(normalizeProject);
    var canGoLive = !window.SITE.isUnconfigured() && !!window.SITE.driveApiKey;

    if (!canGoLive) {
      return Promise.resolve({ projects: manifest, source: "manifest", error: null });
    }

    return listProjectFolders(window.SITE.driveFolderId).then(function (folders) {
      var overrides = {};
      manifest.forEach(function (p) { overrides[p.slug] = p; });

      var projects = folders.map(function (f) {
        var slug = slugify(f.name);
        var o = overrides[slug] || {};
        return normalizeProject({
          slug: slug,
          title: o.title || f.name,
          client: o.client,
          location: o.location,
          scope: o.scope,
          phase: o.phase,
          year: o.year,
          summary: o.summary,
          thumbnail: o.thumbnail,
          driveFolderId: f.id
        });
      });

      if (!projects.length) {
        return { projects: manifest, source: "manifest", error: "Drive folder has no project subfolders." };
      }
      return { projects: projects, source: "live", error: null };
    }).catch(function (err) {
      return { projects: manifest, source: "manifest", error: err.message || String(err) };
    });
  }

  // Finds one project by slug within the current list (live or manifest),
  // falling back to the first project so a bare/garbled `?p=` still lands
  // somewhere real instead of an error the reader can't act on.
  function resolveProject(slug) {
    return listProjects().then(function (result) {
      var found = result.projects.filter(function (p) { return p.slug === slug; })[0] ||
        result.projects[0] || null;
      return { project: found, listResult: result };
    });
  }

  // The nested view of a project's own review sets — see folder-tree.js.
  // `packages` is this project's already-loaded set list (loadPackages()'s
  // result), so a node's `set` reference resolves to a real title/item count
  // rather than a bare slug. No FOLDER_TREE entry for this project (the
  // common case — every live-discovered project, and any manifest project
  // whose sets aren't nested) falls back to one flat level, same order as
  // `packages` itself, so callers never need to branch on whether a tree was
  // hand-authored.
  function buildTree(projectSlug, packages) {
    var bySlug = {};
    packages.forEach(function (p) { bySlug[p.slug] = p; });

    function resolve(node) {
      var pkg = node.set ? bySlug[node.set] : null;
      var children = (node.children || []).map(resolve).filter(Boolean);
      if (!pkg && !children.length) return null; // dangling reference — nothing to show
      return { title: node.title || (pkg ? pkg.title : ""), pkg: pkg, children: children };
    }

    var manifestTree = (window.FOLDER_TREE || {})[projectSlug];
    if (manifestTree) return manifestTree.map(resolve).filter(Boolean);
    return packages.map(function (p) { return { title: p.title, pkg: p, children: [] }; });
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
    normalizeProject: normalizeProject,
    loadPackages: loadPackages,
    listProjects: listProjects,
    resolveProject: resolveProject,
    buildTree: buildTree,
    slugify: slugify
  };
})();
