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
  window.LB_observeReveals();
})();
