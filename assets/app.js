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

  const normalize=p=>{p=p||"/";if(!p.startsWith("/"))p="/"+p;return p.length>1?p.replace(/\/+$/,"" ):p};
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
    "tidebound_compatibility:shark_tooth_hook":"assets/items/shark_tooth_hook.png"
  };
  const pretty=id=>id.replace(/^#/,'').split(":").pop().replace(/_/g," ");
  function slot(id,count=1){if(!id)return`<div class="slot" aria-hidden="true"></div>`;const src=itemTexture[id];return`<div class="slot" title="${id}">${src?`<img src="${src}" alt="${pretty(id)}">`:`<span class="fallback">${pretty(id)}</span>`}${count>1?`<span class="count">${count}</span>`:""}</div>`}
  function recipeCells(r){if(r.type==="shaped")return r.pattern.flatMap(row=>[...row].map(ch=>slot(ch===" "?null:r.key[ch]))).join("");const cells=r.ingredients.map(x=>slot(x));while(cells.length<9)cells.push(slot(null));return cells.join("")}
  function renderRecipes(){const el=$("#recipe-grid");if(!el)return;el.innerHTML=data.recipes.map(r=>`<section class="recipe-card"><header><div><span class="recipe-type">${r.mod}</span><h3>${r.name}</h3></div><span class="recipe-type">${r.type}</span></header><div class="recipe-ui"><div class="craft-grid" aria-label="${r.name} ${r.type} recipe">${recipeCells(r)}</div><div class="recipe-arrow">→</div><div class="slot output-slot">${itemTexture[r.output]?`<img src="${itemTexture[r.output]}" alt="${r.name}">`:`<span class="fallback">${r.name}</span>`}${r.count>1?`<span class="count">${r.count}</span>`:""}</div></div>${r.type==="shapeless"?`<span class="shapeless-badge">SHAPELESS · ingredient order does not matter</span>`:""}${r.note?`<p class="recipe-note">${r.note}</p>`:""}</section>`).join("")}
  function renderDependencies(){const el=$("#dependency-list");if(el)el.innerHTML=`<div class="dependency-list">${data.dependencies.map(d=>`<article class="dependency"><div><strong>${d.name}</strong><small>${d.version}</small></div><span class="dep-kind ${d.kind}">${d.kind}</span><p>${d.purpose}<br><small>${d.features}</small></p><a href="${d.url}" target="_blank" rel="noreferrer">Project ↗</a></article>`).join("")}</div>`;const map=$("#compat-map");if(map)map.innerHTML=`<div class="compat-map"><div class="compat-center"><strong>Tideborne 1.3.28</strong><small>unified mod</small></div><div class="compat-arrow">→</div><div class="compat-links"><div class="compat-branch"><strong>Tide 2.1.1</strong><small>required base</small></div><div class="compat-branch"><strong>Myths of the Sea 1.3.0</strong><small>optional branch</small></div><div class="compat-branch"><strong>Apex Waters 1.1.1</strong><small>optional branch</small></div></div></div>`}

  function closeNav(){document.body.classList.remove("nav-open");menu.setAttribute("aria-expanded","false");sidebar.setAttribute("aria-hidden",innerWidth<=820?"true":"false");if(innerWidth<=820)sidebar.inert=true;else sidebar.inert=false}
  function openNav(){document.body.classList.add("nav-open");menu.setAttribute("aria-expanded","true");sidebar.setAttribute("aria-hidden","false");sidebar.inert=false;const first=sidebar.querySelector("a");first&&first.focus()}
  function render(){const r=route(), [id,p]=getPage(r.path);document.title=`${p.title} · Tideborne Docs`;document.querySelector('meta[name="description"]').content=p.description;article.innerHTML=p.body;renderNav(id);renderRecipes();renderDependencies();renderToc(p.path);renderPrevNext(id);closeNav();requestAnimationFrame(()=>{const s=r.params.get("section");if(s&&document.getElementById(s))document.getElementById(s).scrollIntoView({behavior:reduced()?"auto":"smooth"});else scrollTo({top:0,behavior:"auto"});article.focus({preventScroll:true});updateProgress()})}

  function setTheme(t){document.documentElement.dataset.theme=t;localStorage.setItem("tideborne-theme",t);themeBtn.setAttribute("aria-label",t==="dark"?"Use light theme":"Use dark theme");document.querySelector('meta[name="theme-color"]').content=t==="dark"?"#0b1423":"#f5f7f2"}
  function initTheme(){setTheme(localStorage.getItem("tideborne-theme")||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"))}

  const strip=html=>{const d=document.createElement("div");d.innerHTML=html;return d.textContent.replace(/\s+/g," ").trim()};
  const index=pages.map(([id,p])=>({id,p,text:(p.title+" "+p.nav+" "+p.description+" "+strip(p.body)).toLowerCase(),plain:strip(p.body)}));
  const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function search(){const q=searchInput.value.trim().toLowerCase();if(!q){searchResults.innerHTML=`<p class="recipe-note">Search all ${index.length} documentation pages.</p>`;return}const terms=q.split(/\s+/), found=index.filter(x=>terms.every(t=>x.text.includes(t))).slice(0,12);searchResults.innerHTML=found.length?found.map(x=>`<a class="search-result" href="#${x.p.path}"><strong>${esc(x.p.title)}</strong><span>${esc(x.p.description)}</span></a>`).join(""):`<p class="recipe-note">No results for “${esc(q)}”.</p>`}
  function openSearch(){if(!searchDialog.open)searchDialog.showModal();searchInput.value="";search();requestAnimationFrame(()=>searchInput.focus())}
  function closeSearchDialog(){if(searchDialog.open)searchDialog.close()}
  function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max>0?Math.min(100,scrollY/max*100):0}%`}

  menu.addEventListener("click",()=>document.body.classList.contains("nav-open")?closeNav():openNav());scrim.addEventListener("click",closeNav);themeBtn.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));searchOpen.addEventListener("click",openSearch);searchClose.addEventListener("click",closeSearchDialog);searchInput.addEventListener("input",search);searchResults.addEventListener("click",e=>{if(e.target.closest("a"))closeSearchDialog()});searchInput.addEventListener("keydown",e=>{if(e.key==="Enter"){const a=searchResults.querySelector("a");if(a){location.hash=a.getAttribute("href");closeSearchDialog()}}});document.addEventListener("keydown",e=>{const typing=/input|textarea|select/i.test(document.activeElement?.tagName||"");if(e.key==="/"&&!typing&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();openSearch()}if(e.key==="Escape"){closeNav();closeSearchDialog()}});window.addEventListener("hashchange",render);window.addEventListener("scroll",updateProgress,{passive:true});window.addEventListener("resize",()=>{if(innerWidth>820)closeNav()});
  initTheme();render();
})();
