/*
 * PROJECT PAGE — one project's hero, then its All Files section (same
 * toolbar/grid/viewer every project gets via ItemsGrid, just embedded here
 * instead of requiring a trip to a separate page). Reached via ?p=<slug> —
 * the same layout every single-project version of this site used to have at
 * the root, now scoped to whichever project the URL names.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var S = window.SITE;
  var project = null;

  document.addEventListener("DOMContentLoaded", function () {
    // Every other project-scoped page (package.html, all-files.html,
    // review-log.html) links back here with ?proj=, same as they use for
    // each other — ?p= is only still read as a fallback for any old link
    // built before this page matched that convention.
    var slug = param("proj") || param("p");

    window.Drive.resolveProject(slug).then(function (resolved) {
      project = resolved.project;
      C.renderSetupNotice(resolved.listResult, "projects");

      if (!project) {
        renderMissing();
        return;
      }

      // Store must be namespaced to THIS project before anything on the page
      // (or the viewer, once someone opens an item) reads or writes a
      // comment, or it would either throw (Store guards against exactly
      // that) or, worse, read another project's data if the guard were ever
      // loosened.
      window.Store.init(project.slug, project.title);
      C.initPage(project);

      renderHero();

      window.Drive.loadPackages(project.driveFolderId, project.slug).then(function (result) {
        var tree = window.Drive.buildTree(project.slug, result.packages);
        C.renderSetupNotice(result);
        window.ItemsGrid.mount({
          project: project,
          packages: result.packages,
          tree: tree,
          projects: resolved.listResult.projects,
          projectHref: function (s) { return "./project.html?proj=" + encodeURIComponent(s); }
        });
        window.SiteSidebar.render(project, tree, null);
      });
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
    document.getElementById("heroSubtitle").textContent =
      "That project doesn't exist. Pick one from the homepage.";
    document.getElementById("heroEyebrow").textContent = S.studio.name;
    document.title = "Project Not Found | " + S.studio.name;
    document.getElementById("packages").hidden = true;
  }

  /* ── Nav / links scoped to this project ───────────────────────────────── */

  // Every link to all-files.html/review-log.html in project.html's own
  // markup (nav, hero) is a bare sibling-page href with no project context
  // baked in, since the HTML is shared markup for every project — stamp the
  // resolved slug on once here, wherever such a link appears, rather than
  // hand-writing it per instance.
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
  // load live.
  function firstImage() {
    if (project.driveFolderId) return "";
    var manifest = ((window.PACKAGES || {})[project.slug] || []).map(window.Drive.normalizePackage);
    for (var i = 0; i < manifest.length; i++) {
      var hit = manifest[i].items.filter(function (it) { return it.type === "image"; })[0];
      if (hit) return window.Drive.fullUrl(hit);
    }
    return "";
  }
})();
