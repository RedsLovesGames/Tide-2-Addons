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

async function assertNoHorizontalOverflow(page, label) {
  const dims = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  assert.ok(dims.scroll <= dims.client + 2, `${label} horizontal overflow: ${dims.scroll}px > ${dims.client}px`);
}

async function waitForDoc(page) {
  await page.waitForSelector('#article h1');
  await page.waitForTimeout(80);
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
  assert.equal(await desktop.locator('.fish-provenance').getAttribute('open'), null, 'provenance should be collapsed by default');
  assert.ok(await desktop.locator('.preview-quiet').count() > 0, 'quiet missing-render states were not applied');
  await assertNoHorizontalOverflow(desktop, 'desktop Fish Wiki');
  await desktop.screenshot({ path: `${out}/fish-desktop.png`, fullPage: true });

  await desktop.selectOption('#filter-group', 'saltwater');
  await desktop.waitForTimeout(80);
  const saltCount = Number(((await desktop.locator('#result-count').textContent()) || '0').split(' ')[0]);
  assert.ok(saltCount > 0 && saltCount < 342, `saltwater filter returned ${saltCount}`);
  assert.equal(await desktop.locator('#category-nav button[data-group="saltwater"]').getAttribute('aria-pressed'), 'true');
  assert.ok(await desktop.locator('#active-filters button[data-clear="filter-group"]').count() === 1, 'active category chip missing');

  await desktop.click('#clear-filters');
  await desktop.fill('#fish-search', 'hybrid aquatic');
  await desktop.waitForTimeout(80);
  const hybridCount = Number(((await desktop.locator('#result-count').textContent()) || '0').split(' ')[0]);
  assert.ok(hybridCount > 0 && hybridCount < 342, `Hybrid Aquatic search returned ${hybridCount}`);
  assert.ok(await desktop.locator('#active-filters button[data-clear="fish-search"]').count() === 1, 'active search chip missing');
  await desktop.click('#clear-filters');
  await desktop.fill('#fish-search', 'tuna');
  await desktop.waitForSelector('#fish-suggestions:not([hidden]) a[href="#tide__tuna"]');
  assert.ok(await desktop.locator('#fish-suggestions a').count() > 0, 'autocomplete did not return results');
  await desktop.press('#fish-search', 'Escape');
  assert.equal(await desktop.locator('#fish-search').getAttribute('aria-expanded'), 'false');
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
  assert.equal(await desktop.locator('.specimen-nav').count(), 1, 'previous/next specimen navigation missing');
  assert.equal(await desktop.locator('.condition-viewer').count(), 1, 'Tuna condition viewer missing');
  assert.equal(await desktop.locator('.condition-tabs button:not([disabled])').count(), 5, 'expected five validated Tuna condition renders');
  assert.equal(await desktop.locator('.condition-tabs button[data-condition="perfect_specimen"]').isDisabled(), true, 'Perfect Specimen must remain unavailable until validated');
  await desktop.click('.condition-tabs button[data-condition="albino"]');
  await desktop.waitForSelector('.condition-render[src*="tuna-albino.png"]');
  assert.match((await desktop.locator('.entry-render small').textContent()) || '', /Albino.*source-backed/i);
  await desktop.screenshot({ path: `${out}/tuna-albino-detail.png`, fullPage: true });

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

  await desktop.goto(`${base}/#/traits`, { waitUntil: 'networkidle' });
  await waitForDoc(desktop);
  const traitsText = (await desktop.locator('#article').textContent()) || '';
  assert.match(traitsText, /one Body Type/i);
  assert.match(traitsText, /one Condition/i);
  assert.match(traitsText, /Giant \+ Iridescent/);
  assert.match(traitsText, /95th–100th percentile/);
  assert.match(traitsText, /\+350 Condition bonus/);
  assert.equal(await desktop.locator('.trait-equation').count(), 1, 'Body Type + Condition diagram missing');

  await desktop.goto(`${base}/#/equipment`, { waitUntil: 'networkidle' });
  await waitForDoc(desktop);
  await desktop.waitForFunction(() => document.querySelectorAll('#article .doc-item-icon').length >= 20);
  const iconState = await desktop.locator('#article .doc-item-icon').evaluateAll(imgs => imgs.map(img => ({ complete: img.complete, width: img.naturalWidth, src: img.getAttribute('src') })));
  assert.ok(iconState.length >= 20, `expected at least 20 item textures, got ${iconState.length}`);
  assert.ok(iconState.every(x => x.complete && x.width > 0), 'one or more item textures failed to load');
  const equipmentText = (await desktop.locator('#article').textContent()) || '';
  assert.match(equipmentText, /current Tide world time as HH:MM/);
  assert.match(equipmentText, /current moon phase/);
  assert.match(equipmentText, /depth in blocks below sea level/);
  assert.match(equipmentText, /Clear, Rain, or Storm/);
  assert.match(equipmentText, /five informational readings/);
  await desktop.screenshot({ path: `${out}/equipment-item-textures.png`, fullPage: true });

  await desktop.goto(`${base}/#/satchel`, { waitUntil: 'networkidle' });
  await waitForDoc(desktop);
  const satchelText = (await desktop.locator('#article').textContent()) || '';
  assert.match(satchelText, /Craft a 3×3 upgrade/);
  assert.doesNotMatch(satchelText, /Spend 100 XP points/);

  await desktop.goto(`${base}/#/recipes`, { waitUntil: 'networkidle' });
  await waitForDoc(desktop);
  const recipeText = (await desktop.locator('#article').textContent()) || '';
  assert.match(recipeText, /nine crafting recipes packaged by Tideborne 1\.3\.57/i);
  assert.match(recipeText, /Angler's Satchel/);
  assert.equal(await desktop.locator('.recipe-output-link[href="#/satchel"]').count(), 1, 'Angler\'s Satchel recipe output link missing');
  assert.equal(await desktop.locator('.recipe-output-link[href="#/apex"]').count(), 1, 'Chum Bucket recipe output link missing');

  for (const [width, height, label] of [[360, 800, 'mobile-360'], [390, 844, 'mobile-390'], [768, 1024, 'tablet']]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await inspectPage(page, label);
    await page.goto(`${base}/fish/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#stat-records')?.textContent === '342');
    await assertNoHorizontalOverflow(page, label);
    await page.click('#filter-toggle');
    assert.equal(await page.locator('#filter-toggle').getAttribute('aria-expanded'), 'true');
    assert.ok(await page.locator('#fish-filters').evaluate(el => el.classList.contains('filters-open')));
    await page.press('body', 'Escape');
    assert.equal(await page.locator('#filter-toggle').getAttribute('aria-expanded'), 'false');
    await page.screenshot({ path: `${out}/${label}.png`, fullPage: true });
    await page.close();
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await inspectPage(mobile, 'mobile-theme');
  await mobile.goto(`${base}/fish/`, { waitUntil: 'networkidle' });
  await mobile.waitForFunction(() => document.querySelector('#stat-records')?.textContent === '342');
  await mobile.click('#theme-button');
  assert.equal(await mobile.locator('html').getAttribute('data-theme'), 'light');
  await mobile.reload({ waitUntil: 'networkidle' });
  assert.equal(await mobile.locator('html').getAttribute('data-theme'), 'light');
  await mobile.close();

  await desktop.close();
} finally {
  await browser.close();
}

if (failures.length) {
  throw new Error(`Browser QA found ${failures.length} runtime/network errors:\n${failures.join('\n')}`);
}

console.log('Fish Wiki browser QA passed: authoritative catalog, desktop/tablet/mobile layouts, filters, search autocomplete, deep links, Tuna Condition renders, item textures, current 1.3.57 docs, recipe deep links, and GitHub Pages-style base path.');
