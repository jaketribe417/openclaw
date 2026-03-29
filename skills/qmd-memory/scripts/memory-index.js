#!/usr/bin/env node
/**
 * Qmd Memory Indexer
 * 
 * Initialize and update Qmd collections for OpenClaw memory.
 * Usage: node memory-index.js [--force]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = '/Users/Jack/.openclaw/workspace';
const COLLECTIONS = [
  {
    name: 'openclaw-memory',
    path: path.join(WORKSPACE, 'memory'),
    description: 'Daily activity logs and session notes'
  },
  {
    name: 'openclaw-docs', 
    path: WORKSPACE,
    description: 'Curated long-term memories and documentation'
  },
  {
    name: 'openclaw-projects',
    path: path.join(WORKSPACE, 'projects'),
    description: 'Project files and code repositories'
  }
];

function run(cmd, options = {}) {
  try {
    return execSync(cmd, {
      cwd: WORKSPACE,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      timeout: options.timeout || 60000,
      ...options
    });
  } catch (error) {
    if (!options.ignoreErrors) {
      throw error;
    }
    return null;
  }
}

function collectionExists(name) {
  try {
    const result = execSync('qmd collection list --json', {
      cwd: WORKSPACE,
      encoding: 'utf8',
      timeout: 10000
    });
    const collections = JSON.parse(result);
    return collections.some(c => c.name === name);
  } catch {
    return false;
  }
}

function initCollections() {
  console.log('Initializing Qmd collections...\n');

  for (const col of COLLECTIONS) {
    // Skip if directory doesn't exist
    if (!fs.existsSync(col.path)) {
      console.log(`⚠️  Skipping ${col.name}: ${col.path} does not exist`);
      continue;
    }

    if (collectionExists(col.name)) {
      console.log(`✓ Collection ${col.name} already exists`);
    } else {
      console.log(`Creating collection: ${col.name}`);
      console.log(`  Path: ${col.path}`);
      run(`qmd collection add "${col.path}" --name ${col.name}`, { silent: true });
      
      // Add context
      run(`qmd context add qmd://${col.name} "${col.description}"`, { 
        silent: true,
        ignoreErrors: true 
      });
      console.log(`  ✓ Created with context: "${col.description}"`);
    }
  }

  console.log('\n');
}

function embed() {
  console.log('Generating embeddings (this may take a while)...');
  console.log('');
  
  try {
    run('qmd embed');
    console.log('\n✓ Embeddings generated successfully');
  } catch (error) {
    console.error('\n✗ Embedding failed:', error.message);
    process.exit(1);
  }
}

function status() {
  console.log('\n--- Collection Status ---\n');
  try {
    run('qmd status');
  } catch (error) {
    console.error('Failed to get status:', error.message);
  }
}

// CLI
if (require.main === module) {
  const force = process.argv.includes('--force');
  
  console.log('╔════════════════════════════════════════╗');
  console.log('║     Qmd Memory Indexer for OpenClaw    ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  // Check qmd is installed
  try {
    run('qmd --version', { silent: true });
  } catch {
    console.error('Error: Qmd is not installed.');
    console.error('Run: npm install -g @tobilu/qmd');
    process.exit(1);
  }

  // Create memory directory if needed
  const memoryDir = path.join(WORKSPACE, 'memory');
  if (!fs.existsSync(memoryDir)) {
    console.log(`Creating memory directory: ${memoryDir}`);
    fs.mkdirSync(memoryDir, { recursive: true });
  }

  // Initialize
  initCollections();
  embed();
  status();

  console.log('\n✓ Indexing complete');
  console.log('');
  console.log('Usage:');
  console.log('  qmd search "your query" --collection openclaw-memory');
  console.log('  qmd query "semantic search" --all');
  console.log('  node skills/qmd-memory/scripts/memory-search.js "query"');
}

module.exports = { initCollections, embed, status };
