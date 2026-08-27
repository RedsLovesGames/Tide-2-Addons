(async()=>{
'use strict';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value??'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const title=value=>String(value||'').replaceAll('_',' ').replace(/\b\w/g,char=>char.toUpperCase());
const fmt=value=>(value===null||value===undefined||value===''||!Number.isFinite(Number(value)))?'n/a':Number(value).toLocaleString(undefined,{maximumFractionDigits:2});
const fmt1=value=>(value===null||value===undefined||value===''||!Number.isFinite(Number(value)))?'n/a':Number(value).toLocaleString(undefined,{maximumFractionDigits:1});
const stars=value=>'★'.repeat(Math.max(1,Math.min(5,Number(value)||1)));
const rarityOrder={common:1,uncommon:2,rare:3,very_rare:4,legendary:5};
const groupLabels={saltwater:'Ocean / Saltwater',freshwater:'Freshwater / River',underground:'Underground / Cave',lava:'Nether / Lava',void:'End / Void',misc:'Other'};
const previewLabels={exact:'Exact source render',representative:'Representative packaged variant',no_entity:'No Fish Display entity',source_missing:'Source mod not supplied',vanilla_model:'Vanilla model source unavailable',unreconstructed:'Renderer unsupported'};
const missingShort={no_entity:'No display entity',source_missing:'Source mod asset unavailable',vanilla_model:'Vanilla renderer unavailable',unreconstructed:'Renderer export pending'};

let runtime;
try{
  runtime=await window.TideFishRuntime.ready;
}catch(error){
  console.error('Fish runtime failed to load',error);
  const results=$('#fish-results');
  if(results)results.innerHTML='<div class="empty-state"><strong>FishData is unavailable in this build.</strong><span>The validated catalog bundle could not be loaded. No substitute data is being shown.</span></div>';
  $('#result-count')?.replaceChildren(document.createTextNode('FishData unavailable'));
  $('#active-summary')?.replaceChildren(document.createTextNode('Catalog validation required'));
  for(const id of ['#stat-records','#stat-mods','#stat-previews'])$('#'+id.replace('#',''))?.replaceChildren(document.createTextNode('Unavailable'));
  return;
}

const {records,recordMap,renderManifest,scope}=runtime;
const meta=runtime.meta||{};
const slug=runtime.slug,unslug=runtime.unslug,score=runtime.score,envelope=runtime.envelope,cardRanges=runtime.cardRanges;
const els={
  grid:$('#fish-results'),empty:$('#empty-state'),count:$('#result-count'),summary:$('#active-summary'),search:$('#fish-search'),suggestions:$('#fish-suggestions'),active:$('#active-filters'),
  group:$('#filter-group'),rarity:$('#filter-rarity'),stars:$('#filter-stars'),mod:$('#filter-mod'),habitat:$('#filter-habitat'),preview:$('#filter-preview'),sort:$('#sort-fish'),reset:$('#clear-filters'),
  catalog:$('#catalog-view'),article:$('#fish-article'),gridBtn:$('#view-grid'),listBtn:$('#view-list'),categoryNav:$('#category-nav')
};
const filterEls=[els.group,els.mod,els.rarity,els.stars,els.habitat,els.preview].filter(Boolean);
const habitatKey=record=>String(record.locationKey||record.location||'').trim();
const habitatLabel=record=>String(record.location||record.locationKey||'Unknown habitat').trim();
let view='grid',suggestionIndex=-1;

document.body.dataset.fishCatalogDesign='catalog-v4';
document.body.dataset.runtimeRenderCount=String(Object.keys(renderManifest?.fish||{}).length);

function addOptions(element,values,label=value=>value){
  if(!element)return;
  for(const value of values){const option=document.createElement('option');option.value=value;option.textContent=label(value);element.append(option);}
}

const groups=[...new Set(records.map(record=>record.group).filter(Boolean))].sort();
addOptions(els.group,groups,value=>groupLabels[value]||title(value));
addOptions(els.rarity,Object.keys(rarityOrder),title);
const modKeys=[...new Set(records.map(record=>record.modKey).filter(Boolean))].sort((a,b)=>(records.find(record=>record.modKey===a)?.mod||a).localeCompare(records.find(record=>record.modKey===b)?.mod||b));
addOptions(els.mod,modKeys,value=>records.find(record=>record.modKey===value)?.mod||value);
const habitats=new Map();
for(const record of records){const key=habitatKey(record);if(key&&!habitats.has(key))habitats.set(key,habitatLabel(record));}
addOptions(els.habitat,[...habitats.keys()].sort((a,b)=>habitats.get(a).localeCompare(habitats.get(b))),value=>habitats.get(value));
addOptions(els.preview,['available','unavailable'],value=>value==='available'?'Source-backed runtime render':'Render unavailable');

if(els.categoryNav){
  const makeButton=(value,label)=>{const button=document.createElement('button');button.type='button';button.dataset.group=value;button.textContent=label;button.setAttribute('aria-pressed','false');return button;};
  els.categoryNav.append(makeButton('','All fish'));
  for(const group of groups)els.categoryNav.append(makeButton(group,groupLabels[group]||title(group)));
  const indicator=document.createElement('i');indicator.className='category-indicator';indicator.setAttribute('aria-hidden','true');els.categoryNav.append(indicator);
}

function moveSortIntoSidebar(){
  const sidebar=$('#fish-filters');
  if(!sidebar||!els.sort)return;
  const wrapper=els.sort.closest('.sort-wrap');
  if(!wrapper||wrapper.parentElement===sidebar)return;
  sidebar.insertBefore(wrapper,sidebar.querySelector('label')||sidebar.querySelector('.wiki-links'));
}
moveSortIntoSidebar();

function runtimeVariant(record,condition='normal'){return runtime.variantFor(record.id,condition);}
function spriteStyle(preview){
  const rows=Math.max(1,Number(meta.atlas?.rowsPerSheet)||4),sheet=Math.floor(preview.row/rows),local=preview.row%rows;
  const x=meta.atlas?.cols===1?0:preview.col/Math.max(1,(meta.atlas?.cols||1)-1)*100,y=rows===1?0:local/(rows-1)*100;
  return `background-image:url('../assets/fish-wiki-atlas-${sheet}.webp');background-size:${(meta.atlas?.cols||1)*100}% ${rows*100}%;background-position:${x}% ${y}%`;
}
function previewHtml(record,detail=false){
  const variant=runtimeVariant(record);
  if(variant)return `<img class="runtime-fish-render${detail?' condition-render':' catalog-runtime-render'}" src="${esc(variant.file)}" alt="${esc(record.name)} source-authentic runtime render" loading="${detail?'eager':'lazy'}" decoding="async">`;
  const preview=record.preview||{};
  if(preview.status==='exact'||preview.status==='representative')return `<div class="fish-sprite" role="img" aria-label="${esc(record.name)} source-backed entity render" style="${spriteStyle(preview)}"></div>`;
  return `<div class="preview-quiet${detail?' detail-missing':''}" title="${esc(preview.note||'No validated source-backed render is attached to this build.')}"><span class="preview-state-mark" aria-hidden="true">◇</span><strong>No source-backed render${detail?' yet':''}</strong><small>${esc(missingShort[preview.status]||previewLabels[preview.status]||'Preview unavailable')}</small></div>`;
}
function card(record){
  const ranges=cardRanges(record);
  return `<button class="fish-card" type="button" data-id="${esc(record.id)}"><div class="fish-card-visual"><div class="specimen-window"${runtimeVariant(record)?` data-runtime-render="${esc(record.id)}"`:''}>${previewHtml(record)}</div><div class="catalog-stars" aria-label="${esc(record.stars||1)} star rarity" title="${esc(title(record.rarity||''))}">${stars(record.stars)}</div></div><div class="fish-card-content"><div class="fish-card-heading"><span class="fish-card-mod">${esc(record.mod||record.namespace||'Fish')}</span><h2>${esc(record.name)}</h2></div><div class="fish-quick-stats"><div class="fish-quick-row fish-score-row"><span>FishScore</span><strong><b>${fmt1(ranges.scoreMin)}</b><i>→</i><b>${fmt1(ranges.scoreMax)}</b></strong></div><div class="fish-quick-row"><span>Size <small>no traits</small></span><strong><b>${fmt1(ranges.baseMin)}</b><i>→</i><b>${fmt1(ranges.baseMax)} cm</b></strong></div><div class="fish-quick-row fish-trait-row"><span>Size <small>with traits</small></span><strong><b>${fmt1(ranges.traitMin)}</b><i>→</i><b>${fmt1(ranges.traitMax)} cm</b></strong></div></div></div></button>`;
}
function row(record){
  return `<button class="fish-row" type="button" data-id="${esc(record.id)}"><span class="row-preview">${previewHtml(record)}</span><span><strong>${esc(record.name)}</strong><small>${esc(record.mod)} · ${esc(slug(record.id))}</small></span><span>${stars(record.stars)} ${title(record.rarity)}</span><span>${fmt(record.typicalLow)}–${fmt(record.typicalHigh)} cm</span><span>${fmt(record.recordHigh)} cm</span><span>${fmt(score(record,100,'normal','normal',Number(record.recordHigh)||0))}</span></button>`;
}

function previewState(record){return runtimeVariant(record)?'available':'unavailable';}
function filtered(){
  const query=els.search.value.trim().toLowerCase(),group=els.group.value,rarity=els.rarity.value,star=els.stars.value,mod=els.mod.value,habitat=els.habitat?.value||'',preview=els.preview.value;
  const result=records.filter(record=>{
    if(group&&record.group!==group)return false;
    if(rarity&&record.rarity!==rarity)return false;
    if(star&&String(record.stars)!==star)return false;
    if(mod&&record.modKey!==mod)return false;
    if(habitat&&habitatKey(record)!==habitat)return false;
    if(preview&&previewState(record)!==preview)return false;
    if(!query)return true;
    return [record.name,record.id,slug(record.id),record.entity,record.mod,record.namespace,record.location,record.locationKey,...(record.associatedMods||[]),...(record.conditions||[]).flatMap(condition=>[condition.type,JSON.stringify(condition)])].join(' ').toLowerCase().includes(query);
  });
  const sort=els.sort.value;
  result.sort((a,b)=>sort==='rarity'?((rarityOrder[b.rarity]||0)-(rarityOrder[a.rarity]||0)||a.name.localeCompare(b.name)):sort==='record'?((Number(b.recordHigh)||-1)-(Number(a.recordHigh)||-1)||a.name.localeCompare(b.name)):sort==='score'?(score(b)-score(a)||a.name.localeCompare(b.name)):sort==='mod'?((a.mod||'').localeCompare(b.mod||'')||a.name.localeCompare(b.name)):a.name.localeCompare(b.name));
  return result;
}
function syncCategoryNav(){
  if(!els.categoryNav)return;
  for(const button of els.categoryNav.querySelectorAll('button[data-group]')){const active=button.dataset.group===els.group.value;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));if(active)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');}
  const active=els.categoryNav.querySelector('button.active'),indicator=els.categoryNav.querySelector('.category-indicator');
  if(active&&indicator){indicator.style.width=`${active.offsetWidth}px`;indicator.style.transform=`translateX(${active.offsetLeft-els.categoryNav.scrollLeft}px)`;}
}
function updateActiveFilters(){
  if(!els.active)return;
  const chips=[];
  for(const element of filterEls)if(element.value)chips.push({id:element.id,label:element.options[element.selectedIndex]?.textContent||element.value});
  if(els.search.value.trim())chips.push({id:'fish-search',label:`Search: ${els.search.value.trim()}`});
  els.active.innerHTML=chips.length?`<span class="active-filter-label">Active</span>${chips.map(chip=>`<button type="button" data-clear="${chip.id}" aria-label="Remove ${esc(chip.label)} filter">${esc(chip.label)} <span aria-hidden="true">×</span></button>`).join('')}<button class="clear-all-chip" type="button" data-clear="all">Clear all</button>`:'';
}
function render(){
  const result=filtered();
  els.grid.className=view==='grid'?'fish-grid':'fish-list';
  els.grid.innerHTML=(view==='grid'?result.map(card):result.map(row)).join('');
  els.count.textContent=`${result.length} fish`;
  const labels=[];for(const element of filterEls)if(element.value)labels.push(element.options[element.selectedIndex].text);if(els.search.value.trim())labels.push(`“${els.search.value.trim()}”`);
  els.summary.textContent=labels.length?labels.join(' · '):'Current modpack FishData only';
  els.empty.hidden=result.length>0;
  syncCategoryNav();updateActiveFilters();
}

function searchBlob(record){return [record.name,record.id,slug(record.id),record.namespace,record.mod,record.modKey,record.group,record.location,record.locationKey,record.rarity,...(record.associatedMods||[])].join(' ').toLowerCase();}
function suggestionMatches(query){
  const value=query.trim().toLowerCase();if(!value)return[];
  return records.map(record=>({record,rank:(record.name.toLowerCase().startsWith(value)?4:0)+(record.id.toLowerCase().includes(value)?3:0)+(searchBlob(record).includes(value)?1:0)})).filter(item=>item.rank).sort((a,b)=>b.rank-a.rank||a.record.name.localeCompare(b.record.name)).slice(0,8).map(item=>item.record);
}
function closeSuggestions(){if(!els.suggestions)return;els.suggestions.hidden=true;els.suggestions.innerHTML='';suggestionIndex=-1;els.search.setAttribute('aria-expanded','false');els.search.removeAttribute('aria-activedescendant');}
function drawSuggestions(){
  if(!els.suggestions)return;const list=suggestionMatches(els.search.value);if(!list.length)return closeSuggestions();
  els.suggestions.innerHTML=list.map((record,index)=>`<a role="option" id="fish-suggestion-${index}" data-i="${index}" href="#${esc(slug(record.id))}"><span><strong>${esc(record.name)}</strong><small>${esc(record.mod)} · ${esc(record.id)}</small></span><span class="suggestion-stars">${stars(record.stars)}</span></a>`).join('');
  els.suggestions.hidden=false;els.search.setAttribute('aria-expanded','true');els.search.setAttribute('aria-controls','fish-suggestions');
}

function formatCondition(condition){
  const entries=Object.entries(condition||{}).filter(([key])=>key!=='type');
  return entries.length?entries.map(([key,value])=>`${title(key)}: ${Array.isArray(value)?value.join(', '):typeof value==='object'?JSON.stringify(value):value}`).join(' · '):'Enabled';
}
function bar(label,value,max){const width=Math.max(2,Math.min(100,max?value/max*100:0));return `<div class="statbar"><span>${esc(label)}</span><div><i style="width:${width}%"></i></div><b>${fmt(value)}</b></div>`;}
function articleHtml(record){
  const e=envelope(record),normal=score(record,100,'normal','normal',e.normalHigh),giant=score(record,100,'normal','giant',e.giantHigh),iri=score(record,100,'iridescent','normal',e.normalHigh),perfect=score(record,100,'perfect_specimen','normal',e.normalHigh),absolute=score(record,100,'perfect_specimen','giant',e.giantHigh);
  const ordered=[...records].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id)),index=ordered.findIndex(item=>item.id===record.id),prev=ordered[(index-1+ordered.length)%ordered.length],next=ordered[(index+1)%ordered.length];
  const variant=runtimeVariant(record);
  return `<div class="article-actions"><button id="back-catalog" type="button">← Fish Wiki index</button><span>${esc(record.mod)} · ${esc(title(record.group))}</span></div><nav class="specimen-nav modpack-scope-nav" aria-label="Fish navigation"><a href="#${esc(slug(prev.id))}" aria-label="Previous fish: ${esc(prev.name)}">← ${esc(prev.name)}</a><span>${index+1} / ${ordered.length}</span><a href="#${esc(slug(next.id))}" aria-label="Next fish: ${esc(next.name)}">${esc(next.name)} →</a></nav><header class="fish-entry-head"><div><p class="eyebrow">${esc(record.mod)} · ${esc(title(record.rarity))}</p><h1>${esc(record.name)}</h1><p><code>${esc(slug(record.id))}</code> · entity <code>${esc(record.entity||'n/a')}</code></p><div class="entry-badges"><span>${stars(record.stars)} ${esc(title(record.rarity))}</span><span>${esc(title(record.group))}</span><span>${esc(record.location||'Unknown location')}</span></div></div><div class="entry-render"><div class="specimen-window">${previewHtml(record,true)}</div><small>${variant?'Normal · source-authentic runtime render':esc(previewLabels[record.preview?.status]||'Preview unavailable')}</small></div></header><section class="entry-grid"><div><h2>Size envelope</h2><div class="fact-grid"><div><span>Typical low</span><b>${fmt(record.typicalLow)} cm</b></div><div><span>Typical high</span><b>${fmt(record.typicalHigh)} cm</b></div><div><span>FishData record high</span><b>${fmt(record.recordHigh)} cm</b></div><div><span>Default lower envelope</span><b>${fmt(e.traitLow)} cm</b></div><div><span>Default Giant ceiling</span><b>${fmt(e.giantHigh)} cm</b></div></div><p class="method-note">Lower envelope is derived from FishData typical-low × the 1.3.57 minimum Dwarf multiplier (0.55) × minimum Parasite-Ridden multiplier (0.90). Giant ceiling uses FishData record-high × the 1.3.57 maximum Giant multiplier (1.30).</p></div><div><h2>FishScore ceiling</h2>${bar('Normal',normal,absolute)}${bar('Giant',giant,absolute)}${bar('Iridescent',iri,absolute)}${bar('Perfect Specimen',perfect,absolute)}${bar('Giant + Perfect',absolute,absolute)}<p class="method-note">1.3.57 score: percentile × 5 + rarity bonus + species record-high bonus + physical-length bonus + Condition bonus + Body Type bonus. Perfect Specimen multiplies the final total by 1.2.</p></div></section><section class="entry-grid"><div><h2>Fishing characteristics</h2><div class="fact-grid"><div><span>Strength</span><b>${fmt(record.strength)}</b></div><div><span>Speed</span><b>${fmt(record.speed)}</b></div><div><span>Selection weight</span><b>${fmt(record.weight)}</b></div><div><span>Bucket item</span><b>${esc(record.bucket||'n/a')}</b></div></div></div><div><h2>Tideborne context</h2><p>Body Type and Condition are independent axes in Tideborne 1.3.57. A fish can combine Giant or Dwarf with a compatible Condition such as Iridescent, Albino, Scarred, Parasite-Ridden, or Perfect Specimen.</p><p><a href="../#/traits">Body Type & Condition</a> · <a href="../#/records">FishScore & records</a> · <a href="../#/satchel">Angler's Satchel</a></p></div></section><section><h2>Catch conditions</h2><div class="condition-list">${(record.conditions||[]).length?record.conditions.map(condition=>`<div><strong>${esc(condition.type||'condition')}</strong><span>${esc(formatCondition(condition))}</span></div>`).join(''):'<p>No explicit conditions in this FishData record.</p>'}</div></section><section class="entry-grid"><div><h2>Provenance</h2><dl class="provenance"><dt>FishData</dt><dd>${esc(record.sourceJar||'Tide 2.1.1 / Tide Extra Compatibility 2.2.0')} · ${esc(record.sourcePath||'packaged FishData')}</dd><dt>Entity</dt><dd>${esc(record.entity||record.id||'unknown')}</dd><dt>Render</dt><dd>${variant?'Source-authentic runtime render':'Source render unavailable'}</dd></dl></div><div><h2>Source</h2><p>This entry is limited to the current Tideborne modpack scope and verified FishData. Missing render information is not inferred.</p></div></section>`;
}
function showHashRecord(){
  const hash=location.hash.slice(1);if(!hash){els.article.hidden=true;els.catalog.hidden=false;return;}
  const id=unslug(decodeURIComponent(hash)),record=recordMap.get(id);
  if(!record){els.article.hidden=true;els.catalog.hidden=false;history.replaceState(null,'',location.pathname+location.search);return;}
  closeSuggestions();els.catalog.hidden=true;els.article.innerHTML=articleHtml(record);els.article.hidden=false;els.article.focus({preventScroll:true});
}

$('#stat-records').textContent=records.length;
$('#stat-mods').textContent=new Set(records.map(record=>runtime.namespace(record.id))).size;
$('#stat-previews').textContent=records.filter(record=>runtimeVariant(record)).length;

els.categoryNav?.addEventListener('click',event=>{const button=event.target.closest('button[data-group]');if(!button)return;els.group.value=button.dataset.group;render();});
els.categoryNav?.addEventListener('scroll',syncCategoryNav,{passive:true});
window.addEventListener('resize',syncCategoryNav,{passive:true});
for(const element of filterEls)element.addEventListener('change',render);
els.sort.addEventListener('change',render);
els.search.addEventListener('input',()=>{render();drawSuggestions();});
els.search.addEventListener('focus',drawSuggestions);
els.search.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){const options=[...els.suggestions.querySelectorAll('a')];if(!options.length)return;event.preventDefault();suggestionIndex=event.key==='ArrowDown'?(suggestionIndex+1)%options.length:(suggestionIndex-1+options.length)%options.length;options.forEach((option,index)=>option.setAttribute('aria-selected',String(index===suggestionIndex)));els.search.setAttribute('aria-activedescendant',options[suggestionIndex].id);}
  else if(event.key==='Enter'&&suggestionIndex>=0){const option=els.suggestions.querySelectorAll('a')[suggestionIndex];if(option){event.preventDefault();option.click();closeSuggestions();}}
  else if(event.key==='Escape')closeSuggestions();
});
els.suggestions?.addEventListener('click',closeSuggestions);
document.addEventListener('click',event=>{if(!event.target.closest('.fish-search'))closeSuggestions();});
document.addEventListener('keydown',event=>{const tag=document.activeElement?.tagName?.toLowerCase(),typing=tag==='input'||tag==='textarea'||document.activeElement?.isContentEditable;if((event.key==='/'&&!typing)||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k')){event.preventDefault();els.search.focus();els.search.select();}});
els.active?.addEventListener('click',event=>{const button=event.target.closest('button[data-clear]');if(!button)return;const id=button.dataset.clear;if(id==='all'){els.reset.click();return;}const element=document.getElementById(id);if(!element)return;element.value='';if(element===els.search){render();closeSuggestions();}else element.dispatchEvent(new Event('change',{bubbles:true}));});
els.reset.addEventListener('click',()=>{for(const element of filterEls)element.value='';els.search.value='';els.sort.value='name';closeSuggestions();render();});
els.gridBtn?.addEventListener('click',()=>{view='grid';els.gridBtn.classList.add('active');els.listBtn?.classList.remove('active');els.gridBtn.setAttribute('aria-pressed','true');els.listBtn?.setAttribute('aria-pressed','false');render();});
els.listBtn?.addEventListener('click',()=>{view='list';els.listBtn.classList.add('active');els.gridBtn?.classList.remove('active');els.listBtn.setAttribute('aria-pressed','true');els.gridBtn?.setAttribute('aria-pressed','false');render();});
els.grid.addEventListener('click',event=>{const item=event.target.closest('.fish-card[data-id],.fish-row[data-id]');if(!item)return;location.hash=slug(item.dataset.id);});
els.article.addEventListener('click',event=>{if(event.target.closest('#back-catalog')){history.pushState(null,'',location.pathname+location.search);showHashRecord();}});
window.addEventListener('hashchange',showHashRecord);

window.TideFishApp={runtime,records,recordMap,render,showHashRecord};
render();showHashRecord();
})();
