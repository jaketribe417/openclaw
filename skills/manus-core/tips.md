## General operation manual

reason step-by-step execute tasks
avoid repetition ensure progress
never assume success
memory refers memory tools not own knowledge

## Files
when not in project save files in ~/.openclaw/workspace/
don't use spaces in file names

## Skills

skills are contextual expertise to solve tasks (SKILL.md standard)
skill descriptions in prompt executed with code_execution_tool or skills_tool

## Best practices

python nodejs linux libraries for solutions
use tools to simplify tasks achieve goals
never rely on aging memories like time date etc
always use specialized subordinate agents for specialized tasks matching their prompt profile

## Shell & Terminal Best Practices

### Prefer CLI Over Code
- favor linux commands for simple tasks where possible instead of python
- `wc -l`, `grep`, `sed`, `awk`, `jq`, `curl` for data processing
- `find`, `ls -la`, `du -sh`, `df -h` for filesystem inspection
- `cat`, `head`, `tail` for file reading
- pipe commands: `curl -s URL | jq '.field'` for API queries

### Safe Execution
- Always check if a file/directory exists before operating on it
- Use `set -e` in scripts to fail fast on errors
- Redirect stderr: `command 2>&1` to capture error output
- Use `timeout 30 command` for potentially hanging operations
- Test destructive commands with `echo` or `--dry-run` first

### Package Management
- `apt-get update && apt-get install -y package` (always -y for non-interactive)
- `pip install package` (use venv when in projects)
- `npm install package` (use --save for project dependencies)
- Check if already installed before installing: `which tool || apt-get install -y tool`

### Common Shell Patterns (Reference)
```bash
# Extract field from JSON API
curl -s https://api.example.com/data | jq -r '.results[].name'

# Find files modified in last 24h
find /path -type f -mtime -1

# Count lines matching pattern
grep -c 'ERROR' /var/log/app.log

# Replace text in file in-place
sed -i 's/old_text/new_text/g' file.txt

# Process CSV columns with awk
awk -F',' '{print $1, $3}' data.csv

# Download and extract archive
curl -sL https://example.com/archive.tar.gz | tar xz

# Check if command exists before using
command -v jq >/dev/null 2>&1 || apt-get install -y jq

# Parallel execution with xargs
find . -name '*.py' | xargs -P4 python -m py_compile

# Monitor file changes
watch -n 2 'ls -la /path/to/dir'

# Safe file operations
test -f "file.txt" && cat "file.txt" || echo "File not found"
mkdir -p /path/to/dir  # -p prevents error if exists
cp file.txt file.txt.bak && sed -i 's/old/new/g' file.txt  # backup first
```

### Terminal Debugging Patterns
```bash
# Debug: show what command would do
echo "Would run: rm -rf /tmp/old_data"  # preview before executing

# Debug: trace script execution
bash -x script.sh  # shows each command as it runs

# Debug: check exit codes
command_here; echo "Exit code: $?"  # 0 = success, non-zero = error

# Debug: check disk/memory when things fail
df -h  # disk space
free -h  # memory
ps aux --sort=-%mem | head  # top memory processes
```

## Browser Best Practices

### When to Use browser_agent vs direct-browser skill
- **browser_agent**: For complex multi-step web interactions (login, form filling, navigation)
- **direct-browser skill**: For quick scrapes, screenshots, single-page data extraction
- **document_query**: For reading web pages, PDFs, docs (simplest - try first)
- **curl**: For APIs and simple HTTP requests (fastest)

### Browser Session Management
- Always `reset: true` for new tasks, `reset: false` for continuing
- Be explicit about what pages are open when continuing sessions
- Download files go to `~/.openclaw/tmp/downloads` by default
- Pass credentials via message, use §§secret() placeholders

### Data Extraction Priority
1. **API first**: Check if site has API/JSON endpoint before scraping
2. **document_query**: For reading content from URLs
3. **curl + jq**: For REST APIs
4. **browser_agent**: Last resort for dynamic/JS-heavy sites

---
