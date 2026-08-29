/*
 * HOMEPAGE — project overview and one card per review set.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var S = window.SITE;
  var packages = [];

  document.addEventListener("DOMContentLoaded", function () {
    C.initPage();
    renderHero();
    renderOverview();

    window.Drive.loadPackages().then(function (result) {
      packages = result.packages;
      C.renderSetupNotice(result);
      renderPackages();
    });

    // Marks made in the viewer on a package page change the comment counts on
    // each card, so recompute whenever the store reports a write.
    window.Store.subscribe(function () {
      renderPackages();
    });
  });

  /* ── Hero ──────────────────────────────────────────────────────────────── */

  function renderHero() {
    document.getElementById("heroEyebrow").textContent =
      S.studio.name + " — " + S.studio.tagline;
    document.getElementById("heroTitle").textContent = S.project.name;
    document.getElementById("heroSubtitle").textContent = S.project.subtitle;
    document.title = S.project.name + " — Design Review | " + S.studio.name;

    var media = document.getElementById("heroMedia");
    var image = firstImage() || S.fallbackHeroImage;
    if (image) media.style.backgroundImage = "url('" + image + "')";
  }

  // Prefer a real image out of the project folder so the hero shows the actual
  // work; the configured fallback covers a folder with only PDFs in it.
  function firstImage() {
    var manifest = (window.PACKAGES || []).map(window.Drive.normalizePackage);
    for (var i = 0; i < manifest.length; i++) {
      var hit = manifest[i].items.filter(function (it) { return it.type === "image"; })[0];
      if (hit) return window.Drive.fullUrl(hit);
    }
    return "";
  }

  /* ── Overview ──────────────────────────────────────────────────────────── */

  function renderOverview() {
    document.getElementById("overviewText").textContent = S.project.summary;

    var rows = [
      ["Client", S.project.client],
      ["Location", S.project.location],
      ["Scope", S.project.scope],
      ["Phase", S.project.phase],
      ["Year", S.project.year]
    ].filter(function (r) { return r[1]; });

    document.getElementById("statList").innerHTML = rows.map(function (r) {
      return '<li><span class="k">' + C.escapeHtml(r[0]) + '</span>' +
        '<span class="v">' + C.escapeHtml(r[1]) + "</span></li>";
    }).join("");
  }

  /* ── Package cards ─────────────────────────────────────────────────────── */

  function renderPackages() {
    var host = document.getElementById("packagesGrid");
    if (!host) return;

    if (!packages.length) {
      host.innerHTML = '<p class="vp-empty" style="color:var(--color-ink-soft)">No review sets yet.</p>';
      return;
    }

    host.innerHTML = packages.map(function (pkg) {
      var c = window.Store.counts(pkg.items);
      var cover = coverFor(pkg);
      var href = "./package.html?p=" + encodeURIComponent(pkg.slug);

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
    }).join("");

    C.revealWithin(host);
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
