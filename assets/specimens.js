(()=>{
  "use strict";

  const article=document.getElementById("article");
  if(!article) return;

  const ASSET="assets/fish-previews/";
  const embedded=window.TIDEBORNE_FISH_PREVIEWS||{};
  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
  const path=()=>{
    const raw=(location.hash||"#/").slice(1).split("?")[0]||"/";
    return raw.length>1?raw.replace(/\/+$/,"/").replace(/\/$/,""):raw;
  };

  function make(tag,cls,html){const el=document.createElement(tag);if(cls)el.className=cls;if(html!==undefined)el.innerHTML=html;return el}
  function afterHeading(id,node){const h=article.querySelector(`#${CSS.escape(id)}`);if(h)h.insertAdjacentElement("afterend",node)}
  function afterBlock(id,node){const h=article.querySelector(`#${CSS.escape(id)}`);if(!h)return;let target=h.nextElementSibling||h;while(target.nextElementSibling && !/^H[23]$/.test(target.nextElementSibling.tagName)) target=target.nextElementSibling;target.insertAdjacentElement("afterend",node)}
  function previewImg(src,alt,scale){const style=scale?` style="--fish-scale:${scale}"`:"";const url=embedded[src]||`${ASSET}${src}`;return `<img class="specimen-fish" src="${url}" alt="${esc(alt)}" loading="lazy" decoding="async"${style}>`}

  function mutationGallery(){
    const entries=[
      ["Base","tuna-base.png","Normal visual","1.00× normal length","Tide's tuna texture with no Tideborne visual mutation."],
      ["Scarred","tuna-scarred.png","Scar mask","Normal length","Tideborne overlays one deterministic red-brown scar mask variant."],
      ["Parasite-Ridden","tuna-parasite-ridden.png","Parasite mask","0.90–0.97× length","The preview uses the midpoint length modifier, so the model is also slightly smaller."],
      ["Albino","tuna-albino.png","Generated recolor","Normal length","Tideborne converts the source texture toward a bright warm albino palette."],
      ["Iridescent","tuna-iridescent.png","Generated tint + sparkle mask","Normal length","A blue-violet iridescent tint is applied across the texture with a deterministic sparkle mask."],
    ];
    const wrap=make("section","specimen-section tb-visual-injected");
    wrap.dataset.tbVisuals="mutation-gallery";
    wrap.setAttribute("aria-label","Tuna mutation 3D previews");
    wrap.innerHTML=`
      <div class="specimen-section-head"><div><span class="visual-kicker">3D specimen preview</span><strong>Same Tide tuna, different Tideborne visuals</strong></div><p>These documentation renders use the actual Tide 2.1.1 <code>TunaModel</code> proportions and tuna entity texture. Scar, parasite, albino, and iridescent texture changes follow Tideborne 1.3.28's mutation rendering logic.</p></div>
      <div class="mutation-preview-grid">${entries.map(([name,img,type,size,note])=>`
        <figure class="specimen-card">
          <div class="specimen-stage">${previewImg(img,`${name} tuna 3D preview`)}</div>
          <figcaption><div class="specimen-title"><strong>${name}</strong><span>${size}</span></div><small>${type}</small><p>${note}</p></figcaption>
        </figure>`).join("")}</div>`;
    return wrap;
  }

  function sizeGallery(){
    const entries=[
      ["Runty","< 10th","5th","0.8352","≈ 83.7 cm","0.835×"],
      ["Small","10–<30th","20th","0.9048","≈ 98.2 cm","0.905×"],
      ["Average","30–<60th","45th","0.9717","≈ 113.3 cm","0.972×"],
      ["Hefty","60–<85th","72.5th","1.0444","≈ 130.9 cm","1.044×"],
      ["Trophy","85–<95th","90th","1.1180","150 cm","1.118×"],
      ["Legendary","≥ 95th","97.5th","1.1962","≈ 171.7 cm","1.196×"],
    ];
    const wrap=make("section","specimen-section size-demo tb-visual-injected");
    wrap.dataset.tbVisuals="size-gallery";
    wrap.setAttribute("aria-label","Relative tuna size band previews");
    wrap.innerHTML=`
      <div class="specimen-section-head"><div><span class="visual-kicker">Relative entity scale</span><strong>One species, six size bands</strong></div><p>Tuna is the reference species here. Tide 2.1.1 defines its normal size model from a 90–150 cm typical range, and Tideborne renders physical specimen size with <code>sqrt(length / species average)</code>. Each card uses a representative midpoint percentile for its band, so the fish are shown at their relative in-game render scales.</p></div>
      <div class="size-preview-grid">${entries.map(([name,range,pct,visualScale,length,scale])=>`
        <figure class="size-card">
          <div class="size-stage">${previewImg("tuna-base.png",`${name} size-band tuna 3D preview`,visualScale)}</div>
          <figcaption><strong>${name}</strong><span>${range}</span><small>example ${pct} percentile · ${length} · ${scale} render scale</small></figcaption>
        </figure>`).join("")}</div>
      <p class="visual-footnote">The example lengths are visual reference points, not hard cutoffs. Tide generates fish length from its log-normal species size model; Tideborne classifies the resulting empirical percentile.</p>`;
    return wrap;
  }

  function referenceTunaCard(){
    const wrap=make("div","reference-fish tb-visual-injected");
    wrap.dataset.tbVisuals="reference-tuna";
    wrap.innerHTML=`${previewImg("tuna-base.png","Base Tide tuna 3D model used as documentation reference")}<div><span class="visual-kicker">Reference specimen</span><strong>Tuna is the visual baseline for this guide</strong><p>Using one familiar Tide fish makes mutation, size, Satchel, and record examples directly comparable without changing species between examples.</p></div>`;
    return wrap;
  }

  function scannerExample(){
    const wrap=make("section","specimen-example tb-visual-injected");
    wrap.dataset.tbVisuals="scanner-example";
    wrap.setAttribute("aria-label","Angler's Satchel Trait Scanner example");
    wrap.innerHTML=`
      <div class="specimen-example-art">${previewImg("tuna-scarred.png","Example scarred trophy tuna for Angler's Satchel Trait Scanner","1.118")}</div>
      <div class="specimen-example-copy"><span class="visual-kicker">Trait Scanner example</span><strong>What a scanned specimen tells you</strong><dl class="specimen-facts"><div><dt>Species</dt><dd>Tuna</dd></div><div><dt>Mutation</dt><dd>Scarred</dd></div><div><dt>Size</dt><dd>Trophy</dd></div><div><dt>Example percentile</dt><dd>90th</dd></div><div><dt>Protection</dt><dd>Protected by default once Trophy Lock is active</dd></div></dl><p>This is an explanatory example, not a guaranteed catch. The point is to show how one fish can carry Tide species data, Tideborne mutation data, relative size, and Satchel protection context at the same time.</p></div>`;
    return wrap;
  }

  function journalFlow(){
    const wrap=make("section","journal-visual tb-visual-injected");
    wrap.dataset.tbVisuals="journal-flow";
    wrap.setAttribute("aria-label","Shared journal catch flow example");
    wrap.innerHTML=`
      <div class="journal-fish">${previewImg("tuna-base.png","Base tuna catch used in shared journal example")}</div>
      <div class="journal-flow-steps"><div><span>1</span><strong>You catch the fish</strong><small>The specimen still belongs to the player who caught it.</small></div><b>→</b><div><span>2</span><strong>Personal progress updates</strong><small>Your own Tide/Tideborne discovery data remains meaningful.</small></div><b>→</b><div><span>3</span><strong>Team state also updates</strong><small>Eligible discovery, contributor, and record data can enter the active FTB Teams backend.</small></div></div>`;
    return wrap;
  }

  function recordExample(){
    const wrap=make("section","record-specimen tb-visual-injected");
    wrap.dataset.tbVisuals="record-example";
    wrap.setAttribute("aria-label","Fish Score and Top Fish specimen example");
    wrap.innerHTML=`
      <div class="record-specimen-art">${previewImg("tuna-iridescent.png","Illustrative iridescent trophy tuna for Fish Score and Top Fish","1.118")}</div>
      <div class="record-specimen-copy"><span class="visual-kicker">One fish, several ranking inputs</span><strong>Iridescent Trophy Tuna</strong><p class="record-disclaimer">Illustrative documentation specimen, not a saved team record.</p><div class="score-inputs"><div><b>Percentile</b><span>drives the 5× percentile term</span></div><div><b>Tide rarity</b><span>maps to the rarity-star term</span></div><div><b>Iridescent</b><span>adds the verified +350 mutation bonus</span></div><div><b>Tuna record scale</b><span>species record high is 300 cm</span></div><div><b>Actual length</b><span>also contributes through the capped length term</span></div></div></div>`;
    return wrap;
  }

  function itemStrip(items,label){
    const wrap=make("div","visual-item-strip tb-visual-injected");
    wrap.dataset.tbVisuals="item-strip";
    wrap.setAttribute("aria-label",label);
    wrap.innerHTML=items.map(([name,file,note])=>`<div class="visual-item"><img src="assets/items/${file}" alt="${esc(name)} item texture" loading="lazy"><div><strong>${name}</strong><small>${note}</small></div></div>`).join("");
    return wrap;
  }

  function decorate(){
    if(article.querySelector("[data-tb-visuals]")) return;
    const p=path();
    if(p==="/traits"){
      afterHeading("mutations",mutationGallery());
      afterHeading("bands",sizeGallery());
    } else if(p==="/tide"){
      const h=article.querySelector("#catch-flow"); if(h) h.insertAdjacentElement("beforebegin",referenceTunaCard());
    } else if(p==="/satchel"){
      afterBlock("upgrades",scannerExample());
    } else if(p==="/journal"){
      afterBlock("how-it-works",journalFlow());
    } else if(p==="/records"){
      afterHeading("fish-score",recordExample());
    } else if(p==="/myths"){
      afterHeading("gear",itemStrip([
        ["Tentacle Line","tentacle_line.png","Kraken Tentacle line"],
        ["Abaia Line","abaia_line.png","Abaia Fin line"],
        ["Seafarer's Hook","seafarers_hook.png","Hippocampus Eye hook"],
        ["Kujira Bone Rod","kujira_bone_fishing_rod.png","Bake Kujira Bone rod"],
        ["Leviathan Bait","leviathan_bait.png","Leviathan Heart bait"]
      ],"Myths of the Sea Tideborne equipment textures"));
    } else if(p==="/apex"){
      afterHeading("gear",itemStrip([
        ["Chum Bucket","chum_bucket.png","Creates a scent zone"],
        ["Steel Leader","steel_leader.png","Catch-loss protection"],
        ["Shark Tooth","shark_tooth.png","Great White drop"],
        ["Shark Tooth Hook","shark_tooth_hook.png","Predatory-fish weighting"]
      ],"Apex Waters Tideborne equipment textures"));
    }
  }

  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})};
  new MutationObserver(schedule).observe(article,{childList:true,subtree:false});
  addEventListener("hashchange",schedule);
  schedule();
})();
