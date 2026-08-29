/*
 * PROJECT PAGE — one project's overview and its review sets grid. This is the
 * page every project gets (via ?p=<projectSlug>) — the same layout every
 * single-project version of this site used to have at the root, now scoped
 * to whichever project the URL names.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var S = window.SITE;
  var project = null;
  var packages = [];
  var tree = [];

  document.addEventListener("DOMContentLoaded", function () {
    var slug = param("p");

    window.Drive.resolveProject(slug).then(function (resolved) {
      project = resolved.project;
      C.renderSetupNotice(resolved.listResult, "projects");

      if (!project) {
        renderMissing();
        return;
      }

      // Store must be namespaced to THIS project before anything reads or
      // writes a comment, or the "with comments" counts below would either
      // throw (Store guards against exactly that) or, worse, read another
      // project's data if the guard were ever loosened.
      window.Store.init(project.slug, project.title);
      C.initPage(project);

      renderHero();
      renderOverview();
      bindDriveLink();

      window.Drive.loadPackages(project.driveFolderId, project.slug).then(function (result) {
        packages = result.packages;
        tree = window.Drive.buildTree(project.slug, packages);
        C.renderSetupNotice(result);
        renderPackages();
        window.SiteSidebar.render(project, tree, null);
      });

      window.Store.subscribe(renderPackages);
    });
  });

  function param(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  function withProj(url) {
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "proj=" + encodeURIComponent(project.slug);
  }

  function renderMissing() {
    C.initPage();
    document.getElementById("heroTitle").textContent = "Project Not Found";
    document.getElementById("heroSubtitle").textContent = "";
    document.getElementById("heroEyebrow").textContent = S.studio.name;
    document.title = "Project Not Found | " + S.studio.name;
    document.getElementById("overviewText").textContent =
      "That project doesn't exist. Pick one from the homepage.";
    document.getElementById("packages").hidden = true;
    document.getElementById("drive").hidden = true;
  }

  /* ── Nav / links scoped to this project ───────────────────────────────── */

  // Every link to all-files.html/review-log.html in project.html's own
  // markup (nav, hero, the drive section's "Export Comments") is a bare
  // sibling-page href with no project context baked in, since the HTML is
  // shared markup for every project — stamp the resolved slug on once here,
  // wherever such a link appears, rather than hand-writing it per instance.
  function fixupNavLinks() {
    document.querySelectorAll('a[href="./all-files.html"], a[href="./review-log.html"]')
      .forEach(function (a) { a.setAttribute("href", withProj(a.getAttribute("href"))); });
  }

  /* ── Hero ──────────────────────────────────────────────────────────────── */

  function renderHero() {
    document.getElementById("heroEyebrow").textContent = S.studio.name + " — " + S.studio.tagline;
    document.getElementById("heroTitle").textContent = project.title;
    document.getElementById("heroSubtitle").textContent = "Design Review";
    document.title = project.title + " — Design Review | " + S.studio.name;

    fixupNavLinks();

    var media = document.getElementById("heroMedia");
    var image = project.thumbnail || firstImage() || S.fallbackHeroImage;
    if (image) media.style.backgroundImage = "url('" + image + "')";
  }

  // Prefer a real image out of the demo manifest so the hero shows actual
  // work when this project has no Drive folder yet; ignored once packages
  // load live, since renderPackages() doesn't touch the hero again.
  function firstImage() {
    if (project.driveFolderId) return "";
    var manifest = ((window.PACKAGES || {})[project.slug] || []).map(window.Drive.normalizePackage);
    for (var i = 0; i < manifest.length; i++) {
      var hit = manifest[i].items.filter(function (it) { return it.type === "image"; })[0];
      if (hit) return window.Drive.fullUrl(hit);
    }
    return "";
  }

  /* ── Overview ──────────────────────────────────────────────────────────── */

  function renderOverview() {
    document.getElementById("overviewText").textContent = project.summary;

    var rows = [
      ["Client", project.client],
      ["Location", project.location],
      ["Scope", project.scope],
      ["Phase", project.phase],
      ["Year", project.year]
    ].filter(function (r) { return r[1]; });

    document.getElementById("statList").innerHTML = rows.map(function (r) {
      return '<li><span class="k">' + C.escapeHtml(r[0]) + '</span>' +
        '<span class="v">' + C.escapeHtml(r[1]) + "</span></li>";
    }).join("");
  }

  function bindDriveLink() {
    var el = document.querySelector("[data-project-drive-folder]");
    if (!el) return;
    var url = window.Drive.folderUrl(project.driveFolderId);
    if (url) el.href = url;
    else el.classList.add("is-disabled");
  }

  /* ── Package cards ─────────────────────────────────────────────────────── */

  // Groups the grid to match the real Drive folder structure (folder-tree.js)
  // instead of always showing one flat list: a tree node with no folder of
  // its own (the common case — see Drive.buildTree()'s flat fallback) is
  // just a card; a node with children becomes a labeled subsection, and if
  // that folder ALSO holds files directly (e.g. Bungalow A's 20260416 set,
  // which has both its own images and an Archive subfolder) its own card
  // appears first inside that subsection, ahead of the nested groups.
  function renderPackages() {
    var host = document.getElementById("packagesGrid");
    if (!host) return;

    if (!tree.length) {
      host.innerHTML = '<p class="vp-empty" style="color:var(--color-ink-soft)">No review sets yet.</p>';
      return;
    }

    host.innerHTML = renderGroup(tree, 0);
    C.revealWithin(host);
  }

  function renderGroup(nodes, depth) {
    var leaves = nodes.filter(function (n) { return n.pkg && !n.children.length; });
    var folders = nodes.filter(function (n) { return n.children.length; });

    var html = "";
    if (leaves.length) {
      html += '<div class="packages-grid">' + leaves.map(function (n) { return cardHtml(n.pkg); }).join("") + "</div>";
    }
    folders.forEach(function (n) {
      var folderHref = withProj("./all-files.html?folder=" + encodeURIComponent(n.slug));
      html += '<div class="pkg-group" style="--pkg-group-depth:' + depth + '">';
      html += '<h3 class="pkg-group-title"><a href="' + C.escapeHtml(folderHref) + '">' +
        C.escapeHtml(n.title) + "</a></h3>";
      var innerNodes = n.pkg ? [{ pkg: n.pkg, children: [] }].concat(n.children) : n.children;
      html += renderGroup(innerNodes, depth + 1);
      html += "</div>";
    });
    return html;
  }

  function cardHtml(pkg) {
    var c = window.Store.counts(pkg.items);
    var cover = coverFor(pkg);
    var href = withProj("./package.html?p=" + encodeURIComponent(pkg.slug));

    var pdfs = pkg.items.filter(function (i) { return i.type === "pdf"; }).length;
    var imgs = pkg.items.filter(function (i) { return i.type === "image"; }).length;
    var mix = [];
    if (imgs) mix.push(imgs + (imgs === 1 ? " image" : " images"));
    if (pdfs) mix.push(pdfs + (pdfs === 1 ? " PDF" : " PDFs"));

    var html = '<article class="pkg-card" data-reveal>';
    html += '<a class="thumb" href="' + href + '">' + (cover
      ? '<img loading="lazy" src="' + C.escapeHtml(cover) + '" alt="">'
      : '<span class="thumb-empty">No preview</span>') + "</a>";
    html += '<div class="body">';
    html += '<a class="label" href="' + href + '">' + C.escapeHtml(pkg.title) + "</a>";
    html += '<div class="meta">' +
      (pkg.issued ? "Issued " + C.escapeHtml(C.formatDate(pkg.issued)) + " · " : "") +
      C.escapeHtml(mix.join(" · ") || "Empty") + "</div>";
    if (pkg.note) html += '<p class="note">' + C.escapeHtml(pkg.note) + "</p>";
    html += '<div class="counts"><span>' + c.total + " item" + (c.total === 1 ? "" : "s") +
      "</span><span>" + c.openNotes + " open comment" +
      (c.openNotes === 1 ? "" : "s") + "</span></div>";
    html += "</div></article>";
    return html;
  }

  // Cover art: the first image in the set, else the first PDF's page-one
  // thumbnail, so a drawings-only set still shows a real preview.
  function coverFor(pkg) {
    var image = pkg.items.filter(function (i) { return i.type === "image"; })[0];
    if (image) return window.Drive.thumbUrl(image, 900);
    var pdf = pkg.items.filter(function (i) { return i.type === "pdf" && i.id; })[0];
    return pdf ? window.Drive.thumbUrl(pdf, 900) : "";
  }
})();
