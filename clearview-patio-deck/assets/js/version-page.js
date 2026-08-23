/*
 * VERSION SUBPAGE RENDERER — drives every versions/<id>/index.html. The page
 * itself is a pure copy of versions/_template/index.html; this script figures
 * out which version it's showing from the URL (the containing folder name), so
 * no per-version HTML edits are ever needed.
 */
(function () {
  "use strict";

  var P = window.PROJECT;
  var C = window.SiteCommon;
  var id = currentVersionId();
  var v = null;

  document.addEventListener("DOMContentLoaded", init);

  function currentVersionId() {
    var parts = location.pathname.split("/").filter(Boolean);
    var last = parts[parts.length - 1];
    // ".../versions/v5/" (trailing slash, no filename) vs ".../versions/v5/index.html"
    if (last && last.indexOf(".") === -1) return last;
    return parts[parts.length - 2];
  }

  function assetUrl(rel) {
    return "./" + rel;
  }

  function init() {
    C.renderChrome(P, "../../");
    C.bindHeaderScroll();
    C.bindNavToggle();
    C.bindScrollProgress();
    C.bindReveal();
    C.bindGlobalEscape();

    window.VersionLoader.loadAll("../")
      .then(function () {
        v = window.VERSIONS[id];
        if (!v) throw new Error("Unknown version id: " + id);
        render();
        C.bindReveal(); // pick up the freshly-added image/video cards
      })
      .catch(function (err) {
        document.getElementById("versionTitle").textContent = "Version Not Found";
        document.getElementById("versionNote").textContent =
          "This version couldn't be loaded (" + err.message + "). It may not be registered in versions-index.js.";
      });
  }

  function render() {
    document.title = v.label + " — " + P.name + " | " + P.studio.name;
    document.getElementById("versionEyebrow").textContent = P.name + " — " + P.subtitle;
    document.getElementById("versionTitle").textContent = v.label;
    document.getElementById("versionNote").textContent = v.note;
    renderHeroMedia();
    renderImages();
    renderVideos();
    renderPdf();
    renderPager();
  }

  function renderHeroMedia() {
    var wrap = document.getElementById("versionHeroMedia");
    // The thumb image is always set as the background — it's the immediate
    // visual while a hero video's iframe is still loading, and the only
    // visual at all when there's no hero video configured.
    wrap.style.backgroundImage = "url('" + assetUrl(v.thumb) + "')";

    var src = C.buildYouTubeHeroSrc(v.heroPlaylistId, v.heroVideoIds, v.heroVideoId);
    if (src) {
      var iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.setAttribute("title", v.label + " hero reel");
      iframe.setAttribute("tabindex", "-1");
      wrap.appendChild(iframe);
    } else {
      wrap.classList.add("is-static");
    }
  }

  /* ---------------- Image gallery ---------------- */

  function renderImages() {
    var images = v.images || [];
    var grid = document.getElementById("imageGrid");
    var count = document.getElementById("imageCount");
    count.textContent = images.length + (images.length === 1 ? " Image" : " Images");

    images.forEach(function (img, i) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "media-card";
      card.setAttribute("data-reveal", "");
      card.innerHTML =
        '<img src="' + assetUrl(img.src) + '" alt="' + v.label + ' — ' + img.caption + '" loading="lazy">';
      card.addEventListener("click", function () { openImageLightbox(i); });
      grid.appendChild(card);
    });
  }

  var imgLightboxIndex = 0;

  function openImageLightbox(index) {
    imgLightboxIndex = index;
    renderImageLightbox();
    C.openModal(document.getElementById("lightbox"));
  }

  function renderImageLightbox() {
    var images = v.images || [];
    imgLightboxIndex = ((imgLightboxIndex % images.length) + images.length) % images.length;
    var current = images[imgLightboxIndex];
    document.getElementById("lightboxImg").src = assetUrl(current.src);
    document.getElementById("lightboxImg").alt = v.label + " — " + current.caption;
    document.getElementById("lightboxLabel").textContent =
      (imgLightboxIndex + 1) + " / " + images.length;
  }

  function bindImageLightbox() {
    var modal = document.getElementById("lightbox");
    document.getElementById("lightboxClose").addEventListener("click", function () { C.closeModal(modal); });
    modal.addEventListener("click", function (e) { if (e.target === modal) C.closeModal(modal); });
    document.getElementById("lightboxPrev").addEventListener("click", function () {
      imgLightboxIndex -= 1;
      renderImageLightbox();
    });
    document.getElementById("lightboxNext").addEventListener("click", function () {
      imgLightboxIndex += 1;
      renderImageLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "ArrowLeft") { imgLightboxIndex -= 1; renderImageLightbox(); }
      if (e.key === "ArrowRight") { imgLightboxIndex += 1; renderImageLightbox(); }
    });
  }

  /* ---------------- Video gallery ---------------- */

  function videoThumbUrl(video) {
    if (video.type === "youtube") return "https://img.youtube.com/vi/" + video.youtubeId + "/hqdefault.jpg";
    return assetUrl(video.poster || v.thumb);
  }

  function renderVideos() {
    var videos = v.videos || [];
    var section = document.getElementById("videosSection");
    if (!videos.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    var grid = document.getElementById("videoGrid");
    videos.forEach(function (vid, i) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "media-card media-card-video";
      card.setAttribute("data-reveal", "");
      card.innerHTML =
        '<img src="' + videoThumbUrl(vid) + '" alt="' + v.label + ' — ' + vid.caption + '" loading="lazy">' +
        '<span class="play-icon" aria-hidden="true"></span>' +
        '<span class="media-card-caption">' + vid.caption + "</span>";
      card.addEventListener("click", function () { openVideoLightbox(i); });
      grid.appendChild(card);
    });
  }

  function openVideoLightbox(index) {
    var video = (v.videos || [])[index];
    if (!video) return;
    var stage = document.getElementById("videoLightboxStage");
    stage.innerHTML = "";

    if (video.type === "youtube") {
      var iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube-nocookie.com/embed/" + video.youtubeId + "?autoplay=1&rel=0&modestbranding=1";
      iframe.setAttribute("allow", "autoplay; encrypted-media; fullscreen");
      iframe.setAttribute("allowfullscreen", "");
      iframe.className = "video-embed";
      stage.appendChild(iframe);
    } else {
      var player = document.createElement("video");
      player.src = assetUrl(video.src);
      if (video.poster) player.poster = assetUrl(video.poster);
      player.controls = true;
      player.autoplay = true;
      player.className = "video-embed";
      stage.appendChild(player);
    }

    document.getElementById("videoLightboxLabel").textContent = video.caption || "";
    C.openModal(document.getElementById("videoLightbox"));
  }

  function bindVideoLightbox() {
    var modal = document.getElementById("videoLightbox");
    function close() {
      C.closeModal(modal);
      document.getElementById("videoLightboxStage").innerHTML = ""; // stop playback
    }
    document.getElementById("videoLightboxClose").addEventListener("click", close);
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
  }

  /* ---------------- PDF viewer ---------------- */

  function renderPdf() {
    var section = document.getElementById("pdfSection");
    if (!v.pdf) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    var url = assetUrl(v.pdf.src);
    document.getElementById("pdfFrame").src = url;
    var downloadBtn = document.getElementById("pdfDownloadBtn");
    downloadBtn.href = url;
    downloadBtn.textContent = v.pdf.label || "Download PDF";
    downloadBtn.setAttribute(
      "download",
      (P.name + " " + v.label + " Drawing Set.pdf").replace(/\s+/g, " ")
    );
  }

  /* ---------------- Prev/next pager ---------------- */

  function renderPager() {
    var ids = window.VERSION_IDS || [];
    var pager = document.getElementById("versionPager");
    if (ids.length <= 1) {
      pager.hidden = true;
      return;
    }
    var idx = ids.indexOf(id);
    var prevId = ids[(idx - 1 + ids.length) % ids.length];
    var nextId = ids[(idx + 1) % ids.length];
    var prevV = window.VERSIONS[prevId];
    var nextV = window.VERSIONS[nextId];

    var prevLink = document.getElementById("pagerPrev");
    var nextLink = document.getElementById("pagerNext");
    prevLink.href = "../" + prevId + "/index.html";
    prevLink.querySelector(".pager-label").textContent = prevV ? prevV.label : prevId;
    nextLink.href = "../" + nextId + "/index.html";
    nextLink.querySelector(".pager-label").textContent = nextV ? nextV.label : nextId;
  }

  bindImageLightbox();
  bindVideoLightbox();
})();
