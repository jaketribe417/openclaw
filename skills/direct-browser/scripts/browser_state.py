#!/usr/bin/env python3
"""Browser state persistence - save and restore cookies/sessions."""
import json, os

STATE_DIR = "~/.openclaw/tmp/browser_state"

def save_cookies(page, session_name="default"):
    """Save browser cookies to file."""
    os.makedirs(STATE_DIR, exist_ok=True)
    cookies = page.context.cookies()
    path = os.path.join(STATE_DIR, f"{session_name}_cookies.json")
    with open(path, "w") as f:
        json.dump(cookies, f, indent=2)
    print(f"Saved {len(cookies)} cookies to {path}")
    return path

def load_cookies(context, session_name="default"):
    """Load cookies into browser context."""
    path = os.path.join(STATE_DIR, f"{session_name}_cookies.json")
    if not os.path.exists(path):
        print(f"No saved cookies found for session: {session_name}")
        return False
    with open(path) as f:
        cookies = json.load(f)
    context.add_cookies(cookies)
    print(f"Loaded {len(cookies)} cookies from {path}")
    return True

def save_storage(page, session_name="default"):
    """Save localStorage and sessionStorage."""
    os.makedirs(STATE_DIR, exist_ok=True)
    storage = page.evaluate("""() => {
        const data = {};
        data.localStorage = {...localStorage};
        try { data.sessionStorage = {...sessionStorage}; } catch(e) { data.sessionStorage = {}; }
        return data;
    }""")
    path = os.path.join(STATE_DIR, f"{session_name}_storage.json")
    with open(path, "w") as f:
        json.dump(storage, f, indent=2)
    print(f"Saved storage state to {path}")
    return path

def list_sessions():
    """List available saved sessions."""
    if not os.path.exists(STATE_DIR):
        print("No saved sessions."); return []
    sessions = set()
    for f in os.listdir(STATE_DIR):
        name = f.rsplit("_", 1)[0]
        sessions.add(name)
    for s in sorted(sessions):
        print(f"  - {s}")
    return sorted(sessions)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["list"])
    args = parser.parse_args()
    if args.action == "list": list_sessions()
