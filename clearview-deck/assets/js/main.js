(function () {
  "use strict";

  var P = window.PROJECT;
  var C = window.SiteCommon;
  var MAX_COMPARE = 4;
  var selected = []; // ordered array of version ids
  var versionIds = []; // populated once VersionLoader resolves

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    renderStaticText();
    renderHero();
    C.bindHeaderScroll();
    C.bindSectionNavHighlight(["home", "overview", "versions", "download", "contact"]);
    C.bindNavToggle();
    C.bindScrollProgress();
    C.bindReveal();
    bindCompareBar();
    bindCompareModal();

    window.VersionLoader.loadAll("./versions/")
      .then(function (ids) {
        versionIds = ids;
        renderStats();
        renderVersions();
        C.bindReveal(); // pick up the freshly-added version cards
      })
      .catch(function (err) {
        document.getElementById("versionsGrid").textContent =
          "Couldn't load design versions (" + err.message + ").";
      });
  }

  function renderStaticText() {
    C.renderChrome(P, "./");
    document.getElementById("heroEyebrow").textContent = P.studio.name + " — " + P.studio.tagline;
    document.getElementById("heroTitle").textContent = P.name;
    document.getElementById("heroSubtitle").textContent = P.subtitle;
    document.getElementById("overviewText").textContent = P.summary;
    document.title = P.name + " — " + P.subtitle + " | " + P.studio.name;
  }

  // Plain iframe embed on youtube-nocookie.com — no external script dependency,
  // so it isn't at the mercy of ad blockers / corporate firewalls / CSP rules
  // that often block youtube.com's iframe_api script. YouTube auto-selects
  // quality (standard/auto) based on the player's rendered size and the
  // viewer's bandwidth, which for a full-viewport hero already skews high;
  // forcing a specific tier via the JS Player API was both unreliable (many
  // environments block the API script outright, breaking playback entirely)
  // and pointless (YouTube deprecated setPlaybackQuality as a no-op in 2023).
  function renderHero() {
    var wrap = document.getElementById("heroMedia");
    var src = C.buildYouTubeHeroSrc(P.heroPlaylistId, P.heroVideoIds, P.heroVideoId);
    if (src) {
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.setAttribute("title", P.name + " hero reel");
      iframe.setAttribute("tabindex", "-1");
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
      ["Concept Versions", String(versionIds.length)]
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
    versionIds.forEach(function (id) {
      var v = window.VERSIONS[id];
      if (!v) return;
      var href = "./versions/" + v.id + "/index.html";

      var card = document.createElement("article");
      card.className = "version-card";
      card.dataset.id = v.id;
      card.setAttribute("data-reveal", "");
      card.innerHTML =
        '<a class="thumb" href="' + href + '"><img src="./versions/' + v.id + '/' + v.thumb +
          '" alt="' + v.label + ' — aerial rendering" loading="lazy"></a>' +
        '<div class="body">' +
          '<a class="label" href="' + href + '">' + v.label + "</a>" +
          '<p class="note">' + v.note + "</p>" +
          '<label class="compare-toggle">' +
            '<input type="checkbox" data-compare="' + v.id + '">' +
            '<span class="box"></span> Add to Compare' +
          "</label>" +
        "</div>";

      var cb = card.querySelector('input[data-compare]');
      cb.addEventListener("click", function (e) { e.stopPropagation(); });
      cb.addEventListener("change", function () { toggleCompare(v.id, cb.checked); });

      grid.appendChild(card);
    });
  }

  function findVersion(id) {
    return window.VERSIONS[id] || null;
  }

  function versionThumbUrl(v) {
    return "./versions/" + v.id + "/" + v.thumb;
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
  }

  function renderCompareBar() {
    var bar = document.getElementById("compareBar");
    var thumbs = document.getElementById("compareThumbs");
    var count = document.getElementById("compareCount");

    thumbs.innerHTML = "";
    selected.forEach(function (id) {
      var v = findVersion(id);
      var img = document.createElement("img");
      img.src = versionThumbUrl(v);
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
        '<img src="' + versionThumbUrl(v) + '" alt="' + v.label + '">' +
        '<div class="info">' +
          '<div class="label">' + v.label + "</div>" +
          '<p class="note">' + v.note + "</p>" +
          '<a class="btn btn-outline" style="border-color:var(--color-ink-soft);color:var(--color-ink);margin-top:0.6rem;" href="./versions/' + v.id + '/index.html">Open Full Gallery</a>' +
          '<button class="remove" data-id="' + v.id + '">Remove</button>' +
        "</div>";
      col.querySelector(".remove").addEventListener("click", function () {
        toggleCompare(v.id, false);
        if (selected.length < 2) {
          C.closeModal(modal);
        } else {
          openCompareModal();
        }
      });
      cols.appendChild(col);
    });

    C.openModal(modal);
  }

  function bindCompareModal() {
    var modal = document.getElementById("compareModal");
    document.getElementById("compareModalClose").addEventListener("click", function () { C.closeModal(modal); });
    modal.addEventListener("click", function (e) { if (e.target === modal) C.closeModal(modal); });
  }

  C.bindGlobalEscape();
})();
