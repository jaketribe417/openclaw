---
name: app-deployment
version: 1.0.0
description: Deploy web applications instantly with Flask/Node.js and expose them via public URLs using Cloudflare tunnels.
tags: [deployment, web, flask, nodejs, tunnel, hosting]
author: openclaw
---

# App Deployment Skill

Deploy web applications and expose them to the internet instantly.

## Capabilities
- Create Flask (Python) or Express (Node.js) web apps from templates
- Serve static HTML/CSS/JS sites
- Expose local servers via Cloudflare Tunnel (free, no account)
- Run servers in background with PID tracking

## Procedures

### Procedure: Deploy Static Site
1. Run: `python ~/.openclaw/skills/app-deployment/scripts/deploy_static.py <dir> --port 8080`
2. Optionally add `--background` to run as daemon
3. Expose via: `python ~/.openclaw/skills/app-deployment/scripts/tunnel.py --port 8080`

### Procedure: Deploy Flask App
1. Run: `python ~/.openclaw/skills/app-deployment/scripts/deploy_flask.py --template api --port 5000`
2. Templates: `api` (JSON endpoints), `web` (HTML pages), `dashboard` (charts)
3. Add `--output app.py` to save file instead of running
4. Add `--background` to daemonize

### Procedure: Create Public URL
1. Ensure cloudflared installed: `which cloudflared || (wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared)`
2. Run: `cloudflared tunnel --url http://localhost:<port>`
3. Copy the `*.trycloudflare.com` URL from output
4. Kill with: `kill <PID>` when done

### Procedure: Deploy Express App  
1. Run: `node ~/.openclaw/skills/app-deployment/scripts/deploy_express.js --port 3000`
2. Requires: `npm install -g express` (auto-installed by script)

## Dependencies
- flask (`pip install flask`)
- cloudflared binary (auto-installed by tunnel.py)
- express (`npm install express`) for Node.js apps

## Notes
- All servers bind to 0.0.0.0 for container accessibility
- Cloudflare Tunnel is free, no account needed, random URLs
- Use `--background` flag to get PID for later cleanup
- Flask runs with debug=True for auto-reload
