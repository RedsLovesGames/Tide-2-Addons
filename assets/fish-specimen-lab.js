(()=>{
'use strict';

const results=document.getElementById('fish-results');
const legacyArticle=document.getElementById('fish-article');
const catalog=document.getElementById('catalog-view');
if(!results||!catalog)return;

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const fmt=n=>Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:2}):'n/a';
const fmt1=n=>Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:1}):'n/a';
const title=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const stars=n=>'★'.repeat(Math.max(1,Math.min(5,Number(n)||1)));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const bodyLabels={dwarf:'Dwarf',normal:'Normal',giant:'Giant'};
const conditionLabels={normal:'Normal',parasite_ridden:'Parasite-Ridden',scarred:'Scarred',albino:'Albino',iridescent:'Iridescent',perfect_specimen:'Perfect Specimen'};
const conditionBonus={normal:0,parasite_ridden:15,scarred:25,albino:175,iridescent:325,perfect_specimen:350};

let records=[];
let recordsById=new Map();
let runtimeRenders={};
let openRecord=null;
let specimenState=null;
let sourceCard=null;
let sourceFocus=null;
let ready=false;
let pendingOpen=null;
let closing=false;

function scoreBreakdown(r,percentile,condition,body,length){
  const raw=clamp(Number(percentile)||0,0,100);
  const p=condition==='perfect_specimen'?Math.max(95,raw):raw;
  const record=Number(r.recordHigh)||0;
  const rarity=(Math.max(1,Number(r.stars)||1)-1)*62.5;
  const percentilePoints=p*5;
  const recordBonus=record>0?Math.min(300,75*Math.sqrt(record/100)):0;
  const physical=length>0?Math.min(150,15*(length/100)):0;
  let bodyBonus=0;
  if(body==='giant'){
    const ratio=record>0?length/record:1;
    bodyBonus=80+140*clamp((ratio-1)/.3,0,1)+80*clamp((p-97)/3,0,1);
  }else if(body==='dwarf'){
    bodyBonus=80+220*clamp((3-p)/3,0,1);
  }
  const conditionPoints=conditionBonus[condition]||0;
  const subtotal=percentilePoints+rarity+recordBonus+physical+bodyBonus+conditionPoints;
  const multiplier=condition==='perfect_specimen'?1.2:1;
  return {p,percentilePoints,rarity,recordBonus,physical,bodyBonus,conditionPoints,multiplier,total:subtotal*multiplier};
}

function score(r,p=100,c='normal',b='normal',length=Number(r.recordHigh)||0){
  return scoreBreakdown(r,p,c,b,length).total;
}

function envelope(r){
  const low=Number(r.typicalLow),high=Number(r.typicalHigh),record=Number(r.recordHigh);
  return {
    normalLow:Number.isFinite(low)?low:1,
    typicalHigh:Number.isFinite(high)?high:(Number.isFinite(record)?record:1),
    normalHigh:Number.isFinite(record)?record:(Number.isFinite(high)?high:1),
    dwarfLow:Number.isFinite(low)?low*.55:1,
    traitLow:Number.isFinite(low)?low*.55*.90:1,
    giantHigh:Number.isFinite(record)?record*1.30:(Number.isFinite(high)?high*1.30:1)
  };
}

function bodyBounds(r,body){
  const e=envelope(r);
  let min=e.normalLow,max=e.normalHigh;
  if(body==='dwarf'){min=e.dwarfLow;max=e.normalLow;}
  if(body==='giant'){min=e.normalHigh;max=e.giantHigh;}
  if(!(max>min))max=min+Math.max(1,min*.1);
  return {min,max};
}

function defaultState(r){
  const e=envelope(r);
  const initial=clamp(Number(r.typicalHigh)||((e.normalLow+e.normalHigh)/2),e.normalLow,e.normalHigh);
  return {body:'normal',condition:'normal',percentile:50,length:initial};
}

function variantFor(id,condition='normal'){
  const variants=runtimeRenders?.[id]?.variants||{};
  const aliases=condition==='parasite_ridden'?['parasite_ridden','parasite-ridden','parasite']:
    condition==='perfect_specimen'?['perfect_specimen','perfect-specimen','perfect']:[condition];
  for(const key of aliases){
    const v=variants[key];
    if(v?.file&&v.status!=='unavailable')return {file:`../${String(v.file).replace(/^\.\//,'').replace(/^\//,'')}`,exact:key!=='normal'};
  }
  const normal=variants.normal;
  if(normal?.file&&normal.status!=='unavailable')return {file:`../${String(normal.file).replace(/^\.\//,'').replace(/^\//,'')}`,exact:condition==='normal'};
  return null;
}

function relatedFor(r){
  return records.filter(x=>x.id!==r.id&&(x.group===r.group||x.modKey===r.modKey)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,6);
}

function formatCondition(c){
  const entries=Object.entries(c||{}).filter(([k])=>k!=='type');
  if(!entries.length)return 'Enabled';
  return entries.map(([k,v])=>`${title(k)}: ${Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):v}`).join(' · ');
}

function fact(label,value,cls=''){
  return `<div class="fish-lab-fact ${cls}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function modalHTML(r){
  const e=envelope(r);
  specimenState=defaultState(r);
  const bounds=bodyBounds(r,'normal');
  const variant=variantFor(r.id,'normal');
  const related=relatedFor(r);
  const conditions=Array.isArray(r.conditions)?r.conditions:[];
  const rarity=title(r.rarity||'');
  const mod=r.mod||r.namespace||'Fish';
  const group=title(r.group||'');
  const location=r.location||r.locationKey||'Unknown habitat';
  const giantPerfect=score(r,100,'perfect_specimen','giant',e.giantHigh);
  const minScore=score(r,0,'normal','normal',e.normalLow);
  const live=scoreBreakdown(r,50,'normal','normal',specimenState.length);
  const preview=variant?`<img data-live-render-img src="${esc(variant.file)}" alt="${esc(r.name)} source-authentic render" decoding="async">`:'<div class="fish-lab-render-missing">No source-backed render available</div>';
  return `
    <div class="fish-highlight-topbar">
      <button class="fish-highlight-nav-btn" type="button" data-highlight-prev aria-label="Previous fish">←</button>
      <div class="fish-highlight-nav-label"><span>Specimen lab</span><strong>${esc(r.name)}</strong></div>
      <button class="fish-highlight-nav-btn" type="button" data-highlight-next aria-label="Next fish">→</button>
      <button class="fish-highlight-close" type="button" data-highlight-close aria-label="Close fish details">×</button>
    </div>
    <div class="fish-highlight-scroll" data-highlight-scroll>
      <section class="fish-lab-workspace">
        <article class="fish-lab-specimen-card">
          <div class="fish-lab-heading">
            <div><p class="fish-highlight-eyebrow">${esc(mod)} · ${esc(rarity)}</p><h1 class="fish-highlight-title">${esc(r.name)}</h1></div>
            <span class="fish-lab-star-pill">${stars(r.stars)}</span>
          </div>
          <div class="fish-highlight-subline"><span>${esc(group)}</span><span>${esc(location)}</span><span>${esc(String(r.id||'').replace(':','__'))}</span></div>
          <div class="fish-lab-render-stage" data-live-render-stage>
            <div class="fish-lab-water-grid" aria-hidden="true"></div>
            <div class="fish-lab-orbit" aria-hidden="true"></div>
            <div class="fish-lab-render-shell">${preview}</div>
            <div class="fish-lab-scale-reference" aria-label="One Minecraft block equals one meter or one hundred centimeters">
              <span class="fish-lab-block-icon" aria-hidden="true"></span>
              <div class="fish-lab-ruler"><span class="fish-lab-ruler-ticks" aria-hidden="true"></span><div><strong>1 BLOCK</strong><em>100 cm · 1 m</em></div></div>
            </div>
            <div class="fish-lab-render-meta"><span data-live-render-note>${variant?'Source-authentic normal render':'Render unavailable'}</span><strong data-live-scale>${fmt1(specimenState.length)} cm · ${(specimenState.length/100).toFixed(2)} blocks</strong></div>
          </div>
        </article>

        <aside class="fish-lab-console">
          <div class="fish-lab-score-head"><div><span>Live FishScore</span><strong data-live-score>${fmt1(live.total)}</strong></div><span class="fish-lab-live-dot">LIVE</span></div>
          <div class="fish-lab-control-group"><label>Body type</label><div class="fish-lab-segmented">${Object.entries(bodyLabels).map(([k,v])=>`<button type="button" data-body="${k}" class="${k==='normal'?'active':''}">${v}</button>`).join('')}</div></div>
          <div class="fish-lab-control-group"><label for="fish-lab-condition">Condition</label><select id="fish-lab-condition" data-live-condition>${Object.entries(conditionLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
          <div class="fish-lab-control-group"><div class="fish-lab-control-label"><label for="fish-lab-percentile">Percentile</label><output data-live-percentile>50%</output></div><input id="fish-lab-percentile" data-live-percentile-input type="range" min="0" max="100" step="1" value="50"><div class="fish-lab-range-labels"><span data-live-percentile-min>0th</span><span>100th</span></div><div class="fish-lab-perfect-note" data-perfect-percentile-note hidden>Perfect Specimen requires 95th percentile or higher.</div></div>
          <div class="fish-lab-control-group"><div class="fish-lab-control-label"><label for="fish-lab-length">Length</label><output data-live-length>${fmt1(specimenState.length)} cm</output></div><input id="fish-lab-length" data-live-length-input type="range" min="${bounds.min}" max="${bounds.max}" step="0.1" value="${specimenState.length}"><div class="fish-lab-range-labels"><span data-live-length-min>${fmt1(bounds.min)} cm</span><span data-live-length-max>${fmt1(bounds.max)} cm</span></div></div>
          <div class="fish-lab-breakdown">${fact('Percentile',fmt1(live.percentilePoints),'accent')}${fact('Rarity',fmt1(live.rarity))}${fact('Record bonus',fmt1(live.recordBonus))}${fact('Length bonus',fmt1(live.physical))}${fact('Body bonus',fmt1(live.bodyBonus))}${fact('Condition',fmt1(live.conditionPoints))}</div>
          <div class="fish-lab-multiplier" data-live-multiplier hidden>Perfect Specimen final multiplier <strong>×1.20</strong></div>
        </aside>
      </section>

      <section class="fish-lab-summary-grid">
        <article class="fish-lab-panel"><div class="fish-lab-panel-head"><h2>Species stats</h2><span>source FishData</span></div><div class="fish-lab-facts">${fact('Size · no traits',`${fmt(e.normalLow)} → ${fmt(e.normalHigh)} cm`)}${fact('Size · with traits',`${fmt(e.traitLow)} → ${fmt(e.giantHigh)} cm`)}${fact('FishScore range',`${fmt1(minScore)} → ${fmt1(giantPerfect)}`,'accent')}${fact('Strength',fmt(r.strength))}${fact('Speed',fmt(r.speed))}${fact('Selection weight',fmt(r.weight))}${fact('Bucket',r.bucket||'n/a','wide')}</div></article>
        <article class="fish-lab-panel"><div class="fish-lab-panel-head"><h2>Catch conditions</h2><span>${conditions.length} rules</span></div><div class="fish-lab-condition-list">${conditions.length?conditions.map(c=>`<div><strong>${esc(c.type||'condition')}</strong><span>${esc(formatCondition(c))}</span></div>`).join(''):'<p>No explicit catch-condition records.</p>'}</div></article>
      </section>

      <details class="fish-lab-accordion"><summary><span>Reference ceilings & provenance</span><i>+</i></summary><div class="fish-lab-accordion-body"><div><h3>Reference ceilings</h3><div class="fish-lab-reference-list">${[['Normal',score(r,100,'normal','normal',e.normalHigh)],['Giant',score(r,100,'normal','giant',e.giantHigh)],['Iridescent',score(r,100,'iridescent','normal',e.normalHigh)],['Perfect Specimen',score(r,100,'perfect_specimen','normal',e.normalHigh)],['Giant + Perfect',giantPerfect]].map(([l,v])=>`<div><span>${l}</span><strong>${fmt1(v)}</strong></div>`).join('')}</div></div><div><h3>Provenance</h3><dl><dt>FishData</dt><dd>${esc(r.sourceJar||'unknown')} · ${esc(r.sourcePath||'unknown')}</dd><dt>Entity</dt><dd>${esc(r.entity||r.id||'unknown')}</dd><dt>Render</dt><dd>${variant?'Source-authentic published render':'Source render unavailable'}</dd></dl></div></div></details>
      <details class="fish-lab-accordion"><summary><span>Related fish</span><i>+</i></summary><div class="fish-lab-related">${related.map(x=>`<button type="button" data-highlight-fish="${esc(x.id)}"><strong>${esc(x.name)}</strong><span>${esc(x.mod||x.namespace||'Fish')}</span></button>`).join('')||'<p>No related fish.</p>'}</div></details>
    </div>`;
}

const layer=document.createElement('div');
layer.id='fish-highlight-layer';
layer.hidden=true;
layer.innerHTML='<button class="fish-highlight-backdrop" type="button" data-highlight-close aria-label="Close fish details"></button><section class="fish-highlight-modal" role="dialog" aria-modal="true" tabindex="-1"></section>';
document.body.append(layer);
const modal=layer.querySelector('.fish-highlight-modal');
const backdrop=layer.querySelector('.fish-highlight-backdrop');

function orderedRecords(){
  const scope=window.TideFishModpackScope?.allowedIds;
  return (scope?records.filter(r=>scope.has(r.id)):records).slice().sort((a,b)=>a.name.localeCompare(b.name));
}
function adjacentId(dir){
  const list=orderedRecords(),i=list.findIndex(r=>r.id===openRecord?.id);
  return i<0?null:list[(i+dir+list.length)%list.length]?.id||null;
}
function cardFor(id){return [...results.querySelectorAll('.fish-card[data-id]')].find(c=>c.dataset.id===id)||null;}

function animateIn(card){
  if(reduced())return;
  const to=modal.getBoundingClientRect(),from=card?.getBoundingClientRect();
  const frames=from?[{opacity:.3,transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${clamp(from.width/to.width,.18,.9)},${clamp(from.height/to.height,.12,.9)})`},{opacity:1,transform:'none'}]:[{opacity:0,transform:'translateY(14px) scale(.985)'},{opacity:1,transform:'none'}];
  modal.animate(frames,{duration:340,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  backdrop.animate([{opacity:0},{opacity:1}],{duration:200,fill:'both'});
}

function updatePhysicalScale(){
  if(!openRecord||!specimenState)return;
  const stage=modal.querySelector('[data-live-render-stage]'),img=modal.querySelector('[data-live-render-img]');
  if(!stage||!img)return;
  const apply=()=>{
    const blocks=Math.max(.01,specimenState.length/100);
    const aspect=img.naturalWidth&&img.naturalHeight?img.naturalHeight/img.naturalWidth:.45;
    const preferred=clamp(stage.clientWidth*.19,125,190);
    const fitW=Math.max(120,stage.clientWidth-72)/blocks;
    const fitH=Math.max(100,stage.clientHeight-118)/Math.max(blocks*aspect,.01);
    const blockPx=Math.max(8,Math.min(preferred,fitW,fitH));
    const fishPx=Math.max(3,blocks*blockPx);
    stage.style.setProperty('--block-px',`${blockPx}px`);
    stage.style.setProperty('--fish-width',`${fishPx}px`);
    stage.dataset.scaleMode=blockPx<preferred*.97?'fit':'physical';
    img.style.width=`${fishPx}px`;
    const out=modal.querySelector('[data-live-scale]');
    if(out)out.textContent=`${fmt1(specimenState.length)} cm · ${blocks.toFixed(2)} blocks`;
  };
  if(img.complete&&img.naturalWidth)apply();else img.addEventListener('load',apply,{once:true});
}

function updateLive(){
  if(!openRecord||!specimenState)return;
  if(specimenState.condition==='perfect_specimen'&&specimenState.percentile<95)specimenState.percentile=95;
  const r=openRecord,s=specimenState,b=scoreBreakdown(r,s.percentile,s.condition,s.body,s.length);
  const pct=modal.querySelector('[data-live-percentile-input]');
  if(pct){pct.min=s.condition==='perfect_specimen'?95:0;pct.value=s.percentile;}
  const pctMin=modal.querySelector('[data-live-percentile-min]');if(pctMin)pctMin.textContent=s.condition==='perfect_specimen'?'95th':'0th';
  const note=modal.querySelector('[data-perfect-percentile-note]');if(note)note.hidden=s.condition!=='perfect_specimen';
  const scoreEl=modal.querySelector('[data-live-score]');if(scoreEl)scoreEl.textContent=fmt1(b.total);
  const pctOut=modal.querySelector('[data-live-percentile]');if(pctOut)pctOut.textContent=`${Math.round(s.percentile)}%`;
  const lenOut=modal.querySelector('[data-live-length]');if(lenOut)lenOut.textContent=`${fmt1(s.length)} cm`;
  const vals=[b.percentilePoints,b.rarity,b.recordBonus,b.physical,b.bodyBonus,b.conditionPoints];
  modal.querySelectorAll('.fish-lab-breakdown .fish-lab-fact strong').forEach((el,i)=>el.textContent=fmt1(vals[i]));
  const mult=modal.querySelector('[data-live-multiplier]');if(mult)mult.hidden=b.multiplier===1;
  modal.querySelectorAll('[data-body]').forEach(btn=>btn.classList.toggle('active',btn.dataset.body===s.body));
  const variant=variantFor(r.id,s.condition),img=modal.querySelector('[data-live-render-img]');
  if(img&&variant&&img.getAttribute('src')!==variant.file){img.src=variant.file;img.addEventListener('load',updatePhysicalScale,{once:true});}
  const renderNote=modal.querySelector('[data-live-render-note]');
  if(renderNote)renderNote.textContent=!variant?'Render unavailable':s.condition==='normal'?'Source-authentic normal render':variant.exact?`Source-authentic ${conditionLabels[s.condition]} variant`:`Normal source render · ${conditionLabels[s.condition]} affects score only`;
  updatePhysicalScale();
}

function setBody(body){
  if(!openRecord||!specimenState||!bodyLabels[body])return;
  specimenState.body=body;
  const b=bodyBounds(openRecord,body);
  specimenState.length=clamp(specimenState.length,b.min,b.max);
  const slider=modal.querySelector('[data-live-length-input]');if(slider){slider.min=b.min;slider.max=b.max;slider.value=specimenState.length;}
  const lo=modal.querySelector('[data-live-length-min]'),hi=modal.querySelector('[data-live-length-max]');
  if(lo)lo.textContent=`${fmt1(b.min)} cm`;if(hi)hi.textContent=`${fmt1(b.max)} cm`;
  updateLive();
}

function showRecord(id,{source=null,animate=true}={}){
  const r=recordsById.get(id);if(!r)return false;
  openRecord=r;specimenState=defaultState(r);
  if(source){sourceCard=source;sourceFocus=source;}
  modal.innerHTML=modalHTML(r);
  layer.hidden=false;document.body.classList.add('fish-highlight-open');sourceCard?.classList.add('is-highlight-source');
  modal.querySelector('[data-highlight-scroll]')?.scrollTo(0,0);
  if(animate)animateIn(source);
  requestAnimationFrame(()=>{updateLive();modal.focus({preventScroll:true});});
  return true;
}

async function closeModal(){
  if(layer.hidden||closing)return;closing=true;
  if(!reduced()){
    const target=(sourceCard&&document.contains(sourceCard)?sourceCard:cardFor(openRecord?.id))?.getBoundingClientRect(),from=modal.getBoundingClientRect();
    const end=target?{opacity:.2,transform:`translate(${target.left-from.left}px,${target.top-from.top}px) scale(${clamp(target.width/from.width,.18,.95)},${clamp(target.height/from.height,.12,.95)})`}:{opacity:0,transform:'translateY(12px) scale(.985)'};
    await Promise.allSettled([modal.animate([{opacity:1,transform:'none'},end],{duration:240,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'}).finished,backdrop.animate([{opacity:1},{opacity:0}],{duration:190,fill:'both'}).finished]);
  }
  sourceCard?.classList.remove('is-highlight-source');layer.hidden=true;modal.innerHTML='';document.body.classList.remove('fish-highlight-open');
  const focus=sourceFocus;openRecord=null;specimenState=null;sourceCard=null;sourceFocus=null;closing=false;if(focus&&document.contains(focus))focus.focus({preventScroll:true});
}

results.addEventListener('click',e=>{
  const card=e.target.closest('.fish-card[data-id],.fish-row[data-id]');if(!card)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(!ready){pendingOpen={id:card.dataset.id,source:card};return;}
  showRecord(card.dataset.id,{source:card,animate:true});
},true);

results.addEventListener('pointermove',e=>{
  const card=e.target.closest('.fish-card');if(!card)return;const r=card.getBoundingClientRect();card.style.setProperty('--spot-x',`${e.clientX-r.left}px`);card.style.setProperty('--spot-y',`${e.clientY-r.top}px`);
});

layer.addEventListener('click',e=>{
  if(e.target.closest('[data-highlight-close]'))return void closeModal();
  const body=e.target.closest('[data-body]');if(body)return void setBody(body.dataset.body);
  const rel=e.target.closest('[data-highlight-fish]');if(rel)return void showRecord(rel.dataset.highlightFish,{animate:false});
  if(e.target.closest('[data-highlight-prev]')){const id=adjacentId(-1);if(id)showRecord(id,{animate:false});return;}
  if(e.target.closest('[data-highlight-next]')){const id=adjacentId(1);if(id)showRecord(id,{animate:false});}
});

layer.addEventListener('input',e=>{
  if(!specimenState)return;
  if(e.target.matches('[data-live-percentile-input]')){specimenState.percentile=specimenState.condition==='perfect_specimen'?Math.max(95,Number(e.target.value)):Number(e.target.value);updateLive();}
  else if(e.target.matches('[data-live-length-input]')){specimenState.length=Number(e.target.value);updateLive();}
  else if(e.target.matches('[data-live-condition]')){specimenState.condition=e.target.value;updateLive();}
});
layer.addEventListener('change',e=>{if(specimenState&&e.target.matches('[data-live-condition]')){specimenState.condition=e.target.value;updateLive();}});
window.addEventListener('resize',()=>{if(!layer.hidden)updatePhysicalScale();});
document.addEventListener('keydown',e=>{if(!layer.hidden&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeModal();}},true);

async function loadGzip(path){
  const res=await fetch(path);if(!res.ok)throw new Error(`${path}: HTTP ${res.status}`);
  if(!('DecompressionStream' in window))throw new Error('gzip decompression unsupported');
  return JSON.parse(await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).text());
}

Promise.all([
  loadGzip('../assets/fish-wiki-data-0.json.gz'),
  loadGzip('../assets/fish-wiki-data-1.json.gz'),
  fetch('../assets/fish-render-manifest.json').then(r=>{if(!r.ok)throw new Error(`manifest: HTTP ${r.status}`);return r.json();})
]).then(([a,b,manifest])=>{
  records=[...(a.records||[]),...(b.records||[])];recordsById=new Map(records.map(r=>[r.id,r]));runtimeRenders=manifest?.fish||{};ready=true;
  if(legacyArticle&&!legacyArticle.hidden){legacyArticle.hidden=true;legacyArticle.innerHTML='';catalog.hidden=false;}
  if(pendingOpen){const p=pendingOpen;pendingOpen=null;showRecord(p.id,{source:p.source,animate:true});}
}).catch(err=>{console.error('Specimen lab failed to load',err);ready=true;pendingOpen=null;});
})();