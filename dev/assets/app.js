(()=>{
  "use strict";
  const data=window.TIDEBORNE;
  const pages=Object.entries(data.pages);
  const ordered=data.groups.flatMap(g=>g.pages);
  const $=s=>document.querySelector(s);
  const article=$("#article"), sideNav=$("#side-nav"), toc=$("#toc"), prevNext=$("#prev-next");
  const sidebar=$("#sidebar"), menu=$("#menu-button"), scrim=$("#scrim"), themeBtn=$("#theme-button");
  const searchDialog=$("#search-dialog"), searchOpen=$("#search-open"), searchClose=$("#search-close"), searchInput=$("#search-input"), searchResults=$("#search-results");
  const progress=$("#progress");
  const aliases={"/dependencies":"/installation","/teams":"/records","/bobbers":"/equipment","/fish-score":"/records"};

  const normalize=p=>{p=p||"/";if(!p.startsWith("/"))p="/"+p;p=p.length>1?p.replace(/\/+$/,"" ):p;return aliases[p]||p};
  function route(){const raw=(location.hash||"#/").slice(1), [p,q=""]=raw.split("?");return {path:normalize(p),params:new URLSearchParams(q)}}
  function getPage(path){return pages.find(([,p])=>p.path===path)||["home",data.pages.home]}
  function reduced(){return matchMedia("(prefers-reduced-motion: reduce)").matches}

  function renderNav(active){sideNav.innerHTML=data.groups.map(g=>`<section class="nav-group"><span class="nav-label">${g.label}</span>${g.pages.map(id=>`<a class="nav-link${id===active?" active":""}" href="#${data.pages[id].path}">${data.pages[id].nav}</a>`).join("")}</section>`).join("")}
  function renderToc(path){const heads=[...article.querySelectorAll("h2[id],h3[id]")];toc.innerHTML=heads.map(h=>`<a class="${h.tagName==="H3"?"depth3":"depth2"}" href="#${path}?section=${encodeURIComponent(h.id)}">${h.textContent}</a>`).join("");heads.forEach(h=>{h.classList.add("article-heading");const a=document.createElement("a");a.className="anchor";a.href=`#${path}?section=${encodeURIComponent(h.id)}`;a.textContent="#";a.setAttribute("aria-label",`Link to ${h.textContent}`);h.append(a)})}
  function renderPrevNext(active){const i=ordered.indexOf(active), prev=i>0?data.pages[ordered[i-1]]:null, next=i<ordered.length-1?data.pages[ordered[i+1]]:null;prevNext.innerHTML=`${prev?`<a href="#${prev.path}"><small>← Previous</small><strong>${prev.nav}</strong></a>`:"<span></span>"}${next?`<a class="next" href="#${next.path}"><small>Next →</small><strong>${next.nav}</strong></a>`:"<span></span>"}`}

  const itemTexture={
    "tidebound_compatibility:tentacle_line":"assets/items/tentacle_line.png",
    "tidebound_compatibility:swift_line":"assets/items/abaia_line.png",
    "tidebound_compatibility:seafarers_hook":"assets/items/seafarers_hook.png",
    "tidebound_compatibility:kujira_bone_fishing_rod":"assets/items/kujira_bone_fishing_rod.png",
    "tidebound_compatibility:leviathan_bait":"assets/items/leviathan_bait.png",
    "tidebound_compatibility:chum_bucket":"assets/items/chum_bucket.png",
    "tidebound_compatibility:steel_leader":"assets/items/steel_leader.png",
    "tidebound_compatibility:shark_tooth":"assets/items/shark_tooth.png",
    "tidebound_compatibility:shark_tooth_hook":"assets/items/shark_tooth_hook.png",
    "tide:fishing_line":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAANxJREFUOI3FUjEOgjAUfU24hLsMTg2n4AAmxdEbyCQJzJLAxA1ktE3cYfUAECYH3T1Gndq0xTSGmPi2/v/+++//X+DfIG4gr7g032WWzDhesH0jeTdIBVfwaxFTaJGI62aRgBLxuQjcgEt83l8AAEpDf6e84tbyFHg3eHdBVDGlIVgcoaiF7qqw3qxwOjKIfsQ0PeanzSuuO7B9I92ccvBpH4E7J6UhtrtBE1gcAQCKWkC0KQEg+fkAALLMEhIAcBMWRD/ierkpjo5ZDkwRNbN5Bau4TQnQLP8XP8cbgGayj6r8ARQAAAAASUVORK5CYII=",
    "tide:fishing_hook":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAANFJREFUOI3VkjEOgjAUhv8aj4AxLOUOEgKncHDwAAwsnIeFROLs4GCAM2hMuQNdGkLvUKfWKmBk029qX9//538vBf4eMqc5TWKlz1leEABYzhEHYfS8AyrLC7KYkwAA6qpEJwR6KQEALwZpEqvjIVd2VE0vJToh4G98cN6aOrHFQRjhfrua+ew3Sj2whpna6XwZ7qATYjQ2pR44b43I5qsdrF3XzDxpMNUwtg8bE2m/26qV45i4miCMUFflaHy8fyTbRMMaNikeGGgT+/5J/Bs8AGfqVHGSpsZuAAAAAElFTkSuQmCC",
    "myths_of_the_sea:kraken_tentacle":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAA7BJREFUWIXtlktvHFUQhb+qe/sxdmJPnLAFiRWKwi9CCgsQIhABUngEFF4BsiGbwIKsEBt+FwvEIoocG9vT0933USzaHjIPTxxgg+SzmVarbs+pU6eqrrCAm19/YtkyKkoXA3VZoqKYGSKCYezu7y0eW8Kv9x/KM4MAv/gim2HZcKWjAlJMmBqqAwkzO8t3zwxdfOFUKcsSEcE5hy8KQowAgwq6dORfYUmBw+YI5zyWM3VVD5lj7B8dIMCoGv2nBOS1D9+e0/TKeIcQI04V59zfkgtgkHNGVWe/KSUMUBHMjIwhx6X06jBg72D/VE8s6WlmhNiTYpwZD6APYfYHIQa6aUu2jHMOEVBV1DnEhmenjmyZruvWKrBUgt29J4gI0RdM2imlL0gxUY1quq7DF569J3uM6ppwcIR4xSyjKOIULwp4ur6nbVucrm+GJQLkwWh911KWFaEPiAqx7wkx0jQNo7ommdGHnlorFCFZJqdIdo4cepwJMQZwDtzpxp2jd+KHna0xqjr0vRkGdF3H0XSyNpun6/zdzz9YTJEUE3dvfHSqDMsKrOmE54HzjpQSRVmsjVtJYPvC1lInjKoa7/1Kh69CM2koioKieAaBxTbkqU5A/XwpzPDOg2UMw6nj8niHFCPqlJt3b5tZpu8D6gbyOeXnV+AsnTCZNmud/9Vbt/7ZLoCzdUJZFOudf0bMsXzv28/sRE4zOJHTiVBUw1ZsQ0fhPE4dD+7cW5nllw/v29NLq22mVKOab975eCl+ToFm2qyUsywrUtOSyIQU8aro8hCdoaorQghYNg7/PGD30WMubG+tjJ0j0Pf9Sjnbth1GLpByohRHsvXmcs6hhTLa3GDr0jabWxdXxsn1WzfMFGKIVL4k5oh3npwzXQiQM74uZwcsZnJO1OUwH6btFFHh6qvXcN7N/OKdJ4QwLKvjcow2RuScySnz+ZsfCIAPKWLBsJxprQMzSlfQdC2CLI2fdHw3QGAybRh2lXLnjfdn9f3ip+9NK6WsSg4PDtl99JiL462VE9HnmECG3icbWjgm3RRBQEAWGKgfBlPMERHI2RCLS9L2fU+lFfuPn9A201MvMv6Va1dZ5VgRoaoqnHdzWWyNt2fyqupM9kWYGX3XM75yiaIquDjeXu2Be7/8aKscu/PC5YFEXfHHb78zOTpidGGTF19+aVbHeHxnANjY3KDvekQFFeVkEalTymLwUNu2w3guC25ff3fwAGscuyqLT1+/eaYJd45znOMc/xv8BephT0PwSTqKAAAAAElFTkSuQmCC",
    "myths_of_the_sea:abaia_fin":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAARJJREFUOI1jYKAQMJKqwbU2/T+Mvbt5JiMLqRpFVeUZlKTlGE4eOMzAwMDAQNAAmEZzB1uGq9evwjXvbp7JSNAA19r0/+YOtgwMDAwMV69fZeDk48VQg9UAdFsZGBgYOPl4GZSk5RiuXr/K8On5a9wG4LIVphndFYzYNCPbysTKzKAgJg3XfPfQGYaTc9bB9bFg0wyzBV0zEyszhneZSNH89e0H7AYwMDAwnDxwmOHLy3d4NWtramOPBVicmqcE/RfXUsKp+cGrp9gNgGl2jQxCCX10zf9+/8VugHlK0H8pA3WM0Idp3r18HQMDAwODsp0Jbhc8u3ATLqjqbI6iGSna/iNHIQOu3GieEgTPcega0AEA2m6REfK6ZzgAAAAASUVORK5CYII=",
    "myths_of_the_sea:hippocampus_eye":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAkUExURSQfHR4YGSsnJTUvMM/Iyk9FVUE2QzQqNVFGUhMREC0jLAAAAORcTjcAAAAMdFJOU///////////////ABLfzs4AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuN4vW9zkAAAC2ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAMAAAAxAQIAEAAAAFoAAABphwQAAQAAAGoAAAAAAAAAo5MAAOgDAACjkwAA6AMAAFBhaW50Lk5FVCA1LjEuNwADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlAAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAAA02IfdCSajZAAAAGlJREFUKFN1ztEKQzEIA1BrN1Pr///vjAp3DOZDaQ4SlPiZvyBrzadfUdWmAtHNEQph6X69DS0FmY9RvGDJznyRIt4A2F33CzYOuIEGlsLsQKcjV1IA5UJBOO9SNgyEu4g48wCp4gMzER8p6QfP6LukhAAAAABJRU5ErkJggg==",
    "myths_of_the_sea:bake_kujira_bone":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAASUExURcW5oOnfyqeciOLZxNbNugAAAK7+CS4AAAAGdFJOU///////ALO/pL8AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCA1LjEuN4vW9zkAAAC2ZVhJZklJKgAIAAAABQAaAQUAAQAAAEoAAAAbAQUAAQAAAFIAAAAoAQMAAQAAAAMAAAAxAQIAEAAAAFoAAABphwQAAQAAAGoAAAAAAAAAo5MAAOgDAACjkwAA6AMAAFBhaW50Lk5FVCA1LjEuNwADAACQBwAEAAAAMDIzMAGgAwABAAAAAQAAAAWgBAABAAAAlAAAAAAAAAACAAEAAgAEAAAAUjk4AAIABwAEAAAAMDEwMAAAAAA02IfdCSajZAAAAE5JREFUKFNtzAkKACEMBMExx/+/vJNDDbgB0WpR+Bnk+QYsyS3BwdI3CDjtCKpmssN2PwFtJH/JENfU+bQcCsQa7nBdYbjCcIbp/zDG/QMbSAQlZnzjlgAAAABJRU5ErkJggg==",
    "myths_of_the_sea:leviathan_heart":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAVUExURTF3d2y+vlCrqy5YWD6Xl0GSkgAAAIoJFdQAAAAHdFJOU////////wAaSwNGAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAGHRFWHRTb2Z0d2FyZQBQYWludC5ORVQgNS4xLjeL1vc5AAAAtmVYSWZJSSoACAAAAAUAGgEFAAEAAABKAAAAGwEFAAEAAABSAAAAKAEDAAEAAAADAAAAMQECABAAAABaAAAAaYcEAAEAAABqAAAAAAAAAKiTAADoAwAAqJMAAOgDAABQYWludC5ORVQgNS4xLjcAAwAAkAcABAAAADAyMzABoAMAAQAAAAEAAAAFoAQAAQAAAJQAAAAAAAAAAgABAAIABAAAAFI5OAACAAcABAAAADAxMDAAAAAAsBYg0P4qQRAAAABiSURBVChTXc5LFkRBBANQkmL/S+749eAZyT2KsvzUgtm/2+SGkQY38oX8IIhHAkWt9BdhjOBOAKRJlO9JuDsqDxgUNXbAybXhoEo7DpKhPAMDkjrb7UId7W4h2X+oWrjK/AFEDgRvnM6BjgAAAABJRU5ErkJggg==",
    "minecraft:string":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAgMAAABinRfyAAAADFBMVEUAAAD39/fb29svRUeyJ3JTAAAAAXRSTlMAQObYZgAAAEhJREFUeNoFwLENQEAAAMBD4RXyCxCFFUR0DGcAvcIKRlBaQWeNTxQCEKCFHkYscZFfXmW1DUKXgnqKq+LIbtLeEL8Tz4UZ+AFt3gwyJfVwVQAAAABJRU5ErkJggg==",
    "minecraft:bucket":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAiUlEQVQ4y7WT7QnAIAxEXcpN/O8ODuMMjuQ2liucaIip/Qo8Cmnz7IXWuT/Ke980tgdTSi3n3CmlnJgiDoIYY4c9SnFVJWhiIITQkQLKlwIyCkaJuQ80a61TVgljmIIRLo/ZtwWolYBvqApw85UAD1wJlhG0PUiBOSxjUMCvcUsgJbdO/+RnelIHlx5daQ1EbF8AAAAASUVORK5CYII=",
    "minecraft:iron_nugget":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAGZJREFUOMtjYBgFeIGljQMYkwUi4jP+g3Bxby/cIKINA2ncdeLW/5v3n/+HGYRsGEHNII2fPn0CYxB70YZ9YAzUDDKIsAEwjTDNQJvBGGQAUc7fe+o22AsgDNIEw6SEPumaRgH5AADOK2Jy7owQ3QAAAABJRU5ErkJggg==",
    "minecraft:chain":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAPUlEQVQ4y2NgoBVQ1bH9j0yTZYBnQOp/sg0AATuXYPI1w2wn2xCYRorCYIgHIkXOh9k+TGKBooCkOBaIAQAjATE5zBRFTgAAAABJRU5ErkJggg==",
    "#tidebound_compatibility:shark_food":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAYxJREFUOI21kb0vA3EYxz93mhiqL9pwuaakkbYpoUkjQiMGq6niLzBgMFiMBhKLScRCDHYMViQ6iHiLpRKuIXLaJhdpcip0kcjPIpc7WmHwbM+T5/N9Xr7wh2hpS4hIsl/Ya/JfBADUsOrIfxRoaUuIr7WmgB/7Fq56cCTZL9SwSrmoWTV3s49Xs0Is2YkaVoVRMpC+gotTATHcFyCz4MLd7COW7OTVrGCUDNSwilEyqD49W/2SHQSYHvORmFQcot5QnEiHzG3uBj135hjqsk/tan8nMangDcWpvlToSA3xeHfF+fwR14UGZs1u9JxzYxlgbt2Ushfmj7Cc2qYp4P/2K8uF1b14XTg6esZ+9pTb3A3pkYywu+NwoR58rxfQ8xrVp2cMoFzUJIeAEhkQDZ5W3B5/TXg/ewqfYLlY5wS3x48S7akJ63mNzY2Vb5Y7TlCiPVzuLPG2nEcOFljb3ELPa2jXD5wc79aErQ28oTixxhKHRwcowaCU7k1Jv4EdkR7MWJ8dn5gR9vxf4wPZCLoLROg0nQAAAABJRU5ErkJggg=="
  };
  const pretty=id=>id.replace(/^#/,'').split(":").pop().replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const ingredientLabel=id=>id.startsWith("#")?`${id} (tag; Tuna shown)` : id;
  function slot(id,count=1,output=false){
    if(!id)return`<div class="slot" aria-hidden="true"></div>`;
    const src=itemTexture[id], isTag=id.startsWith("#"), label=ingredientLabel(id);
    return`<div class="slot${output?" output-slot":""}${isTag?" tag-slot":""}" title="${label}" aria-label="${label}">${src?`<img src="${src}" alt="${pretty(id)}">`:`<span class="fallback">${pretty(id)}</span>`}${isTag?`<span class="tag-mark">#</span>`:""}${count>1?`<span class="count">${count}</span>`:""}</div>`;
  }
  function recipeIngredients(r){return r.type==="shaped"?[...new Set(Object.values(r.key))]:[...new Set(r.ingredients)]}
  function recipeCells(r){
    if(r.type==="shaped")return r.pattern.flatMap(row=>[...row].map(ch=>slot(ch===" "?null:r.key[ch]))).join("");
    const cells=r.ingredients.map(x=>slot(x));while(cells.length<9)cells.push(slot(null));return cells.join("");
  }
  function ingredientLegend(r){return `<div class="ingredient-legend">${recipeIngredients(r).map(id=>`<span>${slot(id)}<small>${ingredientLabel(id)}</small></span>`).join("")}</div>`}
  function renderRecipes(){const el=$("#recipe-grid");if(!el)return;el.innerHTML=data.recipes.map(r=>`<section class="recipe-card"><header><div><span class="recipe-type">${r.mod}</span><h3>${r.name}</h3></div><span class="recipe-type">${r.type}</span></header><div class="recipe-ui"><div class="craft-grid" aria-label="${r.name} ${r.type} recipe">${recipeCells(r)}</div><div class="recipe-arrow" aria-hidden="true">→</div>${slot(r.output,r.count,true)}</div>${r.type==="shapeless"?`<span class="shapeless-badge">SHAPELESS · ingredient order does not matter</span>`:""}${ingredientLegend(r)}${r.note?`<p class="recipe-note">${r.note}</p>`:""}</section>`).join("")}

  function renderDependencies(){
    const el=$("#dependency-list");
    if(el)el.innerHTML=`<div class="dependency-list">${data.dependencies.map(d=>`<article class="dependency"><div><strong>${d.name}</strong><small>${d.version}</small></div><span class="dep-kind ${d.kind}">${d.kind}</span><p>${d.purpose}<br><small>Used by: ${d.features}</small></p><a href="${d.url}" target="_blank" rel="noreferrer">Official project ↗</a></article>`).join("")}</div>`;
    const map=$("#compat-map");
    if(map)map.innerHTML=`<div class="compat-map"><div class="compat-center"><strong>Tideborne 1.3.28</strong><small>unified mod</small></div><div class="compat-arrow">→</div><div class="compat-links"><div class="compat-branch required"><strong>Tide 2.1.1</strong><small>required fishing base</small></div><div class="compat-branch optional"><strong>Myths of the Sea 1.3.0</strong><small>optional fishing-material branch</small></div><div class="compat-branch optional"><strong>Apex Waters 1.1.1</strong><small>optional shark branch</small></div></div></div>`;
  }

  function table(target, headers, rows){const el=$(target);if(!el)return;el.innerHTML=`<div class="table-wrap equipment-table"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map((v,i)=>`<td${i===0?' class="item-name"':''}>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}
  function renderEquipment(){
    if(!data.equipment)return;
    table("#rods-table",["Rod","Source","Bait slots","Base durability","Perk / behavior"],data.equipment.rods);
    table("#lines-table",["Line","Source","Stats","What it does"],data.equipment.lines);
    table("#hooks-table",["Hook","Source","Effect","What it changes"],data.equipment.hooks);
    table("#bobbers-table",["Bobber","Luck","Lure","Profile"],data.equipment.bobbers);
    table("#baits-table",["Bait","Source","Fishing speed","Luck","Extra behavior"],data.equipment.baits);
    table("#related-table",["Tool","Source","Purpose"],data.equipment.related);
  }

  function closeNav(){document.body.classList.remove("nav-open");menu.setAttribute("aria-expanded","false");sidebar.setAttribute("aria-hidden",innerWidth<=820?"true":"false");if(innerWidth<=820)sidebar.inert=true;else sidebar.inert=false}
  function openNav(){document.body.classList.add("nav-open");menu.setAttribute("aria-expanded","true");sidebar.setAttribute("aria-hidden","false");sidebar.inert=false;const first=sidebar.querySelector("a");first&&first.focus()}
  function render(){const r=route(), [id,p]=getPage(r.path);document.title=`${p.title} · Tideborne Docs`;document.querySelector('meta[name="description"]').content=p.description;article.innerHTML=p.body;renderNav(id);renderRecipes();renderDependencies();renderEquipment();renderToc(p.path);renderPrevNext(id);closeNav();requestAnimationFrame(()=>{const s=r.params.get("section");if(s&&document.getElementById(s))document.getElementById(s).scrollIntoView({behavior:reduced()?"auto":"smooth"});else scrollTo({top:0,behavior:"auto"});article.focus({preventScroll:true});updateProgress()})}

  function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem("tideborne-theme",t);themeBtn.setAttribute("aria-label",t==="dark"?"Use light theme":"Use dark theme");document.querySelector('meta[name="theme-color"]').content=t==="dark"?"#0b1423":"#f5f7f2"}
  function initTheme(){setTheme(localStorage.getItem("tideborne-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))}

  const strip=html=>{const d=document.createElement("div");d.innerHTML=html;return d.textContent.replace(/\s+/g," ").trim()};
  const index=pages.map(([id,p])=>({id,p,text:(p.title+" "+p.nav+" "+p.description+" "+strip(p.body)).toLowerCase(),plain:strip(p.body)}));
  const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function search(){const q=searchInput.value.trim().toLowerCase();if(!q){searchResults.innerHTML=`<p class="recipe-note">Search all ${index.length} documentation pages.</p>`;return}const terms=q.split(/\s+/).filter(Boolean), found=index.filter(x=>terms.every(t=>x.text.includes(t))).slice(0,12);searchResults.innerHTML=found.length?found.map(x=>`<a class="search-result" href="#${x.p.path}"><strong>${esc(x.p.title)}</strong><span>${esc(x.p.description)}</span></a>`).join(""):`<p class="recipe-note">No results for “${esc(q)}”.</p>`}
  function openSearch(){if(!searchDialog.open)searchDialog.showModal();searchInput.value="";search();requestAnimationFrame(()=>searchInput.focus())}
  function closeSearchDialog(){if(searchDialog.open)searchDialog.close()}
  function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max>0?Math.min(100,scrollY/max*100):0}%`}

  menu.addEventListener("click",()=>document.body.classList.contains("nav-open")?closeNav():openNav());scrim.addEventListener("click",closeNav);themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));searchOpen.addEventListener("click",openSearch);searchClose.addEventListener("click",closeSearchDialog);searchInput.addEventListener("input",search);searchResults.addEventListener("click",e=>{if(e.target.closest("a"))closeSearchDialog()});searchInput.addEventListener("keydown",e=>{if(e.key==="Enter"){const a=searchResults.querySelector("a");if(a){location.hash=a.getAttribute("href");closeSearchDialog()}}});document.addEventListener("keydown",e=>{const typing=/input|textarea|select/i.test(document.activeElement?.tagName||"");if(e.key==="/"&&!typing&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();openSearch()}if(e.key==="Escape"){closeNav();closeSearchDialog()}});window.addEventListener("hashchange",render);window.addEventListener("scroll",updateProgress,{passive:true});window.addEventListener("resize",()=>{if(innerWidth>820)closeNav()});
  initTheme();render();
})();
