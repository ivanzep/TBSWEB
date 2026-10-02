/* Shared page behavior: header state, mobile nav, scroll progress, scrollspy, reveals, count-up, hero parallax. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.getElementById("siteHeader");
  var progress = document.getElementById("scrollProgress");
  var nav = document.getElementById("siteNav");
  var toggle = document.getElementById("navToggle");
  var heroBg = document.getElementById("heroBg");
  var links = [].slice.call(nav.querySelectorAll("a"));
  var lastY = 0, ticking = false;

  function setNav(open) {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  }
  toggle.addEventListener("click", function () { setNav(!header.classList.contains("nav-open")); });
  links.forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    header.classList.toggle("scrolled", y > 40);
    // hide on scroll down, show on scroll up (not while the mobile menu is open)
    header.classList.toggle("hidden", y > 400 && y > lastY + 4 && !header.classList.contains("nav-open"));
    if (y < lastY - 4 || y < 400) header.classList.remove("hidden");
    lastY = y;
    if (heroBg && !reduce && y < window.innerHeight * 1.2) heroBg.style.transform = "translate3d(0," + (y * 0.25) + "px,0)";
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  // scrollspy
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { if (s) spy.observe(s); });
  }

  // reveal + count-up
  function countUp(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || "", plain = el.dataset.format === "year";
    if (reduce) { el.textContent = (plain ? target : target.toLocaleString()) + suffix; return; }
    var start = null, dur = 1600;
    (function step(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1), v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      el.textContent = (plain ? v : v.toLocaleString()) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  window.LB_observeReveals = function (root) {
    var els = [].slice.call((root || document).querySelectorAll(".reveal:not(.in)"));
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        [].forEach.call(e.target.querySelectorAll("[data-count]"), countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  };

  // ---- lightbox: full-screen viewer for a list of image URLs ----
  var lb = document.createElement("div");
  lb.className = "lightbox"; lb.hidden = true;
  lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Image viewer");
  lb.innerHTML = '<button class="lb-close" aria-label="Close">&times;</button>' +
    '<button class="car-btn car-prev" aria-label="Previous">&#8249;</button><img alt="">' +
    '<button class="car-btn car-next" aria-label="Next">&#8250;</button><div class="lb-count"></div>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector("img"), lbCount = lb.querySelector(".lb-count"), lbList = [], lbIdx = 0, lbFrom = null;
  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    lbImg.src = lbList[lbIdx].src; lbImg.alt = lbList[lbIdx].alt || "";
    lbCount.textContent = (lbIdx + 1) + " / " + lbList.length;
  }
  function lbOpen(list, i) {
    lbList = list; lbFrom = document.activeElement; lbShow(i);
    lb.querySelectorAll(".car-btn").forEach(function (b) { b.hidden = list.length < 2; });
    lb.hidden = false; lb.querySelector(".lb-close").focus();
  }
  function lbClose() { lb.hidden = true; lbImg.src = ""; if (lbFrom) lbFrom.focus(); }
  lb.querySelector(".lb-close").addEventListener("click", lbClose);
  lb.querySelector(".car-prev").addEventListener("click", function () { lbShow(lbIdx - 1); });
  lb.querySelector(".car-next").addEventListener("click", function () { lbShow(lbIdx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) lbClose(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    e.stopImmediatePropagation();
    if (e.key === "Escape") lbClose();
    else if (e.key === "ArrowLeft") lbShow(lbIdx - 1);
    else if (e.key === "ArrowRight") lbShow(lbIdx + 1);
  }, true);

  // ---- horizontal carousel: scroll-snap track + arrows + dots; click an image to enlarge ----
  window.LB_carousel = function (root) {
    var track = root.querySelector(".car-track");
    var prev = document.createElement("button"), next = document.createElement("button"), dots = document.createElement("div");
    prev.className = "car-btn car-prev"; next.className = "car-btn car-next"; dots.className = "car-dots";
    prev.type = next.type = "button";
    prev.setAttribute("aria-label", "Previous"); next.setAttribute("aria-label", "Next");
    prev.innerHTML = "&#8249;"; next.innerHTML = "&#8250;";
    root.appendChild(prev); root.appendChild(next); root.appendChild(dots);
    root.tabIndex = 0;
    function slides() { return [].slice.call(track.children); }
    function current() {
      var s = slides(), x = track.scrollLeft, best = 0, d = Infinity;
      s.forEach(function (el, i) { var k = Math.abs(el.offsetLeft - track.offsetLeft - x); if (k < d) { d = k; best = i; } });
      return best;
    }
    function go(i) {
      var s = slides(); i = Math.max(0, Math.min(s.length - 1, i));
      track.scrollTo({ left: s[i].offsetLeft - track.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    }
    function update() {
      var n = slides().length, i = current(), atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      prev.disabled = i <= 0; next.disabled = atEnd || i >= n - 1;
      [].forEach.call(dots.children, function (b, k) { b.setAttribute("aria-current", k === (atEnd ? n - 1 : i) ? "true" : "false"); });
    }
    function refresh() {
      var n = slides().length;
      dots.textContent = "";
      dots.hidden = prev.hidden = next.hidden = n < 2;
      for (var k = 0; k < n; k++) (function (k) {
        var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Go to slide " + (k + 1));
        b.addEventListener("click", function () { go(k); }); dots.appendChild(b);
      })(k);
      update();
    }
    prev.addEventListener("click", function () { go(current() - 1); });
    next.addEventListener("click", function () { go(current() + 1); });
    track.addEventListener("scroll", function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", update);
    root.addEventListener("keydown", function (e) {
      if (e.target !== root) return;
      if (e.key === "ArrowLeft") { go(current() - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { go(current() + 1); e.preventDefault(); }
    });
    track.addEventListener("click", function (e) {
      var img = e.target.closest("img"); if (!img || img.closest(".ph-slide")) return;
      var imgs = [].slice.call(track.querySelectorAll("img"));
      lbOpen(imgs, imgs.indexOf(img));
    });
    refresh();
    return { refresh: refresh, go: go };
  };
  [].forEach.call(document.querySelectorAll("[data-carousel]"), function (c) { window.LB_carousel(c); });
  window.LB_observeReveals();
})();
