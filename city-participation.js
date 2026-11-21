import {readLocalList,writeLocalList} from './profiles.js';

export const districts={
  abai:{name:['Абай ауданы','Абайский район'],lat:42.324,lon:69.576},
  farabi:{name:['Әл-Фараби ауданы','Аль-Фарабийский район'],lat:42.313,lon:69.591},
  enbekshi:{name:['Еңбекші ауданы','Енбекшинский район'],lat:42.310,lon:69.660},
  karatau:{name:['Қаратау ауданы','Каратауский район'],lat:42.385,lon:69.643},
  turan:{name:['Тұран ауданы','Район Туран'],lat:42.292,lon:69.544}
};

export const activityTypes={
  cleanup:{name:['Тазалық','Уборка'],bring:['Қолғап пен су.','Перчатки и воду.']},
  planting:{name:['Көгалдандыру','Озеленение'],bring:['Жұмыс қолғаптары мен су.','Рабочие перчатки и воду.']},
  seniors:{name:['Қарттарға көмек','Помощь пожилым'],bring:['Жайлы аяқ киім мен су.','Удобную обувь и воду.']},
  repair:{name:['Жеңіл жөндеу','Ремонт'],bring:['Жұмыс қолғаптары мен жабық аяқ киім.','Рабочие перчатки и закрытую обувь.']}
};

const templates=[
  ['park-cleanup','cleanup','abai',1,'10:00',120,15,7,['Саябақтағы тазалық','Уборка в парке'],['Саябақтың жаяу жүргінші кіреберісі','У пешеходного входа в парк']],
  ['park-planting','planting','abai',1,'11:00',90,12,4,['Саябақта көшет отырғызу','Посадка саженцев в парке'],['Саябақтың көгалдандыру алаңы','Участок озеленения в парке']],
  ['walk-cleanup','cleanup','farabi',3,'15:00',90,10,9,['Аллеяны тазалау','Уборка аллеи'],['Серуендеу аллеясының басы','У начала прогулочной аллеи']],
  ['center-seniors','seniors','farabi',5,'12:00',60,8,8,['Қарттарға көмек күні','День помощи пожилым'],['Аудандық демо қоғамдық орталық','Демо-общественный центр района']],
  ['courtyard-planting','planting','enbekshi',6,'10:30',120,16,5,['Аулаға гүл егу','Посадка цветов во дворе'],['Қоғамдық ауладағы гүлзар','У клумбы в общественном дворе']],
  ['bench-repair','repair','karatau',8,'11:00',90,8,2,['Орындықтарды бояу','Покраска скамеек'],['Қоғамдық серуен алаңы','В общественной прогулочной зоне']],
  ['turan-seniors','seniors','turan',10,'14:00',120,12,3,['Қарттарға заттарды реттеуге көмектесу','Помощь пожилым с разбором вещей'],['Аудандық демо қоғамдық орталық','Демо-общественный центр района']],
  ['yard-cleanup','cleanup','enbekshi',12,'09:30',60,18,6,['Ауланы тазалау','Уборка двора'],['Қоғамдық жаяу жүргінші алаңы','В общественной пешеходной зоне']]
];
const oldPlaces=[
  ['Тұрғын үй маңындағы аумақ','Территория у жилого квартала'],
  ['Жаяу жүргінші аллеясы','Пешеходная аллея'],
  ['Саябақ шеті','Участок рядом с парком']
];

const storageKey='cleanup-entries';
const dayMs=86400000;
const anchor=Date.UTC(2026,0,5);
const cityDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit'});
export const newCityId=()=>globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const text=value=>typeof value==='string' && Boolean(value.trim());
const translated=value=>Array.isArray(value) && value.length===2 && value.every(text);
const integer=value=>Number.isSafeInteger(value) && value>0;
const dateValid=date=>typeof date==='string' && /^\d{4}-\d\d-\d\d$/.test(date) && Number.isFinite(Date.parse(date)) &&
  new Date(date).toISOString().slice(0,10)===date;
const timeValid=time=>typeof time==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
export const activityStart=activity=>Date.parse(activity.date+'T'+activity.time+':00+05:00');
export const activityEnd=activity=>activityStart(activity)+activity.duration*60000;
const overlaps=(a,b)=>activityStart(a)<activityEnd(b) && activityStart(b)<activityEnd(a);

function activityValid(row){
  return row && text(row.id) && Object.hasOwn(activityTypes,row.type) && Object.hasOwn(districts,row.district) &&
    translated(row.title) && translated(row.place) && dateValid(row.date) && timeValid(row.time) &&
    integer(row.duration) && integer(row.capacity) && Number.isInteger(row.seeded) && row.seeded>=0 && row.seeded<=row.capacity;
}

function legacyValid(row){
  const slot=row?.slot;
  return text(row?.profile) && slot && text(slot.id) && Object.hasOwn(districts,slot.zone) &&
    Number.isInteger(slot.point) && Boolean(oldPlaces[slot.point]) && dateValid(slot.date) && timeValid(slot.time) &&
    integer(slot.capacity) && Number.isInteger(slot.base) && slot.base>=0 && slot.base<=slot.capacity;
}

function fromLegacy(row,index) {
  const slot=row.slot;
  const activity={id:slot.id,type:'cleanup',district:slot.zone,title:['Тазалық тобы '+(slot.point+1),'Группа уборки '+(slot.point+1)],
    place:oldPlaces[slot.point],date:slot.date,time:slot.time,capacity:slot.capacity,seeded:slot.base,duration:60};
  return {id:'legacy-'+index+'-'+slot.id,userId:row.profile,activityId:slot.id,activity,created:null,
    status:row.cancelled?'cancelled':'joined'};
}

export function readParticipation(){
  const {rows,issue}=readLocalList(storageKey,row=>legacyValid(row) || (row && text(row.id) && text(row.userId) &&
    activityValid(row.activity) && row.activityId===row.activity.id && ['joined','waiting','cancelled'].includes(row.status) &&
    (row.created===null || (Number.isFinite(row.created) && Number.isFinite(new Date(row.created).getTime())))));
  return {rows:rows.map((row,index)=>legacyValid(row)?fromLegacy(row,index):row),issue};
}

function calendar(now) {
  const parts=Object.fromEntries(cityDate.formatToParts(now).map(part=>[part.type,part.value]));
  const today=Date.parse([parts.year,parts.month,parts.day].join('-'));
  const period=Math.floor((today-anchor)/(14*dayMs));
  return templates.flatMap(([id,type,district,offset,time,duration,capacity,seeded,title,place])=>{
    const create=cycle=>{
      const date=new Date(anchor+(cycle*14+offset)*dayMs).toISOString().slice(0,10);
      return {id:id+'-'+date,type,district,title,place,date,time,duration,capacity,seeded};
    };
    const current=create(period);
    return activityEnd(current)<=now?[current,create(period+1)]:[create(period-1),current];
  });
}

export function cityActivities(rows,now=Date.now()) {
  const unique=new Map(calendar(now).map(activity=>[activity.id,activity]));
  for(const row of rows)if(!unique.has(row.activityId))unique.set(row.activityId,row.activity);
  const confirmed=new Map();
  for(const row of rows){
    if(row.status!=='joined')continue;
    if(!confirmed.has(row.activityId))confirmed.set(row.activityId,new Set());
    confirmed.get(row.activityId).add(row.userId);
  }
  return [...unique.values()].map(activity=>{
    const signedUp=[...Array.from({length:activity.seeded},(_,index)=>'demo-'+(index+1)),...(confirmed.get(activity.id) || [])];
    const status=activityEnd(activity)<=now?'past':signedUp.length>=activity.capacity?'full':'open';
    return {...activity,signedUp,status};
  }).sort((a,b)=>activityStart(a)-activityStart(b) || a.id.localeCompare(b.id));
}

export function filterActivities(activities,filters) {
  return activities.filter(activity=>['district','type','date'].every(key=>!filters[key] || activity[key]===filters[key]));
}

export function participationFor(rows,userId,activityId) {
  return rows.find(row=>row.userId===userId && row.activityId===activityId && row.status!=='cancelled');
}

export function helpMinutes(rows,userId,now=Date.now()) {
  const finished=new Map(rows.filter(row=>row.userId===userId && row.status==='joined' && activityEnd(row.activity)<=now)
    .map(row=>[row.activityId,row.activity.duration]));
  return [...finished.values()].reduce((sum,duration)=>sum+duration,0);
}

export function updateCity(task) {
  return globalThis.navigator?.locks ? navigator.locks.request('janashyr.city',task) : task();
}

export function changeParticipation(action,activityId,userId,now=Date.now()) {
  if(!userId)return 'profileRequired';
  const {rows,issue}=readParticipation();
  if(issue==='unavailable')return issue;
  const activity=cityActivities(rows,now).find(row=>row.id===activityId);
  if(!activity || activityStart(activity)<=now)return 'closed';
  const existing=participationFor(rows,userId,activityId);
  const save=(next,code)=>writeLocalList(storageKey,next)?code:'saveFailed';
  if(action==='leave'){
    if(!existing)return 'changed';
    return save(rows.map(row=>row===existing?{...row,status:'cancelled'}:row),'cancelled');
  }
  if(existing?.status==='joined' || (action==='wait' && existing?.status==='waiting'))return 'duplicate';
  if(action==='wait' && activity.status!=='full')return 'nowOpen';
  if(action==='join' && activity.status==='full')return 'full';
  if(action!=='wait' && action!=='join')return 'changed';
  if(action==='join' && rows.some(row=>row.status==='joined' && row.userId===userId && overlaps(row.activity,activity)))return 'overlap';
  const {signedUp,status,...snapshot}=activity;
  const membership={id:existing?.id || newCityId(),userId,activityId,activity:snapshot,created:now,
    status:action==='wait'?'waiting':'joined'};
  return save(existing?rows.map(row=>row===existing?membership:row):[membership,...rows],action==='wait'?'waited':'entered');
}
