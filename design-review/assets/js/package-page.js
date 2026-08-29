/*
 * PACKAGE PAGE — one review set: its item grid, the type filter, and the hand-off
 * into the viewer.
 *
 * Reads ?proj=<projectSlug>&p=<setSlug>, and optionally &item=<uid> to open
 * straight into a specific drawing — that's the link the Review Log hands
 * back, so a comment can be followed to the thing it's about in one click.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var project = null;
  var pkg = null;
  var filter = "all";

  document.addEventListener("DOMContentLoaded", function () {
    window.Viewer.init(function () { renderGrid(); });

    window.Drive.resolveProject(param("proj")).then(function (resolved) {
      project = resolved.project;

      if (!project) {
        C.initPage();
        renderMissing(null);
        return;
      }

      // Must happen before anything touches Store — see store.js's header.
      window.Store.init(project.slug, project.title);
      C.initPage(project);
      fixupNavLinks();
      bindBackLink();

      window.Drive.loadPackages(project.driveFolderId, project.slug).then(function (result) {
        C.renderSetupNotice(result);
        pkg = pick(result.packages, param("p"));
        window.SiteSidebar.render(project, window.Drive.buildTree(project.slug, result.packages),
          pkg ? pkg.slug : null);

        if (!pkg) {
          renderMissing(result.packages);
          return;
        }

        renderHeader();
        renderGrid();
        bindToolbar();
        openDeepLink();
      });
    });
  });

  function param(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  // Fragment-safe: a nav link back to project.html carries a #section, and
  // the query has to land before that fragment, not after it — appending
  // blindly would produce "project.html#overview?proj=x", which drops the
  // param (a fragment is everything after # as far as the browser's concerned).
  function withProj(url) {
    var hashIdx = url.indexOf("#");
    var base = hashIdx === -1 ? url : url.slice(0, hashIdx);
    var hash = hashIdx === -1 ? "" : url.slice(hashIdx);
    base += (base.indexOf("?") === -1 ? "?" : "&") + "proj=" + encodeURIComponent(project.slug);
    return base + hash;
  }

  // The nav's project.html/all-files.html/review-log.html links are bare
  // sibling-page hrefs in the shared markup — stamp this project's slug onto
  // them once, same pattern project-page.js uses for its own copies.
  function fixupNavLinks() {
    document.querySelectorAll(
      'a[href^="./project.html"], a[href^="./all-files.html"], a[href^="./review-log.html"]'
    ).forEach(function (a) { a.setAttribute("href", withProj(a.getAttribute("href"))); });
  }

  function bindBackLink() {
    var back = document.getElementById("backLink");
    if (back) back.href = withProj("./project.html#packages");
  }

  // Falls back to the first set so a bare /package.html still shows something
  // rather than an error the reader can't act on.
  function pick(packages, slug) {
    if (!packages.length) return null;
    return packages.filter(function (p) { return p.slug === slug; })[0] || packages[0];
  }

  /* ── Header ────────────────────────────────────────────────────────────── */

  function renderHeader() {
    document.getElementById("pkgTitle").textContent = pkg.title;
    document.title = pkg.title + " — " + project.title + " | " + window.SITE.studio.name;

    document.getElementById("pkgEyebrow").textContent =
      pkg.issued ? "Issued " + C.formatDate(pkg.issued) : "Review Set";

    var note = document.getElementById("pkgNote");
    if (pkg.note) note.textContent = pkg.note;
    else note.hidden = true;

    var drive = document.getElementById("pkgDrive");
    var url = window.Drive.folderUrl(pkg.driveFolderId || project.driveFolderId);
    if (url) drive.href = url;
    else drive.hidden = true;
  }

  // `packages` is null when the project itself couldn't be resolved at all
  // (bad ?proj=) — distinct from a real project with zero review sets, which
  // still has an empty array and a normal "no sets yet" message.
  function renderMissing(packages) {
    document.getElementById("pkgTitle").textContent =
      packages === null ? "Project Not Found" : "Set Not Found";
    document.getElementById("pkgNote").textContent =
      packages === null
        ? "That project doesn't exist. Pick one from the homepage."
        : packages.length
          ? "That review set doesn't exist. Pick one from the project page."
          : "No review sets are configured yet.";
    document.getElementById("toolbar").hidden = true;
  }

  /* ── Grid ──────────────────────────────────────────────────────────────── */

  function visibleItems() {
    if (filter === "all") return pkg.items;
    return pkg.items.filter(function (it) { return it.type === filter; });
  }

  function renderGrid() {
    if (!pkg) return;
    var host = document.getElementById("itemGrid");
    var empty = document.getElementById("emptyState");
    var items = visibleItems();

    if (!items.length) {
      host.innerHTML = "";
      empty.hidden = false;
      empty.textContent = pkg.items.length
        ? "Nothing in this set matches that filter."
        : "This set has no files yet.";
      return;
    }
    empty.hidden = true;

    host.innerHTML = items.map(function (item, i) {
      var state = window.Store.getItem(item.uid);
      var thumb = window.Drive.thumbUrl(item, 800);
      var open = state.notes.filter(function (n) { return !n.resolved; }).length;

      // Full identity (sheet + note the card no longer shows) is still one
      // hover away via the title attribute — trimmed to just the filename on
      // screen, not lost.
      var full = (item.sheet ? item.sheet + " — " : "") + item.name + (item.note ? " · " + item.note : "");

      var html = '<button type="button" class="item-card' +
        (item.type === "pdf" ? " is-pdf" : "") + '" data-i="' + i + '" data-reveal title="' +
        C.escapeHtml(full) + '">';
      html += '<span class="shot">';
      html += thumb
        ? '<img loading="lazy" src="' + C.escapeHtml(thumb) + '" alt="">'
        : '<span class="shot-empty">' +
            (item.type === "pdf" ? "PDF — open to view" : "No preview") + "</span>";
      html += '<span class="type-tag">' + C.typeLabel(item.type) + "</span>";
      if (state.notes.length) {
        html += '<span class="note-count">' + state.notes.length +
          (open ? " · " + open + " open" : "") + "</span>";
      }
      html += "</span>";

      html += '<span class="body"><span class="name">' + C.escapeHtml(item.name) + "</span></span>";
      html += "</button>";
      return html;
    }).join("");

    host.querySelectorAll(".item-card").forEach(function (card) {
      card.addEventListener("click", function () {
        // The viewer pages through exactly what's on screen, so arrowing never
        // lands on an item the active filter is hiding.
        window.Viewer.open(visibleItems(), Number(card.getAttribute("data-i")));
      });
    });

    C.revealWithin(host);
  }

  /* ── Toolbar ───────────────────────────────────────────────────────────── */

  function bindToolbar() {
    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filter = btn.getAttribute("data-filter");
        document.querySelectorAll("[data-filter]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        renderGrid();
      });
    });

    document.getElementById("openFirst").addEventListener("click", function () {
      var items = visibleItems();
      if (items.length) window.Viewer.open(items, 0);
    });
  }

  /* ── Deep link ─────────────────────────────────────────────────────────── */

  function openDeepLink() {
    var uid = param("item");
    if (!uid) return;
    var idx = pkg.items.findIndex(function (it) { return it.uid === uid; });
    if (idx >= 0) window.Viewer.open(pkg.items, idx);
  }
})();
