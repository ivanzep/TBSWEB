#!/usr/bin/env python3
"""
Generates design-review's assets/js/packages.js, folder-tree.js and
projects.js from a published Google Sheet CSV — the same "Folder Path /
File Name / File ID / MIME Type / URL" table the studio has been pasting
into this project by hand. Run by .github/workflows/sync-drive-sheet.yml;
see design-review/README.md's "Keeping it in sync automatically" section
for how to point it at your sheet.

Stdlib only — no pip install step needed in the workflow.

── Expected sheet columns ────────────────────────────────────────────────
  Folder Path   PROJECT REVIEWS/<Project Name>/<...any depth.../<Set Name>
  File Name     e.g. "CLEARVIEW DECK-20260821-01.jpg"
  File ID       the Drive file ID (the part between /d/ and /view in its URL)
  MIME Type     e.g. "image/jpeg" — used to infer image/pdf/video

Everything under the LEAF folder of a path becomes one review set (a
packages.js entry); every folder above that becomes a folder-tree.js node.
A folder that has files of its own AND a subfolder (e.g. Bungalow A's
20260416-…-AI, which also has an ARCHIVE subfolder) becomes a node with
both `set` and `children` — see folder-tree.js's own header for that shape.
A row whose Folder Path doesn't start with ROOT_PREFIX, or has nothing
after the project name (a file sitting directly in the project's own root,
with no set folder to hold it), is skipped rather than guessed at.
"""
import csv
import io
import json
import os
import re
import sys
from collections import OrderedDict, defaultdict
from urllib.request import urlopen

ROOT_PREFIX = "PROJECT REVIEWS/"

IMAGE_EXT = {"jpg", "jpeg", "png", "webp", "gif", "avif", "bmp", "tif", "tiff"}
VIDEO_EXT = {"mp4", "mov", "webm", "m4v"}


def slugify(s):
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.strip().lower()).strip("-")
    return s or "item"


def strip_ext(name):
    return re.sub(r"\.[^.]+$", "", name)


def natural_key(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", str(s))]


def infer_type(file_name, mime):
    mime = (mime or "").strip().lower()
    if mime.startswith("image/"):
        return "image"
    if mime == "application/pdf":
        return "pdf"
    if mime.startswith("video/"):
        return "video"
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
    if ext in IMAGE_EXT:
        return "image"
    if ext == "pdf":
        return "pdf"
    if ext in VIDEO_EXT:
        return "video"
    return "file"


def fetch_rows(url):
    with urlopen(url) as resp:
        text = resp.read().decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


def group_by_project(rows):
    # project name -> { path-segments-under-project (tuple) -> [row, ...] }
    projects = OrderedDict()
    skipped = 0
    for row in rows:
        path = (row.get("Folder Path") or "").strip()
        if not path.startswith(ROOT_PREFIX):
            skipped += 1
            continue
        parts = [p for p in path[len(ROOT_PREFIX):].split("/") if p.strip()]
        if len(parts) < 2:
            # Need at least "<Project>/<Set>" — a bare project-root file has
            # no set folder to belong to.
            skipped += 1
            continue
        project_name, rel_parts = parts[0], tuple(parts[1:])
        projects.setdefault(project_name, defaultdict(list))[rel_parts].append(row)
    return projects, skipped


def build_tree(prefix, set_slug_by_path):
    next_names = sorted(
        {rel[len(prefix)] for rel in set_slug_by_path if rel[:len(prefix)] == prefix and len(rel) > len(prefix)},
        key=natural_key,
    )
    nodes = []
    for name in next_names:
        child_prefix = prefix + (name,)
        node = {"title": name}
        if child_prefix in set_slug_by_path:
            node["set"] = set_slug_by_path[child_prefix]
        children = build_tree(child_prefix, set_slug_by_path)
        if children:
            node["children"] = children
        nodes.append(node)
    return nodes


def build_project(project_name, sets_by_path):
    # sets_by_path is insertion-ordered (first-seen-in-the-sheet order) —
    # iterating it directly keeps that as the display order, same
    # "order = display order" convention packages.js already documents.
    set_slug_by_path = {rel: slugify("-".join(rel)) for rel in sets_by_path}

    sets = []
    for rel_parts, rows in sets_by_path.items():
        items = []
        for row in sorted(rows, key=lambda r: natural_key(r.get("File Name", ""))):
            file_id = (row.get("File ID") or "").strip()
            file_name = (row.get("File Name") or "").strip()
            if not file_id or not file_name:
                continue
            items.append({
                "id": file_id,
                "name": strip_ext(file_name),
                "type": infer_type(file_name, row.get("MIME Type"))
            })
        sets.append({
            "slug": set_slug_by_path[rel_parts],
            "title": rel_parts[-1],
            "issued": "",
            "note": "",
            "driveFolderId": "",
            "items": items
        })

    tree = build_tree((), set_slug_by_path)
    return sets, tree


HEADER = """/*
 * GENERATED FILE — do not hand-edit.
 *
 * Produced by .github/scripts/generate_manifest.py from the published Drive
 * sheet (design-review/README.md → "Keeping it in sync automatically"). To
 * change what's here, edit the sheet and either wait for the scheduled sync
 * or run the "Sync Drive Sheet" workflow by hand — a hand edit to this file
 * is overwritten on the next run.
 */
"""


def write_js(path, var_name, value):
    with open(path, "w") as f:
        f.write(HEADER)
        f.write("window.%s = %s;\n" % (var_name, json.dumps(value, indent=2)))


def main():
    if len(sys.argv) != 2:
        print("usage: generate_manifest.py <site-dir>", file=sys.stderr)
        sys.exit(2)
    site_dir = sys.argv[1]

    url = os.environ.get("DRIVE_SHEET_CSV_URL", "").strip()
    if not url:
        print("DRIVE_SHEET_CSV_URL is not set — nothing to sync yet. "
              "See design-review/README.md for how to publish and wire up the sheet.")
        return

    rows = fetch_rows(url)
    projects, skipped = group_by_project(rows)
    if skipped:
        print("Skipped %d row(s) with no recognizable project/set path." % skipped, file=sys.stderr)
    if not projects:
        print("No usable rows found in the sheet — leaving existing files untouched.", file=sys.stderr)
        return

    packages_out = OrderedDict()
    tree_out = OrderedDict()
    project_list = []

    for project_name, sets_by_path in projects.items():
        proj_slug = slugify(project_name)
        sets, tree = build_project(project_name, sets_by_path)
        packages_out[proj_slug] = sets
        tree_out[proj_slug] = tree
        project_list.append({
            "slug": proj_slug,
            "title": project_name,
            "client": "", "location": "", "scope": "", "phase": "", "year": "",
            "summary": "", "thumbnail": "", "driveFolderId": ""
        })

    js_dir = os.path.join(site_dir, "assets", "js")
    write_js(os.path.join(js_dir, "packages.js"), "PACKAGES", packages_out)
    write_js(os.path.join(js_dir, "folder-tree.js"), "FOLDER_TREE", tree_out)
    write_js(os.path.join(js_dir, "projects.js"), "PROJECTS", project_list)

    total_items = sum(len(s["items"]) for sets in packages_out.values() for s in sets)
    print("Wrote %d project(s), %d item(s) total." % (len(project_list), total_items))


if __name__ == "__main__":
    main()
