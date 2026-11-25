function run(s,seed){
 const n=s.X.length,R={title:s.title,sub:s.sub};
 const mn=s.min||30;if(n<mn)return{...R,err:`Only ${n} usable rows were found. At least ${mn} are needed. ${s.need||''}`};
 if(s.cls){const p=s.y.reduce((a,b)=>a+b,0);if(p<5||n-p<5)return{...R,err:`The target has ${p} positive and ${n-p} negative rows. Each class needs at least 5 rows.`}}
 const r=rng(seed),ix=shuf([...Array(n).keys()],r),k=Math.round(n*.25),te=ix.slice(0,k),tr=ix.slice(k,k+4000);
 const Xt=tr.map(i=>s.X[i]),yt=tr.map(i=>s.y[i]),Xe=te.map(i=>s.X[i]),ye=te.map(i=>s.y[i]);
 const m=s.fit(Xt,yt,r),pr=Xe.map(x=>m.pred(x));
 const met=s.cls?clsMet(ye,pr):regMet(ye,pr);
 const cm=s.cls?[[0,0],[0,0]]:null;if(s.cls)ye.forEach((v,i)=>cm[v][pr[i]>=.5?1:0]++);const pc=s.cls?[pr.filter(p=>p<.5).length,pr.filter(p=>p>=.5).length]:null,pts=s.cls?null:ye.slice(0,150).map((v,i)=>[+v.toFixed(2),+pr[i].toFixed(2)]),ex=Xe.slice(0,3).map((x,i)=>s.cls?`actual ${ye[i]?'positive':'negative'}, P(positive) ${pr[i].toFixed(2)}`:`actual ${fmt(ye[i],1)}, predicted ${fmt(pr[i],1)}`);
 const base=s.cls?`Predicted positive when probability is at least 0.5. Majority-class accuracy: ${(Math.max(mean(ye),1-mean(ye))).toFixed(3)}`:`MAE if predicting the training mean: ${fmt(mean(ye.map(v=>Math.abs(v-mean(yt)))),2)}`;
 const tot=m.imp.reduce((a,b)=>a+b,0)||1,imp=m.imp.map((v,i)=>[s.names[i],v/tot]).sort((a,b)=>b[1]-a[1]).slice(0,6);
 return{...R,cm,pc,pts,ex,lab:/abnormal/i.test(s.title)?['Normal','Abnormal']:['Low risk','High risk'],met,base,imp,n:[tr.length,te.length],pos:s.cls?mean(s.y):null,warn:n<100?`Small sample (${n} rows), so treat these numbers as indicative.`:''}}

/* --- cleaning and feature building --- */
function prep(price){
 const log=[],dd=n=>{const s=new Set();return(RAW[n]||[]).filter(r=>{const k=JSON.stringify(r);if(s.has(k))return false;s.add(k);return true})};
 const keep=(n,fn)=>{const raw=RAW[n]||[],u=dd(n),o=[];u.forEach(r=>{const x=fn(r);if(x)o.push(x)});if(raw.length)log.push(`${n}: ${fmt(o.length)} of ${fmt(raw.length)} rows usable (${fmt(raw.length-u.length)} duplicates, ${fmt(u.length-o.length)} invalid or orphan)`);return o};
 const V=new Map();keep('vehicles',r=>{const o={id:String(r.vehicle_id),type:norm(r.vehicle_type),year:num(r.manufacturing_year),fuel:norm(r.fuel_type)||'Na',odo:num(r.odometer_km)};return r.vehicle_id&&o.type&&o.year>1980&&o.odo>=0?(V.set(o.id,o),o):null});
 const D=new Map();keep('drivers',r=>{const o={id:String(r.driver_id),age:num(r.age),exp:num(r.experience_years)};return r.driver_id&&o.age>=16&&o.exp>=0?(D.set(o.id,o),o):null});const hasD=D.size>0;
 const T=keep('trips',r=>{const o={v:String(r.vehicle_id),d:String(r.driver_id),t:dtm(r.start_time),km:num(r.distance_km),fuel:num(r.fuel_consumed_l),min:num(r.duration_min),avg:num(r.avg_speed_kmh),max:num(r.max_speed_kmh)},e=dtm(r.end_time);
  return V.has(o.v)&&(!hasD||D.has(o.d))&&norm(r.status||'Completed')=='Completed'&&o.t>0&&!(e<o.t)&&o.km>0&&o.fuel>0&&o.min>0&&o.avg>0&&o.max>0?o:null});
 const M=keep('maintenance',r=>{const o={v:String(r.vehicle_id),t:dtm(r.maintenance_date),type:norm(r.maintenance_type),part:norm(r.component)||'Other',cost:num(r.cost),odo:num(r.odometer_km)};return V.has(o.v)&&o.t>0&&o.type&&o.cost>=0?o:null});
 const F=keep('fuel_records',r=>{const o={v:String(r.vehicle_id),t:dtm(r.fuel_date),c:num(r.total_cost)};return V.has(o.v)&&o.t>0&&o.c>0?o:null});
 const B=keep('driver_behaviour',r=>{const o={d:String(r.driver_id),ev:num(r.speeding_events)+num(r.harsh_braking_events)+num(r.rapid_acceleration_events),km:num(r.distance_km)};return D.has(o.d)&&o.ev>=0&&o.km>0?o:null});
 if(!V.size||T.length<50)throw new Error('Need vehicles plus at least 50 usable completed trips. Check the file list above.');
 let t0=1e15,t1=0;T.forEach(t=>{if(t.t<t0)t0=t.t;if(t.t>t1)t1=t.t});
 const b0=new Date(t0),mi=t=>{const d=new Date(t);return Math.max(0,(d.getUTCFullYear()-b0.getUTCFullYear())*12+d.getUTCMonth()-b0.getUTCMonth())};
 const ms=mi(t1),ref=new Date(t1).getUTCFullYear(),age=v=>Math.max(0,ref-V.get(v).year),days=(t1-t0)/864e5+1;
 const VM=new Map(),g=(v,m)=>{const k=v+'|'+m;let x=VM.get(k);if(!x)VM.set(k,x={n:0,km:0,hrs:0,fuel:0,sp:0,mx:0,mc:0,bd:0,fc:0});return x};
 T.forEach(t=>{const x=g(t.v,mi(t.t));x.n++;x.km+=t.km;x.hrs+=t.min/60;x.fuel+=t.fuel;x.sp+=t.avg;x.mx+=t.max;t.l=t.fuel/t.km*100});
 M.forEach(m=>{const x=g(m.v,Math.min(ms,mi(m.t)));x.mc+=m.cost;if(m.type=='Breakdown'||m.type=='Repair')x.bd++});
 F.forEach(f=>{g(f.v,Math.min(ms,mi(f.t))).fc+=f.c});if(!F.length)VM.forEach(x=>x.fc=x.fuel*price);
 const byT={};T.forEach(t=>(byT[V.get(t.v).type]??=[]).push(t));
 Object.values(byT).forEach(a=>{if(a.length<8){a.forEach(t=>t.ab=+(t.max>140));return}
  const q=k=>[quart(a.map(t=>t[k]),.25),quart(a.map(t=>t[k]),.75)],f=q('l'),s=q('avg'),hi=(x,[p,u])=>x>u+1.5*(u-p),lo=(x,[p,u])=>x<p-1.5*(u-p);
  a.forEach(t=>t.ab=+(hi(t.l,f)||hi(t.avg,s)||lo(t.avg,s)||t.max>140))});
 const enc=(()=>{const m={};return(ns,v)=>{const d=m[ns]??={};return d[v]??=Object.keys(d).length}})();
 const types=[...new Set([...V.values()].map(v=>v.type))].sort(),oh=t=>types.map(x=>+(x==t)),ohn=types.map(t=>'Type: '+t);
 const S=[],q75=a=>quart(a,.75),exp=d=>hasD?[D.get(d).exp]:[],expn=hasD?['Driver experience']:[];
 const hist=(v,m,k)=>{let s=0;for(let i=1;i<=3;i++)s+=VM.get(v+'|'+(m-i))?.[k]||0;return s};
 {const X=[],y=[];V.forEach(v=>{for(let m=3;m<=ms;m++){const x=VM.get(v.id+'|'+m),km3=hist(v.id,m,'km');
   X.push([age(v.id),v.odo,enc('t',v.type),enc('f',v.fuel),km3,hist(v.id,m,'n'),km3?hist(v.id,m,'fuel')/km3*100:0,hist(v.id,m,'mc'),hist(v.id,m,'bd')]);y.push(x&&x.bd>0?1:0)}});
  const LI=[...V.keys()],LX=[...V.values()].map(v=>{const m=ms+1,km3=hist(v.id,m,'km');return[age(v.id),v.odo,enc('t',v.type),enc('f',v.fuel),km3,hist(v.id,m,'n'),km3?hist(v.id,m,'fuel')/km3*100:0,hist(v.id,m,'mc'),hist(v.id,m,'bd')]});
  S.push({live:{ids:LI,X:LX},title:'1. CatBoost-style classifier: maintenance risk',sub:'Will a vehicle have a breakdown or repair in the next month, given the previous 3 months? (one row per vehicle-month)',X,y,cls:true,fit:FIT.cb(true),need:'This needs at least 4 months of trips.',
   names:['Vehicle age','Odometer','Vehicle type','Fuel type','Km last 3 months','Trips last 3 months','L/100 km last 3 months','Maintenance cost last 3 months','Breakdowns/repairs last 3 months']})}
 {const X=[],y=[],A=new Map(),bh=new Map();T.forEach(t=>{const a=A.get(t.d)||{n:0,km:0,sp:0,mx:0,ab:0,fuel:0};a.n++;a.km+=t.km;a.sp+=t.avg;a.mx+=t.max;a.ab+=t.ab;a.fuel+=t.fuel;A.set(t.d,a)});
  B.forEach(b=>{const a=bh.get(b.d)||{ev:0,km:0};a.ev+=b.ev;a.km+=b.km;bh.set(b.d,a)});
  const ids=hasD?[...A.keys()].filter(d=>A.get(d).n>=3):[],useB=bh.size>0,sc=ids.map(d=>useB?(bh.get(d)?bh.get(d).ev/bh.get(d).km*100:0):A.get(d).ab/A.get(d).n),cut=ids.length?q75(sc):0;
  ids.forEach((d,i)=>{const a=A.get(d),dr=D.get(d);X.push([dr.age,dr.exp,a.n,a.km,a.sp/a.n,a.mx/a.n,a.fuel/a.km*100]);y.push(sc[i]>=cut&&cut>0?1:0)});
  S.push({title:'2a. Random Forest classifier: driver risk',sub:useB?'High risk = top 25% of speeding, harsh braking and rapid acceleration events per 100 km (from the behaviour table).':'High risk = top 25% share of abnormal trips (no behaviour table found, so features such as speed overlap with this label).',X,y,cls:true,fit:FIT.rf(true),min:20,need:hasD?'':'A drivers file is required.',
   names:['Age','Experience','Trips','Total km','Average speed','Average max speed','L/100 km']})}
 {const X=[],y=[],A=new Map(),per=new Map();M.forEach(m=>{if(m.type=='Breakdown'||m.type=='Repair')per.set(m.v,(per.get(m.v)||0)+1)});
  T.forEach(t=>{const a=A.get(t.v)||{n:0,km:0,fuel:0,mx:0};a.n++;a.km+=t.km;a.fuel+=t.fuel;a.mx+=t.max;A.set(t.v,a)});
  const ids=[...A.keys()],cn=ids.map(v=>per.get(v)||0),cut=q75(cn);
  ids.forEach((v,i)=>{const a=A.get(v),ve=V.get(v);X.push([age(v),ve.odo,enc('t',ve.type),enc('f',ve.fuel),a.km,a.n,a.fuel/a.km*100,a.mx/a.n]);y.push(cn[i]>=cut&&cut>0?1:0)});
  S.push({title:'2b. Random Forest classifier: vehicle risk',sub:'High risk = top 25% of vehicles by number of breakdowns and repairs.',X,y,cls:true,fit:FIT.rf(true),names:['Vehicle age','Odometer','Vehicle type','Fuel type','Total km','Trips','L/100 km','Average max speed']})}
 S.push({title:'3. Logistic Regression: normal vs abnormal trips',sub:'Abnormal = fuel per 100 km or average speed outside 1.5 x IQR within its vehicle type, or max speed over 140 km/h. The model learns to reproduce this rule from trip features.',
  X:T.map(t=>[t.l,t.avg,t.max,t.km,t.min,age(t.v),...exp(t.d),...oh(V.get(t.v).type)]),y:T.map(t=>t.ab),cls:true,fit:FIT.lin(true),names:['L/100 km','Average speed','Max speed','Distance','Duration','Vehicle age',...expn,...ohn]});
 S.push({title:'4. Linear Regression: baseline fuel consumption',sub:'Predicts litres used on a completed trip from distance, duration, speeds, vehicle age, driver experience and vehicle type.',
  X:T.map(t=>[t.km,t.min,t.avg,t.max,age(t.v),...exp(t.d),...oh(V.get(t.v).type)]),y:T.map(t=>t.fuel),cls:false,fit:FIT.lin(false),names:['Distance','Duration','Average speed','Max speed','Vehicle age',...expn,...ohn]});
 S.push({title:'5. Random Forest regressor: maintenance cost',sub:'Predicts the cost of a maintenance record from its type, component and the vehicle.',
  X:M.map(m=>{const v=V.get(m.v);return[enc('mt',m.type),enc('mp',m.part),Math.max(0,new Date(m.t).getUTCFullYear()-v.year),isFinite(m.odo)?m.odo:v.odo,enc('t',v.type)]}),y:M.map(m=>m.cost),cls:false,fit:FIT.rf(false),need:'A maintenance file is required.',
  names:['Maintenance type','Component','Vehicle age at service','Odometer','Vehicle type']});
 {const X=[],y=[];VM.forEach((x,k)=>{if(!x.n)return;const v=V.get(k.split('|')[0]);X.push([x.km,x.n,x.hrs,x.sp/x.n,x.mx/x.n,age(v.id),v.odo,enc('t',v.type),enc('f',v.fuel)]);y.push(x.fc+x.mc)});
  S.push({title:'6. CatBoost-style regressor: operating cost',sub:`Predicts monthly operating cost per vehicle (fuel plus maintenance). ${F.length?'Fuel cost comes from the fuel records.':`No fuel records found, so fuel is priced at ${fmt(price)} per litre.`} One row per vehicle-month.`,X,y,cls:false,fit:FIT.cb(false),
   names:['Km','Trips','Driving hours','Average speed','Average max speed','Vehicle age','Odometer','Vehicle type','Fuel type']})}
 const hrs=new Map(),SA=new Map();T.forEach(t=>{const a=SA.get(t.v)||{h:0,n:0,km:0,f:0};a.h+=t.min/60;a.n++;a.km+=t.km;a.f+=t.fuel;SA.set(t.v,a)});
 const seg={ids:[...SA.keys()],X:[...SA.values()].map(a=>[Math.min(100,a.h/(days*12)*100),a.n/(days/30.4),a.km/a.n,a.km])};
 const tx=new Map();M.forEach(m=>{const k=m.v+'|'+mi(m.t),v=V.get(m.v),a=age(m.v);if(!tx.has(k))tx.set(k,new Set([`vtype:${v.type}`,`age:${a<6?'0-5 yrs':a<11?'6-10 yrs':'11+ yrs'}`]));tx.get(k).add('type:'+m.type);tx.get(k).add('part:'+m.part)});
 return{S,seg,tx:[...tx.values()].map(s=>[...s]),log}}
function plan(o){const P=prep(o.price),J=P.S.map((s,i)=>()=>run(s,100+i));
 J.push(()=>segment(P.seg,o.k,'7. K-Means: vehicle utilization segmentation'));J.push(()=>assoc(P.tx,o.sup/100,o.conf/100,'8. Apriori: maintenance pattern discovery'));return{log:P.log,jobs:J}}

/* --- page --- */
function card(r){const nf=v=>!isFinite(v)?'n/a':Math.abs(v)>=100?fmt(v):String(+v.toFixed(3));
 const body=r.err?`<p>${esc(r.err)}</p>`:r.html||`<div class="m">${Object.entries(r.met).map(([k,v])=>`<span class="chip ok">${k} ${nf(v)}</span>`).join('')}</div>
  <div class="sub">${r.base}. Trained on ${fmt(r.n[0])} rows, tested on ${fmt(r.n[1])} unseen rows.${r.pos!=null?` Positive rate ${(r.pos*100).toFixed(0)}%.`:''} ${r.warn}</div>
  <h2 style="margin-top:12px;font-size:16px">What drives the prediction</h2><div class="imp">${r.imp.map(([n,v])=>`<span>${esc(n)}</span><div class="bar2" style="width:${Math.max(2,v*100).toFixed(0)}%"></div>`).join('')}</div>`;
 return`<div class="box" style="grid-column:1/-1"><h2>${r.title}</h2><div class="sub" style="margin-bottom:8px">${r.sub||''}</div>${body}${extra(r)}</div>`}
function mlPage(){
 $('#main').innerHTML=`<div class="bar"><div><h1>Upload data and run models</h1><div class="sub">Everything runs in your browser. Your files are not uploaded anywhere.</div></div></div>
 <div class="box"><h2>1. Load your dataset</h2>
 <label for="fl">Choose your CSV files (select several at once). Needed: vehicles and trips. Optional: drivers, maintenance, fuel_records, driver_behaviour.</label>
 <input id="fl" type="file" accept=".csv,text/csv" multiple><div id="fs" class="sub" style="margin:8px 0">${Object.keys(RAW).length?Object.keys(RAW).map(k=>`${k}: ${fmt(RAW[k].length)} rows`).join('<br>'):'No files loaded yet.'}</div>
 <div class="row"><button class="alt" id="demo">Use the data stored in the app</button></div>
 <div class="form"><div><label for="pr">Fuel price per litre (used if no fuel records)</label><input id="pr" type="number" min="0" value="100"></div><div><label for="kk">K-Means segments</label><input id="kk" type="number" min="2" max="6" value="3"></div><div><label for="sp">Apriori min support %</label><input id="sp" type="number" min="1" max="50" value="3"></div><div><label for="cf">Apriori min confidence %</label><input id="cf" type="number" min="10" max="100" value="25"></div></div>
 <div class="row"><button id="runml">Run all 8 models</button><button class="alt" id="dlr" hidden>Download results (JSON)</button></div><div id="st" class="sub" role="status"></div></div>
 <div id="log" class="note"></div><div id="cmp"></div><div class="grid" id="res" style="margin-top:14px"></div>
 <p class="note">Models 2a and 2b are the same algorithm family (Random Forest classification) with two different prediction targets: driver risk and vehicle risk. Models 1 and 6 are CatBoost-style: gradient boosting on symmetric trees, written in JavaScript. They are not the CatBoost library, so categories are label-encoded and there is no ordered target statistics. Models are tested on a random 25% hold-out, and the same vehicle can appear in both train and test rows, so scores are optimistic compared with predicting brand-new vehicles.</p>`;
 $('#fl').onchange=async e=>{RAW={};const m=[];for(const f of e.target.files){const rows=parseCSV(await f.text()),k=rows.length?which(rows):null;if(k){RAW[k]=rows;m.push(`${esc(f.name)}: ${k} (${fmt(rows.length)} rows)`)}else m.push(`${esc(f.name)}: not recognised. Check that the column names match the expected format (for example vehicle_id, vehicle_type, distance_km, fuel_consumed_l).`)}$('#fs').innerHTML=m.join('<br>')};
 $('#demo').onclick=()=>{RAW=demoRaw();$('#fs').innerHTML=Object.keys(RAW).map(k=>`${k}: ${fmt(RAW[k].length)} rows (sample data)`).join('<br>')};
 $('#runml').onclick=async()=>{const st=$('#st'),res=$('#res');RESULTS=[];charts.forEach(c=>c.destroy());charts=[];res.innerHTML='';$('#dlr').hidden=true;
  if(!RAW.vehicles||!RAW.trips)RAW=demoRaw();
  const tick=()=>new Promise(r=>setTimeout(r,30));st.textContent='Cleaning data...';await tick();
  let P;try{P=plan({price:+$('#pr').value||0,k:Math.min(6,Math.max(2,+$('#kk').value||3)),sup:+$('#sp').value||3,conf:+$('#cf').value||25})}catch(e){st.textContent=e.message;return}
  $('#log').innerHTML='<b>Cleaning summary</b><br>'+P.log.join('<br>');
  for(let i=0;i<P.jobs.length;i++){st.textContent=`Running model ${i+1} of ${P.jobs.length}...`;await tick();let r;try{r=P.jobs[i]()}catch(e){r={title:'Model '+(i+1),err:'This model failed: '+e.message}}RESULTS.push(r);res.insertAdjacentHTML('beforeend',card(r));drawPending()}
  st.textContent='Done. All models have run.';$('#dlr').hidden=false;histAdd();$('#cmp').innerHTML=compareHtml()};
 $('#dlr').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(RESULTS.map(({title,sub,met,base,imp,err,n,cm})=>({title,sub,met,base,imp,err,n,cm})),null,1)],{type:'application/json'}));a.download='model_results.json';a.click()}}
