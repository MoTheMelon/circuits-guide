/* ================= SENSORS ================= */
sim('hall',[
  {k:'ty',t:'sel',l:'Sensor type',o:[['uni','Unipolar switch (e.g. A3144)'],['lat','Latch (bipolar, e.g. US1881)'],['lin','Linear / ratiometric (e.g. A1324, SS49E)']],v:'uni'},
  {k:'d',t:'r',l:'Magnet distance',min:0,max:30,step:0.5,v:9,f:v=>v+' mm'},
  {k:'pol',t:'seg',l:'Pole facing sensor',o:[['S','South'],['N','North']],v:'S'},
  {k:'Bs',t:'r',l:'Magnet strength (field at face)',min:50,max:600,step:10,v:300,f:v=>v+' mT'},
  {k:'V',t:'seg',l:'Supply',o:[['3.3','3.3 V'],['5','5 V']],v:'5'}
],(st,mem)=>{
  const {ty,d,pol,Bs}=st,V=+st.V,sg=pol==='S'?1:-1,Bf=x=>sg*Bs*(5/(x+5))**3,B=Bf(d);
  const th=ty==='uni'?{op:10,rp:7}:{op:3,rp:-3};
  let on=mem.on||false;
  if(ty==='uni'){if(B>=th.op)on=true;else if(B<th.rp)on=false}
  if(ty==='lat'){if(B>=th.op)on=true;else if(B<=th.rp)on=false}
  mem.on=on;
  const Sens=0.025*V/5,Vo=ty==='lin'?clamp(V/2+Sens*B,0.2,V-0.2):(on?0.1:V);
  const mx=170-8-d*4-50,sf='#1b5fd1',nf='#d4342a',face=pol;
  let s=`<g transform="translate(40 0)">`;
  s+=`<rect x="${mx}" y="60" width="25" height="50" style="fill:${face==='S'?nf:sf};stroke:none"/><rect x="${mx+25}" y="60" width="25" height="50" style="fill:${face==='S'?sf:nf};stroke:none"/>`+
    `<text x="${mx+12.5}" y="90" text-anchor="middle" style="fill:#fff;font-weight:600">${face==='S'?'N':'S'}</text><text x="${mx+37.5}" y="90" text-anchor="middle" style="fill:#fff;font-weight:600">${face}</text>`+
    `<path d="M${mx+52} 125H168" style="stroke:var(--mut);stroke-width:1"/>`+T((mx+52+168)/2,140,d+' mm','middle','vv');
  const ic=ICB(170,30,60,120,'Hall',[{s:'r',at:15,n:'VCC'},{s:'r',at:65,n:'GND'},{s:'r',at:105,n:'OUT'}],{ty:40});
  s+=ic.s+W([244,45],[310,45])+Rl(310,45,eng(V,'V'))+W([310,45],[340,45])+C('C',262,45,262,95,'100 nF')+Dt(262,45)+Dt(262,95)+W([244,95],[285,95])+Gd(285,95);
  if(ty!=='lin')s+=C('R',340,45,340,135,'10 kΩ\npull-up')+W([244,135],[400,135])+Dt(340,135)+Tm(400,135)+T(400,155,'to GPIO','middle','vv')+F([[340,45],[340,60]],on?V/1e4:0);
  else s+=W([244,135],[400,135])+Tm(400,135)+T(400,155,'to ADC','middle','vv');
  s+=T(300,128,'OUT '+eng(Vo,'V'),'middle','nv')+`</g>`;
  const ds=lin(0,30,160),yl=ty==='lin'?[0,V]:[-50,50];
  return {sch:S(480,190,s,560),ro:[['Field at sensor B',(B>=0?'+':'')+B.toFixed(1)+' mT ('+(B*10).toFixed(0)+' G)'],ty==='lin'?['Output voltage',eng(Vo,'V'),'ok']:['Output transistor',on?'ON → OUT low':'OFF → OUT high',on?'ok':''],ty==='lin'?['Sensitivity',(Sens*1000).toFixed(1)+' mV/mT']:['GPIO reads',on?'LOW (magnet present)':'HIGH'],ty==='lin'?['Zero-field output','Vcc/2 = '+eng(V/2,'V')]:['Operate / release',th.op+' / '+th.rp+' mT']],
    p:[ty==='lin'?{x:[0,30],y:yl,xl:'distance (mm)',yl:'Vout (V)',s:[{p:ds.map(x=>[x,clamp(V/2+Sens*Bf(x),0.2,V-0.2)]),c:VC,n:'Vout vs distance'}],hl:[{y:V/2,l:'no field = Vcc/2',left:1}],dots:[{x:d,y:Vo,l:eng(Vo,'V')}],h:190}
      :{x:[0,30],y:yl,xl:'distance (mm)',yl:'B (mT), + = south pole',s:[{p:ds.map(x=>[x,Bf(x)]),c:IC,n:'field at sensor'}],hl:[{y:th.op,l:'operate point',c:VC},{y:th.rp,l:'release point',c:AX,below:1,left:1}],dots:[{x:d,y:B,c:IC,l:B.toFixed(1)+' mT'}],h:190}],
    n:ty==='lat'?'A latch remembers: it turns on with a south pole and only turns off when it sees a north pole. Flip the pole to reset it — this is how brushless-motor commutation sensors work.':ty==='uni'?'Hysteresis (operate > release) stops the output chattering when the magnet hovers right at the threshold. Field falls off roughly with distance³, so a few mm makes a big difference.':'Ratiometric: output scales with the supply, so read it with an ADC referenced to the same Vcc. Some linear sensors (e.g. SS49E) are specified only at 5 V — check before powering from 3.3 V.'};
});

function divSch(topT,botT,topL,botL,V,Vo,extra=''){return Rl(150,22,eng(V,'V'))+W([150,22],[150,30])+C(topT,150,30,150,100,topL)+W([150,100],[150,120])+C(botT,150,120,150,190,botL)+Gd(150,190)+Dt(150,110)+W([150,110],[270,110])+Tm(270,110)+T(276,114,'to ADC','start','vv')+T(215,102,eng(Vo,'V'),'middle','nv')+extra}
sim('ldr',[
  {k:'lux',t:'r',l:'Light level',min:0.1,max:100000,log:1,v:300,f:v=>eng(v,'lux')},
  {k:'Rf',t:'r',l:'Fixed resistor',min:1000,max:1000000,log:1,v:10000,u:'Ω'},
  {k:'pos',t:'seg',l:'LDR position',o:[['top','Top'],['bot','Bottom']],v:'top'},
  {k:'V',t:'seg',l:'Supply',o:[['3.3','3.3 V'],['5','5 V']],v:'3.3'}
],st=>{
  const V=+st.V,{lux,Rf,pos}=st,Rl_=x=>clamp(10000*(x/10)**-0.7,80,1e6),Rx=Rl_(lux),top=pos==='top',Vo=x=>{const r=Rl_(x);return top?V*Rf/(r+Rf):V*r/(r+Rf)},vo=Vo(lux);
  const sch=S(360,215,divSch(top?'LDR':'R',top?'R':'LDR',top?'LDR\n'+eng(Rx,'Ω'):'R\n'+eng(Rf,'Ω'),top?'R\n'+eng(Rf,'Ω'):'LDR\n'+eng(Rx,'Ω'),V,vo),430);
  return {sch,ro:[['LDR resistance',eng(Rx,'Ω')],['Vout',eng(vo,'V'),'ok'],['12-bit ADC reading',Math.round(vo/V*4095)],['Best Rf for this light','≈ '+eng(Rx,'Ω')]],
    p:[{x:[0.1,100000],xlog:1,y:[0,V],xl:'illuminance (lux) — 1 moonlight · 300 office · 100k sunlight',yl:'Vout (V)',s:[{p:lgs(0.1,1e5,160).map(x=>[x,Vo(x)]),c:VC,n:'Vout vs light'}],dots:[{x:lux,y:vo,l:eng(vo,'V')}],h:200}],
    n:'Model: R = 10 kΩ × (lux/10)^−0.7 (a typical GL5528). The curve is steepest — most sensitive — around the light level where R(LDR) ≈ R(fixed). LDRs are slow (tens of ms) and imprecise; use a photodiode or a digital light sensor (e.g. BH1750) for measurement.'};
});

sim('ntc',[
  {k:'Tc',t:'r',l:'Temperature',min:-20,max:120,step:0.5,v:25,f:v=>v+' °C'},
  {k:'R0',t:'seg',l:'NTC R₀ at 25 °C',o:[['10000','10 kΩ'],['100000','100 kΩ']],v:'10000'},
  {k:'B',t:'r',l:'Beta coefficient B',min:3000,max:4500,step:10,v:3950,f:v=>v+' K'},
  {k:'Rf',t:'r',l:'Fixed resistor',min:1000,max:100000,log:1,v:10000,u:'Ω'},
  {k:'V',t:'seg',l:'Supply / ADC ref',o:[['3.3','3.3 V'],['5','5 V']],v:'3.3'}
],st=>{
  const V=+st.V,R0=+st.R0,{Tc,B,Rf}=st,Rt=t=>R0*Math.exp(B*(1/(t+273.15)-1/298.15)),Vo=t=>V*Rf/(Rt(t)+Rf),r=Rt(Tc),vo=Vo(Tc),code=Math.round(vo/V*4095);
  const Rb=Rf*(4095/code-1),Tb=1/(1/298.15+Math.log(Rb/R0)/B)-273.15;
  const sch=S(360,215,divSch('TH','R','NTC\n'+eng(r,'Ω'),'R\n'+eng(Rf,'Ω'),V,vo),430);
  return {sch,ro:[['Thermistor R(T)',eng(r,'Ω')],['Vout',eng(vo,'V'),'ok'],['12-bit ADC code',code],['Firmware: R = Rf·(4095/code − 1)',eng(Rb,'Ω')],['Firmware: T from Beta eqn',Tb.toFixed(2)+' °C','ok'],['Self-heating power',eng(V*V*r/((r+Rf)**2),'W')]],
    p:[{x:[-20,120],y:[0,V],xl:'temperature (°C)',yl:'Vout (V)',xf:v=>v,s:[{p:lin(-20,120,141).map(t=>[t,Vo(t)]),c:VC,n:'Vout vs T (NTC on top)'}],dots:[{x:Tc,y:vo,l:eng(vo,'V')}],h:200}]};
});

sim('i2c',[
  {k:'Rp',t:'r',l:'Pull-up Rp',min:470,max:47000,log:1,v:4700,u:'Ω'},
  {k:'Cb',t:'r',l:'Bus capacitance',min:10,max:400,step:5,v:50,f:v=>v+' pF'},
  {k:'V',t:'seg',l:'Bus voltage',o:[['3.3','3.3 V'],['5','5 V']],v:'3.3'},
  {k:'md',t:'seg',l:'Bus speed',o:[['100','100 kHz'],['400','400 kHz']],v:'400'}
],st=>{
  const V=+st.V,{Rp,Cb}=st,f=+st.md*1000,C_=Cb*1e-12,tau=Rp*C_,tr=0.8473*tau,trm=f>1e5?300e-9:1000e-9,Rmin=(V-0.4)/0.003,Rmax=trm/(0.8473*C_),ok=tr<=trm&&Rp>=Rmin;
  const P=1/f,ts=lin(0,2*P,500),w=t=>{const ph=(t%P)/P;if(ph<0.5)return 0;const tt=(ph-0.5)*P;return V*(1-Math.exp(-tt/tau))};
  const m=ICB(20,60,80,100,'MCU',[{s:'r',at:30,n:'SDA'},{s:'r',at:70,n:'SCL'}]),sn=ICB(330,50,100,120,'Sensor',[{s:'l',at:40,n:'SDA'},{s:'l',at:80,n:'SCL'},{s:'t',at:30,n:'VCC'},{s:'b',at:30,n:'GND'}],{ty:65});
  const s=m.s+sn.s+W([114,90],[316,90])+W([114,130],[316,130])+Rl(200,24,eng(V,'V'))+W([170,24],[360,24],[360,36])+C('R',170,24,170,90,'Rp')+C('R',240,24,240,80,'Rp')+W([240,80],[240,130])+Dt(170,90)+Dt(240,130)+Dt(170,24)+Dt(240,24)+Dt(360,24)+
    W([360,24],[450,24],[450,70])+C('C',450,70,450,150,'100 nF')+W([450,150],[450,196],[360,196],[360,184])+Gd(360,196)+Dt(360,196)+T(140,82,'SDA','middle','vv')+T(140,122,'SCL','middle','vv');
  return {sch:S(510,225,s,590),ro:[['Rise time 0.8473·Rp·Cb',eng(tr,'s'),ok?'ok':'bad'],['Spec limit',eng(trm,'s')],['Rp minimum (3 mA sink)',eng(Rmin,'Ω'),Rp<Rmin?'bad':''],['Rp maximum (rise time)',eng(Rmax,'Ω'),Rp>Rmax?'bad':''],['Current when line is low',eng(V/Rp,'A')],['Verdict',ok?'Bus OK':'Out of spec',ok?'ok':'bad']],
    p:[{x:[0,2*P],y:[-0.3,V*1.15],xl:'time',xf:v=>eng(v,'s'),yl:'SCL voltage',s:[{p:ts.map(t=>[t,(t%P)/P<0.5?0:V]),c:MU,d:'4 4',w:1.3,n:'ideal clock'},{p:ts.map(t=>[t,w(t)]),c:VC,n:'actual (RC rise through Rp)'}],hl:[{y:0.7*V,l:'VIH 0.7·Vcc',c:AX},{y:0.3*V,l:'VIL 0.3·Vcc',c:AX,below:1}],h:200}],
    n:'Many breakout boards already include pull-ups. Several boards on one bus put their pull-ups in parallel — that lowers Rp and can drop below the 3 mA minimum.'};
});
