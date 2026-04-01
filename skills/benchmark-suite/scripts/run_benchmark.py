#!/usr/bin/env python3
"""OpenClaw Benchmark Runner - List and track test results."""
import json, os, sys
from datetime import datetime

RESULTS_FILE = "~/.openclaw/workspace/benchmark_results.json"

TASKS = {
    "AP-1": "Autonomy: Create weather script for 3 cities",
    "AP-2": "Autonomy: Research and compare 3 JS frameworks",
    "AP-3": "Autonomy: Build calculator web app",
    "AP-4": "Autonomy: Fix broken script with 3 bugs",
    "AP-5": "Autonomy: Analyze CSV and create report",
    "TE-1": "Tools: Get weather in Tokyo",
    "TE-2": "Tools: Screenshot example.com",
    "TE-3": "Tools: Deploy hello world web app",
    "TE-4": "Tools: Search AI news and summarize",
    "TE-5": "Tools: Create and query SQLite DB",
    "MC-1": "Memory: Remember and recall info",
    "MC-2": "Memory: Long research with file saves",
    "MC-3": "Memory: Reference earlier discussion",
    "MC-4": "Memory: Multi-step context switching",
    "MC-5": "Memory: Summarize last 3 tasks",
    "VF-1": "Verify: Write and test Python function",
    "VF-2": "Verify: Factual question with citation",
    "VF-3": "Verify: Create and verify file exists",
    "VF-4": "Verify: Fix broken code (loop detection)",
    "VF-5": "Verify: Install and verify package",
    "DQ-1": "Delivery: Explain Docker simply",
    "DQ-2": "Delivery: Compare 3 databases (table)",
    "DQ-3": "Delivery: Write 500-word AI report",
    "DQ-4": "Delivery: Show disk usage (CLI)",
    "DQ-5": "Delivery: Debug error message",
}

def load_results():
    if os.path.exists(RESULTS_FILE):
        with open(RESULTS_FILE) as f:
            return json.load(f)
    return {}

def save_result(test_id, score, notes=""):
    results = load_results()
    results[test_id] = {"score": score, "notes": notes, "timestamp": datetime.now().isoformat()}
    with open(RESULTS_FILE, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved: {test_id} = {score}")

def list_tasks():
    results = load_results()
    print(f"\n{'ID':<6} {'Description':<50} {'Result':<10}")
    print("=" * 70)
    for tid, desc in TASKS.items():
        r = results.get(tid, {})
        score = r.get("score", "-")
        print(f"{tid:<6} {desc:<50} {score:<10}")
    scored = [r["score"] for r in results.values() if r.get("score") in ("PASS", "PARTIAL", "FAIL")]
    if scored:
        pts = sum(2 if s=="PASS" else 1 if s=="PARTIAL" else 0 for s in scored)
        print(f"\nOverall: {pts}/{len(scored)*2} ({pts/(len(scored)*2)*100:.0f}%)")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "--list":
        list_tasks()
    elif sys.argv[1] == "--score" and len(sys.argv) >= 4:
        save_result(sys.argv[2], sys.argv[3], " ".join(sys.argv[4:]))
    else:
        tid = sys.argv[1]
        if tid in TASKS:
            print(f"\nTest {tid}: {TASKS[tid]}")
            print("Run this task with OpenClaw, then score with:")
            print(f"  python run_benchmark.py --score {tid} PASS|PARTIAL|FAIL [notes]")
        else:
            print(f"Unknown test: {tid}")
