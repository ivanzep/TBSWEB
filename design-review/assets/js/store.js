/*
 * REVIEW STORE — comments and image markups.
 *
 * The single source of truth is always the reviewer's own browser
 * (localStorage) — every read in this file comes from there, and every
 * write lands there first, synchronously, before anything else happens.
 * Nothing here ever blocks on the network. On top of that local copy, when
 * config.js's commentsSyncUrl is set (see sheet-sync.js), two things happen
 * automatically:
 *
 *   - init() kicks off a background pull of that project's rows from the
 *     sheet and merges in whatever the browser doesn't already have — so
 *     opening any page picks up comments left by someone else, or by this
 *     same person on another device.
 *   - Every addNote/updateNote/deleteNote/toggleResolved schedules a
 *     debounced push of the whole project back to the sheet a couple
 *     seconds later, so a comment doesn't sit only-local for long.
 *
 * Without commentsSyncUrl configured, none of that runs — comments are
 * private to that person, that browser, and that project, shared only by
 * the Review Log's manual exports, exactly as before.
 *
 * Everything is filed under an item's uid (see Drive.normalizeItem), so notes
 * survive reordering a package, renaming a file, or switching between the
 * manifest and live folder mode — as long as the Drive ID stays the same.
 *
 * Multi-project isolation: package.html/all-files.html/review-log.html are
 * shared page templates for every project — a URL query param picks which
 * project, not a distinct file per project — so the OLD scheme (namespace the
 * localStorage key off the URL path) would have every project sharing one
 * key and every comment landing in one pool. Instead the current project's
 * slug must be handed in explicitly via init(), which every page calls right
 * after it resolves which project it's on and before touching anything else
 * here. Calling any other method first throws, on purpose — a silent generic
 * namespace would look like it worked while quietly mixing every project's
 * comments together, which is exactly the bug this exists to prevent.
 */
window.Store = (function () {
  "use strict";

  var VERSION = 1;
  var KEY = null;
  var projectSlug = null;
  var projectTitle = "";

  var listeners = [];
  var state = null;

  /* ── Namespace ─────────────────────────────────────────────────────────── */

  function init(slug, title) {
    projectSlug = slug;
    KEY = "tbs-design-review:" + (slug || "project");
    projectTitle = title || slug || "Project";
    state = load();
    listeners.forEach(function (fn) { fn(state); });
    loadFromSheet();
  }

  function requireInit() {
    if (state === null) {
      throw new Error("Store.init(projectSlug, title) must be called before use.");
    }
  }

  /* ── Sheet sync (optional — see the header comment above) ─────────────── */

  function syncEnabled() {
    return !!(window.SheetSync && window.SheetSync.configured());
  }

  // Runs once per init(), in the background — never blocks the page, and a
  // failure (offline, bad token, sheet not deployed yet) is swallowed rather
  // than shown, the same "this is best-effort infrastructure, not a user
  // action" treatment a failed save gets below. The buttons on the Review
  // Log page still surface errors when someone explicitly clicks them.
  function loadFromSheet() {
    if (!syncEnabled()) return;
    window.SheetSync.load(projectSlug).then(function (res) {
      // save(), not scheduleSync() — echoing straight back out what was
      // just pulled in would double every page load's network traffic
      // against a quota-limited endpoint for no reason; the sheet already
      // has this data, that's where it came from.
      if (mergeItems(res.items || {})) save();
    }).catch(function () { /* best-effort — see comment above */ });
  }

  var SYNC_DEBOUNCE_MS = 1500;
  var syncTimer = null;

  // Debounced so resolving five comments in a row, or a fast typing-then-
  // submitting session, collapses into one push instead of one per action —
  // a save always sends the WHOLE project's current items (see
  // sheet-sync.js), so there's nothing to gain from sending it more often
  // than that. Deliberately not called from setReviewer (fires on every
  // keystroke in the name field, not a comment) or clearAll (a LOCAL wipe —
  // echoing it out would delete everyone else's comments from the shared
  // sheet too).
  function scheduleSync() {
    if (!syncEnabled()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      window.SheetSync.save(projectSlug, projectTitle, state.items)
        .catch(function () { /* best-effort — see loadFromSheet() above */ });
    }, SYNC_DEBOUNCE_MS);
  }

  /* ── Persistence ───────────────────────────────────────────────────────── */

  function blank() {
    return { version: VERSION, reviewer: "", items: {} };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return blank();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return blank();
      parsed.items = parsed.items || {};
      parsed.reviewer = parsed.reviewer || "";
      return parsed;
    } catch (e) {
      // Private-browsing modes and blocked site data both throw here. Falling
      // back to in-memory state keeps the site fully usable for the session.
      return blank();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable or full — session-only, as above */ }
    listeners.forEach(function (fn) { fn(state); });
  }

  // Subscribers survive a later init() (a re-render callback registered once
  // at page load), so this doesn't require init() to have run yet.
  function subscribe(fn) { listeners.push(fn); }

  /* ── Items ─────────────────────────────────────────────────────────────── */

  function entry(uid) {
    requireInit();
    if (!state.items[uid]) state.items[uid] = { notes: [] };
    if (!state.items[uid].notes) state.items[uid].notes = [];
    return state.items[uid];
  }

  function getItem(uid) {
    requireInit();
    var e = state.items[uid];
    return { notes: (e && e.notes) || [] };
  }

  function getNotes(uid) { return getItem(uid).notes.slice(); }

  /* ── Notes + markups ───────────────────────────────────────────────────── */

  // A note with `pin` is a markup: pin.x / pin.y are fractions of the image's
  // displayed size (0–1), so the pin lands in the same spot on the drawing at
  // any screen size or zoom level. A note without a pin is a general comment;
  // on a PDF it can carry a `page` instead.
  function addNote(uid, fields) {
    requireInit();
    var note = {
      id: "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: String(fields.text || "").trim(),
      author: state.reviewer || "Reviewer",
      created: new Date().toISOString(),
      pin: fields.pin || null,
      page: fields.page || null,
      resolved: false
    };
    if (!note.text) return null;
    entry(uid).notes.push(note);
    save();
    scheduleSync();
    return note;
  }

  function updateNote(uid, noteId, patch) {
    var notes = entry(uid).notes;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].id === noteId) {
        Object.keys(patch).forEach(function (k) { notes[i][k] = patch[k]; });
        save();
        scheduleSync();
        return notes[i];
      }
    }
    return null;
  }

  function deleteNote(uid, noteId) {
    var e = entry(uid);
    e.notes = e.notes.filter(function (n) { return n.id !== noteId; });
    save();
    scheduleSync();
  }

  function toggleResolved(uid, noteId) {
    var notes = entry(uid).notes;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].id === noteId) {
        notes[i].resolved = !notes[i].resolved;
        save();
        scheduleSync();
        return notes[i];
      }
    }
    return null;
  }

  /* ── Reviewer ──────────────────────────────────────────────────────────── */

  function getReviewer() { requireInit(); return state.reviewer; }

  function setReviewer(name) {
    requireInit();
    state.reviewer = String(name || "").trim();
    save();
  }

  /* ── Roll-ups ──────────────────────────────────────────────────────────── */

  // Comment tallies across a list of items, for the package cards.
  function counts(items) {
    var out = { total: items.length, notes: 0, openNotes: 0 };
    items.forEach(function (it) {
      var e = getItem(it.uid);
      out.notes += e.notes.length;
      out.openNotes += e.notes.filter(function (n) { return !n.resolved; }).length;
    });
    return out;
  }

  // Every note across every package, newest first, joined back to its item so
  // the Review Log can show what each comment is actually attached to.
  function allNotes(packages) {
    var rows = [];
    packages.forEach(function (pkg) {
      pkg.items.forEach(function (item) {
        getItem(item.uid).notes.forEach(function (note) {
          rows.push({ note: note, item: item, pkg: pkg });
        });
      });
    });
    rows.sort(function (a, b) {
      return String(b.note.created).localeCompare(String(a.note.created));
    });
    return rows;
  }

  /* ── Export / import ───────────────────────────────────────────────────── */

  function exportJSON() {
    requireInit();
    return JSON.stringify({
      version: VERSION,
      project: projectTitle,
      reviewer: state.reviewer,
      exported: new Date().toISOString(),
      items: state.items
    }, null, 2);
  }

  // Shared by importJSON (a file someone hands you) and loadFromSheet (the
  // background pull above) — merges an {items: {...}} map in rather than
  // replacing: two reviewers' comment sets combine instead of one
  // overwriting the other, de-duplicated by note id. Doesn't call save()
  // itself; callers decide when (loadFromSheet batches it with the rest of
  // its own bookkeeping).
  function mergeItems(incomingItems) {
    var added = 0;
    Object.keys(incomingItems || {}).forEach(function (uid) {
      var incoming = incomingItems[uid] || {};
      var mine = entry(uid);
      var seen = {};
      mine.notes.forEach(function (n) { seen[n.id] = true; });
      (incoming.notes || []).forEach(function (n) {
        if (n && n.id && !seen[n.id]) { mine.notes.push(n); added++; }
      });
      mine.notes.sort(function (a, b) {
        return String(a.created).localeCompare(String(b.created));
      });
    });
    return added;
  }

  function importJSON(text) {
    var data = JSON.parse(text);
    if (!data || !data.items) throw new Error("Not a review export — no items found.");
    var added = mergeItems(data.items);
    save();
    scheduleSync();
    return added;
  }

  // Plain-text roll-up for pasting into an email or a meeting agenda — the
  // format most likely to actually get read by everyone on the project.
  function exportMarkdown(packages) {
    requireInit();
    var lines = [];
    lines.push("# " + projectTitle + " — Design Review Comments");
    lines.push("");
    lines.push("Reviewer: " + (state.reviewer || "—"));
    lines.push("Exported: " + new Date().toLocaleString());
    lines.push("");

    var any = false;
    packages.forEach(function (pkg) {
      var withNotes = pkg.items.filter(function (it) { return getItem(it.uid).notes.length; });
      if (!withNotes.length) return;
      any = true;
      lines.push("## " + pkg.title + (pkg.issued ? " (issued " + pkg.issued + ")" : ""));
      lines.push("");
      withNotes.forEach(function (item) {
        var e = getItem(item.uid);
        var head = item.sheet ? item.sheet + " — " + item.name : item.name;
        lines.push("### " + head);
        e.notes.forEach(function (n, i) {
          var where = n.pin ? " _(markup on image)_"
            : n.page ? " _(page " + n.page + ")_" : "";
          lines.push((i + 1) + ". " + (n.resolved ? "~~" + n.text + "~~ (resolved)" : n.text) +
            where + " — " + n.author);
        });
        lines.push("");
      });
    });

    if (!any) lines.push("_No comments recorded yet._");
    return lines.join("\n");
  }

  function clearAll() {
    requireInit();
    state = blank();
    save();
  }

  return {
    init: init,
    subscribe: subscribe,
    getItem: getItem,
    getNotes: getNotes,
    addNote: addNote,
    updateNote: updateNote,
    deleteNote: deleteNote,
    toggleResolved: toggleResolved,
    getReviewer: getReviewer,
    setReviewer: setReviewer,
    counts: counts,
    allNotes: allNotes,
    exportJSON: exportJSON,
    importJSON: importJSON,
    exportMarkdown: exportMarkdown,
    clearAll: clearAll
  };
})();
