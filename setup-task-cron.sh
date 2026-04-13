#!/bin/bash
# Task Checker Cron Setup Script
# Run this to set up the automated task checking cron job

CRON_JOB="*/30 * * * * cd /Users/Jack/.openclaw && /usr/local/bin/node task-checker-cron.js >> /Users/Jack/.openclaw/logs/task-checker.log 2>&1"

echo "Setting up Task Checker Cron Job..."
echo ""
echo "This will create a cron job that runs every 30 minutes"
echo "to check TODO lists and delegate tasks to agents."
echo ""

# Create necessary directories
mkdir -p /Users/Jack/.openclaw/logs
mkdir -p /Users/Jack/.openclaw/state

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "task-checker-cron.js"; then
    echo "Cron job already exists. Updating..."
    crontab -l 2>/dev/null | grep -v "task-checker-cron.js" | crontab -
fi

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "Schedule: Every 30 minutes"
echo "Log file: /Users/Jack/.openclaw/logs/task-checker.log"
echo "State file: /Users/Jack/.openclaw/state/task-checker-state.json"
echo ""
echo "To verify: run 'crontab -l'"
echo "To remove: run 'crontab -l | grep -v task-checker-cron.js | crontab -'"
echo ""
echo "Manual run command:"
echo "  cd /Users/Jack/.openclaw && node task-checker-cron.js"
