export const shymkentBounds=[69.35,42.17,69.87,42.53];
const endpoint='https://api.heigit.org/openrouteservice/v2/directions/';
const radius=15;
const outerRadius=radius/Math.cos(Math.PI/16);
const earth=6371008.8;
const radians=Math.PI/180;
const maxAvoidArea=200e6;
const maxAvoidExtent=20000;
const cachePrefix='janashyr.route.v1:';

export const validCoordinate=coordinate=>Array.isArray(coordinate) && coordinate.length>=2 &&
  Number.isFinite(coordinate[0]) && Math.abs(coordinate[0])<=180 &&
  Number.isFinite(coordinate[1]) && Math.abs(coordinate[1])<=90;
export const inShymkent=([lon,lat])=>lon>=shymkentBounds[0] && lon<=shymkentBounds[2] &&
  lat>=shymkentBounds[1] && lat<=shymkentBounds[3];
export const roundCoordinate=point=>point.slice(0,2).map(value=>Number(value.toFixed(6)));
export function parseCoordinate(value){
  const parts=typeof value==='string'?value.split(','):[];
  if(parts.length!==2 || parts.some(part=>!part.trim()))return null;
  const point=parts.map(Number);
  return validCoordinate(point)?roundCoordinate(point):null;
}

function projection(reference){
  const scale=earth*radians;
  const longitudeScale=scale*Math.max(.01,Math.cos(reference[1]*radians));
  return {
    project:([lon,lat])=>[(lon-reference[0])*longitudeScale,(lat-reference[1])*scale],
    reverse:([x,y])=>[reference[0]+x/longitudeScale,reference[1]+y/scale]
  };
}

function segmentDistance([x,y],a,b) {
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  const along=length?Math.min(1,Math.max(0,((x-a[0])*dx+(y-a[1])*dy)/length)):0;
  return Math.hypot(x-a[0]-along*dx,y-a[1]-along*dy);
}

export function makeAvoidPolygons(start,end,marks,geometry=[],limits={}) {
  const {project,reverse}=projection(start);
  const a=project(start),b=project(end),line=[a,b,...geometry.filter(validCoordinate).map(project)];
  const bounds=line.reduce((box,[x,y])=>[
    Math.min(box[0],x),Math.min(box[1],y),Math.max(box[2],x),Math.max(box[3],y)
  ],[...a,...a]);
  const margin=Math.min(4000,Math.max(1200,Math.hypot(...b)*.2));
  const maxCount=Math.floor((limits.area ?? maxAvoidArea)/(Math.PI*outerRadius*outerRadius));
  const extent=limits.extent ?? maxAvoidExtent;
  const chosen=[], ignoredAtEnds=[], rings=[];
  let width=[Infinity,Infinity,-Infinity,-Infinity], skipped=0;
  const sorted=marks.filter(mark=>validCoordinate(mark.coordinates)).map(mark=>{
    const point=project(mark.coordinates);
    return {mark,point,distance:segmentDistance(point,a,b)};
  }).sort((left,right)=>left.distance-right.distance || String(left.mark.id).localeCompare(String(right.mark.id)));

  for(const {mark,point} of sorted){
    const [x,y]=point;
    if(x<bounds[0]-margin || x>bounds[2]+margin || y<bounds[1]-margin || y>bounds[3]+margin)continue;
    if(Math.hypot(x-a[0],y-a[1])<=outerRadius || Math.hypot(x-b[0],y-b[1])<=outerRadius){
      ignoredAtEnds.push(mark.id);
      continue;
    }
    const next=[Math.min(width[0],x-outerRadius),Math.min(width[1],y-outerRadius),Math.max(width[2],x+outerRadius),Math.max(width[3],y+outerRadius)];
    // Overlapping rings would make the MultiPolygon invalid. Keep the nearer zone and report the omission.
    if(chosen.length>=maxCount || next[2]-next[0]>extent || next[3]-next[1]>extent ||
        chosen.some(entry=>Math.hypot(entry.point[0]-x,entry.point[1]-y)<=2*outerRadius)){
      skipped++;
      continue;
    }
    width=next;
    chosen.push({point,mark});
    const ring=Array.from({length:16},(_,index)=>{
      // Use a circumscribed polygon so every point within 15 m is covered.
      const angle=index*2*Math.PI/16;
      return reverse([x+outerRadius*Math.cos(angle),y+outerRadius*Math.sin(angle)]);
    });
    ring.push([...ring[0]]);
    rings.push([ring]);
  }
  return {polygon:rings.length?{type:'MultiPolygon',coordinates:rings}:null,
    marks:chosen.map(entry=>entry.mark),ignoredAtEnds,skipped};
}

export function routeHitsMarks(coordinates,marks) {
  if(coordinates.length<2 || !marks.length)return false;
  const {project}=projection(coordinates[0]);
  const line=coordinates.map(project);
  return marks.some(mark=>{
    const point=project(mark.coordinates);
    return line.some((end,index)=>index>0 && segmentDistance(point,line[index-1],end)<=radius);
  });
}

export function routingBody(start,end,lang,mode='strict',walking=false,polygon=null) {
  const options={};
  if(!walking)options.profile_params={restrictions:{
    surface_type:mode==='soft'?'compacted':'paved',smoothness_type:'good',
    maximum_sloped_kerb:.06,maximum_incline:mode==='soft'?8:6
  }};
  if(polygon)options.avoid_polygons=polygon;
  // ORS does not support Kazakh; Kazakh turns are composed from step types in the UI.
  const language=lang==='kk'?'ru':lang || 'ru';
  return {coordinates:[roundCoordinate(start),roundCoordinate(end)],language,
    instructions:true,elevation:true,...(Object.keys(options).length?{options}:{})};
}

export function routeHref({start,end,from='',to='',mode='strict',walking=false,auto=true}){
  const params=new URLSearchParams({start:roundCoordinate(start).join(','),end:roundCoordinate(end).join(',')});
  if(from)params.set('from',from);
  if(to)params.set('to',to);
  if(mode==='soft')params.set('mode','soft');
  if(walking)params.set('walking','1');
  if(auto)params.set('auto','1');
  return '/directions/accessibility/map?'+params.toString();
}

function routeResult(payload) {
  const feature=payload?.features?.[0];
  const coordinates=feature?.geometry?.coordinates;
  if(feature?.geometry?.type!=='LineString' || !Array.isArray(coordinates) ||
      coordinates.length<2 || !coordinates.every(validCoordinate))return null;
  const props=feature.properties || {};
  const numeric=value=>typeof value==='number' && Number.isFinite(value)?value:null;
  let calculatedUp=0,calculatedDown=0;
  const elevation=coordinates.every(point=>numeric(point[2])!==null);
  if(elevation)for(let index=1;index<coordinates.length;index++){
    const difference=coordinates[index][2]-coordinates[index-1][2];
    if(difference>0)calculatedUp+=difference;
    else calculatedDown-=difference;
  }
  const segments=Array.isArray(props.segments)?props.segments:[];
  return {coordinates,distance:numeric(props.summary?.distance),duration:numeric(props.summary?.duration),
    ascent:numeric(props.ascent) ?? numeric(props.summary?.ascent) ?? (elevation?calculatedUp:null),
    descent:numeric(props.descent) ?? numeric(props.summary?.descent) ?? (elevation?calculatedDown:null),
    steps:segments.flatMap(segment=>Array.isArray(segment?.steps)?segment.steps:[]).filter(step=>step && Number.isInteger(step.type))
      .map(({type,instruction,name,distance,exit_number})=>({type,instruction:typeof instruction==='string'?instruction:'',
        name:typeof name==='string' && name!=='-'?name:'',distance:numeric(distance),exit:numeric(exit_number)}))};
}

function session(){
  try{return globalThis.sessionStorage}catch{return null;}
}

export function createRouter({apiKey='',fetcher=(...args)=>fetch(...args),timeout=15000,storage=session}={}) {
  let controller=null,revision=0;
  function cancel(){revision++;controller?.abort();controller=null;}
  async function build({start,end,lang,mode,walking=false,marks=[],geometry=[]}){
    cancel();
    const current=revision;
    if(!apiKey.trim())return {code:'missingKey'};
    if(!validCoordinate(start) || !validCoordinate(end))return {code:'missingPoints'};
    if(roundCoordinate(start).join(',')===roundCoordinate(end).join(','))return {code:'samePoint'};
    const avoid=makeAvoidPolygons(start,end,marks,geometry);
    const body=JSON.stringify(routingBody(start,end,lang,mode,walking,avoid.polygon));
    const profile=walking?'foot-walking':'wheelchair';
    const key=cachePrefix+profile+':'+body;
    const result=payload=>{
      const route=routeResult(payload);
      return route?{code:'ok',route,walking,avoid,intersects:routeHitsMarks(route.coordinates,avoid.marks)}
        :{code:'notFound',walking,avoid};
    };
    try {
      const cached=storage()?.getItem(key);
      if(cached){const found=result(JSON.parse(cached));if(found.code==='ok')return found;}
    } catch {}

    const aborter=new AbortController();
    controller=aborter;
    let timer;
    try {
      const request=async()=>{
        const response=await fetcher(endpoint+profile+'/geojson',{
          method:'POST',headers:{Authorization:apiKey.trim(),'Content-Type':'application/json'},body,signal:aborter.signal
        });
        if(response.status===401 || response.status===403)return {code:'badKey'};
        if(response.status===429)return {code:'rateLimit'};
        let payload;
        try{payload=await response.json();}catch{payload=null;}
        const code=Number(payload?.error?.code);
        if(code===2009)return {code:'notFound',walking,avoid};
        if(response.status===404 || code===2010)return {code:'snap'};
        if(!response.ok)return {code:'service',walking,avoid};
        return {payload};
      };
      const deadline=new Promise(resolve=>{
        timer=setTimeout(()=>{resolve({code:'timeout'});aborter.abort();},timeout);
      });
      const operation=await Promise.race([request(),deadline]);
      if(current!==revision)return {code:'stale'};
      if(!operation.payload)return operation.code?operation:{code:'service'};
      const found=result(operation.payload);
      if(found.code==='ok')try{storage()?.setItem(key,JSON.stringify(operation.payload));}catch{}
      return found;
    } catch {
      return {code:current===revision?'network':'stale'};
    } finally {
      clearTimeout(timer);
      if(controller===aborter)controller=null;
    }
  }
  return {build,cancel};
}

export function nominatimUrl(service,query,lang){
  const url=new URL(service);
  url.searchParams.set('q',query);
  url.searchParams.set('format','jsonv2');
  url.searchParams.set('limit','5');
  url.searchParams.set('viewbox',shymkentBounds.join(','));
  url.searchParams.set('bounded','1');
  url.searchParams.set('countrycodes','kz');
  url.searchParams.set('accept-language',lang==='kk'?'kk,ru':'ru,kk');
  return url;
}

export function supportsAutocomplete(service,enabled){
  try{return Boolean(enabled && new URL(service).hostname!=='nominatim.openstreetmap.org');}catch{return false;}
}
