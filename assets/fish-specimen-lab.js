(()=>{
'use strict';

const results=document.getElementById('fish-results');
const catalog=document.getElementById('catalog-view');
if(!results||!catalog)return;

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const esc=value=>String(value??'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const fmt=value=>Number.isFinite(Number(value))?Number(value).toLocaleString(undefined,{maximumFractionDigits:2}):'n/a';
const fmt1=value=>Number.isFinite(Number(value))?Number(value).toLocaleString(undefined,{maximumFractionDigits:1}):'n/a';
const title=value=>String(value||'').replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
const stars=value=>'★'.repeat(Math.max(1,Math.min(5,Number(value)||1)));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const bodyLabels={dwarf:'Dwarf',normal:'Normal',giant:'Giant'};
const conditionLabels={normal:'Normal',parasite_ridden:'Parasite-Ridden',scarred:'Scarred',albino:'Albino',iridescent:'Iridescent',perfect_specimen:'Perfect Specimen'};

let runtime=null;
let openRecord=null;
let specimenState=null;
let sourceCard=null;
let sourceFocus=null;
let closing=false;
let scaleFrame=0;

const layer=document.createElement('div');
layer.id='fish-highlight-layer';
layer.hidden=true;
layer.innerHTML='<button class="fish-highlight-backdrop" type="button" data-highlight-close aria-label="Close fish details"></button><section class="fish-highlight-modal" role="dialog" aria-modal="true" tabindex="-1"></section>';
document.body.append(layer);
const modal=layer.querySelector('.fish-highlight-modal');
const backdrop=layer.querySelector('.fish-highlight-backdrop');

const scheduleScaleUpdate=()=>{
  if(layer.hidden)return;
  cancelAnimationFrame(scaleFrame);
  scaleFrame=requestAnimationFrame(updatePhysicalScale);
};
const stageResizeObserver='ResizeObserver' in window?new ResizeObserver(scheduleScaleUpdate):null;

const fact=(label,value,cls='')=>`<div class="fish-lab-fact ${cls}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
function defaultState(record){const body='normal',condition='normal',percentile=50;return {body,condition,percentile,length:runtime.lengthFromPercent(record,body,condition,percentile)};}
function relatedFor(record){return runtime.records.filter(item=>item.id!==record.id&&(item.group===record.group||item.modKey===record.modKey)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,6);}
function formatCondition(condition){const entries=Object.entries(condition||{}).filter(([key])=>key!=='type');return entries.length?entries.map(([key,value])=>`${title(key)}: ${Array.isArray(value)?value.join(', '):typeof value==='object'?JSON.stringify(value):value}`).join(' · '):'Enabled';}
function orderedRecords(){return [...runtime.records].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));}
function adjacentId(direction){const list=orderedRecords(),index=list.findIndex(record=>record.id===openRecord?.id);return index<0?null:list[(index+direction+list.length)%list.length]?.id||null;}

function modalHtml(record){
  const envelope=runtime.envelope(record);
  specimenState=defaultState(record);
  const bounds=runtime.bodyBounds(record,'normal');
  const variant=runtime.variantFor(record.id,'normal','normal');
  const related=relatedFor(record);
  const conditions=Array.isArray(record.conditions)?record.conditions:[];
  const giantPerfect=runtime.score(record,100,'perfect_specimen','giant',envelope.giantHigh);
  const minScore=runtime.score(record,0,'normal','normal',envelope.normalLow);
  const live=runtime.scoreBreakdown(record,specimenState.percentile,'normal','normal',specimenState.length);
  const preview=variant?`<img data-live-render-img src="${esc(variant.file)}" alt="${esc(record.name)} source-authentic render" decoding="async">`:'<div class="fish-lab-render-missing">No source-backed render available</div>';

  return `<div class="fish-highlight-topbar"><button class="fish-highlight-nav-btn" type="button" data-highlight-prev aria-label="Previous fish">←</button><div class="fish-highlight-nav-label"><span>Specimen lab</span><strong>${esc(record.name)}</strong></div><button class="fish-highlight-nav-btn" type="button" data-highlight-next aria-label="Next fish">→</button><button class="fish-highlight-close" type="button" data-highlight-close aria-label="Close fish details">×</button></div><div class="fish-highlight-scroll" data-highlight-scroll><section class="fish-lab-workspace fish-lab-workspace-stable"><article class="fish-lab-specimen-card"><div class="fish-lab-heading"><div><p class="fish-highlight-eyebrow">${esc(record.mod||record.namespace||'Fish')} · ${esc(title(record.rarity||''))}</p><h1 class="fish-highlight-title">${esc(record.name)}</h1></div><span class="fish-lab-star-pill">${stars(record.stars)}</span></div><div class="fish-highlight-subline"><span>${esc(title(record.group||''))}</span><span>${esc(record.location||record.locationKey||'Unknown habitat')}</span><span>${esc(runtime.slug(record.id))}</span></div><div class="fish-lab-render-stage" data-live-render-stage><div class="fish-lab-water-grid" aria-hidden="true"></div><div class="fish-lab-render-shell">${preview}</div><div class="fish-lab-scale-reference" aria-label="One Minecraft block equals one meter or one hundred centimeters. The render automatically fits when required by the viewport."><span class="fish-lab-block-icon" aria-hidden="true"></span><div class="fish-lab-ruler"><span class="fish-lab-ruler-ticks" aria-hidden="true"></span><div><strong>1 BLOCK</strong><em>100 cm · 1 m</em></div></div></div><div class="fish-lab-render-meta"><span data-live-render-note>${variant?'Source-authentic normal render':'Render unavailable'}</span><strong data-live-scale>${fmt1(specimenState.length)} cm · ${(specimenState.length/100).toFixed(2)} blocks</strong></div></div></article><aside class="fish-lab-console fish-lab-console-stable"><div class="fish-lab-control-panel-head"><h2>Specimen controls</h2><div class="fish-lab-score-head"><div><span>Live FishScore</span><strong data-live-score>${fmt1(live.total)}</strong></div></div></div><div class="fish-lab-control-grid"><div class="fish-lab-control-group"><label>Body type</label><div class="fish-lab-segmented">${Object.entries(bodyLabels).map(([key,label])=>`<button type="button" data-body="${key}" class="${key==='normal'?'active':''}">${label}</button>`).join('')}</div></div><div class="fish-lab-control-group"><label for="fish-lab-condition">Condition</label><select id="fish-lab-condition" data-live-condition>${Object.entries(conditionLabels).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></div><div class="fish-lab-control-group"><div class="fish-lab-control-label"><label for="fish-lab-percentile">Percentile</label><output data-live-percentile>50%</output></div><input id="fish-lab-percentile" data-live-percentile-input type="range" min="0" max="100" step="1" value="50"><div class="fish-lab-range-labels"><span data-live-percentile-min>0th</span><span>100th</span></div><div class="fish-lab-perfect-note" data-perfect-percentile-note hidden>Perfect Specimen requires 95th percentile or higher.</div></div><div class="fish-lab-control-group"><div class="fish-lab-control-label"><label for="fish-lab-length">Length</label><output data-live-length>${fmt1(specimenState.length)} cm</output></div><input id="fish-lab-length" data-live-length-input type="range" min="${bounds.min}" max="${bounds.max}" step="0.1" value="${specimenState.length}"><div class="fish-lab-range-labels"><span data-live-length-min>${fmt1(bounds.min)} cm</span><span data-live-length-max>${fmt1(bounds.max)} cm</span></div></div></div><div class="fish-lab-breakdown">${fact('Percentile',fmt1(live.percentilePoints),'accent')}${fact('Rarity',fmt1(live.rarity))}${fact('Record bonus',fmt1(live.recordBonus))}${fact('Length bonus',fmt1(live.physical))}${fact('Body bonus',fmt1(live.bodyBonus))}${fact('Condition',fmt1(live.conditionPoints))}</div><div class="fish-lab-multiplier" data-live-multiplier hidden>Perfect Specimen final multiplier <strong>×1.20</strong></div></aside></section><section class="fish-lab-summary-grid"><article class="fish-lab-panel"><div class="fish-lab-panel-head"><h2>Species stats</h2><span>source FishData</span></div><div class="fish-lab-facts">${fact('Size · no traits',`${fmt(envelope.normalLow)} → ${fmt(envelope.normalHigh)} cm`)}${fact('Size · with traits',`${fmt(envelope.traitLow)} → ${fmt(envelope.giantHigh)} cm`)}${fact('Render scale','1 block = 100 cm · auto-fit')}${fact('FishScore range',`${fmt1(minScore)} → ${fmt1(giantPerfect)}`,'accent')}${fact('Strength',fmt(record.strength))}${fact('Speed',fmt(record.speed))}${fact('Selection weight',fmt(record.weight))}${fact('Bucket',record.bucket||'n/a','wide')}</div></article><article class="fish-lab-panel"><div class="fish-lab-panel-head"><h2>Catch conditions</h2><span>${conditions.length} rules</span></div><div class="fish-lab-condition-list">${conditions.length?conditions.map(condition=>`<div><strong>${esc(condition.type||'condition')}</strong><span>${esc(formatCondition(condition))}</span></div>`).join(''):'<p>No explicit catch-condition records.</p>'}</div></article></section><details class="fish-lab-accordion"><summary><span>Reference ceilings & provenance</span><i>+</i></summary><div class="fish-lab-accordion-body"><div><h3>Reference ceilings</h3><div class="fish-lab-reference-list">${[['Normal',runtime.score(record,100,'normal','normal',envelope.normalHigh)],['Giant',runtime.score(record,100,'normal','giant',envelope.giantHigh)],['Iridescent',runtime.score(record,100,'iridescent','normal',envelope.normalHigh)],['Perfect Specimen',runtime.score(record,100,'perfect_specimen','normal',envelope.normalHigh)],['Giant + Perfect',giantPerfect]].map(([label,value])=>`<div><span>${label}</span><strong>${fmt1(value)}</strong></div>`).join('')}</div></div><div><h3>Provenance</h3><dl><dt>FishData</dt><dd>${esc(record.sourceJar||'unknown')} · ${esc(record.sourcePath||'unknown')}</dd><dt>Entity</dt><dd>${esc(record.entity||record.id||'unknown')}</dd><dt>Render</dt><dd>${variant?'Canonical runtime Tide Fish Display bundle':'Runtime bundle render unavailable'}</dd></dl></div></div></details><details class="fish-lab-accordion"><summary><span>Related fish</span><i>+</i></summary><div class="fish-lab-related">${related.map(item=>`<button type="button" data-highlight-fish="${esc(item.id)}"><strong>${esc(item.name)}</strong><span>${esc(item.mod||item.namespace||'Fish')}</span></button>`).join('')||'<p>No related fish.</p>'}</div></details></div>`;
}

function animateIn(){
  if(reduced())return;
  modal.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:180,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  backdrop.animate([{opacity:0},{opacity:1}],{duration:160,fill:'both'});
}

function updatePhysicalScale(){
  if(!openRecord||!specimenState)return;
  const stage=modal.querySelector('[data-live-render-stage]');
  const shell=modal.querySelector('.fish-lab-render-shell');
  const image=modal.querySelector('[data-live-render-img]');
  if(!stage)return;

  const apply=()=>{
    const blocks=Math.max(.01,specimenState.length/100);
    const aspect=image?.naturalWidth&&image?.naturalHeight?image.naturalHeight/image.naturalWidth:.45;
    const preferred=clamp(stage.clientWidth*.19,125,190);
    const horizontalRoom=Math.max(120,stage.clientWidth-120);
    const fitW=horizontalRoom/blocks;

    let blockPx=Math.max(8,Math.min(preferred,fitW));
    stage.style.setProperty('--block-px',`${blockPx}px`);

    const shellHeight=Math.max(80,shell?.clientHeight||stage.clientHeight-118);
    const fitH=shellHeight/Math.max(blocks*aspect,.01);
    blockPx=Math.max(8,Math.min(blockPx,fitH));

    const fishPx=Math.max(3,blocks*blockPx);
    stage.style.setProperty('--block-px',`${blockPx}px`);
    stage.style.setProperty('--fish-width',`${fishPx}px`);
    stage.dataset.scaleMode=blockPx<preferred*.97?'fit':'physical';
    stage.dataset.blockPx=blockPx.toFixed(2);
    if(image)image.style.width=`${fishPx}px`;

    const output=modal.querySelector('[data-live-scale]');
    if(output)output.textContent=`${fmt1(specimenState.length)} cm · ${blocks.toFixed(2)} blocks`;
  };

  if(!image||image.complete&&image.naturalWidth)apply();
  else image.addEventListener('load',apply,{once:true});
}

function syncFromPercentile(value){
  const floor=runtime.percentileFloor(specimenState.condition);
  specimenState.percentile=clamp(Number(value)||0,floor,100);
  specimenState.length=runtime.lengthFromPercent(openRecord,specimenState.body,specimenState.condition,specimenState.percentile);
}

function syncFromLength(value){
  const bounds=runtime.bodyBounds(openRecord,specimenState.body);
  const floor=runtime.percentileFloor(specimenState.condition);
  const floorLength=runtime.lengthFromPercent(openRecord,specimenState.body,specimenState.condition,floor);
  specimenState.length=clamp(Number(value)||bounds.min,floorLength,bounds.max);
  specimenState.percentile=Math.max(floor,runtime.percentFromLength(openRecord,specimenState.body,specimenState.length));
}

function updateLive(){
  if(!openRecord||!specimenState)return;
  const record=openRecord;
  const state=specimenState;
  const floor=runtime.percentileFloor(state.condition);
  if(state.percentile<floor)syncFromPercentile(floor);

  const bounds=runtime.bodyBounds(record,state.body);
  const floorLength=runtime.lengthFromPercent(record,state.body,state.condition,floor);
  const breakdown=runtime.scoreBreakdown(record,state.percentile,state.condition,state.body,state.length);

  const percentile=modal.querySelector('[data-live-percentile-input]');
  if(percentile){percentile.min=String(floor);percentile.max='100';percentile.value=String(state.percentile);}
  const length=modal.querySelector('[data-live-length-input]');
  if(length){length.min=String(floorLength);length.max=String(bounds.max);length.value=String(state.length);}
  modal.querySelector('[data-live-percentile-min]')?.replaceChildren(document.createTextNode(floor?'95th':'0th'));
  modal.querySelector('[data-live-length-min]')?.replaceChildren(document.createTextNode(`${fmt1(floorLength)} cm`));
  modal.querySelector('[data-live-length-max]')?.replaceChildren(document.createTextNode(`${fmt1(bounds.max)} cm`));

  const note=modal.querySelector('[data-perfect-percentile-note]');
  if(note)note.hidden=state.condition!=='perfect_specimen';
  modal.querySelector('[data-live-score]')?.replaceChildren(document.createTextNode(fmt1(breakdown.total)));
  modal.querySelector('[data-live-percentile]')?.replaceChildren(document.createTextNode(`${Math.round(state.percentile)}%`));
  modal.querySelector('[data-live-length]')?.replaceChildren(document.createTextNode(`${fmt1(state.length)} cm`));

  const values=[breakdown.percentilePoints,breakdown.rarity,breakdown.recordBonus,breakdown.physical,breakdown.bodyBonus,breakdown.conditionPoints];
  modal.querySelectorAll('.fish-lab-breakdown .fish-lab-fact strong').forEach((element,index)=>element.textContent=fmt1(values[index]));
  const multiplier=modal.querySelector('[data-live-multiplier]');
  if(multiplier)multiplier.hidden=breakdown.multiplier===1;
  modal.querySelectorAll('[data-body]').forEach(button=>button.classList.toggle('active',button.dataset.body===state.body));

  const variant=runtime.variantFor(record.id,state.condition,state.body);
  const image=modal.querySelector('[data-live-render-img]');
  if(image&&variant&&image.getAttribute('src')!==variant.file){
    image.src=variant.file;
    image.addEventListener('load',scheduleScaleUpdate,{once:true});
  }
  const renderNote=modal.querySelector('[data-live-render-note]');
  if(renderNote)renderNote.textContent=!variant?'Render unavailable':variant.key==='normal'?'Source-authentic normal render':`Source-authentic ${title(variant.key)} runtime render`;

  scheduleScaleUpdate();
}

function setBody(body){
  if(!openRecord||!specimenState||!bodyLabels[body])return;
  const percentile=specimenState.percentile;
  specimenState.body=body;
  syncFromPercentile(percentile);
  updateLive();
}

function showRecord(id,{source=null,animate=true}={}){
  const record=runtime.recordMap.get(id);
  if(!record)return false;
  openRecord=record;
  if(source){sourceCard=source;sourceFocus=source;}
  modal.innerHTML=modalHtml(record);
  layer.hidden=false;
  document.body.classList.add('fish-highlight-open');
  sourceCard?.classList.add('is-highlight-source');
  modal.querySelector('[data-highlight-scroll]')?.scrollTo(0,0);
  stageResizeObserver?.disconnect();
  const stage=modal.querySelector('[data-live-render-stage]');
  if(stage)stageResizeObserver?.observe(stage);
  updateLive();
  if(animate)animateIn();
  requestAnimationFrame(()=>modal.focus({preventScroll:true}));
  return true;
}

async function closeModal(){
  if(layer.hidden||closing)return;
  closing=true;
  if(!reduced())await Promise.allSettled([
    modal.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(7px)'}],{duration:140,easing:'ease',fill:'both'}).finished,
    backdrop.animate([{opacity:1},{opacity:0}],{duration:120,fill:'both'}).finished
  ]);
  stageResizeObserver?.disconnect();
  cancelAnimationFrame(scaleFrame);
  sourceCard?.classList.remove('is-highlight-source');
  layer.hidden=true;
  modal.innerHTML='';
  document.body.classList.remove('fish-highlight-open');
  const focus=sourceFocus;
  openRecord=null;
  specimenState=null;
  sourceCard=null;
  sourceFocus=null;
  closing=false;
  if(focus&&document.contains(focus))focus.focus({preventScroll:true});
}

window.TideFishRuntime.ready.then(value=>{
  runtime=value;
  document.body.dataset.fishSpecimenLab='canonical';
  document.body.dataset.fishScaleMode='physical-auto-fit';
}).catch(error=>console.error('Specimen lab runtime failed',error));

results.addEventListener('click',event=>{
  const card=event.target.closest('.fish-card[data-id],.fish-row[data-id]');
  if(!card||!runtime)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  showRecord(card.dataset.id,{source:card,animate:true});
},true);

layer.addEventListener('click',event=>{
  if(event.target.closest('[data-highlight-close]'))return void closeModal();
  const body=event.target.closest('[data-body]');
  if(body)return void setBody(body.dataset.body);
  const related=event.target.closest('[data-highlight-fish]');
  if(related)return void showRecord(related.dataset.highlightFish,{animate:false});
  if(event.target.closest('[data-highlight-prev]')){const id=adjacentId(-1);if(id)showRecord(id,{animate:false});return;}
  if(event.target.closest('[data-highlight-next]')){const id=adjacentId(1);if(id)showRecord(id,{animate:false});}
});

layer.addEventListener('input',event=>{
  if(!specimenState)return;
  if(event.target.matches('[data-live-percentile-input]')){syncFromPercentile(event.target.value);updateLive();}
  else if(event.target.matches('[data-live-length-input]')){syncFromLength(event.target.value);updateLive();}
  else if(event.target.matches('[data-live-condition]')){specimenState.condition=event.target.value;syncFromPercentile(specimenState.percentile);updateLive();}
});

layer.addEventListener('change',event=>{
  if(specimenState&&event.target.matches('[data-live-condition]')){
    specimenState.condition=event.target.value;
    syncFromPercentile(specimenState.percentile);
    updateLive();
  }
});

window.addEventListener('resize',scheduleScaleUpdate);
document.addEventListener('keydown',event=>{
  if(!layer.hidden&&event.key==='Escape'){
    event.preventDefault();
    event.stopImmediatePropagation();
    closeModal();
  }
},true);
})();
