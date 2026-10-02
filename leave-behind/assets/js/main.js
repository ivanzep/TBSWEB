/* Renders the North County list, featured carousel, filterable project grid and project modal. */
(function () {
  var P = window.LB_PROJECTS, IMG = "./assets/img/";
  var CATS = { all: "All", hospitality: "Hospitality", multifamily: "Multi-family", residential: "Residential", masterplan: "Master plan", modular: "Modular" };
  var REGS = { all: "All regions", northcounty: "North County", colorado: "Colorado", tahoe: "Tahoe / Sierra", other: "Other" };
  var state = { cat: "all", reg: "all" };
  var lastFocus = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function hue(slug) { // stable per-project placeholder colors
    var h = 0; for (var i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360;
    return h;
  }
  function paint(node, p) {
    var h = hue(p.slug);
    node.style.setProperty("--ph-a", "hsl(" + h + ",22%,30%)");
    node.style.setProperty("--ph-b", "hsl(" + ((h + 40) % 360) + ",25%,12%)");
  }
  // load an image only if it exists; otherwise leave the placeholder
  function probe(url, ok, fail) {
    var i = new Image();
    i.onload = function () { ok(url); };
    i.onerror = function () { if (fail) fail(); };
    i.src = url;
  }
  function cover(p) { return IMG + p.slug + "/cover.jpg"; }

  // North County list
  var nc = document.getElementById("ncList");
  window.LB_NORTH_COUNTY.forEach(function (r) {
    var li = el("li", null, r[0]);
    if (r[1]) li.appendChild(el("small", null, r[1]));
    nc.appendChild(li);
  });

  function tile(p) {
    var b = el("button", "tile");
    b.type = "button";
    var img = el("div", "tile-img ph");
    img.dataset.initial = p.name.charAt(0);
    paint(img, p);
    probe(cover(p), function (u) { img.style.backgroundImage = "url('" + u + "')"; img.classList.remove("ph"); });
    var info = el("div", "tile-info");
    info.appendChild(el("h4", null, p.name));
    info.appendChild(el("span", null, p.location));
    b.appendChild(img); b.appendChild(info);
    b.setAttribute("aria-label", p.name + ", " + p.location);
    b.addEventListener("click", function () { openModal(p); });
    return b;
  }

  var featured = document.getElementById("featured");
  P.filter(function (p) { return p.featured; }).forEach(function (p) { featured.appendChild(tile(p)); });

  var grid = document.getElementById("projectGrid");
  var tiles = P.map(function (p) { var t = tile(p); t._p = p; grid.appendChild(t); return t; });

  function filterBar(id, map, key) {
    var host = document.getElementById(id);
    Object.keys(map).forEach(function (k) {
      var b = el("button", null, map[k]);
      b.type = "button";
      b.setAttribute("aria-pressed", k === state[key] ? "true" : "false");
      b.addEventListener("click", function () {
        state[key] = k;
        [].forEach.call(host.children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
        applyFilters();
      });
      host.appendChild(b);
    });
  }
  function applyFilters() {
    var n = 0;
    tiles.forEach(function (t) {
      var ok = (state.cat === "all" || t._p.category === state.cat) && (state.reg === "all" || t._p.region === state.reg);
      t.classList.toggle("out", !ok);
      if (ok) n++;
    });
    document.getElementById("projectCount").textContent = n + (n === 1 ? " project" : " projects");
  }
  filterBar("catFilters", CATS, "cat");
  filterBar("regFilters", REGS, "reg");
  applyFilters();

  // hero + portraits use images if present
  probe(IMG + "hero.jpg", function (u) {
    var h = document.getElementById("heroBg");
    h.style.backgroundImage = "url('" + u + "')"; h.classList.add("has-img");
  });
  [].forEach.call(document.querySelectorAll(".portrait"), function (n) {
    var file = n.dataset.initials === "LB" ? "lindsay-brown.jpg" : "rory-brown.jpg";
    probe(IMG + "team/" + file, function (u) { n.style.backgroundImage = "url('" + u + "')"; n.classList.add("has-img"); });
  });

  // modal
  var modal = document.getElementById("modal");
  function openModal(p) {
    lastFocus = document.activeElement;
    document.getElementById("modalMeta").textContent = CATS[p.category] + " · " + REGS[p.region];
    document.getElementById("modalTitle").textContent = p.name;
    document.getElementById("modalBlurb").textContent = p.blurb;
    var facts = document.getElementById("modalFacts"); facts.textContent = "";
    [["Location", p.location], ["Type", p.type], ["Role", p.role]].forEach(function (f) {
      facts.appendChild(el("dt", null, f[0])); facts.appendChild(el("dd", null, f[1]));
    });
    var stats = document.getElementById("modalStats"); stats.textContent = "";
    (p.stats || []).forEach(function (s) { stats.appendChild(el("li", null, s)); });
    stats.hidden = !(p.stats && p.stats.length);
    var link = document.getElementById("modalLink");
    link.hidden = !p.link;
    if (p.link) { link.href = p.link; link.textContent = p.linkLabel || "View project"; }

    var gal = document.getElementById("modalGallery"); gal.textContent = "";
    var track = el("div", "car-track"); gal.appendChild(track);
    var carousel = window.LB_carousel(gal);
    var ph = el("figure", "car-slide ph-slide"); paint(ph, p); track.appendChild(ph); carousel.refresh();
    var first = true;
    function add(u) {
      if (first) { track.textContent = ""; first = false; }
      var f = el("figure", "car-slide"), im = new Image(); im.src = u; im.alt = p.name;
      f.appendChild(im); track.appendChild(f); carousel.refresh();
    }
    probe(cover(p), function (u) {
      add(u);
      (function next(i) { // 01.jpg … 12.jpg, stop at the first gap
        if (i > 12) return;
        var u2 = IMG + p.slug + "/" + (i < 10 ? "0" : "") + i + ".jpg";
        probe(u2, function () { add(u2); next(i + 1); });
      })(1);
    });

    modal.hidden = false;
    document.body.classList.add("modal-open");
    modal.querySelector(".modal-close").focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  window.LB_observeReveals();
})();
