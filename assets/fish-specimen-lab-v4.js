(()=>{
'use strict';

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
let syncing=false;

const style=document.createElement('style');
style.id='fish-specimen-lab-v4-style';
style.textContent=`
/* v4: vertical specimen workspace + unified size/percentile control */
.fish-lab-workspace{grid-template-columns:1fr!important;gap:14px!important}
.fish-lab-specimen-card{width:100%!important}
.fish-lab-render-stage{height:clamp(430px,58vh,680px)!important;min-height:430px!important}
.fish-lab-render-shell{left:2%!important;right:2%!important;top:5%!important;bottom:17%!important}
.fish-lab-console{width:100%!important;display:grid!important;grid-template-columns:minmax(220px,.72fr) minmax(260px,1fr) minmax(320px,1.2fr)!important;gap:12px 16px!important;align-items:start!important}
.fish-lab-score-head{grid-row:1 / span 2!important;grid-column:1!important;height:100%!important;align-items:flex-start!important;padding:12px!important;border:1px solid #285467!important;border-radius:10px!important;background:linear-gradient(145deg,rgba(14,48,61,.7),rgba(6,25,35,.45))!important}
.fish-lab-console>.fish-lab-control-group:nth-of-type(1){grid-column:2!important;grid-row:1!important}
.fish-lab-console>.fish-lab-control-group:nth-of-type(2){grid-column:2!important;grid-row:2!important}
.fish-lab-console>.fish-lab-control-group:nth-of-type(3){grid-column:3!important;grid-row:1!important}
.fish-lab-console>.fish-lab-control-group:nth-of-type(4){grid-column:3!important;grid-row:2!important}
.fish-lab-breakdown{grid-column:1 / -1!important;grid-row:3!important}
.fish-lab-multiplier{grid-column:1 / -1!important;grid-row:4!important}
.fish-lab-render-stage{background:radial-gradient(circle at 50% 40%,rgba(62,162,163,.20),transparent 54%),linear-gradient(180deg,#08202e,#06151f)!important}
.fish-lab-render-stage::after{content:'SPECIMEN SCALE';position:absolute;right:14px;top:12px;color:#4f7f8c;font:800 7px/1 ui-monospace,monospace;letter-spacing:.14em}
.fish-lab-control-group[data-size-linked]::after{content:'SIZE ↔ PERCENTILE LINKED';display:block;margin-top:2px;color:#4fd7cf;font:800 6px/1 ui-monospace,monospace;letter-spacing:.08em}
@media(max-width:1000px){
  .fish-lab-console{grid-template-columns:1fr 1fr!important}
  .fish-lab-score-head{grid-column:1 / -1!important;grid-row:auto!important;height:auto!important}
  .fish-lab-console>.fish-lab-control-group:nth-of-type(1),.fish-lab-console>.fish-lab-control-group:nth-of-type(2),.fish-lab-console>.fish-lab-control-group:nth-of-type(3),.fish-lab-console>.fish-lab-control-group:nth-of-type(4){grid-column:auto!important;grid-row:auto!important}
  .fish-lab-breakdown,.fish-lab-multiplier{grid-column:1 / -1!important;grid-row:auto!important}
}
@media(max-width:700px){
  .fish-lab-render-stage{height:360px!important;min-height:360px!important}
  .fish-lab-console{grid-template-columns:1fr!important}
  .fish-lab-score-head,.fish-lab-breakdown,.fish-lab-multiplier{grid-column:1!important}
}
`;
document.head.append(style);

function layer(){return document.getElementById('fish-highlight-layer');}
function controls(){
  const root=layer();
  if(!root||root.hidden)return null;
  const pct=root.querySelector('[data-live-percentile-input]');
  const len=root.querySelector('[data-live-length-input]');
  const condition=root.querySelector('[data-live-condition]');
  if(!pct||!len)return null;
  return {root,pct,len,condition};
}
function minPercent(c){return c.condition?.value==='perfect_specimen'?95:0;}
function bounds(c){
  let min=Number(c.len.min),max=Number(c.len.max);
  if(!Number.isFinite(min))min=0;
  if(!Number.isFinite(max)||max<=min)max=min+1;
  return {min,max};
}
function lengthFromPercent(c,p){
  const {min,max}=bounds(c);
  return min+(max-min)*(clamp(p,0,100)/100);
}
function percentFromLength(c,length){
  const {min,max}=bounds(c);
  return clamp(((length-min)/(max-min))*100,0,100);
}
function dispatchInput(el){el.dispatchEvent(new Event('input',{bubbles:true}));}
function applyLargePhysicalScale(c){
  const stage=c.root.querySelector('[data-live-render-stage]');
  const img=c.root.querySelector('[data-live-render-img]');
  if(!stage||!img)return;
  const run=()=>{
    const length=Number(c.len.value)||0;
    const blocks=Math.max(.01,length/100);
    const aspect=img.naturalWidth&&img.naturalHeight?img.naturalHeight/img.naturalWidth:.45;
    const preferred=clamp(stage.clientWidth*.28,220,360);
    const fitW=Math.max(160,stage.clientWidth-96)/blocks;
    const fitH=Math.max(140,stage.clientHeight-130)/Math.max(blocks*aspect,.01);
    const blockPx=Math.max(10,Math.min(preferred,fitW,fitH));
    const fishPx=Math.max(3,blocks*blockPx);
    stage.style.setProperty('--block-px',`${blockPx}px`);
    stage.style.setProperty('--fish-width',`${fishPx}px`);
    stage.dataset.scaleMode=blockPx<preferred*.97?'fit':'physical';
    img.style.width=`${fishPx}px`;
  };
  if(img.complete&&img.naturalWidth)run();else img.addEventListener('load',run,{once:true});
}
function syncFromPercent(c,requested=Number(c.pct.value)){
  if(syncing)return;
  syncing=true;
  const p=clamp(requested,minPercent(c),100);
  const length=lengthFromPercent(c,p);
  c.pct.value=String(p);
  c.len.value=String(length);
  dispatchInput(c.pct);
  dispatchInput(c.len);
  syncing=false;
  requestAnimationFrame(()=>applyLargePhysicalScale(c));
}
function syncFromLength(c,requested=Number(c.len.value)){
  if(syncing)return;
  syncing=true;
  const {min,max}=bounds(c);
  let length=clamp(requested,min,max);
  let p=percentFromLength(c,length);
  const floor=minPercent(c);
  if(p<floor){p=floor;length=lengthFromPercent(c,p);}
  c.len.value=String(length);
  c.pct.value=String(p);
  dispatchInput(c.pct);
  dispatchInput(c.len);
  syncing=false;
  requestAnimationFrame(()=>applyLargePhysicalScale(c));
}
function initialize(){
  const c=controls();if(!c)return;
  const pctGroup=c.pct.closest('.fish-lab-control-group');
  const lenGroup=c.len.closest('.fish-lab-control-group');
  pctGroup?.setAttribute('data-size-linked','');
  lenGroup?.setAttribute('data-size-linked','');
  syncFromPercent(c,Number(c.pct.value));
}

document.addEventListener('input',e=>{
  if(syncing)return;
  const c=controls();if(!c)return;
  if(e.target===c.pct){syncFromPercent(c,Number(c.pct.value));return;}
  if(e.target===c.len){syncFromLength(c,Number(c.len.value));return;}
  if(e.target===c.condition){requestAnimationFrame(()=>syncFromPercent(c,Number(c.pct.value)));}
});
document.addEventListener('change',e=>{
  if(syncing)return;
  const c=controls();if(c&&e.target===c.condition)requestAnimationFrame(()=>syncFromPercent(c,Number(c.pct.value)));
});
document.addEventListener('click',e=>{
  if(syncing||!e.target.closest('[data-body]'))return;
  requestAnimationFrame(()=>{const c=controls();if(c)syncFromPercent(c,Number(c.pct.value));});
});
window.addEventListener('resize',()=>{const c=controls();if(c)applyLargePhysicalScale(c);});

const observer=new MutationObserver(()=>{
  if(document.querySelector('#fish-highlight-layer:not([hidden]) [data-live-percentile-input]'))requestAnimationFrame(()=>requestAnimationFrame(initialize));
});
observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
})();