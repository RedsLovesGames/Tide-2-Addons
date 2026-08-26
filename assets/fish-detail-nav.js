(()=>{
'use strict';
const article=document.getElementById('fish-article');
if(!article)return;
const slug=id=>String(id).replace(':','__');
const unslug=s=>String(s).replace('__',':');
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
let ordered=[];
fetch('../assets/fish-search-index.json')
  .then(r=>{if(!r.ok)throw new Error(`fish-search-index.json: HTTP ${r.status}`);return r.json()})
  .then(rows=>{ordered=[...rows].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));mount()})
  .catch(err=>console.error('Fish detail navigation data load failed',err));

function mount(){
  const existing=[...article.querySelectorAll('.specimen-nav')];
  if(existing.length>1)existing.slice(1).forEach(n=>n.remove());
  if(!ordered.length||article.hidden||!article.querySelector('.article-actions')||article.querySelector('.specimen-nav'))return;
  const current=unslug(decodeURIComponent(location.hash.slice(1)));
  const idx=ordered.findIndex(r=>r.id===current);
  if(idx<0)return;
  const prev=ordered[(idx-1+ordered.length)%ordered.length];
  const next=ordered[(idx+1)%ordered.length];
  article.querySelector('.article-actions').insertAdjacentHTML('afterend',`<nav class="specimen-nav" aria-label="Fish navigation"><a href="#${esc(slug(prev.id))}" aria-label="Previous fish: ${esc(prev.name)}">← ${esc(prev.name)}</a><span>${idx+1} / ${ordered.length}</span><a href="#${esc(slug(next.id))}" aria-label="Next fish: ${esc(next.name)}">${esc(next.name)} →</a></nav>`);
}

new MutationObserver(()=>requestAnimationFrame(mount)).observe(article,{childList:true,subtree:false,attributes:true,attributeFilter:['hidden']});
window.addEventListener('hashchange',()=>setTimeout(mount,0));
setTimeout(mount,250);
})();
