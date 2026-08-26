(()=>{
'use strict';
const article=document.getElementById('fish-article');
if(!article)return;
const slug=id=>String(id).replace(':','__');
const unslug=s=>String(s).replace('__',':');
const namespace=id=>{const s=String(id||'');const i=s.indexOf(':');return i<0?'minecraft':s.slice(0,i)};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
let ordered=[];
let allowedIds=new Set();
let allowedMods=new Set();

Promise.all([
  fetch('../assets/fish-search-index.json').then(r=>{if(!r.ok)throw new Error(`fish-search-index.json: HTTP ${r.status}`);return r.json()}),
  fetch('./render-data/modpack-scope.json').then(r=>{if(!r.ok)throw new Error(`modpack-scope.json: HTTP ${r.status}`);return r.json()})
])
  .then(([rows,scope])=>{
    allowedMods=new Set(scope.mod_ids||[]);
    if(scope.include_minecraft!==false)allowedMods.add('minecraft');
    ordered=rows.filter(r=>allowedMods.has(namespace(r.id))).sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
    allowedIds=new Set(ordered.map(r=>r.id));
    window.TideFishModpackScope={scope,allowedIds,allowedMods,records:ordered};
    document.body.dataset.fishScope='modpack';
    installScopeStyle();
    applyScope();
    mount();
  })
  .catch(err=>console.error('Fish modpack scope load failed',err));

function installScopeStyle(){
  if(document.getElementById('fish-modpack-scope-style'))return;
  const style=document.createElement('style');
  style.id='fish-modpack-scope-style';
  style.textContent='.condition-viewer{display:none!important}';
  document.head.append(style);
}

function currentId(){
  const hash=location.hash.slice(1);
  return hash?unslug(decodeURIComponent(hash)):null;
}

function applyScope(){
  if(!allowedIds.size)return;
  const results=document.getElementById('fish-results');
  if(results){
    for(const node of results.querySelectorAll('.fish-card,.fish-row')){
      const allowed=allowedIds.has(node.dataset.id);
      node.toggleAttribute('hidden',!allowed);
      node.setAttribute('aria-hidden',String(!allowed));
    }
    const visible=[...results.querySelectorAll('.fish-card,.fish-row')].filter(n=>!n.hidden);
    const count=document.getElementById('result-count');
    if(count)count.textContent=`${visible.length} fish`;
    const empty=document.getElementById('empty-state');
    if(empty)empty.hidden=visible.length>0;
  }

  const suggestions=document.getElementById('fish-suggestions');
  if(suggestions){
    for(const link of suggestions.querySelectorAll('a[href^="#"]')){
      const id=unslug(decodeURIComponent(link.getAttribute('href').slice(1)));
      link.toggleAttribute('hidden',!allowedIds.has(id));
    }
    if(![...suggestions.querySelectorAll('a[href^="#"]')].some(a=>!a.hidden))suggestions.hidden=true;
  }

  const modSelect=document.getElementById('filter-mod');
  if(modSelect){
    const names=new Set(ordered.map(r=>String(r.mod||'').trim()).filter(Boolean));
    for(const option of [...modSelect.options].slice(1)){
      if(!names.has(option.textContent.trim()))option.remove();
    }
  }

  const recordStat=document.getElementById('stat-records');
  if(recordStat)recordStat.textContent=ordered.length;
  const modStat=document.getElementById('stat-mods');
  if(modStat)modStat.textContent=new Set(ordered.map(r=>namespace(r.id))).size;
  const summary=document.getElementById('active-summary');
  if(summary&&summary.textContent==='All registered FishData')summary.textContent='Current modpack FishData only';

  const id=currentId();
  if(id&&!allowedIds.has(id)){
    const catalog=document.getElementById('catalog-view');
    article.hidden=true;
    if(catalog)catalog.hidden=false;
    history.replaceState(null,'',location.pathname+location.search);
  }

  article.querySelector('.condition-viewer')?.remove();
}

function mount(){
  if(!ordered.length||article.hidden||!article.querySelector('.article-actions'))return;
  const current=currentId();
  const idx=ordered.findIndex(r=>r.id===current);
  if(idx<0)return;

  const scopedNav=article.querySelector('.specimen-nav.modpack-scope-nav');
  article.querySelectorAll('.specimen-nav:not(.modpack-scope-nav)').forEach(n=>n.remove());
  if(scopedNav)return;

  const prev=ordered[(idx-1+ordered.length)%ordered.length];
  const next=ordered[(idx+1)%ordered.length];
  article.querySelector('.article-actions').insertAdjacentHTML(
    'afterend',
    `<nav class="specimen-nav modpack-scope-nav" aria-label="Fish navigation"><a href="#${esc(slug(prev.id))}" aria-label="Previous fish: ${esc(prev.name)}">← ${esc(prev.name)}</a><span>${idx+1} / ${ordered.length}</span><a href="#${esc(slug(next.id))}" aria-label="Next fish: ${esc(next.name)}">${esc(next.name)} →</a></nav>`
  );
}

const results=document.getElementById('fish-results');
if(results)new MutationObserver(()=>requestAnimationFrame(()=>{applyScope();mount()})).observe(results,{childList:true});
const suggestions=document.getElementById('fish-suggestions');
if(suggestions)new MutationObserver(()=>requestAnimationFrame(applyScope)).observe(suggestions,{childList:true,subtree:true});
new MutationObserver(()=>requestAnimationFrame(()=>{applyScope();mount()})).observe(article,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
for(const id of ['filter-group','filter-mod','filter-rarity','filter-stars','filter-habitat','filter-preview','sort-fish','fish-search']){
  document.getElementById(id)?.addEventListener(id==='fish-search'?'input':'change',()=>setTimeout(applyScope,0));
}
window.addEventListener('hashchange',()=>setTimeout(()=>{applyScope();mount()},0));
setTimeout(()=>{applyScope();mount()},250);
})();

