#!/usr/bin/env python3
"""Assemble draft sections into a final document."""
import argparse, os, json, glob

def main():
    parser = argparse.ArgumentParser(description="Assemble document")
    parser.add_argument("--drafts", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    meta_path = os.path.join(args.drafts, "metadata.json")
    title = "Document"
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
            title = meta.get("title", title)

    sections = sorted(glob.glob(os.path.join(args.drafts, "section_*.md")))
    if not sections:
        print("No section files found!"); return

    NL = chr(10)
    parts = [f"# {title}", "", "## Table of Contents", ""]
    for i, s in enumerate(sections, 1):
        with open(s) as f:
            first_line = f.readline().strip().lstrip("# ")
        parts.append(f"{i}. {first_line}")
    parts.extend(["", "---", ""])

    for s in sections:
        with open(s) as f:
            content = f.read().strip()
        parts.append(content)
        parts.extend(["", "---", ""])

    doc = NL.join(parts)
    with open(args.output, "w") as f:
        f.write(doc)

    print(f"Assembled {len(sections)} sections into {args.output}")
    print(f"Total size: {len(doc)} bytes")

if __name__ == "__main__":
    main()
