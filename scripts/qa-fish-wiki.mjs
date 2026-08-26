import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8000/Tide-2-Addons';
const out = process.env.QA_OUT || 'qa-artifacts';
await fs.mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];

async function inspectPage(page, label) {
  page.on('console', msg => {
    if (msg.type() === 'error') failures.push(`${label} console: ${msg.text()}`);
  });
  page.on('pageerror', err => failures.push(`${label} pageerror: ${err.message}`));
  page.on('response', res => {
    if (res.status() >= 400) failures.push(`${label} HTTP ${res.status()}: ${res.url()}`);
  });
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await inspectPage(desktop, 'desktop');

  await desktop.goto(`${base}/fish/`, { waitUntil: 'networkidle' });
  await desktop.waitForFunction(() => document.querySelector('#stat-records')?.textContent === '342');
  assert.equal((await desktop.locator('#result-count').textContent())?.trim(), '342 fish');
  assert.equal((await desktop.locator('#stat-mods').textContent())?.trim(), '37');
  assert.equal(await desktop.locator('.fish-card').count(), 342);
  assert.ok(await desktop.locator('#category-nav button').count() >= 6, 'journal category navigation was not populated');
  await desktop.screenshot({ path: `${out}/fish-desktop.png`, fullPage: true });

  await desktop.selectOption('#filter-group', 'saltwater');
  await desktop.waitForTimeout(50);
  const saltCount = Number(((await desktop.locator('#result-count').textContent()) || '0').split(' ')[0]);
  assert.ok(saltCount > 0 && saltCount < 342, `saltwater filter returned ${saltCount}`);
  assert.equal(await desktop.locator('#category-nav button[data-group="saltwater"]').getAttribute('aria-pressed'), 'true');

  await desktop.click('#clear-filters');
  await desktop.fill('#fish-search', 'hybrid aquatic');
  await desktop.waitForTimeout(50);
  const hybridCount = Number(((await desktop.locator('#result-count').textContent()) || '0').split(' ')[0]);
  assert.ok(hybridCount > 0 && hybridCount < 342, `Hybrid Aquatic search returned ${hybridCount}`);
  await desktop.click('#clear-filters');

  const habitatOptions = await desktop.locator('#filter-habitat option').count();
  assert.ok(habitatOptions > 1, 'habitat filter was not populated');
  const firstHabitat = await desktop.locator('#filter-habitat option').nth(1).getAttribute('value');
  assert.ok(firstHabitat);
  await desktop.selectOption('#filter-habitat', firstHabitat);
  const habitatCount = Number(((await desktop.locator('#result-count').textContent()) || '0').split(' ')[0]);
  assert.ok(habitatCount > 0 && habitatCount < 342, `habitat filter returned ${habitatCount}`);

  await desktop.goto(`${base}/fish/#tide__tuna`, { waitUntil: 'networkidle' });
  await desktop.waitForSelector('#fish-article:not([hidden]) h1');
  assert.equal((await desktop.locator('#fish-article h1').textContent())?.trim(), 'Tuna');
  assert.match((await desktop.locator('#fish-article').textContent()) || '', /Tide 2\.1\.1/);
  assert.equal(desktop.url(), `${base}/fish/#tide__tuna`);

  await desktop.goto(`${base}/fish/#tide%3A%3Atuna`, { waitUntil: 'networkidle' }).catch(() => {});
  await desktop.goto(`${base}/fish/#tide__tuna`, { waitUntil: 'networkidle' });
  await desktop.click('#back-catalog');
  await desktop.waitForSelector('#catalog-view:not([hidden])');
  assert.ok(!desktop.url().includes('#tide__tuna'));

  await desktop.goto(`${base}/`, { waitUntil: 'networkidle' });
  assert.match((await desktop.title()), /Tideborne 1\.3\.57/);
  await desktop.click('#search-open');
  await desktop.fill('#search-input', 'tuna');
  await desktop.waitForSelector('#search-results a[href*="fish/#tide__tuna"]');
  const fishHref = await desktop.locator('#search-results a[href*="fish/#tide__tuna"]').first().getAttribute('href');
  assert.ok(fishHref?.includes('fish/#tide__tuna'));

  await desktop.goto(`${base}/#/satchel`, { waitUntil: 'networkidle' });
  const satchelText = (await desktop.locator('#article').textContent()) || '';
  assert.match(satchelText, /Craft a 3×3 upgrade/);
  assert.doesNotMatch(satchelText, /Spend 100 XP points/);

  await desktop.goto(`${base}/#/recipes`, { waitUntil: 'networkidle' });
  const recipeText = (await desktop.locator('#article').textContent()) || '';
  assert.match(recipeText, /nine Tideborne 1\.3\.57 crafting recipes/i);
  assert.match(recipeText, /Angler's Satchel/);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await inspectPage(mobile, 'mobile');
  await mobile.goto(`${base}/fish/`, { waitUntil: 'networkidle' });
  await mobile.waitForFunction(() => document.querySelector('#stat-records')?.textContent === '342');
  await mobile.click('#filter-toggle');
  assert.equal(await mobile.locator('#filter-toggle').getAttribute('aria-expanded'), 'true');
  assert.ok(await mobile.locator('#fish-filters').evaluate(el => el.classList.contains('filters-open')));
  await mobile.screenshot({ path: `${out}/fish-mobile-filters.png`, fullPage: true });
  await mobile.click('#filter-close');
  assert.equal(await mobile.locator('#filter-toggle').getAttribute('aria-expanded'), 'false');
  await mobile.click('#theme-button');
  assert.equal(await mobile.locator('html').getAttribute('data-theme'), 'light');
  await mobile.reload({ waitUntil: 'networkidle' });
  assert.equal(await mobile.locator('html').getAttribute('data-theme'), 'light');

  await desktop.close();
  await mobile.close();
} finally {
  await browser.close();
}

if (failures.length) {
  throw new Error(`Browser QA found ${failures.length} runtime/network errors:\n${failures.join('\n')}`);
}

console.log('Fish Wiki browser QA passed: desktop, mobile, filters, deep links, docs search, current 1.3.57 docs, and GitHub Pages-style base path.');
