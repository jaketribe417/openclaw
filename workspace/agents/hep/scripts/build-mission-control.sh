#!/bin/bash
# HEP Mission Control Build Script - 2D Pixel TRON Edition
# This script delegates the build task to Cursor AI

set -e

cd /Users/Jack/.openclaw/workspace/jake-mission-control

# Ensure public directory exists
mkdir -p public

# Check if Cursor is installed
if ! command -v agent &> /dev/null; then
    echo "Installing Cursor CLI..."
    curl https://cursor.com/install -fsS | bash
fi

# Create the prompt file
PROMPT_FILE=$(mktemp)
cat > "$PROMPT_FILE" << 'ENDOFPROMPT'
Create a complete Mission Control dashboard HTML file with 2D Pixel TRON aesthetic.

REQUIREMENTS:
1. Single HTML file at /Users/Jack/.openclaw/workspace/jake-mission-control/public/mission-control-tron.html
2. TRON Legacy style: black background (#000000), cyan grid lines, neon accents (cyan #00FFFF, blue #00BFFF, magenta #FF00FF, orange #FF6600)
3. Font: "Press Start 2P" from Google Fonts
4. No rounded corners, sharp angular panels, CRT flicker effects
5. Strong CSS glows (box-shadow 0 0 10px/20px/30px)

WIDGETS NEEDED:
- Header: "MISSION CONTROL – JAKE v1.0.0 // COO MODE", live UTC clock, status dot, WIDGETS button, LIVE indicator
- JASON TASKS: stats cards, +ADD button, draggable cards, detail modal, real-time updates
- JAKE TASKS: same as above with sample tasks
- AGENT GRID: Jake/HEP/Joy/Harlan cards, agent detail panel, filters, +ADD button
- PROJECTS: progress bars, timeline, detail modal, critical badge
- SKILLS INVENTORY: skill cards, detail modal, active count, +NEW SKILL button

FEATURES:
- Tabs: Dashboard/Agents/Tasks/Projects (wired with JS)
- Real-time: setInterval every 3000ms
- localStorage for persistence
- Manual refresh button + Ctrl/Cmd+R
- All buttons interactive with hover glow
- Footer with build info

Include all CSS in style tag and all JS in script tag. Make it fully self-contained.
ENDOFPROMPT

# Run Cursor in cloud mode with the prompt
echo "Delegating to Cursor Cloud Agent..."
agent --trust -c "$(cat "$PROMPT_FILE")"

# Cleanup
rm "$PROMPT_FILE"

echo "Cursor task submitted. Check https://cursor.com/agents for progress."

# Create a progress marker
mkdir -p /Users/Jack/.openclaw/workspace/agents/hep/logs
echo "Build initiated: $(date)" > /Users/Jack/.openclaw/workspace/agents/hep/logs/cursor-build.log