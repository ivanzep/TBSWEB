(function () {
  "use strict";

  var P = window.PROJECT;
  var MAX_COMPARE = 4;
  var selected = []; // ordered array of version ids

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    renderStaticText();
    renderHero();
    renderStats();
    renderVersions();
    bindHeader();
    bindNav();
    bindScrollProgress();
    bindReveal();
    bindCompareBar();
    bindCompareModal();
    bindLightbox();
    document.getElementById("footerYear").textContent = new Date().getFullYear();
  }

  function renderStaticText() {
    document.getElementById("logoName").textContent = P.studio.name;
    document.getElementById("logoTag").textContent = P.studio.tagline;
    document.getElementById("heroEyebrow").textContent = P.studio.name + " — " + P.studio.tagline;
    document.getElementById("heroTitle").textContent = P.name;
    document.getElementById("heroSubtitle").textContent = P.subtitle;
    document.getElementById("overviewText").textContent = P.summary;
    document.getElementById("footerName").textContent = P.studio.name + " · " + P.studio.tagline;
    document.title = P.name + " — " + P.subtitle + " | " + P.studio.name;

    var dl = document.getElementById("downloadBtn");
    dl.href = P.pdfDownloadUrl;
    dl.textContent = P.pdfLabel || "Download PDF";

    var drive = document.getElementById("driveBtn");
    if (P.driveFolderUrl) {
      drive.href = P.driveFolderUrl;
    } else {
      drive.style.display = "none";
    }

    var contactBtn = document.getElementById("contactBtn");
    contactBtn.href = "mailto:" + P.studio.email;
    contactBtn.textContent = "Email " + P.studio.name;
  }

  function buildHeroVideoSrc() {
    var params = "autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=1" +
      "&rel=0&playsinline=1&iv_load_policy=3&disablekb=1";

    // A real YouTube playlist loops natively via videoseries + loop=1.
    if (P.heroPlaylistId) {
      return "https://www.youtube-nocookie.com/embed/videoseries?list=" + P.heroPlaylistId + "&" + params;
    }

    // Otherwise cycle through one or more standalone video IDs. The first ID is
    // the embed path; the full ID list (including the first) goes in `playlist`,
    // which is what makes loop=1 wrap back to the start once the last one ends —
    // YouTube requires that even for a single video looping on itself.
    var ids = (P.heroVideoIds && P.heroVideoIds.length) ? P.heroVideoIds :
      (P.heroVideoId ? [P.heroVideoId] : []);
    if (!ids.length) return null;

    return "https://www.youtube-nocookie.com/embed/" + ids[0] + "?" + params +
      "&playlist=" + ids.join(",");
  }

  function renderHero() {
    var wrap = document.getElementById("heroMedia");
    var src = buildHeroVideoSrc();
    if (src) {
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.setAttribute("title", P.name + " hero reel");
      wrap.appendChild(iframe);
    } else {
      wrap.classList.add("is-static");
      wrap.style.backgroundImage = "url('" + P.heroImage + "')";
    }
  }

  function renderStats() {
    var items = [
      ["Client", P.client],
      ["Location", P.location],
      ["Scope", P.scope],
      ["Status", P.status],
      ["Concept Versions", String(P.versions.length)]
    ];
    var list = document.getElementById("statList");
    items.forEach(function (pair) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="k">' + pair[0] + '</span><span class="v">' + pair[1] + "</span>";
      list.appendChild(li);
    });
  }

  function renderVersions() {
    var grid = document.getElementById("versionsGrid");
    P.versions.forEach(function (v, i) {
      var card = document.createElement("article");
      card.className = "version-card";
      card.dataset.id = v.id;
      card.setAttribute("data-reveal", "");
      card.innerHTML =
        '<div class="thumb"><img src="' + v.thumb + '" alt="' + v.label + ' — aerial rendering" loading="lazy"></div>' +
        '<div class="body">' +
          '<div class="label">' + v.label + "</div>" +
          '<p class="note">' + v.note + "</p>" +
          '<label class="compare-toggle">' +
            '<input type="checkbox" data-compare="' + v.id + '">' +
            '<span class="box"></span> Add to Compare' +
          "</label>" +
        "</div>";

      card.querySelector(".thumb").addEventListener("click", function () {
        openLightbox(v.id, 0);
      });

      var cb = card.querySelector('input[data-compare]');
      cb.addEventListener("click", function (e) { e.stopPropagation(); });
      cb.addEventListener("change", function () { toggleCompare(v.id, cb.checked); });

      grid.appendChild(card);
    });
  }

  function findVersion(id) {
    for (var i = 0; i < P.versions.length; i++) {
      if (P.versions[i].id === id) return P.versions[i];
    }
    return null;
  }

  /* ---------------- Header / nav ---------------- */

  function bindHeader() {
    var header = document.getElementById("siteHeader");
    function onScroll() {
      if (window.scrollY > 40) header.classList.add("is-scrolled");
      else header.classList.remove("is-scrolled");
    }
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var sections = ["home", "overview", "versions", "download", "contact"]
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

  function bindNav() {
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

  /* ---------------- Compare ---------------- */

  function toggleCompare(id, isOn) {
    var idx = selected.indexOf(id);
    if (isOn && idx === -1) {
      if (selected.length >= MAX_COMPARE) {
        alert("You can compare up to " + MAX_COMPARE + " versions at a time.");
        syncCompareInputs();
        return;
      }
      selected.push(id);
    } else if (!isOn && idx !== -1) {
      selected.splice(idx, 1);
    }
    syncCompareInputs();
    renderCompareBar();
  }

  function syncCompareInputs() {
    document.querySelectorAll('input[data-compare]').forEach(function (cb) {
      var on = selected.indexOf(cb.dataset.compare) !== -1;
      cb.checked = on;
      cb.closest(".version-card").classList.toggle("is-selected", on);
    });
    var lbToggle = document.getElementById("lightboxCompareToggle");
    if (lbToggle && lbToggle.dataset.id) {
      lbToggle.checked = selected.indexOf(lbToggle.dataset.id) !== -1;
    }
  }

  function renderCompareBar() {
    var bar = document.getElementById("compareBar");
    var thumbs = document.getElementById("compareThumbs");
    var count = document.getElementById("compareCount");

    thumbs.innerHTML = "";
    selected.forEach(function (id) {
      var v = findVersion(id);
      var img = document.createElement("img");
      img.src = v.thumb;
      img.alt = v.label;
      thumbs.appendChild(img);
    });
    count.textContent = selected.length + (selected.length === 1 ? " selected" : " selected");
    bar.classList.toggle("is-visible", selected.length > 0);
  }

  function bindCompareBar() {
    document.getElementById("compareClear").addEventListener("click", function () {
      selected = [];
      syncCompareInputs();
      renderCompareBar();
    });
    document.getElementById("compareOpen").addEventListener("click", function () {
      if (selected.length < 2) {
        alert("Select at least two versions to compare.");
        return;
      }
      openCompareModal();
    });
  }

  function openCompareModal() {
    var modal = document.getElementById("compareModal");
    var cols = document.getElementById("compareColumns");
    document.getElementById("compareModalCount").textContent = selected.length;

    cols.style.gridTemplateColumns = "repeat(" + selected.length + ", 1fr)";
    cols.innerHTML = "";
    selected.forEach(function (id) {
      var v = findVersion(id);
      var col = document.createElement("div");
      col.className = "compare-col";
      col.innerHTML =
        '<img src="' + v.thumb + '" alt="' + v.label + '">' +
        '<div class="info">' +
          '<div class="label">' + v.label + "</div>" +
          '<p class="note">' + v.note + "</p>" +
          '<button class="remove" data-id="' + v.id + '">Remove</button>' +
        "</div>";
      col.querySelector(".remove").addEventListener("click", function () {
        toggleCompare(v.id, false);
        if (selected.length < 2) {
          closeModal(modal);
        } else {
          openCompareModal();
        }
      });
      cols.appendChild(col);
    });

    openModal(modal);
  }

  function bindCompareModal() {
    var modal = document.getElementById("compareModal");
    document.getElementById("compareModalClose").addEventListener("click", function () { closeModal(modal); });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(modal); });
  }

  /* ---------------- Lightbox ---------------- */

  var lightboxState = { id: null, index: 0 };

  function openLightbox(id, index) {
    lightboxState = { id: id, index: index };
    renderLightbox();
    openModal(document.getElementById("lightbox"));
  }

  function renderLightbox() {
    var v = findVersion(lightboxState.id);
    var images = v.gallery;
    lightboxState.index = ((lightboxState.index % images.length) + images.length) % images.length;
    var current = images[lightboxState.index];

    document.getElementById("lightboxImg").src = current.src;
    document.getElementById("lightboxImg").alt = v.label + " — " + current.caption;
    document.getElementById("lightboxLabel").textContent =
      v.label + " — " + current.caption + " (" + (lightboxState.index + 1) + "/" + images.length + ")";
    document.getElementById("lightboxNote").textContent = v.note;

    var toggle = document.getElementById("lightboxCompareToggle");
    toggle.dataset.id = v.id;
    toggle.checked = selected.indexOf(v.id) !== -1;
  }

  function bindLightbox() {
    var modal = document.getElementById("lightbox");
    document.getElementById("lightboxClose").addEventListener("click", function () { closeModal(modal); });
    modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(modal); });
    document.getElementById("lightboxPrev").addEventListener("click", function () {
      lightboxState.index -= 1;
      renderLightbox();
    });
    document.getElementById("lightboxNext").addEventListener("click", function () {
      lightboxState.index += 1;
      renderLightbox();
    });
    document.getElementById("lightboxCompareToggle").addEventListener("change", function (e) {
      toggleCompare(lightboxState.id, e.target.checked);
    });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeModal(modal);
      if (e.key === "ArrowLeft") { lightboxState.index -= 1; renderLightbox(); }
      if (e.key === "ArrowRight") { lightboxState.index += 1; renderLightbox(); }
    });
  }

  /* ---------------- Modal helpers ---------------- */

  function openModal(modal) {
    modal.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal(modal) {
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    document.querySelectorAll(".modal-overlay.is-open").forEach(function (m) { closeModal(m); });
  });
})();
