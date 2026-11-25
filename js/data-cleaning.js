/* ===== Upload, cleaning and the 8 models ===== */
const num=v=>{const x=parseFloat(v);return v===''||v==null||!isFinite(x)?NaN:x};
const dtm=v=>{const t=Date.parse(v);return isNaN(t)?NaN:t};
const norm=s=>String(s||'').trim().toLowerCase().replace(/^./,c=>c.toUpperCase());
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const sig=z=>1/(1+Math.exp(-z));
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const dist=(a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0);
let RAW={},RESULTS=[];

function parseCSV(t){const R=[];let row=[],f='',q=false;
 for(let i=0;i<t.length;i++){const c=t[i];
  if(q){if(c=='"'){if(t[i+1]=='"'){f+='"';i++}else q=false}else f+=c}
  else if(c=='"')q=true;else if(c==','){row.push(f);f=''}
  else if(c=='\n'||c=='\r'){if(c=='\r'&&t[i+1]=='\n')i++;row.push(f);f='';if(row.length>1||row[0]!=='')R.push(row);row=[]}else f+=c}
 if(f!==''||row.length){row.push(f);R.push(row)}
 if(!R.length)return[];const h=R.shift().map(x=>x.trim().toLowerCase().replace(/^\ufeff/,'').replace(/\s+/g,'_'));
 return R.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]??'').trim()])))}
function which(rows){const k=Object.keys(rows[0]||{}),has=(...a)=>a.every(x=>k.includes(x));
 return has('distance_km','fuel_consumed_l')?'trips':has('maintenance_type','cost')?'maintenance':has('speeding_events')?'driver_behaviour':has('litres','price_per_litre')?'fuel_records':has('registration_no')||has('vehicle_type')?'vehicles':has('licence_no')||has('experience_years')?'drivers':null}
function demoRaw(D=DB){return{
 fuel_records:D.trips.filter(t=>t.status=='Completed').map(t=>({vehicle_id:t.vid,fuel_date:ymd(t.start),litres:t.fuel,price_per_litre:SET.price,total_cost:+(t.fuel*SET.price).toFixed(1)})),
 driver_behaviour:D.drivers.map(d=>{const g=D.trips.filter(t=>t.did==d.id&&t.status=='Completed'),km=g.reduce((a,t)=>a+t.km,0),k=Math.max(0,(d.risk||1)-.85);return{driver_id:d.id,distance_km:+km.toFixed(1),speeding_events:g.filter(t=>t.max>t.avg*1.4).length,harsh_braking_events:Math.round(g.length*k*.5),rapid_acceleration_events:Math.round(g.length*k*.4)}}),
 vehicles:D.vehicles.map(v=>({vehicle_id:v.id,vehicle_type:v.type,manufacturing_year:v.year,fuel_type:v.fuel,odometer_km:v.odo})),
 drivers:D.drivers.map(d=>({driver_id:d.id,age:d.age,experience_years:d.experience_years})),
 trips:D.trips.map(t=>({vehicle_id:t.vid,driver_id:t.did,start_time:new Date(t.start).toISOString(),distance_km:t.km??'',fuel_consumed_l:t.fuel??'',duration_min:t.mins??'',avg_speed_kmh:t.avg??'',max_speed_kmh:t.max??'',status:t.status})),
 maintenance:D.maint.map(m=>({vehicle_id:m.vid,maintenance_date:ymd(m.date),maintenance_type:m.type,component:m.part,cost:m.cost}))}}
