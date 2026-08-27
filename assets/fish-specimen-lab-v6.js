(()=>{
'use strict';

const FIXED_MAX_CM=600;
const layer=()=>document.getElementById('fish-highlight-layer');

const style=document.createElement('style');
style.id='fish-specimen-lab-v6-style';
style.textContent=`
/* Passive stability guard. Never cancels the modal controller's lifecycle. */
#fish-highlight-layer .fish-highlight-modal{
  transform:none!important;
}
#fish-highlight-layer .fish-lab-render-shell img[data-live-render-img]{
  width:var(--fish-width-fixed,var(--fish-width,auto))!important;
  max-width:none!important;
  transition:none!important;
  animation:none!important;
}
#fish-highlight-layer .fish-lab-ruler{
  width:var(--block-px-fixed,var(--block-px))!important;
}
#fish-highlight-layer .fish-lab-ruler-ticks{width:100%!important}
`;
document.head.append(style);

function applyFixedScale(){
  const root=layer();
  if(!root||root.hidden)return;
  const stage=root.querySelector('[data-live-render-stage]');
  const img=root.querySelector('[data-live-render-img]');
  const len=root.querySelector('[data-live-length-input]');
  if(!stage||!img||!len||stage.clientWidth<=0)return;

  const usable=Math.max(240,stage.clientWidth-120);
  const blockPx=usable/(FIXED_MAX_CM/100);
  const currentCm=Math.max(0,Number(len.value)||0);
  const fishPx=Math.max(2,(currentCm/100)*blockPx);

  stage.style.setProperty('--block-px-fixed',`${blockPx}px`);
  stage.style.setProperty('--fish-width-fixed',`${fishPx}px`);

  const out=root.querySelector('[data-live-scale]');
  if(out)out.textContent=`${currentCm.toLocaleString(undefined,{maximumFractionDigits:1})} cm · ${(currentCm/100).toFixed(2)} blocks`;
}

function settle(){
  applyFixedScale();
  requestAnimationFrame(applyFixedScale);
}

const observer=new MutationObserver(()=>{
  const root=layer();
  if(root&&!root.hidden)settle();
});

function observeWhenReady(){
  const root=layer();
  if(!root)return void requestAnimationFrame(observeWhenReady);
  observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
}
observeWhenReady();

document.addEventListener('input',e=>{
  if(e.target.closest?.('#fish-highlight-layer'))requestAnimationFrame(applyFixedScale);
},false);
document.addEventListener('change',e=>{
  if(e.target.closest?.('#fish-highlight-layer'))requestAnimationFrame(applyFixedScale);
},false);
document.addEventListener('click',e=>{
  if(e.target.closest?.('#fish-highlight-layer [data-body]'))requestAnimationFrame(()=>requestAnimationFrame(applyFixedScale));
},false);
window.addEventListener('resize',()=>requestAnimationFrame(applyFixedScale));
})();