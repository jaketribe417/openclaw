#!/usr/bin/env python3
"""Generate and deploy Flask applications."""
import argparse, os, subprocess, sys

TEMPLATES = {
    "api": '''
from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "API running"})

@app.route('/api/data')
def data():
    return jsonify({"items": ["item1", "item2", "item3"]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port={port}, debug=True)
''',
    "web": '''
from flask import Flask, render_template_string
app = Flask(__name__)

HTML = """
<!DOCTYPE html>
<html>
<head><title>Flask App</title></head>
<body>
    <h1>Welcome to Flask</h1>
    <p>Server running on port {port}</p>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port={port}, debug=True)
''',
    "dashboard": '''
from flask import Flask, render_template_string
app = Flask(__name__)

HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>Dashboard</h1>
    <canvas id="chart"></canvas>
    <script>
        new Chart(document.getElementById('chart'), {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C'],
                datasets: [{ label: 'Data', data: [10, 20, 15] }]
            }
        });
    </script>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port={port}, debug=True)
'''
}

def main():
    parser = argparse.ArgumentParser(description="Deploy Flask app")
    parser.add_argument("--template", choices=["api", "web", "dashboard"], default="web")
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--output", help="Save to file instead of running")
    parser.add_argument("--background", action="store_true")
    args = parser.parse_args()

    code = TEMPLATES[args.template].format(port=args.port)
    
    if args.output:
        with open(args.output, "w") as f:
            f.write(code)
        print(f"Flask app saved to {args.output}")
        print(f"Run with: python {args.output}")
    else:
        if args.background:
            proc = subprocess.Popen([sys.executable, "-c", code],
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"Flask running in background (PID: {proc.pid})")
            print(f"Serving on http://0.0.0.0:{args.port}")
        else:
            print(f"Starting Flask on http://0.0.0.0:{args.port}")
            exec(code)

if __name__ == "__main__":
    main()
