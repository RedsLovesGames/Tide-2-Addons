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
    const scaleBlocks = Number(stage?.dataset.scaleBlocks || 0);
    const scaleMaxCm = Number(stage?.dataset.scaleMaxCm || 0);
    const blockWidthPx = Number(stage?.dataset.blockWidthPx || 0);
    const viewportWidthPx = Number(stage?.dataset.viewportWidthPx || 0);
    const groundHeightPx = Number(stage?.dataset.groundHeightPx || 0);
    const specimenBlocks = Math.max(.001, length / 100);
    const pseudo = stage ? getComputedStyle(stage, '::after') : null;
    const pseudoHeight = Number.parseFloat(pseudo?.height || '0') || 0;
    const pseudoWidth = Number.parseFloat(pseudo?.width || '0') || 0;
    return {
      scaleMode: stage?.dataset.scaleMode || '',
      scaleBlocks,
      scaleMaxCm,
      blockWidthPx,
      viewportWidthPx,
      groundHeightPx,
      specimenBlocks,
      expectedFishWidth: specimenBlocks * blockWidthPx,
      fishWidth: image?.getBoundingClientRect().width || 0,
      fishHeight: image?.getBoundingClientRect().height || 0,
      stageWidth: stage?.getBoundingClientRect().width || 0,
      shellWidth: shell?.getBoundingClientRect().width || 0,
      shellHeight: shell?.getBoundingClientRect().height || 0,
      rulerWidth: ruler?.getBoundingClientRect().width || 0,
      floorHeight: pseudoHeight,
      floorWidth: pseudoWidth,
      viewLabel: document.querySelector('[data-live-view-scale]')?.textContent || '',
      maxLabel: document.querySelector('[data-live-max-specimen]')?.textContent || '',
      imageSrc: image?.getAttribute('src') || '',
    };
  });
}

async function setRange(selector, value) {
  await page.locator(selector).evaluate((element, next) => {
    element.value = String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  await page.waitForTimeout(80);
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
  assert.equal(runtimeState.scaleMode, 'species-ceiling-responsive');

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

  const pupfish = page.locator('.fish-card[data-id="tide:devils_hole_pupfish"]');
  assert.equal(await pupfish.count(), 1, 'Devils Hole Pupfish regression fixture missing from canonical scoped catalog');
  await pupfish.click();
  await page.waitForSelector('#fish-highlight-layer:not([hidden]) [data-live-render-stage]');
  await page.waitForFunction(() => Number(document.querySelector('[data-live-render-stage]')?.dataset.blockWidthPx || 0) > 0);

  const pupfishExpected = await page.evaluate(async () => {
    const runtime = await window.TideFishRuntime.ready;
    const record = runtime.recordMap.get('tide:devils_hole_pupfish');
    return { blocks: runtime.speciesScaleBlocks(record), maxCm: runtime.speciesScaleMaxCm(record) };
  });
  const pupfishInitial = await readScaleState();
  assert.equal(pupfishInitial.scaleBlocks, pupfishExpected.blocks, 'Pupfish did not use canonical speciesScaleBlocks');
  assert.equal(pupfishInitial.scaleBlocks, Math.max(1, Math.ceil(pupfishExpected.maxCm / 100)), 'species viewport must round the maximum specimen ceiling upward to whole blocks');
  assert.equal(pupfishInitial.scaleBlocks, 1, 'Devils Hole Pupfish should use a one-block viewport');
  assert.ok(['species', 'species-fit-height'].includes(pupfishInitial.scaleMode), `unexpected species camera mode ${pupfishInitial.scaleMode}`);
  assert.ok(pupfishInitial.blockWidthPx > 160, `one-block tiny-fish camera collapsed too far: ${pupfishInitial.blockWidthPx}px`);
  assert.ok(Math.abs(pupfishInitial.fishWidth - pupfishInitial.expectedFishWidth) <= 2.5, `Pupfish width lost physical coupling: expected ${pupfishInitial.expectedFishWidth}px, got ${pupfishInitial.fishWidth}px`);
  assert.ok(pupfishInitial.fishWidth >= 4, `Pupfish render collapsed below its physical minimum: width=${pupfishInitial.fishWidth}px stage=${pupfishInitial.stageWidth}px`);
  assert.ok(Math.abs(pupfishInitial.rulerWidth - pupfishInitial.blockWidthPx) <= 2.5, 'one-block ruler width drifted from physical block width');
  assert.ok(pupfishInitial.viewportWidthPx <= pupfishInitial.shellWidth + 2.5, 'species viewport exceeds render shell width');
  assert.ok(Math.abs(pupfishInitial.floorHeight - pupfishInitial.blockWidthPx) <= 2.5, `floor block is not square: height=${pupfishInitial.floorHeight}px blockWidth=${pupfishInitial.blockWidthPx}px`);
  assert.ok(Math.abs(pupfishInitial.floorWidth - pupfishInitial.viewportWidthPx) <= 2.5, `floor width drifted from species viewport: floor=${pupfishInitial.floorWidth}px viewport=${pupfishInitial.viewportWidthPx}px`);
  assert.ok(Math.abs(pupfishInitial.floorWidth / pupfishInitial.blockWidthPx - pupfishInitial.scaleBlocks) <= 0.03, 'floor does not contain the exact species block count');
  assert.ok(Math.abs(pupfishInitial.groundHeightPx - pupfishInitial.blockWidthPx) <= 0.1, 'layout ground height is not tied to true-square physical blocks');
  assert.match(pupfishInitial.viewLabel, /^1 BLOCK VIEW$/, 'tiny-fish viewport label should expose one-block species camera');
  assert.match(pupfishInitial.maxLabel, /^max /, 'species maximum label missing');

  await setRange('[data-live-percentile-input]', 100);
  const pupfishMaxNormal = await readScaleState();
  assert.equal(pupfishMaxNormal.scaleBlocks, pupfishInitial.scaleBlocks, 'camera block count changed when percentile changed');
  assert.ok(Math.abs(pupfishMaxNormal.blockWidthPx - pupfishInitial.blockWidthPx) <= 1, 'camera zoom changed when percentile changed');
  assert.ok(pupfishMaxNormal.fishWidth > pupfishInitial.fishWidth, 'fish did not visibly grow when percentile increased');
  assert.ok(Math.abs(pupfishMaxNormal.fishWidth - pupfishMaxNormal.expectedFishWidth) <= 2.5, 'max-normal Pupfish lost physical scale coupling');
  assert.ok(Math.abs(pupfishMaxNormal.floorHeight - pupfishMaxNormal.blockWidthPx) <= 2.5, 'square floor changed shape when percentile changed');

  const canonicalBundle = await page.evaluate(async () => {
    const runtime = await window.TideFishRuntime.ready;
    return runtime.renderManifest?.pipelineStatus === 'canonical_runtime_bundle';
  });
  if (canonicalBundle) {
    await page.locator('[data-body="giant"]').click();
    await page.waitForTimeout(100);
    const pupfishGiant = await readScaleState();
    assert.equal(pupfishGiant.scaleBlocks, pupfishInitial.scaleBlocks, 'camera block count changed for Giant body type');
    assert.ok(Math.abs(pupfishGiant.blockWidthPx - pupfishInitial.blockWidthPx) <= 1, 'camera zoom changed when switching to Giant');
    assert.ok(pupfishGiant.imageSrc.includes('__giant.png'), `canonical runtime bundle should expose giant body render, got ${pupfishGiant.imageSrc}`);
    assert.ok(Math.abs(pupfishGiant.fishWidth - pupfishGiant.expectedFishWidth) <= 2.5, 'Giant Pupfish lost physical scale coupling');
  }

  const beforeResize = await readScaleState();
  await page.setViewportSize({ width: 1000, height: 760 });
  await page.waitForTimeout(140);
  const afterResize = await readScaleState();
  assert.equal(afterResize.scaleBlocks, beforeResize.scaleBlocks, 'responsive resize changed the species viewport block count');
  assert.ok(afterResize.blockWidthPx < beforeResize.blockWidthPx, 'responsive resize did not reduce the physical camera scale');
  assert.ok(Math.abs(afterResize.fishWidth - afterResize.expectedFishWidth) <= 2.5, 'Pupfish lost physical scale coupling after viewport resize');
  assert.ok(afterResize.viewportWidthPx <= afterResize.shellWidth + 2.5, 'resized tiny-fish viewport exceeds render shell');
  assert.ok(Math.abs(afterResize.floorHeight - afterResize.blockWidthPx) <= 2.5, 'resized floor block is no longer square');
  assert.ok(Math.abs(afterResize.floorWidth / afterResize.blockWidthPx - afterResize.scaleBlocks) <= 0.03, 'resized floor block count drifted from species viewport');

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.getElementById('fish-highlight-layer')?.hidden === true);
  await page.setViewportSize({ width: 1440, height: 1000 });

  const dragon = page.locator('.fish-card[data-id="tide:dragon_fish"]');
  if (await dragon.count()) {
    await dragon.click();
    await page.waitForSelector('#fish-highlight-layer:not([hidden]) [data-live-render-stage]');
    await page.waitForFunction(() => Number(document.querySelector('[data-live-render-stage]')?.dataset.blockWidthPx || 0) > 0);
    const dragonExpected = await page.evaluate(async () => {
      const runtime = await window.TideFishRuntime.ready;
      const record = runtime.recordMap.get('tide:dragon_fish');
      return { blocks: runtime.speciesScaleBlocks(record), maxCm: runtime.speciesScaleMaxCm(record) };
    });
    const dragonInitial = await readScaleState();
    assert.ok(dragonExpected.blocks > 1, 'large-fish fixture should require a multi-block viewport');
    assert.equal(dragonInitial.scaleBlocks, dragonExpected.blocks, 'large fish did not use canonical whole-block species viewport');
    assert.ok((dragonExpected.maxCm / 100) * dragonInitial.blockWidthPx <= dragonInitial.shellWidth + 3, 'largest legitimate Dragon Fish would overflow the horizontal species camera');
    assert.ok(dragonInitial.fishWidth <= dragonInitial.shellWidth + 2, 'Dragon Fish overflowed render shell width');
    assert.ok(dragonInitial.fishHeight <= dragonInitial.shellHeight + 2, 'Dragon Fish overflowed render shell height');
    assert.ok(Math.abs(dragonInitial.floorHeight - dragonInitial.blockWidthPx) <= 2.5, 'large-fish floor block is not square');
    assert.ok(Math.abs(dragonInitial.floorWidth / dragonInitial.blockWidthPx - dragonInitial.scaleBlocks) <= 0.03, 'large-fish floor block count is incorrect');

    await page.setViewportSize({ width: 1000, height: 760 });
    await page.waitForTimeout(140);
    const dragonResized = await readScaleState();
    assert.equal(dragonResized.scaleBlocks, dragonInitial.scaleBlocks, 'large-fish viewport block count changed after resize');
    assert.ok(Math.abs(dragonResized.fishWidth - dragonResized.expectedFishWidth) <= 2.5, 'large render width lost physical coupling after resize');
    assert.ok(dragonResized.fishWidth <= dragonResized.shellWidth + 2, 'large fish overflowed render shell width after resize');
    assert.ok(dragonResized.fishHeight <= dragonResized.shellHeight + 2, 'large fish overflowed render shell height after resize');
    assert.ok(Math.abs(dragonResized.floorHeight - dragonResized.blockWidthPx) <= 2.5, 'large-fish floor stopped being square after resize');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.getElementById('fish-highlight-layer')?.hidden === true);
  }
} finally {
  await browser.close();
}

if (failures.length) throw new Error(`Runtime architecture QA found ${failures.length} runtime/network errors:\n${failures.join('\n')}`);
console.log('Fish Wiki runtime architecture QA passed: canonical owners, source-authentic variants, responsive species-ceiling scaling, and true-square floor blocks for tiny and large fish.');