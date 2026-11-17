/* ================= SIGNALS ================= */
sim('pwm',[
  {k:'D',t:'r',l:'Duty cycle',min:0,max:100,step:1,v:60,f:v=>v+' %'},
  {k:'f',t:'r',l:'PWM frequency',min:10,max:100000,log:1,v:1000,u:'Hz'},
  {k:'V',t:'r',l:'Supply voltage',min:3,max:24,step:0.5,v:12,u:'V'},
  {k:'ld',t:'seg',l:'Load',o:[['m','Motor'],['led','LED']],v:'m'}
],({D,f,V,ld})=>{
  const d=D/100,P=1/f,tE=3*P,N=900,dt=tE/N,pw=[],ic=[],tau=0.5e-3,Iss=V/2;let i=d*Iss;
  for(let k=0;k<N*10;k++){const t=k*dt;const v=((t%P)/P)<d?V:0;i+=((v/2)-i)*(1-Math.exp(-dt/tau))}
  for(let k=0;k<=N;k++){const t=k*dt,v=((t%P)/P)<d?V:0;pw.push([t,v]);i+=((v/2)-i)*(1-Math.exp(-dt/tau));ic.push([t,i])}
  const mi=Math.min(...ic.map(p=>p[1])),ma=Math.max(...ic.map(p=>p[1]));
  const ps=[{x:[0,tE],y:[-0.5,V*1.15],xl:'time — 3 periods',xf:v=>eng(v,'s'),yl:'volts',s:[{p:pw,c:VC,n:'PWM output'}],hl:[{y:d*V,l:'average '+eng(d*V,'V'),c:AX}],h:190}];
  if(ld==='m')ps.push({x:[0,tE],y:[0,Iss*1.1],xl:'time',xf:v=>eng(v,'s'),yl:'motor current (A)',s:[{p:ic,c:IC,n:'winding current — smoothed by inductance'}],hl:[{y:d*Iss,l:'average',c:AX}],h:150});
  return {x:`<div><div class="cl" style="margin-bottom:4px"><span>${ld==='m'?'Motor speed (∝ average voltage)':'Perceived LED brightness'}</span><output class="mono">${D} %</output></div><div class="meter"><i style="width:${D}%"></i></div></div>`,
    ro:[['Average V = D·V',eng(d*V,'V'),'ok'],['Period T = 1/f',eng(P,'s')],['On-time D·T',eng(d*P,'s')],['Off-time',eng((1-d)*P,'s')],ld==='m'?['Current ripple (pk–pk)',eng(ma-mi,'A'),(ma-mi)>0.3*Iss?'warn':'']:['Flicker',f<100?'visible':f<400?'maybe on camera':'none',f<100?'bad':'ok'],ld==='m'?['Audible whine',f>=20000?'no (ultrasonic)':'yes, at '+eng(f,'Hz'),f>=20000?'ok':'warn']:['Use a resistor','still needed for each LED']],p:ps};
});

sim('adc',[
  {k:'n',t:'r',l:'Resolution',min:2,max:16,step:1,v:4,f:v=>v+' bits'},
  {k:'Vr',t:'seg',l:'Reference voltage',o:[['3.3','3.3 V'],['5','5 V']],v:'3.3'},
  {k:'Vin',t:'r',l:'Input voltage',min:0,max:5,step:0.005,v:1.3,u:'V'}
],st=>{
  const Vr=+st.Vr,{n,Vin}=st,N=2**n,L=Vr/N,code=clamp(Math.floor(Vin/L),0,N-1),Vq=code*L,err=Vin-Vq,over=Vin>Vr;
  const stp=[];if(N<=1024){for(let c=0;c<N;c++){stp.push([c*L,c],[(c+1)*L,c])}}else{for(let k=0;k<=600;k++){const v=k/600*Vr;stp.push([v,Math.min(N-1,Math.floor(v/L))])}}
  const bits=code.toString(2).padStart(n,'0');
  return {x:`<div style="display:flex;flex-wrap:wrap;gap:3px">${[...bits].map((b,i)=>`<span style="width:26px;height:30px;border-radius:5px;display:grid;place-items:center;font:500 14px 'IBM Plex Mono';background:${b==='1'?'var(--ink)':'var(--panel)'};color:${b==='1'?'var(--bg)':'var(--mut)'}" title="bit ${n-1-i}">${b}</span>`).join('')}</div>`,
    ro:[['LSB size Vref/2ⁿ',eng(L,'V')],['Output code',code+' of '+(N-1),over?'bad':'ok'],['Hex','0x'+code.toString(16).toUpperCase()],['Reconstructed code·LSB',eng(Vq,'V')],['Quantization error',eng(err,'V')],['Input vs Vref',over?'ABOVE Vref — clipped (and may damage pin)':'in range',over?'bad':'']],
    p:[{x:[0,Vr],y:[0,N],xl:'input voltage (V)',yl:'output code',s:[{p:stp,c:IC,w:N<=64?2.2:1.6,n:'ADC transfer (staircase)'},{p:[[0,0],[Vr,N]],c:MU,d:'4 4',w:1.2,n:'ideal'}],dots:[{x:Math.min(Vin,Vr),y:code,c:VC,l:'code '+code}],h:210}],
    n:'code = floor(Vin / Vref × 2ⁿ). The RP2040 / RP2350 ADC is 12-bit with a 3.3 V reference: 1 LSB ≈ 0.8 mV. Real ADCs add noise and nonlinearity, so the bottom 1–3 bits are often unreliable.'};
});
