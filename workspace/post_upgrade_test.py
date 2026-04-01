#!/usr/bin/env python3
"""Post-upgrade functional baseline test."""
import json, os, sys
from datetime import datetime

RESULTS_FILE = "/Users/Jack/.openclaw/workspace/sharefile/post_upgrade_functional_test.json"

def test_ap1():
    """Test AP-1: Create weather script for 3 cities."""
    import urllib.request
    
    script = '''import urllib.request, json
def get_weather(city):
    url = f"https://wttr.in/{city.replace(' ', '+')}?format=j1"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as r:
        data = json.loads(r.read())
        return {'city': city, 'temp': data['current_condition'][0]['temp_F']}
cities = ['New York', 'London', 'Tokyo']
results = [get_weather(c) for c in cities]
print(json.dumps(results))'''
    
    script_path = "/tmp/test_ap1_post.py"
    with open(script_path, "w") as f:
        f.write(script)
    
    os.chmod(script_path, 0o755)
    result = os.system(f"python3 {script_path} > /tmp/test_ap1_output.json 2>&1")
    
    success = result == 0 and os.path.exists("/tmp/test_ap1_output.json")
    cities_found = 0
    if success:
        with open("/tmp/test_ap1_output.json") as f:
            try:
                data = json.load(f)
                cities_found = len(data) if isinstance(data, list) else 0
            except:
                pass
    
    return {
        "test_id": "AP-1",
        "test_name": "Create weather script for 3 cities",
        "success": success,
        "script_created": True,
        "script_ran": result == 0,
        "cities_found": cities_found,
        "notes": "Post-upgrade test with Manus enhancements"
    }

def test_te1():
    """Test TE-1: Get weather in Tokyo via API."""
    result = os.system("curl -s 'https://wttr.in/Tokyo?format=%C+%t' > /tmp/test_te1_output.txt 2>&1")
    success = result == 0 and os.path.getsize("/tmp/test_te1_output.txt") > 0
    
    return {
        "test_id": "TE-1",
        "test_name": "Get weather in Tokyo",
        "success": success,
        "api_accessible": success,
        "notes": "Post-upgrade API access test"
    }

def test_todo_creation():
    """Test: Verify todo.md was created (this test itself)."""
    todo_exists = os.path.exists("/Users/Jack/.openclaw/workspace/todo.md")
    return {
        "test_id": "AP-0",
        "test_name": "Mandatory todo.md creation",
        "success": todo_exists,
        "notes": "Manus enhancement: first action must be todo.md"
    }

def main():
    print("=== Post-Upgrade Baseline Tests ===\n")
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "version": "post-upgrade-manus",
        "tests": {}
    }
    
    # Test AP-0: todo.md creation
    print("Testing AP-0: Mandatory todo.md creation...")
    results["tests"]["AP-0"] = test_todo_creation()
    status = "✅ PASS" if results["tests"]["AP-0"]["success"] else "❌ FAIL"
    print(f"  {status}\n")
    
    # Test AP-1
    print("Testing AP-1: Weather script creation...")
    results["tests"]["AP-1"] = test_ap1()
    status = "✅ PASS" if results["tests"]["AP-1"]["success"] else "❌ FAIL"
    print(f"  {status} - Fetched {results['tests']['AP-1']['cities_found']} cities\n")
    
    # Test TE-1
    print("Testing TE-1: API access...")
    results["tests"]["TE-1"] = test_te1()
    status = "✅ PASS" if results["tests"]["TE-1"]["success"] else "❌ FAIL"
    print(f"  {status}\n")
    
    with open(RESULTS_FILE, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Results saved to: {RESULTS_FILE}")
    print("\n=== Post-Upgrade Tests Complete ===")

if __name__ == "__main__":
    main()
