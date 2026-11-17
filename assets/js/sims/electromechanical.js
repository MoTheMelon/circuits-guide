/* ================= SWITCHES & ELECTROMECHANICAL ================= */
sim('pull',[
  {k:'cf',t:'seg',l:'Input wiring',o:[['up','Pull-up'],['dn','Pull-down'],['fl','No resistor']],v:'up'},
  {k:'pr',t:'tog',l:'Button pressed',v:false},
  {k:'R',t:'r',l:'Resistor',min:1000,max:100000,log:1,v:10000,u:'Ω',show:s=>s.cf!=='fl'},
  {k:'V',t:'seg',l:'Logic supply',o:[['3.3','3.3 V'],['5','5 V']],v:'3.3'}
],st=>{
  const V=+st.V,{cf,pr,R}=st;let pin,lv,I=0;
  if(cf==='up'){pin=pr?0:V;lv=pr?'LOW (0)':'HIGH (1)';I=pr?V/R:0}
  else if(cf==='dn'){pin=pr?V:0;lv=pr?'HIGH (1)':'LOW (0)';I=pr?V/R:0}
  else{pin=pr?0:NaN;lv=pr?'LOW (0)':'Floating — random'}
  const ic=ICB(270,80,110,60,'MCU',[{s:'l',at:30,n:'GPIO'}]);
  let s=ic.s+W([150,110],[256,110])+Dt(150,110)+T(205,102,isNaN(pin)?'? V':eng(pin,'V'),'middle','nv');
  if(cf==='up')s+=Rl(150,22,eng(V,'V'))+W([150,22],[150,30])+C('R',150,30,150,105,'pull-up\n'+eng(R,'Ω'))+W([150,105],[150,110])+C('PB',150,180,150,110,'button',{on:pr,flip:1})+Gd(150,180)+F([[150,22],[150,30]],I)+F([[150,105],[150,110]],I);
  else if(cf==='dn')s+=Rl(150,22,eng(V,'V'))+W([150,22],[150,30])+C('PB',150,105,150,30,'button',{on:pr,flip:1})+W([150,105],[150,110])+C('R',150,110,150,180,'pull-down\n'+eng(R,'Ω'))+Gd(150,180)+F([[150,22],[150,30]],I)+F([[150,105],[150,110]],I);
  else s+=C('PB',150,180,150,110,'button',{on:pr,flip:1})+Gd(150,180)+T(60,60,'nothing defines the pin\nwhen the button is open','start','vv');
  return {sch:S(400,205,s,470),ro:[['Pin voltage',isNaN(pin)?'undefined':eng(pin,'V'),isNaN(pin)?'bad':'ok'],['Logic level read',lv,isNaN(pin)?'bad':''],['Current while pressed',cf==='fl'?'—':eng(V/R,'A')],['Power while pressed',cf==='fl'?'—':eng(V*V/R,'W')]]};
});

const BOUNCE_P=[3,3.4,3.7,4.3,4.6,5.2,5.4,6.1,6.25],BOUNCE_R=[30,30.3,30.5,31.2,31.35];
sim('deb',[
  {k:'R',t:'r',l:'Filter R',min:1000,max:100000,log:1,v:10000,u:'Ω'},
  {k:'Cv',t:'r',l:'Filter C',min:1e-8,max:1e-5,log:1,v:1e-6,u:'F'},
  {k:'sm',t:'tog',l:'Schmitt-trigger input',v:true}
],({R,Cv,sm})=>{
  const tau=R*Cv*1000,V=3.3,E=[...BOUNCE_P,...BOUNCE_R],raw=t=>{let n=0;for(const e of E)if(t>=e)n++;return n%2?0:V};
  const dt=0.01,N=4500;let v=V,o=1,eo=0,eR=0,prev=V,tReg=null;const pr=[],pf=[],po=[];
  for(let i=0;i<=N;i++){const t=i*dt,r=raw(t);if(r!==prev){eR++;prev=r}v+=(r-v)*(1-Math.exp(-dt/tau));let no=o;if(sm){if(o&&v<0.33*V)no=0;else if(!o&&v>0.66*V)no=1}else no=v>0.5*V?1:0;if(no!==o){eo++;if(!no&&tReg===null)tReg=t-3}o=no;if(i%3===0){pr.push([t,r]);pf.push([t,v]);po.push([t,o*V])}}
  return {ro:[['Filter τ = RC',eng(tau/1000,'s')],['Raw edges seen',eR,'bad'],['Edges after filter',eo,eo===2?'ok':'warn'],['Press registered after',tReg===null?'never (τ too long)':eng(tReg/1000,'s'),tReg===null?'bad':'']],
    p:[{x:[0,45],y:[-0.2,3.8],xl:'time (ms)',yl:'volts at the pin',xf:v=>v,s:[{p:pr,c:MU,w:1.3,n:'raw switch (bouncing)'},{p:pf,c:VC,n:'after RC filter'}],hl:sm?[{y:0.66*V,l:'VT+',c:AX},{y:0.33*V,l:'VT−',c:AX,below:1}]:[{y:V/2,l:'single threshold',c:AX}],h:210},
       {x:[0,45],y:[-0.3,3.8],xl:'time (ms)',yl:'logic the MCU sees',xf:v=>v,s:[{p:po,c:IC,w:2.4,n:'digital input'}],h:120}],
    n:'A press ideally produces exactly 2 edges (one press, one release). Bounce lasts ~1–10 ms on typical tactile switches; software debouncing (ignore edges for ~20 ms) is the zero-part alternative.'};
});

sim('relay',[
  {k:'on',t:'tog',l:'GPIO drives the relay ON',v:true},
  {k:'Vc',t:'seg',l:'Coil voltage',o:[['5','5 V'],['12','12 V']],v:'5'},
  {k:'Rc',t:'r',l:'Coil resistance',min:25,max:1000,log:1,v:70,u:'Ω'},
  {k:'Vin',t:'seg',l:'GPIO logic level',o:[['3.3','3.3 V'],['5','5 V']],v:'3.3'},
  {k:'fly',t:'tog',l:'Flyback diode fitted',v:true}
],st=>{
  const Vc=+st.Vc,Vin=+st.Vin,{on,Rc,fly}=st,Ic=on?(Vc-0.2)/Rc:0,Ireq=(Vc-0.2)/Rc,Ib=Ireq/10,Rb=(Vin-0.7)/Ib,Rbs=E12.map(e=>[1,10,100,1000,10000].map(m=>e*m)).flat().filter(r=>r<=Rb).pop();
  let s=Rl(150,22,'+'+Vc+' V')+W([150,22],[150,32])+C('COIL',150,32,150,118,'coil\n'+eng(Rc,'Ω'))+W([150,118],[150,140])+BJT(140,170)+W([150,200],[150,208])+Gd(150,208)+
    Tm(44,170)+T(38,174,'GPIO','end','nv')+C('R',44,170,110,170,'Rb '+eng(Rbs,'Ω'),{ld:16})+Dt(150,32)+Dt(150,118);
  if(fly)s+=W([150,32],[100,32],[100,45])+C('D',100,105,100,45,'flyback')+W([100,105],[100,118],[150,118]);
  s+=`<path class="mech" d="M162 100H322"/>`+W([330,60],[330,40],[410,40],[410,60])+C('SW',330,60,330,120,'',{on})+W([330,120],[330,135])+C('bat',330,135,330,195,'load\nsupply',{flip:1})+W([330,195],[330,215],[410,215],[410,130])+C('LAMP',410,60,410,130,'lamp',{on})+
    F([[150,22],[150,32]],Ic)+F([[150,118],[150,140]],Ic)+(on?F([[330,195],[330,215],[410,215],[410,130]],0.5,{rev:1})+F([[410,60],[410,40],[330,40],[330,60]],0.5,{rev:1}):'');
  return {sch:S(450,230,s,520).replace('viewBox="0 0','viewBox="-10 0'),ro:[['Coil current',eng(Ic,'A')],['Base current (forced β = 10)',eng(Ib,'A')],['Rb ≤ (Vin − 0.7)/Ib',eng(Rb,'Ω')],['Pick (E12, round down)',eng(Rbs,'Ω'),'ok'],['GPIO can drive coil directly?',Ireq>0.012?'No — needs a transistor':'Maybe (check datasheet)',Ireq>0.012?'warn':''],['Turn-off spike',fly?'clamped ≈ Vcc + 0.7 V':'hundreds of volts!',fly?'ok':'bad']]};
});

sim('sol',[
  {k:'V',t:'r',l:'Supply V',min:3,max:24,step:0.5,v:12,u:'V'},
  {k:'R',t:'r',l:'Coil resistance',min:1,max:100,log:1,v:20,u:'Ω'},
  {k:'L',t:'r',l:'Coil inductance',min:1e-4,max:1,log:1,v:0.02,u:'H'},
  {k:'fly',t:'tog',l:'Flyback diode fitted',v:true},
  {k:'Vbr',t:'r',l:'MOSFET breakdown Vds(max)',min:20,max:100,step:5,v:60,u:'V',show:s=>!s.fly}
],({V,R,L,fly,Vbr})=>{
  const tau=L/R,I0=V/R,t1=0.5*tau,t2=4.5*tau,tE=9*tau,N=900,Ip=[],Vp=[];
  const Ioff=I0*(1-Math.exp(-(t2-t1)/tau)),Iinf=(V-Vbr)/R;let tz=null;
  for(let i=0;i<=N;i++){const t=i*tE/N;let I,Vd;
    if(t<t1){I=0;Vd=V}else if(t<t2){I=I0*(1-Math.exp(-(t-t1)/tau));Vd=I*0.05}
    else{const dtt=t-t2;if(fly){I=(Ioff+0.7/R)*Math.exp(-dtt/tau)-0.7/R}else{I=Iinf+(Ioff-Iinf)*Math.exp(-dtt/tau)}if(I<=0){I=0;Vd=V;if(tz===null)tz=dtt}else Vd=fly?V+0.7:Vbr}
    Ip.push([t,I]);Vp.push([t,Vd])}
  const E=0.5*L*Ioff*Ioff,pk=fly?V+0.7:Vbr;
  const s=Rl(260,22,'+'+eng(V,'V'))+W([260,22],[260,32])+C('SOL',260,32,260,108,'solenoid\n'+eng(R,'Ω')+', '+eng(L,'H'))+W([260,108],[260,110])+Dt(260,32)+Dt(260,108)+
    (fly?W([260,32],[205,32],[205,45])+C('D',205,100,205,45,'flyback')+W([205,100],[205,108],[260,108]):'')+
    FET(250,140,{lab:'N-ch\nlogic-level'})+W([260,170],[260,190])+Gd(260,190)+Tm(44,140)+T(38,144,'GPIO','end','nv')+C('R',44,140,110,140,'RG 100 Ω',{ld:16})+W([110,140],[220,140])+Dt(150,140)+C('R',150,140,150,200,'10 kΩ',{flip:1})+Gd(150,200);
  return {sch:S(420,220,s,500),ro:[['Steady current V/R',eng(I0,'A')],['Time constant L/R',eng(tau,'s')],['Stored energy ½LI²',eng(E,'J')],['Peak drain voltage',eng(pk,'V'),fly?'ok':'bad'],['Current decays in',tz!==null?eng(tz,'s'):'> window',fly?'warn':''],['Where the energy goes',fly?'coil + diode (safe)':'MOSFET avalanche (stress / failure)',fly?'ok':'bad']],
    p:[{x:[0,tE],y:[0,Math.max(pk,V)*1.15],xl:'time',xf:v=>eng(v,'s'),yl:'drain voltage (V)',s:[{p:Vp,c:VC,n:'Vdrain'}],vl:[{x:t1,l:'gate ON'},{x:t2,l:'gate OFF'}],hl:[{y:V,l:'supply',left:1,below:1}],h:190},
       {x:[0,tE],y:[0,I0*1.15],xl:'time',xf:v=>eng(v,'s'),yl:'coil current (A)',s:[{p:Ip,c:IC,n:'I(coil)'}],vl:[{x:t2,l:''}],h:160}],
    n:'Trade-off: a plain diode is safest but the current (and the solenoid\'s magnetic hold) decays slowly, so release is sluggish. Adding a Zener in series with the diode lets the voltage rise to Vcc + Vz, collapsing the current much faster while still protecting the MOSFET.'};
});

sim('hb',[
  {k:'S1',t:'tog',l:'S1 (high-side, left)',v:true},
  {k:'S2',t:'tog',l:'S2 (low-side, left)',v:false},
  {k:'S3',t:'tog',l:'S3 (high-side, right)',v:false},
  {k:'S4',t:'tog',l:'S4 (low-side, right)',v:true}
],({S1,S2,S3,S4})=>{
  const sl=S1&&S2,sr=S3&&S4,shoot=sl||sr;let st,vm,f='',cls='ok';
  if(shoot){st='SHOOT-THROUGH — supply shorted!';vm='—';cls='bad';if(sl)f+=F([[200,30],[100,30],[100,220],[200,220]],1,{bad:1});if(sr)f+=F([[200,30],[300,30],[300,220],[200,220]],1,{bad:1})}
  else if(S1&&S4){st='Forward';vm='+V';f=F([[200,30],[100,30],[100,125],[160,125]],0.5)+F([[240,125],[300,125],[300,220],[200,220]],0.5)}
  else if(S3&&S2){st='Reverse';vm='−V';f=F([[200,30],[300,30],[300,125],[240,125]],0.5)+F([[160,125],[100,125],[100,220],[200,220]],0.5)}
  else if(S2&&S4){st='Brake (low-side short)';vm='0 V, shorted';cls='warn';f=F([[160,125],[100,125],[100,220],[300,220],[300,125],[240,125]],0.003)}
  else if(S1&&S3){st='Brake (high-side short)';vm='0 V, shorted';cls='warn';f=F([[160,125],[100,125],[100,30],[300,30],[300,125],[240,125]],0.003)}
  else{st='Coast (motor floating)';vm='open';cls=''}
  const s=Rl(200,30,'V+')+W([100,30],[300,30])+C('SW',100,30,100,110,'S1',{on:S1,flip:1})+W([100,110],[100,140])+C('SW',100,140,100,220,'S2',{on:S2,flip:1})+W([100,220],[300,220])+Gd(200,220)+
    C('SW',300,30,300,110,'S3',{on:S3})+W([300,110],[300,140])+C('SW',300,140,300,220,'S4',{on:S4})+W([100,125],[160,125])+C('M',160,125,240,125)+W([240,125],[300,125])+Dt(100,125)+Dt(300,125)+Dt(200,30)+Dt(200,220)+
    T(200,165,st==='Forward'?'↻ forward':st==='Reverse'?'↺ reverse':st.startsWith('Brake')?'braking':shoot?'':'coasting','middle',shoot?'nv':'iv')+f;
  return {sch:S(400,250,s,460),ro:[['State',st,cls],['Voltage across motor',vm],['Never close together','S1+S2 or S3+S4',shoot?'bad':'']],
    n:'Real H-bridges use MOSFETs (P-ch or N-ch with a gate-driver high side, N-ch low side), each with a body/freewheel diode, plus dead-time between switching so a leg is never briefly shorted. ICs like the DRV8833, TB6612 or L298 package all of this.'};
});
