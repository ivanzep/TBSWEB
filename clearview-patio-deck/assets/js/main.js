(function () {
  "use strict";

  var P = window.PROJECT;
  var C = window.SiteCommon;
  var versionIds = []; // populated once VersionLoader resolves

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    renderStaticText();
    renderHero();
    C.bindHeaderScroll();
    C.bindSectionNavHighlight(["home", "versions", "download", "contact"]);
    C.bindNavToggle();
    C.bindScrollProgress();
    C.bindReveal();

    window.VersionLoader.loadAll("./versions/")
      .then(function (ids) {
        versionIds = ids;
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
        "</div>";

      grid.appendChild(card);
    });
  }

  C.bindGlobalEscape();
})();
