(()=>{
'use strict';

const article=document.getElementById('fish-article');
const catalog=document.getElementById('catalog-view');
const results=document.getElementById('fish-results');
if(!article||!catalog||!results)return;

let pageScrollY=window.scrollY;
let closing=false;
let modalWasOpen=false;

const backdrop=document.createElement('button');
backdrop.type='button';
backdrop.id='fish-modal-backdrop';
backdrop.hidden=true;
backdrop.setAttribute('aria-label','Close fish details');
document.body.append(backdrop);

function addCloseButton(){
  if(article.querySelector('.fish-modal-close-x'))return;
  const close=document.createElement('button');
  close.type='button';
  close.className='fish-modal-close-x';
  close.setAttribute('aria-label','Close fish details');
  close.textContent='×';
  article.prepend(close);
}

function activateModal(){
  if(article.hidden)return;
  catalog.hidden=false;
  article.classList.add('fish-modal-card');
  article.classList.remove('is-closing');
  addCloseButton();
  document.body.classList.add('fish-modal-open');
  backdrop.hidden=false;
  modalWasOpen=true;

  requestAnimationFrame(()=>{
    window.scrollTo({top:pageScrollY,left:0,behavior:'auto'});
    requestAnimationFrame(()=>{
      article.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
  });
}

function hardCleanup(){
  article.classList.remove('is-open','is-closing','fish-modal-card');
  backdrop.classList.remove('is-open');
  backdrop.hidden=true;
  document.body.classList.remove('fish-modal-open');
  catalog.hidden=false;
  modalWasOpen=false;
  closing=false;
  window.scrollTo({top:pageScrollY,left:0,behavior:'auto'});
}

function closeModal(){
  if(article.hidden||closing)return;
  closing=true;
  article.classList.remove('is-open');
  article.classList.add('is-closing');
  backdrop.classList.remove('is-open');

  const finish=()=>{
    article.hidden=true;
    article.innerHTML='';
    document.title='Tideborne Fish Wiki';
    history.pushState({},'',location.pathname+location.search);
    hardCleanup();
  };

  if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();
  else setTimeout(finish,220);
}

/* Save the exact catalog position before the existing Fish Wiki click handler opens a fish. */
results.addEventListener('click',e=>{
  if(e.target.closest('[data-id]'))pageScrollY=window.scrollY;
},true);

/* The core Fish Wiki creates the full detail article. Turn that result into a modal. */
new MutationObserver(()=>{
  if(!article.hidden){
    if(modalWasOpen)article.scrollTop=0;
    activateModal();
  }else if(modalWasOpen){
    hardCleanup();
  }
}).observe(article,{attributes:true,attributeFilter:['hidden'],childList:true});

/* Close from the X, old back button, or dimmed background without letting legacy handlers jump the page. */
document.addEventListener('click',e=>{
  const close=e.target.closest('.fish-modal-close-x,#back-catalog,#fish-modal-backdrop');
  if(!close||article.hidden)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  closeModal();
},true);

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape'||article.hidden)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  closeModal();
},true);

/* If a deep link opened a fish before this controller loaded, convert it immediately. */
if(!article.hidden){
  pageScrollY=window.scrollY;
  activateModal();
}
})();
