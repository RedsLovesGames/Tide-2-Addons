(async()=>{
'use strict';
const BASE='../assets/';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const title=s=>String(s||'').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());
const slug=id=>String(id).replace(':','__');
const unslug=s=>String(s).replace('__',':');
async function loadGzip(name){const r=await fetch(BASE+name);if(!r.ok)throw new Error(`${name}: HTTP ${r.status}`);return JSON.parse(await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).text())}
let records=[],manifest={fish:{}};
try{
  const [a,b,m]=await Promise.all([loadGzip('fish-wiki-data-0.json.gz'),loadGzip('fish-wiki-data-1.json.gz'),fetch(BASE+'fish-render-manifest.json').then(r=>r.ok?r.json():({fish:{}}))]);
  records=[...a.records,...b.records];manifest=m;
}catch(err){console.error('Fish Wiki UX enhancement data load failed',err);return}
const byId=new Map(records.map(r=>[r.id,r]));
const ordered=[...records].sort((a,b)=>a.name.localeCompare(b.name));
const search=$('#fish-search'),suggestions=$('#fish-suggestions'),active=$('#active-filters'),nav=$('#category-nav');
const filterEls=['filter-group','filter-mod','filter-rarity','filter-stars','filter-habitat','filter-preview'].map(id=>document.getElementById(id)).filter(Boolean);

function searchBlob(r){return [r.name,r.id,slug(r.id),r.namespace,r.mod,r.modKey,r.group,r.location,r.locationKey,r.rarity,...(r.associatedMods||[])].join(' ').toLowerCase()}
function suggestionMatches(q){q=q.trim().toLowerCase();if(!q)return[];return records.map(r=>({r,score:(r.name.toLowerCase().startsWith(q)?4:0)+(r.id.toLowerCase().includes(q)?3:0)+(searchBlob(r).includes(q)?1:0)})).filter(x=>x.score).sort((a,b)=>b.score-a.score||a.r.name.localeCompare(b.r.name)).slice(0,8).map(x=>x.r)}
let suggestionIndex=-1;
function closeSuggestions(){if(!suggestions)return;suggestions.hidden=true;suggestions.innerHTML='';suggestionIndex=-1;search?.setAttribute('aria-expanded','false')}
function drawSuggestions(){if(!suggestions||!search)return;const list=suggestionMatches(search.value);if(!list.length){closeSuggestions();return}suggestions.innerHTML=list.map((r,i)=>`<a role="option" id="fish-suggestion-${i}" data-i="${i}" href="#${esc(slug(r.id))}"><span><strong>${esc(r.name)}</strong><small>${esc(r.mod)} · ${esc(r.id)}</small></span><span class="suggestion-stars">${'★'.repeat(Number(r.stars)||1)}</span></a>`).join('');suggestions.hidden=false;search.setAttribute('aria-expanded','true');search.setAttribute('aria-controls','fish-suggestions')}
search?.addEventListener('input',()=>{drawSuggestions();queueMicrotask(updateActiveFilters)});
search?.addEventListener('focus',drawSuggestions);
search?.addEventListener('keydown',e=>{
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    const opts=[...suggestions.querySelectorAll('a')];if(!opts.length)return;e.preventDefault();suggestionIndex=e.key==='ArrowDown'?(suggestionIndex+1)%opts.length:(suggestionIndex-1+opts.length)%opts.length;opts.forEach((o,i)=>o.setAttribute('aria-selected',String(i===suggestionIndex)));search.setAttribute('aria-activedescendant',opts[suggestionIndex].id);
  }else if(e.key==='Enter'&&suggestionIndex>=0){const a=suggestions.querySelectorAll('a')[suggestionIndex];if(a){e.preventDefault();a.click();closeSuggestions()}}
  else if(e.key==='Escape')closeSuggestions();
});
suggestions?.addEventListener('click',()=>closeSuggestions());
document.addEventListener('click',e=>{if(!e.target.closest('.fish-search'))closeSuggestions()});
document.addEventListener('keydown',e=>{
  const tag=document.activeElement?.tagName?.toLowerCase(),typing=tag==='input'||tag==='textarea'||document.activeElement?.isContentEditable;
  if((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k')){e.preventDefault();search?.focus();search?.select()}
});

function updateActiveFilters(){
  if(!active)return;const chips=[];
  for(const el of filterEls){if(!el.value)continue;chips.push({kind:'select',id:el.id,label:el.options[el.selectedIndex]?.textContent||el.value})}
  if(search?.value.trim())chips.push({kind:'search',id:'fish-search',label:`Search: ${search.value.trim()}`});
  active.innerHTML=chips.length?`<span class="active-filter-label">Active</span>${chips.map(c=>`<button type="button" data-clear="${c.id}" aria-label="Remove ${esc(c.label)} filter">${esc(c.label)} <span aria-hidden="true">×</span></button>`).join('')}<button class="clear-all-chip" type="button" data-clear="all">Clear all</button>`:'';
}
active?.addEventListener('click',e=>{const b=e.target.closest('button[data-clear]');if(!b)return;const id=b.dataset.clear;if(id==='all'){document.getElementById('clear-filters')?.click();search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}else{const el=document.getElementById(id);if(!el)return;el.value='';el.dispatchEvent(new Event(el===search?'input':'change',{bubbles:true}));}setTimeout(updateActiveFilters,0)});
filterEls.forEach(el=>el.addEventListener('change',()=>setTimeout(updateActiveFilters,0)));
$('#clear-filters')?.addEventListener('click',()=>setTimeout(updateActiveFilters,0));

function syncNavIndicator(){if(!nav)return;let ind=nav.querySelector('.category-indicator');if(!ind){ind=document.createElement('i');ind.className='category-indicator';ind.setAttribute('aria-hidden','true');nav.append(ind)}const on=nav.querySelector('button.active');if(!on)return;ind.style.width=`${on.offsetWidth}px`;ind.style.transform=`translateX(${on.offsetLeft-nav.scrollLeft}px)`}
if(nav){new MutationObserver(syncNavIndicator).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});nav.addEventListener('scroll',syncNavIndicator,{passive:true});window.addEventListener('resize',syncNavIndicator,{passive:true});setTimeout(syncNavIndicator,250)}

const missingShort={no_entity:'No display entity',source_missing:'Source mod asset unavailable',vanilla_model:'Vanilla renderer unavailable',unreconstructed:'Renderer export pending'};
function enhanceCards(){
  document.querySelectorAll('#fish-results .fish-card').forEach(card=>{
    const r=byId.get(card.dataset.id);if(!r||card.dataset.v2==='1')return;card.dataset.v2='1';
    const p=r.preview||{};if(!['exact','representative'].includes(p.status)){
      const win=card.querySelector('.specimen-window');if(win)win.innerHTML=`<div class="preview-quiet" title="${esc(p.note||'No validated source-backed render is attached to this build.')}"><span class="preview-state-mark" aria-hidden="true">◇</span><strong>No source-backed render</strong><small>${esc(missingShort[p.status]||'Preview unavailable')}</small></div>`;
    }
    const id=card.querySelector('.fish-id');if(id&&!card.querySelector('.card-meta'))id.insertAdjacentHTML('afterend',`<div class="card-meta"><span>${esc(title(r.rarity))}</span><span>${esc(title(r.group))}</span></div>`);
    const measures=card.querySelectorAll('.card-measures span');if(measures[1])measures[1].innerHTML=`Record<strong>${Number.isFinite(Number(r.recordHigh))?Number(r.recordHigh).toLocaleString(undefined,{maximumFractionDigits:1})+' cm':'n/a'}</strong>`;
    card.addEventListener('pointermove',e=>{const q=card.getBoundingClientRect();card.style.setProperty('--spot-x',`${e.clientX-q.left}px`);card.style.setProperty('--spot-y',`${e.clientY-q.top}px`)});
  });
  document.querySelectorAll('#fish-results .fish-row').forEach(row=>{const r=byId.get(row.dataset.id);if(!r||row.dataset.v2==='1')return;row.dataset.v2='1';const p=r.preview||{};if(!['exact','representative'].includes(p.status)){const prev=row.querySelector('.row-preview');if(prev)prev.innerHTML='<span class="row-render-missing" aria-label="No source-backed render">◇</span>'}});
}
const results=$('#fish-results');if(results)new MutationObserver(()=>requestAnimationFrame(enhanceCards)).observe(results,{childList:true});

function currentRecord(){const h=location.hash.slice(1);return h?byId.get(unslug(decodeURIComponent(h))):null}
function quietArticleMissing(article,r){const p=r.preview||{};if(['exact','representative'].includes(p.status))return;const w=article.querySelector('.entry-render .specimen-window');if(w)w.innerHTML=`<div class="preview-quiet detail-missing"><span class="preview-state-mark" aria-hidden="true">◇</span><strong>No source-backed render yet</strong><small>${esc(missingShort[p.status]||'Renderer export pending')}</small></div>`}
function variantViewer(r){
  const spec=manifest.fish?.[r.id];if(!spec)return'';const variants=spec.variants||{};const defs=[['normal','Normal'],['scarred','Scarred'],['parasite_ridden','Parasite-Ridden'],['albino','Albino'],['iridescent','Iridescent'],['perfect_specimen','Perfect Specimen']];
  return `<section class="condition-viewer" data-fish="${esc(r.id)}"><div class="condition-viewer-head"><div><p class="eyebrow">Source-backed specimen viewer</p><h2>Condition variants</h2></div><small>Body Type remains a separate size axis.</small></div><div class="condition-tabs" role="tablist" aria-label="Condition render">${defs.map(([id,label])=>{const v=variants[id],ok=v?.file&&v.status!=='unavailable';return `<button type="button" role="tab" data-condition="${id}" aria-selected="${id==='normal'}" ${ok?'':`disabled title="${esc(v?.reason||'No validated source-backed render is packaged.') }"`}>${label}</button>`}).join('')}</div><div class="body-type-note"><strong>Body Type</strong><span>Normal</span><span>Dwarf</span><span>Giant</span><small>Dwarf and Giant change the physical-size axis. This viewer does not fake unexported Body Type combinations.</small></div></section>`
}
function applyVariant(article,r,condition){const spec=manifest.fish?.[r.id],v=spec?.variants?.[condition];if(!v?.file)return;const win=article.querySelector('.entry-render .specimen-window');if(!win)return;win.innerHTML=`<img class="condition-render" src="${BASE+esc(v.file)}" alt="${esc(r.name)} ${esc(title(condition))} source-backed specimen render" loading="eager" decoding="async">`;article.querySelector('.entry-render small')?.replaceChildren(document.createTextNode(`${title(condition)} · source-backed documentation render`));article.querySelectorAll('.condition-tabs [role="tab"]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.condition===condition)))}
function enhanceArticle(){
  const article=$('#fish-article'),r=currentRecord();if(!article||article.hidden||!r)return;if(article.dataset.v2id===r.id)return;article.dataset.v2id=r.id;quietArticleMissing(article,r);
  const idx=ordered.findIndex(x=>x.id===r.id),prev=ordered[(idx-1+ordered.length)%ordered.length],next=ordered[(idx+1)%ordered.length];
  const action=article.querySelector('.article-actions');if(action)action.insertAdjacentHTML('afterend',`<nav class="specimen-nav" aria-label="Fish navigation"><a href="#${esc(slug(prev.id))}" aria-label="Previous fish: ${esc(prev.name)}">← ${esc(prev.name)}</a><span>${idx+1} / ${ordered.length}</span><a href="#${esc(slug(next.id))}" aria-label="Next fish: ${esc(next.name)}">${esc(next.name)} →</a></nav>`);
  const head=article.querySelector('.fish-entry-head');const viewer=variantViewer(r);if(head&&viewer)head.insertAdjacentHTML('afterend',viewer);
  article.querySelector('.condition-tabs')?.addEventListener('click',e=>{const b=e.target.closest('button[data-condition]');if(!b||b.disabled)return;applyVariant(article,r,b.dataset.condition)});
  if(manifest.fish?.[r.id]?.variants?.normal?.file)applyVariant(article,r,'normal');
}
const article=$('#fish-article');if(article)new MutationObserver(()=>requestAnimationFrame(enhanceArticle)).observe(article,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
window.addEventListener('hashchange',()=>setTimeout(()=>{enhanceArticle();closeSuggestions()},0));

function trapFilterFocus(e){const filters=$('#fish-filters');if(e.key!=='Tab'||!filters?.classList.contains('filters-open'))return;const focusable=[...filters.querySelectorAll('button:not([disabled]),select:not([disabled]),a[href],input:not([disabled])')].filter(x=>x.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
document.addEventListener('keydown',trapFilterFocus);

setTimeout(()=>{enhanceCards();enhanceArticle();updateActiveFilters();syncNavIndicator()},250);
})();
