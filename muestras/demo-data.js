/* Example data for the preview copy in new-projects (invented: no real requests, people or projects).
   Same shape as ensayos/ensayos.json in lab-data, including the new collection "muestras".
   Only the preview loads this file; the copy that goes to management-tools does not. */
window.CE_DEMO=function(){
  const DAY=86400000, n=new Date(), T0=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate());
  const ago=k=>new Date(T0-k*DAY).toISOString().slice(0,10), at=k=>new Date(T0-k*DAY).toISOString();
  const personas={
    'p-marta':{nombre:'Marta Vidal',rol:'Lab technician',horasSemana:40,habilitaciones:[]},
    'p-jordi':{nombre:'Jordi Puig',rol:'Lab technician',horasSemana:40,habilitaciones:[]},
    'p-laura':{nombre:'Laura Soler',rol:'Lab technician',horasSemana:40,habilitaciones:[]}};
  const bancos={
    'eq-pump':{nombre:'Pump Test Stand',nombreAras:'Pump Test Stand',estado:'Operational',capacidad:1},
    'eq-anec':{nombre:'Anechoic chamber',nombreAras:'Anechoic chamber',estado:'Operational',capacidad:1},
    'eq-uv':{nombre:'UV chamber',nombreAras:'UV chamber',estado:'Operational',capacidad:2},
    'eq-pool':{nombre:'Endurance test Pool',nombreAras:'Endurance test Pool',estado:'Operational',capacidad:20},
    'eq-drop':{nombre:'Drop Test',nombreAras:'Drop Test',estado:'Operational',capacidad:1},
    'eq-indoor':{nombre:'Indoor Pools',nombreAras:'Indoor Pools',estado:'Operational',capacidad:4},
    'eq-clim':{nombre:'Climatic chamber 1',nombreAras:'Climatic chamber 1',estado:'Operational',capacidad:1}};
  const qtps={
    QTP0217:{code:'QTP0217',name:'Pump Performance Curve',durVal:2,durUnit:'Days',continuous:false,techHours:8,equipmentId:'eq-pump'},
    QTP0239:{code:'QTP0239',name:'Firmware Functionality Test (All Products)',durVal:3,durUnit:'Days',continuous:false,techHours:12,equipmentId:'eq-indoor'},
    QTP0264:{code:'QTP0264',name:'Accelerated UV Weathering Test (QUV)',durVal:1000,durUnit:'Hours',continuous:true,techHours:6,equipmentId:'eq-uv'},
    QTP0381:{code:'QTP0381',name:'Water Ingress Test (IPX5)',durVal:1,durUnit:'Days',continuous:false,techHours:4,equipmentId:'eq-indoor'},
    QTP0741:{code:'QTP0741',name:'Sound Power Test',durVal:2,durUnit:'Days',continuous:false,techHours:10,equipmentId:'eq-anec'},
    QTP0742:{code:'QTP0742',name:'Temperature Variation Test',durVal:5,durUnit:'Days',continuous:true,techHours:4,equipmentId:'eq-clim'},
    QTP0744:{code:'QTP0744',name:'Self Priming Test (EN 16713-2)',durVal:1,durUnit:'Days',continuous:false,techHours:6,equipmentId:'eq-pump'},
    QTP0750:{code:'QTP0750',name:'Packaging Test - ISTA 6 Type A',durVal:2,durUnit:'Days',continuous:false,techHours:10,equipmentId:'eq-drop'},
    QTP0751:{code:'QTP0751',name:'Shear Test',durVal:1,durUnit:'Days',continuous:false,techHours:4,equipmentId:''},
    QTP0752:{code:'QTP0752',name:'Pumps Endurance Running Test',durVal:4000,durUnit:'Hours',continuous:true,techHours:20,equipmentId:'eq-pool'},
    QTP0761:{code:'QTP0761',name:'Assembly test',durVal:1,durUnit:'Days',continuous:false,techHours:6,equipmentId:''}};
  const tests={};
  const T=(plr,qtp,title,project,requester,pieces,sequence,status,x={})=>{
    const id='aras-'+plr+'-'+qtp; tests[id]={source:'ARAS',plr,qtp,title,project,requester,comments:'',pieces,sequence,status,result:'',priority:'Medium',
      requestedDue:ago(-20),flexible:false,equipmentId:qtps[qtp].equipmentId||'',techId:'',start:'',end:'',progress:status==='Completed'?100:0,
      arasStatus:status==='Completed'?'Completed':status==='Queued'?'In Queue':'In Progress',created:at(30),updated:at(1),...x}; return id;};
  const t1=T('PLR003701','QTP0217','Pump Performance Curve','24031 - NEW VS PUMP','Ana Ruiz',6,1,'In progress',{techId:'p-jordi',start:ago(2)});
  const t2=T('PLR003701','QTP0741','Sound Power Test','24031 - NEW VS PUMP','Ana Ruiz',6,2,'Planned',{techId:'p-marta',start:ago(-3)});
  const t3=T('PLR003701','QTP0744','Self Priming Test (EN 16713-2)','24031 - NEW VS PUMP','Ana Ruiz',6,3,'Queued');
  const t4=T('PLR003702','QTP0750','Packaging Test - ISTA 6 Type A','23070 - MULTIPORT VALVE 2"','Pau Ferrer',3,1,'Completed',{result:'Pass',techId:'p-laura',start:ago(35),closedAt:ago(30)});
  const t5=T('PLR003703','QTP0264','Accelerated UV Weathering Test (QUV)','12210 - DIVIDER SCOPING','Sergi Mas',6,1,'Endurance running',{techId:'p-marta',start:ago(18),comments:'3 Divider samples D.200 available. 3 Divider samples D.75 pending injection.'});
  const t6=T('PLR003703','QTP0751','Shear Test','12210 - DIVIDER SCOPING','Sergi Mas',6,2,'Queued');
  T('PLR003704','QTP0239','Firmware Functionality Test (All Products)','25012 - SMART PUMP CONTROLLER','Núria Costa',2,1,'Queued');
  T('PLR003704','QTP0742','Temperature Variation Test','25012 - SMART PUMP CONTROLLER','Núria Costa',2,2,'Queued');
  const t9=T('PLR003705','QTP0752','Pumps Endurance Running Test','GEN06 - Production/Quality Support','Pau Ferrer',4,1,'Endurance running',{techId:'p-jordi',start:ago(28)});
  const t10=T('PLR003706','QTP0381','Water Ingress Test (IPX5)','24040 - OUTDOOR SHOWER RENEWAL','Clara Roig',3,1,'Report',{techId:'p-laura',start:ago(20),progress:90});
  const t11=T('PLR003707','QTP0761','Assembly test','24031 - NEW VS PUMP','Ana Ruiz',2,1,'Queued');
  const t12=T('PLR003708','QTP0217','Pump Performance Curve','25020 - COMPACT FILTER PUMP','Clara Roig',2,1,'Queued');
  T('PLR003709','QTP0741','Sound Power Test','25031 - HEAT PUMP SILENT','Sergi Mas',2,1,'Queued');
  T('PLR003709','QTP0264','Accelerated UV Weathering Test (QUV)','25031 - HEAT PUMP SILENT','Sergi Mas',4,2,'Queued');
  const U=(n,state,x={})=>({n,state,serial:'',loc:'',note:'',removed:false,printed:true,...x});
  const muestras={};
  const L=(id,code,plrs,testIds,desc,pn,phase,k,by,loc,comments,units,project)=>{muestras[id]={code,plrs,tests:testIds,desc,pn,phase,received:ago(k),by,loc,comments,units,
    project:project||tests[testIds[0]].project,log:[{at:at(k),by:'',txt:{k:'log_recv',a:[units.length]}}],created:at(k),updated:at(k)};};
  L('s57','FLS-00057',['PLR003701'],[t1,t2,t3],'Bomba VS 1 HP · muestra ESL','VS-100 V2.1','ESL',12,'p-marta','Estantería A2','Con hidráulica ESL-2',
    [U(1,'testing',{serial:'28825040011',loc:'Banco de bombas'}),U(2,'testing',{serial:'28825040012',loc:'Banco de bombas'}),U(3,'waiting',{serial:'28825040013'}),U(4,'waiting',{serial:'28825040014'})]);
  L('s58','FLS-00058',['PLR003701','PLR003707'],[t1,t2,t3,t11],'Bomba VS 1,5 HP · muestra ESL','VS-150 V2.1','ESL',5,'p-jordi','Estantería A2','Repite en PLR003707 (assembly test)',
    [U(1,'testing',{serial:'28825040021',loc:'Banco de bombas'}),U(2,'waiting',{serial:'28825040022',printed:false})]);
  L('s59','FLS-00059',['PLR003702'],[t4],'Válvula multipuerta 2" con embalaje','73950-0203','Pilot',40,'p-laura','Estantería C1','Drop + vibración + drop',
    [U(1,'tested'),U(2,'tested'),U(3,'stored',{loc:'Almacén muestras'})]);
  L('s60','FLS-00060',['PLR003703'],[t5,t6],'Divisor D.200','77812','Feasibility',20,'p-marta','Cámara UV','Las 3 muestras D.75 están pendientes de inyección',
    [U(1,'testing'),U(2,'testing'),U(3,'testing')]);
  L('s61','FLS-00061',['PLR003705'],[t9],'Bomba Victoria Plus · producción','38773','Production',30,'p-jordi','Piscina durabilidad','',
    [U(1,'testing',{serial:'01249999901',loc:'Posición 12'}),U(2,'testing',{serial:'01249999902',loc:'Posición 13'}),U(3,'testing',{serial:'01249999903',loc:'Posición 14'}),U(4,'testing',{serial:'01249999904',loc:'Posición 15'})]);
  L('s62','FLS-00062',['PLR003706'],[t10],'Ducha exterior · cuerpo','77680','ESL',25,'p-laura','Estantería B3','',
    [U(1,'tested'),U(2,'tested'),U(3,'returned',{note:'Devuelta a I+D'}),U(4,'received',{removed:true,note:'Llegó rota en el transporte'})]);
  L('s63','FLS-00063',['FLT-0216'],[],'MAXIM VS-Pump · embalaje','73774 / 73775','Pilot',150,'p-marta','Almacén muestras','Packaging test type F (registro antiguo)',
    [U(1,'stored',{serial:'0124000059'}),U(2,'stored',{serial:'0124000060'})],'22105 - MAXIM VS-PUMP');
  L('s64','FLS-00064',['PLR003708'],[t12],'Bomba filtro compacta','CFP-075','MSL',0,'p-jordi','Recepción','',
    [U(1,'received',{printed:false}),U(2,'received',{printed:false})]);
  return {tests,personas,bancos,qtps,config:{samples:{seq:64}},muestras};
};
