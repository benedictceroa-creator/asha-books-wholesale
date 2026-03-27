#!/usr/bin/env node
// Asha Books — Product Data Generator
// Usage: node gen_products.js
// Reads Mrp.xlsx in the same folder and writes products.js

const path = require('path');
const fs   = require('fs');

// Try local node_modules first, then sibling bible-cover-fetcher
let XLSX;
try {
  XLSX = require(path.resolve(__dirname, 'node_modules/xlsx'));
} catch {
  try {
    XLSX = require(path.resolve(__dirname, '../bible-cover-fetcher/node_modules/xlsx'));
  } catch {
    console.error('xlsx package not found. Run: npm install xlsx');
    process.exit(1);
  }
}

const XLSX_PATH = path.resolve(__dirname, 'Mrp.xlsx');
const OUT_PATH  = path.resolve(__dirname, 'products.js');

if (!fs.existsSync(XLSX_PATH)) {
  console.error('Mrp.xlsx not found in project folder.');
  process.exit(1);
}

const workbook  = XLSX.readFile(XLSX_PATH);
const sheet     = workbook.Sheets[workbook.SheetNames[0]];
const rows      = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const products = [];

for (const row of rows) {
  // Normalise keys — handle any casing/spacing in header names
  const keys = Object.keys(row);
  const get  = (...names) => {
    for (const n of names) {
      const k = keys.find(k => k.trim().toLowerCase() === n.toLowerCase());
      if (k !== undefined) return row[k];
    }
    return '';
  };

  const isbn       = String(get('isbn') ?? '').trim();
  const title      = String(get('titles', 'title') ?? '').trim();
  const mrpRaw     = get('mrp');
  const discRaw    = get('after discount', 'afterdiscount', 'discounted');
  const qtyRaw     = get('qty', 'quantity');

  // Skip blank / header echo rows
  if (!isbn || !title || title === '0' || title.toLowerCase() === 'titles') continue;

  const mrp        = typeof mrpRaw === 'number' ? mrpRaw : parseFloat(mrpRaw) || 0;
  const discounted = typeof discRaw === 'number' ? discRaw : parseFloat(discRaw) || 0;
  const qty        = typeof qtyRaw === 'number' ? qtyRaw : parseInt(qtyRaw, 10) || 0;

  products.push({
    isbn,
    title: title.replace(/\\/g, '\\\\').replace(/'/g, "\\'"),
    mrp:        Math.round(mrp * 100) / 100,
    discounted: Math.round(discounted * 100) / 100,
    qty,
  });
}

const lines = products.map(p => '  ' + JSON.stringify(p));
const js    = [
  '// Asha Books — Product Data',
  '// Auto-generated from Mrp.xlsx — do not edit manually.',
  '// To regenerate: node gen_products.js',
  `// Generated: ${new Date().toISOString().slice(0, 10)} — ${products.length} products`,
  'const PRODUCTS = [',
  lines.join(',\n'),
  '];',
  '',
].join('\n');

fs.writeFileSync(OUT_PATH, js, 'utf8');

// Update cache-busting version in HTML files
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHmmss
const htmlFiles = ['index.html', 'catalogue.html'].map(f => path.resolve(__dirname, f));
htmlFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  const html = fs.readFileSync(file, 'utf8');
  const updated = html.replace(/products\.js(\?v=\d+)?/g, `products.js?v=${version}`);
  fs.writeFileSync(file, updated, 'utf8');
  console.log(`✓ Updated cache version in ${path.basename(file)}`);
});

const prices = products.filter(p => p.discounted > 0).map(p => p.discounted);
console.log(`✓ Written ${products.length} products to products.js`);
if (prices.length) {
  console.log(`  Price range: Rs.${Math.floor(Math.min(...prices))} – Rs.${Math.ceil(Math.max(...prices))}`);
}
