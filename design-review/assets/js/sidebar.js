/*
 * DRIVE SIDEBAR — a collapsible folder tree (project → review sets, nested
 * the same way the real Drive folders are, per folder-tree.js) as a second
 * way to get around a project besides the top nav. Every page scoped to one
 * project (project.html, package.html, all-files.html, review-log.html)
 * includes the same <aside id="driveSidebar"> markup and calls
 * SiteSidebar.render() once its project + review sets have loaded.
 */
window.SiteSidebar = (function () {
  "use strict";

  var C = window.SiteCommon;

  // A leaf (no children) opens its one review set; a folder opens the
  // aggregate "everything under here" view instead — every item from its own
  // files (if it has any directly) and every nested subfolder, flattened
  // into the same All Files grid a whole project gets, just pre-scoped.
  function hrefFor(project, node) {
    if (node.children && node.children.length) {
      return "./all-files.html?proj=" + encodeURIComponent(project.slug) +
        "&folder=" + encodeURIComponent(node.slug);
    }
    return "./package.html?proj=" + encodeURIComponent(project.slug) +
      "&p=" + encodeURIComponent(node.pkg.slug);
  }

  // Recursive: a node is a folder row (caret + label) when it has children,
  // a plain link when it's only ever a leaf set. Both are always clickable —
  // the caret only toggles the nested list, it never gates the label link
  // (a <button> can't contain an <a>, so they sit side by side, not nested).
  function renderNode(project, node, activeSlug) {
    var hasChildren = node.children && node.children.length > 0;
    var isActive = hasChildren ? node.slug === activeSlug : !!(node.pkg && node.pkg.slug === activeSlug);
    var label = '<a class="tree-label' +
      (hasChildren ? " is-folder-link" : "") + (isActive ? " is-active" : "") + '" href="' +
      C.escapeHtml(hrefFor(project, node)) + '">' + C.escapeHtml(node.title) + "</a>";

    if (!hasChildren) {
      return '<li class="tree-node"><div class="tree-row tree-row-leaf">' +
        '<span class="tree-spacer"></span>' + label + "</div></li>";
    }

    var childrenHtml = node.children.map(function (c) {
      return renderNode(project, c, activeSlug);
    }).join("");

    return '<li class="tree-node has-children is-open">' +
      '<div class="tree-row">' +
      '<button type="button" class="tree-caret" aria-expanded="true" aria-label="Collapse folder"></button>' +
      label +
      "</div>" +
      '<ul class="tree-children">' + childrenHtml + "</ul>" +
      "</li>";
  }

  function render(project, tree, activeSlug) {
    var host = document.getElementById("driveSidebar");
    if (!host) return;

    var titleEl = document.getElementById("sidebarProjectTitle");
    if (titleEl) titleEl.textContent = project.title;

    var body = document.getElementById("sidebarTree");
    if (!tree.length) {
      body.innerHTML = '<p class="sidebar-empty">No review sets yet.</p>';
      return;
    }

    body.innerHTML = '<ul class="tree-root">' +
      tree.map(function (n) { return renderNode(project, n, activeSlug); }).join("") +
      "</ul>";

    body.querySelectorAll(".tree-caret").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var node = btn.closest(".tree-node");
        var open = node.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        btn.setAttribute("aria-label", open ? "Collapse folder" : "Expand folder");
      });
    });

    // The active leaf's own row, plus every ancestor folder, so opening
    // straight into a deeply-nested set (e.g. a Review Log link) doesn't
    // land inside a tree that reads as collapsed around it.
    var activeLink = body.querySelector(".tree-label.is-active");
    if (activeLink) {
      var node = activeLink.closest(".tree-node");
      while (node) {
        node.classList.add("is-open");
        var caret = node.querySelector(":scope > .tree-row > .tree-caret");
        if (caret) caret.setAttribute("aria-expanded", "true");
        node = node.parentElement && node.parentElement.closest(".tree-node");
      }
      activeLink.scrollIntoView({ block: "nearest" });
    }
  }

  /* ── Open/closed toggle (persisted per browser, not per project) ─────── */

  var STORAGE_KEY = "tbs-sidebar-open";

  function readPreference() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; }
  }

  function savePreference(open) {
    try { localStorage.setItem(STORAGE_KEY, open ? "1" : "0"); } catch (e) { /* ignore */ }
  }

  function setOpen(open) {
    document.body.classList.toggle("sidebar-open", open);
    // The mobile hamburger nav's own toggle is a plain button too, but the
    // sidebar toggle lives inside that nav — closing it here keeps only one
    // drawer open at a time instead of stacking the sidebar on top of it.
    if (open) document.body.classList.remove("nav-open");
    var toggle = document.getElementById("sidebarToggle");
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    savePreference(open);
  }

  function bindToggle() {
    var toggle = document.getElementById("sidebarToggle");
    var backdrop = document.getElementById("sidebarBackdrop");
    var closeBtn = document.getElementById("sidebarClose");
    if (!toggle) return;

    if (readPreference()) setOpen(true);

    toggle.addEventListener("click", function () {
      setOpen(!document.body.classList.contains("sidebar-open"));
    });
    if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !C.isTyping(e.target)) setOpen(false);
    });
  }

  document.addEventListener("DOMContentLoaded", bindToggle);

  return { render: render };
})();
