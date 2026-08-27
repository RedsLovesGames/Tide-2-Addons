(()=>{
'use strict';

const results=document.getElementById('fish-results');
const legacyArticle=document.getElementById('fish-article');
const catalog=document.getElementById('catalog-view');
if(!results||!catalog)return;

const conditionBonus={parasite:15,parasite_ridden:15,scarred:25,albino:175,iridescent:325,perfect_specimen:350};
const title=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const fmt=n=>(n===null||n===undefined||n===''||!Number.isFinite(Number(n)))?'n/a':Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
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

function score(r,percentile=100,condition='normal',body='normal',length=Number(r.recordHigh)||0){
  const record=Number(r.recordHigh)||0;
  const p=clamp(Number(percentile)||0,0,100);
  const st=Math.max(1,Number(r.stars)||1);
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
  let total=p*5+rarity+(conditionBonus[condition]||0)+recordBonus+physical+bodyBonus;
  if(condition==='perfect_specimen')total*=1.2;
  return total;
}

function sizeEnvelope(r){
  const lo=Number(r.typicalLow),record=Number(r.recordHigh);
  return {
    normalLow:Number.isFinite(lo)?lo:null,
    normalHigh:Number.isFinite(record)?record:(Number.isFinite(Number(r.typicalHigh))?Number(r.typicalHigh):null),
    traitLow:Number.isFinite(lo)?lo*.55*.90:null,
    giantHigh:Number.isFinite(record)?record*1.30:null
  };
}

function runtimeFile(id){
  const v=runtimeRenders?.[id]?.variants?.normal;
  if(!v?.file||v.status==='unavailable')return null;
  return `../${String(v.file).replace(/^\.\//,'').replace(/^\//,'')}`;
}

function formatCondition(c){
  const entries=Object.entries(c||{}).filter(([k])=>k!=='type');
  if(!entries.length)return'Enabled';
  return entries.map(([k,v])=>{
    const val=Array.isArray(v)?v.join(', '):typeof v==='object'?JSON.stringify(v):String(v);
    return `${title(k)}: ${val}`;
  }).join(' · ');
}

function fact(label,value){
  return `<div class="fish-highlight-fact"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function scoreBar(label,value,max){
  const width=max>0?clamp(value/max*100,2,100):2;
  return `<div class="fish-highlight-score"><span>${esc(label)}</span><div><i style="width:${width}%"></i></div><b>${fmt(value)}</b></div>`;
}

function relatedFor(r){
  const same=records.filter(x=>x.id!==r.id&&(x.group===r.group||x.modKey===r.modKey));
  return same.sort((a,b)=>a.name.localeCompare(b.name)).slice(0,6);
}

function modalHTML(r){
  const env=sizeEnvelope(r);
  const record=Number(r.recordHigh)||0;
  const absoluteLength=record*1.3;
  const normal=score(r,100,'normal','normal',record);
  const giant=score(r,100,'normal','giant',absoluteLength);
  const iri=score(r,100,'iridescent','normal',record);
  const perfect=score(r,100,'perfect_specimen','normal',record);
  const absolute=score(r,100,'perfect_specimen','giant',absoluteLength);
  const image=runtimeFile(r.id);
  const related=relatedFor(r);
  const conditions=Array.isArray(r.conditions)?r.conditions:[];
  const location=r.location||r.locationKey||'Unknown habitat';
  const rarity=title(r.rarity||'');
  const group=title(r.group||'');
  const mod=r.mod||r.namespace||'Fish';
  const preview=image
    ? `<img src="${esc(image)}" alt="${esc(r.name)} source-authentic render" decoding="async">`
    : `<div class="fish-highlight-render-missing">No source-backed render available</div>`;

  return `
    <div class="fish-highlight-topbar">
      <button class="fish-highlight-nav-btn" type="button" data-highlight-prev aria-label="Previous fish">←</button>
      <div class="fish-highlight-nav-label"><span>Fish detail</span><strong>${esc(r.name)}</strong></div>
      <button class="fish-highlight-nav-btn" type="button" data-highlight-next aria-label="Next fish">→</button>
      <button class="fish-highlight-close" type="button" data-highlight-close aria-label="Close fish details">×</button>
    </div>
    <div class="fish-highlight-scroll" data-highlight-scroll>
      <header class="fish-highlight-hero">
        <div>
          <p class="fish-highlight-eyebrow">${esc(mod)} · ${esc(rarity)}</p>
          <h1 class="fish-highlight-title">${esc(r.name)}</h1>
          <div class="fish-highlight-subline">
            <span class="fish-highlight-chip stars">${stars(r.stars)} ${esc(rarity)}</span>
            <span class="fish-highlight-chip">${esc(group)}</span>
            <span class="fish-highlight-chip">${esc(location)}</span>
            <span class="fish-highlight-chip">${esc(slug(r.id))}</span>
          </div>
        </div>
        <div class="fish-highlight-render">${preview}</div>
      </header>

      <section class="fish-highlight-section fish-highlight-two">
        <div>
          <h2>Size envelope</h2>
          <div class="fish-highlight-facts">
            ${fact('Typical low',`${fmt(r.typicalLow)} cm`)}
            ${fact('Typical high',`${fmt(r.typicalHigh)} cm`)}
            ${fact('FishData record high',`${fmt(r.recordHigh)} cm`)}
            ${fact('Default lower envelope',`${fmt(env.traitLow)} cm`)}
            ${fact('Default Giant ceiling',`${fmt(env.giantHigh)} cm`)}
            ${fact('No-traits range',`${fmt(env.normalLow)} → ${fmt(env.normalHigh)} cm`)}
          </div>
          <p class="fish-highlight-method">Lower envelope uses typical-low × minimum Dwarf (0.55) × minimum Parasite-Ridden (0.90). Giant ceiling uses record-high × maximum Giant (1.30).</p>
        </div>
        <div>
          <h2>FishScore ceiling</h2>
          <div class="fish-highlight-score-list">
            ${scoreBar('Normal',normal,absolute)}
            ${scoreBar('Giant',giant,absolute)}
            ${scoreBar('Iridescent',iri,absolute)}
            ${scoreBar('Perfect Specimen',perfect,absolute)}
            ${scoreBar('Giant + Perfect',absolute,absolute)}
          </div>
          <p class="fish-highlight-method">FishScore combines percentile, rarity, species record-high, physical length, Condition bonus, and Body Type bonus. Perfect Specimen multiplies the final total by 1.2.</p>
        </div>
      </section>

      <section class="fish-highlight-section fish-highlight-two">
        <div>
          <h2>Fishing characteristics</h2>
          <div class="fish-highlight-facts">
            ${fact('Strength',fmt(r.strength))}
            ${fact('Speed',fmt(r.speed))}
            ${fact('Selection weight',fmt(r.weight))}
            ${fact('Bucket item',r.bucket||'n/a')}
          </div>
        </div>
        <div>
          <h2>Tideborne context</h2>
          <p>Body Type and Condition are independent axes. A fish can combine Giant or Dwarf with a compatible Condition such as Iridescent, Albino, Scarred, Parasite-Ridden, or Perfect Specimen.</p>
          <div class="fish-highlight-facts">
            ${fact('FishScore min',fmt(score(r,0,'normal','normal',env.normalLow||0)))}
            ${fact('FishScore max',fmt(absolute))}
            ${fact('Size no traits',`${fmt(env.normalLow)} → ${fmt(env.normalHigh)} cm`)}
            ${fact('Size with traits',`${fmt(env.traitLow)} → ${fmt(env.giantHigh)} cm`)}
          </div>
        </div>
      </section>

      <section class="fish-highlight-section">
        <h2>Catch conditions</h2>
        <div class="fish-highlight-condition-list">
          ${conditions.length?conditions.map(c=>`<div class="fish-highlight-condition"><strong>${esc(c.type||'condition')}</strong><span>${esc(formatCondition(c))}</span></div>`).join(''):'<div class="fish-highlight-condition"><strong>None listed</strong><span>No explicit catch-condition records are present for this FishData entry.</span></div>'}
        </div>
      </section>

      <section class="fish-highlight-section fish-highlight-two">
        <div>
          <h2>Provenance</h2>
          <dl class="fish-highlight-provenance">
            <dt>FishData</dt><dd>${esc(r.sourceJar||'unknown')} · ${esc(r.sourcePath||'unknown')}</dd>
            <dt>Entity</dt><dd>${esc(r.entity||r.id||'unknown')}</dd>
            <dt>DisplayData</dt><dd>${esc(JSON.stringify(r.displayData||{}))}</dd>
            <dt>Render</dt><dd>${image?'Source-authentic published render':'Source render unavailable'}</dd>
            <dt>Associated mods</dt><dd>${esc((r.associatedMods||[]).join(', ')||'none')}</dd>
          </dl>
        </div>
        <div>
          <h2>Related fish</h2>
          <div class="fish-highlight-related">
            ${related.map(x=>`<button type="button" data-highlight-fish="${esc(x.id)}"><strong>${esc(x.name)}</strong><span>${esc(x.mod||x.namespace||'Fish')} · ${esc(title(x.group||''))}</span></button>`).join('')||'<p>No related fish in this catalog.</p>'}
          </div>
        </div>
      </section>
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

function showRecord(id,{source=null,animate=true}={}){
  const r=recordsById.get(id);
  if(!r)return false;
  openRecord=r;
  if(source){
    sourceCard=source;
    sourceFocus=source;
  }
  modal.innerHTML=modalHTML(r);
  layer.hidden=false;
  document.body.classList.add('fish-highlight-open');
  sourceCard?.classList.add('is-highlight-source');
  const scroll=modal.querySelector('[data-highlight-scroll]');
  if(scroll)scroll.scrollTop=0;
  if(animate)animateIn(source);
  else if(!reduced())modal.animate([{opacity:.78,transform:'scale(.992)'},{opacity:1,transform:'scale(1)'}],{duration:180,easing:'ease-out'});
  requestAnimationFrame(()=>modal.focus({preventScroll:true}));
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
    const end=target?{
      opacity:.2,
      transform:`translate(${target.left-from.left}px,${target.top-from.top}px) scale(${clamp(target.width/from.width,.18,.95)},${clamp(target.height/from.height,.12,.95)})`,
      borderRadius:'14px'
    }:{opacity:0,transform:'translateY(14px) scale(.985)'};
    animations.push(modal.animate([{opacity:1,transform:'none',borderRadius:'18px'},end],{duration:260,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'}));
    animations.push(backdrop.animate([{opacity:1},{opacity:0}],{duration:210,easing:'ease-in',fill:'both'}));
    await Promise.allSettled(animations.map(a=>a.finished));
  }
  sourceCard?.classList.remove('is-highlight-source');
  layer.hidden=true;
  modal.innerHTML='';
  document.body.classList.remove('fish-highlight-open');
  const focus=sourceFocus;
  sourceCard=null;
  sourceFocus=null;
  openRecord=null;
  closing=false;
  if(focus&&document.contains(focus))focus.focus({preventScroll:true});
}

/* Capture card clicks before legacy Fish Wiki handlers can replace the page. */
results.addEventListener('click',e=>{
  const card=e.target.closest('.fish-card[data-id],.fish-row[data-id]');
  if(!card)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const id=card.dataset.id;
  if(!ready){pendingOpen={id,source:card};return}
  showRecord(id,{source:card,animate:true});
},true);

layer.addEventListener('click',e=>{
  if(e.target.closest('[data-highlight-close]')){
    e.preventDefault();
    closeModal();
    return;
  }
  const related=e.target.closest('[data-highlight-fish]');
  if(related){
    e.preventDefault();
    showRecord(related.dataset.highlightFish,{animate:false});
    return;
  }
  if(e.target.closest('[data-highlight-prev]')){
    e.preventDefault();
    const id=adjacentId(-1);if(id)showRecord(id,{animate:false});
    return;
  }
  if(e.target.closest('[data-highlight-next]')){
    e.preventDefault();
    const id=adjacentId(1);if(id)showRecord(id,{animate:false});
  }
});

document.addEventListener('keydown',e=>{
  if(layer.hidden)return;
  if(e.key==='Escape'){
    e.preventDefault();
    e.stopImmediatePropagation();
    closeModal();
  }
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
  if(pendingOpen){
    const p=pendingOpen;pendingOpen=null;showRecord(p.id,{source:p.source,animate:true});
  }

  /* Clean up any legacy detail that might have been opened before this controller loaded. */
  if(legacyArticle&&!legacyArticle.hidden){
    legacyArticle.hidden=true;
    legacyArticle.innerHTML='';
    catalog.hidden=false;
  }
}).catch(err=>{
  console.error('Fish highlight modal failed to load data',err);
  ready=true;
  pendingOpen=null;
});
})();
