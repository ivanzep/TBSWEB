/*
 * VIEWER — the full-screen review surface.
 *
 * One overlay handles both media types, because a reviewer moving through a set
 * shouldn't have to change tools halfway: arrow through the package and each
 * item renders the right way. Images get a carousel stage with zoom, pan and
 * click-to-place markup pins; PDFs get Drive's embedded paginated viewer.
 *
 * Alongside the stage sits the review panel — comments and the note composer —
 * so a comment is made while looking at the thing it's about.
 *
 * Markup pins are stored as fractions of the image (0–1), not pixels, so a pin
 * placed on a laptop lands on the same detail on a phone. Because the pins are
 * children of the transformed image wrapper, they zoom and pan with the drawing
 * for free.
 */
window.Viewer = (function () {
  "use strict";

  var C = window.SiteCommon;

  var els = {};
  var items = [];
  var index = 0;
  var zoom = 1;
  var pan = { x: 0, y: 0 };
  // Which element applyTransform() scales — the image wrap for images, the
  // PDF/video iframe for everything else (see the comment on applyTransform()
  // below). Kept in sync with the current item at the top of render().
  var isImageItem = true;
  var markupMode = false;
  var pendingPin = null;
  var natural = { w: 0, h: 0 };
  var onChange = null;

  var MIN_ZOOM = 1;
  var MAX_ZOOM = 6;

  /* ── Setup ─────────────────────────────────────────────────────────────── */

  function init(changeCallback) {
    onChange = changeCallback || function () {};

    els.overlay = document.getElementById("viewer");
    if (!els.overlay) return;

    els.stage = document.getElementById("viewerStage");
    els.wrap = document.getElementById("viewerWrap");
    els.img = document.getElementById("viewerImg");
    els.pins = document.getElementById("viewerPins");
    els.embed = document.getElementById("viewerEmbed");
    els.frame = document.getElementById("viewerFrame");
    els.fallback = document.getElementById("viewerFallback");
    els.filmstrip = document.getElementById("viewerFilmstrip");
    els.panel = document.getElementById("viewerPanel");
    els.counter = document.getElementById("viewerCounter");
    els.title = document.getElementById("viewerTitle");
    els.markupBtn = document.getElementById("viewerMarkup");
    els.zoomBox = document.getElementById("viewerZoom");

    document.getElementById("viewerClose").addEventListener("click", close);
    document.getElementById("viewerPrev").addEventListener("click", function () { step(-1); });
    document.getElementById("viewerNext").addEventListener("click", function () { step(1); });
    els.markupBtn.addEventListener("click", toggleMarkup);
    els.panelBtn = document.getElementById("viewerPanelToggle");
    els.panelBtn.addEventListener("click", function () {
      setPanelCollapsed(!els.overlay.classList.contains("panel-collapsed"));
    });

    document.getElementById("zoomIn").addEventListener("click", function () { setZoom(zoom * 1.4); });
    document.getElementById("zoomOut").addEventListener("click", function () { setZoom(zoom / 1.4); });
    document.getElementById("zoomReset").addEventListener("click", resetZoom);

    els.img.addEventListener("load", onImageLoad);
    els.img.addEventListener("error", onImageError);
    els.wrap.addEventListener("click", onStageClick);

    bindDragPan();
    bindWheelZoom();
    bindSwipe();
    bindKeys();

    window.addEventListener("resize", fitImage);

    // A click on the backdrop closes; clicks inside the stage or panel don't.
    els.overlay.addEventListener("mousedown", function (e) {
      if (e.target === els.overlay) close();
    });
  }

  /* ── Open / close ──────────────────────────────────────────────────────── */

  function open(list, startIndex) {
    items = list || [];
    if (!items.length) return;
    index = Math.max(0, Math.min(startIndex || 0, items.length - 1));
    markupMode = false;
    // Every open starts with the review panel out of the way — the drawing
    // itself is what someone's here for; the panel is one click away
    // (Show Panel) once they're ready to comment.
    setPanelCollapsed(true);
    C.openModal(els.overlay);
    renderFilmstrip();
    render();
  }

  function close() {
    C.closeModal(els.overlay);
    // Stop the PDF from continuing to load/play behind the closed overlay.
    els.frame.src = "about:blank";
    markupMode = false;
    els.overlay.classList.remove("is-markup");
  }

  function isOpen() { return els.overlay && els.overlay.classList.contains("is-open"); }

  function step(dir) {
    if (!items.length) return;
    index = (index + dir + items.length) % items.length;
    render();
  }

  function goTo(i) {
    index = Math.max(0, Math.min(i, items.length - 1));
    render();
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  function current() { return items[index]; }

  function render() {
    var item = current();
    if (!item) return;

    // Set before resetZoom() (not after) — it calls applyTransform(),
    // which needs to already know which element it's resetting the
    // transform on for the item about to display.
    isImageItem = item.type === "image";
    resetZoom();
    pendingPin = null;

    els.counter.textContent = (index + 1) + " / " + items.length;
    els.title.textContent = item.sheet ? item.sheet + " — " + item.name : item.name;

    var isImage = isImageItem;
    els.overlay.classList.toggle("is-pdf", !isImage);
    els.markupBtn.hidden = !isImage;

    if (isImage) {
      els.embed.hidden = true;
      els.frame.src = "about:blank";
      els.stage.hidden = false;
      els.fallback.hidden = true;
      els.img.hidden = false;
      els.img.dataset.triedFallback = "";
      els.img.src = window.Drive.fullUrl(item);
      els.img.alt = item.name;
    } else {
      els.stage.hidden = true;
      els.embed.hidden = false;
      var src = window.Drive.embedUrl(item);
      // Only reassign when it actually changed — re-setting the same src
      // reloads the PDF and throws away the reader's page position.
      if (els.frame.getAttribute("data-src") !== src) {
        els.frame.setAttribute("data-src", src);
        els.frame.src = src;
      }
    }

    setMarkupMode(false);
    renderPanel();
    highlightFilmstrip();
  }

  function onImageLoad() {
    natural.w = els.img.naturalWidth || 1;
    natural.h = els.img.naturalHeight || 1;
    els.fallback.hidden = true;
    els.img.hidden = false;
    fitImage();
    renderPins();
  }

  // Drive serves the same file from two hosts and which one answers depends on
  // how the file was shared — try the second before declaring it unavailable.
  function onImageError() {
    var item = current();
    if (!item) return;
    var alt = window.Drive.fullUrlFallback(item);
    if (alt && els.img.dataset.triedFallback !== "1") {
      els.img.dataset.triedFallback = "1";
      els.img.src = alt;
      return;
    }
    els.img.hidden = true;
    els.fallback.hidden = false;
    var openHref = window.Drive.openUrl(item);
    els.fallback.innerHTML =
      "<p><strong>This image couldn't be loaded.</strong></p>" +
      "<p>If it lives in Google Drive, check that the file is shared " +
      "<em>Anyone with the link → Viewer</em>.</p>" +
      (openHref ? '<p><a class="btn btn-dark-outline" target="_blank" rel="noopener" href="' +
        C.escapeHtml(openHref) + '">Open in Drive</a></p>' : "");
  }

  // True when the layout has stacked the panel under the stage, which is also
  // when the stage row is content-sized rather than filling the viewport.
  function isStacked() {
    return window.matchMedia("(max-width: 980px)").matches;
  }

  // Sizes the wrapper to the image's contain-fit box in real pixels. Doing the
  // arithmetic here rather than leaning on object-fit means the wrapper's box is
  // exactly the image's box, which is what makes pin percentages land true.
  function fitImage() {
    if (!isOpen() || !natural.w || els.stage.hidden) return;
    var pad = 24;
    var availW = els.stage.clientWidth - pad * 2;

    // Stacked: the stage row has no height of its own to measure, so cap
    // against the viewport and hand the resulting height back to the stage.
    // Side-by-side: the stage already fills its grid cell, so measure it.
    var availH = isStacked()
      ? Math.round(window.innerHeight * 0.62)
      : els.stage.clientHeight - pad * 2;

    if (availW <= 0 || availH <= 0) return;

    var scale = Math.min(availW / natural.w, availH / natural.h);
    var w = Math.round(natural.w * scale);
    var h = Math.round(natural.h * scale);
    els.wrap.style.width = w + "px";
    els.wrap.style.height = h + "px";
    els.stage.style.height = isStacked() ? (h + pad * 2) + "px" : "";
  }

  /* ── Zoom + pan ────────────────────────────────────────────────────────── */

  function setZoom(next) {
    zoom = Math.max(MIN_ZOOM, Math.min(next, MAX_ZOOM));
    if (zoom === 1) pan = { x: 0, y: 0 };
    applyTransform();
  }

  function resetZoom() {
    zoom = 1;
    pan = { x: 0, y: 0 };
    applyTransform();
  }

  // Images pan AND zoom (drag support, wheel-zoom, markup pins that need to
  // track the transform) via els.wrap. A PDF or video has none of that — it's
  // Drive's own iframe, scrollable/interactive on its own — so it only ever
  // gets scale(), no translate, applied to the iframe itself: enough for the
  // zoom buttons and +/- keys to work there too (that's the whole fix this
  // branch exists for — Drive's own in-iframe toolbar isn't reachable on a
  // phone, so without this a mobile reviewer had no way to zoom a PDF at all).
  function applyTransform() {
    if (isImageItem) {
      els.wrap.style.transform =
        "translate(" + pan.x + "px, " + pan.y + "px) scale(" + zoom + ")";
    } else {
      els.frame.style.transform = "scale(" + zoom + ")";
    }
    els.overlay.classList.toggle("is-zoomed", zoom > 1);
    document.getElementById("zoomLevel").textContent = Math.round(zoom * 100) + "%";
    // Markers are children of the scaled wrapper, so counter-scale them to hold
    // a constant on-screen size however far the drawing is zoomed in.
    els.pins.style.setProperty("--pin-scale", 1 / zoom);
  }

  function bindWheelZoom() {
    els.stage.addEventListener("wheel", function (e) {
      if (els.stage.hidden) return;
      e.preventDefault();
      setZoom(zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    }, { passive: false });
  }

  function bindDragPan() {
    var dragging = false;
    var moved = false;
    var start = { x: 0, y: 0 };
    var origin = { x: 0, y: 0 };

    els.stage.addEventListener("mousedown", function (e) {
      if (zoom <= 1 || markupMode || els.stage.hidden) return;
      dragging = true;
      moved = false;
      start = { x: e.clientX, y: e.clientY };
      origin = { x: pan.x, y: pan.y };
      e.preventDefault();
    });

    window.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - start.x;
      var dy = e.clientY - start.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      pan = { x: origin.x + dx, y: origin.y + dy };
      applyTransform();
    });

    window.addEventListener("mouseup", function () {
      // A drag that moved must not also register as a pin placement.
      if (moved) suppressClick = true;
      dragging = false;
    });
  }

  var suppressClick = false;

  function bindSwipe() {
    var startX = 0, startY = 0, tracking = false;
    els.stage.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1 || zoom > 1) return;
      tracking = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    els.stage.addEventListener("touchend", function (e) {
      if (!tracking) return;
      tracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;
      // Horizontal intent only, so a vertical scroll never flips the sheet.
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function bindKeys() {
    document.addEventListener("keydown", function (e) {
      if (!isOpen() || C.isTyping(e.target)) return;
      if (e.key === "ArrowRight") { step(1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { step(-1); e.preventDefault(); }
      else if (e.key === "m" || e.key === "M") toggleMarkup();
      else if (e.key === "+" || e.key === "=") setZoom(zoom * 1.4);
      else if (e.key === "-" || e.key === "_") setZoom(zoom / 1.4);
      else if (e.key === "0") resetZoom();
    });
  }

  /* ── Review panel ──────────────────────────────────────────────────────── */

  function setPanelCollapsed(collapsed) {
    els.overlay.classList.toggle("panel-collapsed", collapsed);
    els.panelBtn.classList.toggle("is-active", !collapsed);
    els.panelBtn.textContent = collapsed ? "Show Panel" : "Hide Panel";
    // The stage's available width changed, so the contain-fit box has to be
    // recomputed — harmless before the first render() too, since fitImage()
    // itself no-ops until an image has actually loaded.
    fitImage();
  }

  /* ── Markup pins ───────────────────────────────────────────────────────── */

  function toggleMarkup() { setMarkupMode(!markupMode); }

  function setMarkupMode(on) {
    markupMode = !!on && current() && current().type === "image";
    els.overlay.classList.toggle("is-markup", markupMode);
    els.markupBtn.classList.toggle("is-active", markupMode);
    els.markupBtn.textContent = markupMode ? "Cancel Markup" : "Add Markup";
    if (!markupMode) {
      pendingPin = null;
      renderPins();
    }
  }

  function onStageClick(e) {
    if (suppressClick) { suppressClick = false; return; }
    if (!markupMode || els.stage.hidden) return;
    // getBoundingClientRect reflects the current zoom/pan transform, so this
    // stays correct at any magnification without unwinding the matrix by hand.
    var rect = els.wrap.getBoundingClientRect();
    var x = (e.clientX - rect.left) / rect.width;
    var y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    pendingPin = { x: round3(x), y: round3(y) };
    renderPins();
    renderPanel();
    var field = document.getElementById("noteText");
    if (field) { field.focus(); field.placeholder = "Describe the markup…"; }
  }

  function round3(n) { return Math.round(n * 1000) / 1000; }

  function renderPins() {
    var item = current();
    els.pins.innerHTML = "";
    if (!item || item.type !== "image") return;

    var notes = window.Store.getNotes(item.uid).filter(function (n) { return n.pin; });
    notes.forEach(function (note, i) {
      els.pins.appendChild(pinEl(note.pin, String(i + 1), note.resolved ? "is-resolved" : "", note.id));
    });
    if (pendingPin) els.pins.appendChild(pinEl(pendingPin, "+", "is-pending", ""));
  }

  function pinEl(pin, label, cls, noteId) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = "pin " + (cls || "");
    el.style.left = (pin.x * 100) + "%";
    el.style.top = (pin.y * 100) + "%";
    // The label lives in a span so CSS can counter-rotate it against the
    // teardrop's 45° rotation and keep the number upright.
    var span = document.createElement("span");
    span.textContent = label;
    el.appendChild(span);
    if (noteId) {
      el.title = "Jump to comment " + label;
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        var row = document.querySelector('[data-note-row="' + noteId + '"]');
        if (row) {
          row.scrollIntoView({ block: "center", behavior: "smooth" });
          row.classList.add("is-flash");
          setTimeout(function () { row.classList.remove("is-flash"); }, 1200);
        }
      });
    }
    return el;
  }

  /* ── Review panel ──────────────────────────────────────────────────────── */

  function renderPanel() {
    var item = current();
    if (!item) return;

    var state = window.Store.getItem(item.uid);
    var notes = state.notes;
    var pinNumbers = {};
    notes.filter(function (n) { return n.pin; }).forEach(function (n, i) {
      pinNumbers[n.id] = i + 1;
    });

    var html = "";

    html += '<div class="vp-head">';
    html += "<p class=\"eyebrow\">Review</p>";
    html += "<h3>" + C.escapeHtml(item.name) + "</h3>";
    if (item.sheet) html += '<p class="vp-sheet">Sheet ' + C.escapeHtml(item.sheet) + "</p>";
    if (item.note) html += '<p class="vp-note">' + C.escapeHtml(item.note) + "</p>";
    html += "</div>";

    var links = [];
    var openHref = window.Drive.openUrl(item);
    var dlHref = window.Drive.downloadUrl(item);
    if (openHref) links.push('<a target="_blank" rel="noopener" href="' + C.escapeHtml(openHref) + '">Open original</a>');
    if (dlHref) links.push('<a href="' + C.escapeHtml(dlHref) + '" download>Download</a>');
    if (links.length) html += '<div class="vp-links">' + links.join("<span>·</span>") + "</div>";

    html += '<div class="vp-notes"><span class="vp-label">Comments <em>' + notes.length + "</em></span>";
    if (!notes.length) {
      html += '<p class="vp-empty">No comments yet.' +
        (item.type === "image" ? " Use <strong>Add Markup</strong> to pin one to a spot on the image." : "") +
        "</p>";
    }
    notes.forEach(function (n) {
      html += '<div class="note' + (n.resolved ? " is-resolved" : "") +
        '" data-note-row="' + C.escapeHtml(n.id) + '">';
      html += '<div class="note-top">';
      if (pinNumbers[n.id]) html += '<span class="note-pin">' + pinNumbers[n.id] + "</span>";
      if (n.page) html += '<span class="note-page">p. ' + C.escapeHtml(n.page) + "</span>";
      html += '<span class="note-author">' + C.escapeHtml(n.author) + "</span>";
      html += '<span class="note-date">' + C.escapeHtml(C.formatDateTime(n.created)) + "</span>";
      html += "</div>";
      html += '<p class="note-text">' + C.escapeHtml(n.text) + "</p>";
      html += '<div class="note-actions">';
      html += '<button type="button" data-resolve="' + C.escapeHtml(n.id) + '">' +
        (n.resolved ? "Reopen" : "Resolve") + "</button>";
      html += '<button type="button" data-delete="' + C.escapeHtml(n.id) + '">Delete</button>';
      html += "</div></div>";
    });
    html += "</div>";

    html += '<div class="vp-compose">';
    if (pendingPin) {
      html += '<p class="vp-pinned">Markup placed — describe it below.</p>';
    }
    html += '<textarea id="noteText" rows="3" placeholder="Add a comment…"></textarea>';
    if (item.type === "pdf") {
      html += '<input id="notePage" class="vp-page-input" type="number" min="1" ' +
        'placeholder="Page # (optional)">';
    }
    html += '<button type="button" class="btn btn-primary vp-add" id="noteAdd">Add Comment</button>';
    html += "</div>";

    els.panel.innerHTML = html;
    bindPanel(item);
  }

  function bindPanel(item) {
    els.panel.querySelectorAll("[data-resolve]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.Store.toggleResolved(item.uid, btn.getAttribute("data-resolve"));
        renderPanel();
        renderPins();
        onChange();
      });
    });

    els.panel.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        window.Store.deleteNote(item.uid, btn.getAttribute("data-delete"));
        renderPanel();
        renderPins();
        highlightFilmstrip();
        onChange();
      });
    });

    var add = document.getElementById("noteAdd");
    var field = document.getElementById("noteText");
    if (add && field) {
      add.addEventListener("click", function () { submitNote(item, field); });
      // Ctrl/Cmd+Enter submits — the usual shortcut for a multi-line comment box.
      field.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submitNote(item, field);
      });
    }
  }

  function submitNote(item, field) {
    var pageField = document.getElementById("notePage");
    var note = window.Store.addNote(item.uid, {
      text: field.value,
      pin: pendingPin,
      page: pageField && pageField.value ? Number(pageField.value) : null
    });
    if (!note) { field.focus(); return; }

    pendingPin = null;
    setMarkupMode(false);
    renderPanel();
    renderPins();
    highlightFilmstrip();
    onChange();
    C.toast("Comment added");
  }

  /* ── Filmstrip ─────────────────────────────────────────────────────────── */

  function renderFilmstrip() {
    els.filmstrip.innerHTML = items.map(function (item, i) {
      var thumb = window.Drive.thumbUrl(item, 240);
      var fallback = C.escapeHtml(String(item.sheet || (i + 1)));
      var inner = thumb
        ? '<img loading="lazy" src="' + C.escapeHtml(thumb) + '" data-fallback="' + fallback + '" alt="">'
        : '<span class="film-fallback">' + fallback + "</span>";
      return '<button type="button" class="film" data-i="' + i + '" title="' +
        C.escapeHtml(item.name) + '">' + inner +
        '<span class="film-dot"></span></button>';
    }).join("");

    els.filmstrip.querySelectorAll(".film").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goTo(Number(btn.getAttribute("data-i")));
      });
    });
    // Same "Drive never actually served a thumbnail" case items-grid.js's
    // bindThumbFallback() covers for the main grid — hits video items more
    // than image/PDF ones, so worth covering here too rather than leaving a
    // broken-image icon in the strip.
    els.filmstrip.querySelectorAll("img[data-fallback]").forEach(function (img) {
      img.addEventListener("error", function () {
        var span = document.createElement("span");
        span.className = "film-fallback";
        span.textContent = img.getAttribute("data-fallback");
        img.replaceWith(span);
      }, { once: true });
    });
    highlightFilmstrip();
  }

  // The dot is a quick "has this been commented on" signal: accent while any
  // comment on the item is still unresolved, muted green once every comment on
  // it is resolved, hidden when there are no comments at all.
  function highlightFilmstrip() {
    els.filmstrip.querySelectorAll(".film").forEach(function (btn, i) {
      var active = i === index;
      btn.classList.toggle("is-active", active);
      var dot = btn.querySelector(".film-dot");
      if (dot && items[i]) {
        var notes = window.Store.getNotes(items[i].uid);
        var hasOpen = notes.some(function (n) { return !n.resolved; });
        dot.hidden = !notes.length;
        dot.style.background = hasOpen ? "var(--color-accent)" : "#5f7d4f";
      }
      if (active) {
        btn.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
      }
    });
  }

  return { init: init, open: open, close: close };
})();
