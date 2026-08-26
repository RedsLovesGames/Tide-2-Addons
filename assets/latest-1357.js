(()=>{
  if(!window.TIDEBORNE)return;
  const t=window.TIDEBORNE;
  for(const p of Object.values(t.pages||{})){
    if(typeof p.title==='string')p.title=p.title.replaceAll('1.3.28','1.3.57');
    if(typeof p.description==='string')p.description=p.description.replaceAll('1.3.28','1.3.57');
    if(typeof p.body==='string')p.body=p.body.replaceAll('1.3.28','1.3.57').replaceAll('<strong>10</strong><span>Top Fish entries','<strong>12</strong><span>Top Fish entries').replaceAll('0.65x to 0.82x','0.55x to 0.80x').replaceAll('1.20x to 1.45x','1.08x to 1.30x').replaceAll('75th to 95th normal percentile','95th to 100th normal percentile');
  }

  if(t.pages.home){
    t.pages.home.title='Tideborne 1.3.57';
    t.pages.home.body=t.pages.home.body
      .replaceAll('specimen mutations','specimen Body Types and Conditions')
      .replaceAll('non-normal mutations','non-normal trait states')
      .replaceAll('adds mutations and a species-relative size percentile','adds independent Body Type and Condition data plus a species-relative size percentile')
      .replaceAll('mutation rendering','trait rendering');
  }

  if(t.pages.tide){
    t.pages.tide.body=t.pages.tide.body
      .replaceAll('assign a mutation and species-relative size percentile','assign independent Body Type and Condition data plus a species-relative size percentile')
      .replaceAll('Mutation visuals, badges, tooltips, screens, and previews','Trait visuals, badges, tooltips, screens, and previews');
  }

  if(t.pages.traits){
    t.pages.traits.nav='Body Type & Condition';
    t.pages.traits.title='Body Type, Condition & FishScore';
    t.pages.traits.description='Tideborne 1.3.57 specimen axes, size modifiers, perfect-catch trait luck, percentile behavior, and FishScore.';
    t.pages.traits.body=`<span class="eyebrow">Specimens</span><h1>Body Type & Condition</h1><p class="lead">Tideborne 1.3.57 treats specimen traits as two independent axes. <strong>Body Type</strong> controls large-scale size identity: Normal, Giant, or Dwarf. <strong>Condition</strong> controls quality and appearance: Normal, Scarred, Parasite-Ridden, Albino, Iridescent, or Perfect Specimen.</p><h2 id="body">Body Type</h2><div class="table-wrap"><table><thead><tr><th>Body Type</th><th>Default chance</th><th>Default physical multiplier</th><th>FishScore behavior</th></tr></thead><tbody><tr><td>Normal</td><td>remainder</td><td>1.00x</td><td>No Body Type bonus.</td></tr><tr><td>Dwarf</td><td>1 in 80</td><td>0.55x–0.80x</td><td>+80 to +300, strongest at the extreme low-percentile tail.</td></tr><tr><td>Giant</td><td>about 1 in 120</td><td>1.08x–1.30x</td><td>+80 to +300, scaling with physical size above the species record baseline and the top percentiles.</td></tr></tbody></table></div><h2 id="condition">Condition</h2><div class="table-wrap"><table><thead><tr><th>Condition</th><th>Default chance</th><th>Size effect</th><th>FishScore bonus</th></tr></thead><tbody><tr><td>Scarred</td><td>about 1 in 35</td><td>None</td><td>+25</td></tr><tr><td>Parasite-Ridden</td><td>1 in 60</td><td>0.90x–0.97x</td><td>+15</td></tr><tr><td>Albino</td><td>1 in 250</td><td>None</td><td>+175</td></tr><tr><td>Iridescent</td><td>about 1 in 750</td><td>None</td><td>+325</td></tr><tr><td>Perfect Specimen</td><td>1 in 400</td><td>95th–100th normal percentile target</td><td>+350, then final score ×1.2</td></tr></tbody></table></div><div class="notice"><div><strong>Independent means combinable</strong><p>A Giant can also be Iridescent or Perfect Specimen, and a Dwarf can also carry a Condition. Physical size applies the Body Type multiplier and any Condition size multiplier together.</p></div></div><h2 id="perfect-catch">Perfect Catch trait luck</h2><p>A Tide minigame Perfect Catch now directly rewards the retrieved fish. There is a 70% chance to push the fish farther toward the same percentile tail by 18% to 40% of the remaining distance. A Normal Body Type that reaches at least the 97th percentile or at most the 3rd percentile gets an additional 1.75×-weighted Giant or Dwarf roll.</p><p>Normal-condition fish also receive extra rare-condition opportunities in this order: Iridescent at 3× base probability, Perfect Specimen at 2.5× its percentile-window probability, Albino at 2.5×, Parasite-Ridden at 2×, and Scarred at 1.5×. Existing non-Normal Body Types and Conditions are preserved rather than downgraded.</p><h2 id="score">FishScore in 1.3.57</h2><p>The current score combines size percentile, rarity stars, a species record-high contribution, the caught fish's physical length, Condition bonus, and Body Type bonus. Perfect Specimen then multiplies the final result by 1.2.</p><div class="notice"><div><strong>Browse the actual ranges</strong><p><a href="fish/">Open the Fish Wiki</a> to compare authoritative FishData sizes and default-config FishScore ceilings species by species.</p></div></div>`;
  }

  if(t.pages.satchel&&typeof t.pages.satchel.body==='string'){
    t.pages.satchel.body=t.pages.satchel.body.replace(/<h2 id="get-one">[\s\S]*?<h2 id="tabs">/,`<h2 id="get-one">How to get one</h2><div class="explain-list"><div><strong>1. Obtain Tide's Fish Satchel.</strong><p>The Fish Satchel is the center ingredient and its stored contents are preserved.</p></div><div><strong>2. Craft a 3×3 upgrade.</strong><p>Place the Fish Satchel in the center and fill all eight surrounding slots with items from <code>#tide:fish</code>.</p></div><div><strong>3. Use qualifying fish.</strong><p>Every surrounding fish must be at least 3 stars. Tideborne validates the stars at crafting time, so species can be mixed freely as long as all eight qualify.</p></div></div><div class="notice"><div><strong>The old conversion shortcut is gone</strong><p>Sneak-use plus 100 XP is no longer the acquisition path in 1.3.57. The crafting recipe is required.</p></div></div><h2 id="tabs">`);
  }

  if(t.pages.recipes&&typeof t.pages.recipes.body==='string'){
    t.pages.recipes.description='All nine Tideborne 1.3.57 crafting recipes, including the 3-star Angler\'s Satchel upgrade.';
    t.pages.recipes.body=t.pages.recipes.body
      .replaceAll('eight crafting recipes','nine crafting recipes')
      .replaceAll('eight Tideborne','nine Tideborne')
      .replace('<div id="recipe-grid" class="recipe-grid"></div>',`<div class="recipe-grid"><section class="recipe-card"><header><div><span class="recipe-type">Tideborne</span><h3>Angler's Satchel</h3></div><span class="recipe-type">shaped</span></header><div class="recipe-ui"><div class="craft-grid satchel-grid" aria-label="Angler's Satchel shaped recipe"><div class="slot fallback">3★ Fish</div><div class="slot fallback">3★ Fish</div><div class="slot fallback">3★ Fish</div><div class="slot fallback">3★ Fish</div><div class="slot fallback">Fish Satchel</div><div class="slot fallback">3★ Fish</div><div class="slot fallback">3★ Fish</div><div class="slot fallback">3★ Fish</div><div class="slot fallback">3★ Fish</div></div><div class="recipe-arrow" aria-hidden="true">→</div><div class="slot output-slot"><img src="assets/items/anglers_satchel.png" alt="Angler's Satchel"></div></div><p class="recipe-note"><code>FFF / FSF / FFF</code>. F is any <code>#tide:fish</code> specimen with 3 or more stars; S is <code>tide:fish_satchel</code>. The center satchel's contents are preserved.</p></section></div><div id="recipe-grid" class="recipe-grid"></div>`)
      .replace('<tr><td>Angler\'s Satchel</td><td>Sneak-use a Tide Fish Satchel and spend 100 XP points.</td></tr>','');
  }

  if(t.pages.commands&&typeof t.pages.commands.body==='string'&&!t.pages.commands.body.includes('backfillhistory')){
    t.pages.commands.body=t.pages.commands.body.replace('</table></div>',`<tr><td><code>/tideborne badges backfillhistory</code></td><td>Permission level 2. Scans retained Team Journal history for online players on the current server/world and restores missing size, Body Type, and Condition badges where the historical metadata supports them. Safe to run repeatedly.</td></tr></table></div>`);
  }
})();
