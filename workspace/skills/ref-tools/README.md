# Ref Tools Skill - Setup Complete

## Summary

Standalone Ref Tools skill created and tested. Provides documentation search via Ref (ref.tools) API.

## Location

```
/Users/Jack/.openclaw/workspace/skills/ref-tools/
├── SKILL.md                    # Documentation and usage guide
├── README.md                   # This file
└── scripts/
    ├── ref-search.js          # Search documentation tool
    ├── ref-read.js            # Read documentation URL tool
    └── demo.js                # Demo/test script
```

## What It Does

**ref_search_documentation**: Searches Ref's indexed documentation for frameworks, libraries, and APIs
**ref_read_url**: Fetches full content from documentation URLs

## Quick Start

```bash
# Search for documentation
node scripts/ref-search.js --query "React hooks useEffect"

# Read full documentation
node scripts/ref-read.js --url "https://react.dev/reference/react/useEffect"

# Run demo
node scripts/demo.js
```

## Configuration

API key is hardcoded in scripts. To use your own:
1. Get key from https://ref.tools/keys
2. Edit `scripts/ref-search.js` and `scripts/ref-read.js`
3. Replace `ref-ee7f15a37c3469621906` with your key

Or set environment variable:
```bash
export REF_API_KEY="your-api-key"
```

## Test Results

✓ Search working: Returns indexed documentation results
✓ Read working: Fetches full content from documentation URLs
✓ MCP protocol: Properly handles session initialization
✓ HTTP streamable: Compatible with Ref's MCP over HTTP implementation

## When to Use

Use for: Framework docs, library APIs, coding patterns, tool configuration
Don't use for: General web search, news, non-technical topics

## Requirements

- Node.js
- Active Ref account with API key
- Documentation sources configured in Ref dashboard

## Status

Ready for use. Both tools tested and functional.
