import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8000/Tide-2-Addons';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const requests = new Map();
const failures = [];

const tracked = [
  '/assets/fish-wiki-data-0.json.gz',
  '/assets/fish-wiki-data-1.json.gz',
  '/assets/fish-render-manifest.json',
  '/fish/render-data/modpack-scope.json',
];

page.on('request', request => {
  const url = new URL(request.url());
  for (const suffix of tracked) {
    if (url.pathname.endsWith(suffix)) requests.set(suffix, (requests.get(suffix) || 0) + 1);
  }
});
page.on('console', msg => {
  if (msg.type() === 'error') failures.push(`console: ${msg.text()}`);
});
page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
page.on('response', response => {
  if (response.status() >= 400) failures.push(`HTTP ${response.status()}: ${response.url()}`);
});

try {
  await page.goto(`${base}/fish/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.body.dataset.fishScope === 'modpack' && window.TideFishRuntime?.ready && window.TideFishApp?.records?.length > 0);
  await page.waitForFunction(() => document.body.dataset.fishSpecimenLab === 'canonical');

  for (const suffix of tracked) {
    assert.equal(requests.get(suffix) || 0, 1, `${suffix} should be requested exactly once by the shared Fish Wiki runtime`);
  }

  const loadedScripts = await page.locator('script[src]').evaluateAll(nodes => nodes.map(node => node.getAttribute('src')));
  assert.ok(loadedScripts.some(src => src?.includes('fish-runtime.js')), 'canonical fish-runtime.js was not loaded');
  assert.ok(loadedScripts.some(src => src?.includes('fish-wiki.js')), 'canonical fish-wiki.js was not loaded');
  assert.ok(loadedScripts.some(src => src?.includes('fish-specimen-lab.js')), 'canonical fish-specimen-lab.js was not loaded');
  for (const obsolete of ['fish-detail-nav.js', 'fish-catalog-redesign.js', 'fish-specimen-lab-stable.js']) {
    assert.ok(!loadedScripts.some(src => src?.includes(obsolete)), `${obsolete} must not be loaded by the production Fish Wiki`);
  }

  const runtimeState = await page.evaluate(async () => {
    const runtime = await window.TideFishRuntime.ready;
    return {
      records: runtime.records.length,
      recordMap: runtime.recordMap.size,
      allowedIds: runtime.allowedIds.size,
      appRecords: window.TideFishApp.records.length,
      bodyScope: document.body.dataset.fishScope,
      appDesign: document.body.dataset.fishCatalogDesign,
      labOwner: document.body.dataset.fishSpecimenLab,
      scaleMode: document.body.dataset.fishScaleMode,
    };
  });
  assert.equal(runtimeState.records, runtimeState.recordMap, 'shared recordMap does not match scoped record collection');
  assert.equal(runtimeState.records, runtimeState.allowedIds, 'shared allowedIds does not match scoped record collection');
  assert.equal(runtimeState.records, runtimeState.appRecords, 'canonical app is not consuming the shared scoped record collection');
  assert.equal(runtimeState.bodyScope, 'modpack');
  assert.equal(runtimeState.appDesign, 'catalog-v4');
  assert.equal(runtimeState.labOwner, 'canonical');
  assert.equal(runtimeState.scaleMode, 'species-ceiling-blocks');

  const cardCount = await page.locator('.fish-card').count();
  assert.equal(cardCount, runtimeState.records, 'catalog should render the scoped record collection directly without post-render hiding');
  assert.equal(await page.locator('.fish-card[hidden]').count(), 0, 'scoped catalog should not rely on hidden out-of-scope cards');

  const tuna = page.locator('.fish-card[data-id="tide:tuna"]');
  assert.equal(await tuna.count(), 1, 'Tuna card missing from canonical scoped catalog');
  await tuna.click();
  await page.waitForSelector('#fish-highlight-layer:not([hidden]) .fish-highlight-modal');
  assert.equal((await page.locator('.fish-highlight-title').textContent())?.trim(), 'Tuna');
  assert.ok(await page.locator('body').evaluate(body => body.classList.contains('fish-highlight-open')), 'Specimen Lab did not become the card interaction owner');

  const defaultScore = await page.evaluate(async () => {
    const runtime = await window.TideFishRuntime.ready;
    const record = runtime.recordMap.get('tide:tuna');
    const length = runtime.lengthFromPercent(record, 'normal', 'normal', 50);
    return runtime.scoreBreakdown(record, 50, 'normal', 'normal', length).total;
  });
  const renderedDefaultScore = Number(((await page.locator('[data-live-score]').textContent()) || '').replaceAll(',', ''));
  assert.ok(Math.abs(renderedDefaultScore - defaultScore) < 0.11, `Specimen Lab default FishScore ${renderedDefaultScore} drifted from canonical runtime ${defaultScore}`);

  await page.selectOption('[data-live-condition]', 'perfect_specimen');
  await page.waitForTimeout(60);
  assert.equal(await page.locator('[data-live-percentile-input]').getAttribute('min'), '95', 'Perfect Specimen percentile floor must be canonical 95');
  const labState = await page.evaluate(async () => {
    const runtime = await window.TideFishRuntime.ready;
    const record = runtime.recordMap.get('tide:tuna');
    const percentile = Number(document.querySelector('[data-live-percentile-input]')?.value || 0);
    const length = Number(document.querySelector('[data-live-length-input]')?.value || 0);
    return { expected: runtime.scoreBreakdown(record, percentile, 'perfect_specimen', 'normal', length).total, percentile };
  });
  assert.ok(labState.percentile >= 95, 'Perfect Specimen state dropped below canonical percentile floor');
  const renderedPerfectScore = Number(((await page.locator('[data-live-score]').textContent()) || '').replaceAll(',', ''));
  assert.ok(Math.abs(renderedPerfectScore - labState.expected) < 0.11, `Specimen Lab Perfect FishScore ${renderedPerfectScore} drifted from canonical runtime ${labState.expected}`);

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('fish-highlight-layer')?.hidden === true);

  const larva = page.locator('.fish-card[data-id="tide:incandescent_larva"]');
  assert.equal(await larva.count(), 1, 'Incandescent Larva card missing from canonical scoped catalog');
  await larva.click();
  await page.waitForSelector('#fish-highlight-layer:not([hidden]) [data-live-render-stage]');
  const larvaScale = await page.evaluate(async () => {
    const runtime = await window.TideFishRuntime.ready;
    const record = runtime.recordMap.get('tide:incandescent_larva');
    const stage = document.querySelector('[data-live-render-stage]');
    const image = document.querySelector('[data-live-render-img]');
    return {
      expectedBlocks: runtime.speciesScaleBlocks(record),
      maxCm: runtime.speciesScaleMaxCm(record),
      renderedBlocks: Number(stage?.dataset.scaleBlocks || 0),
      fishWidth: image ? image.getBoundingClientRect().width : 0,
      stageWidth: stage?.getBoundingClientRect().width || 0,
      viewLabel: document.querySelector('[data-live-view-scale]')?.textContent || '',
    };
  });
  assert.equal(larvaScale.expectedBlocks, Math.max(1, Math.ceil(larvaScale.maxCm / 100)), 'species block scale must round the maximum specimen ceiling upward to whole blocks');
  assert.equal(larvaScale.renderedBlocks, larvaScale.expectedBlocks, 'render stage did not use the canonical species block scale');
  assert.ok(larvaScale.fishWidth >= 20, `tiny-fish zoom regressed: Incandescent Larva width=${larvaScale.fishWidth}px stage=${larvaScale.stageWidth}px`);
  assert.match(larvaScale.viewLabel, new RegExp(`^${larvaScale.expectedBlocks} BLOCK`), 'viewport label does not expose the whole-block species scale');

  const canonicalBundle = await page.evaluate(async () => {
    const runtime = await window.TideFishRuntime.ready;
    return runtime.renderManifest?.pipelineStatus === 'canonical_runtime_bundle';
  });
  if (canonicalBundle) {
    await page.locator('[data-body="giant"]').click();
    await page.waitForTimeout(60);
    const src = await page.locator('[data-live-render-img]').getAttribute('src');
    assert.ok(src?.includes('__giant.png'), `canonical runtime bundle should expose giant body render, got ${src}`);
  }

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('fish-highlight-layer')?.hidden === true);

  const dragon = page.locator('.fish-card[data-id="tide:dragon_fish"]');
  if (await dragon.count()) {
    await dragon.click();
    await page.waitForSelector('#fish-highlight-layer:not([hidden]) [data-live-render-stage]');
    const dragonScale = await page.evaluate(async () => {
      const runtime = await window.TideFishRuntime.ready;
      const record = runtime.recordMap.get('tide:dragon_fish');
      return {
        expected: runtime.speciesScaleBlocks(record),
        rendered: Number(document.querySelector('[data-live-render-stage]')?.dataset.scaleBlocks || 0),
      };
    });
    assert.ok(dragonScale.expected > 1, 'large-fish regression fixture should require a multi-block viewport');
    assert.equal(dragonScale.rendered, dragonScale.expected, 'large fish did not use species-specific whole-block viewport');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('fish-highlight-layer')?.hidden === true);
  }
} finally {
  await browser.close();
}

if (failures.length) throw new Error(`Runtime architecture QA found ${failures.length} runtime/network errors:\n${failures.join('\n')}`);
console.log('Fish Wiki runtime architecture QA passed: one shared data load, canonical owners, source-authentic runtime variants, and species-ceiling whole-block scaling for tiny and large fish.');
