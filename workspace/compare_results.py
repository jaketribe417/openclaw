#!/usr/bin/env python3
"""Compare pre and post upgrade results."""
import json

PRE = "/Users/Jack/.openclaw/workspace/sharefile/baseline_functional_test.json"
POST = "/Users/Jack/.openclaw/workspace/sharefile/post_upgrade_functional_test.json"

def load(path):
    with open(path) as f:
        return json.load(f)

pre = load(PRE)
post = load(POST)

print("=" * 60)
print("     BASELINE COMPARISON: PRE vs POST UPGRADE")
print("=" * 60)
print()

# Core tests
print("CORE FUNCTIONAL TESTS")
print("-" * 60)
for tid in ["AP-1", "TE-1"]:
    pre_test = pre["tests"].get(tid, {})
    post_test = post["tests"].get(tid, {})
    
    pre_status = "✅ PASS" if pre_test.get("success") else "❌ FAIL"
    post_status = "✅ PASS" if post_test.get("success") else "❌ FAIL"
    
    print(f"{tid}: {pre_test.get('test_name', tid)}")
    print(f"  Pre-upgrade:  {pre_status}")
    print(f"  Post-upgrade: {post_status}")
    print()

# New capabilities
print("NEW CAPABILITIES (Manus Enhancements)")
print("-" * 60)
if "AP-0" in post["tests"]:
    todo_test = post["tests"]["AP-0"]
    status = "✅ PASS" if todo_test.get("success") else "❌ FAIL"
    print(f"AP-0: {todo_test.get('test_name')}")
    print(f"  Status: {status}")
    print(f"  Notes: {todo_test.get('notes')}")
    print()

print("SUMMARY")
print("-" * 60)
pre_pass = sum(1 for t in pre["tests"].values() if t.get("success"))
post_pass = sum(1 for t in post["tests"].values() if t.get("success"))
total_pre = len(pre["tests"])
total_post = len(post["tests"])

print(f"Pre-upgrade:  {pre_pass}/{total_pre} tests passed")
print(f"Post-upgrade: {post_pass}/{total_post} tests passed")
print(f"New tests:    {total_post - total_pre} (Manus-specific)")
print()

if post_pass > pre_pass:
    print("✅ UPGRADE SUCCESSFUL")
    print(f"   +{post_pass - pre_pass} new capability tests passing")
elif post_pass == pre_pass:
    print("✅ BASELINE MAINTAINED")
    print("   Core functionality preserved")
else:
    print("⚠️  REGRESSION DETECTED")
    print("   Review failed tests")

print()
print("=" * 60)
print("DETAILED RESULTS")
print("=" * 60)
print("\nPre-upgrade (baseline):")
for tid, t in pre["tests"].items():
    status = "PASS" if t.get("success") else "FAIL"
    print(f"  {tid}: {status}")

print("\nPost-upgrade:")
for tid, t in post["tests"].items():
    status = "PASS" if t.get("success") else "FAIL"
    print(f"  {tid}: {status}")

print()
print("=" * 60)
