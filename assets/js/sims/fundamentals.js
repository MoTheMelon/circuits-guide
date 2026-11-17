/* ================= FUNDAMENTALS ================= */
sim('ohm',[
  {k:'V',t:'r',l:'Supply voltage V',min:0,max:24,step:0.1,v:9,u:'V'},
  {k:'R',t:'r',l:'Resistance R',min:10,max:100000,log:1,v:1000,u:'Ω'}
],({V,R})=>{
  const I=V/R,P=V*I;
  const sch=S(340,200,
    W([70,70],[70,40],[270,40],[270,70])+W([270,130],[270,160],[70,160],[70,130])+
    C('bat',70,70,70,130,eng(V,'V'),{flip:1})+C('R',270,70,270,130,'R\n'+eng(R,'Ω'))+
    F([[70,70],[70,40],[270,40],[270,70]],I)+F([[270,130],[270,160],[70,160],[70,130]],I)+
    T(170,28,'I = '+eng(I,'A'),'middle','iv')+T(170,186,'electrons flow the other way; arrows show conventional current','middle','vv'),400);
  return {sch,ro:[['Current  I = V / R',eng(I,'A')],['Power  P = V·I',eng(P,'W'),P>0.25?'bad':''],['¼ W resistor',P>0.25?'Overloaded':'Within rating',P>0.25?'bad':'ok'],['Conductance  G = 1/R',eng(1/R,'S')]],
    p:[{x:[0,24],y:[0,24/R*1.05],xl:'V (volts)',yl:'I (amps)',s:[{p:[[0,0],[24,24/R]],c:IC,n:'I–V line of this resistor (slope = 1/R)'}],dots:[{x:V,y:I,l:eng(I,'A')}],h:200}]};
});

sim('kvl',[
  {k:'Vs',t:'r',l:'Source Vs',min:0,max:24,step:0.1,v:12,u:'V'},
  {k:'R1',t:'r',l:'R1',min:10,max:100000,log:1,v:1000,u:'Ω'},
  {k:'R2',t:'r',l:'R2',min:10,max:100000,log:1,v:2200,u:'Ω'},
  {k:'R3',t:'r',l:'R3',min:10,max:100000,log:1,v:4700,u:'Ω'}
],({Vs,R1,R2,R3})=>{
  const R23=par(R2,R3),I1=Vs/(R1+R23),V1=I1*R1,V23=I1*R23,I2=V23/R2,I3=V23/R3;
  const sch=S(400,230,
    W([50,75],[50,40],[100,40])+W([180,40],[340,40],[340,80])+W([230,40],[230,80])+W([230,150],[230,190])+W([340,150],[340,190],[50,190],[50,145])+
    C('bat',50,75,50,145,'Vs\n'+eng(Vs,'V'),{flip:1})+C('R',100,40,180,40,'R1  '+eng(R1,'Ω')+'\nV1 = '+eng(V1,'V'))+
    C('R',230,80,230,150,'R2\n'+eng(R2,'Ω')+'\nI2 = '+eng(I2,'A'))+C('R',340,80,340,150,'R3\n'+eng(R3,'Ω')+'\nI3 = '+eng(I3,'A'))+
    Dt(230,40)+Dt(230,190)+T(238,32,'node A = '+eng(V23,'V'),'start','nv')+
    F([[50,75],[50,40],[100,40]],I1)+F([[180,40],[230,40]],I1)+F([[230,40],[340,40],[340,80]],I3)+F([[230,40],[230,80]],I2)+F([[230,150],[230,190]],I2)+F([[340,150],[340,190],[230,190]],I3)+F([[230,190],[50,190],[50,145]],I1)+
    T(140,215,'I1 = '+eng(I1,'A'),'middle','iv'),470);
  const vb=Vs>0?`<div class="vbar" aria-label="voltage budget"><span style="flex:${V1};background:var(--v)">V1 ${eng(V1,'V')}</span><span style="flex:${V23};background:var(--i)">V(A) ${eng(V23,'V')}</span></div><p class="note">KVL budget: every volt the source supplies is dropped somewhere around the loop.</p>`:'';
  return {sch,x:vb,ro:[['KCL at node A','I1 = I2 + I3','ok'],['I1 (into A)',eng(I1,'A')],['I2 + I3 (out of A)',eng(I2+I3,'A')],['KVL: Vs − V1 − V(A)',eng(Vs-V1-V23,'V'),'ok'],['R2 ∥ R3',eng(R23,'Ω')],['Total R',eng(R1+R23,'Ω')]]};
});

sim('sp',[
  {k:'mode',t:'seg',l:'Connection',o:[['s','Series'],['p','Parallel']],v:'s'},
  {k:'n',t:'r',l:'Number of resistors',min:2,max:6,step:1,v:3,f:v=>v},
  ...[1000,2200,4700,10000,330,47000].map((v,i)=>({k:'R'+(i+1),t:'r',l:'R'+(i+1),min:10,max:100000,log:1,v,u:'Ω',show:st=>st.n>i}))
],st=>{
  const n=st.n,rs=Array.from({length:n},(_,i)=>st['R'+(i+1)]);
  const ser=st.mode==='s',Req=ser?rs.reduce((a,b)=>a+b,0):par(...rs);
  let s='';
  if(ser){
    const w=60+n*90;let x=30;s+=Tm(20,60)+W([20,60],[30,60]);
    rs.forEach((r,i)=>{s+=C('R',x,60,x+90,60,'R'+(i+1)+'\n'+eng(r,'Ω'));if(i)s+=Dt(x,60);x+=90});
    s+=W([x,60],[x+10,60])+Tm(x+10,60)+T(14,64,'A','end')+T(x+16,64,'B');
    return out(S(Math.max(w+20,200),100,s,Math.min(820,(w+20)*1.2)));
  }
  const w=90+n*80;s+=Tm(20,30)+Tm(20,150)+T(14,34,'A','end')+T(14,154,'B','end')+W([20,30],[60+(n-1)*80,30])+W([20,150],[60+(n-1)*80,150]);
  rs.forEach((r,i)=>{const x=60+i*80;s+=C('R',x,30,x,150,'R'+(i+1)+'\n'+eng(r,'Ω'));if(i>0)s+=Dt(x,30)+Dt(x,150)});
  return out(S(Math.max(w,200),180,s,Math.min(820,w*1.25)));
  function out(sch){
    const f=ser?`R<sub>eq</sub> = ${rs.map((r,i)=>`R${i+1}`).join(' + ')} = ${rs.map(r=>eng(r,'Ω')).join(' + ')}`:`1/R<sub>eq</sub> = ${rs.map((r,i)=>`1/R${i+1}`).join(' + ')}`;
    const mn=Math.min(...rs),mx=Math.max(...rs);
    return {sch,x:`<p class="note mono" style="color:var(--ink)">${f}</p>`,ro:[['Equivalent R<sub>eq</sub>',eng(Req,'Ω'),'ok'],ser?['Largest single R',eng(mx,'Ω')]:['Smallest single R',eng(mn,'Ω')],['Current at 10 V',eng(10/Req,'A')],ser?['Same current through each','yes']:['Same voltage across each','yes']],
      n:ser?'Series: R<sub>eq</sub> is always larger than the largest resistor. Current is identical in every part; voltages divide in proportion to R.':'Parallel: R<sub>eq</sub> is always smaller than the smallest resistor. Voltage is identical across every branch; currents divide in proportion to 1/R.'};
  }
});

sim('div',[
  {k:'Vin',t:'r',l:'Input Vin',min:0,max:24,step:0.1,v:12,u:'V'},
  {k:'R1',t:'r',l:'R1 (top)',min:100,max:1000000,log:1,v:10000,u:'Ω'},
  {k:'R2',t:'r',l:'R2 (bottom)',min:100,max:1000000,log:1,v:10000,u:'Ω'},
  {k:'ld',t:'tog',l:'Connect a load RL',v:false},
  {k:'RL',t:'r',l:'Load RL',min:100,max:1000000,log:1,v:10000,u:'Ω',show:s=>s.ld}
],({Vin,R1,R2,ld,RL})=>{
  const R2e=ld?par(R2,RL):R2,Vo=Vin*R2e/(R1+R2e),Vu=Vin*R2/(R1+R2),I=Vin/(R1+R2e),err=Vu?(Vo-Vu)/Vu:0,IL=ld?Vo/RL:0;
  let s=W([50,75],[50,30],[200,30],[200,50])+W([200,120],[200,135])+W([200,105],[200,120],[300,120])+W([200,135],[200,135])+W([200,190],[200,205],[50,205],[50,145])+
    C('bat',50,75,50,145,'Vin\n'+eng(Vin,'V'),{flip:1})+C('R',200,50,200,120,'R1\n'+eng(R1,'Ω'))+C('R',200,120,200,190,'R2\n'+eng(R2,'Ω'))+Dt(200,120)+
    T(250,112,'Vout = '+eng(Vo,'V'),'middle','nv')+F([[50,75],[50,30],[200,30],[200,50]],I)+F([[200,190],[200,205],[50,205],[50,145]],I);
  if(ld)s+=C('R',300,120,300,205,'RL\n'+eng(RL,'Ω'))+W([300,205],[200,205])+Dt(200,205)+F([[200,120],[300,120],[300,140]],IL);
  else s+=Tm(300,120)+W([200,205],[300,205])+Tm(300,205)+Dt(200,205)+T(308,170,'open\n(no load)','start','vv');
  const pts=lgs(100,1e6,120).map(r=>[r,Vin*par(R2,r)/(R1+par(R2,r))]);
  return {sch:S(390,225,s,470),ro:[['Vout'+(ld?' (loaded)':''),eng(Vo,'V'),'ok'],['Vout unloaded',eng(Vu,'V')],['Loading error',ld?pct(err):'—',Math.abs(err)>0.05?'warn':''],['Divider current',eng(I,'A')],['Power in R1+R2',eng(I*I*(R1)+(Vo*Vo/R2),'W')],['Ratio R2/(R1+R2)',(R2/(R1+R2)).toFixed(3)]],
    p:[{x:[100,1e6],xlog:1,y:[0,Math.max(Vu*1.15,0.1)],xl:'load resistance RL (Ω)',yl:'Vout (V)',s:[{p:pts,c:VC,n:'Vout as the load changes'}],hl:[{y:Vu,l:'unloaded '+eng(Vu,'V'),left:1,below:1}],dots:ld?[{x:RL,y:Vo,l:eng(Vo,'V')}]:[],h:200}],
    n:'Rule of thumb: keep RL at least 10× larger than R2 for &lt;5% error, or buffer the divider with an op-amp follower.'};
});

sim('thev',[
  {k:'Vin',t:'r',l:'Vin',min:0,max:24,step:0.1,v:12,u:'V'},
  {k:'R1',t:'r',l:'R1',min:10,max:100000,log:1,v:1000,u:'Ω'},
  {k:'R2',t:'r',l:'R2',min:10,max:100000,log:1,v:1000,u:'Ω'},
  {k:'RL',t:'r',l:'Load RL',min:10,max:100000,log:1,v:220,u:'Ω'}
],({Vin,R1,R2,RL})=>{
  const Vth=Vin*R2/(R1+R2),Rth=par(R1,R2),IL=Vth/(Rth+RL),VL=IL*RL,PL=IL*VL,Pm=Vth*Vth/(4*Rth);
  const s=W([40,75],[40,40],[55,40])+W([125,40],[170,40])+W([150,40],[150,70])+W([150,140],[150,180])+W([40,140],[40,180],[170,180])+
    C('bat',40,75,40,140,'Vin',{flip:1})+C('R',55,40,125,40,'R1')+C('R',150,70,150,140,'R2')+Dt(150,40)+Dt(150,180)+Tm(170,40)+Tm(170,180)+T(176,44,'A')+T(176,184,'B')+
    T(215,116,'≡','middle','big')+T(215,200,'same behaviour at A–B','middle','vv')+'<g transform="translate(20 0)">'+
    W([270,75],[270,40],[290,40])+W([360,40],[400,40],[400,75])+W([400,145],[400,180],[270,180],[270,140])+
    C('bat',270,75,270,140,'Vth\n'+eng(Vth,'V'),{flip:1})+C('R',290,40,360,40,'Rth  '+eng(Rth,'Ω'))+C('R',400,75,400,145,'RL\n'+eng(RL,'Ω'))+Dt(380,40)+Dt(380,180)+T(380,30,'A','middle')+T(380,198,'B','middle')+
    F([[270,75],[270,40],[290,40]],IL)+F([[360,40],[400,40],[400,75]],IL)+F([[400,145],[400,180],[270,180],[270,140]],IL)+'</g>';
  const pts=lgs(10,100000,140).map(r=>[r,Vth*Vth*r/((Rth+r)**2)]);
  return {sch:S(490,210,s,580),ro:[['Vth = Vin·R2/(R1+R2)',eng(Vth,'V')],['Rth = R1 ∥ R2',eng(Rth,'Ω')],['Load current',eng(IL,'A')],['Load voltage',eng(VL,'V')],['Load power',eng(PL,'W'),Math.abs(RL-Rth)/Rth<0.15?'ok':''],['Max possible (RL = Rth)',eng(Pm,'W')]],
    p:[{x:[10,100000],xlog:1,y:[0,Pm*1.15||1],xl:'RL (Ω)',yl:'power into RL (W)',s:[{p:pts,c:VC,n:'P(RL)'}],vl:[{x:Rth,l:'RL = Rth'}],dots:[{x:RL,y:PL,l:eng(PL,'W')}],h:200}]};
});

sim('ac',[
  {k:'A',t:'r',l:'Amplitude (peak)',min:0.5,max:10,step:0.1,v:5,u:'V'},
  {k:'f',t:'r',l:'Frequency f',min:10,max:500,step:5,v:60,u:'Hz'},
  {k:'off',t:'r',l:'DC offset',min:-5,max:5,step:0.1,v:0,u:'V'},
  {k:'ph',t:'r',l:'Phase of signal B',min:0,max:360,step:5,v:90,f:v=>v+'°'}
],({A,f,off,ph})=>{
  const T_=1/f,Vr=A/Math.SQRT2,Vt=Math.sqrt(off*off+Vr*Vr),tw=0.04,ts=lin(0,tw,500),pr=ph*Math.PI/180;
  const cx=110,cy=100,r=70,bx=cx+r*Math.cos(-pr),by=cy+r*Math.sin(-pr);
  const sch=S(220,200,`<circle cx="${cx}" cy="${cy}" r="${r}" style="stroke:var(--line);stroke-width:1"/><path d="M${cx-r-8} ${cy}H${cx+r+8}M${cx} ${cy-r-8}V${cy+r+8}" style="stroke:var(--line);stroke-width:1"/>`+
    `<path d="M${cx} ${cy}L${cx+r-6} ${cy}" style="stroke:var(--v)"/>`+ah(cx+r,cy,1,0,8,4).replace('class="f"','class="f" style="fill:var(--v)"')+
    `<path d="M${cx} ${cy}L${bx-6*Math.cos(-pr)} ${by-6*Math.sin(-pr)}" style="stroke:var(--i)"/>`+ah(bx,by,Math.cos(-pr),Math.sin(-pr),8,4).replace('class="f"','class="f" style="fill:var(--i)"')+
    T(cx+r+4,cy-8,'A','start','nv')+T(bx+(Math.cos(-pr)>=0?6:-6),by+(Math.sin(-pr)>0?16:-6),'B',Math.cos(-pr)>=0?'start':'end','iv')+T(cx,196,'phasors (rotate at ω)','middle','vv'),260);
  return {sch,ro:[['Peak Vp',eng(A,'V')],['Peak-to-peak Vpp',eng(2*A,'V')],['RMS (AC part) Vp/√2',eng(Vr,'V')],['RMS incl. offset',eng(Vt,'V')],['Period T = 1/f',eng(T_,'s')],['ω = 2πf',eng(PI2*f,'rad/s')],['B lags A by',eng(ph/360*T_,'s')]],
    p:[{x:[0,tw],y:[-16,16],xf:v=>+(v*1000).toFixed(1)+'',xl:'time (ms)',yl:'volts',s:[{p:ts.map(t=>[t,off+A*Math.sin(PI2*f*t)]),c:VC,n:'A = offset + Vp·sin(ωt)'},{p:ts.map(t=>[t,A*Math.sin(PI2*f*t-pr)]),c:IC,d:'6 4',n:'B = Vp·sin(ωt − φ)'}],hl:[{y:off+Vr,l:'Vrms level',c:VC}],h:230}]};
});
