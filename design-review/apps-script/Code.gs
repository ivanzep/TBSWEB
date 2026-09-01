/**
 * DESIGN REVIEW — COMMENTS SYNC
 *
 * Backs the site's "Save to Sheet" / "Load from Sheet" buttons (Review Log
 * page, see assets/js/sheet-sync.js). Deploy this as a Web App bound to a
 * spreadsheet and paste the deployment URL into config.js's
 * commentsSyncUrl — see design-review/README.md → "Saving comments to a
 * spreadsheet" for the full setup walkthrough.
 *
 * Sheet layout (one sheet, header row created automatically on first use):
 *   Project Slug | Project Title | Item UID | Note ID | Text | Author |
 *   Created | Resolved | Pin X | Pin Y | Page
 *
 * One row per comment/markup. A "save" replaces every row for the given
 * project with whatever the browser currently holds — the same "export the
 * full current state" semantics Download JSON already has, just going to a
 * sheet instead of a file, so there's no incremental-diff logic to get
 * wrong. A "load" hands the project's rows back as the same {items: {...}}
 * shape Store.importJSON() already merges by note id, so loading twice (or
 * loading on top of newer local edits) never duplicates or overwrites
 * anything already in the browser — it only ever adds notes the browser
 * doesn't have yet.
 *
 * Every request must carry a token matching the SYNC_TOKEN Script
 * Property (Project Settings → Script Properties in the Apps Script
 * editor — not a value in this file, so it isn't sitting in source
 * control). This is a spam deterrent, not real access control: the token
 * ships in the site's public client-side JS like any browser value, so
 * anyone who opens dev tools can read it. It's here to stop a bot that
 * stumbles on the Web App URL from writing junk into the sheet, not to
 * gate who can see real comments — anyone who already has the site's URL
 * can already see everything on it. If SYNC_TOKEN isn't set at all, every
 * request is rejected (fail closed, not fail open).
 */

var SHEET_NAME = "Comments";
var HEADER = [
  "Project Slug", "Project Title", "Item UID", "Note ID", "Text", "Author",
  "Created", "Resolved", "Pin X", "Pin Y", "Page"
];

function doGet(e) {
  return handle_(e, "GET");
}

function doPost(e) {
  return handle_(e, "POST");
}

function handle_(e, method) {
  try {
    var params = method === "POST" ? parseBody_(e) : (e.parameter || {});
    checkToken_(params.token);

    var action = params.action;
    if (action === "load") {
      return respond_({ ok: true, items: loadItems_(requireProject_(params.project)) });
    }
    if (action === "save") {
      var saved = saveItems_(requireProject_(params.project), params.projectTitle || "", params.items || {});
      return respond_({ ok: true, saved: saved });
    }
    return respond_({ ok: false, error: "Unknown action \"" + action + "\" — expected load or save." });
  } catch (err) {
    return respond_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

// POST bodies arrive as text/plain (see sheet-sync.js for why — it dodges a
// CORS preflight Apps Script can't answer) so the real JSON is always in
// postData.contents regardless of what Content-Type the request declared.
function parseBody_(e) {
  if (!e.postData || !e.postData.contents) throw new Error("Missing request body.");
  var parsed = JSON.parse(e.postData.contents);
  if (!parsed || typeof parsed !== "object") throw new Error("Request body isn't a JSON object.");
  return parsed;
}

function requireProject_(slug) {
  slug = String(slug || "").trim();
  if (!slug) throw new Error("Missing project.");
  return slug;
}

function checkToken_(token) {
  var expected = PropertiesService.getScriptProperties().getProperty("SYNC_TOKEN");
  if (!expected) throw new Error("SYNC_TOKEN Script Property isn't set — see Code.gs's header comment.");
  if (String(token || "") !== expected) throw new Error("Bad or missing token.");
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ── Sheet access ──────────────────────────────────────────────────────── */

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// [slug, title, uid, id, text, author, created, resolved, pinX, pinY, page]
// for every note under a project, in the same "own the whole write" shape
// both saveItems_ and loadItems_ work with.
function readRows_(sheet) {
  var values = sheet.getDataRange().getValues();
  values.shift(); // header
  return values;
}

function loadItems_(projectSlug) {
  var rows = readRows_(getSheet_());
  var items = {};
  rows.forEach(function (row) {
    if (String(row[0]) !== projectSlug) return;
    var uid = String(row[2]);
    if (!items[uid]) items[uid] = { notes: [] };
    items[uid].notes.push({
      id: String(row[3]),
      text: String(row[4]),
      author: String(row[5]),
      created: row[6] instanceof Date ? row[6].toISOString() : String(row[6]),
      resolved: row[7] === true || row[7] === "TRUE",
      pin: (row[8] !== "" && row[8] !== null && row[9] !== "" && row[9] !== null)
        ? { x: Number(row[8]), y: Number(row[9]) } : null,
      page: (row[10] !== "" && row[10] !== null) ? Number(row[10]) : null
    });
  });
  return items;
}

// Replaces every row belonging to `projectSlug` with the notes in `items`
// (the same {uid: {notes: [...]}} shape Store.exportJSON() produces) —
// a full resync of this one project's rows, every other project's rows
// left untouched. Locked so two people saving at the same moment can't
// interleave their writes into a half-and-half mess.
function saveItems_(projectSlug, projectTitle, items) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet_();
    var rows = readRows_(sheet);
    var kept = rows.filter(function (row) { return String(row[0]) !== projectSlug; });

    var added = [];
    Object.keys(items).forEach(function (uid) {
      var notes = (items[uid] && items[uid].notes) || [];
      notes.forEach(function (n) {
        added.push([
          projectSlug,
          projectTitle,
          uid,
          n.id || "",
          n.text || "",
          n.author || "",
          n.created || "",
          !!n.resolved,
          n.pin ? n.pin.x : "",
          n.pin ? n.pin.y : "",
          n.page != null ? n.page : ""
        ]);
      });
    });

    sheet.clearContents();
    sheet.appendRow(HEADER);
    var all = kept.concat(added);
    if (all.length) sheet.getRange(2, 1, all.length, HEADER.length).setValues(all);
    sheet.setFrozenRows(1);

    return added.length;
  } finally {
    lock.releaseLock();
  }
}
