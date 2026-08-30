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

    // The master folder link (landing page only — a project-scoped page binds
    // its OWN folder link separately, since data-drive-folder always means
    // "the master folder" here).
    document.querySelectorAll("[data-drive-folder]").forEach(function (el) {
      var url = window.Drive.folderUrl(S.driveFolderId);
      if (url) el.href = url;
      else el.classList.add("is-disabled");
    });

    // Footer "Sync Drive Data" link — see config.js's syncWorkflowUrl for
    // why this is a deep link to GitHub's own "Run workflow" button rather
    // than something that fires the sync itself from here.
    document.querySelectorAll("[data-sync-workflow]").forEach(function (el) {
      if (S.syncWorkflowUrl) el.href = S.syncWorkflowUrl;
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
    var backdrop = document.getElementById("navBackdrop");

    function setOpen(open) {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    // The toggle button doubles as the close control (it morphs into an ✕
    // via CSS while open — see .nav-open .nav-toggle span) — plus a backdrop
    // tap and Escape, so there's always a way back to the page underneath
    // without having to pick a nav link just to dismiss the menu.
    toggle.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("nav-open"));
    });
    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open") && !isTyping(e.target)) {
        setOpen(false);
      }
    });
    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
  }

  // Thumbnail size control (package.html and all-files.html only — both
  // absent on every other page, so this is a no-op there). Swaps a size-*
  // class on #itemGrid, which .item-grid's --item-min custom property reads
  // to change the grid's minmax() column width — see style.css. Persisted
  // per browser, not per project, same as the Drive sidebar's open state.
  var GRID_SIZES = ["sm", "md", "lg"];
  var GRID_SIZE_KEY = "tbs-grid-size";

  function bindGridSize() {
    var grid = document.getElementById("itemGrid");
    var group = document.getElementById("gridSize");
    if (!grid || !group) return;

    function apply(size) {
      GRID_SIZES.forEach(function (s) { grid.classList.toggle("size-" + s, s === size); });
      group.querySelectorAll("[data-size]").forEach(function (btn) {
        btn.classList.toggle("is-active", btn.getAttribute("data-size") === size);
      });
    }

    var saved = null;
    try { saved = localStorage.getItem(GRID_SIZE_KEY); } catch (e) { /* private mode, etc. */ }
    apply(GRID_SIZES.indexOf(saved) !== -1 ? saved : "md");

    group.querySelectorAll("[data-size]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var size = btn.getAttribute("data-size");
        apply(size);
        try { localStorage.setItem(GRID_SIZE_KEY, size); } catch (e) { /* ignore */ }
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

  // Only ever surfaces a real problem now — a live Drive listing that failed
  // (bad key, sharing, network) — not the "this is demo/manifest content"
  // disclaimer that used to show here too; that was useful while wiring the
  // site up, but reads as noise on a site people actually review work in.
  //
  // `kind` is unused now that the demo-content message is gone, but callers
  // (landing.js, project-page.js, etc.) still pass it — kept in the
  // signature rather than touching every call site for no behavioral gain.
  function renderSetupNotice(loadResult, kind) {
    var host = document.getElementById("setupNotice");
    if (!host) return;

    var msgs = [];
    if (loadResult && loadResult.error) {
      msgs.push("<strong>Drive listing unavailable</strong> (" + escapeHtml(loadResult.error) + ").");
    }
    // .page-banner reads this to skip its own header-clearance padding when
    // the notice is already the element clearing the header — see style.css.
    document.body.classList.toggle("has-setup-notice", !!msgs.length);

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

  var TYPE_LABELS = { pdf: "PDF", video: "Video", image: "Image" };
  // The item-card type-tag label — anything not in the map (an unrecognized
  // "file" type) reads as "Image" rather than showing nothing.
  function typeLabel(type) { return TYPE_LABELS[type] || "Image"; }

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
    bindGridSize();
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
    typeLabel: typeLabel,
    toast: toast,
    copyText: copyText,
    downloadFile: downloadFile
  };
})();
