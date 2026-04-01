#!/usr/bin/env python3
"""Initialize a document project with outline and section files."""
import argparse, os, json
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="Initialize document project")
    parser.add_argument("--title", required=True, help="Document title")
    parser.add_argument("--sections", required=True, help="Comma-separated section names")
    parser.add_argument("--output", default="./drafts", help="Output directory")
    args = parser.parse_args()

    os.makedirs(args.output, exist_ok=True)
    sections = [s.strip() for s in args.sections.split(",")]

    # Create outline
    lines = [f"# {args.title} - Outline", ""]
    for i, s in enumerate(sections, 1):
        lines.append(f"## Section {i}: {s}")
        lines.append("- Goal: [describe what this section covers]")
        lines.append("- Key points:")
        lines.append("  - ")
        lines.append("")
    with open(os.path.join(args.output, "outline.md"), "w") as f:
        f.write(chr(10).join(lines))

    # Create section files
    for i, s in enumerate(sections, 1):
        slug = s.lower().replace(" ", "_")
        fname = f"section_{i:02d}_{slug}.md"
        with open(os.path.join(args.output, fname), "w") as f:
            f.write(f"# {s}" + chr(10) + chr(10))

    # Create metadata
    meta = {"title": args.title, "sections": sections,
            "created": datetime.now().isoformat(), "status": "draft"}
    with open(os.path.join(args.output, "metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    with open(os.path.join(args.output, "sources.md"), "w") as f:
        f.write("# Sources" + chr(10) + chr(10))

    print(f"Document project initialized in {args.output}")
    print(f"Title: {args.title}")
    print(f"Sections: {len(sections)}")
    for i, s in enumerate(sections, 1):
        slug = s.lower().replace(" ", "_")
        print(f"  {i}. section_{i:02d}_{slug}.md")

if __name__ == "__main__":
    main()
