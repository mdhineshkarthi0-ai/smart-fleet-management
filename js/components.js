const TYPES=['Truck','Van','Car','Bus','Pickup','Motorcycle'],MT=['Routine Service','Inspection','Tyre Replacement','Battery Replacement','Repair','Breakdown'];
const FS={
 vehicles:[['reg','Registration number','text',1],['type','Vehicle type','sel',1,TYPES],['make','Manufacturer','text',1],['model','Model','text'],['year','Manufacturing year','num',1,1980,2035],['fuel','Fuel type','sel',1,['Petrol','Diesel','CNG','Hybrid','Electric']],['odo','Odometer (km)','num',1,0,3e6],['driver','Assigned driver','drv'],['ins','Insurance expiry','date'],['regx','Registration expiry','date'],['status','Status','sel',1,['Active','Inactive','Under Maintenance']]],
 drivers:[['name','Name','text',1],['age','Age','num',1,18,75],['licence_no','Licence number','text',1],['licence_expiry','Licence expiry','date',1],['experience_years','Experience (years)','num',1,0,50],['phone','Contact','text'],['status','Status','sel',1,['Active','On Leave','Suspended','Resigned']]],
 trips:[['start','Start date and time','dt',1],['vid','Vehicle','veh',1],['did','Driver','drv',1],['rid','Route','rte',1],['km','Distance (km)','num',1,.1,5000],['fuel','Fuel (L)','num',1,.1,5000],['mins','Duration (min)','num',1,1,6000],['avg','Average speed (km/h)','num',1,1,200],['max','Maximum speed (km/h)','num',1,1,260],['status','Status','sel',1,['Completed','Cancelled']]],
 maint:[['vid','Vehicle','veh',1],['date','Date','date',1],['type','Type','sel',1,MT],['part','Component','text',1],['desc','Description','text'],['cost','Cost','num',1,0,1e7],['provider','Service provider','text'],['next','Next service date','date'],['status','Status','sel',1,['Scheduled','In Progress','Completed']]]};
const MSF=new Set(['start','date','next']);
const nextId=k=>DB[k].reduce((m,r)=>Math.max(m,r.id),0)+1;
function opts(f){const cur=f[5];return f[2]=='sel'?f[4]:f[2]=='drv'?DB.drivers:f[2]=='veh'?DB.vehicles:DB.routes}
function field(f,r){const [k,l,t]=f,v=r?r[k]:'',id='f_'+k,req=f[3]?' required':'';
 let inp;if(t=='sel')inp=`<select id="${id}"${req}>${f[4].map(o=>`<option${o===v?' selected':''}>${esc(o)}</option>`).join('')}</select>`;
 else if(t=='drv'||t=='veh'||t=='rte'){const L=t=='drv'?DB.drivers:t=='veh'?DB.vehicles:DB.routes,nm=x=>t=='drv'?x.name:t=='veh'?x.reg:x.name;inp=`<select id="${id}"${req}>${t=='drv'&&!f[3]?'<option value="">None</option>':''}${L.map(x=>`<option value="${x.id}"${x.id==v?' selected':''}>${esc(nm(x))}</option>`).join('')}</select>`}
 else if(t=='num')inp=`<input id="${id}" type="number" step="any" min="${f[4]}" max="${f[5]}" value="${v??''}"${req}>`;
 else if(t=='date')inp=`<input id="${id}" type="date" value="${v?(typeof v=='number'?ymd(v):v):''}"${req}>`;
 else if(t=='dt')inp=`<input id="${id}" type="datetime-local" value="${v?new Date(v).toISOString().slice(0,16):''}"${req}>`;
 else inp=`<input id="${id}" value="${esc(v??'')}"${req}>`;
 return `<div><label for="${id}">${l}${f[3]?' *':''}</label>${inp}<div class="err" id="e_${k}"></div></div>`}
function form(k,id){const rec=id?DB[k].find(r=>r.id==id):null,F=FS[k];
 if((k=='trips'||k=='maint')&&!DB.vehicles.length||k=='trips'&&(!DB.drivers.length||!DB.routes.length)){toast('Add vehicles, drivers and routes first.');return}
 let d=document.getElementById('dlg');if(d)d.remove();d=document.createElement('dialog');d.id='dlg';
 d.innerHTML=`<h2>${rec?'Edit':'Add'} ${k=='maint'?'maintenance record':k.slice(0,-1)}</h2><div class="form">${F.map(f=>field(f,rec)).join('')}</div><div class="row"><button id="ok">Save</button><button class="alt" id="no">Cancel</button></div>`;
 document.body.appendChild(d);d.showModal();$('#no').onclick=()=>d.close();
 $('#ok').onclick=()=>{const o={};let bad=0;
  F.forEach(f=>{const [key,l,t]=f,el=$('#f_'+key),raw=el.value.trim(),er=$('#e_'+key);er.textContent='';let v=raw;
   if(f[3]&&!raw){er.textContent='Required';bad++;return}
   if(t=='num'&&raw!==''){v=+raw;if(!isFinite(v)||v<f[4]||v>f[5]){er.textContent=`Enter a number from ${f[4]} to ${f[5]}`;bad++;return}}
   else if(t=='num')v=null;
   if(t=='drv'||t=='veh'||t=='rte')v=raw?+raw:null;
   if((t=='date'||t=='dt')&&raw)v=MSF.has(key)?Date.parse(raw):raw.slice(0,10);else if(t=='date'||t=='dt')v=MSF.has(key)?null:'';
   o[key]=v});
  if(k=='vehicles'&&DB.vehicles.some(x=>x.reg.toLowerCase()==String(o.reg).toLowerCase()&&x.id!=id)){$('#e_reg').textContent='Registration already exists';bad++}
  if(bad)return;
  if(k=='trips'){const v=DB.vehicles.find(x=>x.id==o.vid),dr=DB.drivers.find(x=>x.id==o.did),ro=DB.routes.find(x=>x.id==o.rid);Object.assign(o,{vehicle:v.reg,type:v.type,driver:dr.name,route:ro.name});
   if(o.status=='Cancelled')Object.assign(o,{km:null,fuel:null,mins:null,avg:null,max:null})}
  if(k=='maint')o.vehicle=DB.vehicles.find(x=>x.id==o.vid).reg;
  if(rec)Object.assign(rec,o);else DB[k].push({id:nextId(k),...o});
  if(k=='trips')flagOne(rec||DB.trips[DB.trips.length-1]);
  save();d.close();toast('Saved');table(k)}}
function flagOne(t){t.flag='';if(t.status!='Completed'||!(t.km>0))return;const g=DB.trips.filter(x=>x.type==t.type&&x.status=='Completed'&&x.km>0).map(x=>x.fuel/x.km*100),w=[];
 if(g.length>=8&&t.fuel/t.km*100>1.6*quart(g,.5))w.push('High fuel');if(t.max>140)w.push('Overspeed');t.flag=w.join(', ')}
function del(k,id){const n=k=='vehicles'?DB.trips.filter(t=>t.vid==id).length+DB.maint.filter(m=>m.vid==id).length:k=='drivers'?DB.trips.filter(t=>t.did==id).length+DB.vehicles.filter(v=>v.driver==id).length:0;
 if(n){toast(`Cannot delete: ${n} linked record(s) use it. Remove or reassign them first.`);return}
 if(!confirm('Delete this record?'))return;DB[k]=DB[k].filter(r=>r.id!=id);save();table(k)}
