import {readLocalList,writeLocalList,readLocalObject,writeLocalObject} from './profiles.js';
import {validCoordinate,roundCoordinate} from './route-core.js';

const markKey='access-obstacles';
const maxDescription=300;
export const obstacleCategories={
  ramp:{name:['Пандус жоқ','Нет пандуса'],icon:'↗',color:'#7d4087'},
  kerb:{name:['Биік жиектас','Высокий бордюр'],icon:'▰',color:'#9b471c'},
  lift:{name:['Лифт істемейді','Сломанный лифт'],icon:'↕',color:'#584791'},
  steps:{name:['Баспалдақ','Ступени'],icon:'≡',color:'#a34048'},
  paving:{name:['Жабын нашар','Плохое покрытие'],icon:'◆',color:'#886111'},
  other:{name:['Басқа','Другое'],icon:'!',color:'#3a6074'}
};
const samples=[
  ['ramp',[69.59625,42.32033]],['kerb',[69.59915,42.32123]],
  ['steps',[69.60431,42.32411]],['paving',[69.58517,42.31525]],['lift',[69.61689,42.33358]]
].map(([category,coordinates],index)=>({id:'route-demo-'+index,category,coordinates,description:'',created:Date.UTC(2026,0,1),demo:true}));
const text=(value,max)=>typeof value==='string' && value.length<=max;
const id=value=>text(value,160) && Boolean(value);
const date=value=>Number.isFinite(value) && Number.isFinite(new Date(value).getTime());
const makeId=()=>globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);

function storedMarks(){
  return readLocalList(markKey,mark=>mark && id(mark.id) && id(mark.owner) &&
    validCoordinate(mark.coordinates) && Object.hasOwn(obstacleCategories,mark.category) &&
    date(mark.created) && text(mark.description,maxDescription));
}
export function routeMarkers(){
  const {rows,issue}=storedMarks();
  return {marks:[...samples,...rows],issue};
}

export function addRouteMarker(owner,coordinates,category,description,requestId=''){
  if(!id(owner))return {code:'profileRequired'};
  if(!validCoordinate(coordinates) || !Object.hasOwn(obstacleCategories,category) ||
    !text(description,maxDescription) || !description.trim())return {code:'markRequired'};
  const {rows,issue}=storedMarks();
  if(issue==='unavailable')return {code:issue};
  const marker={id:makeId(),owner,coordinates:roundCoordinate(coordinates),category,description:description.trim(),
    created:Date.now(),...(id(requestId)?{requestId}:{})};
  return writeLocalList(markKey,[marker,...rows])?{code:'markSaved',marker}:{code:'saveFailed'};
}

export function deleteRouteMarker(owner,markerId){
  const {rows,issue}=storedMarks();
  if(issue==='unavailable')return issue;
  if(!id(owner) || !rows.some(mark=>mark.id===markerId && mark.owner===owner))return 'markMissing';
  return writeLocalList(markKey,rows.filter(mark=>mark.id!==markerId))?'markDeleted':'saveFailed';
}

export function validOnlineRoute(row){
  return row?.kind==='online' && id(row.id) && validCoordinate(row.start) && validCoordinate(row.end) &&
    text(row.name,160) && text(row.from,160) && text(row.to,160) && ['strict','soft'].includes(row.mode) &&
    typeof row.walking==='boolean';
}

export function saveOnlineRoute(owner,route){
  if(!id(owner))return 'profileRequired';
  const stored={...route,id:'ors-'+makeId(),kind:'online'};
  if(!validOnlineRoute(stored))return 'missingPoints';
  const key='access-'+owner;
  const {value,issue}=readLocalObject(key);
  if(issue==='unavailable')return issue;
  return writeLocalObject(key,{...value,routes:[stored,...(Array.isArray(value.routes)?value.routes:[])]})?'routeSaved':'saveFailed';
}

export function getOnlineRoute(owner,routeId){
  if(!id(owner))return null;
  const {value}=readLocalObject('access-'+owner);
  return Array.isArray(value.routes)?value.routes.find(row=>validOnlineRoute(row) && row.id===routeId) || null:null;
}
