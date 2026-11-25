function apriori(tx,minSup,minConf){const N=tx.length,sets=tx.map(t=>new Set(t)),sup=new Map(),cnt=c=>sets.reduce((a,s)=>a+(c.every(i=>s.has(i))?1:0),0);
 let L=[...new Set(tx.flat())].map(i=>[i]).filter(i=>{const c=cnt(i)/N;if(c>=minSup){sup.set(i[0],c);return true}});const all=[...L];
 for(let k=2;k<=3&&L.length;k++){const C=new Map();for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const u=[...new Set([...L[a],...L[b]])].sort();if(u.length==k)C.set(u.join('|'),u)}
  L=[...C.values()].filter(c=>{const s=cnt(c)/N;if(s>=minSup){sup.set(c.join('|'),s);return true}});all.push(...L)}
 const rules=[];all.filter(s=>s.length>1).forEach(s=>{const n=s.length;
  for(let m=1;m<(1<<n)-1;m++){const A=s.filter((_,i)=>m>>i&1),B=s.filter((_,i)=>!(m>>i&1));
   if(!B.every(b=>/^(type|part):/.test(b)))continue;
   const sa=sup.get(A.join('|')),sb=sup.get(B.join('|')),ss=sup.get(s.join('|'));
   if(sa&&sb&&ss/sa>=minConf)rules.push({A,B,sup:ss,conf:ss/sa,lift:ss/sa/sb})}});
 return rules.sort((x,y)=>y.lift-x.lift||y.conf-x.conf)}
function assoc(tx,sup,conf,title){
 if(tx.length<20)return{title,err:`Only ${tx.length} vehicle-months with maintenance records. At least 20 are needed.`};
 const R=apriori(tx,sup,conf),nice=a=>a.map(i=>i.replace(':',' = ')).join(' and ');
 return{title,sub:`${fmt(tx.length)} vehicle-months with maintenance, minimum support ${(sup*100).toFixed(0)}%, minimum confidence ${(conf*100).toFixed(0)}%. Rules are ranked by lift; lift above 1 means the items occur together more than chance.`,
  chart:{label:'Rule lift (top 8)',labels:R.slice(0,8).map((r,i)=>'#'+(i+1)+' '+r.B.join(' & ').replace(/:/g,' = ')),data:R.slice(0,8).map(r=>+r.lift.toFixed(2))},html:R.length?`<div class="tw"><table><thead><tr><th>If</th><th>Then</th><th>Support</th><th>Confidence</th><th>Lift</th></tr></thead><tbody>${R.slice(0,15).map(r=>`<tr><td>${nice(r.A)}</td><td>${nice(r.B)}</td><td class="n">${(r.sup*100).toFixed(1)}%</td><td class="n">${(r.conf*100).toFixed(0)}%</td><td class="n">${r.lift.toFixed(2)}</td></tr>`).join('')}</tbody></table></div><p class="note">${fmt(R.length)} rules found in total.</p>`:'<p>No rules met the thresholds. Lower the minimum support or confidence.</p>'}}
