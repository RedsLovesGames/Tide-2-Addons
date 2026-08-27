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

async function readScaleState() {
  return page.evaluate(() => {
    const stage = document.querySelector('[data-live-render-stage]');
    const shell = document.querySelector('.fish-lab-render-shell');
    const image = document.querySelector('[data-live-render-img]');
    const ruler = document.querySelector('.fish-lab-ruler');
    const length = Number(document.querySelector('[data-live-length-input]')?.value || 0);
    const blockPx = Number(stage?.dataset.blockPx || 0);
    const blocks = Math.max(.01, length / 100);
    return {
      scaleMode: stage?.dataset.scaleMode || '',
      blockPx,
      blocks,
      expectedFishWidth: blocks * blockPx,
      fishWidth: image?.getBoundingClientRect().width || 0,
      fishHeight: image?.getBoundingClientRect().height || 0,
      stageWidth: stage?.getBoundingClientRect().width || 0,
      shellWidth: shell?.getBoundingClientRect().width || 0,
      shellHeight: shell?.getBoundingClientRect().height || 0,
      rulerWidth: ruler?.getBoundingClientRect().width || 0,
    };
  });
}

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
  assert.equal(runtimeState.scaleMode, 'physical-auto-fit');

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
  await page.waitForFunction(() => Number(document.querySelector('[data-live-render-stage]')?.dataset.blockPx || 0) > 0);
  const larvaScale = await readScaleState();
  assert.ok(['physical', 'fit'].includes(larvaScale.scaleMode), `unexpected auto scale mode ${larvaScale.scaleMode}`);
  assert.ok(larvaScale.blockPx >= 8 && larvaScale.blockPx <= 240.5, `block scale escaped auto-fit bounds: ${larvaScale.blockPx}px`);
  assert.ok(Math.abs(larvaScale.fishWidth - larvaScale.expectedFishWidth) <= 2.5, `render width is no longer tied to physical fish length: expected ${larvaScale.expectedFishWidth}px, got ${larvaScale.fishWidth}px`);
  assert.ok(Math.abs(larvaScale.rulerWidth - larvaScale.blockPx) <= 2.5, `1-block ruler width ${larvaScale.rulerWidth}px drifted from block scale ${larvaScale.blockPx}px`);
  assert.ok(larvaScale.fishWidth >= 12, `tiny-fish visibility regressed: Incandescent Larva width=${larvaScale.fishWidth}px stage=${larvaScale.stageWidth}px`);

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
    await page.waitForFunction(() => Number(document.querySelector('[data-live-render-stage]')?.dataset.blockPx || 0) > 0);

    const beforeResize = await readScaleState();
    assert.ok(beforeResize.fishWidth <= beforeResize.shellWidth + 2, `large fish overflowed render shell width before resize: ${beforeResize.fishWidth} > ${beforeResize.shellWidth}`);
    assert.ok(beforeResize.fishHeight <= beforeResize.shellHeight + 2, `large fish overflowed render shell height before resize: ${beforeResize.fishHeight} > ${beforeResize.shellHeight}`);

    await page.setViewportSize({ width: 1000, height: 760 });
    await page.waitForTimeout(120);
    const afterResize = await readScaleState();
    assert.ok(afterResize.blockPx >= 8 && afterResize.blockPx <= 240.5, `responsive block scale escaped bounds after resize: ${afterResize.blockPx}px`);
    assert.ok(Math.abs(afterResize.fishWidth - afterResize.expectedFishWidth) <= 2.5, 'render width lost physical-scale coupling after viewport resize');
    assert.ok(afterResize.fishWidth <= afterResize.shellWidth + 2, `large fish overflowed render shell width after resize: ${afterResize.fishWidth} > ${afterResize.shellWidth}`);
    assert.ok(afterResize.fishHeight <= afterResize.shellHeight + 2, `large fish overflowed render shell height after resize: ${afterResize.fishHeight} > ${afterResize.shellHeight}`);
    assert.ok(Math.abs(afterResize.rulerWidth - afterResize.blockPx) <= 2.5, '1-block ruler did not resize with the render');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('fish-highlight-layer')?.hidden === true);
  }
} finally {
  await browser.close();
}

if (failures.length) throw new Error(`Runtime architecture QA found ${failures.length} runtime/network errors:\n${failures.join('\n')}`);
console.log('Fish Wiki runtime architecture QA passed: one shared data load, canonical owners, source-authentic runtime variants, and responsive physical auto-fit scaling.');
