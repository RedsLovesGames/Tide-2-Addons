(()=>{
'use strict';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const FIXED_MAX_CM=600;
let syncing=false;

const style=document.createElement('style');
style.id='fish-specimen-lab-v5-style';
style.textContent=`
/* Calm specimen lab. One fixed catalog scale: 600 cm = 6 blocks. */
#fish-highlight-layer .fish-lab-workspace{display:block!important;grid-template-columns:none!important}
#fish-highlight-layer .fish-lab-specimen-card{width:100%!important;min-width:0!important;background:#081b28!important;box-shadow:none!important}
#fish-highlight-layer .fish-lab-render-stage{height:clamp(500px,62vh,700px)!important;min-height:500px!important;margin-top:14px!important;background:#071a27!important}
#fish-highlight-layer .fish-lab-render-shell{left:3%!important;right:3%!important;top:6%!important;bottom:16%!important}
#fish-highlight-layer .fish-lab-water-grid{opacity:.12!important;background-size:40px 40px!important}
#fish-highlight-layer .fish-lab-orbit{display:none!important;animation:none!important}
#fish-highlight-layer .fish-lab-render-stage::after{display:none!important;content:none!important}
#fish-highlight-layer .fish-lab-global-scale-note{display:none!important}
#fish-highlight-layer .fish-lab-render-shell img{width:var(--fixed-fish-width,0px)!important;opacity:0!important;filter:none!important;transition:none!important}
#fish-highlight-layer .fish-lab-render-stage.fish-scale-ready .fish-lab-render-shell img{opacity:1!important}
#fish-highlight-layer .fish-lab-ruler{width:var(--fixed-block-px,0px)!important;transition:none!important}
#fish-highlight-layer .fish-lab-console{display:block!important;width:100%!important;margin-top:14px!important;padding:13px!important;border:1px solid #285467!important;border-radius:12px!important;background:#081b28!important;box-shadow:none!important}
#fish-highlight-layer .fish-lab-control-panel-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;margin-bottom:12px!important;padding-bottom:10px!important;border-bottom:1px solid #234957!important}
#fish-highlight-layer .fish-lab-control-panel-head h2{margin:0;color:#f5faf9;font:700 16px/1.1 Georgia,serif}
#fish-highlight-layer .fish-lab-score-head{display:flex!important;align-items:center!important;gap:9px!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;min-height:0!important;height:auto!important}
#fish-highlight-layer .fish-lab-score-head>div{display:flex!important;align-items:baseline!important;gap:8px!important;flex-direction:row!important}
#fish-highlight-layer .fish-lab-score-head span{font-size:7px!important;color:#6f98a3!important}
#fish-highlight-layer .fish-lab-score-head strong{font-size:clamp(21px,1.8vw,29px)!important;color:#ecf7f6!important}
#fish-highlight-layer .fish-lab-live-dot{display:none!important}
#fish-highlight-layer .fish-lab-control-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;border:1px solid #285165!important;border-radius:9px!important;overflow:hidden!important;background:#071923!important}
#fish-highlight-layer .fish-lab-control-grid .fish-lab-control-group{min-width:0!important;padding:12px!important;border-right:1px solid #234957!important}
#fish-highlight-layer .fish-lab-control-grid .fish-lab-control-group:last-child{border-right:0!important}
#fish-highlight-layer .fish-lab-control-group[data-size-linked]::after{content:'LINKED';display:block;margin-top:4px;color:#4d9998;font:800 6px/1 ui-monospace,monospace;letter-spacing:.08em}
#fish-highlight-layer .fish-lab-breakdown{margin-top:10px!important;border-color:#244b59!important;background:#071923!important}
#fish-highlight-layer .fish-lab-breakdown .fish-lab-fact{background:transparent!important;padding:7px 9px!important}
#fish-highlight-layer .fish-lab-multiplier{margin-top:8px!important}
#fish-highlight-layer .fish-lab-panel,#fish-highlight-layer .fish-lab-accordion{background:#081b28!important;box-shadow:none!important}
#fish-highlight-layer .fish-lab-ruler-ticks{opacity:.65!important}
#fish-highlight-layer .fish-lab-block-icon{box-shadow:none!important}
#fish-highlight-layer .fish-highlight-modal{background:#061722!important;box-shadow:0 24px 70px rgba(0,0,0,.46)!important}
#fish-highlight-layer .fish-highlight-modal::before{display:none!important}
@media(max-width:1050px){#fish-highlight-layer .fish-lab-control-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}#fish-highlight-layer .fish-lab-control-grid .fish-lab-control-group:nth-child(2){border-right:0!important}#fish-highlight-layer .fish-lab-control-grid .fish-lab-control-group:nth-child(-n+2){border-bottom:1px solid #234957!important}}
@media(max-width:700px){#fish-highlight-layer .fish-lab-render-stage{height:400px!important;min-height:400px!important}#fish-highlight-layer .fish-lab-control-panel-head{align-items:flex-start!important;flex-direction:column!important}#fish-highlight-layer .fish-lab-control-grid{grid-template-columns:1fr!important}#fish-highlight-layer .fish-lab-control-grid .fish-lab-control-group{border-right:0!important;border-bottom:1px solid #234957!important}#fish-highlight-layer .fish-lab-control-grid .fish-lab-control-group:last-child{border-bottom:0!important}}
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
  const min=Number(c.len.dataset.bodyMin??c.len.min);
  const max=Number(c.len.dataset.bodyMax??c.len.max);
  return {min:Number.isFinite(min)?min:0,max:Number.isFinite(max)&&max>min?max:min+1};
}
function percentileFloor(c){return c.condition?.value==='perfect_specimen'?95:0;}
function lengthFromPercent(c,p){const {min,max}=bodyBounds(c);return min+(max-min)*(clamp(p,0,100)/100);}
function percentFromLength(c,length){const {min,max}=bodyBounds(c);return clamp(((length-min)/(max-min))*100,0,100);}
function fireInput(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
function updateVisibleBounds(c){
  const floor=percentileFloor(c),{max}=bodyBounds(c),effectiveMin=lengthFromPercent(c,floor);
  c.pct.min=String(floor);c.len.min=String(effectiveMin);c.len.max=String(max);
  const pctMin=c.root.querySelector('[data-live-percentile-min]'),lenMin=c.root.querySelector('[data-live-length-min]'),lenMax=c.root.querySelector('[data-live-length-max]');
  if(pctMin)pctMin.textContent=floor?`${floor}th`:'0th';
  if(lenMin)lenMin.textContent=`${effectiveMin.toFixed(1)} cm`;
  if(lenMax)lenMax.textContent=`${max.toFixed(1)} cm`;
}
function applyFixedScale(c){
  const stage=c.root.querySelector('[data-live-render-stage]'),img=c.root.querySelector('[data-live-render-img]');
  if(!stage||!img)return;
  const usable=Math.max(240,stage.clientWidth-120);
  const blockPx=usable/(FIXED_MAX_CM/100);
  const currentCm=Number(c.len.value)||0;
  const fishPx=Math.max(2,(currentCm/100)*blockPx);
  stage.style.setProperty('--fixed-block-px',`${blockPx}px`);
  stage.style.setProperty('--fixed-fish-width',`${fishPx}px`);
  stage.dataset.scaleMode='global';
  stage.classList.add('fish-scale-ready');
}
function syncFromPercent(c,requested=Number(c.pct.value)){
  if(syncing)return;syncing=true;rememberBodyBounds(c);
  const p=clamp(requested,percentileFloor(c),100),length=lengthFromPercent(c,p);
  c.pct.value=String(p);c.len.value=String(length);updateVisibleBounds(c);fireInput(c.pct);fireInput(c.len);syncing=false;
  applyFixedScale(c);
}
function syncFromLength(c,requested=Number(c.len.value)){
  if(syncing)return;syncing=true;rememberBodyBounds(c);
  const {max}=bodyBounds(c),floor=percentileFloor(c),minimum=lengthFromPercent(c,floor),length=clamp(requested,minimum,max),p=percentFromLength(c,length);
  c.len.value=String(length);c.pct.value=String(p);updateVisibleBounds(c);fireInput(c.pct);fireInput(c.len);syncing=false;
  applyFixedScale(c);
}
function restructure(c){
  const console=c.root.querySelector('.fish-lab-console');if(!console||console.dataset.v5==='1')return;
  console.dataset.v5='1';
  const score=console.querySelector('.fish-lab-score-head'),groups=[...console.querySelectorAll(':scope > .fish-lab-control-group')],breakdown=console.querySelector('.fish-lab-breakdown'),multiplier=console.querySelector('.fish-lab-multiplier');
  const head=document.createElement('div');head.className='fish-lab-control-panel-head';head.innerHTML='<h2>Specimen controls</h2>';if(score)head.append(score);
  const grid=document.createElement('div');grid.className='fish-lab-control-grid';groups.forEach(g=>grid.append(g));
  console.replaceChildren(head,grid);if(breakdown)console.append(breakdown);if(multiplier)console.append(multiplier);
  c.pct.closest('.fish-lab-control-group')?.setAttribute('data-size-linked','');c.len.closest('.fish-lab-control-group')?.setAttribute('data-size-linked','');
}
function initialize({bodyChanged=false}={}){
  const c=getControls();if(!c)return;
  if(bodyChanged)rememberBodyBounds(c,true);else rememberBodyBounds(c);
  restructure(c);updateVisibleBounds(c);
  if(bodyChanged)syncFromPercent(c,Number(c.pct.value));else syncFromLength(c,Number(c.len.value));
  applyFixedScale(c);
}

document.addEventListener('input',e=>{
  if(syncing)return;const c=getControls();if(!c)return;
  if(e.target===c.pct){syncFromPercent(c,Number(c.pct.value));return;}
  if(e.target===c.len){syncFromLength(c,Number(c.len.value));return;}
  if(e.target===c.condition)requestAnimationFrame(()=>syncFromPercent(c,Number(c.pct.value)));
},true);
document.addEventListener('change',e=>{if(syncing)return;const c=getControls();if(c&&e.target===c.condition)requestAnimationFrame(()=>syncFromPercent(c,Number(c.pct.value)));},true);
document.addEventListener('click',e=>{if(syncing||!e.target.closest('[data-body]'))return;requestAnimationFrame(()=>requestAnimationFrame(()=>initialize({bodyChanged:true})));});
window.addEventListener('resize',()=>{const c=getControls();if(c)applyFixedScale(c);});

const observer=new MutationObserver(()=>{if(document.querySelector('#fish-highlight-layer:not([hidden]) [data-live-percentile-input]'))requestAnimationFrame(()=>requestAnimationFrame(()=>initialize()));});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
})();