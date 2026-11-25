const chip=s=>`<span class="chip ${/Active|Completed/.test(s)?'ok':/Cancel|Suspend|Resign|Inactive/.test(s)?'bad':'warn'}">${s}</span>`;
const TB={
 vehicles:{t:'Vehicles',rows:()=>DB.vehicles,c:[['ID','id'],['Registration','reg'],['Type','type'],['Make','make'],['Year','year'],['Fuel','fuel'],['Odometer (km)','odo',1],['Insurance expiry','ins'],['Driver',v=>DB.drivers[v.driver-1]?.name],['Status','status',2]]},
 drivers:{t:'Drivers',rows:()=>DB.drivers,c:[['ID','id'],['Name','name'],['Age','age'],['Licence','licence_no'],['Licence expiry','licence_expiry'],['Experience (yrs)','experience_years',1],['Status','status',2]]},
 trips:{t:'Trips',rows:()=>DB.trips,c:[['ID','id'],['Start',t=>new Date(t.start).toISOString().slice(0,16).replace('T',' ')],['Vehicle','vehicle'],['Driver','driver'],['Route','route'],['km','km',1],['Fuel (L)','fuel',1],['Avg km/h','avg',1],['Status','status',2],['Flag',t=>t.flag?`<span class="chip bad">${t.flag}</span>`:'']]},
 maint:{t:'Maintenance',rows:()=>DB.maint,c:[['ID','id'],['Date',m=>ymd(m.date)],['Vehicle','vehicle'],['Type','type'],['Component','part'],['Cost','cost',1],['Status','status',2]]}};
function table(k){
 const T=TB[k],q=(Q[k]||'').toLowerCase(),text=r=>T.c.map(([,f])=>typeof f=='function'?f(r):r[f]).join(' ').toLowerCase();
 const sts=[...new Set(T.rows().map(r=>r.status))],sf=Q[k+'_s']||'',rows=T.rows().filter(r=>(!sf||r.status===sf)&&(!q||text(r).includes(q))),shown=rows.slice(0,200),ins=k=='maint'?maintInsights(rows):'';
 $('#main').innerHTML=`<div class="bar"><div><h1>${T.t}</h1><div class="sub">${fmt(rows.length)} records${rows.length>200?', showing the first 200':''}</div></div>
 <div class="row" style="margin:0"><input id="q" type="search" placeholder="Search ${T.t.toLowerCase()}" value="${Q[k]||''}" aria-label="Search"><select id="sf" aria-label="Filter by status"><option value="">All statuses</option>${sts.map(s=>`<option${s===sf?' selected':''}>${s}</option>`).join('')}</select><button id="add">Add</button><button class="alt" id="dl">Download CSV</button></div></div>
 ${ins}<div class="tw"><table><thead><tr>${T.c.map(c=>`<th>${c[0]}</th>`).join('')}<th></th></tr></thead><tbody>${shown.length?shown.map(r=>'<tr>'+T.c.map(([,f,m])=>{let v=typeof f=='function'?f(r):r[f];return m==2?`<td>${chip(v)}</td>`:`<td class="${typeof v=='number'?'n':''}">${typeof v=='number'&&m?fmt(v,m==1&&v%1?1:0):v??'—'}</td>`}).join('')+`<td><button class="alt" data-e="${r.id}">Edit</button> <button class="alt" data-d="${r.id}">Delete</button></td></tr>`).join(''):'<tr><td colspan="99">No matches. Clear the search or the status filter.</td></tr>'}</tbody></table></div>`;
 $('#q').oninput=e=>{Q[k]=e.target.value;const p=e.target.selectionStart;table(k);const i=$('#q');i.focus();i.setSelectionRange(p,p)};
 $('#sf').onchange=e=>{Q[k+'_s']=e.target.value;table(k)};
 $('#add').onclick=()=>form(k);document.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>form(k,b.dataset.e));document.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>del(k,+b.dataset.d));
 $('#dl').onclick=()=>csv(k+'.csv',[T.c.map(c=>c[0]),...rows.map(r=>T.c.map(([,f])=>{let v=typeof f=='function'?f(r):r[f];return String(v??'').replace(/<[^>]+>/g,'')}))])}

function csv(name,rows){const b=new Blob([rows.map(r=>r.map(v=>/[",\n]/.test(v)?'"'+String(v).replace(/"/g,'""')+'"':v).join(',')).join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

function maintInsights(rows){const by={},tp={};let tot=0;rows.forEach(m=>{tot+=m.cost;tp[m.type]=(tp[m.type]||0)+1;const o=by[m.vehicle]??={r:0,c:0};o.c+=m.cost;if(m.type=='Breakdown'||m.type=='Repair')o.r++});
 const top=Object.entries(by).sort((a,b)=>b[1].r-a[1].r||b[1].c-a[1].c).slice(0,5);
 return `<div class="box" style="margin-bottom:14px"><h2>Maintenance insights</h2><div class="m"><span class="chip ok">Total cost ${fmt(tot)}</span>${Object.entries(tp).map(([k,v])=>`<span class="chip">${esc(k)}: ${v}</span>`).join('')}</div><div class="sub">Most frequently repaired vehicles (breakdowns and repairs): ${top.map(([v,o])=>`${esc(v)} (${o.r} repairs, cost ${fmt(o.c)})`).join('; ')||'none'}</div></div>`}
