/* ================= POWER ================= */
sim('reg',[
  {k:'Vin',t:'r',l:'Input voltage',min:3,max:24,step:0.1,v:12,u:'V'},
  {k:'Vo',t:'seg',l:'Output',o:[['3.3','3.3 V'],['5','5 V']],v:'5'},
  {k:'I',t:'r',l:'Load current',min:0.001,max:2,log:1,v:0.3,u:'A'},
  {k:'ty',t:'seg',l:'Linear regulator type',o:[['std','7805-style'],['ldo','LDO']],v:'std'}
],st=>{
  const {Vin,I,ty}=st,Vo=+st.Vo,drop=ty==='std'?2:0.3,ok=Vin>=Vo+drop,P=ok?(Vin-Vo)*I:NaN,eff=Vo/Vin,Tj=25+P*50,Ib=Vo*I/(0.9*Vin),Pb=Vo*I*(1/0.9-1);
  const r=ICB(160,20,90,60,ty==='std'?'78xx':'LDO',[{s:'l',at:20,n:'IN'},{s:'r',at:20,n:'OUT'},{s:'b',at:45,n:'GND'}],{ty:36});
  const s=W([40,75],[40,40],[146,40])+W([40,145],[40,190],[380,190])+C('bat',40,75,40,145,'Vin\n'+eng(Vin,'V'),{flip:1})+W([100,40],[100,80])+C('C',100,80,100,150,'Cin\n10 µF')+W([100,150],[100,190])+r.s+W([205,94],[205,190])+
    W([264,40],[380,40],[380,80])+W([300,40],[300,80])+C('C',300,80,300,150,'Cout\n10 µF')+W([300,150],[300,190])+C('R',380,80,380,150,'load\n'+eng(I,'A'))+W([380,150],[380,190])+Dt(100,40)+Dt(100,190)+Dt(205,190)+Dt(300,40)+Dt(300,190)+
    T(330,30,eng(Vo,'V'),'middle','nv')+F([[40,75],[40,40],[146,40]],I)+F([[264,40],[380,40],[380,80]],I)+F([[380,150],[380,190],[40,190],[40,145]],I);
  return {sch:S(450,215,s,520),ro:ok?[['Heat in regulator (Vin−Vout)·I',eng(P,'W'),P>2?'bad':P>1?'warn':'ok'],['Efficiency Vout/Vin',pct(eff),eff<0.5?'warn':''],['Junction temp (TO-220, no heatsink)','≈ '+Tj.toFixed(0)+' °C',Tj>125?'bad':Tj>90?'warn':'ok'],['Buck converter (90%) input current',eng(Ib,'A')],['Buck converter loss',eng(Pb,'W'),'ok'],['Input current (linear)',eng(I,'A')]]:[['Dropout!','Vin must be ≥ Vout + '+drop+' V','bad']],
    p:[{x:[3,24],y:[0,1],xl:'input voltage (V)',xf:v=>v,yl:'efficiency',yf:v=>Math.round(v*100)+'%',s:[{p:lin(Vo+drop,24,80).map(v=>[v,Vo/v]),c:VC,n:'linear regulator'},{p:[[Vo+0.5,0.9],[24,0.9]],c:AX,d:'6 4',n:'typical buck converter'}],dots:ok?[{x:Vin,y:eff,l:pct(eff)}]:[],h:190}]};
});
