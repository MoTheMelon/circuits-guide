/* ================= SEMICONDUCTORS ================= */
const VT=0.02585;
const DTYPES={si:['Silicon (1N4148)',0.68,1.75,'D'],sk:['Schottky (BAT54)',0.32,1.1,'SK'],red:['Red LED',1.9,2,'LED','#ff4a3d'],grn:['Green LED',2.9,2.4,'LED','#33d17a'],blu:['Blue / white LED',3.0,2.5,'LED','#5d8bff']};
function dsolve(Vs,R,vf,n){const nv=n*VT,Is=0.01/Math.exp(vf/nv);let lo=Math.min(0,Vs),hi=Math.max(0,Vs);for(let k=0;k<80;k++){const v=(lo+hi)/2,g=Is*(Math.exp(v/nv)-1)-(Vs-v)/R;if(g>0)hi=v;else lo=v}const Vd=(lo+hi)/2;return {Vd,I:(Vs-Vd)/R,Is,nv}}
sim('diode',[
  {k:'ty',t:'sel',l:'Diode type',o:Object.entries(DTYPES).map(([k,v])=>[k,v[0]]),v:'si'},
  {k:'Vs',t:'r',l:'Supply Vs',min:0,max:12,step:0.05,v:5,u:'V'},
  {k:'R',t:'r',l:'Series R',min:10,max:10000,log:1,v:330,u:'Ω'}
],({ty,Vs,R})=>{
  const [nm,vf,n,sym,col]=DTYPES[ty],{Vd,I,Is,nv}=dsolve(Vs,R,vf,n),Imax=Math.max(Vs/R*1.15,2e-3);
  const s=W([50,75],[50,40],[110,40])+W([180,40],[290,40],[290,80])+W([290,150],[290,190],[50,190],[50,145])+
    C('bat',50,75,50,145,'Vs\n'+eng(Vs,'V'),{flip:1})+C('R',110,40,180,40,'R  '+eng(R,'Ω'))+C(sym,290,80,290,150,'anode ↑\ncathode ↓\nVd = '+eng(Vd,'V'),{on:I>1e-3,col,op:clamp(I/0.02,0.15,0.8)})+
    F([[50,75],[50,40],[110,40]],I)+F([[180,40],[290,40],[290,80]],I)+F([[290,150],[290,190],[50,190],[50,145]],I);
  const vs=lin(0,Math.max(Vs,vf*1.3),300);
  return {sch:S(400,210,s,470),ro:[['Diode voltage Vd',eng(Vd,'V'),'ok'],['Current I',eng(I,'A')],['Power in diode',eng(Vd*I,'W')],['Power in R',eng(I*I*R,'W')],['Saturation current Is',eng(Is,'A')],['Ideality n',n]],
    p:[{x:[0,Math.max(Vs,vf*1.3)],y:[0,Imax],xl:'voltage across diode (V)',yl:'current (A)',s:[{p:vs.map(v=>[v,Is*(Math.exp(v/nv)-1)]),c:IC,n:'diode I–V (Shockley)'},{p:[[0,Vs/R],[Vs,0]],c:VC,d:'6 4',n:'load line I = (Vs − V)/R'}],dots:[{x:Vd,y:I,l:'operating point'}],h:220}],
    n:'The operating point sits where the diode curve meets the load line. Notice how Vd barely moves while the current changes a lot — that is why "Vf ≈ 0.7 V" works as a first approximation for silicon.'};
});

const LEDC={red:['Red',2.0,'#ff4a3d'],yel:['Yellow',2.1,'#ffd34d'],grn:['Green (InGaN)',3.0,'#33d17a'],blu:['Blue',3.1,'#5d8bff'],wht:['White',3.1,'#f4f4f4'],ir:['Infrared',1.3,'#b0405a']};
sim('led',[
  {k:'Vs',t:'r',l:'Supply voltage',min:1.5,max:24,step:0.1,v:5,u:'V'},
  {k:'c',t:'sel',l:'LED colour (typical Vf)',o:Object.entries(LEDC).map(([k,v])=>[k,`${v[0]} — ${v[1]} V`]),v:'red'},
  {k:'If',t:'r',l:'Target current',min:1,max:30,step:1,v:10,f:v=>v+' mA'}
],({Vs,c,If})=>{
  const [nm,Vf,col]=LEDC[c],I=If/1000,ok=Vs>Vf+0.2,Rx=(Vs-Vf)/I,Rs=ok?eUp(Rx):NaN,Ia=ok?(Vs-Vf)/Rs:0,P=Ia*Ia*Rs;
  const s=W([50,75],[50,40],[110,40])+W([180,40],[290,40],[290,80])+W([290,150],[290,190],[50,190],[50,145])+
    C('bat',50,75,50,145,eng(Vs,'V'),{flip:1})+C('R',110,40,180,40,'R  '+(ok?eng(Rs,'Ω'):'?'))+C('LED',290,80,290,150,nm+'\nVf ≈ '+Vf+' V',{on:ok,col,op:clamp(Ia/0.02,0.2,0.85)})+
    F([[50,75],[50,40],[110,40]],Ia)+F([[180,40],[290,40],[290,80]],Ia)+F([[290,150],[290,190],[50,190],[50,145]],Ia);
  return {sch:S(400,210,s,470),ro:ok?[['Exact R = (Vs − Vf)/I',eng(Rx,'Ω')],['Nearest E12 at or above',eng(Rs,'Ω'),'ok'],['Actual current',eng(Ia,'A')],['Resistor power',eng(P,'W'),P>0.25?'bad':P>0.125?'warn':''],['Resistor rating',P>0.25?'use ½ W or larger':P>0.125?'use ¼ W (≥2× margin)':'⅛ W or ¼ W fine'],['LED power',eng(Ia*Vf,'W')]]:[['Supply too low','Vs must exceed Vf','bad']]};
});

sim('zener',[
  {k:'Vin',t:'r',l:'Input Vin',min:0,max:24,step:0.1,v:12,u:'V'},
  {k:'Rs',t:'r',l:'Series Rs',min:10,max:10000,log:1,v:220,u:'Ω'},
  {k:'Vz',t:'sel',l:'Zener voltage',o:[['3.3','3.3 V'],['5.1','5.1 V'],['9.1','9.1 V'],['12','12 V']],v:'5.1'},
  {k:'RL',t:'r',l:'Load RL',min:50,max:100000,log:1,v:1000,u:'Ω'}
],st=>{
  const {Vin,Rs,RL}=st,Vz=+st.Vz,Vop=Vin*RL/(Rs+RL),on=Vop>Vz,Vo=on?Vz:Vop,Is=(Vin-Vo)/Rs,IL=Vo/RL,Iz=on?Is-IL:0,Pz=Vz*Iz;
  const s=W([50,75],[50,40],[100,40])+W([170,40],[310,40],[310,80])+W([220,40],[220,85])+W([220,150],[220,190])+W([310,150],[310,190],[50,190],[50,145])+
    C('bat',50,75,50,145,'Vin\n'+eng(Vin,'V'),{flip:1})+C('R',100,40,170,40,'Rs  '+eng(Rs,'Ω'))+C('Z',220,150,220,85,'Vz\n'+Vz+' V',{flip:1})+C('R',310,80,310,150,'RL\n'+eng(RL,'Ω'))+
    Dt(220,40)+Dt(220,190)+T(265,30,'Vout '+eng(Vo,'V'),'middle','nv')+
    F([[50,75],[50,40],[100,40]],Is)+F([[170,40],[220,40]],Is)+F([[220,40],[310,40],[310,80]],IL)+F([[220,40],[220,85]],Iz)+F([[220,150],[220,190]],Iz)+F([[310,150],[310,190],[50,190],[50,145]],Is);
  return {sch:S(400,210,s,470),ro:[['Vout',eng(Vo,'V'),on?'ok':'warn'],['Status',on?'Regulating':'Zener off (Vin too low)',on?'ok':'warn'],['Zener current Iz',eng(Iz,'A')],['Load current',eng(IL,'A')],['Series current',eng(Is,'A')],['Zener power',eng(Pz,'W'),Pz>0.5?'bad':'']],
    p:[{x:[0,24],y:[0,14],xl:'Vin (V)',yl:'Vout (V)',s:[{p:lin(0,24,120).map(v=>{const o=v*RL/(Rs+RL);return [v,o>Vz?Vz:o]}),c:VC,n:'Vout vs Vin'}],hl:[{y:Vz,l:'Vz',left:1}],dots:[{x:Vin,y:Vo,l:eng(Vo,'V')}],h:180}]};
});

sim('rect',[
  {k:'md',t:'seg',l:'Rectifier',o:[['h','Half-wave'],['f','Full-wave bridge']],v:'f'},
  {k:'Vp',t:'r',l:'AC peak voltage',min:3,max:30,step:0.5,v:12,u:'V'},
  {k:'Cv',t:'r',l:'Smoothing capacitor',min:1e-6,max:1e-2,log:1,v:470e-6,u:'F'},
  {k:'RL',t:'r',l:'Load RL',min:10,max:10000,log:1,v:100,u:'Ω'},
  {k:'f',t:'seg',l:'Mains frequency',o:[['50','50 Hz'],['60','60 Hz']],v:'60'}
],st=>{
  const {Vp,Cv,RL}=st,f=+st.f,full=st.md==='f',Vd=full?1.4:0.7,N=1200,tE=3/f,dt=tE/N;let Vo=0;const vo=[],vr=[],vi=[];
  for(let i=0;i<=N;i++){const t=i*dt,vs=Vp*Math.sin(PI2*f*t),r=Math.max(0,(full?Math.abs(vs):vs)-Vd);if(r>Vo)Vo=r;else Vo*=Math.exp(-dt/(RL*Cv));vo.push([t,Vo]);vr.push([t,r]);vi.push([t,vs])}
  const last=vo.filter(p=>p[0]>=2/f),mx=Math.max(...last.map(p=>p[1])),mn=Math.min(...last.map(p=>p[1])),avg=last.reduce((a,p)=>a+p[1],0)/last.length,fr=full?2*f:f,est=(Vp-Vd)/(fr*RL*Cv);
  let s;
  if(!full){s=W([50,80],[50,40],[90,40])+W([160,40],[320,40],[320,85])+W([240,40],[240,90])+W([240,150],[240,190])+W([320,150],[320,190],[50,190],[50,140])+
      C('AC',50,80,50,140,'AC\n'+eng(Vp,'V')+' pk',{flip:1})+C('D',90,40,160,40,'D')+C('Cp',240,90,240,150,'C\n'+eng(Cv,'F'),{flip:1})+C('R',320,85,320,150,'RL\n'+eng(RL,'Ω'))+Dt(240,40)+Dt(240,190)+T(280,30,'Vout','middle','nv')}
  else{s=W([50,80],[50,30],[120,30],[120,110],[140,110])+W([50,140],[50,205],[285,205],[285,110],[260,110])+W([200,50],[200,25],[380,25],[380,85])+W([200,170],[200,190],[380,190],[380,150])+W([320,25],[320,90])+W([320,150],[320,190])+
      C('AC',50,80,50,140,'AC\n'+eng(Vp,'V')+' pk',{flip:1})+C('D',140,110,200,50)+C('D',260,110,200,50)+C('D',200,170,140,110)+C('D',200,170,260,110)+
      C('Cp',320,90,320,150,'C',{flip:1})+C('R',380,85,380,150,'RL\n'+eng(RL,'Ω'))+Dt(320,25)+Dt(320,190)+Dt(140,110)+Dt(260,110)+T(210,18,'+ Vout','start','nv')+T(200,115,'bridge','middle','vv')}
  return {sch:S(full?430:390,215,s,full?520:470),ro:[['Peak output',eng(mx,'V')],['Average (DC)',eng(avg,'V'),'ok'],['Ripple (pk–pk)',eng(mx-mn,'V'),(mx-mn)/mx>0.1?'warn':''],['Estimate I/(f·C)',eng(est,'V')],['Ripple frequency',eng(fr,'Hz')],['Diode drops',full?'2 × 0.7 V':'1 × 0.7 V']],
    p:[{x:[0,tE],y:[-Vp*1.1,Vp*1.15],xl:'time (ms)',xf:v=>+(v*1000).toFixed(1)+'',yl:'volts',s:[{p:vi,c:MU,d:'4 4',w:1.4,n:'AC input'},{p:vr,c:AX,w:1.4,n:'rectified (no C)'},{p:vo,c:VC,w:2.6,n:'output with C'}],h:230}]};
});

sim('bjt',[
  {k:'Vin',t:'r',l:'Input (GPIO) Vin',min:0,max:5,step:0.05,v:3.3,u:'V'},
  {k:'Rb',t:'r',l:'Base resistor Rb',min:100,max:100000,log:1,v:1000,u:'Ω'},
  {k:'b',t:'r',l:'Current gain β (hFE)',min:20,max:400,step:5,v:100,f:v=>v},
  {k:'Vcc',t:'r',l:'Load supply Vcc',min:3,max:24,step:0.5,v:12,u:'V'},
  {k:'Rc',t:'r',l:'Load resistance Rc',min:10,max:10000,log:1,v:120,u:'Ω'}
],({Vin,Rb,b,Vcc,Rc})=>{
  const calc=v=>{const Ib=v>0.7?(v-0.7)/Rb:0,Isat=(Vcc-0.2)/Rc;if(Ib<=0)return {Ib:0,Ic:0,Vce:Vcc,rg:'Cutoff'};if(b*Ib>=Isat)return {Ib,Ic:Isat,Vce:0.2,rg:'Saturation'};return {Ib,Ic:b*Ib,Vce:Vcc-b*Ib*Rc,rg:'Active'}};
  const q=calc(Vin),Isat=(Vcc-0.2)/Rc,od=q.Ib*b/Isat,Rbr=Vin>0.8?(Vin-0.7)/(Isat/10):NaN,P=q.Vce*q.Ic;
  const s=Rl(260,22,'Vcc '+eng(Vcc,'V'))+W([260,22],[260,40])+C('R',260,40,260,105,'Rc (load)\n'+eng(Rc,'Ω'))+W([260,105],[260,110])+BJT(250,140,{lab:'NPN'})+W([260,170],[260,185])+Gd(260,185)+
    Tm(70,140)+T(62,144,'Vin '+eng(Vin,'V'),'end','nv')+W([70,140],[110,140])+C('R',110,140,190,140,'Rb  '+eng(Rb,'Ω'))+W([190,140],[220,140])+
    T(276,118,'Vce = '+eng(q.Vce,'V'),'start','nv')+T(205,170,'Ib','middle','iv')+F([[70,140],[110,140]],q.Ib)+F([[190,140],[220,140]],q.Ib)+F([[260,22],[260,40]],q.Ic)+F([[260,105],[260,110]],q.Ic)+F([[260,170],[260,185]],q.Ic+q.Ib);
  return {sch:S(400,210,s,470),ro:[['Region',q.rg,q.rg==='Saturation'?'ok':q.rg==='Active'?'warn':''],['Base current Ib',eng(q.Ib,'A')],['Collector current Ic',eng(q.Ic,'A')],['Vce',eng(q.Vce,'V')],['Transistor power',eng(P,'W'),P>0.5?'bad':P>0.25?'warn':''],['Overdrive βIb / Ic(sat)',q.Ib?od.toFixed(1)+'×':'—',od>=2?'ok':''],['Rb for hard switch (β=10)',isFinite(Rbr)?eng(Rbr,'Ω'):'—'],['GPIO must supply Ib',q.Ib>0.012?'too much — use a MOSFET':q.Ib>0.004?'check pin drive limit':'OK',q.Ib>0.012?'bad':q.Ib>0.004?'warn':'ok']],
    p:[{x:[0,5],y:[0,Isat*1.18],xl:'Vin (V)',yl:'collector current (A)',s:[{p:lin(0,5,200).map(v=>[v,calc(v).Ic]),c:IC,n:'Ic vs Vin'}],hl:[{y:Isat,l:'Ic(sat) = (Vcc − 0.2)/Rc',left:1,below:1}],dots:[{x:Vin,y:q.Ic,c:IC,l:q.rg}],h:190}],
    n:'For a switch you want saturation: Vce ≈ 0.2 V and very little power wasted. The "active" region (orange) is where the BJT behaves as an amplifier and gets hot.'};
});

sim('fet',[
  {k:'Vgs',t:'r',l:'Gate voltage Vgs',min:0,max:10,step:0.05,v:5,u:'V'},
  {k:'Vth',t:'r',l:'Threshold Vgs(th)',min:0.5,max:4,step:0.1,v:2,u:'V'},
  {k:'k',t:'r',l:'Transconductance k',min:0.05,max:20,log:1,v:2,f:v=>v+' A/V²'},
  {k:'Vdd',t:'r',l:'Supply Vdd',min:1,max:24,step:0.5,v:12,u:'V'},
  {k:'Rd',t:'r',l:'Load Rd',min:0.5,max:1000,log:1,v:10,u:'Ω'}
],({Vgs,Vth,k,Vdd,Rd})=>{
  const Id=(vds,vg)=>{if(vg<=Vth)return 0;const ov=vg-Vth;return vds<ov?k*(ov*vds-vds*vds/2):k/2*ov*ov};
  let lo=0,hi=Vdd;for(let i=0;i<70;i++){const v=(lo+hi)/2;if(Id(v,Vgs)-(Vdd-v)/Rd>0)hi=v;else lo=v}
  const Vds=(lo+hi)/2,I=(Vdd-Vds)/Rd,ov=Vgs-Vth,rg=Vgs<=Vth?'Cutoff (off)':Vds<ov?'Ohmic (fully on)':'Saturation',P=Vds*I,Ron=ov>0?1/(k*ov):Infinity;
  const ymax=Math.max(Vdd/Rd,I)*1.25,vds=lin(0,Vdd,160),fam=[1,2,3,4,6].map(d=>Vth+d).filter(v=>v<=10);
  const s=Rl(260,22,'Vdd '+eng(Vdd,'V'))+W([260,22],[260,40])+C('R',260,40,260,105,'load Rd\n'+eng(Rd,'Ω'))+W([260,105],[260,110])+FET(250,140,{lab:'N-ch'})+W([260,170],[260,190])+Gd(260,190)+
    Tm(40,140)+T(34,144,'Vgs','end','nv')+C('R',40,140,120,140,'RG 100 Ω')+W([120,140],[220,140])+Dt(160,140)+C('R',160,140,160,200,'pull-down\n10 kΩ',{flip:1})+Gd(160,200)+
    T(312,118,'Vds = '+eng(Vds,'V'),'start','nv')+F([[260,22],[260,40]],I)+F([[260,105],[260,110]],I)+F([[260,170],[260,190]],I);
  return {sch:S(400,225,s,470),ro:[['Region',rg,Vgs<=Vth?'':Vds<ov?'ok':'warn'],['Drain current Id',eng(I,'A')],['Vds',eng(Vds,'V')],['MOSFET power',eng(P,'W'),P>1?'bad':P>0.3?'warn':''],['Rds(on) ≈ 1/(k·Vov)',isFinite(Ron)?eng(Ron,'Ω'):'—'],['Overdrive Vgs − Vth',eng(Math.max(0,ov),'V')]],
    p:[{x:[0,Vdd],y:[0,ymax],xl:'Vds (V)',yl:'drain current Id (A)',s:[...fam.map(v=>({p:vds.map(x=>[x,Id(x,v)]),c:MU,w:1.1,o:.7})),{p:vds.map(x=>[x,Id(x,Vgs)]),c:IC,w:2.6,n:'Id at your Vgs'},{p:vds.filter(x=>x<=Math.sqrt(2*ymax/k)).map(x=>[x,k/2*x*x]),c:AX,d:'3 4',w:1.3,n:'triode / saturation edge'},{p:[[0,Vdd/Rd],[Vdd,0]],c:VC,d:'6 4',n:'load line'}],dots:[{x:Vds,y:I,l:'Q'}],h:240,lg:'<span>grey: Vgs = Vth + 1, 2, 3, 4, 6 V</span>'}],
    n:'Square-law model (good for intuition, not datasheet-accurate). For switching you want the operating point in the ohmic region near Vds ≈ 0 — check the datasheet\'s Rds(on) at the gate voltage your microcontroller can actually supply.'};
});

sim('oa',[
  {k:'cf',t:'sel',l:'Configuration',o:[['ni','Non-inverting amplifier'],['inv','Inverting amplifier'],['fo','Voltage follower (buffer)'],['cmp','Comparator']],v:'ni'},
  {k:'A',t:'r',l:'Input amplitude',min:0,max:5,step:0.05,v:1,u:'V'},
  {k:'Rf',t:'r',l:'Feedback Rf',min:1000,max:1000000,log:1,v:20000,u:'Ω',show:s=>s.cf==='ni'||s.cf==='inv'},
  {k:'Rg',t:'r',l:'Rg (Rin when inverting)',min:1000,max:1000000,log:1,v:10000,u:'Ω',show:s=>s.cf==='ni'||s.cf==='inv'},
  {k:'Vr',t:'r',l:'Reference Vref',min:-5,max:5,step:0.05,v:0.5,u:'V',show:s=>s.cf==='cmp'},
  {k:'rail',t:'r',l:'Supply rails ±',min:3,max:15,step:0.5,v:12,u:'V'}
],({cf,A,Rf,Rg,Vr,rail})=>{
  const Vs=rail-1,G=cf==='ni'?1+Rf/Rg:cf==='inv'?-Rf/Rg:cf==='fo'?1:NaN,ts=lin(0,0.002,300),vin=t=>A*Math.sin(PI2*1000*t);
  const vo=t=>cf==='cmp'?(vin(t)>Vr?Vs:-Vs):clamp(G*vin(t),-Vs,Vs),clip=cf!=='cmp'&&Math.abs(G*A)>Vs;
  let s=OA(220,110)+W([265,110],[320,110])+Tm(320,110)+T(326,114,'Vout','start','nv')+Dt(290,110)+T(210,64,'+'+eng(rail,'V'),'middle','vv')+T(210,164,'−'+eng(rail,'V'),'middle','vv')+`<path d="M210 87V70M210 133V150" style="stroke:var(--mut)"/>`;
  if(cf==='ni')s+=Tm(60,150)+T(52,154,'Vin','end','nv')+W([60,150],[165,150],[165,124],[180,124])+W([180,96],[150,96],[150,40],[175,40])+C('R',175,40,255,40,'Rf  '+eng(Rf,'Ω'))+W([255,40],[290,40],[290,110])+Dt(150,96)+C('R',150,96,85,96,'Rg  '+eng(Rg,'Ω'),{flip:1,ld:16})+W([85,96],[70,96],[70,104])+Gd(70,104);
  if(cf==='inv')s+=Tm(40,96)+T(34,100,'Vin','end','nv')+C('R',40,96,130,96,'Rin  '+eng(Rg,'Ω'),{flip:1,ld:16})+W([130,96],[180,96])+Dt(150,96)+W([150,96],[150,40],[175,40])+C('R',175,40,255,40,'Rf  '+eng(Rf,'Ω'))+W([255,40],[290,40],[290,110])+W([180,124],[160,124],[160,150])+Gd(160,150);
  if(cf==='fo')s+=Tm(70,124)+T(62,128,'Vin','end','nv')+W([70,124],[180,124])+W([180,96],[150,96],[150,40],[290,40],[290,110]);
  if(cf==='cmp')s+=Tm(70,124)+T(62,128,'Vin','end','nv')+W([70,124],[180,124])+Tm(70,96)+T(62,100,'Vref','end','nv')+W([70,96],[180,96]);
  const sch=S(400,200,s,470);
  return {sch,ro:[['Gain',cf==='cmp'?'open-loop (≈10⁵)':(G>0?'+':'')+G.toPrecision(3)+'×'],['Formula',cf==='ni'?'1 + Rf/Rg':cf==='inv'?'−Rf/Rin':cf==='fo'?'Vout = Vin':'Vin > Vref → +sat'],['Output peak',cf==='cmp'?eng(Vs,'V'):eng(Math.min(Math.abs(G*A),Vs),'V')],['Clipping',clip?'Yes — output hits the rail':'No',clip?'bad':'ok']],
    p:[{x:[0,0.002],y:[-rail,rail],xl:'time (ms) — 1 kHz input',xf:v=>+(v*1000).toFixed(1)+'',yl:'volts',s:[{p:ts.map(t=>[t,vin(t)]),c:VC,d:'5 4',n:'Vin'},{p:ts.map(t=>[t,vo(t)]),c:IC,w:2.6,n:'Vout'}],hl:[{y:Vs,l:'output limit (rail − ~1 V)',left:1,below:1},{y:-Vs,l:'',left:1},...(cf==='cmp'?[{y:Vr,l:'Vref',c:AX,below:1}]:[])],h:220}]};
});
