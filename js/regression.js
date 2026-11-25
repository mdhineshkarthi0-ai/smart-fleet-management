function std(X){const m=[],s=[];for(let f=0;f<X[0].length;f++){const c=X.map(x=>x[f]),mu=mean(c);m.push(mu);s.push(Math.sqrt(mean(c.map(v=>(v-mu)**2)))||1)}return x=>x.map((v,f)=>(v-m[f])/s[f])}
function ols(X,y){const k=X[0].length+1,A=Array.from({length:k},()=>Array(k+1).fill(0));
 X.forEach((x,i)=>{const r=[1,...x];for(let a=0;a<k;a++){for(let b=0;b<k;b++)A[a][b]+=r[a]*r[b];A[a][k]+=r[a]*y[i]}});
 for(let a=1;a<k;a++)A[a][a]+=1e-3;
 for(let c=0;c<k;c++){let p=c;for(let q=c+1;q<k;q++)if(Math.abs(A[q][c])>Math.abs(A[p][c]))p=q;[A[c],A[p]]=[A[p],A[c]];
  for(let q=0;q<k;q++)if(q!=c){const f=A[q][c]/A[c][c];for(let j=c;j<=k;j++)A[q][j]-=f*A[c][j]}}
 return A.map((r,i)=>r[k]/r[i])}
function regMet(y,p){const m=mean(y);let a=0,s=0,t=0;y.forEach((v,i)=>{const e=v-p[i];a+=Math.abs(e);s+=e*e;t+=(v-m)**2});return{MAE:a/y.length,RMSE:Math.sqrt(s/y.length),'R²':t?1-s/t:NaN}}
