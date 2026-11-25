function mk(id,cfg){charts.push(new Chart($(id),cfg))}

let MC=0,PENDING=[];
function extra(r){if(r.err)return'';const id='mc'+(MC++);PENDING.push([id,r]);
 const cm=r.cm?`<div class="sub" style="margin-top:10px">Confusion matrix (rows = actual, columns = predicted)</div><div class="tw"><table><tbody><tr><th></th><th>${r.lab[0]}</th><th>${r.lab[1]}</th></tr><tr><th>${r.lab[0]}</th><td class="n">${r.cm[0][0]}</td><td class="n">${r.cm[0][1]}</td></tr><tr><th>${r.lab[1]}</th><td class="n">${r.cm[1][0]}</td><td class="n">${r.cm[1][1]}</td></tr></tbody></table></div>`:'';
 const ex=r.ex?`<div class="sub" style="margin-top:8px">Sample test predictions: ${r.ex.map(esc).join(' | ')}</div>`:'';
 return cm+ex+`<div class="ch" style="height:240px;margin-top:10px"><canvas id="${id}"></canvas></div>`}
function drawPending(){const g='#0b8a63',a='#e8a317',ru='#b5472b',o={responsive:true,maintainAspectRatio:false};
 PENDING.splice(0).forEach(([id,r])=>{const el=document.getElementById(id);if(!el)return;let cfg;
  if(r.cm)cfg={type:'doughnut',data:{labels:r.lab,datasets:[{data:r.pc,backgroundColor:[g,ru],borderWidth:0}]},options:{...o,plugins:{title:{display:true,text:'Predicted class distribution (test rows)'}}}};
  else if(r.pts)cfg={type:'scatter',data:{datasets:[{label:'Actual vs predicted',data:r.pts.map(p=>({x:p[0],y:p[1]})),backgroundColor:g}]},options:{...o,scales:{x:{title:{display:true,text:'Actual'}},y:{title:{display:true,text:'Predicted'}}}}};
  else if(r.chart)cfg={type:'bar',data:{labels:r.chart.labels,datasets:[{label:r.chart.label,data:r.chart.data,backgroundColor:a}]},options:{...o,plugins:{legend:{display:false},title:{display:true,text:r.chart.label}}}};
  if(cfg)charts.push(new Chart(el,cfg))})}
