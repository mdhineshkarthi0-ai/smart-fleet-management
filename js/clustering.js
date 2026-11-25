function kmeans(X,k,r){const n=X.length;let C=[X[Math.floor(r()*n)]];
 while(C.length<k){const D=X.map(x=>Math.min(...C.map(c=>dist(x,c)))),tot=mean(D)*n;let u=r()*tot,i=0;while(i<n-1&&(u-=D[i])>0)i++;C.push(X[i])}
 let lab=[];for(let it=0;it<60;it++){lab=X.map(x=>{let b=0,bd=1e18;C.forEach((c,j)=>{const q=dist(x,c);if(q<bd){bd=q;b=j}});return b});
  C=C.map((c,j)=>{const m=X.filter((_,i)=>lab[i]==j);return m.length?c.map((_,f)=>mean(m.map(x=>x[f]))):c})}
 return{lab,inertia:X.reduce((s,x,i)=>s+dist(x,C[lab[i]]),0)}}
function segment(P,k,title){
 if(P.ids.length<k*3)return{title,err:`Only ${P.ids.length} vehicles with trips. At least ${k*3} are needed for ${k} segments.`};
 const s=std(P.X),Z=P.X.map(s),{lab,inertia}=kmeans(Z,k,rng(11)),rows=[];
 for(let j=0;j<k;j++){const m=P.X.filter((_,i)=>lab[i]==j);if(m.length)rows.push([m.length,...[0,1,2,3].map(f=>mean(m.map(x=>x[f])))])}
 rows.sort((a,b)=>a[1]-b[1]);const nm=k==3?['Low','Moderate','High']:rows.map((_,i)=>'Segment '+(i+1));
 return{title,sub:`Vehicles grouped by utilization %, trips per month, average km per trip and total km. Inertia ${fmt(inertia,1)} (compare across k to pick a good k).`,
  chart:{label:'Vehicles per segment',labels:rows.map((_,i)=>nm[i]),data:rows.map(r=>r[0])},html:`<div class="tw"><table><thead><tr><th>Segment</th><th>Vehicles</th><th>Utilization %</th><th>Trips / month</th><th>Km / trip</th><th>Total km</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${nm[i]}</td><td class="n">${r[0]}</td><td class="n">${fmt(r[1],1)}</td><td class="n">${fmt(r[2],1)}</td><td class="n">${fmt(r[3],1)}</td><td class="n">${fmt(r[4])}</td></tr>`).join('')}</tbody></table></div>`}}
