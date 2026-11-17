/* ================= PASSIVES ================= */
const CC=[['black','#111111'],['brown','#7b4a1f'],['red','#d42a1f'],['orange','#f07f13'],['yellow','#f2d31b'],['green','#22a043'],['blue','#1f5fd6'],['violet','#8a3fd1'],['grey','#8d8d8d'],['white','#f4f4f4']];
const MULT=[...CC.map((c,i)=>[String(i),c[0]+' ×'+eng(10**i,'',3).replace(' ','')]),['-1','gold ×0.1'],['-2','silver ×0.01']];
const TOL={brown:1,red:2,green:0.5,blue:0.25,violet:0.1,grey:0.05,gold:5,silver:10};
const COLHEX=Object.fromEntries([...CC,['gold','#c9a227'],['silver','#c0c0c0']]);
sim('cc',[
  {k:'nb',t:'seg',l:'Band count',o:[['4','4-band'],['5','5-band']],v:'4'},
  {k:'b1',t:'sel',l:'Band 1 — first digit',o:CC.slice(1).map((c,i)=>[String(i+1),`${c[0]} (${i+1})`]),v:'4'},
  {k:'b2',t:'sel',l:'Band 2 — second digit',o:CC.map((c,i)=>[String(i),`${c[0]} (${i})`]),v:'7'},
  {k:'b3',t:'sel',l:'Band 3 — third digit',o:CC.map((c,i)=>[String(i),`${c[0]} (${i})`]),v:'0',show:s=>s.nb==='5'},
  {k:'m',t:'sel',l:'Multiplier',o:MULT,v:'2'},
  {k:'tol',t:'sel',l:'Tolerance',o:Object.entries(TOL).map(([c,t])=>[c,`${c} ±${t}%`]),v:'gold'}
],st=>{
  const five=st.nb==='5',dg=five?(+st.b1)*100+(+st.b2)*10+(+st.b3):(+st.b1)*10+(+st.b2),m=+st.m,R=dg*10**m,t=TOL[st.tol];
  const mc=m===-1?'gold':m===-2?'silver':CC[m][0];
  const bands=[CC[+st.b1][0],CC[+st.b2][0],...(five?[CC[+st.b3][0]]:[]),mc];
  const xs=five?[118,146,174,202]:[124,156,188];if(!five)xs.push(220);
  let s=`<path d="M20 60H400" style="stroke:var(--mut);stroke-width:3"/><rect x="92" y="32" width="236" height="56" rx="24" style="fill:${five?'#9cc3e6':'#e6cf9e'};stroke:none"/>`;
  bands.forEach((b,i)=>{s+=`<rect x="${xs[i]}" y="32" width="15" height="56" style="fill:${COLHEX[b]};stroke:${b==='white'?'#bbb':'none'};stroke-width:1"/>`});
  s+=`<rect x="290" y="32" width="15" height="56" style="fill:${COLHEX[st.tol]};stroke:none"/>`+T(210,112,'read from the end with bands bunched together →','middle','vv');
  const mant=+(dg/10**Math.floor(Math.log10(dg||1))).toPrecision(3),inE12=E12.some(e=>Math.abs(e-mant)<1e-6),inE24=E24.some(e=>Math.abs(e-mant)<1e-6);
  return {sch:S(420,120,s,520),ro:[['Resistance',dg?eng(R,'Ω'):'0 Ω (jumper)','ok'],['Tolerance','±'+t+' %'],['Range',dg?eng(R*(1-t/100),'Ω')+' – '+eng(R*(1+t/100),'Ω'):'—'],['Standard series',inE12?'E12 (and E24)':inE24?'E24':five?'E96 / custom':'non-standard']]};
});

sim('pot',[
  {k:'Vin',t:'r',l:'Supply Vin',min:0,max:12,step:0.1,v:5,u:'V'},
  {k:'pos',t:'r',l:'Knob position',min:0,max:100,step:1,v:50,f:v=>v+' %'},
  {k:'Rt',t:'r',l:'Total resistance',min:1000,max:1000000,log:1,v:10000,u:'Ω'},
  {k:'tp',t:'seg',l:'Taper',o:[['lin','Linear (B)'],['log','Audio / log (A)']],v:'lin'}
],({Vin,pos,Rt,tp})=>{
  const fr=p=>tp==='lin'?p:(10**(2*p)-1)/99,p=pos/100,k=fr(p),Rwb=Rt*k,Raw=Rt-Rwb,Vo=Vin*k;
  const yw=130-40*p;
  let s=W([50,75],[50,30],[200,30],[200,70])+W([200,150],[200,195],[50,195],[50,145])+C('bat',50,75,50,145,'Vin\n'+eng(Vin,'V'),{flip:1})+C('R',200,70,200,150)+
    `<path d="M240 ${yw}H212"/>`+ah(209,yw,-1,0,7,3.4)+W([240,yw],[260,yw],[260,110],[300,110])+Tm(300,110)+T(306,114,'Vout '+eng(Vo,'V'),'start','nv')+
    T(190,74,'A','end')+T(190,154,'B','end')+T(246,yw-8,'W','start')+T(150,186,'R(W–B) = '+eng(Rwb,'Ω'),'middle','vv');
  return {sch:S(400,215,s,470),ro:[['Vout = Vin·R(WB)/R',eng(Vo,'V'),'ok'],['R(A–W)',eng(Raw,'Ω')],['R(W–B)',eng(Rwb,'Ω')],['Fraction',pct(k)]],
    p:[{x:[0,100],y:[0,Math.max(Vin,0.1)*1.05],xl:'knob position (%)',yl:'Vout (V)',s:[{p:lin(0,1,60).map(q=>[q*100,Vin*q]),c:tp==='lin'?VC:MU,w:tp==='lin'?2.6:1.4,n:'linear'},{p:lin(0,1,80).map(q=>[q*100,Vin*(10**(2*q)-1)/99]),c:tp==='log'?VC:MU,w:tp==='log'?2.6:1.4,d:'6 4',n:'audio / log'}],dots:[{x:pos,y:Vo,l:eng(Vo,'V')}],h:190}]};
});

/* RC charge / RL energise share a time-plot builder */
const TAU=[1,2,3,4,5].map(k=>({x:k,l:k+'τ'}));
sim('rc',[
  {k:'Vs',t:'r',l:'Source Vs',min:0,max:24,step:0.1,v:5,u:'V'},
  {k:'R',t:'r',l:'Resistance R',min:100,max:1000000,log:1,v:10000,u:'Ω'},
  {k:'Cv',t:'r',l:'Capacitance C',min:1e-9,max:1e-3,log:1,v:10e-6,u:'F'},
  {k:'mode',t:'seg',l:'Switch position',o:[['c','Charge'],['d','Discharge']],v:'c'},
  {k:'tp',t:'r',l:'Probe time (multiples of τ)',min:0,max:5,step:0.05,v:1,f:v=>v.toFixed(2)+' τ'}
],({Vs,R,Cv,mode,tp})=>{
  const tau=R*Cv,ch=mode==='c',e=Math.exp(-tp),Vc=ch?Vs*(1-e):Vs*e,I=(ch?1:-1)*Vs/R*e;
  const ts=lin(0,5,200);
  let s=W([50,75],[50,40],[106,40])+W([110,80],[110,195])+W([150,60],[165,60])+W([235,60],[290,60],[290,95])+W([290,145],[290,195],[50,195],[50,145])+
    C('bat',50,75,50,145,'Vs\n'+eng(Vs,'V'),{flip:1})+`<circle class="term" cx="110" cy="40" r="3"/><circle class="term" cx="110" cy="80" r="3"/><circle class="dot" cx="150" cy="60" r="3"/>`+
    (ch?`<path d="M148 59L113 42"/>`:`<path d="M148 61L113 78"/>`)+T(102,36,'a','end','vv')+T(102,90,'b','end','vv')+
    C('R',165,60,235,60,'R  '+eng(R,'Ω'))+C('C',290,95,290,145,'C\n'+eng(Cv,'F'))+Dt(110,195)+T(276,175,'Vc = '+eng(Vc,'V'),'end','nv');
  s+=ch?F([[50,75],[50,40],[106,40]],I)+F([[235,60],[290,60],[290,95]],I)+F([[290,145],[290,195],[50,195],[50,145]],I):F([[290,95],[290,60],[235,60]],-I)+F([[165,60],[150,60]],-I)+F([[110,80],[110,195],[290,195],[290,145]],-I);
  return {sch:S(400,215,s,480),ro:[['Time constant τ = RC',eng(tau,'s'),'ok'],['Probe time t',eng(tp*tau,'s')],['Vc(t)',eng(Vc,'V')],['I(t)',eng(I,'A')],['Charge Q = C·Vc',eng(Cv*Vc,'C')],['Energy ½CV²',eng(0.5*Cv*Vc*Vc,'J')],['~Fully settled (5τ)',eng(5*tau,'s')]],
    p:[{x:[0,5],y:[0,Math.max(Vs,0.1)*1.08],xf:v=>v+'τ',xl:`time (τ = ${eng(tau,'s')})`,yl:'volts',s:[{p:ts.map(t=>[t,ch?Vs*(1-Math.exp(-t)):Vs*Math.exp(-t)]),c:VC,n:'Vc (capacitor voltage)'},{p:ts.map(t=>[t,Vs*Math.exp(-t)]),c:IC,d:'6 4',n:'|I|·R (current, scaled)'}],
      hl:[{y:Vs*(ch?0.632:0.368),l:(ch?'63.2%':'36.8%')+' at 1τ',left:1}],vl:[{x:1,l:'1τ'},{x:3,l:'3τ (95%)'},{x:5,l:'5τ',r:1}],dots:[{x:tp,y:Vc,l:eng(Vc,'V')}],h:220}]};
});

sim('rl',[
  {k:'Vs',t:'r',l:'Source Vs',min:0,max:24,step:0.1,v:12,u:'V'},
  {k:'R',t:'r',l:'Resistance R',min:1,max:10000,log:1,v:100,u:'Ω'},
  {k:'L',t:'r',l:'Inductance L',min:1e-6,max:10,log:1,v:0.01,u:'H'},
  {k:'tp',t:'r',l:'Probe time (multiples of τ)',min:0,max:5,step:0.05,v:1,f:v=>v.toFixed(2)+' τ'}
],({Vs,R,L,tp})=>{
  const tau=L/R,If=Vs/R,e=Math.exp(-tp),I=If*(1-e),VL=Vs*e,ts=lin(0,5,200);
  const s=W([50,75],[50,40],[90,40])+W([130,40],[165,40])+W([235,40],[290,40],[290,85])+W([290,155],[290,195],[50,195],[50,145])+
    C('bat',50,75,50,145,'Vs\n'+eng(Vs,'V'),{flip:1})+C('SW',90,40,130,40,'closed at t = 0',{on:1})+C('R',165,40,235,40,'R  '+eng(R,'Ω'))+C('L',290,85,290,155,'L\n'+eng(L,'H'))+T(320,170,'VL = '+eng(VL,'V'),'start','nv')+
    F([[50,75],[50,40],[90,40]],I)+F([[235,40],[290,40],[290,85]],I)+F([[290,155],[290,195],[50,195],[50,145]],I);
  return {sch:S(400,215,s,480),ro:[['Time constant τ = L/R',eng(tau,'s'),'ok'],['Final current Vs/R',eng(If,'A')],['I(t)',eng(I,'A')],['VL(t) = L·di/dt',eng(VL,'V')],['Stored energy ½LI²',eng(0.5*L*I*I,'J')]],
    p:[{x:[0,5],y:[0,If*1.1||1],xf:v=>v+'τ',xl:`time (τ = ${eng(tau,'s')})`,yl:'current (A)',s:[{p:ts.map(t=>[t,If*(1-Math.exp(-t))]),c:IC,n:'I(t) — rises slowly'}],dots:[{x:tp,y:I,c:IC,l:eng(I,'A')}],vl:[{x:1,l:'1τ (63%)'}],h:180},
       {x:[0,5],y:[0,Math.max(Vs,0.1)*1.1],xf:v=>v+'τ',xl:'time',yl:'volts',s:[{p:ts.map(t=>[t,Vs*Math.exp(-t)]),c:VC,n:'VL across inductor'},{p:ts.map(t=>[t,Vs*(1-Math.exp(-t))]),c:MU,d:'6 4',n:'VR across resistor'}],dots:[{x:tp,y:VL,l:eng(VL,'V')}],h:170}]};
});

sim('filt',[
  {k:'ty',t:'seg',l:'Filter type',o:[['lp','Low-pass'],['hp','High-pass']],v:'lp'},
  {k:'R',t:'r',l:'R',min:100,max:100000,log:1,v:1600,u:'Ω'},
  {k:'Cv',t:'r',l:'C',min:1e-9,max:1e-5,log:1,v:100e-9,u:'F'},
  {k:'fi',t:'r',l:'Input frequency',min:1,max:1e6,log:1,v:5000,u:'Hz'}
],({ty,R,Cv,fi})=>{
  const fc=1/(PI2*R*Cv),lp=ty==='lp',H=f=>{const x=f/fc;return lp?1/Math.sqrt(1+x*x):x/Math.sqrt(1+x*x)},Ph=f=>{const x=f/fc;return lp?-Math.atan(x):Math.PI/2-Math.atan(x)};
  const g=H(fi),ph=Ph(fi),db=20*Math.log10(g);
  let s=Tm(30,60)+T(24,64,'Vin','end','nv')+W([30,60],[60,60])+W([140,60],[260,60])+Tm(260,60)+T(268,64,'Vout','start','nv')+Dt(200,60)+W([200,150],[200,165],[30,165])+Tm(30,165)+Dt(200,165)+W([200,165],[260,165])+Tm(260,165)+T(24,169,'GND','end','vv');
  s+=lp?C('R',60,60,140,60,'R  '+eng(R,'Ω'))+C('C',200,60,200,150,'C\n'+eng(Cv,'F')):C('C',60,60,140,60,'C  '+eng(Cv,'F'))+C('R',200,60,200,150,'R\n'+eng(R,'Ω'));
  const fs=lgs(1,1e6,200),ts=lin(0,2/fi,240);
  return {sch:S(320,185,s,420),ro:[['Cutoff fc = 1/(2πRC)',eng(fc,'Hz'),'ok'],['Gain at input f',g.toFixed(3)+'×'],['Gain (dB)',db.toFixed(1)+' dB'],['Phase shift',(ph*180/Math.PI).toFixed(1)+'°'],['Roll-off','20 dB / decade']],
    p:[{x:[1,1e6],xlog:1,y:[-60,5],xl:'frequency (Hz)',yl:'gain (dB)',s:[{p:fs.map(f=>[f,20*Math.log10(H(f))]),c:VC,n:'magnitude response'}],vl:[{x:fc,l:'fc (−3 dB)',c:AX}],dots:[{x:fi,y:db,l:db.toFixed(1)+' dB'}],h:200},
       {x:[0,2/fi],y:[-1.15,1.15],xl:'time — two periods of the input',yl:'normalized V',xf:v=>tk(v),yf:v=>v.toFixed(1),s:[{p:ts.map(t=>[t,Math.sin(PI2*fi*t)]),c:MU,d:'5 4',n:'input'},{p:ts.map(t=>[t,g*Math.sin(PI2*fi*t+ph)]),c:IC,n:'output'}],h:170}]};
});

sim('rlc',[
  {k:'R',t:'r',l:'R',min:1,max:1000,log:1,v:10,u:'Ω'},
  {k:'L',t:'r',l:'L',min:1e-6,max:1,log:1,v:1e-3,u:'H'},
  {k:'Cv',t:'r',l:'C',min:1e-12,max:1e-4,log:1,v:1e-6,u:'F'},
  {k:'fi',t:'r',l:'Drive frequency (× f₀)',min:0.05,max:20,log:1,v:1,f:v=>v+'×'}
],({R,L,Cv,fi})=>{
  const f0=1/(PI2*Math.sqrt(L*Cv)),Q=Math.sqrt(L/Cv)/R,BW=f0/Q,Iz=f=>1/Math.sqrt(R*R+(PI2*f*L-1/(PI2*f*Cv))**2),f=fi*f0,I=Iz(f);
  const fs=lgs(f0/100,f0*100,300);
  const s=W([50,80],[50,40],[80,40])+W([150,40],[190,40])+W([260,40],[300,40],[300,85])+W([300,145],[300,190],[50,190],[50,140])+
    C('AC',50,80,50,140,'1 V\n'+eng(f,'Hz'),{flip:1})+C('R',80,40,150,40,'R '+eng(R,'Ω'))+C('L',190,40,260,40,'L '+eng(L,'H'))+C('C',300,85,300,145,'C\n'+eng(Cv,'F'))+
    F([[50,80],[50,40],[80,40]],I)+F([[260,40],[300,40],[300,85]],I)+F([[300,145],[300,190],[50,190],[50,140]],I);
  return {sch:S(390,210,s,460),ro:[['Resonance f₀ = 1/(2π√LC)',eng(f0,'Hz'),'ok'],['Quality factor Q',Q.toPrecision(3)],['Bandwidth f₀/Q',eng(BW,'Hz')],['XL = XC at f₀',eng(PI2*f0*L,'Ω')],['Current at drive f',eng(I,'A')],['Max current 1V/R',eng(1/R,'A')]],
    p:[{x:[f0/100,f0*100],xlog:1,y:[0,1/R*1.12],xl:'frequency (Hz)',yl:'current amplitude for a 1 V source (A)',s:[{p:fs.map(q=>[q,Iz(q)]),c:IC,n:'|I(f)|'}],vl:[{x:f0,l:'f₀',c:AX}],hl:[{y:1/R/Math.SQRT2,l:'half-power (−3 dB)',left:1}],dots:[{x:f,y:I,c:IC,l:eng(I,'A')}],h:220}],
    n:'Below f₀ the capacitor dominates (current leads); above f₀ the inductor dominates (current lags). High Q = sharp, narrow peak.'};
});

sim('xfmr',[
  {k:'Vp',t:'r',l:'Primary voltage (RMS)',min:1,max:240,step:1,v:120,u:'V'},
  {k:'n',t:'r',l:'Turns ratio Np : Ns',min:0.1,max:100,log:1,v:10,f:v=>v+' : 1'},
  {k:'RL',t:'r',l:'Load RL',min:1,max:10000,log:1,v:100,u:'Ω'}
],({Vp,n,RL})=>{
  const Vs=Vp/n,Is=Vs/RL,Ip=Is/n,P=Vs*Is;
  const s=W([50,70],[50,40],[150,40],[150,70])+W([150,140],[150,180],[50,180],[50,130])+W([210,70],[210,40],[300,40],[300,75])+W([210,140],[210,180],[300,180],[300,145])+
    C('AC',50,70,50,130,'Vp\n'+eng(Vp,'V'),{flip:1})+C('L',150,70,150,140)+C('L',210,140,210,70)+`<path d="M176 58V152M184 58V152"/>`+C('R',300,75,300,145,'RL\n'+eng(RL,'Ω'))+
    T(150,198,'Np','middle','vv')+T(210,198,'Ns','middle','vv')+T(255,30,'Vs = '+eng(Vs,'V'),'middle','nv')+
    F([[50,70],[50,40],[150,40],[150,70]],Ip)+F([[210,70],[210,40],[300,40],[300,75]],Is)+F([[300,145],[300,180],[210,180],[210,140]],Is)+F([[150,140],[150,180],[50,180],[50,130]],Ip);
  return {sch:S(380,205,s,450),ro:[['Secondary Vs = Vp·Ns/Np',eng(Vs,'V'),'ok'],['Secondary current',eng(Is,'A')],['Primary current',eng(Ip,'A')],['Power (ideal, in = out)',eng(P,'W')],['Load seen by primary n²·RL',eng(n*n*RL,'Ω')],['Type',n>1?'step-down':n<1?'step-up':'isolation (1:1)']]};
});

/* colour-code reference table */
function ccTable(){const el=$('#cctable');if(!el)return;el.innerHTML=`<table class="ccgrid stack"><thead><tr><th>Colour</th><th>Digit</th><th>Multiplier</th><th>Tolerance</th></tr></thead><tbody>${[...CC.map((c,i)=>[c[0],c[1],i,'×'+eng(10**i,'',3).replace(' ',''),Object.entries(TOL).find(t=>t[0]===c[0])]),['gold','#c9a227','—','×0.1',['gold',5]],['silver','#c0c0c0','—','×0.01',['silver',10]]].map(([n,h,d,m,t])=>`<tr><td><span class="sw" style="background:${h}"></span>${n}</td><td>${d}</td><td>${m}</td><td>${t?'±'+t[1]+' %':''}</td></tr>`).join('')}</tbody></table>`}
