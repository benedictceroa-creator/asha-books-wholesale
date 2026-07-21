#!/usr/bin/env node
// Adds Translation, Binding, Size, Format columns to Mrp.xlsx
// Uses the same detection logic as english-bibles.html

const path = require('path');
const XLSX = require(path.resolve(__dirname, 'node_modules/xlsx'));

const XLSX_PATH = path.resolve(__dirname, 'Mrp.xlsx');

function detectTranslation(title) {
  const u = title.toUpperCase();
  if (u.includes('NKJV')) return 'NKJV';
  if (u.includes('NRSV')) return 'NRSV';
  if (u.includes('NIRV')) return 'NIrV';
  if (u.includes('NIV'))  return 'NIV';
  if (u.includes('NASB')) return 'NASB';
  if (u.includes('KJV') || u.includes('KING JAMES VERSION')) return 'KJV';
  if (u.includes('ESV'))  return 'ESV';
  if (u.includes('NLT'))  return 'NLT';
  if (u.includes('AMP'))  return 'AMP';
  if (u.includes('NET'))  return 'NET';
  if (u.includes('RSV'))  return 'RSV';
  if (u.includes('ICB'))  return 'ICB';
  return 'Other';
}

function detectFormat(title) {
  const t = title.toLowerCase();
  if (t.includes('thinline'))                                   return 'Thinline';
  if (t.includes('study bible'))                                return 'Study Bible';
  if (t.includes('reference bible'))                            return 'Reference Bible';
  if (t.includes('journal') || t.includes('journaling'))        return 'Journaling Bible';
  if (t.includes('outreach'))                                   return 'Outreach Bible';
  if (t.includes('devotional'))                                 return 'Devotional Bible';
  if (t.includes('parallel'))                                   return 'Parallel Bible';
  if (t.includes('chronological'))                              return 'Chronological Bible';
  if (t.includes('daily bible') || t.includes('daily reading')) return 'Daily Bible';
  if (t.includes("preacher's") || t.includes('preacher'))       return "Preacher's Bible";
  if (t.includes('new testament'))                              return 'New Testament';
  if (t.includes('psalms') || t.includes('proverbs'))           return 'Psalms & Proverbs';
  if (t.includes('family bible'))                               return 'Family Bible';
  return 'Standard Bible';
}

function detectBibleSize(title) {
  const t = title.toLowerCase();
  if (t.includes('tiny testament') || t.includes('pocket-sized') || t.includes('pocket sized') || t.includes('pocket size')) return 'Pocket';
  if (t.includes('personal size') || t.includes('personal-size')) return 'Personal';
  if (t.includes('compact')) return 'Compact';
  if (t.includes('family bible') || t.includes('preacher') || t.includes('pulpit')) return 'Family / Pulpit';
  return 'Standard';
}

function detectFontSize(title) {
  const t = title.toLowerCase();
  if (t.includes('giant print')) return 'Giant Print';
  if (t.includes('large print') || t.includes('larger print') || t.includes('large-print')) return 'Large Print';
  return 'Standard';
}

function detectBinding(title) {
  const t = title.toLowerCase();
  if (t.includes('leathersoft'))       return 'Leathersoft';
  if (t.includes('bonded leather'))    return 'Bonded Leather';
  if (t.includes('imitation leather')) return 'Imitation Leather';
  if (t.includes('leather'))           return 'Leather';
  if (t.includes('hardcover'))         return 'Hardcover';
  if (t.includes('paperback'))         return 'Paperback';
  if (t.includes('cloth'))             return 'Cloth';
  if (t.includes('flexi'))             return 'Flexi';
  return 'Unknown';
}

const wb = XLSX.readFile(XLSX_PATH);
const wsName = wb.SheetNames[0];
const ws = wb.Sheets[wsName];
const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }).map(r => {
  const { Size, ...rest } = r; // drop legacy Size column if present
  return rest;
});

const updated = rows.map(row => {
  const title = String(row['Titles'] || '').trim();
  return {
    ...row,
    Translation: detectTranslation(title),
    Binding:     detectBinding(title),
    'Bible Size': detectBibleSize(title),
    'Font Size':  detectFontSize(title),
    Format:      detectFormat(title),
  };
});

const newWs = XLSX.utils.json_to_sheet(updated, {
  header: ['ISBN', 'Present stock', 'Titles', 'Mrp', 'After Discount', 'Translation', 'Binding', 'Bible Size', 'Font Size', 'Format'],
});
wb.Sheets[wsName] = newWs;
XLSX.writeFile(wb, XLSX_PATH);

// Count stats
const stats = { Translation: {}, Binding: {}, 'Bible Size': {}, 'Font Size': {}, Format: {} };
updated.forEach(r => {
  ['Translation', 'Binding', 'Bible Size', 'Font Size', 'Format'].forEach(k => {
    stats[k][r[k]] = (stats[k][r[k]] || 0) + 1;
  });
});
['Translation', 'Binding', 'Bible Size', 'Font Size', 'Format'].forEach(k => {
  console.log(`\n${k}:`);
  Object.entries(stats[k]).sort((a,b) => b[1]-a[1]).forEach(([v,c]) => console.log(`  ${v}: ${c}`));
});
console.log(`\n✓ Updated Mrp.xlsx with ${updated.length} rows`);
