/* Built-in sample data (seeded, runs once at start-up). No generator page: users load their own CSVs in the ML section. */
function gen(c){
 const r=rng(c.seed),rf=(a,b)=>a+r()*(b-a),ri=(a,b)=>Math.floor(rf(a,b+1)),pk=a=>a[Math.floor(r()*a.length)];
 const L={Truck:[32,48],Van:[12,18],Car:[7,10],Bus:[28,38],Pickup:[11,15],Motorcycle:[3,5]};
 const SP={Truck:55,Van:58,Car:65,Bus:50,Pickup:60,Motorcycle:62};
 const MK={Truck:['Tata','Ashok Leyland'],Van:['Maruti','Mahindra'],Car:['Hyundai','Toyota'],Bus:['Eicher','Ashok Leyland'],Pickup:['Mahindra','Isuzu'],Motorcycle:['Hero','Bajaj']};
 const types=Object.keys(L),cities=['Chennai','Cuddalore','Pondicherry','Madurai','Trichy','Salem','Coimbatore','Vellore','Tirunelveli','Thanjavur','Erode','Tiruppur','Nagercoil','Hosur'];
 const fn=['Arun','Karthik','Priya','Divya','Suresh','Meena','Ravi','Lakshmi','Vijay','Anitha','Senthil','Kavya','Murali','Revathi'],ln=['Kumar','Raj','Devi','Selvam','Pillai','Nathan','Babu','Iyer'];
 const drivers=[...Array(c.drivers)].map((_,i)=>({id:i+1,name:pk(fn)+' '+pk(ln),age:ri(22,60),phone:'9'+ri(1e8,9e8),licence_no:'TN'+(1e9+i*7919+ri(0,999)),licence_expiry:ymd(Date.parse(c.end)+ri(30,1500)*864e5),experience_years:+rf(1,25).toFixed(1),status:r()<.9?'Active':pk(['On Leave','Suspended','Resigned']),risk:rf(.9,1.2)}));
 const routes=[];for(let i=0;i<c.routes;i++){let a=pk(cities),b=pk(cities);if(a==b)b=cities[(cities.indexOf(a)+1)%cities.length];routes.push({id:i+1,name:a+' to '+b+' #'+(i+1),from:a,to:b,km:+rf(20,450).toFixed(0)})}
 const vehicles=[...Array(c.vehicles)].map((_,i)=>{const t=pk(types),y=ri(2010,2025),s=r();return{id:i+1,reg:'TN-'+ri(10,99)+'-'+String.fromCharCode(65+ri(0,25),65+ri(0,25))+'-'+ri(1000,9999),type:t,make:pk(MK[t]),year:y,fuel:t=='Bus'||t=='Truck'?'Diesel':pk(['Petrol','Diesel','CNG','Hybrid']),odo:ri(8e3,4e5),model:pk(['LX','Pro','Max','Plus']),ins:ymd(Date.parse(c.end)+ri(-20,380)*864e5),regx:ymd(Date.parse(c.end)+ri(-10,500)*864e5),status:s<.8?'Active':s<.88?'Inactive':'Under Maintenance',driver:ri(1,c.drivers)}});
 const avail=vehicles.filter(v=>v.status!='Inactive'),s0=Date.parse(c.start),days=Math.max(1,Math.round((Date.parse(c.end)-s0)/864e5)+1),trips=[];
 for(let i=1;i<=c.trips&&avail.length;i++){
  const v=pk(avail),d=drivers[v.driver-1],ro=pk(routes),can=r()<.06,dist=ro.km*rf(.95,1.06),sp=SP[v.type]*rf(.85,1.12),dur=dist/sp*60;
  const st=s0+ri(0,days-1)*864e5+ri(5,18)*36e5+ri(0,59)*6e4;let fuel=dist/100*rf(...L[v.type])*(1+(2026-v.year)*.012)*d.risk;if(r()<.02)fuel*=rf(1.7,2.3);
  trips.push({id:i,vid:v.id,did:d.id,rid:ro.id,vehicle:v.reg,type:v.type,driver:d.name,route:ro.name,start:st,
   km:can?null:+dist.toFixed(1),fuel:can?null:+fuel.toFixed(1),mins:can?null:+dur.toFixed(0),avg:can?null:+sp.toFixed(1),max:can?null:+(sp*rf(1.2,1.5)+(r()<.01?60:0)).toFixed(0),status:can?'Cancelled':'Completed'})}
 types.forEach(t=>{const g=trips.filter(x=>x.type==t&&x.status=='Completed');if(g.length<8)return;
  const f=g.map(x=>x.fuel/x.km*100),s=g.map(x=>x.avg),qf=[quart(f,.25),quart(f,.75)],qs=[quart(s,.25),quart(s,.75)];
  g.forEach(x=>{const fl=x.fuel/x.km*100,w=[];if(fl>qf[1]+1.5*(qf[1]-qf[0]))w.push('High fuel');if(x.avg>qs[1]+1.5*(qs[1]-qs[0])||x.avg<qs[0]-1.5*(qs[1]-qs[0]))w.push('Odd speed');if(x.max>140)w.push('Overspeed');x.flag=w.join(', ')})});
 const MT={'Routine Service':[3e3,9e3],Inspection:[1e3,3e3],'Tyre Replacement':[8e3,3e4],'Battery Replacement':[4e3,1.2e4],Repair:[5e3,4e4],Breakdown:[1e4,8e4]},CP=['Engine','Brakes','Tyres','Battery','Clutch','Suspension','Cooling system','Transmission'];
 const maint=[];for(let i=1;i<=c.maint&&vehicles.length;i++){const v=pk(vehicles),age=2026-v.year,u=r(),t=u<.05+age*.012?'Breakdown':u<.25+age*.02?'Repair':pk(['Routine Service','Routine Service','Inspection','Tyre Replacement','Battery Replacement']);
  const dd0=s0+ri(0,days-1)*864e5;maint.push({id:i,vid:v.id,vehicle:v.reg,date:dd0,next:(t=='Routine Service'||t=='Inspection')?dd0+ri(60,200)*864e5:null,provider:pk(['City Auto Works','Fleet Care','Highway Garage']),desc:'',type:t,part:pk(CP),cost:+rf(...MT[t]).toFixed(0),status:'Completed'})}
 return{vehicles,drivers,routes,trips,maint}}
