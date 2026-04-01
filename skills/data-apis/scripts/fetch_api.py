#!/usr/bin/env python3
"""Unified API fetcher for common free data sources."""
import argparse, json, urllib.request, sys

SOURCES = {
    'weather': lambda q: f'https://wttr.in/{q.replace(" ","+")}?format=j1',
    'crypto': lambda q: f'https://api.coingecko.com/api/v3/simple/price?ids={q}&vs_currencies=usd',
    'news': lambda q: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    'wiki': lambda q: f'https://en.wikipedia.org/api/rest_v1/page/summary/{q.replace(" ","_")}',
    'geocode': lambda q: f'https://nominatim.openstreetmap.org/search?q={q.replace(" ","+")}&format=json&limit=3',
    'ip': lambda q: 'https://ipapi.co/json/',
    'exchange': lambda q: f'https://open.er-api.com/v6/latest/{q.upper()}',
}

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'AgentZero/1.0'})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def main():
    parser = argparse.ArgumentParser(description='Fetch data from free APIs')
    parser.add_argument('--source', choices=list(SOURCES.keys()), required=True)
    parser.add_argument('--query', default='', help='Query parameter')
    parser.add_argument('--raw', action='store_true', help='Raw JSON output')
    args = parser.parse_args()
    try:
        url = SOURCES[args.source](args.query)
        data = fetch(url)
        print(json.dumps(data, indent=2) if args.raw else json.dumps(data, indent=2)[:2000])
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__': main()
