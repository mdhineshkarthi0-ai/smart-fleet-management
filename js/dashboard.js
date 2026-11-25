function stats(a,b){
 const s=Date.parse(a),e=Date.parse(b)+864e5,days=Math.max(1,Math.round((e-s)/864e5)),op=SET.hours||12;
 const T=DB.trips.filter(t=>t.status=='Completed'&&t.start>=s&&t.start<e),M=DB.maint.filter(m=>m.date>=s&&m.date<e);
 const mo=t=>ymd(t).slice(0,7),months=[...new Set([...T.map(t=>mo(t.start)),...M.map(m=>mo(m.date))])].sort();
 const sum=(a,f)=>a.reduce((x,y)=>x+f(y),0),by=(arr,k,f)=>{const o={};arr.forEach(x=>{(o[k(x)]??=[]).push(x)});return o};
 const tm=by(T,t=>mo(t.start)),mm=by(M,m=>mo(m.date)),km=sum(T,t=>t.km),fl=sum(T,t=>t.fuel);
 const hrs={};T.forEach(t=>hrs[t.vid]=(hrs[t.vid]||0)+t.mins/60);
 const live=DB.vehicles.filter(v=>v.status!='Inactive'),ut=live.map(v=>({type:v.type,u:Math.min(100,(hrs[v.id]||0)/(days*op)*100)}));
 const ub=by(ut,x=>x.type),dd=by(T,t=>t.driver),rr=by(T,t=>t.route);
 const top=(o,f,n=10)=>Object.entries(o).map(([k,v])=>[k,f(v)]).sort((x,y)=>y[1]-x[1]).slice(0,n);
 const vs=by(DB.vehicles,v=>v.status),dr=top(dd,v=>sum(v,t=>t.km)),ro=top(rr,v=>v.length),ut2=Object.entries(ub).map(([k,v])=>[k,sum(v,x=>x.u)/v.length]);
 return{T,kpi:[['Vehicles',DB.vehicles.length],['Active vehicles',DB.vehicles.filter(v=>v.status=='Active').length],['Inactive vehicles',DB.vehicles.filter(v=>v.status=='Inactive').length],['Total drivers',DB.drivers.length],['Total trips',DB.trips.filter(t=>t.start>=s&&t.start<e).length],['Active drivers',DB.drivers.filter(d=>d.status=='Active').length],['Completed trips',T.length],['Distance (km)',km],['Fuel (L)',fl],['Avg L/100 km',km?fl/km*100:null],['Maintenance cost',sum(M,m=>m.cost)],['Avg utilization %',ut.length?sum(ut,x=>x.u)/ut.length:null],['Abnormal trips',T.filter(t=>t.flag).length]],
  months,trips:months.map(m=>(tm[m]||[]).length),dist:months.map(m=>sum(tm[m]||[],t=>t.km)),fuel:months.map(m=>sum(tm[m]||[],t=>t.fuel)),l100:months.map(m=>{const g=tm[m]||[],k=sum(g,t=>t.km);return k?sum(g,t=>t.fuel)/k*100:0}),mc:months.map(m=>sum(mm[m]||[],x=>x.cost)),
  vs:Object.entries(vs).map(([k,v])=>[k,v.length]),dr,ro,ut:ut2}}

function dash(){
 const S=stats(RANGE.start,RANGE.end),cs=getComputedStyle(document.documentElement);Chart.defaults.color=cs.getPropertyValue('--mut');Chart.defaults.borderColor=cs.getPropertyValue('--line');Chart.defaults.font.family='Barlow';
 const g='#0b8a63',a='#e8a317',ru='#b5472b',bl='#3b78b5',o={responsive:true,maintainAspectRatio:false},hz={...o,indexAxis:'y',plugins:{legend:{display:false}}};
 $('#main').innerHTML=`<div class="bar"><div><h1>Executive dashboard</h1><div class="sub">Completed-trip, fuel and maintenance figures for the chosen dates. Vehicle and driver counts are current.</div></div>
 <div class="row" style="margin:0;align-items:flex-end"><div><label for="pre">Period</label><select id="pre"><option value="c">Custom</option><option value="0">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="y">This year</option></select></div><div><label for="f">From</label><input id="f" type="date" value="${RANGE.start}"></div><div><label for="t">To</label><input id="t" type="date" value="${RANGE.end}"></div><button id="ap">Apply</button><button class="alt" id="ex">Export CSV</button></div></div>
 <div class="kpis">${S.kpi.map(([l,v],i)=>`<div><b>${fmt(v,/L\/100|utiliz/i.test(l)?1:0)}</b><span>${l}</span></div>`).join('')}</div>
 ${alertBox()}<div class="grid">${[['cA','Monthly fleet activity'],['cB','Vehicle status'],['cC','Fuel consumption trend'],['cD','Maintenance spend by month'],['cE','Top 10 drivers by distance (km)'],['cF','Top 10 routes by trips'],['cG','Utilization by vehicle type (%)'],['cH','Monthly operating expenses']].map(([i,t])=>`<div class="box"><h2>${t}</h2><div class="ch"><canvas id="${i}"></canvas></div></div>`).join('')}</div>
 <p class="note">Utilization is completed-trip hours divided by days in range times 12 operating hours, per non-inactive vehicle, capped at 100%. Abnormal trips use 1.5 x IQR fences on fuel per 100 km and speed within a vehicle type, plus max speed over 140 km/h.</p>`;
 $('#ap').onclick=()=>{RANGE={start:$('#f').value,end:$('#t').value};dash()};
 $('#pre').onchange=e=>{const v=e.target.value;if(v=='c')return;const t=new Date(),s=v=='y'?new Date(t.getFullYear(),0,1):new Date(t-(+v)*864e5);RANGE={start:ymd(s),end:ymd(t)};dash()};
 $('#ex').onclick=()=>csv('dashboard_kpis.csv',[['KPI','Value'],...S.kpi.map(([l,v])=>[l,v==null?'':+v.toFixed(2)])]);
 mk('#cA',{type:'bar',data:{labels:S.months,datasets:[{label:'Trips',data:S.trips,backgroundColor:g,yAxisID:'y'},{type:'line',label:'Distance (km)',data:S.dist,borderColor:a,yAxisID:'y1'}]},options:{...o,scales:{y:{title:{display:true,text:'Trips'}},y1:{position:'right',grid:{drawOnChartArea:false},title:{display:true,text:'km'}}}}});
 mk('#cB',{type:'doughnut',data:{labels:S.vs.map(x=>x[0]),datasets:[{data:S.vs.map(x=>x[1]),backgroundColor:[g,'#9aa5b1',a],borderWidth:0}]},options:o});
 mk('#cC',{type:'line',data:{labels:S.months,datasets:[{label:'Fuel (L)',data:S.fuel,borderColor:bl,yAxisID:'y'},{label:'L/100 km',data:S.l100,borderColor:ru,yAxisID:'y1'}]},options:{...o,scales:{y:{title:{display:true,text:'Litres'}},y1:{position:'right',grid:{drawOnChartArea:false},title:{display:true,text:'L/100 km'}}}}});
 mk('#cD',{type:'bar',data:{labels:S.months,datasets:[{label:'Cost',data:S.mc,backgroundColor:bl}]},options:{...o,plugins:{legend:{display:false}}}});
 mk('#cE',{type:'bar',data:{labels:S.dr.map(x=>x[0]),datasets:[{data:S.dr.map(x=>+x[1].toFixed(0)),backgroundColor:g}]},options:hz});
 mk('#cF',{type:'bar',data:{labels:S.ro.map(x=>x[0]),datasets:[{data:S.ro.map(x=>x[1]),backgroundColor:bl}]},options:hz});
 mk('#cG',{type:'bar',data:{labels:S.ut.map(x=>x[0]),datasets:[{data:S.ut.map(x=>+x[1].toFixed(1)),backgroundColor:a}]},options:{...o,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100}}}});
 mk('#cH',{type:'bar',data:{labels:S.months,datasets:[{label:'Fuel cost',data:S.fuel.map(f=>+(f*SET.price).toFixed(0)),backgroundColor:g},{label:'Maintenance',data:S.mc,backgroundColor:a}]},options:{...o,scales:{x:{stacked:true},y:{stacked:true}}}})}
