#!/usr/bin/env node
/**
 * Deploy Express applications
 */
const http = require('http');
const express = require('express');

const app = express();
const PORT = process.argv.includes('--port') ? 
    parseInt(process.argv[process.argv.indexOf('--port') + 1]) : 3000;

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Express server running', port: PORT });
});

app.get('/api/data', (req, res) => {
    res.json({ items: ['item1', 'item2', 'item3'] });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
});
