/* Shared engine: helpers, schematic-symbol library, plotting, simulation framework.
   Loaded first on every page. */
/* ===== helpers ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const lin=(a,b,n)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
const lgs=(a,b,n)=>Array.from({length:n},(_,i)=>a*(b/a)**(i/(n-1)));
const par=(...r)=>1/r.reduce((s,x)=>s+1/x,0);
const PI2=2*Math.PI;
const VC='var(--v)',IC='var(--i)',AX='var(--aux)',MU='var(--mut)',WA='var(--warn)';
const PFX=[[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p']];
function eng(x,u='',d=3){
  if(x===undefined||x===null||isNaN(x))return '—';
  if(!isFinite(x))return '∞ '+u;
  if(Math.abs(x)<1e-15)return '0 '+u;
  const sg=x<0?'−':'';x=Math.abs(x);
  const p=PFX.find(p=>x>=p[0]*0.9995)||PFX[PFX.length-1];
  const v=x/p[0];let s=v.toPrecision(d);
  if(s.includes('e'))s=String(Math.round(v));
  if(s.includes('.'))s=s.replace(/0+$/,'').replace(/\.$/,'');
  return sg+s+' '+p[1]+u;
}
const tk=v=>eng(v,'',3).trim();
const pct=v=>(v*100).toFixed(Math.abs(v)<0.1?1:0)+' %';
const E12=[1,1.2,1.5,1.8,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2];
const E24=[1,1.1,1.2,1.3,1.5,1.6,1.8,2,2.2,2.4,2.7,3,3.3,3.6,3.9,4.3,4.7,5.1,5.6,6.2,6.8,7.5,8.2,9.1];
function eUp(r,S=E12){const e=Math.floor(Math.log10(r));for(let k=e;k<=e+1;k++)for(const m of S){const v=+(m*10**k).toPrecision(3);if(v>=r*0.999)return v}return r}

/* ===== schematic library ===== */
const ZIG='M-20 0L-16.7 -7L-10 7L-3.3 -7L3.3 7L10 -7L16.7 7L20 0';
const up=(a,inner,x=0,y=0)=>`<g transform="translate(${x} ${y}) rotate(${-a})">${inner}</g>`;
const PLUS='<path d="M-3 0h6M0 -3v6"/>',MINUS='<path d="M-3 0h6"/>';
function ah(tx,ty,dx,dy,s=5,w=2.6){const L=Math.hypot(dx,dy);dx/=L;dy/=L;const bx=tx-s*dx,by=ty-s*dy;return `<polygon class="f" points="${tx},${ty} ${bx-w*dy},${by+w*dx} ${bx+w*dy},${by-w*dx}"/>`}
const BODY={
  R:()=>`<path d="${ZIG}"/>`,
  Riec:()=>`<path d="M-20 0H-16M16 0H20"/><rect x="-16" y="-6.5" width="32" height="13"/>`,
  C:()=>`<path d="M-20 0H-4M4 0H20M-4 -12V12M4 -12V12"/>`,
  Cp:(o,a)=>`<path d="M-20 0H-4M-4 -12V12M8 -12Q2 0 8 12M5 0H20"/>`+up(a,PLUS,-12,-13),
  Cv:()=>`<path d="M-20 0H-4M4 0H20M-4 -12V12M4 -12V12M-12 12L11 -11"/>`+ah(13,-13,1,-1),
  L:o=>`<path d="M-20 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0"/>`+(o.core?'<path d="M-20 -10H20M-20 -13H20"/>':''),
  D:o=>(o.on?'<circle class="glow" r="15" style="fill:var(--lit)"/>':'')+`<path d="M-20 0H-8M8 0H20M8 -9V9"/><path class="f" d="M-8 -9L-8 9L8 0Z"/>`,
  Z:()=>`<path d="M-20 0H-8M8 0H20M4 -12L8 -9V9L12 12"/><path class="f" d="M-8 -9L-8 9L8 0Z"/>`,
  SK:()=>`<path d="M-20 0H-8M8 0H20M12 -5V-9H8V9H4V5"/><path class="f" d="M-8 -9L-8 9L8 0Z"/>`,
  LED:o=>(o.on?`<circle class="glow" r="17" style="fill:${o.col||'var(--lit)'};opacity:${o.op??.45}"/>`:'')+`<path d="M-20 0H-8M8 0H20M8 -9V9M0 -12L8 -20M6 -9L14 -17"/><path class="f" d="M-8 -9L-8 9L8 0Z"/>`+ah(8,-20,1,-1)+ah(14,-17,1,-1),
  bat:(o,a)=>`<path d="M-20 0H-4M4 0H20M-4 -14V14"/><path d="M4 -7V7" style="stroke-width:4.5"/>`+up(a,PLUS,-12,-17),
  bat2:(o,a)=>`<path d="M-20 0H-10M10 0H20M-10 -14V14M2 -14V14"/><path d="M-4 -7V7M8 -7V7" style="stroke-width:4.5"/>`+up(a,PLUS,-17,-17),
  V:(o,a)=>`<path d="M-20 0H-14M14 0H20"/><circle r="14"/>`+up(a,PLUS,-7,0)+up(a,'<path d="M-3 0h6"/>',7,0),
  AC:(o,a)=>`<path d="M-20 0H-14M14 0H20"/><circle r="14"/>`+up(a,'<path d="M-8 0q4 -9 8 0t8 0"/>'),
  I:()=>`<path d="M-20 0H-14M14 0H20M-7 0H5"/><circle r="14"/>`+ah(9,0,1,0),
  SW:o=>`<path d="M-20 0H-12M12 0H20"/><circle class="term" cx="-12" r="2.6"/><circle class="term" cx="12" r="2.6"/>`+(o.on?`<path d="M-10 -1L12 -3"/>`:`<path d="M-10 -1L9 -13"/>`),
  PB:o=>`<path d="M-20 0H-12M12 0H20"/><circle class="term" cx="-12" r="2.6"/><circle class="term" cx="12" r="2.6"/>`+(o.on?`<path d="M-15 -3H15M0 -3V-14M-5 -14H5"/>`:`<path d="M-15 -10H15M0 -10V-20M-5 -20H5"/>`),
  F:()=>`<path d="M-20 0H20"/><rect x="-13" y="-5" width="26" height="10"/>`,
  LAMP:o=>`<path d="M-20 0H-11M11 0H20"/><circle r="11" class="${o.on?'lit':''}" ${o.on&&o.op!=null?`style="fill-opacity:${o.op}"`:''}/><path d="M-7.8 -7.8L7.8 7.8M-7.8 7.8L7.8 -7.8"/>`,
  M:(o,a)=>`<path d="M-20 0H-13M13 0H20"/><circle r="13"/>`+up(a,'<text class="big" y="5.5" text-anchor="middle">M</text>'),
  LDR:()=>`<path d="${ZIG}"/><path d="M-16 -24L-8 -13M-4 -26L4 -15"/>`+ah(-7,-12,.6,.8)+ah(5,-14,.6,.8),
  TH:(o,a)=>`<path d="${ZIG}"/><path d="M-15 13L11 -13H18"/>`+up(a,'<text y="4" style="font-size:10px" text-anchor="middle">−t°</text>',-14,-14),
  COIL:()=>`<path d="M-20 0H-14M14 0H20"/><rect x="-14" y="-9" width="28" height="18"/>`,
  SOL:()=>`<path d="M-20 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0a5 5 0 0 1 10 0"/><rect x="-12" y="4" width="34" height="6"/>`,
  BUZ:(o,a)=>`<path d="M-20 0H-8M8 0H20"/><path d="M-8 -8H8V8H-8Z"/><path d="M-12 -14Q0 -24 12 -14"/>`,
  XTAL:()=>`<path d="M-20 0H-9M9 0H20M-9 -10V10M9 -10V10"/><rect x="-5" y="-12" width="10" height="24"/>`,
  SPK:()=>`<path d="M-20 0H-8M8 0H20"/><rect x="-8" y="-6" width="16" height="12"/><path d="M-8 -6L-14 -16H14L8 -6"/>`
};
const HALF={LAMP:20,M:20};
let flowOn=true;
function fdur(I){const a=Math.abs(I);if(!(a>2e-7))return 0;const s=clamp(Math.log10(a/1e-6)/5,0,1);return +(2.2-1.9*s).toFixed(2)}
function W(...p){return `<polyline points="${p.map(q=>q.join(',')).join(' ')}"/>`}
function F(p,I,o={}){const d=fdur(I);if(!d&&!o.force)return '';return `<polyline class="flow${o.bad?' bad':''}" points="${p.map(q=>q.join(',')).join(' ')}" style="animation-duration:${o.bad?0.35:d}s${(I<0)!==!!o.rev?';animation-direction:reverse':''}"/>`}
function Dt(x,y){return `<circle class="dot" cx="${x}" cy="${y}" r="3.2"/>`}
function Tm(x,y){return `<circle class="term" cx="${x}" cy="${y}" r="3.6"/>`}
function T(x,y,s,a='start',c=''){const L=String(s).split('\n');return `<text x="${x}" y="${y}" text-anchor="${a}" class="${c}">${L.map((l,i)=>`<tspan x="${x}" ${i?'dy="14" class="vv"':''}>${l}</tspan>`).join('')}</text>`}
function Gd(x,y){return `<path d="M${x} ${y}v7M${x-10} ${y+7}h20M${x-6} ${y+11}h12M${x-2.5} ${y+15}h5"/>`}
function Rl(x,y,l){return `<path d="M${x} ${y}v-9M${x-9} ${y-9}h18"/>`+T(x,y-14,l,'middle','nv')}
function C(t,x1,y1,x2,y2,lab='',o={}){
  const dx=x2-x1,dy=y2-y1,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,mx=(x1+x2)/2,my=(y1+y2)/2,h=20;
  const a=Math.round(Math.atan2(dy,dx)*180/Math.PI);
  let s='';
  if(L>2*h+0.5)s+=`<path d="M${x1} ${y1}L${mx-ux*h} ${my-uy*h}M${mx+ux*h} ${my+uy*h}L${x2} ${y2}"/>`;
  s+=`<g transform="translate(${mx} ${my}) rotate(${a})" ${o.cls?`class="${o.cls}"`:''}>${BODY[t](o,a)}</g>`;
  if(lab){
    let nx=uy,ny=-ux;if(o.flip){nx=-nx;ny=-ny}
    const d=o.ld||(t==='LED'||t==='LDR'||t==='TH'?26:19),n=String(lab).split('\n').length;
    const lx=mx+nx*d,ly=my+ny*d;
    let anc='middle',yy;
    if(Math.abs(nx)>0.5){anc=nx>0?'start':'end';yy=ly-(n-1)*7+4.5}
    else if(ny<0){yy=ly-(n-1)*14}
    else yy=ly+10;
    s+=T(lx,yy,lab,anc);
  }
  return s;
}
/* BJT: center cx,cy. B(cx-30,cy) C/E at (cx+10,cy-30)/(cx+10,cy+30). pnp => emitter on top */
function BJT(cx,cy,o={}){
  const p=o.p;let s=`<circle cx="${cx+3}" cy="${cy}" r="19"/><path d="M${cx-30} ${cy}H${cx-7}M${cx-7} ${cy-12}V${cy+12}M${cx-7} ${cy-6}L${cx+10} ${cy-17}V${cy-30}M${cx-7} ${cy+6}L${cx+10} ${cy+17}V${cy+30}"/>`;
  if(!p)s+=ah(cx+8,cy+15.7,17,11,7,3.2);
  else s+=ah(cx-2,cy-9.2,-17,11,7,3.2);
  if(o.lab)s+=T(cx+28,cy+4-(o.lab.split('\n').length-1)*7,o.lab);
  return s;
}
/* MOSFET enhancement: G(cx-30,cy) D(cx+10,cy-30) S(cx+10,cy+30); pmos: S top */
function FET(cx,cy,o={}){
  const p=o.p;let s=`<path d="M${cx-30} ${cy}H${cx-12}M${cx-12} ${cy-14}V${cy+14}M${cx-6} ${cy-17}V${cy-8}M${cx-6} ${cy-4}V${cy+4}M${cx-6} ${cy+8}V${cy+17}M${cx-6} ${cy-12}H${cx+10}V${cy-30}M${cx-6} ${cy+12}H${cx+10}V${cy+30}"/>`;
  s+=p?`<path d="M${cx-6} ${cy}H${cx+10}V${cy-12}"/>`+ah(cx+5,cy,1,0,6,3):`<path d="M${cx-6} ${cy}H${cx+10}V${cy+12}"/>`+ah(cx-5,cy,-1,0,6,3);
  if(o.bd!==false)s+=`<path d="M${cx+10} ${cy-12}H${cx+26}V${cy+12}H${cx+10}M${cx+20} ${cy-5}H${cx+32}"/><path class="f" d="M${cx+20} ${cy+5}H${cx+32}L${cx+26} ${cy-5}Z"/>`+Dt(cx+10,cy-12)+Dt(cx+10,cy+12);
  if(o.lab)s+=T(cx+(o.bd!==false?40:24),cy+4-(o.lab.split('\n').length-1)*7,o.lab);
  return s;
}
/* op-amp: center cx,cy. inputs (cx-40,cy-14) top, (cx-40,cy+14) bottom, out (cx+45,cy) */
function OA(cx,cy,o={}){
  const tp=o.swap?'+':'−',bt=o.swap?'−':'+';
  return `<path d="M${cx-25} ${cy-32}L${cx-25} ${cy+32}L${cx+32} ${cy}Z" class="box"/><path d="M${cx-40} ${cy-14}H${cx-25}M${cx-40} ${cy+14}H${cx-25}M${cx+32} ${cy}H${cx+45}"/>`+T(cx-19,cy-9.5,tp,'start','big')+T(cx-19,cy+19,bt,'start','big');
}
/* IC box with pins: pins [{s:'l'|'r'|'t'|'b',at:offset,n:'VCC'}] => returns {s,p} */
function ICB(x,y,w,h,title,pins,o={}){
  let s=`<rect class="box" x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/>`;
  s+=T(x+w/2,y+(o.ty||h/2+5),title,'middle','big');
  const p={};
  for(const q of pins){let px,py,ex,ey,tx,ty,an;
    if(q.s==='l'){px=x;py=y+q.at;ex=x-14;ey=py;tx=x+5;ty=py+4;an='start'}
    else if(q.s==='r'){px=x+w;py=y+q.at;ex=x+w+14;ey=py;tx=x+w-5;ty=py+4;an='end'}
    else if(q.s==='t'){px=x+q.at;py=y;ex=px;ey=y-14;tx=px;ty=y+14;an='middle'}
    else{px=x+q.at;py=y+h;ex=px;ey=py+14;tx=px;ty=py-6;an='middle'}
    s+=`<path d="M${px} ${py}L${ex} ${ey}"/>`+`<text x="${tx}" y="${ty}" text-anchor="${an}" style="font-size:10.5px" class="vv">${q.n}</text>`;
    p[q.n]=[ex,ey];}
  return {s,p};
}
const S=(w,h,inner,mw)=>`<svg class="sch" viewBox="0 0 ${w} ${h}" style="max-width:${mw||w*1.25}px" role="img">${inner}</svg>`;

/* ===== symbol cards ===== */
const SYM={
  R:['Resistor','ANSI / US'],Riec:['Resistor','IEC / EU'],POT:['Potentiometer','3-terminal'],C:['Capacitor','non-polarized'],Cp:['Capacitor','polarized (electrolytic)'],Cv:['Variable capacitor',''],
  L:['Inductor','air core'],Lc:['Inductor','iron / ferrite core'],XF:['Transformer','iron core'],D:['Diode','anode → cathode'],LED:['LED','light-emitting diode'],Z:['Zener diode',''],SK:['Schottky diode',''],
  NPN:['NPN BJT','B, C, E'],PNP:['PNP BJT','emitter on top'],NMOS:['N-channel MOSFET','enhancement, body diode'],PMOS:['P-channel MOSFET','enhancement, body diode'],OPAMP:['Op-amp','− inverting, + non-inverting'],
  bat:['Battery / cell','long plate = +'],bat2:['Multi-cell battery',''],V:['DC voltage source',''],AC:['AC voltage source',''],I:['Current source',''],GND:['Ground','0 V reference'],VCC:['Supply rail','VCC / VDD / +5V'],
  SW:['Switch (SPST)','open'],SPDT:['Switch (SPDT)','changeover'],PB:['Push button','normally open'],F:['Fuse',''],LAMP:['Lamp','incandescent'],M:['DC motor',''],COIL:['Relay coil','IEC style'],RELAY:['Relay','coil + contact'],
  SOL:['Solenoid','coil + plunger'],LDR:['Photoresistor','LDR'],TH:['Thermistor','NTC'],HALL:['Hall-effect sensor','3-pin IC'],BUZ:['Buzzer','piezo'],SPK:['Speaker',''],XTAL:['Crystal','quartz resonator']
};
function symSVG(k){
  let s='';
  if(BODY[k]&&!['POT'].includes(k))s=C(k,15,42,115,42);
  else if(k==='Lc')s=C('L',15,46,115,46,'',{core:1});
  else if(k==='POT')s=C('R',15,46,115,46)+`<path d="M65 16V34"/>`+ah(65,37,0,1,7,3.4);
  else if(k==='XF')s=`<path d="M20 12H45V20M20 72H45V64M110 12H85V20M110 72H85V64"/>`+C('L',45,20,45,64)+C('L',85,64,85,20)+`<path d="M61 18V66M69 18V66"/>`;
  else if(k==='NPN')s=BJT(60,42);else if(k==='PNP')s=BJT(60,42,{p:1});
  else if(k==='NMOS')s=FET(55,42);else if(k==='PMOS')s=FET(55,42,{p:1});
  else if(k==='OPAMP')s=OA(62,42);
  else if(k==='GND')s=`<path d="M65 18v12"/>`+Gd(65,30)+`<path d="M105 30v7M97 37h16l-8 9z"/><path d="M25 30v7M17 37h16M19 37l-4 7M25 37l-4 7M31 37l-4 7"/>`+`<text x="25" y="68" text-anchor="middle" class="vv" style="font-size:10px">chassis</text><text x="65" y="68" text-anchor="middle" class="vv" style="font-size:10px">signal</text><text x="105" y="68" text-anchor="middle" class="vv" style="font-size:10px">digital</text>`;
  else if(k==='VCC')s=`<path d="M45 60V30"/>`+Rl(45,30,'+5V')+`<path d="M90 60V34"/><path class="f" d="M84 34H96L90 24Z"/>`+T(90,18,'VDD','middle','nv');
  else if(k==='SPDT')s=`<path d="M15 50H40M90 30H115M90 64H115"/><circle class="term" cx="40" cy="50" r="2.6"/><circle class="term" cx="90" cy="30" r="2.6"/><circle class="term" cx="90" cy="64" r="2.6"/><path d="M42 49L88 32"/>`;
  else if(k==='RELAY')s=C('COIL',10,50,60,50)+`<path class="mech" d="M35 38V20H86"/>`+`<path d="M70 66H80M108 66H120"/><circle class="term" cx="80" cy="66" r="2.6"/><circle class="term" cx="108" cy="66" r="2.6"/><path d="M82 64L106 52"/><path class="mech" d="M94 58V20"/>`;
  else if(k==='HALL'){const b=ICB(40,16,50,52,'H',[{s:'l',at:26,n:''},{s:'r',at:14,n:''},{s:'r',at:38,n:''}]);s=b.s+T(20,30,'VCC','middle','vv')+T(112,22,'OUT','middle','vv')+T(112,62,'GND','middle','vv')}
  return `<svg viewBox="0 0 130 84" class="sch">${s}</svg>`;
}
function renderSyms(){$$('[data-syms]').forEach(el=>{el.classList.add('syms');el.innerHTML=el.dataset.syms.split(',').map(k=>{const [n,d]=SYM[k]||[k,''];return `<div class="sym">${symSVG(k)}<b>${n}</b>${d?`<i>${d}</i>`:''}</div>`}).join('')})}

/* ===== plotting ===== */
let clipN=0;
function ticks(a,b,n){const sp=b-a;if(!(sp>0))return [a];const st0=sp/n,mg=10**Math.floor(Math.log10(st0)),r=st0/mg,st=(r<1.5?1:r<3?2:r<7?5:10)*mg,o=[];for(let v=Math.ceil(a/st-1e-9)*st;v<=b+st*1e-9;v+=st)o.push(Math.abs(v)<st*1e-9?0:+v.toPrecision(12));return o}
function lticks(a,b){const o=[];for(let e=Math.floor(Math.log10(a));e<=Math.ceil(Math.log10(b));e++){const v=10**e;if(v>=a*0.999&&v<=b*1.001)o.push(v)}return o}
function plot(svg,c){
  const W_=svg.clientWidth,H_=svg.clientHeight;if(!W_||!H_)return;
  const nar=W_<460,m={l:nar?42:54,r:12,t:20,b:36};
  const [x0,x1]=c.x,[y0,y1]=c.y,pw=W_-m.l-m.r,ph=H_-m.t-m.b;
  const X=c.xlog?v=>m.l+pw*Math.log10(v/x0)/Math.log10(x1/x0):v=>m.l+pw*(v-x0)/(x1-x0);
  const Y=v=>m.t+ph*(1-(v-y0)/(y1-y0));
  const xt=c.xlog?lticks(x0,x1):ticks(x0,x1,nar?4:7),yt=ticks(y0,y1,nar?4:5);
  const xf=c.xf||tk,yf=c.yf||tk;
  let s='';
  s+=xt.map(v=>`<line class="gr" x1="${X(v)}" x2="${X(v)}" y1="${m.t}" y2="${m.t+ph}"/>`).join('');
  s+=yt.map(v=>`<line class="gr" x1="${m.l}" x2="${m.l+pw}" y1="${Y(v)}" y2="${Y(v)}"/>`).join('');
  if(y0<0&&y1>0)s+=`<line class="ax" x1="${m.l}" x2="${m.l+pw}" y1="${Y(0)}" y2="${Y(0)}"/>`;
  s+=`<rect class="frame" x="${m.l}" y="${m.t}" width="${pw}" height="${ph}"/>`;
  s+=xt.map(v=>`<text class="tk" x="${X(v)}" y="${m.t+ph+15}" text-anchor="middle">${xf(v)}</text>`).join('');
  s+=yt.map(v=>`<text class="tk" x="${m.l-6}" y="${Y(v)+4}" text-anchor="end">${yf(v)}</text>`).join('');
  s+=`<text class="al" x="${m.l+pw}" y="${H_-3}" text-anchor="end">${c.xl||''}</text><text class="al" x="${m.l}" y="13">${c.yl||''}</text>`;
  const id='cp'+(++clipN);
  s+=`<clipPath id="${id}"><rect x="${m.l}" y="${m.t-1}" width="${pw}" height="${ph+2}"/></clipPath><g clip-path="url(#${id})">`;
  for(const l of c.vl||[]){const col=l.c||MU;s+=`<line class="ref" x1="${X(l.x)}" x2="${X(l.x)}" y1="${m.t}" y2="${m.t+ph}" style="stroke:${col}"/>`;if(l.l)s+=`<text class="rl" x="${X(l.x)+(l.r?-4:4)}" y="${m.t+13+(l.dy||0)}" text-anchor="${l.r?'end':'start'}" style="fill:${col}">${l.l}</text>`}
  for(const l of c.hl||[]){const col=l.c||MU;s+=`<line class="ref" x1="${m.l}" x2="${m.l+pw}" y1="${Y(l.y)}" y2="${Y(l.y)}" style="stroke:${col}"/>`;if(l.l)s+=`<text class="rl" x="${l.left?m.l+5:m.l+pw-5}" y="${Y(l.y)+(l.below?14:-5)}" text-anchor="${l.left?'start':'end'}" style="fill:${col}">${l.l}</text>`}
  const yc=v=>clamp(v,y0-(y1-y0)*2,y1+(y1-y0)*2);
  for(const se of c.s||[]){const pts=se.p.filter(p=>isFinite(p[1])&&(!c.xlog||p[0]>0)).map(p=>`${X(p[0]).toFixed(1)},${Y(yc(p[1])).toFixed(1)}`).join(' ');s+=`<polyline class="ln" points="${pts}" style="stroke:${se.c};stroke-width:${se.w||2.2};${se.d?'stroke-dasharray:'+se.d:''};${se.o?'opacity:'+se.o:''}"/>`}
  s+='</g>';
  for(const d of c.dots||[]){if(!isFinite(d.y)||!isFinite(d.x))continue;const cx=X(clamp(d.x,Math.min(x0,x1),Math.max(x0,x1))),cy=Y(clamp(d.y,y0,y1));s+=`<circle class="dt" cx="${cx}" cy="${cy}" r="5.5" style="fill:${d.c||VC}"/>`;if(d.l){const right=cx<m.l+pw*0.62;s+=`<text class="dl" x="${right?cx+9:cx-9}" y="${cy<m.t+20?cy+16:cy-9}" text-anchor="${right?'start':'end'}">${d.l}</text>`}}
  svg.innerHTML=s;
}

/* ===== simulation framework ===== */
const SIMS={};
function sim(id,ctl,fn){SIMS[id]={ctl,fn}}
function mountSims(){
  $$('[data-sim]').forEach(el=>{
    const d=SIMS[el.dataset.sim];if(!d)return;
    const st={},mem={},id=el.dataset.sim;
    el.classList.add('sim');
    const ctl=document.createElement('div');ctl.className='ctl';
    const stage=document.createElement('div');stage.className='stage';
    ctl.innerHTML=`<div class="hd"><span>Controls</span><button type="button" data-reset>Reset</button></div>`;
    const reg=[];
    d.ctl.forEach((c,ci)=>{
      const w=document.createElement('div');w.className='c';const cid=`${id}-${c.k}`;
      if(c.t==='r'){
        const lg=!!c.log,toP=v=>lg?1000*Math.log(v/c.min)/Math.log(c.max/c.min):v,fromP=p=>{if(!lg)return +p;const v=c.min*(c.max/c.min)**(p/1000);return +v.toPrecision(2)};
        w.innerHTML=`<label class="cl" for="${cid}"><span>${c.l}</span><output></output></label><input type="range" id="${cid}" min="${lg?0:c.min}" max="${lg?1000:c.max}" step="${lg?1:(c.step||1)}">`;
        const inp=$('input',w),out=$('output',w);
        const show=()=>{out.textContent=c.f?c.f(st[c.k]):eng(st[c.k],c.u||'');const p=(inp.value-inp.min)/(inp.max-inp.min)*100;inp.style.setProperty('--p',p+'%')};
        const set=v=>{st[c.k]=v;inp.value=toP(v);show()};
        inp.addEventListener('input',()=>{st[c.k]=fromP(inp.value);show();upd()});
        reg.push(()=>set(c.v));
      }else if(c.t==='seg'){
        w.innerHTML=`<span class="cl"><span>${c.l}</span></span><div class="seg" role="group" aria-label="${c.l}">${c.o.map(([v,t])=>`<button type="button" data-v="${v}">${t}</button>`).join('')}</div>`;
        const bs=$$('button',w);
        const set=v=>{st[c.k]=v;bs.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===String(v))))};
        bs.forEach(b=>b.addEventListener('click',()=>{set(b.dataset.v);upd()}));
        reg.push(()=>set(String(c.v)));
      }else if(c.t==='tog'){
        w.innerHTML=`<label class="tg"><input type="checkbox" id="${cid}"><span>${c.l}</span></label>`;
        const inp=$('input',w);
        inp.addEventListener('change',()=>{st[c.k]=inp.checked;upd()});
        reg.push(()=>{st[c.k]=!!c.v;inp.checked=!!c.v});
      }else if(c.t==='sel'){
        w.innerHTML=`<label class="cl" for="${cid}"><span>${c.l}</span></label><select id="${cid}">${c.o.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select>`;
        const sl=$('select',w);
        sl.addEventListener('change',()=>{st[c.k]=sl.value;upd()});
        reg.push(()=>{st[c.k]=String(c.v);sl.value=String(c.v)});
      }
      c._w=w;ctl.appendChild(w);
    });
    el.append(ctl,stage);
    const reset=()=>{reg.forEach(f=>f());for(const k in mem)delete mem[k]};
    let lastW=0;
    function upd(){
      d.ctl.forEach(c=>{c._w.hidden=c.show?!c.show(st):false});
      let r;
      try{r=d.fn(st,mem)}catch(e){console.error(id,e);stage.innerHTML='<p class="note">Simulation error: '+e.message+'</p>';return}
      let h='';
      if(r.sch)h+=`<div class="schw">${r.sch}</div>`;
      if(r.x)h+=r.x;
      if(r.ro)h+=`<div class="ro">${r.ro.map(([l,v,c])=>`<div class="r ${c||''}"><span>${l}</span><b>${v}</b></div>`).join('')}</div>`;
      (r.p||[]).forEach(p=>{const lg=(p.s||[]).filter(s=>s.n).map(s=>`<span><i class="${s.d?'d':''}" style="background:${s.c};border-color:${s.c}"></i>${s.n}</span>`).join('')+(p.lg||'');h+=`<div class="figw">${lg?`<div class="lg">${lg}</div>`:''}<div class="fig" style="height:${p.h||230}px"><svg></svg></div></div>`});
      if(r.n)h+=`<p class="note">${r.n}</p>`;
      stage.innerHTML=h;stage._p=r.p||[];
      $$('.fig svg',stage).forEach((s,i)=>plot(s,stage._p[i]));
    }
    $('[data-reset]',ctl).addEventListener('click',()=>{reset();upd()});
    reset();upd();
    new ResizeObserver(()=>{const w=stage.clientWidth;if(Math.abs(w-lastW)<2)return;lastW=w;$$('.fig svg',stage).forEach((s,i)=>plot(s,stage._p[i]))}).observe(stage);
  });
}
