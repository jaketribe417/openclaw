---
name: data-apis
version: 1.0.0
description: Pre-built connectors for free public APIs - weather, finance, news, geocoding, and more. No API keys required for most endpoints.
tags: [api, data, weather, finance, news, geocoding, free]
author: openclaw
---

# Data APIs Skill

Ready-to-use connectors for free public APIs. No API keys needed.

## Quick Reference

### Weather
```bash
# Current weather by city (free, no key)
curl -s "https://wttr.in/London?format=j1" | jq '.current_condition[0]'

# Forecast
curl -s "https://wttr.in/London?format=j1" | jq '.weather'

# Simple one-liner
curl -s "wttr.in/London?format=%C+%t+%h+%w"
```

### Finance / Crypto
```bash
# Bitcoin price (CoinGecko, free)
curl -s "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd" | jq

# Exchange rates (free)
curl -s "https://open.er-api.com/v6/latest/USD" | jq '.rates | {EUR, GBP, JPY}'
```

### News / Information
```bash
# Hacker News top stories
curl -s "https://hacker-news.firebaseio.com/v0/topstories.json" | jq '.[0:10]'

# Get story details
curl -s "https://hacker-news.firebaseio.com/v0/item/STORY_ID.json" | jq '{title, url, score}'

# Wikipedia summary
curl -s "https://en.wikipedia.org/api/rest_v1/page/summary/Python_(programming_language)" | jq '{title, extract}'
```

### Geocoding & Maps
```bash
# Geocode address (Nominatim, free)
curl -s "https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1" | jq '.[0] | {lat, lon, display_name}'

# Reverse geocode
curl -s "https://nominatim.openstreetmap.org/reverse?lat=40.7128&lon=-74.0060&format=json" | jq '.display_name'
```

### IP & Network
```bash
# Your public IP and location
curl -s "https://ipapi.co/json/" | jq '{ip, city, region, country, org}'

# Check if a website is up
curl -s -o /dev/null -w "%{http_code}" https://example.com
```

### Random Data / Testing
```bash
# Random user data (for testing)
curl -s "https://randomuser.me/api/" | jq '.results[0] | {name: .name, email, phone}'

# Lorem ipsum
curl -s "https://loripsum.net/api/3/short/plaintext"

# UUID generator
curl -s "https://httpbin.org/uuid" | jq '.uuid'
```

## Python Script
```bash
python ~/.openclaw/skills/data-apis/scripts/fetch_api.py --source weather --query "London"
python ~/.openclaw/skills/data-apis/scripts/fetch_api.py --source crypto --query "bitcoin"
python ~/.openclaw/skills/data-apis/scripts/fetch_api.py --source news --query "top"
```

## Notes
- All endpoints are free and require no API keys
- Rate limits apply — add 1s delay between rapid requests
- For APIs requiring keys, use §§secret() placeholders
- Always use `curl -s` (silent) and pipe to `jq` for parsing
- Prefer these APIs over scraping websites
