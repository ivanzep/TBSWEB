/*
 * SHARED SITE CHROME — header, nav, scroll progress, reveal-on-scroll and modal
 * helpers used by both the homepage (main.js) and every version subpage
 * (version-page.js). Keeping this in one place means the homepage and every
 * versions/<id>/index.html behave identically without duplicating the logic.
 */
window.SiteCommon = (function () {
  "use strict";

  // basePath: relative prefix to the site root for local asset paths stored
  // root-relative in project-data.js (e.g. "./" from the homepage, "../../"
  // from a version subpage two levels down). External URLs are untouched.
  function renderChrome(P, basePath) {
    basePath = basePath || "./";

    var logoImg = document.getElementById("logoImg");
    if (logoImg) logoImg.alt = P.studio.name + " — " + P.studio.tagline;
    document.getElementById("footerName").textContent = P.studio.name + " · " + P.studio.tagline;
    var year = document.getElementById("footerYear");
    if (year) year.textContent = new Date().getFullYear();

    var contactBtn = document.getElementById("contactBtn");
    if (contactBtn) {
      contactBtn.href = "mailto:" + P.studio.email;
      contactBtn.textContent = "Email " + P.studio.name;
    }

    var dl = document.getElementById("downloadBtn");
    if (dl) {
      dl.href = basePath + P.pdfDownloadUrl;
      dl.textContent = P.pdfLabel || "Download PDF";
    }

    var drive = document.getElementById("driveBtn");
    if (drive) {
      if (P.driveFolderUrl) drive.href = P.driveFolderUrl;
      else drive.style.display = "none";
    }
  }

  function bindHeaderScroll() {
    var header = document.getElementById("siteHeader");
    function onScroll() {
      if (window.scrollY > 40) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Highlights the nav link matching whichever section id is currently in view.
  // Homepage-only — a subpage has no in-page sections to track.
  function bindSectionNavHighlight(sectionIds) {
    var sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });

    sections.forEach(function (s) { obs.observe(s); });
  }

  function bindNavToggle() {
    var toggle = document.getElementById("navToggle");
    var links = document.querySelectorAll(".nav a");
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    links.forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    });
  }

  function bindScrollProgress() {
    var bar = document.getElementById("scrollProgress");
    function update() {
      var h = document.documentElement;
      var scrolled = h.scrollTop;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (scrolled / max) * 100 : 0) + "%";
    }
    document.addEventListener("scroll", update, { passive: true });
    update();
  }

  function bindReveal() {
    var els = document.querySelectorAll("[data-reveal]");
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { obs.observe(el); });
  }

  function openModal(modal) {
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  function bindGlobalEscape() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".modal-overlay.is-open").forEach(function (m) { closeModal(m); });
    });
  }

  // Builds a looping, muted, autoplaying YouTube embed src from the same
  // three-field shape used by both the homepage hero (project-data.js) and
  // a version's title-header hero (that version's meta.json / data.js).
  // Each argument accepts a full YouTube link or a bare ID (resolved via
  // YouTubeUrl, which must be loaded first) — checked in this priority,
  // first non-empty match wins. Returns null if none are set.
  function buildYouTubeHeroSrc(rawPlaylistId, rawVideoIds, rawVideoId) {
    var params = "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1" +
      "&rel=0&playsinline=1&iv_load_policy=3&disablekb=1";

    var playlistId = window.YouTubeUrl.parsePlaylistId(rawPlaylistId);
    if (playlistId) {
      return "https://www.youtube-nocookie.com/embed/videoseries?list=" + playlistId + "&" + params;
    }

    var raw = (rawVideoIds && rawVideoIds.length) ? rawVideoIds : (rawVideoId ? [rawVideoId] : []);
    var ids = raw.map(window.YouTubeUrl.parseVideoId).filter(Boolean);
    if (!ids.length) return null;

    return "https://www.youtube-nocookie.com/embed/" + ids[0] + "?" + params + "&playlist=" + ids.join(",");
  }

  return {
    renderChrome: renderChrome,
    bindHeaderScroll: bindHeaderScroll,
    buildYouTubeHeroSrc: buildYouTubeHeroSrc,
    bindSectionNavHighlight: bindSectionNavHighlight,
    bindNavToggle: bindNavToggle,
    bindScrollProgress: bindScrollProgress,
    bindReveal: bindReveal,
    openModal: openModal,
    closeModal: closeModal,
    bindGlobalEscape: bindGlobalEscape
  };
})();
