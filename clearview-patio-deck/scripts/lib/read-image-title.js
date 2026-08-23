/*
 * Dependency-free JPEG "Title" metadata reader for the generator script.
 * Walks JPEG APP segments looking for a title, checked in this priority
 * (matches what Photoshop/Bridge/Lightroom's "Title" field actually writes,
 * most-authoritative first):
 *   1. XMP dc:title       (APP1, "http://ns.adobe.com/xap/1.0/")
 *   2. IPTC Object Name   (APP13 Photoshop resource 0x0404, IIM record 2:05)
 *   3. EXIF XPTitle       (APP1 Exif, tag 0x9C9B — Windows Explorer "Title")
 *   4. EXIF ImageDescription (APP1 Exif, tag 0x010E)
 * Returns null if the file isn't a JPEG or none of the above are present —
 * callers fall back to a humanized filename in that case.
 */
"use strict";

const fs = require("fs");

function readImageTitle(filePath) {
  if (!/\.jpe?g$/i.test(filePath)) return null;
  let buf;
  try {
    buf = fs.readFileSync(filePath);
  } catch (err) {
    return null;
  }
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;

  let xmpTitle = null;
  let iptcTitle = null;
  let exifXpTitle = null;
  let exifDescription = null;

  let offset = 2;
  while (offset + 4 <= buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    // SOS (start of scan) — image data follows, no more metadata segments.
    if (marker === 0xda || marker === 0xd9) break;
    // Standalone markers with no length/payload.
    if (marker >= 0xd0 && marker <= 0xd7) { offset += 2; continue; }

    const segLen = buf.readUInt16BE(offset + 2);
    const segStart = offset + 4;
    const segEnd = offset + 2 + segLen;
    if (segEnd > buf.length) break;
    const seg = buf.subarray(segStart, segEnd);

    if (marker === 0xe1) {
      // APP1 — either Exif or XMP.
      if (startsWithAscii(seg, "Exif\0\0")) {
        const tiff = seg.subarray(6);
        const exif = readExifTitles(tiff);
        if (exif.xpTitle && !exifXpTitle) exifXpTitle = exif.xpTitle;
        if (exif.description && !exifDescription) exifDescription = exif.description;
      } else if (startsWithAscii(seg, "http://ns.adobe.com/xap/1.0/\0")) {
        const xml = seg.subarray(29).toString("utf8");
        const found = extractXmpTitle(xml);
        if (found && !xmpTitle) xmpTitle = found;
      }
    } else if (marker === 0xed) {
      // APP13 — Photoshop IRB, may contain IPTC IIM.
      if (startsWithAscii(seg, "Photoshop 3.0\0")) {
        const found = extractIptcObjectName(seg.subarray(14));
        if (found && !iptcTitle) iptcTitle = found;
      }
    }

    offset = segEnd;
  }

  return xmpTitle || iptcTitle || exifXpTitle || exifDescription || null;
}

function startsWithAscii(buf, str) {
  if (buf.length < str.length) return false;
  return buf.subarray(0, str.length).toString("latin1") === str;
}

function extractXmpTitle(xml) {
  // <dc:title><rdf:Alt><rdf:li xml:lang="x-default">TEXT</rdf:li>...
  const m = xml.match(/<dc:title>[\s\S]*?<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/);
  if (!m) return null;
  const text = m[1].trim();
  return text || null;
}

// Photoshop Image Resource Blocks: "8BIM" + 2-byte resource ID + pascal name
// (padded to even) + 4-byte data length + data (padded to even).
function extractIptcObjectName(irb) {
  let i = 0;
  while (i + 8 <= irb.length) {
    if (irb.toString("latin1", i, i + 4) !== "8BIM") break;
    const resourceId = irb.readUInt16BE(i + 4);
    let p = i + 6;
    const nameLen = irb[p];
    p += 1 + nameLen;
    if ((1 + nameLen) % 2 !== 0) p += 1; // pad to even
    if (p + 4 > irb.length) break;
    const dataLen = irb.readUInt32BE(p);
    p += 4;
    const dataEnd = p + dataLen;
    if (dataEnd > irb.length) break;

    if (resourceId === 0x0404) {
      const iim = irb.subarray(p, dataEnd);
      const name = readIimObjectName(iim);
      if (name) return name;
    }

    i = dataEnd + (dataLen % 2 !== 0 ? 1 : 0);
  }
  return null;
}

// IIM record 2 (2:xx application record), dataset 05 = Object Name (the
// field Photoshop/Bridge display and edit as "Title").
function readIimObjectName(iim) {
  let i = 0;
  while (i + 5 <= iim.length) {
    if (iim[i] !== 0x1c) break; // IIM tag marker
    const record = iim[i + 1];
    const dataset = iim[i + 2];
    const len = iim.readUInt16BE(i + 3);
    const dataStart = i + 5;
    if (dataStart + len > iim.length) break;
    if (record === 2 && dataset === 5) {
      return iim.toString("utf8", dataStart, dataStart + len).trim() || null;
    }
    i = dataStart + len;
  }
  return null;
}

// Minimal TIFF/EXIF IFD0 reader for ImageDescription (0x010E) and
// XPTitle (0x9C9B, UTF-16LE, EXIF's Windows-only "Title" tag).
function readExifTitles(tiff) {
  const result = { description: null, xpTitle: null };
  if (tiff.length < 8) return result;
  const little = tiff.toString("latin1", 0, 2) === "II";
  const u16 = (o) => (little ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o) => (little ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));

  const ifd0Offset = u32(4);
  if (ifd0Offset + 2 > tiff.length) return result;
  const entryCount = u16(ifd0Offset);
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    if (entryOffset + 12 > tiff.length) break;
    const tag = u16(entryOffset);
    const type = u16(entryOffset + 2);
    const count = u32(entryOffset + 4);
    const valueFieldOffset = entryOffset + 8;

    if (tag === 0x010e && type === 2) {
      // ASCII, count includes the trailing null.
      const dataOffset = count <= 4 ? valueFieldOffset : u32(valueFieldOffset);
      if (dataOffset + count <= tiff.length) {
        const str = tiff.toString("latin1", dataOffset, dataOffset + count).replace(/\0+$/, "").trim();
        if (str) result.description = str;
      }
    } else if (tag === 0x9c9b) {
      // BYTE array holding a UTF-16LE null-terminated string.
      const byteLen = count; // type 1 (BYTE) => count == byte length
      const dataOffset = byteLen <= 4 ? valueFieldOffset : u32(valueFieldOffset);
      if (dataOffset + byteLen <= tiff.length) {
        const raw = tiff.subarray(dataOffset, dataOffset + byteLen);
        const str = raw.toString("utf16le").replace(/\0+$/, "").trim();
        if (str) result.xpTitle = str;
      }
    }
  }
  return result;
}

module.exports = { readImageTitle: readImageTitle };
