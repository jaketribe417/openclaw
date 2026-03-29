# Ref Tools

Search and read technical documentation via Ref (ref.tools). Provides targeted documentation search for coding frameworks, libraries, and APIs.

## Setup Requirements

**Before using:**
1. Create account at https://ref.tools/signup
2. Get API key from https://ref.tools/keys
3. Configure documentation sources in your Ref dashboard
4. Set `REF_API_KEY` environment variable or hardcode in scripts

## When to Use

**USE Ref when:**
- Looking up framework-specific documentation (React, Django, TensorFlow, etc.)
- Need API reference details for a library
- Troubleshooting library-specific errors with official docs
- Understanding configuration options for development tools
- Need code examples from official documentation
- Working with well-known open-source projects

**DO NOT use Ref when:**
- General web search needed (use web_search instead)
- Current events or news
- Non-technical topics
- File system operations
- Code execution or debugging
- Proprietary/internal documentation not indexed by Ref

## Best Practices

**Query formulation:**
- Include framework name: "React useEffect dependency array"
- Include language: "Python pandas DataFrame merge"
- Be specific: "Docker compose volume bind mount syntax"
- Include version when relevant: "Next.js 14 app router middleware"

**Workflow:**
1. Search with specific technical terms
2. Review results for relevant documentation URLs
3. Use read_url on promising matches for full context
4. Combine findings to answer technical questions

## Tools

### ref_search_documentation

Search across Ref's indexed documentation resources.

**Parameters:**
- `query` (string, required): Your search query. Include programming language, framework, or library names for best results.

**Returns:** Array of results with documentation snippets and URLs.

**Example:**
```bash
./scripts/ref-search.js --query "Python requests timeout parameter"
```

### ref_read_url

Read the full content of a documentation URL.

**Parameters:**
- `url` (string, required): The exact URL from a search result or any documentation URL.

**Returns:** Full content of the documentation page in structured format.

**Example:**
```bash
./scripts/ref-read.js --url "https://docs.python-requests.org/en/latest/user/quickstart.html"
```

## API Configuration

The scripts use your Ref API key:
- Environment variable: `REF_API_KEY`
- Or hardcoded in script: Edit `scripts/ref-search.js` and `scripts/ref-read.js`

## Rate Limits

Respect Ref's rate limits. Cache results when possible. Avoid rapid repeated searches for similar queries.

## Troubleshooting

**"No results found"** - Documentation sources not configured. Add repositories at https://ref.tools

**HTTP errors** - Check API key is valid and has not expired

**Empty responses** - The URL may not be accessible or indexed by Ref

## Examples

**Find React hook patterns:**
```bash
./scripts/ref-search.js "React useEffect cleanup function"
./scripts/ref-read.js "https://react.dev/reference/react/useEffect"
```

**Check Django model documentation:**
```bash
./scripts/ref-search.js "Django ORM ForeignKey on_delete"
```

**Docker compose syntax:**
```bash
./scripts/ref-search.js "Docker compose volumes syntax"
```
