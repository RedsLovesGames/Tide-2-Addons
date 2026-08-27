(()=>{
'use strict';
const tideTexture=id=>window.TIDEBORNE_TIDE_TEXTURES?.[id]||'';
const itemMap={
  'Stone Fishing Rod':{id:'tide:stone_fishing_rod',src:tideTexture('stone_fishing_rod'),source:'Tide'},
  'Iron Fishing Rod':{id:'tide:iron_fishing_rod',src:tideTexture('iron_fishing_rod'),source:'Tide'},
  'Golden Fishing Rod':{id:'tide:golden_fishing_rod',src:tideTexture('golden_fishing_rod'),source:'Tide'},
  'Crystal Fishing Rod':{id:'tide:crystal_fishing_rod',src:tideTexture('crystal_fishing_rod'),source:'Tide'},
  'Diamond Fishing Rod':{id:'tide:diamond_fishing_rod',src:tideTexture('diamond_fishing_rod'),source:'Tide'},
  'Netherite Fishing Rod':{id:'tide:netherite_fishing_rod',src:tideTexture('netherite_fishing_rod'),source:'Tide'},
  'Echo Fishing Rod':{id:'tide:echo_fishing_rod',src:tideTexture('echo_fishing_rod'),source:'Tide'},
  'Prismarine Fishing Rod':{id:'tide:prismarine_fishing_rod',src:tideTexture('prismarine_fishing_rod'),source:'Tide'},
  'Sunflower Fishing Rod':{id:'tide:sunflower_fishing_rod',src:tideTexture('sunflower_fishing_rod'),source:'Tide'},
  'Rod of the Hero':{id:'tide:village_fishing_rod',src:tideTexture('village_fishing_rod'),source:'Tide'},
  'Blazing Fishing Rod':{id:'tide:blazing_fishing_rod',src:tideTexture('blazing_fishing_rod'),source:'Tide'},
  'Honeycomb Fishing Rod':{id:'tide:honeycomb_fishing_rod',src:tideTexture('honeycomb_fishing_rod'),source:'Tide'},
  'Midas Fishing Rod':{id:'tide:midas_fishing_rod',src:tideTexture('midas_fishing_rod'),source:'Tide'},
  'Kujira Bone Fishing Rod':{id:'tidebound_compatibility:kujira_bone_fishing_rod',src:'assets/items/kujira_bone_fishing_rod.png',source:'Tideborne + Myths'},
  'Angling Table':{id:'tide:angling_table',src:tideTexture('angling_table'),source:'Tide'},
  'Fishing Journal':{id:'tide:fishing_journal',src:tideTexture('fishing_journal'),source:'Tide'},
  'Fish Satchel':{id:'tide:fish_satchel',src:tideTexture('fish_satchel'),source:'Tide'},
  'Fishy Note':{id:'tide:fishy_note',src:tideTexture('fishy_note'),source:'Tide'},
  'Pocket Watch':{id:'tide:pocket_watch',src:tideTexture('pocket_watch'),source:'Tide'},
  'Lunar Calendar':{id:'tide:lunar_calendar',src:tideTexture('lunar_calendar'),source:'Tide'},
  'Climate Gauge':{id:'tide:climate_gauge',src:tideTexture('climate_gauge'),source:'Tide'},
  'Depth Meter':{id:'tide:depth_meter',src:tideTexture('depth_meter'),source:'Tide'},
  'Weather Radio':{id:'tide:weather_radio',src:tideTexture('weather_radio'),source:'Tide'},
  'Fish Finder':{id:'tide:fish_finder',src:tideTexture('fish_finder'),source:'Tide'},
  "Angler's Satchel":{id:'tide_traits:anglers_satchel',src:'assets/items/anglers_satchel.png',source:'Tideborne'},
  'Tentacle Line':{id:'tidebound_compatibility:tentacle_line',src:'assets/items/tentacle_line.png',source:'Tideborne + Myths'},
  'Abaia Line':{id:'tidebound_compatibility:swift_line',src:'assets/items/abaia_line.png',source:'Tideborne + Myths'},
  "Seafarer's Hook":{id:'tidebound_compatibility:seafarers_hook',src:'assets/items/seafarers_hook.png',source:'Tideborne + Myths'},
  'Leviathan Bait':{id:'tidebound_compatibility:leviathan_bait',src:'assets/items/leviathan_bait.png',source:'Tideborne + Myths'},
  'Chum Bucket':{id:'tidebound_compatibility:chum_bucket',src:'assets/items/chum_bucket.png',source:'Tideborne + Apex'},
  'Steel Leader':{id:'tidebound_compatibility:steel_leader',src:'assets/items/steel_leader.png',source:'Tideborne + Apex'},
  'Shark Tooth Hook':{id:'tidebound_compatibility:shark_tooth_hook',src:'assets/items/shark_tooth_hook.png',source:'Tideborne + Apex'},
  'Shark Tooth':{id:'tidebound_compatibility:shark_tooth',src:'assets/items/shark_tooth.png',source:'Tideborne + Apex'}
};
const toolDescriptions={
  'Pocket Watch':'Shows the current Tide world time as HH:MM in the fishing-information overlay. It contributes while carried in a main/offhand slot or another supported informational-item slot.',
  'Lunar Calendar':'Shows the current moon phase. It is placeable; a placed calendar can contribute its information to nearby players through Tide’s informational-item system.',
  'Climate Gauge':'Shows the current biome base temperature, rounded to two decimals and displayed in °C.',
  'Depth Meter':'Shows depth in blocks below sea level, with values above sea level clamped to 0.',
  'Weather Radio':'Shows the current weather state as Clear, Rain, or Storm. It is placeable and can contribute weather information to nearby players.',
  'Fish Finder':'Combines Tide’s five informational readings in one item: current time, moon phase, biome temperature, current weather, and depth below sea level.'
};
function cleanName(s){return (s||'').replace(/\s*\([^)]*\)\s*/g,'').trim()}
function makeItemCell(name,info){
  const wrap=document.createElement('span');wrap.className='doc-item-cell';wrap.tabIndex=0;wrap.setAttribute('role','group');wrap.setAttribute('aria-label',`${name}, ${info.source}, ${info.id}`);wrap.title=`${name}\n${info.source}\n${info.id}`;
  const img=document.createElement('img');img.className='doc-item-icon';img.src=info.src;img.alt='';img.width=24;img.height=24;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{img.remove();wrap.classList.add('texture-unavailable')},{once:true});
  const text=document.createElement('span');text.className='doc-item-name';text.textContent=name;
  wrap.append(img,text);return wrap;
}
function enhancePhysicalTables(){
  document.querySelectorAll('#article table tbody tr').forEach(row=>{
    const cell=row.cells?.[0];if(!cell||cell.querySelector('.doc-item-cell'))return;
    const raw=cleanName(cell.textContent);const entry=Object.entries(itemMap).find(([name])=>raw===name||raw.startsWith(name));if(!entry)return;
    const [name,info]=entry;cell.textContent='';cell.append(makeItemCell(name,info));
  });
}
function rewriteToolDescriptions(){
  if(location.hash!=='#/equipment')return;
  document.querySelectorAll('#article table tbody tr').forEach(row=>{
    const name=cleanName(row.cells?.[0]?.textContent);if(toolDescriptions[name]&&row.cells?.length>=3)row.cells[row.cells.length-1].textContent=toolDescriptions[name];
  });
}
function traitsHTML(){return `
<span class="eyebrow">Specimens · Tideborne 1.3.57</span>
<h1>Body Type &amp; Condition</h1>
<p class="lead">Every specimen has <strong>one Body Type</strong> and <strong>one Condition</strong>. Body Type describes physical size identity. Condition describes visual or quality traits. The two axes are independent, so combinations such as Giant + Iridescent and Dwarf + Scarred are valid.</p>
<div class="trait-equation" aria-label="Body Type plus Condition equals one final specimen">
  <section><small>BODY TYPE</small><strong>Normal · Dwarf · Giant</strong><span>Physical size identity</span></section><b aria-hidden="true">+</b>
  <section><small>CONDITION</small><strong>Normal · Scarred · Parasite-Ridden · Albino · Iridescent · Perfect</strong><span>Visual / quality trait</span></section><b aria-hidden="true">=</b>
  <section><small>SPECIMEN</small><strong>One Body Type + one Condition</strong><span>Example: Giant + Perfect Specimen</span></section>
</div>
<h2 id="body-type">Body Type</h2>
<p>Body Type controls the specimen’s large-scale physical size identity. <strong>Normal</strong> means neither Dwarf nor Giant was selected. Giant and Dwarf are not Conditions.</p>
<div class="table-wrap"><table><thead><tr><th>Body Type</th><th>Default chance</th><th>Physical size</th><th>FishScore behavior</th></tr></thead><tbody>
<tr><td><strong>Normal</strong></td><td>All remaining catches</td><td>1.00× Body Type multiplier</td><td>No Body Type bonus. The specimen keeps the normal physical-size identity before any independent Condition effect.</td></tr>
<tr><td><strong>Dwarf</strong></td><td>1 in 80</td><td>0.55×–0.80×, roughly 55%–80% of normal Body Type scale</td><td>About +80 to +300 Body Type score. The bonus is strongest at the extreme low-percentile tail.</td></tr>
<tr><td><strong>Giant</strong></td><td>About 1 in 120</td><td>1.08×–1.30×, roughly 108%–130% of normal Body Type scale</td><td>About +80 to +300 Body Type score. It grows as physical length rises above the species record baseline and the percentile approaches the extreme upper tail.</td></tr>
</tbody></table></div>
<h2 id="condition">Condition</h2>
<p>Condition is a separate visual/quality axis. A Giant or Dwarf can still receive a Condition, and a Normal Body Type can receive any Condition.</p>
<div class="table-wrap"><table><thead><tr><th>Condition</th><th>Default chance</th><th>Physical / visual effect</th><th>FishScore</th></tr></thead><tbody>
<tr><td><strong>Normal</strong></td><td>When no special Condition is selected</td><td>No Condition treatment</td><td>No Condition bonus</td></tr>
<tr><td><strong>Scarred</strong></td><td>About 1 in 35</td><td>No size multiplier. Visible scar treatment.</td><td>+25</td></tr>
<tr><td><strong>Parasite-Ridden</strong></td><td>1 in 60</td><td>0.90×–0.97× physical-size effect plus visible parasite treatment.</td><td>+15</td></tr>
<tr><td><strong>Albino</strong></td><td>1 in 250</td><td>No direct size multiplier. Generated pale/albino texture treatment.</td><td>+175</td></tr>
<tr><td><strong>Iridescent</strong></td><td>About 1 in 750</td><td>No direct size multiplier. Generated iridescent visual treatment.</td><td>+325</td></tr>
<tr><td><strong>Perfect Specimen</strong></td><td>1 in 400</td><td>Targets the 95th–100th percentile of the <em>normal</em> size range. This does not make the fish Giant.</td><td>+350 Condition bonus, then final FishScore ×1.2</td></tr>
</tbody></table></div>
<div class="notice trait-combine"><div><strong>Independent means combinable</strong><p>Examples: <b>Giant + Iridescent</b>, <b>Giant + Perfect Specimen</b>, <b>Dwarf + Scarred</b>, and <b>Normal + Albino</b>. Physical-size effects apply alongside the selected Condition.</p></div></div>
<h2 id="perfect-catch">Perfect Catch Trait Luck</h2>
<p>A perfect Tide catch can improve specimen outcomes without overwriting an already-special Body Type or Condition. Tideborne can push the size percentile toward the same tail, then gives extra Body Type chances only at the extreme tails and extra Condition chances in rare-first order.</p>
<div class="table-wrap"><table><thead><tr><th>Perfect-catch boost</th><th>1.3.57 behavior</th></tr></thead><tbody>
<tr><td>Percentile push</td><td>70% chance to push toward the existing tail by roughly 18%–40% of the remaining tail distance.</td></tr>
<tr><td>Giant / Dwarf</td><td>Only when Body Type is Normal and the resulting percentile is ≥97 or ≤3; the extra weighted roll is 1.75×.</td></tr>
<tr><td>Condition reroll weighting</td><td>Iridescent 3.0×, Perfect Specimen 2.5× in its percentile window, Albino 2.5×, Parasite-Ridden 2.0×, Scarred 1.5×.</td></tr>
</tbody></table></div>
<p class="method-note">Existing non-Normal Body Types and Conditions are preserved. Physical length is recalculated after a successful perfect-catch trait adjustment.</p>`}
function rebuildToc(){const toc=document.querySelector('#toc');if(!toc)return;toc.innerHTML='';document.querySelectorAll('#article h2[id]').forEach(h=>{const a=document.createElement('a');a.href=`#${h.id}`;a.textContent=h.textContent;a.addEventListener('click',e=>{e.preventDefault();h.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});toc.append(a);});}
function rewriteTraits(){if(location.hash!=='#/traits')return;const a=document.querySelector('#article');if(!a||a.dataset.traits1357==='1')return;a.innerHTML=traitsHTML();a.dataset.traits1357='1';rebuildToc();}
function linkRecipeOutputs(){if(location.hash!=='#/recipes')return;const links={"Angler's Satchel":'#/satchel','Chum Bucket':'#/apex'};document.querySelectorAll('#article .recipe-card').forEach(card=>{const name=card.querySelector('h3')?.textContent?.trim(),href=links[name];if(!href)return;const out=card.querySelector('.output-slot');if(!out||out.closest('a'))return;const a=document.createElement('a');a.className='recipe-output-link';a.href=href;a.title=`Open ${name} documentation`;a.setAttribute('aria-label',`Open ${name} documentation`);out.replaceWith(a);a.append(out);});}
function run(){rewriteTraits();rewriteToolDescriptions();enhancePhysicalTables();linkRecipeOutputs();}
window.addEventListener('hashchange',()=>setTimeout(run,0));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,0));else setTimeout(run,0);
})();
