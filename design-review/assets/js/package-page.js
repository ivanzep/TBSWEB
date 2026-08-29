/*
 * PACKAGE PAGE — one review set: its item grid, the type filter, and the hand-off
 * into the viewer.
 *
 * Reads ?p=<slug> for the set and, optionally, ?item=<uid> to open straight into
 * a specific drawing — that's the link the Review Log hands back, so a comment
 * can be followed to the thing it's about in one click.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var pkg = null;
  var filter = "all";

  document.addEventListener("DOMContentLoaded", function () {
    C.initPage();
    window.Viewer.init(function () { renderGrid(); });

    window.Drive.loadPackages().then(function (result) {
      C.renderSetupNotice(result);
      pkg = pick(result.packages, param("p"));

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

  function param(name) {
    return new URLSearchParams(location.search).get(name) || "";
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
    document.title = pkg.title + " — " + window.SITE.project.name + " | " + window.SITE.studio.name;

    document.getElementById("pkgEyebrow").textContent =
      pkg.issued ? "Issued " + C.formatDate(pkg.issued) : "Review Set";

    var note = document.getElementById("pkgNote");
    if (pkg.note) note.textContent = pkg.note;
    else note.hidden = true;

    var drive = document.getElementById("pkgDrive");
    var url = window.Drive.folderUrl(pkg.driveFolderId || window.SITE.driveFolderId);
    if (url) drive.href = url;
    else drive.hidden = true;
  }

  function renderMissing(packages) {
    document.getElementById("pkgTitle").textContent = "Set Not Found";
    document.getElementById("pkgNote").textContent =
      packages.length
        ? "That review set doesn't exist. Pick one from the homepage."
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

      var html = '<button type="button" class="item-card' +
        (item.type === "pdf" ? " is-pdf" : "") + '" data-i="' + i + '" data-reveal>';
      html += '<span class="shot">';
      html += thumb
        ? '<img loading="lazy" src="' + C.escapeHtml(thumb) + '" alt="">'
        : '<span class="shot-empty">' +
            (item.type === "pdf" ? "PDF — open to view" : "No preview") + "</span>";
      html += '<span class="type-tag">' + (item.type === "pdf" ? "PDF" : "Image") + "</span>";
      if (state.notes.length) {
        html += '<span class="note-count">' + state.notes.length +
          (open ? " · " + open + " open" : "") + "</span>";
      }
      html += "</span>";

      html += '<span class="body">';
      if (item.sheet) html += '<span class="sheet">' + C.escapeHtml(item.sheet) + "</span>";
      html += '<span class="name">' + C.escapeHtml(item.name) + "</span>";
      if (item.note) html += '<span class="sub">' + C.escapeHtml(item.note) + "</span>";
      html += "</span></button>";
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
