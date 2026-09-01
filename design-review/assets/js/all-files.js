/*
 * ALL FILES — resolves the project (and an optional ?folder= scope), then
 * hands off to ItemsGrid for the actual toolbar/grid/viewer. The one thing
 * this page adds on top of what a project page's own All Files section has
 * is that ?folder= scoping — a click on a folder row in the sidebar or a
 * project page's own grouped grid lands here, pre-scoped to that subtree.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var project = null;

  document.addEventListener("DOMContentLoaded", function () {
    window.Drive.resolveProject(param("proj")).then(function (resolved) {
      project = resolved.project;

      if (!project) {
        C.initPage();
        bindProjectSwitch(resolved.listResult.projects, null);
        var empty = document.getElementById("emptyState");
        empty.hidden = false;
        empty.textContent = "That project doesn't exist. Pick one below or from the homepage.";
        document.getElementById("toolbarWrap").hidden = true;
        return;
      }

      // Must happen before anything touches Store — see store.js's header.
      window.Store.init(project.slug, project.title);
      C.initPage(project);
      fixupNavLinks();

      window.Drive.loadPackages(project.driveFolderId, project.slug).then(function (result) {
        var tree = window.Drive.buildTree(project.slug, result.packages);
        var folderSlug = param("folder");
        var folderNode = folderSlug ? window.Drive.findFolderNode(tree, folderSlug) : null;

        // A folder link scopes the grid to just that subtree; a bad/stale
        // ?folder= (or none at all) falls back to the whole project, same
        // "never come up empty" contract every other loader here follows.
        var packages = folderNode ? window.Drive.packagesUnder(folderNode) : result.packages;
        applyScopeBanner(folderNode);

        C.renderSetupNotice(result);
        window.ItemsGrid.mount({
          project: project,
          packages: packages,
          tree: tree,
          projects: resolved.listResult.projects,
          projectHref: function (slug) { return "./all-files.html?proj=" + encodeURIComponent(slug); }
        });
        window.SiteSidebar.render(project, tree, folderNode ? folderNode.slug : null);
      });
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

  // Only reachable if listProjects() somehow comes back completely empty —
  // resolveProject() otherwise always falls back to the first project. Kept
  // for the same "never come up empty" reason that fallback exists.
  function bindProjectSwitch(projects, currentSlug) {
    var sel = document.getElementById("projectSwitch");
    if (!sel) return;
    var label = sel.closest("label");
    if (!projects || projects.length < 2) {
      if (label) label.hidden = true;
      return;
    }
    sel.innerHTML = projects.map(function (p) {
      return '<option value="' + C.escapeHtml(p.slug) + '">' + C.escapeHtml(p.title) + '</option>';
    }).join("");
    if (currentSlug) sel.value = currentSlug;
    sel.addEventListener("change", function (e) {
      location.href = "./all-files.html?proj=" + encodeURIComponent(e.target.value);
    });
  }
})();
