(()=>{
  const dialog=document.getElementById('search-dialog'),input=document.getElementById('search-input'),results=document.getElementById('search-results');
  if(!dialog||!input||!results)return;
  let index=null,loading=null;
  const load=()=>index?Promise.resolve(index):(loading||(loading=fetch('assets/fish-search-index.json').then(r=>r.ok?r.json():[]).then(v=>index=v).catch(()=>index=[])));
  function escapeHtml(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
  async function augment(){const q=input.value.trim().toLowerCase();if(q.length<2)return;const fish=await load();if(input.value.trim().toLowerCase()!==q)return;const hits=fish.filter(f=>[f.name,f.id,f.mod,f.group,f.rarity,f.location].join(' ').toLowerCase().includes(q)).slice(0,8);if(!hits.length)return;const block=document.createElement('div');block.className='fish-search-group';block.innerHTML=`<div style="padding:10px 14px 5px;color:var(--muted);font:10px ui-monospace,monospace;text-transform:uppercase;letter-spacing:.1em">Fish Wiki</div>${hits.map(f=>`<a href="fish/#${encodeURIComponent(f.id)}" style="display:block;padding:10px 14px;text-decoration:none;border-top:1px solid var(--line)"><strong>${escapeHtml(f.name)}</strong><small style="display:block;color:var(--muted);margin-top:2px">Fish Wiki · ${escapeHtml(f.mod)} · ${escapeHtml(f.location||f.group)}</small></a>`).join('')}`;results.append(block)}
  input.addEventListener('input',()=>setTimeout(augment,0));
  dialog.addEventListener('toggle',()=>{if(dialog.open)load()});
  const nav=document.getElementById('side-nav');if(nav&&!nav.querySelector('[data-fish-wiki-link]')){const a=document.createElement('a');a.href='fish/';a.dataset.fishWikiLink='';a.textContent='Fish Wiki';a.className='nav-link';a.style.marginTop='10px';nav.append(a)}
})();
