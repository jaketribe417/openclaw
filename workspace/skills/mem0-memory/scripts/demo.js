#!/usr/bin/env node
/**
 * Mem0 Demo
 * Demonstrates Mem0 memory operations
 */

const { execSync } = require('child_process');
const path = require('path');

const SCRIPT_DIR = __dirname;

console.log('=== Mem0 Memory Demo ===\n');

// Test 1: Check connection
console.log('1. Testing Mem0 connection...');
try {
  const result = execSync(
    `node "${path.join(SCRIPT_DIR, 'mem0-client.js')}" health`,
    { encoding: 'utf8', timeout: 10000 }
  );
  const parsed = JSON.parse(result);
  console.log(`   Status: ${parsed.status}`);
  if (parsed.status === 404) {
    console.log('   ✓ Mem0 is responding (404 on /health is expected)');
  } else if (parsed.status === 200) {
    console.log('   ✓ Mem0 is healthy');
  } else {
    console.log('   ⚠ Unexpected status');
  }
} catch (err) {
  console.log('   ✗ Connection failed:', err.message);
}

console.log('\n2. Note: Mem0 requires local embedder configuration');
console.log('   Configure Mem0 to use Ollama instead of OpenAI:');
console.log('   - Set embedder provider to "ollama"');
console.log('   - Set OLLAMA_HOST environment variable');
console.log('   - Or configure in Mem0 config file\n');

console.log('3. Available commands once configured:');
console.log('   node mem0-client.js capture --content "memory text"');
console.log('   node mem0-client.js search --query "search term"');
console.log('   node mem0-client.js list [--limit 10]');
console.log('   node mem0-client.js delete --memory_id "id"\n');

console.log('=== Configuration Required ===');
console.log('\nTo complete setup:');
console.log('1. Configure Mem0 OSS to use Ollama embeddings');
console.log('2. Set OLLAMA_HOST in your Mem0 Docker environment');
console.log('3. Restart Mem0 container');
console.log('4. Test memory capture again\n');
