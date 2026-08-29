/*
 * REVIEW STORE — review status, notes and image markups.
 *
 * This is a static site with no backend, so review state lives in the
 * reviewer's own browser (localStorage) rather than on a server. That means:
 * marks are private to the person who made them and to that browser, and they
 * are shared by exporting — Copy for Email / Download JSON on the Review Log
 * page. The UI says so plainly rather than implying marks sync.
 *
 * Everything is filed under an item's uid (see Drive.normalizeItem), so notes
 * survive reordering a package, renaming a file, or switching between the
 * manifest and live folder mode — as long as the Drive ID stays the same.
 */
window.Store = (function () {
  "use strict";

  var VERSION = 1;
  var KEY = "tbs-design-review:" + (location.pathname.split("/")[1] || "project");

  var listeners = [];
  var state = load();

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

  function subscribe(fn) { listeners.push(fn); }

  /* ── Items ─────────────────────────────────────────────────────────────── */

  function entry(uid) {
    if (!state.items[uid]) state.items[uid] = { status: "open", notes: [] };
    if (!state.items[uid].notes) state.items[uid].notes = [];
    return state.items[uid];
  }

  function getItem(uid) {
    var e = state.items[uid];
    return { status: (e && e.status) || "open", notes: (e && e.notes) || [] };
  }

  function getStatus(uid) { return getItem(uid).status; }

  function setStatus(uid, status) {
    entry(uid).status = status;
    save();
  }

  function getNotes(uid) { return getItem(uid).notes.slice(); }

  /* ── Notes + markups ───────────────────────────────────────────────────── */

  // A note with `pin` is a markup: pin.x / pin.y are fractions of the image's
  // displayed size (0–1), so the pin lands in the same spot on the drawing at
  // any screen size or zoom level. A note without a pin is a general comment;
  // on a PDF it can carry a `page` instead.
  function addNote(uid, fields) {
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
    // First comment on an untouched item moves it into review on its own —
    // one less thing for the reviewer to remember to set.
    if (entry(uid).status === "open") entry(uid).status = "review";
    save();
    return note;
  }

  function updateNote(uid, noteId, patch) {
    var notes = entry(uid).notes;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].id === noteId) {
        Object.keys(patch).forEach(function (k) { notes[i][k] = patch[k]; });
        save();
        return notes[i];
      }
    }
    return null;
  }

  function deleteNote(uid, noteId) {
    var e = entry(uid);
    e.notes = e.notes.filter(function (n) { return n.id !== noteId; });
    save();
  }

  function toggleResolved(uid, noteId) {
    var notes = entry(uid).notes;
    for (var i = 0; i < notes.length; i++) {
      if (notes[i].id === noteId) {
        notes[i].resolved = !notes[i].resolved;
        save();
        return notes[i];
      }
    }
    return null;
  }

  /* ── Reviewer ──────────────────────────────────────────────────────────── */

  function getReviewer() { return state.reviewer; }

  function setReviewer(name) {
    state.reviewer = String(name || "").trim();
    save();
  }

  /* ── Roll-ups ──────────────────────────────────────────────────────────── */

  // Status tallies across a list of items, for the dashboard and package cards.
  function counts(items) {
    var out = { total: items.length, notes: 0, openNotes: 0 };
    (window.SITE.statuses || []).forEach(function (s) { out[s.key] = 0; });
    items.forEach(function (it) {
      var e = getItem(it.uid);
      out[e.status] = (out[e.status] || 0) + 1;
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
    return JSON.stringify({
      version: VERSION,
      project: window.SITE.project.name,
      reviewer: state.reviewer,
      exported: new Date().toISOString(),
      items: state.items
    }, null, 2);
  }

  // Merges an export back in rather than replacing: two reviewers' comment sets
  // combine instead of one overwriting the other. Notes are de-duplicated by id,
  // and an incoming status only lands on items the local copy hasn't touched.
  function importJSON(text) {
    var data = JSON.parse(text);
    if (!data || !data.items) throw new Error("Not a review export — no items found.");

    var added = 0;
    Object.keys(data.items).forEach(function (uid) {
      var incoming = data.items[uid] || {};
      var mine = entry(uid);
      var seen = {};
      mine.notes.forEach(function (n) { seen[n.id] = true; });
      (incoming.notes || []).forEach(function (n) {
        if (n && n.id && !seen[n.id]) { mine.notes.push(n); added++; }
      });
      mine.notes.sort(function (a, b) {
        return String(a.created).localeCompare(String(b.created));
      });
      if (mine.status === "open" && incoming.status) mine.status = incoming.status;
    });
    save();
    return added;
  }

  // Plain-text roll-up for pasting into an email or a meeting agenda — the
  // format most likely to actually get read by everyone on the project.
  function exportMarkdown(packages) {
    var lines = [];
    var P = window.SITE.project;
    lines.push("# " + P.name + " — Design Review Comments");
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
        lines.push("### " + head + "  [" + statusLabel(e.status) + "]");
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

  function statusLabel(key) {
    var found = (window.SITE.statuses || []).filter(function (s) { return s.key === key; })[0];
    return found ? found.label : key;
  }

  function statusColor(key) {
    var found = (window.SITE.statuses || []).filter(function (s) { return s.key === key; })[0];
    return found ? found.color : "#9a9384";
  }

  function clearAll() {
    state = blank();
    save();
  }

  return {
    subscribe: subscribe,
    getItem: getItem,
    getStatus: getStatus,
    setStatus: setStatus,
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
    statusLabel: statusLabel,
    statusColor: statusColor,
    clearAll: clearAll
  };
})();
