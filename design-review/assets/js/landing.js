/*
 * LANDING PAGE — the site root. Lists every project as a card; each one links
 * to its own project.html, which is where the familiar single-project layout
 * (overview, review sets grid, drive link) lives, scoped to that project.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var S = window.SITE;

  document.addEventListener("DOMContentLoaded", function () {
    C.initPage(); // no projectMeta — this page isn't about any one project
    document.title = "Projects | " + S.studio.name;

    window.Drive.listProjects().then(function (result) {
      C.renderSetupNotice(result, "projects");
      renderProjects(result.projects);
    });
  });

  /* ── Project cards ─────────────────────────────────────────────────────── */

  // Reuses the review-set card's own markup/classes (.pkg-card) rather than a
  // parallel component — same shape (thumbnail, a link deeper), just with the
  // meta/note lines a review-set card can have left out: this is an internal
  // team tool, so a project card is a thumbnail and a name, nothing else.
  function renderProjects(projects) {
    var host = document.getElementById("projectsGrid");
    if (!host) return;

    if (!projects.length) {
      host.innerHTML = '<p class="vp-empty" style="color:var(--color-ink-soft)">' +
        "No projects yet — add a subfolder to the Drive folder, or list one in " +
        "<code>assets/js/projects.js</code>.</p>";
      return;
    }

    host.innerHTML = projects.map(function (p) {
      var href = "./project.html?proj=" + encodeURIComponent(p.slug);
      var cover = p.thumbnail || "";

      var html = '<article class="pkg-card" data-reveal>';
      html += '<a class="thumb" href="' + href + '">' + (cover
        ? '<img loading="lazy" src="' + C.escapeHtml(cover) + '" alt="">'
        : '<span class="thumb-empty">No preview</span>') + "</a>";
      html += '<div class="body">';
      html += '<a class="label" href="' + href + '">' + C.escapeHtml(p.title) + "</a>";
      html += "</div></article>";
      return html;
    }).join("");

    C.revealWithin(host);
  }
})();
