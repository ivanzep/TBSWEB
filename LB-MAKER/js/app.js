/* LB-MAKER app: assemble a company-profile PDF from the source PDF's pages + user-added projects. */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => n.append(c instanceof Node ? c : document.createTextNode(c)));
    return n;
  };
  const H = LB.H, W = LB.W;
  const FONT_FILES = { title: 'antonio-latin-700-normal.woff', body: 'arimo-latin-400-normal.woff', thin: 'montserrat-latin-300-normal.woff', ital: 'tinos-latin-700-italic.woff' };
  const FONT_CSS = { title: s => `700 ${s}px Antonio`, body: s => `400 ${s}px Arimo`, thin: s => `300 ${s}px Montserrat`, ital: s => `italic 700 ${s}px Tinos` };

  let PAGES = [], FM = null, FONT_BYTES = {}, state, items = new Map();
  const SECTIONS = ['All', 'Company', 'Design Studio', 'Construction', 'Retail', 'Work Samples', 'Added'];
  let filter = 'All';

  /* ---------------- persistence (IndexedDB, falls back to memory) ---------------- */
  const store = {
    db: null,
    async open() {
      if (this.db) return this.db;
      this.db = await new Promise((res, rej) => {
        try { const q = indexedDB.open('lb-maker', 1); q.onupgradeneeded = () => q.result.createObjectStore('kv'); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); } catch (e) { rej(e); }
      }).catch(() => null);
      return this.db;
    },
    async get(k) { const d = await this.open(); if (!d) return null; return new Promise(r => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => r(q.result || null); q.onerror = () => r(null); }); },
    async set(k, v) { const d = await this.open(); if (!d) return; return new Promise(r => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = r; t.onerror = r; }); }
  };
  let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => store.set('state', state), 300); };

  /* ---------------- fonts / metrics ---------------- */
  async function loadFonts() {
    await Promise.all(Object.entries(FONT_FILES).map(async ([k, f]) => { FONT_BYTES[k] = new Uint8Array(await (await fetch('fonts/' + f)).arrayBuffer()); }));
    const ff = {}; for (const k in FONT_BYTES) ff[k] = fontkit.create(FONT_BYTES[k]);
    FM = { cap: k => (ff[k].capHeight || ff[k].ascent * .7) / ff[k].unitsPerEm };
    FM.w = (k, s, size) => { const l = ff[k].layout(s); return l.positions.reduce((a, p) => a + p.xAdvance, 0) * size / ff[k].unitsPerEm; };
    await Promise.all(['700 20px Antonio', '400 20px Arimo', '300 20px Montserrat', 'italic 700 20px Tinos'].map(f => document.fonts.load(f)));
  }

  /* ---------------- images ---------------- */
  const imgCache = new Map();
  const loadImg = src => { if (!imgCache.has(src)) imgCache.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; })); return imgCache.get(src); };
  async function fileToImage(file, max = 2400) {
    const url = URL.createObjectURL(file);
    try {
      const im = await loadImg(url);
      const sc = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc);
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      return { src: c.toDataURL('image/jpeg', .88), w: c.width, h: c.height, name: file.name };
    } finally { URL.revokeObjectURL(url); }
  }
  function coverRect(iw, ih, w, h) { const s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s; return [(iw - sw) / 2, (ih - sh) / 2, sw, sh]; }
  const imgFor = (p, ref) => ref.k === 'left' ? p.leftImage : p.images[ref.i];

  /* ---------------- canvas renderer ---------------- */
  let logoImg;
  async function renderCanvas(p, pageNo, canvas, scale) {
    const { ops, warnings } = LB.buildPage(FM, p, pageNo, state.opts.date);
    logoImg = logoImg || await loadImg('assets/logo-script.png');
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    const c = canvas.getContext('2d'); c.setTransform(scale, 0, 0, scale, 0, 0);
    c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
    for (const o of ops) {
      if (o.t === 'img') {
        const d = imgFor(p, o.ref); if (!d) continue; const im = await loadImg(d.src);
        const [sx, sy, sw, sh] = coverRect(im.naturalWidth, im.naturalHeight, o.w, o.h);
        c.drawImage(im, sx, sy, sw, sh, o.x, o.y, o.w, o.h);
      } else if (o.t === 'line') { c.strokeStyle = o.color; c.lineWidth = o.w; c.beginPath(); c.moveTo(o.x1, o.y1); c.lineTo(o.x2, o.y2); c.stroke(); }
      else if (o.t === 'logo') c.drawImage(logoImg, o.x, o.y, o.w, o.h);
      else if (o.t === 'text') { c.font = FONT_CSS[o.font](o.size); c.fillStyle = o.color; c.textAlign = o.align === 'right' ? 'right' : 'left'; c.textBaseline = 'alphabetic'; c.fillText(o.str, o.x, o.y); }
    }
    return warnings;
  }

  /* ---------------- state helpers ---------------- */
  const isCustom = id => id.startsWith('c_');
  const selectedIds = () => state.order.filter(id => state.sel[id]);
  const numberOf = id => { const i = selectedIds().indexOf(id); return i < 0 ? null : (+state.opts.start || 0) + i; };

  async function init() {
    PAGES = await (await fetch('data/pages.json')).json();
    PAGES.forEach(p => items.set('p' + p.n, p));
    await loadFonts();
    const saved = await store.get('state');
    state = { order: PAGES.map(p => 'p' + p.n), sel: {}, custom: {}, opts: { renumber: true, start: 1, date: 'OCT 2026' } };
    PAGES.forEach(p => state.sel['p' + p.n] = true);
    if (saved) {
      Object.assign(state.opts, saved.opts || {});
      Object.assign(state.custom, saved.custom || {});
      const known = new Set(state.order);
      const ord = (saved.order || []).filter(id => known.has(id) || saved.custom?.[id]);
      state.order.forEach(id => { if (!ord.includes(id)) ord.push(id); });
      state.order = ord; Object.assign(state.sel, saved.sel || {});
    }
    $('#optRenumber').checked = state.opts.renumber; $('#optStart').value = state.opts.start; $('#optDate').value = state.opts.date;
    buildChips(); buildLayoutPicker(); render();
  }

  /* ---------------- grid ---------------- */
  const meta = id => isCustom(id) ? { n: null, title: state.custom[id].name || 'Untitled', section: 'Work Samples', custom: true } : items.get(id);
  function visible(id) { const m = meta(id); return filter === 'All' || (filter === 'Added' ? m.custom : m.section === filter && !m.custom || (filter === 'Work Samples' && m.custom)); }
  function buildChips() {
    const box = $('#chips'); box.textContent = '';
    SECTIONS.forEach(s => box.append(el('button', { class: 'chip' + (s === filter ? ' on' : ''), type: 'button', onclick: () => { filter = s; buildChips(); render(); } }, s)));
  }
  const thumbCache = new Map();
  function render() {
    const grid = $('#grid'); grid.textContent = '';
    const ids = state.order, shown = ids.filter(visible);
    for (const id of shown) {
      const m = meta(id), on = !!state.sel[id], num = numberOf(id);
      const th = el('button', { class: 'thumb', type: 'button', title: 'Click to enlarge', onclick: () => openLightbox(id) });
      if (m.custom) {
        const key = JSON.stringify(state.custom[id]).length + ':' + state.custom[id].name + ':' + num + state.opts.date + state.custom[id].v;
        const img = el('img', { alt: m.title }); th.append(img);
        if (thumbCache.get(id)?.key === key) img.src = thumbCache.get(id).url;
        else (async () => {
          const cv = document.createElement('canvas'); await renderCanvas(state.custom[id], num ?? '', cv, 0.45);
          const url = cv.toDataURL('image/jpeg', .75); thumbCache.set(id, { key, url }); img.src = url;
        })();
      } else th.append(el('img', { src: `assets/thumbs/${String(m.n).padStart(2, '0')}.jpg`, alt: m.title, loading: 'lazy' }));
      const chk = el('input', { type: 'checkbox', 'aria-label': 'Include ' + m.title }); chk.checked = on;
      chk.addEventListener('change', () => { state.sel[id] = chk.checked; save(); render(); });
      const idx = shown.indexOf(id);
      const card = el('article', { class: 'card' + (on ? ' sel' : ''), 'data-id': id },
        el('label', { class: 'chk' }, chk), th,
        on ? el('div', { class: 'badge' }, 'p.' + num) : el('div', { class: 'badge' }, 'out'),
        el('div', { class: 'cmeta' }, el('b', {}, m.title, m.custom ? el('span', { class: 'tag-added' }, 'ADDED') : ''),
          el('span', {}, m.custom ? 'Work Samples · new project' : `${m.section} · original p.${m.n}`)),
        el('div', { class: 'cacts' },
          el('button', { class: 'mini', type: 'button', title: 'Move earlier', disabled: idx === 0, onclick: () => move(id, shown[idx - 1]) }, '◀'),
          el('button', { class: 'mini', type: 'button', title: 'Move later', disabled: idx === shown.length - 1, onclick: () => move(id, shown[idx + 1]) }, '▶'),
          m.custom ? [el('button', { class: 'mini', type: 'button', onclick: () => editProject(id) }, 'Edit'),
            el('button', { class: 'mini del', type: 'button', onclick: () => delProject(id) }, 'Delete')] : ''));
      grid.append(card);
    }
    const n = selectedIds().length;
    $('#count').textContent = `${n} of ${state.order.length} pages selected`;
    $('#exportBtn').disabled = !n;
  }
  function move(id, otherId) {
    const a = state.order.indexOf(id), b = state.order.indexOf(otherId); if (a < 0 || b < 0) return;
    state.order.splice(a, 1); state.order.splice(b, 0, id); save(); render();
  }
  $('#selAll').onclick = () => { state.order.filter(visible).forEach(id => state.sel[id] = true); save(); render(); };
  $('#selNone').onclick = () => { state.order.filter(visible).forEach(id => state.sel[id] = false); save(); render(); };
  $('#resetOrder').onclick = () => {
    const orig = PAGES.map(p => 'p' + p.n), out = [...orig];
    Object.values(state.custom).sort((a, b) => a.created - b.created).forEach(c => {
      let at = out.indexOf(c.anchor); if (at < 0) at = out.length - 2;
      while (out[at + 1] && isCustom(out[at + 1])) at++;
      out.splice(at + 1, 0, c.id);
    });
    state.order = out; save(); render();
  };
  const bindOpt = () => { state.opts.renumber = $('#optRenumber').checked; state.opts.start = parseInt($('#optStart').value, 10) || 0; state.opts.date = $('#optDate').value || 'OCT 2026'; save(); render(); };
  ['#optRenumber', '#optStart', '#optDate'].forEach(s => $(s).addEventListener('input', bindOpt));

  /* ---------------- lightbox ---------------- */
  async function openLightbox(id) {
    const m = meta(id), img = $('#lbImg'); $('#lbCap').textContent = m.title;
    if (m.custom) { const cv = document.createElement('canvas'); await renderCanvas(state.custom[id], numberOf(id) ?? '', cv, 1.4); img.src = cv.toDataURL('image/jpeg', .85); }
    else img.src = `assets/preview/${String(m.n).padStart(2, '0')}.jpg`;
    $('#lightbox').hidden = false;
  }
  $('#lightbox').addEventListener('click', e => { if (e.target.id !== 'lbImg') $('#lightbox').hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#lightbox').hidden = true; });

  /* ---------------- tabs ---------------- */
  function showView(v) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.view === v));
    document.querySelectorAll('.view').forEach(s => s.classList.toggle('on', s.id === 'view-' + v));
    if (v === 'project') { fillAfter(); schedulePreview(); }
  }
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => showView(t.dataset.view));

  /* ---------------- add / edit project form ---------------- */
  const form = $('#pform');
  let editId = null, fImages = [], fLeft = null, fLayout = 'hero2';
  const LAYOUT_SVG = {
    hero2: '<rect x="2" y="2" width="30" height="3" fill="#999"/><rect x="2" y="9" width="30" height="2" fill="#ccc"/><rect x="2" y="14" width="30" height="2" fill="#ccc"/><rect x="40" y="2" width="78" height="42" fill="#333"/><rect x="40" y="48" width="38" height="28" fill="#666"/><rect x="82" y="48" width="36" height="28" fill="#666"/>',
    hero3: '<rect x="2" y="2" width="30" height="3" fill="#999"/><rect x="2" y="9" width="30" height="2" fill="#ccc"/><rect x="40" y="2" width="78" height="44" fill="#333"/><rect x="2" y="50" width="36" height="26" fill="#666"/><rect x="42" y="50" width="36" height="26" fill="#666"/><rect x="82" y="50" width="36" height="26" fill="#666"/>',
    duo: '<rect x="2" y="2" width="30" height="3" fill="#999"/><rect x="2" y="9" width="30" height="2" fill="#ccc"/><rect x="2" y="48" width="30" height="28" fill="#aaa"/><rect x="40" y="2" width="38" height="42" fill="#333"/><rect x="82" y="2" width="36" height="42" fill="#333"/><rect x="40" y="48" width="78" height="28" fill="#666"/>',
    full: '<rect x="2" y="2" width="30" height="3" fill="#999"/><rect x="2" y="9" width="30" height="2" fill="#ccc"/><rect x="40" y="2" width="78" height="74" fill="#333"/>'
  };
  function buildLayoutPicker() {
    const box = $('#layouts'); box.textContent = '';
    LB.LAYOUTS.forEach(l => {
      const d = el('div', { class: 'lay' + (l.id === fLayout ? ' on' : ''), title: l.desc, role: 'radio', tabindex: 0 });
      d.innerHTML = `<svg viewBox="0 0 120 78" style="background:#fff;border:1px solid #ddd">${LAYOUT_SVG[l.id]}</svg>${l.name}`;
      d.onclick = () => { fLayout = l.id; buildLayoutPicker(); schedulePreview(); };
      box.append(d);
    });
  }
  function fillAfter(selectId) {
    const sel = $('#afterSel'); sel.textContent = '';
    sel.append(el('option', { value: '' }, 'At the very beginning'));
    let def = null;
    state.order.forEach(id => { if (id === editId) return; const m = meta(id); if (m.section === 'Work Samples' && m.n !== 16) def = id; });
    state.order.forEach(id => { if (id === editId) return; const m = meta(id); sel.append(el('option', { value: id }, `${m.custom ? 'New' : 'p.' + m.n} · ${m.title}`)); });
    sel.value = selectId ?? (editId ? state.order[state.order.indexOf(editId) - 1] || '' : def || '');
    sel.disabled = !!editId;
  }
  function photoThumb(d, i, list, after) {
    return el('div', { class: 'ph' }, el('img', { src: d.src, alt: '' }), el('div', {},
      el('button', { type: 'button', title: 'Earlier', onclick: () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; after(); } } }, '◀'),
      el('button', { type: 'button', title: 'Later', onclick: () => { if (i < list.length - 1) { [list[i + 1], list[i]] = [list[i], list[i + 1]]; after(); } } }, '▶'),
      el('button', { type: 'button', title: 'Remove', onclick: () => { list.splice(i, 1); after(); } }, '✕')));
  }
  function drawLists() {
    const pl = $('#photoList'); pl.textContent = '';
    fImages.forEach((d, i) => pl.append(photoThumb(d, i, fImages, () => { drawLists(); schedulePreview(); })));
    const ll = $('#leftList'); ll.textContent = '';
    if (fLeft) ll.append(photoThumb(fLeft, 0, [fLeft], () => { fLeft = null; $('#leftIn').value = ''; drawLists(); schedulePreview(); }));
  }
  $('#photoIn').addEventListener('change', async e => { for (const f of e.target.files) fImages.push(await fileToImage(f)); e.target.value = ''; drawLists(); schedulePreview(); });
  $('#leftIn').addEventListener('change', async e => { if (e.target.files[0]) fLeft = await fileToImage(e.target.files[0], 1800); drawLists(); schedulePreview(); });
  const formProject = () => {
    const f = new FormData(form), g = k => String(f.get(k) || '');
    return { id: editId || 'c_' + Date.now().toString(36), name: g('name'), location: g('location'), type: g('type'), role: g('role'), description: g('description'), program: g('program'),
      layout: fLayout, images: fImages.slice(), leftImage: fLeft, leftLabel: g('leftLabel'), calloutHead: g('calloutHead'), calloutBody: g('calloutBody') };
  };
  let pvT, pvBusy = false, pvAgain = false;
  function schedulePreview() { clearTimeout(pvT); pvT = setTimeout(runPreview, 120); }
  async function runPreview() {
    if (pvBusy) { pvAgain = true; return; } pvBusy = true;
    try {
      const p = formProject();
      let num = null;
      if (state) {
        const after = $('#afterSel').value, sel = selectedIds();
        if (editId) num = numberOf(editId);
        else { const k = after ? sel.filter(id => state.order.indexOf(id) <= state.order.indexOf(after)).length : 0; num = (+state.opts.start || 0) + k; }
      }
      $('#pvNum').textContent = num != null ? `· will be page ${num}` : '';
      const warn = await renderCanvas(p, num, $('#pv'), 1.5);
      const ul = $('#pvWarn'); ul.textContent = ''; warn.forEach(w => ul.append(el('li', {}, '⚠ ' + w)));
    } finally { pvBusy = false; if (pvAgain) { pvAgain = false; schedulePreview(); } }
  }
  form.addEventListener('input', schedulePreview); $('#afterSel').addEventListener('change', schedulePreview);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const p = formProject(); p.created = editId ? state.custom[editId].created : Date.now(); p.v = (state.custom[editId]?.v || 0) + 1;
    if (editId) { p.anchor = state.custom[editId].anchor; state.custom[p.id] = p; }
    else {
      const after = $('#afterSel').value, at = after ? state.order.indexOf(after) + 1 : 0;
      let a = at - 1; while (a >= 0 && isCustom(state.order[a])) a--;
      p.anchor = a >= 0 ? state.order[a] : null;
      state.custom[p.id] = p; state.order.splice(at, 0, p.id); state.sel[p.id] = true;
    }
    save(); resetForm(); filter = 'All'; buildChips(); showView('assemble'); render();
    document.querySelector(`[data-id="${p.id}"]`)?.scrollIntoView({ block: 'center' });
  });
  function resetForm() { editId = null; form.reset(); fImages = []; fLeft = null; fLayout = 'hero2'; $('#pformTitle').textContent = 'Add a project'; $('#pSubmit').textContent = 'Add to deck'; $('#pCancel').hidden = true; buildLayoutPicker(); drawLists(); }
  $('#pCancel').onclick = () => { resetForm(); showView('assemble'); };
  function editProject(id) {
    const p = state.custom[id]; resetForm(); editId = id;
    for (const k of ['name', 'location', 'type', 'role', 'description', 'program', 'leftLabel', 'calloutHead', 'calloutBody']) form.elements[k].value = p[k] || '';
    fImages = p.images.slice(); fLeft = p.leftImage; fLayout = p.layout;
    $('#pformTitle').textContent = 'Edit project'; $('#pSubmit').textContent = 'Save changes'; $('#pCancel').hidden = false;
    buildLayoutPicker(); drawLists(); showView('project');
  }
  function delProject(id) {
    if (!confirm(`Delete "${state.custom[id].name}"? This cannot be undone.`)) return;
    delete state.custom[id]; delete state.sel[id]; state.order = state.order.filter(x => x !== id); save(); render();
  }

  /* ---------------- export ---------------- */
  const busy = msg => { $('#busy').hidden = !msg; if (msg) $('#busyMsg').textContent = msg; };
  const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&'); const n = parseInt(h, 16); return PDFLib.rgb((n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255); };
  async function sourceBytes() {
    try { const r = await fetch('assets/company-profiles.pdf'); if (!r.ok) throw 0; return new Uint8Array(await r.arrayBuffer()); }
    catch (e) {
      busy(null); alert('The source PDF could not be loaded automatically (the page must be served over http, not opened as a file). Please choose company-profiles.pdf.');
      return new Promise((res, rej) => { const i = el('input', { type: 'file', accept: 'application/pdf' }); i.onchange = async () => i.files[0] ? res(new Uint8Array(await i.files[0].arrayBuffer())) : rej(new Error('No file')); i.click(); });
    }
  }
  async function cropJpeg(p, o) {
    const d = imgFor(p, o.ref), im = await loadImg(d.src), px = Math.min(3, 2400 / Math.max(o.w, o.h));
    const c = document.createElement('canvas'); c.width = Math.round(o.w * px); c.height = Math.round(o.h * px);
    const x = c.getContext('2d'); const [sx, sy, sw, sh] = coverRect(im.naturalWidth, im.naturalHeight, o.w, o.h);
    x.drawImage(im, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/jpeg', .9))).arrayBuffer());
  }
  async function exportPdf() {
    const sel = selectedIds(); if (!sel.length) return;
    try {
      busy('Loading source PDF…');
      const { PDFDocument } = PDFLib;
      const src = await PDFDocument.load(await sourceBytes(), { ignoreEncryption: true });
      const out = await PDFDocument.create(); out.registerFontkit(fontkit);
      busy('Copying pages…');
      const origIds = sel.filter(id => !isCustom(id));
      const copied = await out.copyPages(src, origIds.map(id => items.get(id).n - 1));
      const byId = Object.fromEntries(origIds.map((id, i) => [id, copied[i]]));
      const fonts = {}; for (const k in FONT_BYTES) fonts[k] = await out.embedFont(FONT_BYTES[k], { subset: true });
      const logo = await out.embedPng(await (await fetch('assets/logo-script.png')).arrayBuffer());
      const start = +state.opts.start || 0, date = state.opts.date;
      for (let i = 0; i < sel.length; i++) {
        const id = sel[i], no = start + i; busy(`Building page ${i + 1} of ${sel.length}…`);
        if (!isCustom(id)) {
          const page = out.addPage(byId[id]), m = items.get(id);
          if (state.opts.renumber && m.num) {
            const n = m.num, size = 12.2, wNew = fonts.body.widthOfTextAtSize(String(no), size);
            const left = Math.min(n.x0, n.x1 - wNew) - 2, right = n.x1 + 2;
            page.drawRectangle({ x: left, y: H - n.y1 - 1.5, width: right - left, height: n.y1 - n.y0 + 3, color: hex(n.bg) });
            page.drawText(String(no), { x: n.x1 - wNew, y: H - n.y1 + 2.6, size, font: fonts.body, color: hex('#222222') });
          }
        } else {
          const p = state.custom[id], page = out.addPage([W, H]);
          const { ops } = LB.buildPage(FM, p, no, date);
          for (const o of ops) {
            if (o.t === 'img') { if (imgFor(p, o.ref)) page.drawImage(await out.embedJpg(await cropJpeg(p, o)), { x: o.x, y: H - o.y - o.h, width: o.w, height: o.h }); }
            else if (o.t === 'line') page.drawLine({ start: { x: o.x1, y: H - o.y1 }, end: { x: o.x2, y: H - o.y2 }, thickness: o.w, color: hex(o.color) });
            else if (o.t === 'logo') page.drawImage(logo, { x: o.x, y: H - o.y - o.h, width: o.w, height: o.h });
            else if (o.t === 'text') { const f = fonts[o.font]; const x = o.align === 'right' ? o.x - f.widthOfTextAtSize(o.str, o.size) : o.x; page.drawText(o.str, { x, y: H - o.y, size: o.size, font: f, color: hex(o.color) }); }
          }
        }
      }
      out.setTitle('The Brown Studio — Company Profiles'); out.setProducer('LB-MAKER'); out.setCreationDate(new Date());
      busy('Saving PDF…');
      const bytes = await out.save();
      const d = new Date(), pad = n => String(n).padStart(2, '0');
      const a = el('a', { href: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), download: `TBS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-COMPANY_PROFILES.pdf` });
      document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      busy(null);
    } catch (e) { console.error(e); busy(null); alert('Export failed: ' + (e.message || e)); }
  }
  $('#exportBtn').onclick = exportPdf;

  init().catch(e => { console.error(e); document.body.prepend(el('p', { style: 'padding:20px;color:#b3261e' }, 'Failed to start: ' + e.message + ' — serve this folder over http (python3 -m http.server).')); });
})();
