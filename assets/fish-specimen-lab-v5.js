(()=>{
'use strict';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let syncing=false;
let globalMaxCm=600;

const style=document.createElement('style');
style.id='fish-specimen-lab-v5-style';
style.textContent=`
/* v5: one global physical scale, large render first, controls below */
#fish-highlight-layer .fish-lab-workspace{display:block!important;grid-template-columns:none!important}
#fish-highlight-layer .fish-lab-specimen-card{width:100%!important;min-width:0!important}
#fish-highlight-layer .fish-lab-render-stage{height:clamp(500px,64vh,760px)!important;min-height:500px!important;margin-top:14px!important}
#fish-highlight-layer .fish-lab-render-shell{left:3%!important;right:3%!important;top:5%!important;bottom:16%!important}
#fish-highlight-layer .fish-lab-console{display:block!important;width:100%!important;margin-top:14px!important;padding:13px!important;border:1px solid #285467!important;border-radius:14px!important;background:linear-gradient(150deg,rgba(11,34,49,.91),rgba(6,22,33,.8))!important;box-shadow:inset 0 1px rgba(176,242,240,.035)!important}
#fish-highlight-layer .fish-lab-control-panel-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;margin-bottom:12px!important}
#fish-highlight-layer .fish-lab-control-panel-head h2{margin:0;color:#fffdf6;font:700 16px/1.1 Georgia,serif}
#fish-highlight-layer .fish-lab-score-head{display:flex!important;align-items:center!important;gap:10px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;min-height:0!important;height:auto!important}
#fish-highlight-layer .fish-lab-score-head>div{display:flex!important;align-items:baseline!important;gap:8px!important;flex-direction:row!important}
#fish-highlight-layer .fish-lab-score-head span{font-size:7px!important}
#fish-highlight-layer .fish-lab-score-head strong{font-size:clamp(22px,2vw,31px)!important}
#fish-highlight-layer .fish-lab-live-dot{padding:4px 6px!important}
#fish-highlight-layer .fish-lab-control-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px 16px!important;padding:12px!important;border:1px solid #285165!important;border-radius:10px!important;background:rgba(5,24,35,.42)!important}
#fish-highlight-layer .fish-lab-control-grid .fish-lab-control-group{min-width:0!important}
#fish-highlight-layer .fish-lab-breakdown{margin-top:12px!important}
#fish-highlight-layer .fish-lab-multiplier{margin-top:9px!important}
#fish-highlight-layer .fish-lab-render-stage::after{content:'FIXED CATALOG SCALE';position:absolute;right:14px;top:12px;color:#4f7f8c;font:800 7px/1 ui-monospace,monospace;letter-spacing:.14em}
#fish-highlight-layer .fish-lab-global-scale-note{position:absolute;right:14px;top:28px;z-index:3;color:#6ba4ad;font:700 7px/1 ui-monospace,monospace;letter-spacing:.05em;text-transform:uppercase}
#fish-highlight-layer .fish-lab-control-group[data-size-linked]::after{content:'SIZE ↔ PERCENTILE LINKED';display:block;margin-top:3px;color:#4fd7cf;font:800 6px/1 ui-monospace,monospace;letter-spacing:.08em}
#fish-highlight-layer .fish-lab-render-stage[data-scale-mode="global"] .fish-lab-ruler strong::after{content:''!important}
@media(max-width:800px){
  #fish-highlight-layer .fish-lab-render-stage{height:430px!important;min-height:430px!important}
  #fish-highlight-layer .fish-lab-control-panel-head{align-items:flex-start!important;flex-direction:column!important}
  #fish-highlight-layer .fish-lab-control-grid{grid-template-columns:1fr!important}
}
`;
document.head.append(style);

function root(){return document.getElementById('fish-highlight-layer');}
function getControls(){
  const r=root();
  if(!r||r.hidden)return null;
  const pct=r.querySelector('[data-live-percentile-input]');
  const len=r.querySelector('[data-live-length-input]');
  const condition=r.querySelector('[data-live-condition]');
  if(!pct||!len)return null;
  return {root:r,pct,len,condition};
}

function rememberBodyBounds(c,force=false){
  const liveMin=Number(c.len.min),liveMax=Number(c.len.max);
  if(force||!c.len.dataset.bodyMin||!c.len.dataset.bodyMax){
    if(Number.isFinite(liveMin))c.len.dataset.bodyMin=String(liveMin);
    if(Number.isFinite(liveMax))c.len.dataset.bodyMax=String(liveMax);
  }
}
function bodyBounds(c){
  const min=Number(c.len.dataset.bodyMin ?? c.len.min);
  const max=Number(c.len.dataset.bodyMax ?? c.len.max);
  return {min:Number.isFinite(min)?min:0,max:Number.isFinite(max)&&max>min?max:min+1};
}
function percentileFloor(c){return c.condition?.value==='perfect_specimen'?95:0;}
function lengthFromPercent(c,p){
  const {min,max}=bodyBounds(c);
  return min+(max-min)*(clamp(p,0,100)/100);
}
function percentFromLength(c,length){
  const {min,max}=bodyBounds(c);
  return clamp(((length-min)/(max-min))*100,0,100);
}
function fireInput(el){el.dispatchEvent(new Event('input',{bubbles:true}));}

function updateVisibleBounds(c){
  const floor=percentileFloor(c);
  const {min,max}=bodyBounds(c);
  const effectiveMin=lengthFromPercent(c,floor);
  c.pct.min=String(floor);
  c.len.min=String(effectiveMin);
  c.len.max=String(max);
  const pctMin=c.root.querySelector('[data-live-percentile-min]');
  const lenMin=c.root.querySelector('[data-live-length-min]');
  const lenMax=c.root.querySelector('[data-live-length-max]');
  if(pctMin)pctMin.textContent=floor?`${floor}th`:'0th';
  if(lenMin)lenMin.textContent=`${effectiveMin.toFixed(1)} cm`;
  if(lenMax)lenMax.textContent=`${max.toFixed(1)} cm`;
}

function syncFromPercent(c,requested=Number(c.pct.value)){
  if(syncing)return;
  syncing=true;
  rememberBodyBounds(c);
  const floor=percentileFloor(c);
  const p=clamp(requested,floor,100);
  const length=lengthFromPercent(c,p);
  c.pct.value=String(p);
  c.len.value=String(length);
  updateVisibleBounds(c);
  fireInput(c.pct);
  fireInput(c.len);
  syncing=false;
  requestAnimationFrame(()=>applyGlobalScale(c));
}
function syncFromLength(c,requested=Number(c.len.value)){
  if(syncing)return;
  syncing=true;
  rememberBodyBounds(c);
  const {max}=bodyBounds(c);
  const floor=percentileFloor(c);
  const minimum=lengthFromPercent(c,floor);
  const length=clamp(requested,minimum,max);
  const p=percentFromLength(c,length);
  c.len.value=String(length);
  c.pct.value=String(p);
  updateVisibleBounds(c);
  fireInput(c.pct);
  fireInput(c.len);
  syncing=false;
  requestAnimationFrame(()=>applyGlobalScale(c));
}

function restructure(c){
  const console=c.root.querySelector('.fish-lab-console');
  if(!console||console.dataset.v5==='1')return;
  console.dataset.v5='1';
  const score=console.querySelector('.fish-lab-score-head');
  const groups=[...console.querySelectorAll(':scope > .fish-lab-control-group')];
  const breakdown=console.querySelector('.fish-lab-breakdown');
  const multiplier=console.querySelector('.fish-lab-multiplier');
  const head=document.createElement('div');
  head.className='fish-lab-control-panel-head';
  head.innerHTML='<h2>Specimen controls</h2>';
  if(score)head.append(score);
  const grid=document.createElement('div');
  grid.className='fish-lab-control-grid';
  groups.forEach(g=>grid.append(g));
  console.replaceChildren(head,grid);
  if(breakdown)console.append(breakdown);
  if(multiplier)console.append(multiplier);
  c.pct.closest('.fish-lab-control-group')?.setAttribute('data-size-linked','');
  c.len.closest('.fish-lab-control-group')?.setAttribute('data-size-linked','');

  const stage=c.root.querySelector('[data-live-render-stage]');
  if(stage&&!stage.querySelector('.fish-lab-global-scale-note')){
    const note=document.createElement('div');
    note.className='fish-lab-global-scale-note';
    note.dataset.globalScaleNote='';
    note.textContent=`Largest catalog specimen ${globalMaxCm.toFixed(1)} cm`;
    stage.append(note);
  }
}

function applyGlobalScale(c){
  const stage=c.root.querySelector('[data-live-render-stage]');
  const img=c.root.querySelector('[data-live-render-img]');
  if(!stage||!img)return;
  const run=()=>{
    const usable=Math.max(240,stage.clientWidth-120);
    const globalBlocks=Math.max(1,globalMaxCm/100);
    const blockPx=usable/globalBlocks;
    const currentCm=Number(c.len.value)||0;
    const fishPx=Math.max(2,(currentCm/100)*blockPx);
    stage.style.setProperty('--block-px',`${blockPx}px`);
    stage.style.setProperty('--fish-width',`${fishPx}px`);
    stage.dataset.scaleMode='global';
    img.style.width=`${fishPx}px`;
    const note=stage.querySelector('[data-global-scale-note]');
    if(note)note.textContent=`Largest catalog specimen ${globalMaxCm.toFixed(1)} cm`;
  };
  if(img.complete&&img.naturalWidth)run();else img.addEventListener('load',run,{once:true});
}

function initialize({bodyChanged=false}={}){
  const c=getControls();if(!c)return;
  if(bodyChanged)rememberBodyBounds(c,true);else rememberBodyBounds(c);
  restructure(c);
  updateVisibleBounds(c);
  if(bodyChanged)syncFromPercent(c,Number(c.pct.value));
  else syncFromLength(c,Number(c.len.value));
  requestAnimationFrame(()=>applyGlobalScale(c));
}

async function loadGzip(path){
  const res=await fetch(path);if(!res.ok)throw new Error(`${path}: HTTP ${res.status}`);
  if(!('DecompressionStream' in window))throw new Error('gzip decompression unsupported');
  return JSON.parse(await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).text());
}
Promise.all([loadGzip('../assets/fish-wiki-data-0.json.gz'),loadGzip('../assets/fish-wiki-data-1.json.gz')]).then(([a,b])=>{
  const records=[...(a.records||[]),...(b.records||[])];
  const max=records.reduce((m,r)=>{
    const record=Number(r.recordHigh),typical=Number(r.typicalHigh);
    const base=Number.isFinite(record)&&record>0?record:(Number.isFinite(typical)?typical:0);
    return Math.max(m,base*1.30);
  },0);
  if(max>0)globalMaxCm=max;
  const c=getControls();if(c){restructure(c);applyGlobalScale(c);const note=c.root.querySelector('[data-global-scale-note]');if(note)note.textContent=`Largest catalog specimen ${globalMaxCm.toFixed(1)} cm`;}
}).catch(err=>console.warn('Could not calculate global specimen scale; using 600 cm fallback.',err));

document.addEventListener('input',e=>{
  if(syncing)return;
  const c=getControls();if(!c)return;
  if(e.target===c.pct){syncFromPercent(c,Number(c.pct.value));return;}
  if(e.target===c.len){syncFromLength(c,Number(c.len.value));return;}
  if(e.target===c.condition)requestAnimationFrame(()=>syncFromPercent(c,Number(c.pct.value)));
});
document.addEventListener('change',e=>{
  if(syncing)return;
  const c=getControls();if(c&&e.target===c.condition)requestAnimationFrame(()=>syncFromPercent(c,Number(c.pct.value)));
});
document.addEventListener('click',e=>{
  if(syncing||!e.target.closest('[data-body]'))return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>initialize({bodyChanged:true})));
});
window.addEventListener('resize',()=>{const c=getControls();if(c)applyGlobalScale(c);});

const observer=new MutationObserver(()=>{
  if(document.querySelector('#fish-highlight-layer:not([hidden]) [data-live-percentile-input]'))requestAnimationFrame(()=>requestAnimationFrame(()=>initialize()));
});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
})();