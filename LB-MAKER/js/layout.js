/* LB-MAKER page layout engine.
 * Describes a "Work Samples" project page (1224 x 792 pt, origin top-left) as a list of
 * drawing ops. The same ops feed the on-screen canvas preview and the PDF export.
 * `fm` (font metrics) must provide: fm.w(fontKey, str, size) and fm.cap(fontKey).
 * Font keys: title (Antonio Bold) | body (Arimo/Arial) | thin (Montserrat Light) | ital (Tinos Bold Italic) */
(function (root) {
  'use strict';
  const K = 0.72, W = 1224, H = 792, COLX = 36, COLW = 281;
  const r = (x0, y0, x1, y1) => ({ x: x0 * K, y: y0 * K, w: (x1 - x0) * K, h: (y1 - y0) * K });
  const row = (n, x0, x1, y0, y1, gap) => {
    const w = (x1 - x0 - gap * (n - 1)) / n;
    return Array.from({ length: n }, (_, i) => r(x0 + i * (w + gap), y0, x0 + i * (w + gap) + w, y1));
  };

  const LAYOUTS = [
    { id: 'hero2', name: 'Hero + row', max: 4, desc: 'Large hero image with up to 3 images below (4 Seasons)' },
    { id: 'hero3', name: 'Hero + wide row', max: 4, desc: 'Hero with a full-width row below that runs under the text (Clearview, Neptune 1316)' },
    { id: 'duo', name: '2 + panorama', max: 3, desc: 'Two images on top, one wide below (260 Broadway)' },
    { id: 'full', name: 'Single hero', max: 1, desc: 'One tall image' }
  ];

  function slots(id, n) {
    if (n <= 0) return { boxes: [], leftLimit: 752 };
    if (id === 'full' || n === 1) return { boxes: [r(525, 50, 1651, 1049)], leftLimit: 752 };
    if (id === 'hero3') return { boxes: [r(525, 69, 1651, 658), ...row(Math.min(n - 1, 3), 50, 1649, 675, 1049, 16)], leftLimit: 475 };
    if (id === 'duo' && n >= 3) return { boxes: [r(525, 50, 1080, 645), r(1096, 50, 1651, 645), r(525, 657, 1651, 1049)], leftLimit: 752 };
    return { boxes: [r(525, 50, 1651, 544), ...row(Math.min(n - 1, 3), 525, 1651, 555, 1049, 14)], leftLimit: 752 };
  }

  function wrap(fm, font, size, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = [];
    let cur = [];
    for (const w of words) {
      if (cur.length && fm.w(font, cur.concat(w).join(' '), size) > maxW) { lines.push(cur); cur = [w]; } else cur.push(w);
    }
    if (cur.length) lines.push(cur);
    return lines;
  }
  const paras = (s) => String(s || '').split(/\r?\n/).map(t => t.trim()).filter(Boolean);

  // emit wrapped (optionally justified) lines; returns baseline of the last line
  function emit(ops, fm, lines, o) {
    lines.forEach((words, i) => {
      const y = o.y + i * o.leading, last = i === lines.length - 1;
      const text = words.join(' ');
      const nat = fm.w(o.font, text, o.size);
      if (o.justify && !last && words.length > 1) {
        const sum = words.reduce((a, w) => a + fm.w(o.font, w, o.size), 0);
        const gap = (o.maxW - sum) / (words.length - 1);
        if (gap < o.size * 1.4) {
          let x = o.x;
          words.forEach(w => { ops.push({ t: 'text', x, y, size: o.size, font: o.font, color: o.color, str: w }); x += fm.w(o.font, w, o.size) + gap; });
          return;
        }
      }
      ops.push({ t: 'text', x: o.x, y, size: o.size, font: o.font, color: o.color, str: text });
      void nat;
    });
    return o.y + (lines.length - 1) * o.leading;
  }

  function leftColumn(fm, p, s, calloutLines, leftImg, limit) {
    const ops = [], warn = [];
    const BODY = 11.5 * s, LEAD = 14.4 * s, GREY = '#8a8a8a', INK = '#1e1e1e';
    // title
    const title = String(p.name || 'UNTITLED').toUpperCase();
    let tsize = 28.8 / fm.cap('title');
    while (fm.w('title', title, tsize) > COLW && tsize > 14) tsize -= 0.5;
    ops.push({ t: 'text', x: COLX, y: 118.8, size: tsize, font: 'title', color: '#222', str: title });
    ops.push({ t: 'line', x1: COLX, y1: 128, x2: COLX + COLW, y2: 128, w: 0.75, color: '#222' });
    // meta
    let y = 161, last = 161;
    [['Location', p.location], ['Type', p.type], ['Role', p.role]].forEach(([k, v]) => {
      if (!String(v || '').trim()) return;
      const ls = wrap(fm, 'thin', 10, (k + ': ' + v).toUpperCase(), COLW);
      last = emit(ops, fm, ls, { x: COLX, y, size: 10, leading: 12.2, font: 'thin', color: GREY, maxW: COLW });
      y = last + 12.2;
    });
    y = (last === 161 && y === 161 ? 134 : last) + 27;
    // description
    paras(p.description).forEach((t, i) => {
      if (i) y += LEAD;
      y = emit(ops, fm, wrap(fm, 'body', BODY, t, COLW), { x: COLX, y, size: BODY, leading: LEAD, font: 'body', color: INK, maxW: COLW, justify: true }) + LEAD;
    });
    let end = y - LEAD;
    // program overview
    const items = paras(p.program).map(t => (/^[-•–]/.test(t) ? t : '- ' + t));
    if (items.length) {
      const ly = end + LEAD * 2;
      ops.push({ t: 'text', x: COLX, y: ly, size: 9.5, font: 'thin', color: GREY, str: 'PROGRAM OVERVIEW' });
      let iy = ly + LEAD * 1.8;
      items.forEach(t => { iy = emit(ops, fm, wrap(fm, 'body', BODY, t, COLW), { x: COLX, y: iy, size: BODY, leading: LEAD, font: 'body', color: INK, maxW: COLW }) + LEAD; });
      end = iy - LEAD;
    }
    // callout (bottom anchored)
    let floor = 755.3;
    if (calloutLines) {
      const n = calloutLines.head.length + calloutLines.body.length, top = 748 - (n - 1) * 16.8;
      let cy = top;
      emit(ops, fm, calloutLines.head, { x: COLX, y: cy, size: 13, leading: 16.8, font: 'ital', color: '#0aa5e0', maxW: COLW });
      cy += calloutLines.head.length * 16.8;
      emit(ops, fm, calloutLines.body, { x: COLX, y: cy, size: 13, leading: 16.8, font: 'ital', color: '#1e1e1e', maxW: COLW });
      floor = top - 13 - 16;
      end = Math.max(end, 0);
      if (end + 14 > floor - 20) warn.push('callout');
    }
    // left image (site map / plan)
    if (leftImg) {
      const top = end + 22, bottom = Math.min(floor, 755.3), availH = bottom - top - 12;
      if (availH < 100) warn.push('leftimg');
      else {
        const bw = 306, bh = Math.min(availH, 250), asp = leftImg.img.w / leftImg.img.h;
        let w = bw, h = w / asp; if (h > bh) { h = bh; w = h * asp; }
        ops.push({ t: 'text', x: COLX, y: bottom - bh - 4 + (bh - h), size: 9.5, font: 'thin', color: GREY, str: String(leftImg.label || 'SITE MAP').toUpperCase() });
        ops.push({ t: 'img', ref: { k: 'left' }, x: COLX, y: bottom - h, w, h });
      }
      end = Math.max(end, bottom);
    }
    return { ops, end, fits: end <= limit && !warn.length, warn };
  }

  function buildPage(fm, p, pageNo, dateLabel) {
    const warnings = [];
    const photos = (p.images || []).filter(Boolean);
    const lay = LAYOUTS.find(l => l.id === p.layout) || LAYOUTS[0];
    const sl = slots(lay.id, photos.length);
    if (photos.length > sl.boxes.length) warnings.push('Only ' + sl.boxes.length + ' of ' + photos.length + ' photos fit this layout.');
    const ops = [];
    sl.boxes.forEach((b, i) => ops.push(Object.assign({ t: 'img', ref: { k: 'photo', i } }, b)));

    let callout = null;
    if (String(p.calloutHead || '').trim() || String(p.calloutBody || '').trim()) {
      callout = { head: wrap(fm, 'ital', 13, p.calloutHead || '', COLW), body: wrap(fm, 'ital', 13, p.calloutBody || '', COLW) };
    }
    const leftImg = p.leftImage && sl.leftLimit > 700 ? { img: p.leftImage, label: p.leftLabel } : null;
    if (p.leftImage && !leftImg) warnings.push('The plan / site-map image is not used by the "Hero + wide row" layout — pick another layout to show it.');
    let res;
    for (const s of [1, .95, .9, .85, .8, .75, .7]) {
      res = leftColumn(fm, p, s, callout, leftImg, sl.leftLimit);
      if (res.fits) { if (s < 1) warnings.push('Text was reduced to ' + Math.round(s * 100) + '% to fit.'); break; }
    }
    if (!res.fits) warnings.push('Text is too long for this layout — shorten the description / program overview.');
    ops.push(...res.ops);

    // header + footer chrome
    const LN = '#1e1e1e';
    ops.push({ t: 'line', x1: 36, y1: 0, x2: 36, y2: 33, w: .75, color: LN }, { t: 'line', x1: 1187, y1: 0, x2: 1187, y2: 33, w: .75, color: LN });
    ops.push({ t: 'text', x: 1182, y: 30, size: 9.5, font: 'thin', color: '#777', str: 'WORK SAMPLES', align: 'right' });
    ops.push({ t: 'logo', x: 43, y: 765, w: 213, h: 15.2 });
    ops.push({ t: 'line', x1: 1187, y1: 758, x2: 1187, y2: 792, w: .75, color: LN });
    if (pageNo != null) ops.push({ t: 'text', x: 1183, y: 766.3, size: 12.2, font: 'body', color: '#222', str: String(pageNo), align: 'right' });
    ops.push({ t: 'text', x: 1183, y: 781.6, size: 7.5, font: 'body', color: '#444', str: dateLabel || 'OCT 2026', align: 'right' });
    return { ops, warnings, W, H };
  }

  const api = { W, H, LAYOUTS, buildPage };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LB = api;
})(typeof window !== 'undefined' ? window : globalThis);
