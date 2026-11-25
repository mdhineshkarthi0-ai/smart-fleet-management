const $=s=>document.querySelector(s);
const fmt=(n,d=0)=>n==null||isNaN(n)?'—':Number(n).toLocaleString('en-IN',{maximumFractionDigits:d,minimumFractionDigits:d});
const ymd=t=>new Date(t).toISOString().slice(0,10);
const today=new Date(),yr=new Date(today-365*864e5);
let CFG={vehicles:40,drivers:30,routes:12,trips:1500,maint:150,seed:42,start:ymd(yr),end:ymd(today)};
let DB,charts=[],RANGE={start:CFG.start,end:CFG.end},Q={};

function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function quart(a,p){a=[...a].sort((x,y)=>x-y);const i=(a.length-1)*p,f=Math.floor(i);return a[f]+(a[Math.ceil(i)]-a[f])*(i-f)}

const PAGES={dash:['Executive Dashboard',dash,'Overview'],vehicles:['Vehicle Management',()=>table('vehicles'),'Fleet operations'],drivers:['Driver Management',()=>table('drivers')],trips:['Trip Management',()=>table('trips')],maint:['Maintenance Management',()=>table('maint')],
 fuel:['Fuel Analytics',fuelPage,'Analytics'],fleet:['Fleet Analytics',fleetPage],driveran:['Driver Analytics',driverPage],pred:['Predictive Maintenance',predPage],
 ml:['Machine Learning Centre',mlPage,'Machine learning'],cluster:['Clustering & Association Patterns',clusterPage],gen:['Dataset Generator',genPage,'Data management'],upload:['Data Upload & Preprocessing',uploadPage],
 reports:['Reports & Insights',reportsPage,'Business intelligence'],settings:['Settings',settingsPage,'System'],notifications:['Notification Centre',notifPage,null]};
function route(){const k=location.hash.slice(1),key=PAGES[k]?k:'dash';charts.forEach(c=>c.destroy());charts=[];
 $('#nav').innerHTML=Object.entries(PAGES).filter(([,p])=>p[2]!==null).map(([i,[l,,sec]])=>(sec?`<h3>${sec}</h3>`:'')+`<a href="#${i}" class="${i==key?'on':''}">${l}</a>`).join('');
 $('#ttl').textContent=PAGES[key][0];refreshBell();
 try{PAGES[key][1]()}catch(e){$('#main').innerHTML=`<div class="box"><h2>This page could not be shown</h2><p>${esc(e.message)}</p></div>`}}
function initTop(){applyTheme();$('#usr').textContent=SET.name;
 $('#burger').onclick=()=>document.body.classList.toggle('collapsed');
 $('#thm').onclick=()=>{SET.theme=SET.theme=='dark'?'light':'dark';saveSet();route()};
 $('#bell').onclick=()=>{location.hash='#notifications'};
 const g=$('#gs'),r=$('#gres'),has=(a,f,q)=>a.filter(x=>f(x).join(' ').toLowerCase().includes(q)).length;
 g.oninput=()=>{const q=g.value.trim().toLowerCase();if(q.length<2){r.hidden=true;return}
  const f=[['vehicles','Vehicles',has(DB.vehicles,v=>[v.reg,v.type,v.make],q)],['drivers','Drivers',has(DB.drivers,d=>[d.name,d.licence_no],q)],['trips','Trips',has(DB.trips,t=>[t.vehicle,t.driver,t.route],q)],['maint','Maintenance',has(DB.maint,m=>[m.vehicle,m.type,m.part],q)]];
  r.innerHTML=f.map(([k,l,n])=>`<button class="alt" data-k="${k}">${l}: ${n} match${n==1?'':'es'}</button>`).join('');r.hidden=false;
  r.querySelectorAll('button').forEach(b=>b.onclick=()=>{Q[b.dataset.k]=g.value.trim();r.hidden=true;if(location.hash=='#'+b.dataset.k)route();else location.hash='#'+b.dataset.k})}}
(async()=>{IDB=await openDB();const s=IDB?await loadAll():null;if(s){DB={routes:[],...s}}else{DB=gen(CFG);save()}initTop();addEventListener('hashchange',route);route()})();
