/*
 * REVIEW LOG — every comment in one list, plus the export/import that is how
 * marks actually leave this browser and reach the studio.
 */
(function () {
  "use strict";

  var C = window.SiteCommon;
  var packages = [];

  document.addEventListener("DOMContentLoaded", function () {
    C.initPage();

    window.Drive.loadPackages().then(function (result) {
      packages = result.packages;
      C.renderSetupNotice(result);
      fillPackageFilter();
      render();
    });

    bindControls();
    window.Store.subscribe(render);
  });

  /* ── Controls ──────────────────────────────────────────────────────────── */

  function bindControls() {
    var name = document.getElementById("reviewerName");
    name.value = window.Store.getReviewer();
    // Stamped onto each new comment, so it's saved as typed rather than on submit.
    name.addEventListener("input", function () {
      window.Store.setReviewer(name.value);
    });

    ["filterPkg", "filterState", "filterText"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", render);
    });

    document.getElementById("copyMd").addEventListener("click", function () {
      var md = window.Store.exportMarkdown(packages);
      C.copyText(md).then(function () {
        C.toast("Comments copied — paste them into an email");
      }).catch(function () {
        // Clipboard blocked (permissions, or a non-secure origin) — hand over
        // the same text as a file so the export still gets out.
        C.downloadFile(fileName("md"), md, "text/markdown;charset=utf-8");
        C.toast("Clipboard unavailable — downloaded instead");
      });
    });

    document.getElementById("downloadJson").addEventListener("click", function () {
      C.downloadFile(fileName("json"), window.Store.exportJSON(), "application/json");
      C.toast("Review file downloaded");
    });

    var file = document.getElementById("importFile");
    document.getElementById("importJson").addEventListener("click", function () {
      file.click();
    });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var added = window.Store.importJSON(String(reader.result));
          C.toast(added + " comment" + (added === 1 ? "" : "s") + " imported");
          render();
        } catch (e) {
          C.toast("Couldn't read that file — " + e.message);
        }
      };
      reader.readAsText(f);
      file.value = "";
    });

    document.getElementById("clearAll").addEventListener("click", function () {
      var total = window.Store.allNotes(packages).length;
      // Destructive and unrecoverable — localStorage has no undo — so name the
      // cost and point at the export before wiping.
      var ok = confirm(
        "Delete all " + total + " comment(s) on this device?\n\n" +
        "This can't be undone. Download the JSON first if you want a copy."
      );
      if (!ok) return;
      window.Store.clearAll();
      render();
      C.toast("Review data cleared");
    });
  }

  function fileName(ext) {
    var slug = window.Drive.slugify(window.SITE.project.name);
    var day = new Date().toISOString().slice(0, 10);
    return slug + "-review-" + day + "." + ext;
  }

  function fillPackageFilter() {
    var sel = document.getElementById("filterPkg");
    packages.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.slug;
      opt.textContent = p.title;
      sel.appendChild(opt);
    });
  }

  /* ── Render ────────────────────────────────────────────────────────────── */

  function render() {
    var host = document.getElementById("logTable");
    var empty = document.getElementById("logEmpty");

    var pkgFilter = document.getElementById("filterPkg").value;
    var stateFilter = document.getElementById("filterState").value;
    var text = document.getElementById("filterText").value.trim().toLowerCase();

    var rows = window.Store.allNotes(packages).filter(function (row) {
      if (pkgFilter && row.pkg.slug !== pkgFilter) return false;
      if (stateFilter === "open" && row.note.resolved) return false;
      if (stateFilter === "resolved" && !row.note.resolved) return false;
      if (text) {
        var hay = (row.note.text + " " + row.item.name + " " + row.item.sheet +
          " " + row.note.author).toLowerCase();
        if (hay.indexOf(text) === -1) return false;
      }
      return true;
    });

    if (!rows.length) {
      host.innerHTML = "";
      empty.hidden = false;
      empty.innerHTML = window.Store.allNotes(packages).length
        ? "<p>No comments match those filters.</p>"
        : "<p>No comments yet. Open a review set, click any drawing, and add one.</p>" +
          '<p><a class="btn btn-dark-outline" href="./index.html#packages">Go to Review Sets</a></p>';
      return;
    }
    empty.hidden = true;

    host.innerHTML = rows.map(function (row) {
      var item = row.item;
      var note = row.note;
      var href = "./package.html?p=" + encodeURIComponent(row.pkg.slug) +
        "&item=" + encodeURIComponent(item.uid);

      var where = C.escapeHtml(row.pkg.title) + " › " +
        '<a href="' + href + '">' +
        C.escapeHtml(item.sheet ? item.sheet + " — " + item.name : item.name) + "</a>";

      var marker = note.pin ? "Markup" : note.page ? "Page " + note.page : "Comment";

      // Drive's thumbnail endpoint covers both images and Drive-hosted PDFs
      // (page one); a local PDF has no such endpoint and falls back to a label.
      var thumb = window.Drive.thumbUrl(item, 160);
      var thumbHtml = thumb
        ? '<img class="log-thumb" loading="lazy" src="' + C.escapeHtml(thumb) + '" alt="">'
        : '<span class="log-thumb log-thumb-empty">' +
            (item.type === "pdf" ? "PDF" : "IMG") + "</span>";

      var html = '<article class="log-row' + (note.resolved ? " is-resolved" : "") +
        '" data-reveal>';
      html += '<a class="log-thumb-link" href="' + href + '">' + thumbHtml + "</a>";
      html += "<div>";
      html += '<div class="log-where">' + where + "</div>";
      html += '<p class="log-text">' + C.escapeHtml(note.text) + "</p>";
      html += '<div class="log-meta">' + C.escapeHtml(note.author) + " · " +
        C.escapeHtml(C.formatDateTime(note.created)) + "</div>";
      html += "</div>";
      html += '<div class="log-side">';
      html += '<span class="marker">' + C.escapeHtml(marker) + "</span>";
      html += '<button type="button" class="filter-btn" data-toggle="' +
        C.escapeHtml(item.uid) + "|" + C.escapeHtml(note.id) + '">' +
        (note.resolved ? "Reopen" : "Resolve") + "</button>";
      html += "</div></article>";
      return html;
    }).join("");

    host.querySelectorAll("[data-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        // uid can itself contain a path, so split on the LAST separator — the
        // note id is generated from base36 and never contains one.
        var raw = btn.getAttribute("data-toggle");
        var cut = raw.lastIndexOf("|");
        window.Store.toggleResolved(raw.slice(0, cut), raw.slice(cut + 1));
      });
    });

    C.revealWithin(host);
  }
})();
