/* --- models --- */
function shuf(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function cart(X,y,idx,o,r,d=0){
 const n=idx.length,m=mean(idx.map(i=>y[i]));if(d>=o.depth||n<2*o.leaf)return{v:m};
 const fs=shuf([...Array(X[0].length).keys()],r).slice(0,o.mf);let tot=0;idx.forEach(i=>tot+=y[i]);let best=null;const base=tot*tot/n;
 for(const f of fs){const s=idx.map(i=>[X[i][f],y[i]]).sort((a,b)=>a[0]-b[0]);let l=0;
  for(let k=0;k<n-1;k++){l+=s[k][1];if(s[k][0]==s[k+1][0]||k+1<o.leaf||n-k-1<o.leaf)continue;const nl=k+1,rr=tot-l,sc=l*l/nl+rr*rr/(n-nl);if(!best||sc>best.sc)best={sc,f,t:(s[k][0]+s[k+1][0])/2}}}
 if(!best)return{v:m};o.imp[best.f]+=best.sc-base;
 const L=[],R=[];idx.forEach(i=>(X[i][best.f]<=best.t?L:R).push(i));
 return{f:best.f,t:best.t,l:cart(X,y,L,o,r,d+1),r:cart(X,y,R,o,r,d+1)}}
const walk=(t,x)=>{while(t.f!==undefined)t=x[t.f]<=t.t?t.l:t.r;return t.v};
function rf(X,y,o,r){const n=X.length,T=[],imp=Array(X[0].length).fill(0);
 for(let b=0;b<o.trees;b++)T.push(cart(X,y,Array.from({length:n},()=>Math.floor(r()*n)),{...o,imp},r));
 return{pred:x=>mean(T.map(t=>walk(t,x))),imp}}
/* CatBoost-style: gradient boosting on symmetric (oblivious) trees, one split per level shared by all nodes */
function gbt(X,y,o,cls){const n=X.length,nf=X[0].length,lam=3,p0=mean(y);
 const cand=[...Array(nf).keys()].map(f=>{const v=[...new Set(X.map(x=>x[f]))].sort((a,b)=>a-b),k=Math.min(12,v.length-1),s=new Set();for(let i=1;i<=k;i++){const j=Math.floor(i*v.length/(k+1));if(j>0&&j<v.length)s.add((v[j-1]+v[j])/2)}return[...s]});
 const base=cls?Math.log((p0+1e-6)/(1-p0+1e-6)):p0,F=Array(n).fill(base),trees=[],imp=Array(nf).fill(0);
 for(let t=0;t<o.iters;t++){
  const g=new Float64Array(n),h=new Float64Array(n);
  for(let i=0;i<n;i++){if(cls){const p=sig(F[i]);g[i]=y[i]-p;h[i]=p*(1-p)+1e-6}else{g[i]=y[i]-F[i];h[i]=1}}
  let leaf=new Int32Array(n),sp=[],G0=0,H0=0;for(let i=0;i<n;i++){G0+=g[i];H0+=h[i]}let prev=G0*G0/(H0+lam);
  for(let d=0;d<o.depth;d++){let best=null;const L=2<<d;
   for(let f=0;f<nf;f++)for(const th of cand[f]){const G=new Float64Array(L),H=new Float64Array(L);
    for(let i=0;i<n;i++){const k=leaf[i]*2+(X[i][f]>th?1:0);G[k]+=g[i];H[k]+=h[i]}
    let s=0;for(let k=0;k<L;k++)s+=G[k]*G[k]/(H[k]+lam);if(!best||s>best.s)best={s,f,th}}
   if(!best)break;sp.push(best);imp[best.f]+=Math.max(0,best.s-prev);prev=best.s;
   for(let i=0;i<n;i++)leaf[i]=leaf[i]*2+(X[i][best.f]>best.th?1:0)}
  const L=1<<sp.length,G=new Float64Array(L),H=new Float64Array(L);
  for(let i=0;i<n;i++){G[leaf[i]]+=g[i];H[leaf[i]]+=h[i]}
  const val=[...G].map((x,k)=>o.lr*x/(H[k]+lam));for(let i=0;i<n;i++)F[i]+=val[leaf[i]];trees.push({sp,val})}
 const raw=x=>{let s=base;for(const t of trees){let k=0;for(const q of t.sp)k=k*2+(x[q.f]>q.th?1:0);s+=t.val[k]}return s};
 return{pred:x=>cls?sig(raw(x)):raw(x),imp}}
function logit(X,y){const w=Array(X[0].length+1).fill(0),np=y.reduce((a,b)=>a+b,0),pw=np?Math.min(10,(y.length-np)/np):1;/* class weight so rare positives are not ignored */
 for(let e=0;e<300;e++){const gr=w.map(()=>0);X.forEach((x,i)=>{let z=w[0];x.forEach((v,f)=>z+=w[f+1]*v);const er=(sig(z)-y[i])*(y[i]?pw:1);gr[0]+=er;x.forEach((v,f)=>gr[f+1]+=er*v)});w.forEach((_,k)=>w[k]-=.5*(gr[k]/X.length+(k?.01*w[k]:0)))}return w}
const FIT={
 cb:c=>(X,y)=>gbt(X,y,{iters:60,depth:4,lr:.15},c),
 rf:c=>(X,y,r)=>rf(X,y,{trees:40,depth:8,leaf:3,mf:c?Math.max(1,Math.round(Math.sqrt(X[0].length))):Math.max(1,Math.round(X[0].length/3))},r),
 lin:c=>(X,y)=>{const s=std(X),w=c?logit(X.map(s),y):ols(X.map(s),y);
  return{pred:x=>{let q=w[0];s(x).forEach((v,f)=>q+=w[f+1]*v);return c?sig(q):q},imp:w.slice(1).map(Math.abs)}}};
function auc(y,s){const o=y.map((v,i)=>[s[i],v]).sort((a,b)=>a[0]-b[0]);let rk=0,np=0,i=0;
 while(i<o.length){let j=i;while(j<o.length&&o[j][0]==o[i][0])j++;const r=(i+j+1)/2;for(let k=i;k<j;k++)if(o[k][1]){rk+=r;np++}i=j}
 const nn=o.length-np;return np&&nn?(rk-np*(np+1)/2)/(np*nn):NaN}
function clsMet(y,pr){let tp=0,fp=0,fn=0,tn=0;y.forEach((v,i)=>{const p=pr[i]>=.5;p&&v?tp++:p?fp++:v?fn++:tn++});
 const pre=tp/(tp+fp||1),rec=tp/(tp+fn||1);return{Accuracy:(tp+tn)/y.length,Precision:pre,Recall:rec,F1:2*pre*rec/(pre+rec||1),'ROC AUC':auc(y,pr)}}
