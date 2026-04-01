#!/usr/bin/env python3
"""Deploy static HTML/CSS/JS sites."""
import argparse, os, subprocess, sys

def main():
    parser = argparse.ArgumentParser(description="Deploy static site")
    parser.add_argument("directory", help="Directory to serve")
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--background", action="store_true")
    args = parser.parse_args()

    if not os.path.isdir(args.directory):
        print(f"Error: {args.directory} is not a directory")
        sys.exit(1)

    # Create simple HTTP server
    server_code = f'''
import http.server
import socketserver
import os
os.chdir("{os.path.abspath(args.directory)}")
with socketserver.TCPServer(("0.0.0.0", {args.port}), http.server.SimpleHTTPRequestHandler) as httpd:
    print(f"Serving {args.directory} at http://0.0.0.0:{args.port}")
    httpd.serve_forever()
'''
    if args.background:
        proc = subprocess.Popen([sys.executable, "-c", server_code], 
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Server running in background (PID: {proc.pid})")
        print(f"Serving on http://0.0.0.0:{args.port}")
    else:
        print(f"Starting server on http://0.0.0.0:{args.port}")
        exec(server_code)

if __name__ == "__main__":
    main()
