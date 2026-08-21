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
const {
  naturalCompare, humanize, listContentFolders, readJsonIfExists,
  buildImages, imageHasMetadataTitle, jsStringLiteral
} = require("./lib/scan-common.js");
const { parseVideoId, parsePlaylistId } = require("../assets/js/youtube-url.js");

const VERSIONS_DIR = path.join(__dirname, "..", "versions");
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

function listVersionFolders() {
  return listContentFolders(VERSIONS_DIR);
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

// videos.json entries can give a YouTube link in `url` (any watch/youtu.be/
// embed/shorts/live link, or a bare ID) instead of a pre-extracted
// `youtubeId` — resolve either to a clean ID here so the browser never has
// to parse a URL at runtime. Non-YouTube entries (type: "file") pass through
// unchanged.
// Same resolve-link-or-id-or-empty treatment as videos.json, applied to a
// version's optional title-header hero video (meta.json's heroPlaylistId /
// heroVideoIds / heroVideoId — same shape and priority as the site-level
// hero fields in project-data.js).
function resolveHeroConfig(versionId, meta) {
  var playlistId = "";
  if (meta.heroPlaylistId) {
    playlistId = parsePlaylistId(meta.heroPlaylistId) || "";
    if (!playlistId) {
      console.warn(
        "[warn] " + versionId + ": meta.json heroPlaylistId doesn't look like a YouTube " +
        "playlist link/ID (" + JSON.stringify(meta.heroPlaylistId) + ") — ignored"
      );
    }
  }

  var videoIds = [];
  if (Array.isArray(meta.heroVideoIds)) {
    videoIds = meta.heroVideoIds.map(function (raw, i) {
      var id = parseVideoId(raw);
      if (!id) {
        console.warn(
          "[warn] " + versionId + ": meta.json heroVideoIds[" + i + "] doesn't look like a " +
          "YouTube video link/ID (" + JSON.stringify(raw) + ") — dropped"
        );
      }
      return id;
    }).filter(Boolean);
  }

  var videoId = "";
  if (meta.heroVideoId) {
    videoId = parseVideoId(meta.heroVideoId) || "";
    if (!videoId) {
      console.warn(
        "[warn] " + versionId + ": meta.json heroVideoId doesn't look like a YouTube " +
        "video link/ID (" + JSON.stringify(meta.heroVideoId) + ") — ignored"
      );
    }
  }

  return { playlistId: playlistId, videoIds: videoIds, videoId: videoId };
}

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

function renderDataJs(id, meta, thumb, images, videos, hero) {
  const imagesJs = images.map((img) =>
    `    { src: ${jsStringLiteral(img.src)}, caption: ${jsStringLiteral(img.caption)} }`
  ).join(",\n");

  const videosJs = videos.map((v) => {
    if (v.type === "youtube") {
      return `    { type: "youtube", youtubeId: ${jsStringLiteral(v.youtubeId)}, caption: ${jsStringLiteral(v.caption || "")} }`;
    }
    return `    { type: "file", src: ${jsStringLiteral(v.src)}, poster: ${jsStringLiteral(v.poster || "")}, caption: ${jsStringLiteral(v.caption || "")} }`;
  }).join(",\n");

  const heroIdsJs = "[" + hero.videoIds.map(jsStringLiteral).join(", ") + "]";

  return `/* AUTO-GENERATED by scripts/generate-version-data.js — do not hand-edit.
 * Edit versions/${id}/meta.json for label/note (and optionally this
 * version's own title-header hero video — heroPlaylistId/heroVideoIds/
 * heroVideoId, same shape as project-data.js's site-level hero), add/remove
 * files in versions/${id}/assets/ for images and local videos, or add
 * entries to versions/${id}/videos.json for non-file videos (e.g. YouTube) —
 * then re-run: node scripts/generate-version-data.js
 */
window.VERSIONS = window.VERSIONS || {};
window.VERSIONS[${jsStringLiteral(id)}] = {
  id: ${jsStringLiteral(id)},
  label: ${jsStringLiteral(meta.label)},
  note: ${jsStringLiteral(meta.note)},
  thumb: ${jsStringLiteral(thumb || "")},
  // Title-header hero video — checked in this order, first non-empty wins,
  // falls back to the thumb image (above) as a static background if all
  // three are empty. See assets/js/common.js buildYouTubeHeroSrc().
  heroPlaylistId: ${jsStringLiteral(hero.playlistId)},
  heroVideoIds: ${heroIdsJs},
  heroVideoId: ${jsStringLiteral(hero.videoId)},
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
    const hero = resolveHeroConfig(id, meta);

    const dataJs = renderDataJs(id, meta, thumb, images, videos, hero);
    fs.writeFileSync(path.join(dir, "data.js"), dataJs);

    const metaCount = images.filter((img) => readImageTitle(path.join(assetsDir, img._file)) !== null).length;
    const heroNote = hero.playlistId ? ", hero video: playlist" :
      (hero.videoIds.length || hero.videoId) ? ", hero video: set" : "";
    console.log(
      "[ok] " + id + ": " + images.length + " image(s) (" + metaCount + " with metadata title), " +
      videos.length + " video(s), thumb=" + (thumb || "none") + heroNote
    );
  });

  fs.writeFileSync(path.join(VERSIONS_DIR, "versions-index.js"), renderIndexJs(ids));
  console.log("[ok] versions-index.js: " + ids.join(", "));
}

main();
