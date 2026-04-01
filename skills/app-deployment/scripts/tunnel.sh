#!/bin/bash
# Cloudflare Tunnel wrapper
echo "Starting Cloudflare tunnel..."
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared
    chmod +x /tmp/cloudflared
    CLOUDFLARED=/tmp/cloudflared
else
    CLOUDFLARED=cloudflared
fi

PORT=${1:-8080}
echo "Tunneling port $PORT"
$CLOUDFLARED tunnel --url "http://localhost:$PORT"
