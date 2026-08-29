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
    renderHero();

    window.Drive.listProjects().then(function (result) {
      C.renderSetupNotice(result, "projects");
      renderProjects(result.projects);
    });
  });

  /* ── Hero ──────────────────────────────────────────────────────────────── */

  function renderHero() {
    document.getElementById("heroEyebrow").textContent = S.studio.name + " — " + S.studio.tagline;
    document.getElementById("heroTitle").textContent = "Projects";
    document.getElementById("heroSubtitle").textContent = "Design Review";
    document.title = "Projects | " + S.studio.name;

    var media = document.getElementById("heroMedia");
    if (S.fallbackHeroImage) media.style.backgroundImage = "url('" + S.fallbackHeroImage + "')";
  }

  /* ── Project cards ─────────────────────────────────────────────────────── */

  // Reuses the review-set card's own markup/classes (.pkg-card) rather than a
  // parallel component — a project card and a review-set card are the same
  // shape (thumbnail, title, a couple of meta lines, a note, a link deeper),
  // so there's nothing a new class would do that this doesn't already do.
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
      var href = "./project.html?p=" + encodeURIComponent(p.slug);
      var cover = p.thumbnail || "";

      var meta = [p.client, p.location].filter(Boolean).join(" · ");

      var html = '<article class="pkg-card" data-reveal>';
      html += '<a class="thumb" href="' + href + '">' + (cover
        ? '<img loading="lazy" src="' + C.escapeHtml(cover) + '" alt="">'
        : '<span class="thumb-empty">No preview</span>') + "</a>";
      html += '<div class="body">';
      html += '<a class="label" href="' + href + '">' + C.escapeHtml(p.title) + "</a>";
      if (meta) html += '<div class="meta">' + C.escapeHtml(meta) + "</div>";
      if (p.summary) html += '<p class="note">' + C.escapeHtml(truncate(p.summary, 160)) + "</p>";
      html += "</div></article>";
      return html;
    }).join("");

    C.revealWithin(host);
  }

  function truncate(text, max) {
    if (text.length <= max) return text;
    return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }
})();
