/*
 * SHEET SYNC — talks to the Google Apps Script Web App in apps-script/Code.gs
 * so the Review Log's Save/Load-to-Sheet buttons can push/pull comments
 * through a spreadsheet instead of only the manual JSON file. Entirely
 * optional: with config.js's commentsSyncUrl left blank, configured() is
 * false and review-log.js hides those two buttons — Download JSON / Import
 * Comments keep working exactly as before either way.
 *
 * POST bodies go out as text/plain rather than application/json on purpose:
 * a JSON content type makes the browser preflight the request (an OPTIONS
 * round trip first), and an Apps Script Web App has no way to answer that
 * preflight — the request would just fail. text/plain is one of the few
 * content types the CORS spec treats as "simple" and never preflights, and
 * doPost() in Code.gs parses the body as JSON regardless of what the
 * request's Content-Type header actually says.
 */
window.SheetSync = (function () {
  "use strict";

  function configured() {
    return !!(window.SITE.commentsSyncUrl && window.SITE.commentsSyncUrl.trim());
  }

  // Every response is real JSON with an `ok` flag even when Code.gs catches
  // an error — see handle_() there — so a non-ok response is a message from
  // the script itself (bad token, missing SYNC_TOKEN, …), not a network
  // failure, and worth surfacing verbatim rather than a generic "failed".
  function unwrap(res) {
    return res.json().then(function (json) {
      if (!json || !json.ok) throw new Error((json && json.error) || "Request failed.");
      return json;
    });
  }

  // `items` is the same {uid: {notes: [...]}} shape Store.exportJSON()
  // already produces — this replaces every row this project has in the
  // sheet with exactly what's passed in, so it's meant to be called with
  // the browser's FULL current comment set, not an incremental diff.
  function save(projectSlug, projectTitle, items) {
    var url = window.SITE.commentsSyncUrl;
    var body = JSON.stringify({
      action: "save",
      token: window.SITE.commentsSyncToken || "",
      project: projectSlug,
      projectTitle: projectTitle,
      items: items
    });
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: body
    }).then(unwrap);
  }

  // Resolves to an {items: {...}} payload in the same shape
  // Store.importJSON() expects — callers merge it in rather than replacing
  // local state, so a load never discards a comment already in the browser.
  function load(projectSlug) {
    var url = window.SITE.commentsSyncUrl;
    var qs = "action=load&project=" + encodeURIComponent(projectSlug) +
      "&token=" + encodeURIComponent(window.SITE.commentsSyncToken || "");
    return fetch(url + (url.indexOf("?") === -1 ? "?" : "&") + qs).then(unwrap);
  }

  return { configured: configured, save: save, load: load };
})();
