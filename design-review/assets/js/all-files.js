/*
 * ALL FILES — every item from every review set, flattened into one grid with
 * sorting and filtering, and the same viewer used everywhere else.
 *
 * Reuses the item-card markup/CSS from a single review set's page (package-page.js)
 * almost verbatim; the one addition is a set label on each card, since items here
 * come from more than one package. Opening a card hands the viewer whatever the
 * current filter/sort produced, so arrowing through the carousel crosses set
 * boundaries instead of stopping at the one the card came from.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var project = null;
  var packages = [];
  var allItems = [];
  var tree = [];

  var typeFilter = "all";
  var commentsOnly = false;
  var setFilter = "";
  // Folder Order is the default view — it's also the grouped/collapsible
  // one, so opening this page lands somewhere that reflects real Drive
  // structure rather than an arbitrary flattened list.
  var sortKey = "folder";
  var searchText = "";

  // Collapse state for the grouped ("Folder Order") view, keyed by a tree
  // node's stable slug so it survives the re-renders Store.subscribe(render)
  // triggers (e.g. adding a comment elsewhere) — without this every such
  // re-render would silently re-expand any folder the user had collapsed.
  var collapsedGroups = {};

  document.addEventListener("DOMContentLoaded", function () {
    window.Viewer.init(function () { render(); });

    window.Drive.resolveProject(param("proj")).then(function (resolved) {
      project = resolved.project;

      if (!project) {
        C.initPage();
        var empty = document.getElementById("emptyState");
        empty.hidden = false;
        empty.textContent = "That project doesn't exist. Pick one from the homepage.";
        document.getElementById("toolbarWrap").hidden = true;
        return;
      }

      // Must happen before anything touches Store — see store.js's header.
      window.Store.init(project.slug, project.title);
      C.initPage(project);
      fixupNavLinks();
      bindDriveLink();

      window.Drive.loadPackages(project.driveFolderId, project.slug).then(function (result) {
        tree = window.Drive.buildTree(project.slug, result.packages);
        var folderSlug = param("folder");
        var folderNode = folderSlug ? window.Drive.findFolderNode(tree, folderSlug) : null;

        // A folder link scopes the grid to just that subtree; a bad/stale
        // ?folder= (or none at all) falls back to the whole project, same
        // "never come up empty" contract every other loader here follows.
        packages = folderNode ? window.Drive.packagesUnder(folderNode) : result.packages;
        applyScopeBanner(folderNode);

        C.renderSetupNotice(result);
        allItems = flatten(packages);
        fillSetFilter();
        bindControls();
        render();
        window.SiteSidebar.render(project, tree, folderNode ? folderNode.slug : null);
      });

      // Marks made in the viewer change comment counts/badges on screen, and
      // can move an item in or out of the "With Comments" filter or sort.
      window.Store.subscribe(render);
    });
  });

  function param(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  // Swaps the generic "All Files" banner for the scoped folder's own name
  // when this page was opened from a folder row in the sidebar, rather than
  // the top nav's unscoped "All Files" link.
  function applyScopeBanner(folderNode) {
    var title = folderNode ? folderNode.title : "All Files";
    document.title = title + " — " + project.title + " | " + window.SITE.studio.name;
    var eyebrowEl = document.getElementById("pageEyebrow");
    var titleEl = document.getElementById("pageTitle");
    var noteEl = document.getElementById("pageNote");
    if (eyebrowEl) eyebrowEl.textContent = folderNode ? "Drive Folder" : "Every Set, One View";
    if (titleEl) titleEl.textContent = title;
    // Only the scoped-folder case gets a note — it's genuinely useful context
    // ("you're inside a subfolder, here's what that includes"); the unscoped
    // page needs no explainer, so the element just stays hidden.
    if (noteEl) {
      if (folderNode) {
        noteEl.textContent = "Everything under this folder — its own files and every nested subfolder, together.";
        noteEl.hidden = false;
      } else {
        noteEl.hidden = true;
      }
    }
  }

  // Fragment-safe — see package-page.js's withProj for why the naive version
  // (appending after the URL as-is) breaks on a link that already carries a
  // #section, which project.html links here do.
  function withProj(url) {
    var hashIdx = url.indexOf("#");
    var base = hashIdx === -1 ? url : url.slice(0, hashIdx);
    var hash = hashIdx === -1 ? "" : url.slice(hashIdx);
    base += (base.indexOf("?") === -1 ? "?" : "&") + "proj=" + encodeURIComponent(project.slug);
    return base + hash;
  }

  function fixupNavLinks() {
    document.querySelectorAll('a[href^="./project.html"], a[href^="./review-log.html"]')
      .forEach(function (a) { a.setAttribute("href", withProj(a.getAttribute("href"))); });
  }

  function bindDriveLink() {
    var el = document.querySelector("[data-project-drive-folder]");
    if (!el) return;
    var url = window.Drive.folderUrl(project.driveFolderId);
    if (url) el.href = url;
    else el.classList.add("is-disabled");
  }

  // Carries pkgTitle alongside the fields Drive.normalizeItem already put on
  // the item, so a card can show which set it's from without a second lookup.
  function flatten(packages) {
    var out = [];
    packages.forEach(function (pkg) {
      pkg.items.forEach(function (item) {
        out.push({
          uid: item.uid,
          id: item.id,
          src: item.src,
          name: item.name,
          type: item.type,
          sheet: item.sheet,
          note: item.note,
          modified: item.modified,
          pkgSlug: item.pkgSlug,
          pkgTitle: pkg.title
        });
      });
    });
    return out;
  }

  function fillSetFilter() {
    var sel = document.getElementById("filterSet");
    packages.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.slug;
      opt.textContent = p.title;
      sel.appendChild(opt);
    });
  }

  /* ── Filter + sort ─────────────────────────────────────────────────────── */

  function visibleItems() {
    var list = allItems.filter(function (it) {
      if (typeFilter !== "all" && it.type !== typeFilter) return false;
      if (setFilter && it.pkgSlug !== setFilter) return false;
      if (commentsOnly && !window.Store.getNotes(it.uid).length) return false;
      if (searchText) {
        var hay = (it.name + " " + (it.sheet || "") + " " + it.pkgTitle).toLowerCase();
        if (hay.indexOf(searchText) === -1) return false;
      }
      return true;
    });
    return sortItems(list);
  }

  // Natural/numeric compare so "R-2" sorts before "R-10" instead of after it.
  function naturalCompare(a, b) {
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }

  // Depth-first walk of the folder tree, in the same order the sidebar and
  // the project page's grouped grid already render it — a folder's own set
  // (if it has one) before its subfolders', so a set slug's position here
  // reflects "where this set actually sits in Drive," not just "which
  // order packages.js happens to list sets in" (that's what "Set Order"
  // already gives you, and the two can genuinely differ once sets get
  // reordered or added out of folder order in the source sheet).
  function folderOrderIndex() {
    var order = {};
    var i = 0;
    function walk(nodes) {
      nodes.forEach(function (n) {
        if (n.pkg) order[n.pkg.slug] = i++;
        if (n.children && n.children.length) walk(n.children);
      });
    }
    walk(tree);
    return order;
  }

  function sortItems(list) {
    var copy = list.slice();
    if (sortKey === "folder") {
      var order = folderOrderIndex();
      // Stable sort (guaranteed by spec in every engine this site targets)
      // keeps an item's position relative to same-set siblings, so within
      // one set the order is still that set's own item order.
      copy.sort(function (a, b) { return (order[a.pkgSlug] || 0) - (order[b.pkgSlug] || 0); });
    } else if (sortKey === "name") {
      copy.sort(function (a, b) { return naturalCompare(a.name, b.name); });
    } else if (sortKey === "sheet") {
      // Items with no sheet number sort after every item that has one.
      copy.sort(function (a, b) {
        if (!a.sheet && !b.sheet) return naturalCompare(a.name, b.name);
        if (!a.sheet) return 1;
        if (!b.sheet) return -1;
        return naturalCompare(a.sheet, b.sheet);
      });
    } else if (sortKey === "type") {
      copy.sort(function (a, b) {
        if (a.type !== b.type) return a.type === "image" ? -1 : 1;
        return naturalCompare(a.name, b.name);
      });
    } else if (sortKey === "comments") {
      copy.sort(function (a, b) {
        return window.Store.getNotes(b.uid).length - window.Store.getNotes(a.uid).length;
      });
    } else if (sortKey === "modified") {
      // ISO timestamps compare correctly as strings; items without one (the
      // common case in manifest mode, where Drive never reports a mtime) sort
      // to the end rather than bunching at whichever end string compare picks.
      copy.sort(function (a, b) {
        if (!a.modified && !b.modified) return 0;
        if (!a.modified) return 1;
        if (!b.modified) return -1;
        return String(b.modified).localeCompare(String(a.modified));
      });
    }
    // "set" (default): the flattened order already follows package order,
    // then each package's own item order — nothing to do.
    return copy;
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  // Shared by both render paths below so the card markup lives in one place.
  // `i` is the item's index in the current visibleItems() result — the
  // click handler looks the item back up there, so arrowing in the viewer
  // always matches whatever's on screen, flat or grouped.
  function itemCardHtml(item, i) {
    var notes = window.Store.getNotes(item.uid);
    var open = notes.filter(function (n) { return !n.resolved; }).length;
    var thumb = window.Drive.thumbUrl(item, 800);

    // Full identity (sheet + which set, since this grid mixes sets) is
    // still one hover away via the title attribute — trimmed to just the
    // filename on screen, not lost.
    var full = (item.sheet ? item.sheet + " — " : "") + item.name + " · " + item.pkgTitle;

    var html = '<button type="button" class="item-card' +
      (item.type === "pdf" ? " is-pdf" : "") + '" data-i="' + i + '" data-reveal title="' +
      C.escapeHtml(full) + '">';
    html += '<span class="shot">';
    html += thumb
      ? '<img loading="lazy" src="' + C.escapeHtml(thumb) + '" alt="">'
      : '<span class="shot-empty">' +
          (item.type === "pdf" ? "PDF — open to view" : "No preview") + "</span>";
    html += '<span class="type-tag">' + C.typeLabel(item.type) + "</span>";
    if (notes.length) {
      html += '<span class="note-count">' + notes.length +
        (open ? " · " + open + " open" : "") + "</span>";
    }
    html += "</span>";

    html += '<span class="body"><span class="name">' + C.escapeHtml(item.name) + "</span></span>";
    html += "</button>";
    return html;
  }

  function bindItemClicks(host) {
    host.querySelectorAll(".item-card").forEach(function (card) {
      card.addEventListener("click", function () {
        // The viewer pages through exactly what's on screen, so arrowing never
        // lands on an item the active filters are hiding.
        window.Viewer.open(visibleItems(), Number(card.getAttribute("data-i")));
      });
    });
  }

  // Buckets the already-filtered-and-sorted item list by which set each item
  // belongs to, keeping each item's index in that list — since "Folder Order"
  // sorts by exactly this same set order, every bucket comes out contiguous
  // and in the right place once the tree walk below visits it.
  function groupItemsBySet(items) {
    var map = {};
    items.forEach(function (item, i) {
      (map[item.pkgSlug] = map[item.pkgSlug] || []).push({ item: item, i: i });
    });
    return map;
  }

  // Visible-item count under a node — its own set's items plus every
  // descendant's. A node with zero is skipped entirely in renderGroupNodes,
  // so a folder the active filters have emptied out doesn't still show up
  // as an empty collapsible shell.
  function countUnder(node, map) {
    var n = node.pkg && map[node.pkg.slug] ? map[node.pkg.slug].length : 0;
    node.children.forEach(function (c) { n += countUnder(c, map); });
    return n;
  }

  function renderGroupNodes(nodes, map) {
    return nodes.map(function (n) {
      return countUnder(n, map) ? renderNode(n, map) : "";
    }).join("");
  }

  function renderNode(n, map) {
    var count = countUnder(n, map);
    var collapsed = !!collapsedGroups[n.slug];
    var ownEntries = n.pkg && map[n.pkg.slug] ? map[n.pkg.slug] : [];
    var ownHtml = ownEntries.length
      ? '<div class="item-grid">' +
          ownEntries.map(function (e) { return itemCardHtml(e.item, e.i); }).join("") +
        "</div>"
      : "";

    var html = '<div class="file-group' + (collapsed ? " is-collapsed" : "") + '">';
    html += '<button type="button" class="file-group-header" data-group-toggle="' +
      C.escapeHtml(n.slug) + '">';
    html += '<span class="file-group-caret"></span>';
    html += '<span class="file-group-title">' + C.escapeHtml(n.title) + "</span>";
    html += '<span class="file-group-count">' + count + (count === 1 ? " file" : " files") + "</span>";
    html += "</button>";
    html += '<div class="file-group-body">' + ownHtml + renderGroupNodes(n.children, map) + "</div>";
    html += "</div>";
    return html;
  }

  // Every node's slug, leaves and folders alike — walked fresh on each call
  // rather than cached, since the tree itself never changes after load.
  function allNodeSlugs(nodes) {
    var acc = [];
    nodes.forEach(function (n) {
      acc.push(n.slug);
      if (n.children && n.children.length) acc = acc.concat(allNodeSlugs(n.children));
    });
    return acc;
  }

  function bindGroupToggles(host) {
    host.querySelectorAll("[data-group-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var slug = btn.getAttribute("data-group-toggle");
        collapsedGroups[slug] = !collapsedGroups[slug];
        // Toggle the class directly rather than a full re-render, so
        // collapsing one group doesn't reset scroll position or re-run
        // every other group's own toggle state for nothing.
        btn.closest(".file-group").classList.toggle("is-collapsed", collapsedGroups[slug]);
      });
    });
  }

  function renderFlat(host, items) {
    host.classList.remove("is-grouped");
    host.innerHTML = items.map(itemCardHtml).join("");
    bindItemClicks(host);
    C.revealWithin(host);
  }

  // "Folder Order" is the one sort that reflects real Drive nesting, so it
  // doubles as the grouped view — grouping under any other sort (Name,
  // Comments, Modified…) would cut across sets in a way that wouldn't read
  // as folder structure at all.
  function renderGrouped(host, items) {
    host.classList.add("is-grouped");
    var map = groupItemsBySet(items);
    host.innerHTML = renderGroupNodes(tree, map);
    bindGroupToggles(host);
    bindItemClicks(host);
    C.revealWithin(host);
  }

  function render() {
    var host = document.getElementById("itemGrid");
    var empty = document.getElementById("emptyState");
    var items = visibleItems();

    var countEl = document.getElementById("resultsCount");
    if (countEl) countEl.textContent = items.length + " file" + (items.length === 1 ? "" : "s");

    // Expand/Collapse All only mean anything in the grouped view.
    var groupToggle = document.getElementById("groupToggle");
    if (groupToggle) groupToggle.hidden = sortKey !== "folder";

    if (!items.length) {
      host.classList.remove("is-grouped");
      host.innerHTML = "";
      empty.hidden = false;
      empty.textContent = allItems.length
        ? "Nothing matches those filters."
        : "No files found yet.";
      return;
    }
    empty.hidden = true;

    if (sortKey === "folder") renderGrouped(host, items);
    else renderFlat(host, items);
  }

  /* ── Controls ──────────────────────────────────────────────────────────── */

  var TOOLBAR_OPEN_KEY = "tbs-toolbar-open";

  // Every filter/sort/view control lives behind one collapsible drawer so
  // the page opens straight into files, not a wall of controls — persisted
  // per browser (same pattern as the grid-size control and the Drive
  // sidebar's open state) so a reviewer who opens it once doesn't have to
  // every time.
  function bindToolbarToggle() {
    var toggle = document.getElementById("toolbarToggle");
    var stack = document.getElementById("toolbarStack");
    if (!toggle || !stack) return;

    function apply(open) {
      stack.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.classList.toggle("is-open", open);
    }

    var saved = null;
    try { saved = localStorage.getItem(TOOLBAR_OPEN_KEY); } catch (e) { /* private mode, etc. */ }
    apply(saved === "1");

    toggle.addEventListener("click", function () {
      var open = stack.hidden;
      apply(open);
      try { localStorage.setItem(TOOLBAR_OPEN_KEY, open ? "1" : "0"); } catch (e) { /* ignore */ }
    });
  }

  function bindControls() {
    bindToolbarToggle();

    document.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        typeFilter = btn.getAttribute("data-filter");
        document.querySelectorAll("[data-filter]").forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        render();
      });
    });

    var commentsBtn = document.getElementById("filterComments");
    commentsBtn.addEventListener("click", function () {
      commentsOnly = !commentsOnly;
      commentsBtn.classList.toggle("is-active", commentsOnly);
      render();
    });

    document.getElementById("filterSet").addEventListener("change", function (e) {
      setFilter = e.target.value;
      render();
    });

    document.getElementById("sortBy").addEventListener("change", function (e) {
      sortKey = e.target.value;
      render();
    });

    document.getElementById("expandAll").addEventListener("click", function () {
      collapsedGroups = {};
      render();
    });

    document.getElementById("collapseAll").addEventListener("click", function () {
      allNodeSlugs(tree).forEach(function (slug) { collapsedGroups[slug] = true; });
      render();
    });

    document.getElementById("filterText").addEventListener("input", function (e) {
      searchText = e.target.value.trim().toLowerCase();
      render();
    });

    document.getElementById("openFirst").addEventListener("click", function () {
      var items = visibleItems();
      if (items.length) window.Viewer.open(items, 0);
    });
  }
})();
