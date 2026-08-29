/*
 * SHARED SITE CHROME — header, nav, scroll progress, reveal-on-scroll, modals
 * and the small formatting helpers every page uses. Same role as the sibling
 * concept-deck sites' common.js, so the two behave identically.
 */
window.SiteCommon = (function () {
  "use strict";

  /* ── Chrome ────────────────────────────────────────────────────────────── */

  // projectMeta is optional — pages scoped to one project (project.html,
  // package.html, all-files.html, review-log.html) pass the resolved project
  // ({title, driveFolderId, ...}) once they know it; the landing page, which
  // isn't about any single project, omits it and gets studio-only chrome.
  function renderChrome(projectMeta) {
    var S = window.SITE;

    var logoImg = document.getElementById("logoImg");
    if (logoImg) logoImg.alt = S.studio.name + " — " + S.studio.tagline;

    var footerName = document.getElementById("footerName");
    if (footerName) footerName.textContent = S.studio.name + " · " + S.studio.tagline;

    var footerMeta = document.getElementById("footerMeta");
    if (footerMeta) {
      var label = projectMeta ? projectMeta.title + " Design Review" : "Design Review Projects";
      footerMeta.innerHTML = "© " + new Date().getFullYear() + " — " + escapeHtml(label);
    }

    var contactBtn = document.getElementById("contactBtn");
    if (contactBtn) {
      var subject = projectMeta ? projectMeta.title + " — design review" : "Design review";
      contactBtn.href = "mailto:" + S.studio.email + "?subject=" + encodeURIComponent(subject);
      contactBtn.textContent = "Email " + S.studio.name;
    }

    // The master folder link (landing page only — a project-scoped page binds
    // its OWN folder link separately, since data-drive-folder always means
    // "the master folder" here).
    document.querySelectorAll("[data-drive-folder]").forEach(function (el) {
      var url = window.Drive.folderUrl(S.driveFolderId);
      if (url) el.href = url;
      else el.classList.add("is-disabled");
    });
  }

  function bindHeaderScroll() {
    var header = document.getElementById("siteHeader");
    if (!header) return;
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function bindNavToggle() {
    var toggle = document.getElementById("navToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    });
  }

  function bindScrollProgress() {
    var bar = document.getElementById("scrollProgress");
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    document.addEventListener("scroll", update, { passive: true });
    update();
  }

  function bindReveal() {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach(function (el) { obs.observe(el); });
  }

  // Elements added after first paint (rendered cards, log rows) still need to
  // reveal — call this with the new subtree once it's in the DOM.
  function revealWithin(root) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    root.querySelectorAll("[data-reveal]").forEach(function (el) { obs.observe(el); });
  }

  /* ── Modals ────────────────────────────────────────────────────────────── */

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
      // Never trap someone mid-sentence in a note field.
      if (isTyping(e.target)) return;
      document.querySelectorAll(".modal-overlay.is-open").forEach(closeModal);
    });
  }

  function isTyping(el) {
    if (!el) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  /* ── Setup notice ──────────────────────────────────────────────────────── */

  // Shown whenever a Drive listing came back as manifest/demo content rather
  // than live, so a freshly cloned site (or one project within it) explains
  // what it needs instead of just looking sparse. Reads loadResult itself —
  // not a single global "is Drive configured" flag — because in a multi-
  // project site that's genuinely different per page: the master folder can
  // be unconfigured while a specific project still has its own real Drive
  // folder wired up and lists live, or vice versa.
  //
  // `kind` distinguishes what was being listed, since the fix is different:
  // "projects" (landing page, listing the master folder) vs the default,
  // "packages" (a project's own review sets).
  function renderSetupNotice(loadResult, kind) {
    var host = document.getElementById("setupNotice");
    if (!host) return;

    var msgs = [];
    if (loadResult && loadResult.source === "manifest") {
      msgs.push(kind === "projects"
        ? "<strong>Demo project.</strong> Set <code>driveFolderId</code> and " +
          "<code>driveApiKey</code> in <code>assets/js/config.js</code> to list real " +
          "projects from Drive instead of the one in <code>assets/js/projects.js</code>."
        : "<strong>Demo content.</strong> This project isn't listing live from Drive " +
          "(no <code>driveFolderId</code> on it, or no <code>driveApiKey</code> in " +
          "<code>assets/js/config.js</code>) — showing the manifest in " +
          "<code>assets/js/packages.js</code> instead.");
    }
    if (loadResult && loadResult.error) {
      msgs.push("<strong>Drive listing unavailable</strong> (" + escapeHtml(loadResult.error) + ").");
    }
    if (!msgs.length) { host.hidden = true; return; }

    host.hidden = false;
    host.innerHTML = '<div class="container"><div class="notice">' +
      msgs.map(function (m) { return "<p>" + m + "</p>"; }).join("") +
      '</div></div>';
  }

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function formatDateTime(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleString(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  }

  var toastTimer = null;
  function toast(message) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2600);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // http:// and file:// contexts have no async clipboard — fall back so the
    // export buttons still work when the site is opened straight off disk.
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (e) { reject(e); } finally { document.body.removeChild(ta); }
    });
  }

  function downloadFile(filename, text, mime) {
    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function initPage(projectMeta) {
    renderChrome(projectMeta);
    bindHeaderScroll();
    bindNavToggle();
    bindScrollProgress();
    bindReveal();
    bindGlobalEscape();
  }

  return {
    initPage: initPage,
    renderChrome: renderChrome,
    revealWithin: revealWithin,
    renderSetupNotice: renderSetupNotice,
    openModal: openModal,
    closeModal: closeModal,
    isTyping: isTyping,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    toast: toast,
    copyText: copyText,
    downloadFile: downloadFile
  };
})();
