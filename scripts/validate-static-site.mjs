import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const errors = [];

function walk(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'qa-artifacts') continue;
    const rel = path.posix.join(base, entry.name);
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, rel));
    else out.push(rel);
  }
  return out;
}

const files = walk(ROOT);
const fileSet = new Set(files);
const lowerMap = new Map();
for (const file of files) {
  const key = file.toLowerCase();
  const existing = lowerMap.get(key);
  if (existing && existing !== file) errors.push(`case-colliding repository paths: ${existing} and ${file}`);
  else lowerMap.set(key, file);
}

const required = [
  'index.html',
  'fish/index.html',
  'assets/app.js',
  'assets/content.js',
  'assets/fish-wiki.js',
  'assets/fish-site-search.js',
  'assets/fish-search-index.json',
  'assets/fish-wiki-data-0.json.gz',
  'assets/fish-wiki-data-1.json.gz',
];

for (const rel of required) {
  if (!fileSet.has(rel)) errors.push(`missing required static file: ${rel}`);
}

function resolveLocalRef(fromFile, raw) {
  const ref = raw.trim();
  if (!ref || ref.startsWith('#') || /^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(ref)) return null;
  const withoutQuery = ref.split(/[?#]/, 1)[0];
  if (!withoutQuery) return null;
  if (withoutQuery.startsWith('/Tide-2-Addons/')) return withoutQuery.slice('/Tide-2-Addons/'.length);
  if (withoutQuery.startsWith('/')) {
    errors.push(`${fromFile}: unsafe root-relative GitHub Pages path ${JSON.stringify(ref)}; use /Tide-2-Addons/ or a relative path`);
    return null;
  }
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), withoutQuery));
}

for (const htmlFile of ['index.html', 'fish/index.html']) {
  if (!fileSet.has(htmlFile)) continue;
  const source = fs.readFileSync(htmlFile, 'utf8');
  const attr = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  for (const match of source.matchAll(attr)) {
    const target = resolveLocalRef(htmlFile, match[1]);
    if (!target) continue;

    const candidates = [target, path.posix.join(target, 'index.html')];
    if (candidates.some(candidate => fileSet.has(candidate))) continue;

    const caseMatch = candidates.map(candidate => lowerMap.get(candidate.toLowerCase())).find(Boolean);
    if (caseMatch) errors.push(`${htmlFile}: ${match[1]} has case mismatch; repository path is ${caseMatch}`);
    else errors.push(`${htmlFile}: local reference does not resolve: ${match[1]} -> ${target}`);
  }
}

const searchPath = 'assets/fish-search-index.json';
let fishIds = new Set();
if (fileSet.has(searchPath)) {
  try {
    const rows = JSON.parse(fs.readFileSync(searchPath, 'utf8'));
    fishIds = new Set(rows.map(row => String(row.id || '').replace(':', '__')).filter(Boolean));
  } catch (error) {
    errors.push(`${searchPath}: cannot parse JSON: ${error.message}`);
  }
}

for (const rel of files.filter(file => /\.(?:html|js|css|md)$/i.test(file))) {
  const source = fs.readFileSync(rel, 'utf8');
  for (const match of source.matchAll(/(?:\/fish\/)?#([a-z0-9_.-]+__[a-z0-9_./-]+)/gi)) {
    if (fishIds.size && !fishIds.has(match[1])) errors.push(`${rel}: hard-coded fish hash #${match[1]} does not exist in search index`);
  }
}

if (errors.length) {
  console.error('Static-site validation FAILED:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Static-site validation OK: ${files.length} files scanned; HTML references and Fish Wiki hashes resolve.`);
