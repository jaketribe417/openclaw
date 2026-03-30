#!/bin/bash
# Cursor CLI Installation and Verification Script
# Usage: ./scripts/cursor-check.sh

set -e

if command -v agent &> /dev/null; then
    echo "✓ Cursor CLI (agent) is installed"
    agent --version 2>/dev/null || echo "Version check failed"
    exit 0
else
    echo "✗ Cursor CLI not found. Installing..."
    curl https://cursor.com/install -fsS | bash
    
    if command -v agent &> /dev/null; then
        echo "✓ Cursor CLI installed successfully"
        exit 0
    else
        echo "✗ Installation failed. Please install manually:"
        echo "  curl https://cursor.com/install -fsS | bash"
        exit 1
    fi
fi