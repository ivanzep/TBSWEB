/*
 * ITEMS GRID — the sortable/filterable/collapsible file grid, toolbar and
 * viewer wiring shared by the All Files page and each project's own page
 * (which now shows this instead of a separate Review Sets card grid). One
 * mount() per page: the caller resolves the project/packages/tree (its own
 * ?proj=/?p= convention, its own folder-scoping if any) and hands the result
 * over; everything from the toolbar down is identical between the two.
 */
window.ItemsGrid = (function () {
  "use strict";

  var C = window.SiteCommon;

  // opts:
  //   project    resolved project ({slug, title, driveFolderId, ...})
  //   packages   this page's package list (already folder-scoped, if that's
  //              a thing the caller supports)
  //   tree       the project's FULL folder tree (see the "folder scoping"
  //              note on renderGroupNodes below — passing the full tree,
  //              not a scoped slice, is what makes scoping work at all)
  //   projects   every project, for the switcher — omit/empty to hide it
  //   projectHref(slug)  builds the URL the switcher navigates to; required
  //              whenever `projects` is given
  function mount(opts) {
    var project = opts.project;
    var packages = opts.packages || [];
    var tree = opts.tree || [];

    var typeFilter = "all";
    var commentsOnly = false;
    var setFilter = "";
    // Folder Order is the default view — it's also the grouped/collapsible
    // one, so the grid opens somewhere that reflects real Drive structure
    // rather than an arbitrary flattened list.
    var sortKey = "folder";
    var sortReverse = false;
    var searchText = "";

    // Collapse state for the grouped ("Folder Order") view, keyed by a tree
    // node's stable slug so it survives the re-renders Store.subscribe(render)
    // triggers (e.g. adding a comment elsewhere) — without this every such
    // re-render would silently re-expand any folder the user had collapsed.
    var collapsedGroups = {};

    var allItems = flatten(packages);

    // Carries pkgTitle alongside the fields Drive.normalizeItem already put on
    // the item, so a card can show which set it's from without a second lookup.
    function flatten(pkgs) {
      var out = [];
      pkgs.forEach(function (pkg) {
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
      if (!sel) return;
      packages.forEach(function (p) {
        var opt = document.createElement("option");
        opt.value = p.slug;
        opt.textContent = p.title;
        sel.appendChild(opt);
      });
    }

    // Lets a reviewer jump straight to another project's grid instead of
    // retracing back through the homepage. Hides itself when there's only
    // one project to switch to.
    function bindProjectSwitch() {
      var sel = document.getElementById("projectSwitch");
      if (!sel) return;
      var label = sel.closest("label");
      var projects = opts.projects;

      if (!projects || projects.length < 2) {
        if (label) label.hidden = true;
        return;
      }

      sel.innerHTML = projects.map(function (p) {
        return '<option value="' + C.escapeHtml(p.slug) + '">' + C.escapeHtml(p.title) + '</option>';
      }).join("");
      sel.value = project.slug;

      sel.addEventListener("change", function (e) {
        location.href = opts.projectHref(e.target.value);
      });
    }

    /* ── Filter + sort ───────────────────────────────────────────────────── */

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

    // A level of tree nodes in display order — reversed when sortReverse is on.
    // The one traversal used both to number sets (folderOrderIndex, below) and
    // to walk the tree for the grouped view's own DOM order (renderGroupNodes),
    // so the two can never disagree about "which set/folder comes first" —
    // reversing is just handing both the same mirrored tree to walk.
    function orderedNodes(nodes) {
      return sortReverse ? nodes.slice().reverse() : nodes;
    }

    // Depth-first walk of the folder tree, in the same order the sidebar
    // already renders it — a folder's own set (if it has one) before its
    // subfolders', so a set slug's position here reflects "where this set
    // actually sits in Drive," not just "which order packages.js happens to
    // list sets in" (that's what "Set Order" already gives you, and the two
    // can genuinely differ once sets get reordered or added out of folder
    // order in the source sheet).
    function folderOrderIndex() {
      var order = {};
      var i = 0;
      function walk(nodes) {
        orderedNodes(nodes).forEach(function (n) {
          if (n.pkg) order[n.pkg.slug] = i++;
          if (n.children && n.children.length) walk(n.children);
        });
      }
      walk(tree);
      return order;
    }

    function sortItems(list) {
      var copy = list.slice();
      // Flips the actual comparison only — an item missing the field being
      // sorted on (no sheet number, never modified) still sorts to the end
      // either way, rather than jumping to the front just because the button
      // was clicked.
      var dir = sortReverse ? -1 : 1;
      if (sortKey === "folder") {
        // folderOrderIndex() already numbers sets in reversed order when
        // sortReverse is on (see orderedNodes above), so no dir flip here —
        // applying one on top would reverse an already-reversed sequence.
        var order = folderOrderIndex();
        // Stable sort (guaranteed by spec in every engine this site targets)
        // keeps an item's position relative to same-set siblings, so within
        // one set the order is still that set's own item order.
        copy.sort(function (a, b) { return (order[a.pkgSlug] || 0) - (order[b.pkgSlug] || 0); });
      } else if (sortKey === "name") {
        copy.sort(function (a, b) { return dir * naturalCompare(a.name, b.name); });
      } else if (sortKey === "sheet") {
        // Items with no sheet number sort after every item that has one.
        copy.sort(function (a, b) {
          if (!a.sheet && !b.sheet) return dir * naturalCompare(a.name, b.name);
          if (!a.sheet) return 1;
          if (!b.sheet) return -1;
          return dir * naturalCompare(a.sheet, b.sheet);
        });
      } else if (sortKey === "type") {
        copy.sort(function (a, b) {
          if (a.type !== b.type) return dir * (a.type === "image" ? -1 : 1);
          return dir * naturalCompare(a.name, b.name);
        });
      } else if (sortKey === "comments") {
        copy.sort(function (a, b) {
          return dir * (window.Store.getNotes(b.uid).length - window.Store.getNotes(a.uid).length);
        });
      } else if (sortKey === "modified") {
        // ISO timestamps compare correctly as strings; items without one (the
        // common case in manifest mode, where Drive never reports a mtime) sort
        // to the end rather than bunching at whichever end string compare picks.
        copy.sort(function (a, b) {
          if (!a.modified && !b.modified) return 0;
          if (!a.modified) return 1;
          if (!b.modified) return -1;
          return dir * String(b.modified).localeCompare(String(a.modified));
        });
      } else if (sortReverse) {
        // "set" has no comparator (the flattened order already follows package
        // order, then each package's own item order) — reversing it just means
        // reversing that order outright.
        copy.reverse();
      }
      return copy;
    }

    /* ── Render ──────────────────────────────────────────────────────────── */

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
        ? '<img loading="lazy" src="' + C.escapeHtml(thumb) + '" data-fallback="' +
            C.escapeHtml(C.noPreviewLabel(item.type)) + '" alt="">'
        : '<span class="shot-empty">' + C.escapeHtml(C.noPreviewLabel(item.type)) + "</span>";
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
    // as an empty collapsible shell. This is also what makes folder-scoping
    // work for callers that pass a scoped `packages`/`allItems` alongside the
    // project's FULL `tree`: every out-of-scope branch counts zero and is
    // pruned the same way an empty one would be.
    function countUnder(node, map) {
      var n = node.pkg && map[node.pkg.slug] ? map[node.pkg.slug].length : 0;
      node.children.forEach(function (c) { n += countUnder(c, map); });
      return n;
    }

    function renderGroupNodes(nodes, map) {
      return orderedNodes(nodes).map(function (n) {
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
      C.bindThumbFallback(host);
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
      C.bindThumbFallback(host);
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

    /* ── Controls ────────────────────────────────────────────────────────── */

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
      bindProjectSwitch();

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

      var reverseBtn = document.getElementById("sortReverse");
      reverseBtn.addEventListener("click", function () {
        sortReverse = !sortReverse;
        reverseBtn.classList.toggle("is-active", sortReverse);
        reverseBtn.setAttribute("aria-pressed", sortReverse ? "true" : "false");
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
    }

    window.Viewer.init(function () { render(); });
    fillSetFilter();
    bindControls();
    render();

    // Marks made in the viewer change comment counts/badges on screen, and
    // can move an item in or out of the "With Comments" filter or sort.
    window.Store.subscribe(render);
  }

  return { mount: mount };
})();
