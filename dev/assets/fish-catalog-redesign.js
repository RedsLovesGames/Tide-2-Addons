(()=>{
'use strict';

const VERSION='catalog-v3';
const conditionBonus={parasite:15,parasite_ridden:15,scarred:25,albino:175,iridescent:325,perfect_specimen:350};
let recordsById=new Map();

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const title=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const fmt=v=>{const n=num(v);if(n===null)return'n/a';return Math.abs(n-Math.round(n))<.05?Math.round(n).toLocaleString():n.toLocaleString(undefined,{maximumFractionDigits:1})};
const stars=n=>'★'.repeat(Math.max(1,Math.min(5,Number(n)||1)));

function score(r,percentile=100,condition='normal',body='normal',length=Number(r.recordHigh)||0){
  const record=Number(r.recordHigh)||0;
  const p=Math.max(0,Math.min(100,Number(percentile)||0));
  const st=Math.max(1,Number(r.stars)||1);
  const rarity=(st-1)*62.5;
  const recordBonus=record>0?Math.min(300,75*Math.sqrt(record/100)):0;
  const physical=length>0?Math.min(150,15*(length/100)):0;
  let bodyBonus=0;
  if(body==='giant'){
    const ratio=record>0?length/record:1;
    const sizeProgress=Math.max(0,Math.min(1,(ratio-1)/0.3));
    const percentileProgress=Math.max(0,Math.min(1,(p-97)/3));
    bodyBonus=80+140*sizeProgress+80*percentileProgress;
  }else if(body==='dwarf'){
    const lowProgress=Math.max(0,Math.min(1,(3-p)/3));
    bodyBonus=80+220*lowProgress;
  }
  let total=p*5+rarity+(conditionBonus[condition]||0)+recordBonus+physical+bodyBonus;
  if(condition==='perfect_specimen')total*=1.2;
  return total;
}

function ranges(r){
  const typicalLow=num(r.typicalLow);
  const typicalHigh=num(r.typicalHigh);
  const recordHigh=num(r.recordHigh);
  const baseMin=typicalLow;
  const baseMax=recordHigh??typicalHigh;
  const traitMin=typicalLow===null?null:typicalLow*.55*.90;
  const traitMax=recordHigh===null?baseMax:recordHigh*1.30;
  const scoreMin=score(r,0,'normal','normal',baseMin||0);
  const scoreMax=score(r,100,'perfect_specimen','giant',traitMax||baseMax||0);
  return {baseMin,baseMax,traitMin,traitMax,scoreMin,scoreMax};
}

async function loadGzipJson(path){
  const res=await fetch(path);
  if(!res.ok)throw new Error(`${path}: HTTP ${res.status}`);
  if(!('DecompressionStream' in window))throw new Error('gzip decompression unsupported');
  return JSON.parse(await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).text());
}

function moveSortIntoSidebar(){
  const sidebar=document.getElementById('fish-filters');
  const sort=document.querySelector('.sort-wrap');
  if(!sidebar||!sort||sort.parentElement===sidebar)return;
  const firstField=sidebar.querySelector('label');
  sidebar.insertBefore(sort,firstField||sidebar.querySelector('.wiki-links'));
}

function modernizeCard(card){
  if(card.dataset.catalogDesign===VERSION)return;
  const r=recordsById.get(card.dataset.id);
  if(!r)return;

  const oldWindow=card.querySelector('.specimen-window');
  const preview=oldWindow?oldWindow.innerHTML:'';
  const x=ranges(r);
  const starText=stars(r.stars);
  const rarity=title(r.rarity||'');

  card.dataset.catalogDesign=VERSION;
  card.innerHTML=`
    <div class="fish-card-visual">
      <div class="specimen-window">${preview}</div>
      <div class="catalog-stars" aria-label="${esc(r.stars||1)} star rarity" title="${esc(rarity)}">${starText}</div>
    </div>
    <div class="fish-card-content">
      <div class="fish-card-heading">
        <span class="fish-card-mod">${esc(r.mod||r.namespace||'Fish')}</span>
        <h2>${esc(r.name)}</h2>
      </div>
      <div class="fish-quick-stats">
        <div class="fish-quick-row fish-score-row">
          <span>FishScore</span>
          <strong><b>${fmt(x.scoreMin)}</b><i>→</i><b>${fmt(x.scoreMax)}</b></strong>
        </div>
        <div class="fish-quick-row">
          <span>Size <small>no traits</small></span>
          <strong><b>${fmt(x.baseMin)}</b><i>→</i><b>${fmt(x.baseMax)} cm</b></strong>
        </div>
        <div class="fish-quick-row fish-trait-row">
          <span>Size <small>with traits</small></span>
          <strong><b>${fmt(x.traitMin)}</b><i>→</i><b>${fmt(x.traitMax)} cm</b></strong>
        </div>
      </div>
    </div>`;
}

function modernizeCards(){
  document.querySelectorAll('#fish-results .fish-card').forEach(modernizeCard);
}

function install(){
  moveSortIntoSidebar();
  modernizeCards();
  document.body.dataset.fishCatalogDesign=VERSION;
}

Promise.all([
  loadGzipJson('../assets/fish-wiki-data-0.json.gz'),
  loadGzipJson('../assets/fish-wiki-data-1.json.gz')
]).then(([a,b])=>{
  recordsById=new Map([...(a.records||[]),...(b.records||[])].map(r=>[r.id,r]));
  install();
  const results=document.getElementById('fish-results');
  if(results)new MutationObserver(()=>requestAnimationFrame(modernizeCards)).observe(results,{childList:true});
  for(const id of ['filter-group','filter-mod','filter-rarity','filter-stars','filter-habitat','filter-preview','sort-fish','fish-search']){
    document.getElementById(id)?.addEventListener(id==='fish-search'?'input':'change',()=>requestAnimationFrame(modernizeCards));
  }
}).catch(err=>console.error('Fish catalog redesign data load failed',err));
})();
