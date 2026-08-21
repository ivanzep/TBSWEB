/*
 * Shared scan-tool utilities — used by both scripts/generate-version-data.js
 * (design versions) and scripts/generate-reference-data.js (reference image
 * sections), so the two generators share one implementation of "list folders
 * on disk", "sort them naturally", "read images with title-metadata-or-
 * humanized-filename captions", etc. instead of duplicating it.
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { readImageTitle } = require("./read-image-title.js");

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

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

// Subfolders of dir, excluding "_template" and dotfiles, natural-sorted.
function listContentFolders(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_template" && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort(naturalCompare);
}

function readJsonIfExists(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Image files in assetsDir, natural-sorted, with { src, caption, _file }.
// Caption is embedded Title metadata if present, else a humanized filename.
function buildImages(assetsDir) {
  const files = fs.readdirSync(assetsDir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort(naturalCompare);

  return files.map((f) => {
    const title = readImageTitle(path.join(assetsDir, f));
    return { src: "assets/" + f, caption: title || humanize(f), _file: f };
  });
}

function imageHasMetadataTitle(assetsDir, file) {
  return readImageTitle(path.join(assetsDir, file)) !== null;
}

function jsStringLiteral(s) {
  return JSON.stringify(s);
}

module.exports = {
  IMAGE_EXT: IMAGE_EXT,
  naturalCompare: naturalCompare,
  humanize: humanize,
  listContentFolders: listContentFolders,
  readJsonIfExists: readJsonIfExists,
  buildImages: buildImages,
  imageHasMetadataTitle: imageHasMetadataTitle,
  jsStringLiteral: jsStringLiteral
};
