#!/usr/bin/env node
/**
 * Ref Tools Demo
 * Demonstrates Ref search and read functionality
 */

const { execSync } = require('child_process');
const path = require('path');

const SCRIPT_DIR = __dirname;

console.log('=== Ref Tools Demo ===\n');

// Test 1: Search for documentation
console.log('1. Testing ref_search_documentation...');
console.log('   Query: "Python requests library"');
try {
  const searchResult = execSync(
    `node "${path.join(SCRIPT_DIR, 'ref-search.js')}" --query "Python requests library"`,
    { encoding: 'utf8', timeout: 30000 }
  );
  const parsed = JSON.parse(searchResult);
  console.log('   ✓ Search successful');
  console.log(`   Found ${parsed.content?.length || 0} results\n`);
  
  // Show first result
  if (parsed.content && parsed.content.length > 0) {
    const firstResult = parsed.content[0].text;
    console.log('   First result preview:');
    console.log('   ', firstResult.substring(0, 100) + '...\n');
    
    // Extract URL from result
    const urlMatch = firstResult.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      const url = urlMatch[1].replace(/\)$/, ''); // Remove trailing paren if present
      console.log('2. Testing ref_read_url...');
      console.log(`   URL: ${url}`);
      
      try {
        const readResult = execSync(
          `node "${path.join(SCRIPT_DIR, 'ref-read.js')}" --url "${url}"`,
          { encoding: 'utf8', timeout: 30000 }
        );
        const readParsed = JSON.parse(readResult);
        console.log('   ✓ Read successful');
        const contentText = readParsed.content?.[0]?.text || '';
        console.log(`   Content length: ${contentText.length} characters\n`);
        console.log('   Content preview (first 500 chars):');
        console.log('   ', contentText.substring(0, 500).replace(/\n/g, '\n   '));
      } catch (readErr) {
        console.log('   ✗ Read failed:', readErr.message);
      }
    }
  }
} catch (err) {
  console.log('   ✗ Search failed:', err.message);
  process.exit(1);
}

console.log('\n=== Demo Complete ===');
console.log('\nUsage:');
console.log('  ./ref-search.js --query "<your search terms>"');
console.log('  ./ref-read.js --url "<documentation URL>"');
