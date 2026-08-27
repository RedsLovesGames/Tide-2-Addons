(()=>{
'use strict';

const results=document.getElementById('fish-results');
const legacyArticle=document.getElementById('fish-article');
const catalog=document.getElementById('catalog-view');
if(!results||!catalog)return;

const conditionBonus={normal:0,parasite_ridden:15,scarred:25,albino:175,iridescent:325,perfect_specimen:350};
const conditionLabels={normal:'Normal',parasite_ridden:'Parasite-Ridden',scarred:'Scarred',albino:'Albino',iridescent:'Iridescent',perfect_specimen:'Perfect Specimen'};
const bodyLabels={dwarf:'Dwarf',normal:'Normal',giant:'Giant'};
const title=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const fmt=n=>(n===null||n===undefined||n===''||!Number.isFinite(Number(n)))?'n/a':Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
const fmt1=n=>(n===null||n===undefined||n===''||!Number.isFinite(Number(n)))?'n/a':Number(n).toLocaleString(undefined,{maximumFractionDigits:1});
const stars=n=>'★'.repeat(Math.max(1,Math.min(5,Number(n)||1)));
const slug=id=>String(id||'').replace(':','__');
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

let records=[];
let recordsById=new Map();
let runtimeRenders={};
let ready=false;
let pendingOpen=null;
let openRecord=null;
let sourceCard=null;
let sourceFocus=null;
let openingAnimation=null;
let closing=false;
let specimenState=null;

function scoreBreakdown(r,percentile=100,condition='normal',body='normal',length=Number(r.recordHigh)||0){
  const record=Number(r.recordHigh)||0;
  const p=clamp(Number(percentile)||0,0,100);
  const st=Math.max(1,Number(r.stars)||1);
  const percentilePoints=p*5;
  const rarity=(st-1)*62.5;
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
  return {percentilePoints,rarity,recordBonus,physical,bodyBonus,conditionPoints,multiplier,total:subtotal*multiplier};
}

function score(r,percentile=100,condition='normal',body='normal',length=Number(r.recordHigh)||0){
  return scoreBreakdown(r,percentile,condition,body,length).total;
}

function sizeEnvelope(r){
  const lo=Number(r.typicalLow),record=Number(r.recordHigh),typicalHigh=Number(r.typicalHigh);
  return {
    normalLow:Number.isFinite(lo)?lo:null,
    typicalHigh:Number.isFinite(typicalHigh)?typicalHigh:null,
    normalHigh:Number.isFinite(record)?record:(Number.isFinite(typicalHigh)?typicalHigh:null),
    dwarfLow:Number.isFinite(lo)?lo*.55:null,
    traitLow:Number.isFinite(lo)?lo*.55*.90:null,
    giantHigh:Number.isFinite(record)?record*1.30:null
  };
}

function variantFor(id,condition='normal'){
  const variants=runtimeRenders?.[id]?.variants||{};
  const aliases=condition==='parasite_ridden'?['parasite_ridden','parasite-ridden','parasite']:condition==='perfect_specimen'?['perfect_specimen','perfect-specimen','perfect']: [condition];
  for(const key of aliases){
    const v=variants[key];
    if(v?.file&&v.status!=='unavailable')return {key,file:`../${String(v.file).replace(/^\.\//,'').replace(/^\//,'')}`,exact:key!=='normal'};
  }
  const normal=variants.normal;
  if(normal?.file&&normal.status!=='unavailable')return {key:'normal',file:`../${String(normal.file).replace(/^\.\//,'').replace(/^\//,'')}`,exact:condition==='normal'};
  return null;
}

function formatCondition(c){
  const entries=Object.entries(c||{}).filter(([k])=>k!=='type');
  if(!entries.length)return'Enabled';
  return entries.map(([k,v])=>{
    const val=Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):String(v);
    return `${title(k)}: ${val}`;
  }).join(' · ');
}

function fact(label,value,extra=''){
  return `<div class="fish-lab-fact ${extra}"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function relatedFor(r){
  const same=records.filter(x=>x.id!==r.id&&(x.group===r.group||x.modKey===r.modKey));
  return same.sort((a,b)=>a.name.localeCompare(b.name)).slice(0,6);
}

function bodyBounds(r,body){
  const env=sizeEnvelope(r);
  let min=env.normalLow??1,max=env.normalHigh??min;
  if(body==='dwarf'){
    min=env.dwarfLow??min*.55;
    max=env.normalLow??max;
  }else if(body==='giant'){
    min=env.normalHigh??max;
    max=env.giantHigh??min*1.3;
  }
  if(!(max>min))max=min+Math.max(1,min*.1);
  return {min,max};
}

function defaultState(r){
  const lo=Number(r.typicalLow),hi=Number(r.typicalHigh),record=Number(r.recordHigh);
  const length=Number.isFinite(hi)?hi:Number.isFinite(lo)&&Number.isFinite(record)?(lo+record)/2:Number.isFinite(record)?record:1;
  return {body:'normal',condition:'normal',percentile:50,length};
}

function referenceScores(r){
  const record=Number(r.recordHigh)||0;
  const giantLength=record*1.3;
  return [
    ['Normal',score(r,100,'normal','normal',record)],
    ['Giant',score(r,100,'normal','giant',giantLength)],
    ['Iridescent',score(r,100,'iridescent','normal',record)],
    ['Perfect',score(r,100,'perfect_specimen','normal',record)],
    ['Giant + Perfect',score(r,100,'perfect_specimen','giant',giantLength)]
  ];
}

function modalHTML(r){
  const env=sizeEnvelope(r);
  const related=relatedFor(r);
  const conditions=Array.isArray(r.conditions)?r.conditions:[];
  const location=r.location||r.locationKey||'Unknown habitat';
  const rarity=title(r.rarity||'');
  const group=title(r.group||'');
  const mod=r.mod||r.namespace||'Fish';
  specimenState=defaultState(r);
  const initialVariant=variantFor(r.id,'normal');
  const preview=initialVariant
    ? `<img data-live-render-img src="${esc(initialVariant.file)}" alt="${esc(r.name)} source-authentic render" decoding="async">`
    : `<div class="fish-lab-render-missing">No source-backed render available</div>`;
  const bounds=bodyBounds(r,'normal');
  specimenState.length=clamp(specimenState.length,bounds.min,bounds.max);
  const live=scoreBreakdown(r,specimenState.percentile,specimenState.condition,specimenState.body,specimenState.length);
  const refs=referenceScores(r);
  const maxRef=Math.max(...refs.map(x=>x[1]),1);
  const fishScoreMin=score(r,0,'normal','normal',env.normalLow||0);
  const fishScoreMax=refs[4][1];

  return `
    <div class="fish-highlight-topbar">
      <button class="fish-highlight-nav-btn" type="button" data-highlight-prev aria-label="Previous fish">←</button>
      <div class="fish-highlight-nav-label"><span>Specimen lab</span><strong>${esc(r.name)}</strong></div>
      <button class="fish-highlight-nav-btn" type="button" data-highlight-next aria-label="Next fish">→</button>
      <button class="fish-highlight-close" type="button" data-highlight-close aria-label="Close fish details">×</button>
    </div>
    <div class="fish-highlight-scroll" data-highlight-scroll>
      <section class="fish-lab-workspace">
        <div class="fish-lab-specimen-card">
          <div class="fish-lab-heading">
            <div>
              <p class="fish-highlight-eyebrow">${esc(mod)} · ${esc(rarity)}</p>
              <h1 class="fish-highlight-title">${esc(r.name)}</h1>
            </div>
            <span class="fish-lab-star-pill">${stars(r.stars)}</span>
          </div>
          <div class="fish-highlight-subline">
            <span class="fish-highlight-chip">${esc(group)}</span>
            <span class="fish-highlight-chip">${esc(location)}</span>
            <span class="fish-highlight-chip">${esc(slug(r.id))}</span>
          </div>
          <div class="fish-lab-render-stage" data-live-render-stage>
            <div class="fish-lab-orbit"></div>
            <div class="fish-lab-render-shell" data-live-render-shell>${preview}</div>
            <div class="fish-lab-render-meta">
              <span data-live-render-note>${initialVariant?'Source-authentic normal render':'Render unavailable'}</span>
              <strong data-live-scale>1.00× display scale</strong>
            </div>
          </div>
        </div>

        <aside class="fish-lab-console">
          <div class="fish-lab-score-head">
            <div><span>Live FishScore</span><strong data-live-score>${fmt1(live.total)}</strong></div>
            <span class="fish-lab-live-dot">LIVE</span>
          </div>

          <div class="fish-lab-control-group">
            <label>Body type</label>
            <div class="fish-lab-segmented" role="group" aria-label="Body type">
              ${Object.entries(bodyLabels).map(([key,label])=>`<button type="button" data-body="${key}" class="${key==='normal'?'active':''}">${label}</button>`).join('')}
            </div>
          </div>

          <div class="fish-lab-control-group">
            <label for="fish-lab-condition">Condition</label>
            <select id="fish-lab-condition" data-live-condition>
              ${Object.entries(conditionLabels).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}
            </select>
          </div>

          <div class="fish-lab-control-group slider-group">
            <div class="fish-lab-control-label"><label for="fish-lab-percentile">Percentile</label><output data-live-percentile>${specimenState.percentile}%</output></div>
            <input id="fish-lab-percentile" data-live-percentile-input type="range" min="0" max="100" step="1" value="${specimenState.percentile}">
            <div class="fish-lab-range-labels"><span>0th</span><span>100th</span></div>
          </div>

          <div class="fish-lab-control-group slider-group">
            <div class="fish-lab-control-label"><label for="fish-lab-length">Length</label><output data-live-length>${fmt1(specimenState.length)} cm</output></div>
            <input id="fish-lab-length" data-live-length-input type="range" min="${bounds.min}" max="${bounds.max}" step="0.1" value="${specimenState.length}">
            <div class="fish-lab-range-labels"><span data-live-length-min>${fmt1(bounds.min)} cm</span><span data-live-length-max>${fmt1(bounds.max)} cm</span></div>
          </div>

          <div class="fish-lab-breakdown" aria-label="Live FishScore breakdown">
            ${fact('Percentile',fmt1(live.percentilePoints),'accent')}
            ${fact('Rarity',fmt1(live.rarity))}
            ${fact('Record bonus',fmt1(live.recordBonus))}
            ${fact('Length bonus',fmt1(live.physical))}
            ${fact('Body bonus',fmt1(live.bodyBonus))}
            ${fact('Condition',fmt1(live.conditionPoints))}
          </div>
          <div class="fish-lab-multiplier" data-live-multiplier hidden>Perfect Specimen final multiplier <strong>×1.20</strong></div>
        </aside>
      </section>

      <section class="fish-lab-summary-grid">
        <article class="fish-lab-panel">
          <div class="fish-lab-panel-head"><h2>Species stats</h2><span>source FishData</span></div>
          <div class="fish-lab-facts compact">
            ${fact('Size · no traits',`${fmt(env.normalLow)} → ${fmt(env.normalHigh)} cm`)}
            ${fact('Size · with traits',`${fmt(env.traitLow)} → ${fmt(env.giantHigh)} cm`)}
            ${fact('FishScore range',`${fmt1(fishScoreMin)} → ${fmt1(fishScoreMax)}`,'accent')}
            ${fact('Strength',fmt(r.strength))}
            ${fact('Speed',fmt(r.speed))}
            ${fact('Selection weight',fmt(r.weight))}
            ${fact('Bucket',r.bucket||'n/a','wide')}
          </div>
        </article>

        <article class="fish-lab-panel">
          <div class="fish-lab-panel-head"><h2>Catch conditions</h2><span>${conditions.length} rules</span></div>
          <div class="fish-lab-condition-list compact">
            ${conditions.length?conditions.map(c=>`<div class="fish-lab-condition"><strong>${esc(c.type||'condition')}</strong><span>${esc(formatCondition(c))}</span></div>`).join(''):'<div class="fish-lab-empty">No explicit catch-condition records.</div>'}
          </div>
        </article>
      </section>

      <details class="fish-lab-accordion">
        <summary><span>Reference ceilings & provenance</span><i>+</i></summary>
        <div class="fish-lab-accordion-body two">
          <div>
            <h3>FishScore reference ceilings</h3>
            <div class="fish-lab-reference-bars">
              ${refs.map(([label,value])=>`<div><span>${esc(label)}</span><i><b style="width:${clamp(value/maxRef*100,2,100)}%"></b></i><strong>${fmt1(value)}</strong></div>`).join('')}
            </div>
          </div>
          <div>
            <h3>Provenance</h3>
            <dl class="fish-lab-provenance">
              <dt>FishData</dt><dd>${esc(r.sourceJar||'unknown')} · ${esc(r.sourcePath||'unknown')}</dd>
              <dt>Entity</dt><dd>${esc(r.entity||r.id||'unknown')}</dd>
              <dt>DisplayData</dt><dd>${esc(JSON.stringify(r.displayData||{}))}</dd>
              <dt>Render</dt><dd>${initialVariant?'Source-authentic published render':'Source render unavailable'}</dd>
              <dt>Associated mods</dt><dd>${esc((r.associatedMods||[]).join(', ')||'none')}</dd>
            </dl>
          </div>
        </div>
      </details>

      <details class="fish-lab-accordion">
        <summary><span>Related fish</span><i>+</i></summary>
        <div class="fish-lab-related">
          ${related.map(x=>`<button type="button" data-highlight-fish="${esc(x.id)}"><strong>${esc(x.name)}</strong><span>${esc(x.mod||x.namespace||'Fish')} · ${esc(title(x.group||''))}</span></button>`).join('')||'<p>No related fish in this catalog.</p>'}
        </div>
      </details>
    </div>`;
}

const layer=document.createElement('div');
layer.id='fish-highlight-layer';
layer.hidden=true;
layer.innerHTML='<button class="fish-highlight-backdrop" type="button" data-highlight-close aria-label="Close fish details"></button><section class="fish-highlight-modal" role="dialog" aria-modal="true" aria-label="Fish details" tabindex="-1"></section>';
document.body.append(layer);
const modal=layer.querySelector('.fish-highlight-modal');
const backdrop=layer.querySelector('.fish-highlight-backdrop');

function orderedRecords(){
  const scope=window.TideFishModpackScope?.allowedIds;
  const visible=scope?records.filter(r=>scope.has(r.id)):records;
  return visible.slice().sort((a,b)=>a.name.localeCompare(b.name));
}

function adjacentId(direction){
  const list=orderedRecords();
  const i=list.findIndex(r=>r.id===openRecord?.id);
  if(i<0||!list.length)return null;
  return list[(i+direction+list.length)%list.length]?.id||null;
}

function setCardSpot(card,e){
  const rect=card.getBoundingClientRect();
  card.style.setProperty('--spot-x',`${e.clientX-rect.left}px`);
  card.style.setProperty('--spot-y',`${e.clientY-rect.top}px`);
}

results.addEventListener('pointermove',e=>{
  const card=e.target.closest('.fish-card');
  if(card)setCardSpot(card,e);
});

modal.addEventListener('pointermove',e=>{
  const rect=modal.getBoundingClientRect();
  modal.style.setProperty('--modal-spot-x',`${e.clientX-rect.left}px`);
  modal.style.setProperty('--modal-spot-y',`${e.clientY-rect.top}px`);
});

function cardFor(id){
  return [...results.querySelectorAll('.fish-card[data-id]')].find(c=>c.dataset.id===id)||null;
}

function animateIn(fromCard){
  if(reduced())return;
  const target=modal.getBoundingClientRect();
  const from=(fromCard||sourceCard)?.getBoundingClientRect();
  const keyframes=from?[
    {opacity:.28,transform:`translate(${from.left-target.left}px,${from.top-target.top}px) scale(${clamp(from.width/target.width,.18,.92)},${clamp(from.height/target.height,.12,.92)})`,borderRadius:'14px'},
    {opacity:1,transform:'translate(0,0) scale(1,1)',borderRadius:'18px'}
  ]:[{opacity:0,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'none'}];
  openingAnimation=modal.animate(keyframes,{duration:360,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
  backdrop.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out',fill:'both'});
  openingAnimation.finished.catch(()=>{}).finally(()=>{openingAnimation=null;modal.style.opacity='1';modal.style.transform='none'});
}

function renderScaleFor(r,state){
  const bounds=bodyBounds(r,state.body);
  const t=clamp((state.length-bounds.min)/(bounds.max-bounds.min||1),0,1);
  const base=state.body==='dwarf'?.74:state.body==='giant'?1.17:1;
  return clamp(base*(.94+.12*t),.62,1.30);
}

function updateSpecimenLive(){
  if(!openRecord||!specimenState)return;
  const r=openRecord,state=specimenState;
  const breakdown=scoreBreakdown(r,state.percentile,state.condition,state.body,state.length);
  const scale=renderScaleFor(r,state);
  const variant=variantFor(r.id,state.condition);

  const scoreEl=modal.querySelector('[data-live-score]');
  if(scoreEl)scoreEl.textContent=fmt1(breakdown.total);
  const pctOut=modal.querySelector('[data-live-percentile]');
  if(pctOut)pctOut.textContent=`${Math.round(state.percentile)}%`;
  const lenOut=modal.querySelector('[data-live-length]');
  if(lenOut)lenOut.textContent=`${fmt1(state.length)} cm`;
  const scaleOut=modal.querySelector('[data-live-scale]');
  if(scaleOut)scaleOut.textContent=`${scale.toFixed(2)}× display scale`;

  const img=modal.querySelector('[data-live-render-img]');
  if(img){
    if(variant&&img.getAttribute('src')!==variant.file)img.setAttribute('src',variant.file);
    img.style.setProperty('--specimen-scale',String(scale));
    img.style.transform=`scale(${scale})`;
  }
  const note=modal.querySelector('[data-live-render-note]');
  if(note){
    if(!variant)note.textContent='Render unavailable';
    else if(state.condition==='normal')note.textContent='Source-authentic normal render';
    else if(variant.exact)note.textContent=`Source-authentic ${conditionLabels[state.condition]} variant render`;
    else note.textContent=`Normal source render · ${conditionLabels[state.condition]} affects score only`;
  }

  const values=[breakdown.percentilePoints,breakdown.rarity,breakdown.recordBonus,breakdown.physical,breakdown.bodyBonus,breakdown.conditionPoints];
  modal.querySelectorAll('.fish-lab-breakdown .fish-lab-fact strong').forEach((el,i)=>{if(values[i]!==undefined)el.textContent=fmt1(values[i])});
  const mult=modal.querySelector('[data-live-multiplier]');
  if(mult)mult.hidden=breakdown.multiplier===1;

  modal.querySelectorAll('[data-body]').forEach(btn=>btn.classList.toggle('active',btn.dataset.body===state.body));
}

function setBody(body){
  if(!openRecord||!specimenState||!bodyLabels[body])return;
  specimenState.body=body;
  const bounds=bodyBounds(openRecord,body);
  specimenState.length=clamp(specimenState.length,bounds.min,bounds.max);
  const slider=modal.querySelector('[data-live-length-input]');
  if(slider){slider.min=bounds.min;slider.max=bounds.max;slider.value=specimenState.length}
  const min=modal.querySelector('[data-live-length-min]');if(min)min.textContent=`${fmt1(bounds.min)} cm`;
  const max=modal.querySelector('[data-live-length-max]');if(max)max.textContent=`${fmt1(bounds.max)} cm`;
  updateSpecimenLive();
}

function showRecord(id,{source=null,animate=true}={}){
  const r=recordsById.get(id);
  if(!r)return false;
  openRecord=r;
  if(source){sourceCard=source;sourceFocus=source}
  modal.innerHTML=modalHTML(r);
  layer.hidden=false;
  document.body.classList.add('fish-highlight-open');
  sourceCard?.classList.add('is-highlight-source');
  const scroll=modal.querySelector('[data-highlight-scroll]');
  if(scroll)scroll.scrollTop=0;
  if(animate)animateIn(source);
  else if(!reduced())modal.animate([{opacity:.78,transform:'scale(.992)'},{opacity:1,transform:'scale(1)'}],{duration:180,easing:'ease-out'});
  requestAnimationFrame(()=>{updateSpecimenLive();modal.focus({preventScroll:true})});
  return true;
}

async function closeModal(){
  if(layer.hidden||closing)return;
  closing=true;
  openingAnimation?.cancel();
  const target=(sourceCard&&document.contains(sourceCard)?sourceCard:cardFor(openRecord?.id))?.getBoundingClientRect();
  const from=modal.getBoundingClientRect();
  const animations=[];
  if(!reduced()){
    const end=target?{opacity:.2,transform:`translate(${target.left-from.left}px,${target.top-from.top}px) scale(${clamp(target.width/from.width,.18,.95)},${clamp(target.height/from.height,.12,.95)})`,borderRadius:'14px'}:{opacity:0,transform:'translateY(14px) scale(.985)'};
    animations.push(modal.animate([{opacity:1,transform:'none',borderRadius:'18px'},end],{duration:260,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'}));
    animations.push(backdrop.animate([{opacity:1},{opacity:0}],{duration:210,easing:'ease-in',fill:'both'}));
    await Promise.allSettled(animations.map(a=>a.finished));
  }
  sourceCard?.classList.remove('is-highlight-source');
  layer.hidden=true;
  modal.innerHTML='';
  document.body.classList.remove('fish-highlight-open');
  const focus=sourceFocus;
  sourceCard=null;sourceFocus=null;openRecord=null;specimenState=null;closing=false;
  if(focus&&document.contains(focus))focus.focus({preventScroll:true});
}

results.addEventListener('click',e=>{
  const card=e.target.closest('.fish-card[data-id],.fish-row[data-id]');
  if(!card)return;
  e.preventDefault();e.stopImmediatePropagation();
  const id=card.dataset.id;
  if(!ready){pendingOpen={id,source:card};return}
  showRecord(id,{source:card,animate:true});
},true);

layer.addEventListener('click',e=>{
  if(e.target.closest('[data-highlight-close]')){e.preventDefault();closeModal();return}
  const body=e.target.closest('[data-body]');
  if(body){e.preventDefault();setBody(body.dataset.body);return}
  const related=e.target.closest('[data-highlight-fish]');
  if(related){e.preventDefault();showRecord(related.dataset.highlightFish,{animate:false});return}
  if(e.target.closest('[data-highlight-prev]')){e.preventDefault();const id=adjacentId(-1);if(id)showRecord(id,{animate:false});return}
  if(e.target.closest('[data-highlight-next]')){e.preventDefault();const id=adjacentId(1);if(id)showRecord(id,{animate:false})}
});

layer.addEventListener('input',e=>{
  if(!openRecord||!specimenState)return;
  if(e.target.matches('[data-live-percentile-input]')){specimenState.percentile=Number(e.target.value);updateSpecimenLive();return}
  if(e.target.matches('[data-live-length-input]')){specimenState.length=Number(e.target.value);updateSpecimenLive();return}
  if(e.target.matches('[data-live-condition]')){specimenState.condition=e.target.value;updateSpecimenLive()}
});
layer.addEventListener('change',e=>{
  if(e.target.matches('[data-live-condition]')&&specimenState){specimenState.condition=e.target.value;updateSpecimenLive()}
});

document.addEventListener('keydown',e=>{
  if(layer.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeModal()}
},true);

async function loadGzip(path){
  const res=await fetch(path);
  if(!res.ok)throw new Error(`${path}: HTTP ${res.status}`);
  if(!('DecompressionStream'in window))throw new Error('gzip decompression unsupported');
  return JSON.parse(await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).text());
}

Promise.all([
  loadGzip('../assets/fish-wiki-data-0.json.gz'),
  loadGzip('../assets/fish-wiki-data-1.json.gz'),
  fetch('../assets/fish-render-manifest.json').then(r=>{if(!r.ok)throw new Error(`fish-render-manifest.json: HTTP ${r.status}`);return r.json()})
]).then(([a,b,manifest])=>{
  records=[...(a.records||[]),...(b.records||[])];
  recordsById=new Map(records.map(r=>[r.id,r]));
  runtimeRenders=manifest?.fish||{};
  ready=true;
  if(pendingOpen){const p=pendingOpen;pendingOpen=null;showRecord(p.id,{source:p.source,animate:true})}
  if(legacyArticle&&!legacyArticle.hidden){legacyArticle.hidden=true;legacyArticle.innerHTML='';catalog.hidden=false}
}).catch(err=>{
  console.error('Fish highlight modal failed to load data',err);
  ready=true;pendingOpen=null;
});
})();
