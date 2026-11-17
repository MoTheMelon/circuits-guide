/* App shell: header, table-of-contents drawer, home cards, prev/next, routing.
   Runs in two modes:
   - multi-page (GitHub Pages / local files): each topic is its own topics/<id>.html
   - bundle (data-bundle="1" on <body>, made by tools/bundle.py): every page in one
     file, one shown at a time, routed by #<id> in the URL. */

/* label table cells for the phone layout of .stack tables */
new MutationObserver(()=>{for(const c of document.querySelectorAll('.stack td:not([data-l])')){let i=0,p=c;while(p=p.previousElementSibling)i+=p.colSpan;c.dataset.l=c.closest('table').rows[0].cells[i]?.textContent||''}}).observe(document,{childList:true,subtree:true});

const BUNDLE=document.body.dataset.bundle==='1',ROOT=document.body.dataset.root||'.';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const BYID=Object.fromEntries(TOPICS.map((t,i)=>[t.id,{...t,i}]));
const GROUPS=[];TOPICS.forEach(t=>{let g=GROUPS.find(x=>x.n===t.g);if(!g)GROUPS.push(g={n:t.g,it:[]});g.it.push(t)});
const href=id=>BUNDLE?(id?'#'+id:'#'):(id?`${ROOT}/topics/${id}.html`:`${ROOT}/index.html`);
const store={get(k){try{return JSON.parse(localStorage.getItem('cfg:'+k))}catch(e){return null}},set(k,v){try{localStorage.setItem('cfg:'+k,JSON.stringify(v))}catch(e){}}};

/* ---- shell ---- */
document.body.insertAdjacentHTML('afterbegin',`
<header class="top">
  <button class="hb" id="hb" aria-label="Toggle table of contents" aria-controls="toc" aria-expanded="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
  </button>
  <a class="brand" href="${href('')}">Circuits Field Guide</a>
  <span class="cur" id="cur"></span>
</header>
<nav id="toc" aria-label="Table of contents">
  <a class="thome" href="${href('')}">All topics</a>
  <input class="tsearch" id="tq" type="search" placeholder="Filter topics…" aria-label="Filter topics">
  <div class="tbtns"><button type="button" id="tx">Expand all</button><button type="button" id="tc">Collapse all</button></div>
  <div id="tlist">${GROUPS.map(g=>`<details data-g="${esc(g.n)}"><summary>${esc(g.n)}<small>${g.it.length}</small></summary>${g.it.map(t=>`<a href="${href(t.id)}" data-id="${t.id}">${esc(t.t)}</a>`).join('')}</details>`).join('')}<p class="none" id="tnone" hidden>No topics match.</p></div>
</nav>
<div class="scrim" id="scrim"></div>`);

const body=document.body,hb=$('#hb'),nav=$('#toc'),wide=()=>innerWidth>=1100;
function setNav(o){body.classList.toggle('nav-open',o);hb.setAttribute('aria-expanded',String(o))}
setNav(wide()&&store.get('nav')!==false);
hb.addEventListener('click',()=>{const o=!body.classList.contains('nav-open');setNav(o);if(wide())store.set('nav',o)});
$('#scrim').addEventListener('click',()=>setNav(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!wide())setNav(false)});
nav.addEventListener('click',e=>{if(e.target.closest('a')&&!wide())setNav(false)});

const closed=new Set(store.get('closed')||[]);
$$('#tlist details').forEach(d=>{d.open=!closed.has(d.dataset.g);d.addEventListener('toggle',()=>{d.open?closed.delete(d.dataset.g):closed.add(d.dataset.g);store.set('closed',[...closed])})});
$('#tx').addEventListener('click',()=>$$('#tlist details').forEach(d=>d.open=true));
$('#tc').addEventListener('click',()=>$$('#tlist details').forEach(d=>d.open=false));
$('#tq').addEventListener('input',e=>{const q=e.target.value.trim().toLowerCase();let any=0;$$('#tlist details').forEach(d=>{let n=0;$$('a',d).forEach(a=>{const m=!q||a.textContent.toLowerCase().includes(q)||d.dataset.g.toLowerCase().includes(q);a.hidden=!m;if(m)n++});d.hidden=!n;if(q&&n)d.open=true;any+=n});$('#tnone').hidden=!!any});

function setCur(id){
  $$('#tlist a.on').forEach(a=>a.classList.remove('on'));
  const t=BYID[id];$('#cur').textContent=t?t.t:'';
  const a=$(`#tlist a[data-id="${id}"]`);if(!a)return;
  a.classList.add('on');a.setAttribute('aria-current','page');
  const d=a.closest('details');if(d&&!d.open)d.open=true;
  requestAnimationFrame(()=>{const top=a.offsetTop,h=nav.clientHeight;if(top<nav.scrollTop+40||top>nav.scrollTop+h-60)nav.scrollTop=top-h/2});
}

/* ---- home page ---- */
const home=$('#home');
if(home){
  home.innerHTML=GROUPS.map(g=>`<section class="grp"><h2>${esc(g.n)}</h2><div class="cards">${g.it.map(t=>`<a class="card" href="${href(t.id)}"><span class="ic">${symSVG(t.s)}</span><span><b>${esc(t.t)}</b><i>${esc(t.d)}</i></span></a>`).join('')}</div></section>`).join('');
  const m=$('#meta');if(m)m.textContent=`${TOPICS.length} topics · ${GROUPS.length} sections · ${Object.keys(SYM).length} schematic symbols`;
  const st=$('#start');if(st)st.href=href(TOPICS[0].id);
}

/* ---- topic pages: kicker, cross-links, prev/next ---- */
$$('a[data-topic]').forEach(a=>a.href=href(a.dataset.topic));
$$('article.topic').forEach(art=>{
  const t=BYID[art.dataset.id];if(!t)return;
  const pv=TOPICS[t.i-1],nx=TOPICS[t.i+1];
  art.insertAdjacentHTML('afterbegin',`<p class="kick"><a href="${href('')}">Guide</a> <span aria-hidden="true">›</span> ${esc(t.g)} <span class="mut">· ${t.i+1} of ${TOPICS.length}</span></p>`);
  art.insertAdjacentHTML('beforeend',`<nav class="pn" aria-label="Previous and next topic">${pv?`<a class="prev" href="${href(pv.id)}"><small>← Previous</small><b>${esc(pv.t)}</b></a>`:'<span></span>'}${nx?`<a class="next" href="${href(nx.id)}"><small>Next →</small><b>${esc(nx.t)}</b></a>`:''}</nav>`);
});

$('main').insertAdjacentHTML('beforeend','<div class="wrap"><footer>Simulations use idealized textbook models (square-law MOSFET, Shockley diode, ideal op-amp with rail clipping, first-order magnet field) — good for intuition and first-pass design. Confirm part-specific numbers against the datasheet.</footer></div>');

/* ---- diagrams and simulations ---- */
renderSyms();ccTable();mountSims();

/* ---- routing ---- */
const TITLE='Circuits Field Guide';
if(BUNDLE){
  const show=()=>{
    const h=location.hash.slice(1),id=BYID[h]?h:'';
    $$('.view').forEach(v=>v.hidden=(v.dataset.id||'')!==id);
    document.title=(id?BYID[id].t+' · ':'')+TITLE;
    setCur(id);scrollTo(0,0);
    if(!wide())setNav(false);
  };
  addEventListener('hashchange',show);show();
}else{
  setCur(body.dataset.page||'');
}
