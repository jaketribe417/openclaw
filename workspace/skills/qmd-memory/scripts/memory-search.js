#!/usr/bin/env node
/**
 * Qmd Memory Search
 * 
 * Search OpenClaw memory using Qmd with smart defaults.
 * Usage: node memory-search.js "query" [options]
 */

const { execSync } = require('child_process');
const path = require('path');

const WORKSPACE = '/Users/Jack/.openclaw/workspace';

function search(query, options = {}) {
  const { 
    collection = null,
    limit = 10,
    minScore = 0.3,
    format = 'json',
    full = false
  } = options;

  // Build command
  let cmd = `qmd query "${query.replace(/"/g, '\\"')}"`;
  
  if (collection) {
    cmd += ` --collection ${collection}`;
  } else {
    cmd += ' --all'; // Search across all collections
  }
  
  cmd += ` --json -n ${limit}`;
  
  if (full) {
    cmd += ' --full';
  }

  try {
    const result = execSync(cmd, { 
      cwd: WORKSPACE,
      encoding: 'utf8',
      timeout: 30000
    });
    
    const parsed = JSON.parse(result);
    return parsed;
  } catch (error) {
    if (error.stderr) {
      console.error('Qmd error:', error.stderr.toString());
    }
    throw new Error(`Search failed: ${error.message}`);
  }
}

function formatResults(results) {
  if (!results || results.length === 0) {
    return 'No results found.';
  }

  return results.map(r => {
    const score = Math.round((r.score || r._score || 0) * 100);
    const title = r.title || r.path || r.docid || 'Unknown';
    const snippet = r.snippet || r.content?.substring(0, 200) || '';
    return `[${score}%] ${title}\n${snippet}`;
  }).join('\n\n---\n\n');
}

// CLI
if (require.main === module) {
  const query = process.argv[2];
  
  if (!query) {
    console.log('Usage: node memory-search.js "your search query"');
    console.log('');
    console.log('Options:');
    console.log('  --collection <name>  Search specific collection');
    console.log('  --limit <n>          Return n results (default: 10)');
    console.log('  --full               Return full document content');
    process.exit(1);
  }

  // Parse args
  const args = process.argv.slice(3);
  const options = {
    collection: null,
    limit: 10,
    full: args.includes('--full')
  };

  const collectionIdx = args.indexOf('--collection');
  if (collectionIdx !== -1 && args[collectionIdx + 1]) {
    options.collection = args[collectionIdx + 1];
  }

  const limitIdx = args.indexOf('--limit');
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    options.limit = parseInt(args[limitIdx + 1], 10);
  }

  try {
    const results = search(query, options);
    console.log(formatResults(results));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { search, formatResults };
