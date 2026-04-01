#!/usr/bin/env python3
"""Baseline benchmark test for OpenClaw pre-upgrade evaluation."""
import json, os, sys
from datetime import datetime

TASKS = {
    "AP-1": {"desc": "Autonomy: Create weather script for 3 cities", "category": "Autonomy & Planning"},
    "AP-2": {"desc": "Autonomy: Research and compare 3 JS frameworks", "category": "Autonomy & Planning"},
    "AP-3": {"desc": "Autonomy: Build calculator web app", "category": "Autonomy & Planning"},
    "AP-4": {"desc": "Autonomy: Fix broken script with 3 bugs", "category": "Autonomy & Planning"},
    "AP-5": {"desc": "Autonomy: Analyze CSV and create report", "category": "Autonomy & Planning"},
    "TE-1": {"desc": "Tools: Get weather in Tokyo", "category": "Tool Ecosystem"},
    "TE-2": {"desc": "Tools: Screenshot example.com", "category": "Tool Ecosystem"},
    "TE-3": {"desc": "Tools: Deploy hello world web app", "category": "Tool Ecosystem"},
    "TE-4": {"desc": "Tools: Search AI news and summarize", "category": "Tool Ecosystem"},
    "TE-5": {"desc": "Tools: Create and query SQLite DB", "category": "Tool Ecosystem"},
    "MC-1": {"desc": "Memory: Remember and recall info", "category": "Memory & Context"},
    "MC-2": {"desc": "Memory: Long research with file saves", "category": "Memory & Context"},
    "MC-3": {"desc": "Memory: Reference earlier discussion", "category": "Memory & Context"},
    "MC-4": {"desc": "Memory: Multi-step context switching", "category": "Memory & Context"},
    "MC-5": {"desc": "Memory: Summarize last 3 tasks", "category": "Memory & Context"},
    "VF-1": {"desc": "Verify: Write and test Python function", "category": "Verification"},
    "VF-2": {"desc": "Verify: Factual question with citation", "category": "Verification"},
    "VF-3": {"desc": "Verify: Create and verify file exists", "category": "Verification"},
    "VF-4": {"desc": "Verify: Fix broken code (loop detection)", "category": "Verification"},
    "VF-5": {"desc": "Verify: Install and verify package", "category": "Verification"},
    "DQ-1": {"desc": "Delivery: Explain Docker simply", "category": "Delivery Quality"},
    "DQ-2": {"desc": "Delivery: Compare 3 databases (table)", "category": "Delivery Quality"},
    "DQ-3": {"desc": "Delivery: Write 500-word AI report", "category": "Delivery Quality"},
    "DQ-4": {"desc": "Delivery: Show disk usage (CLI)", "category": "Delivery Quality"},
    "DQ-5": {"desc": "Delivery: Debug error message", "category": "Delivery Quality"},
}

SCORES = {"PASS": 2, "PARTIAL": 1, "FAIL": 0}

def generate_baseline():
    """Generate baseline template for manual scoring."""
    baseline = {
        "generated_at": datetime.now().isoformat(),
        "version": "pre-upgrade",
        "notes": "Run each task manually and score PASS (2), PARTIAL (1), or FAIL (0)",
        "tasks": {}
    }
    
    for tid, info in TASKS.items():
        baseline["tasks"][tid] = {
            "category": info["category"],
            "description": info["desc"],
            "score": "NOT_TESTED",
            "points": 0,
            "notes": ""
        }
    
    return baseline

def calculate_score(results):
    """Calculate overall score from results."""
    total_possible = len(TASKS) * 2
    earned = sum(SCORES.get(t["score"], 0) for t in results.get("tasks", {}).values() if t["score"] in SCORES)
    percentage = (earned / total_possible) * 100 if total_possible > 0 else 0
    return earned, total_possible, percentage

def main():
    baseline = generate_baseline()
    
    earned, total, pct = calculate_score(baseline)
    baseline["summary"] = {
        "earned_points": earned,
        "total_possible": total,
        "percentage": round(pct, 1),
        "status": "BASELINE_TEMPLATE"
    }
    
    output_path = "/Users/Jack/.openclaw/workspace/sharefile/baseline_results.json"
    with open(output_path, "w") as f:
        json.dump(baseline, f, indent=2)
    
    print(f"=== OpenClaw Baseline Benchmark ===")
    print(f"Generated: {baseline['generated_at']}")
    print(f"Output: {output_path}")
    print(f"\nTotal tasks: {len(TASKS)}")
    print(f"Categories:")
    cats = set(t["category"] for t in TASKS.values())
    for c in sorted(cats):
        count = sum(1 for t in TASKS.values() if t["category"] == c)
        print(f"  - {c}: {count} tests")
    print(f"\n=== Next Steps ===")
    print("1. Review baseline_results.json")
    print("2. Score each task manually after running it")
    print("3. Save scored results for post-upgrade comparison")

if __name__ == "__main__":
    main()
