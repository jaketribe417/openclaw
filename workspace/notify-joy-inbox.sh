#!/bin/bash
# Send notification to Joy email inbox

# First, try to get the inbox ID via API
if curl -sL "https://api.joy.to/1.0/inbox?inbox_id=jaketribe_bot@agentmail.to" > /tmp/joy_api_response.json 2>&1; then
    echo "Received from API: $(cat /tmp/joy_api_response.json)"
else
    echo "Could not reach Joy API, trying local approach..."
fi

# If API not available, check for the inbox in your workspace
if grep -q "jaketribe_bot@agentmail.to" /Users/Jack/.openclaw/workspace/*.json 2>/dev/null; then
    echo "Found inbox with matching ID in workspace"
fi

# Also check if there's a session with that inbox
if grep -q "inbox=jaketribe_bot@agentmail.to" /Users/Jack/.openclaw/workspace/sessions_*.jsonl 2>/dev/null; then
    echo "Found session with inbox: $(grep "inbox=jaketribe_bot@agentmail.to" /Users/Jack/.openclaw/workspace/sessions_*.jsonl)"
fi
