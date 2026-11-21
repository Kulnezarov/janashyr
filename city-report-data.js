import {readLocalObject,writeLocalObject} from './profiles.js';
import {districts} from './city-participation.js';

export const reportCategories={
  pothole:['Жол шұңқыры','Яма'],trash:['Қоқыс','Мусор'],ramp:['Сынған пандус','Сломанный пандус'],
  light:['Істемейтін жарық','Неработающее освещение'],other:['Басқа','Другое']
};
export const reportStatuses={
  sent:['Жіберілді','Отправлено'],accepted:['Қабылданды','Принято'],working:['Жұмыс жүріп жатыр','В работе'],resolved:['Шешілді','Решено']
};
export const photoLimit=5*1024*1024;
const statuses=Object.keys(reportStatuses);
const legacyStatuses=['sent','accepted','accepted','accepted','working','working','resolved'];
const legacyCategories=['trash','pothole','other','light','other','ramp','other','other'];
const text=value=>typeof value==='string' && Boolean(value.trim());
const stamp=value=>Number.isFinite(value) && Number.isFinite(new Date(value).getTime());
const samePoint=(a,b)=>a?.lat===b.lat && a?.lon===b.lon;

export function reportPoint(district,key) {
  const zone=districts[district];
  const offset={north:.004,center:0,south:-.004};
  if(!Object.hasOwn(districts,district) || !Object.hasOwn(offset,key))return null;
  return {key,lat:Number((zone.lat+offset[key]).toFixed(5)),lon:zone.lon};
}

export function demoReports(now=Date.now()){
  return [
    {id:'G-DEMO-01',author:'preview-volunteer',category:'trash',district:'abai',status:'accepted',
      description:['Демо: саябақтың кіреберісіне қоқыс жиналды.','Демо: у входа в парк скопился мусор.']},
    {id:'G-DEMO-02',author:'preview-volunteer',category:'light',district:'farabi',status:'working',
      description:['Демо: аллеядағы шам жанбайды.','Демо: на прогулочной аллее не работает фонарь.']},
    {id:'G-DEMO-03',author:'preview-volunteer',category:'ramp',district:'enbekshi',status:'resolved',
      description:['Демо: қоғамдық ғимараттағы пандус зақымдалған.','Демо: повреждён пандус у общественного здания.']}
  ].map((row,index)=>({...row,created:now-(index+1)*86400000,point:null}));
}

function legacyReports(issues,author) {
  if(!Array.isArray(issues))return [];
  return issues.filter(row=>row && row.owner>0 && !row.hidden && Number.isSafeInteger(row.id) && text(row.desc))
    .map(row=>({id:'G-OLD-'+row.id,author,category:legacyCategories[row.cat] || 'other',
      district:'',point:null,description:row.desc,status:legacyStatuses[row.status] || 'accepted',
      created:stamp(row.history?.[0]?.at)?row.history[0].at:null}));
}

function validReport(row,author) {
  if(!row || row.author!==author || typeof row.id!=='string' || !/^G-[A-Z0-9-]+$/.test(row.id) ||
    !Object.hasOwn(reportCategories,row.category) || !Object.hasOwn(reportStatuses,row.status))return false;
  const legacy=String(row.id).startsWith('G-OLD-');
  const demo=String(row.id).startsWith('G-DEMO-');
  const validText=text(row.description) || (demo && Array.isArray(row.description) && row.description.length===2 && row.description.every(text));
  const validPoint=row.point===null || Boolean(row.point && reportPoint(row.district,row.point.key) &&
    samePoint(row.point,reportPoint(row.district,row.point.key)));
  return validText && validPoint && ((legacy && row.district==='') || Object.hasOwn(districts,row.district)) &&
    (stamp(row.created) || (legacy && row.created===null));
}

export function readCityReports(author,now=Date.now()) {
  if(!author)return {rows:[],saved:[],profile:{},issue:''};
  const {value:profile,issue}=readLocalObject('city-'+author);
  const stored=Array.isArray(profile.reports)?profile.reports:[];
  const saved=stored.filter(row=>validReport(row,author)).map(({id,author,category,district,point,description,status,created})=>
    ({id,author,category,district,point,description,status,created}));
  const records=new Map(saved.map(row=>[row.id,row]));
  for(const row of [...legacyReports(profile.issues,author),...demoReports(now).filter(row=>row.author===author)]){
    if(!records.has(row.id))records.set(row.id,row);
  }
  return {rows:[...records.values()].sort((a,b)=>(b.created || 0)-(a.created || 0)),
    saved,profile,issue:issue || (profile.reports!==undefined && (!Array.isArray(profile.reports) || saved.length!==stored.length)?'damaged':'')};
}

export function validateReport(fields) {
  const errors={};
  if(!Object.hasOwn(reportCategories,fields.category))errors.category='categoryRequired';
  if(!Object.hasOwn(districts,fields.district))errors.district='districtRequired';
  const description=typeof fields.description==='string'?fields.description.trim():'';
  if([...description].length<10)errors.description='descriptionShort';
  if([...description].length>500)errors.description='descriptionLong';
  return errors;
}

export function validateReportPhoto(file) {
  if(!file || !file.type?.startsWith('image/') || file.size<=0)return 'photoType';
  if(file.size>photoLimit)return 'photoSize';
  return '';
}

export function changeCityReport(action,author,fields={},demo=false,now=Date.now()) {
  if(!author)return {code:'profileRequired'};
  const {rows,saved,profile,issue}=readCityReports(author,now);
  if(issue==='unavailable')return {code:issue};
  const store=(record,code)=>writeLocalObject('city-'+author,{...profile,reports:[record,...saved.filter(row=>row.id!==record.id)]})
    ? {code,record} : {code:'saveFailed'};
  if(action==='submit'){
    const errors=validateReport(fields);
    if(Object.keys(errors).length)return {code:'invalid',errors};
    const id=fields.id;
    if(typeof id!=='string' || !/^G-[A-Z0-9-]+$/.test(id))return {code:'changed'};
    const existing=rows.find(row=>row.id===id);
    if(existing)return {code:'sent',record:existing};
    return store({id,author,category:fields.category,district:fields.district,point:reportPoint(fields.district,fields.point),
      description:fields.description.trim(),status:'sent',created:now},'sent');
  }
  if(action==='advance' && demo){
    const record=rows.find(row=>row.id===fields.id);
    const next=record && statuses[statuses.indexOf(record.status)+1];
    if(next)return store({...record,status:next},'advanced');
  }
  return {code:'changed'};
}

export function filterReports(rows,status){
  return status?rows.filter(row=>row.status===status):rows;
}
