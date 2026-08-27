(()=>{
'use strict';

const FIXED_MAX_CM=600;
const layer=()=>document.getElementById('fish-highlight-layer');
const modal=()=>layer()?.querySelector('.fish-highlight-modal');

const style=document.createElement('style');
style.id='fish-specimen-lab-v6-style';
style.textContent=`
/* v6 owns specimen sizing. Older scripts may write --fish-width/inline width,
   but neither can affect the rendered specimen anymore. */
#fish-highlight-layer .fish-lab-render-shell img[data-live-render-img]{
  width:var(--fish-width-fixed,0px)!important;
  max-width:none!important;
  visibility:hidden!important;
  transition:none!important;
  animation:none!important;
}
#fish-highlight-layer .fish-lab-render-stage[data-fixed-scale-ready="1"] .fish-lab-render-shell img[data-live-render-img]{visibility:visible!important}
#fish-highlight-layer .fish-lab-ruler{width:var(--block-px-fixed,var(--block-px))!important}
#fish-highlight-layer .fish-lab-ruler-ticks{width:100%!important}
`;
document.head.append(style);

function applyFixedScale(){
  const root=layer();
  if(!root||root.hidden)return;
  const stage=root.querySelector('[data-live-render-stage]');
  const img=root.querySelector('[data-live-render-img]');
  const len=root.querySelector('[data-live-length-input]');
  if(!stage||!img||!len)return;

  const usable=Math.max(240,stage.clientWidth-120);
  const blockPx=usable/(FIXED_MAX_CM/100);
  const currentCm=Math.max(0,Number(len.value)||0);
  const fishPx=Math.max(2,(currentCm/100)*blockPx);

  stage.style.setProperty('--block-px-fixed',`${blockPx}px`);
  stage.style.setProperty('--fish-width-fixed',`${fishPx}px`);
  stage.dataset.fixedScaleReady='1';

  const out=root.querySelector('[data-live-scale]');
  if(out)out.textContent=`${currentCm.toLocaleString(undefined,{maximumFractionDigits:1})} cm · ${(currentCm/100).toFixed(2)} blocks`;
}

function cancelOpenScaleAnimation(){
  const root=layer(),box=modal();
  if(!root||root.hidden||!box)return;
  // showRecord starts its transform animation synchronously. MutationObserver runs
  // before the next paint, so canceling here prevents the card/fish from ever
  // being drawn at an intermediate scale.
  for(const animation of box.getAnimations()) animation.cancel();
  box.style.transform='none';
  box.style.opacity='1';
  const backdrop=root.querySelector('.fish-highlight-backdrop');
  if(backdrop){
    for(const animation of backdrop.getAnimations()) animation.cancel();
    backdrop.style.opacity='1';
  }
}

function settleOpen(){
  const root=layer();
  if(!root||root.hidden)return;
  cancelOpenScaleAnimation();
  // Apply immediately, then once more after layout stabilizes. The second pass
  // computes the same formula, only with the final stage width.
  applyFixedScale();
  requestAnimationFrame(applyFixedScale);
}

const observer=new MutationObserver(mutations=>{
  const root=layer();
  if(!root||root.hidden)return;
  if(mutations.some(m=>m.type==='childList'||(m.type==='attributes'&&m.attributeName==='hidden'))) settleOpen();
});

function observeWhenReady(){
  const root=layer();
  if(!root)return void requestAnimationFrame(observeWhenReady);
  observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
}
observeWhenReady();

// V5 synchronizes length/percentile. V6 only paints the final physical width,
// after those controls finish updating.
document.addEventListener('input',e=>{
  if(!e.target.closest?.('#fish-highlight-layer'))return;
  if(e.target.matches('[data-live-length-input],[data-live-percentile-input],[data-live-condition]')) requestAnimationFrame(applyFixedScale);
},false);
document.addEventListener('change',e=>{
  if(e.target.closest?.('#fish-highlight-layer')) requestAnimationFrame(applyFixedScale);
},false);
document.addEventListener('click',e=>{
  if(e.target.closest?.('#fish-highlight-layer [data-body]')) requestAnimationFrame(()=>requestAnimationFrame(applyFixedScale));
},false);
window.addEventListener('resize',()=>requestAnimationFrame(applyFixedScale));
})();