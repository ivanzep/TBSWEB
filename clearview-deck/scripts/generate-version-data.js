#!/usr/bin/env node
/*
 * GENERATOR — regenerates versions/versions-index.js and every
 * versions/<id>/data.js by scanning what's actually on disk. Run this after
 * adding, removing, or renaming files in a version's assets/ folder:
 *
 *   node scripts/generate-version-data.js
 *
 * Why this exists instead of runtime discovery: a static site with no build
 * step and no server has no way to list a folder's contents or read a
 * file's metadata from the browser (fetch() of local files is blocked by
 * CORS when opened via file://, and there's no directory-listing API at
 * all). Node can do both at generation time, so this script is the thing
 * that removes hand-typed filenames/counts from data.js — you never edit
 * data.js directly again once a version is generator-managed.
 *
 * Per version folder, only versions/<id>/meta.json is hand-authored
 * ({ label, note }) — there's no way to derive narrative copy from
 * filenames. Optionally add versions/<id>/videos.json for videos that
 * aren't local files, e.g. YouTube:
 *   [{ "type": "youtube", "url": "<any youtube.com/youtu.be link, or a bare video ID>", "caption": "..." }]
 * Everything else — which images exist,
 * their order, their captions, the thumbnail, which folders exist at all —
 * is derived from the filesystem:
 *   - Caption: the image's embedded Title metadata (XMP dc:title > IPTC
 *     Object Name > EXIF XPTitle > EXIF ImageDescription), falling back to
 *     a humanized filename ("pool-terrace.jpg" -> "Pool Terrace") when a
 *     file has none — which is every file today; none of the current
 *     renders carry title metadata, so add it in Photoshop/Bridge/exiftool
 *     if you want captions independent of filenames.
 *   - Order: natural sort (so "2" sorts before "10").
 *   - Thumbnail: a file literally named thumb.* or cover.*, else the first
 *     image in sorted order.
 *   - Video poster: a same-basename image file, else the version's thumb.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { readImageTitle } = require("./lib/read-image-title.js");
const { parseVideoId } = require("../assets/js/youtube-url.js");

const VERSIONS_DIR = path.join(__dirname, "..", "versions");
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

function naturalCompare(a, b) {
  const chunk = (s) => s.match(/\d+|\D+/g) || [];
  const ca = chunk(a), cb = chunk(b);
  for (let i = 0; i < Math.max(ca.length, cb.length); i++) {
    const x = ca[i] || "", y = cb[i] || "";
    const nx = Number(x), ny = Number(y);
    const bothNumeric = x !== "" && y !== "" && !isNaN(nx) && !isNaN(ny);
    if (bothNumeric) {
      if (nx !== ny) return nx - ny;
    } else if (x !== y) {
      return x < y ? -1 : 1;
    }
  }
  return 0;
}

function humanize(filename) {
  const base = filename.replace(/\.[^.]+$/, "");
  return base
    .replace(/[-_]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function listVersionFolders() {
  return fs.readdirSync(VERSIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_template" && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort(naturalCompare);
}

function readJsonIfExists(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function buildImages(assetsDir) {
  const files = fs.readdirSync(assetsDir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort(naturalCompare);

  return files.map((f) => {
    const title = readImageTitle(path.join(assetsDir, f));
    return { src: "assets/" + f, caption: title || humanize(f), _file: f };
  });
}

function buildLocalVideos(assetsDir, images, thumbRel) {
  const files = fs.readdirSync(assetsDir)
    .filter((f) => VIDEO_EXT.test(f))
    .sort(naturalCompare);

  return files.map((f) => {
    const base = f.replace(/\.[^.]+$/, "");
    const matchingPoster = images.find((img) => img._file.replace(/\.[^.]+$/, "") === base);
    return {
      type: "file",
      src: "assets/" + f,
      poster: matchingPoster ? matchingPoster.src : thumbRel,
      caption: humanize(f)
    };
  });
}

function pickThumb(images, assetsDir) {
  const namedThumb = images.find((img) => /^(thumb|cover)\./i.test(img._file));
  if (namedThumb) return namedThumb.src;
  if (images.length) return images[0].src;
  return null;
}

function jsStringLiteral(s) {
  return JSON.stringify(s);
}

// videos.json entries can give a YouTube link in `url` (any watch/youtu.be/
// embed/shorts/live link, or a bare ID) instead of a pre-extracted
// `youtubeId` — resolve either to a clean ID here so the browser never has
// to parse a URL at runtime. Non-YouTube entries (type: "file") pass through
// unchanged.
function resolveExtraVideos(versionId, rawVideos) {
  return rawVideos.map((v, i) => {
    if (v.type !== "youtube") return v;
    const source = v.url || v.youtubeId;
    const id = parseVideoId(source);
    if (!id) {
      console.warn(
        "[warn] " + versionId + ": videos.json entry #" + (i + 1) +
        " has an unrecognized YouTube url/youtubeId (" + JSON.stringify(source) + ") — skipped"
      );
      return null;
    }
    return { type: "youtube", youtubeId: id, caption: v.caption || "" };
  }).filter(Boolean);
}

function renderDataJs(id, meta, thumb, images, videos) {
  const imagesJs = images.map((img) =>
    `    { src: ${jsStringLiteral(img.src)}, caption: ${jsStringLiteral(img.caption)} }`
  ).join(",\n");

  const videosJs = videos.map((v) => {
    if (v.type === "youtube") {
      return `    { type: "youtube", youtubeId: ${jsStringLiteral(v.youtubeId)}, caption: ${jsStringLiteral(v.caption || "")} }`;
    }
    return `    { type: "file", src: ${jsStringLiteral(v.src)}, poster: ${jsStringLiteral(v.poster || "")}, caption: ${jsStringLiteral(v.caption || "")} }`;
  }).join(",\n");

  return `/* AUTO-GENERATED by scripts/generate-version-data.js — do not hand-edit.
 * Edit versions/${id}/meta.json for label/note, add/remove files in
 * versions/${id}/assets/ for images and local videos, or add entries to
 * versions/${id}/videos.json for non-file videos (e.g. YouTube) — then
 * re-run: node scripts/generate-version-data.js
 */
window.VERSIONS = window.VERSIONS || {};
window.VERSIONS[${jsStringLiteral(id)}] = {
  id: ${jsStringLiteral(id)},
  label: ${jsStringLiteral(meta.label)},
  note: ${jsStringLiteral(meta.note)},
  thumb: ${jsStringLiteral(thumb || "")},
  images: [
${imagesJs}
  ],
  videos: [
${videosJs}
  ]
};
`;
}

function renderIndexJs(ids) {
  const idsJs = ids.map((id) => "  " + jsStringLiteral(id)).join(",\n");
  return `/* AUTO-GENERATED by scripts/generate-version-data.js — do not hand-edit.
 * Reflects whatever version folders currently exist under versions/
 * (excluding _template). Order is natural-sort by folder name, which is
 * also the display order everywhere. Re-run after adding/removing a
 * version folder: node scripts/generate-version-data.js
 */
window.VERSION_IDS = [
${idsJs}
];
`;
}

function main() {
  const ids = listVersionFolders();
  if (!ids.length) {
    console.error("No version folders found under " + VERSIONS_DIR);
    process.exit(1);
  }

  ids.forEach((id) => {
    const dir = path.join(VERSIONS_DIR, id);
    const assetsDir = path.join(dir, "assets");
    const metaPath = path.join(dir, "meta.json");

    if (!fs.existsSync(assetsDir)) {
      console.warn("[skip] " + id + ": no assets/ folder");
      return;
    }
    const meta = readJsonIfExists(metaPath, null);
    if (!meta || !meta.label) {
      console.warn("[skip] " + id + ": missing meta.json ({ label, note })");
      return;
    }

    const images = buildImages(assetsDir);
    const thumb = pickThumb(images, assetsDir);
    const localVideos = buildLocalVideos(assetsDir, images, thumb || "");
    const rawExtraVideos = readJsonIfExists(path.join(dir, "videos.json"), []);
    const extraVideos = resolveExtraVideos(id, rawExtraVideos);
    const videos = localVideos.concat(extraVideos);

    const dataJs = renderDataJs(id, meta, thumb, images, videos);
    fs.writeFileSync(path.join(dir, "data.js"), dataJs);

    const metaCount = images.filter((img) => readImageTitle(path.join(assetsDir, img._file)) !== null).length;
    console.log(
      "[ok] " + id + ": " + images.length + " image(s) (" + metaCount + " with metadata title), " +
      videos.length + " video(s), thumb=" + (thumb || "none")
    );
  });

  fs.writeFileSync(path.join(VERSIONS_DIR, "versions-index.js"), renderIndexJs(ids));
  console.log("[ok] versions-index.js: " + ids.join(", "));
}

main();
