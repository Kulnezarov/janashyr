import {ORS_API_KEY,NOMINATIM_URL,NOMINATIM_AUTOCOMPLETE} from './api-keys.js';
import {escapeText as e,storageText} from './profiles.js';
import {sitePath} from './ui.js';
import {routeCopy,localizedStep} from './route-copy.js';
import {createRouter,parseCoordinate,roundCoordinate,nominatimUrl as buildSearchUrl,inShymkent,supportsAutocomplete} from './route-core.js';
import {routeMarkers,obstacleCategories,addRouteMarker,deleteRouteMarker,saveOnlineRoute,getOnlineRoute} from './route-storage.js';
import {mountRouteMap,unmountRouteMap,fitRouteMap} from './route-leaflet.js';

export const routePath='/directions/accessibility/map';
const obstaclePath='/directions/accessibility/obstacle';
const emptyPoint=()=>({coordinates:null,label:'',query:'',status:'',matches:[]});
const initial=()=>({start:emptyPoint(),end:emptyPoint(),mode:'strict',pick:'',report:false,draftPoint:null,
  category:'ramp',description:'',result:null,pending:false,notice:'',mapStatus:'loadingMap',routeName:'',previousGeometry:[]});
const router=createRouter({apiKey:ORS_API_KEY});
const searches=new Map(),cache=new Map();
const debounce=600, interval=1000;
let nextSearch=0, geoAttempt=0, state=initial(), active=false, automatic=false;
const hasKey=Boolean(ORS_API_KEY.trim());
const autoSearch=supportsAutocomplete(NOMINATIM_URL,NOMINATIM_AUTOCOMPLETE);

export const keyMissingText=lang=>routeCopy[lang].missingKey;
export function useLivePlanner(url){
  return hasKey || ['markers','marker','mark','start','end','saved'].some(key=>url.searchParams.has(key));
}

function cancelSearch(field){
  const search=searches.get(field);
  if(search){clearTimeout(search.timer);search.controller?.abort();searches.delete(field);}
}

function cancelRoute(clearGeometry=true){
  router.cancel();
  state.pending=false;
  state.result=null;
  state.routeName='';
  if(clearGeometry)state.previousGeometry=[];
}

function endpointLabel(point,fallback){
  return point.label || point.query || fallback;
}
const setEndpoint=(field,coordinates,label)=>{
  cancelSearch(field);
  cancelRoute();
  state[field]={...emptyPoint(),coordinates:roundCoordinate(coordinates),label,query:label};
  state.notice='';
  state.pick='';
};

export function routeNavigate(url,profile){
  const parsed=new URL(url || routePath,'http://localhost');
  const next=sitePath(parsed.pathname)===routePath && useLivePlanner(parsed);
  if(!next && !active)return;
  for(const field of ['start','end'])cancelSearch(field);
  router.cancel();
  geoAttempt++;
  if(active && !next)unmountRouteMap();
  active=next;
  automatic=false;
  state=initial();
  if(!active)return;
  const params=parsed.searchParams;
  const savedId=params.get('saved');
  const saved=savedId?getOnlineRoute(profile?.id,savedId):null;
  if(savedId && !saved){state.notice='savedMissing';return;}
  const first=saved?.start || parseCoordinate(params.get('start'));
  const last=saved?.end || parseCoordinate(params.get('end'));
  if(first)setEndpoint('start',first,(saved?.from || params.get('from') || '').slice(0,160));
  if(last)setEndpoint('end',last,(saved?.to || params.get('to') || '').slice(0,160));
  state.mode=saved?.mode || (params.get('mode')==='soft'?'soft':'strict');
  state.report=params.get('mark')==='report';
  state.highlight=params.get('marker') || '';
  if(state.report)state.pick='mark';
  state.routeName=saved?.name || '';
  automatic=Boolean(!state.report && hasKey && first && last && (saved || params.get('auto')==='1'));
  state.walkingAuto=saved?.walking || params.get('walking')==='1';
}

const button=(label,action,id='',className='button secondary',disabled=false)=>
  `<button type="button" class="${className}" data-action="${action}"${id?` data-id="${id}"`:''}${disabled?' disabled':''}>${label}</button>`;

function addressField(field,lang){
  const w=routeCopy[lang], point=state[field];
  const status=point.status?`<p role="status" class="route-address-status">${w[point.status]}</p>`:'';
  return `<div class="route-address">
    <form class="route-address-form" id="route-address-${field}" data-endpoint="${field}">
      <label for="route-input-${field}">${field==='start'?w.from:w.to}</label>
      <div><input type="search" id="route-input-${field}" data-route-endpoint="${field}" name="address"
        value="${e(point.query)}" maxlength="160" autocomplete="off" enterkeyhint="search">
        <button class="text-button" type="submit">${w.search}</button></div>
    </form>
    ${status}${point.matches.length?`<ul class="route-matches">${point.matches.map((option,index)=>
      `<li>${button(e(option.name),'route-address-pick',field+'-'+index,'text-button')}</li>`).join('')}</ul>`:''}
    <div class="route-buttons">${button(w.mapPick,'route-pick',field,'text-button')}
      ${field==='start'?button(w.geo,'route-geolocation','','text-button'):''}</div>
  </div>`;
}

function messages(lang){
  const w=routeCopy[lang], result=state.result;
  const notice=storageText[lang][state.notice] || w[state.notice];
  const error=result && result.code!=='ok' ? w[result.code==='notFound' && result.walking?'walkingMissing':result.code] : '';
  const pick=state.pick==='start'?w.pickFrom:state.pick==='end'?w.pickTo:state.pick==='mark'?state.report?w.pickReport:w.pickMark:'';
  const status=notice || pick;
  return `${!hasKey?`<p class="demo-notice" role="status">${w.missingKey}</p>`:''}
    ${status?`<p role="status" class="demo-notice">${status}</p>`:''}
    ${state.pending?`<p role="status">${w.pending}</p>`:''}
    ${error?`<p role="alert" class="route-error" data-route-error="${result.code}">${error}</p>`:''}
    ${result?.code==='notFound' && !result.walking?`<div class="route-buttons">
      ${state.mode==='strict'?button(w.trySoft,'route-try-soft'):''}${button(w.walking,'route-walk')}
      <small>${w.walkingWarning}</small></div>`:''}
    ${result?.avoid?.ignoredAtEnds.length?`<p role="status" class="demo-notice">${w.atEnds}</p>`:''}
    ${result?.avoid?.skipped?`<p role="status" class="demo-notice">${w.excluded}</p>`:''}`;
}

function distance(lang,value){
  const w=routeCopy[lang];
  if(value===null)return '—';
  if(value<1000)return Math.round(value)+' '+w.m;
  return new Intl.NumberFormat(lang==='kk'?'kk-KZ':'ru-RU',{maximumFractionDigits:1}).format(value/1000)+' '+w.km;
}

function resultCard(lang,detailsOpen){
  const w=routeCopy[lang], result=state.result;
  if(result?.code!=='ok')return '';
  const {route,avoid,intersects,walking}=result;
  const metrics=[[w.distance,distance(lang,route.distance)],[w.time,route.duration===null?'—':Math.ceil(route.duration/60)+' '+w.min],
    [w.up,route.ascent===null?'—':Math.round(route.ascent)+' '+w.m],[w.down,route.descent===null?'—':Math.round(route.descent)+' '+w.m]];
  return `<section class="route-summary" aria-labelledby="route-summary-title">
    <h2 id="route-summary-title" role="status">${w.usableRoute}</h2>
    ${walking?`<p class="demo-notice" role="alert">${w.walkingWarning}</p>`:''}
    ${intersects?`<p class="demo-notice" role="alert">${w.intersects}</p>`:''}
    <dl class="route-metrics">${metrics.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
    <p data-route-avoided="${avoid.marks.length}">${w.avoided} · ${avoid.marks.length}</p>
    <details id="route-directions"${detailsOpen?' open':''}><summary>${w.steps}</summary>
      ${route.steps.length?`<ol>${route.steps.map(step=>`<li>${e(localizedStep(step,lang))}${step.distance>0?' · '+distance(lang,step.distance):''}</li>`).join('')}</ol>`:`<p>${w.stepNone}</p>`}
    </details>
    <form id="route-save-form" class="route-save-form">
      <label>${w.routeName}<input id="route-name" name="name" maxlength="160" value="${e(state.routeName)}"></label>
      <button type="submit" class="button secondary">${w.save}</button>
    </form>
  </section>`;
}

function obstacleEditor(lang){
  const w=routeCopy[lang], point=state.draftPoint;
  if(state.report)return `<p>${w.pickReport}</p>
    ${point?`<p>${point[1]}, ${point[0]}</p>${button(w.reportPoint,'route-report-point','','button primary')}`:''}`;
  if(!point || state.pick!=='mark')return '';
  return `<form id="route-marker-form" class="route-marker-form" novalidate>
    <label>${w.category}<select name="category">${Object.entries(obstacleCategories).map(([id,item])=>
      `<option value="${id}"${state.category===id?' selected':''}>${item.name[lang==='kk'?0:1]}</option>`).join('')}</select></label>
    <label>${w.description}<textarea name="description" rows="2" maxlength="300" required>${e(state.description)}</textarea></label>
    <button class="button primary" type="submit">${w.markSave}</button>
  </form>`;
}

export function renderRoutePage(lang,detailsOpen=false){
  const w=routeCopy[lang];
  return `<main class="route-live">
    <div class="route-map-stage">
      <div id="route-map-host" aria-label="${w.map}"></div>
      ${state.mapStatus?`<p class="route-map-status" role="status">${w[state.mapStatus]}</p>`:''}
      <section class="route-panel" aria-labelledby="route-panel-title">
        <a class="text-link" href="/directions/accessibility" data-link>${w.back}</a>
        <h1 id="route-panel-title">${state.report?w.reportLink:w.title}</h1>
        ${messages(lang)}
        ${!state.report?`
          <div class="route-addresses">${addressField('start',lang)}${addressField('end',lang)}</div>
          <p class="route-search-note">${w.searchNote} <a class="text-link" href="https://operations.osmfoundation.org/policies/nominatim/" target="_blank" rel="noopener noreferrer">${w.policy}</a></p>
          <div class="route-buttons">${button(w.swap,'route-swap')}&nbsp;${button(w.mark,'route-mark')}
            ${button(w.build,'route-build','','button primary',!hasKey)}
          </div>
          <fieldset class="route-mode"><legend>${w.mode}</legend>
            ${['strict','soft'].map(mode=>`<label><input type="radio" name="route-mode" value="${mode}"${state.mode===mode?' checked':''}> ${w[mode]}</label>`).join('')}
            <p>${state.mode==='soft'?w.softHint:w.strictHint}</p>
          </fieldset>`:''}
        ${obstacleEditor(lang)}${resultCard(lang,detailsOpen)}
        <p class="route-disclaimer">${w.disclaimer}</p>
        ${!hasKey?`<a class="text-link" href="${routePath}" data-link>${w.demo}</a>`:''}
      </section>
    </div>
  </main>`;
}

async function compute(lang,render,walking=false){
  const current=state;
  const {start,end,mode,previousGeometry}=current;
  current.notice='';
  current.pending=true;
  current.result=null;
  render();
  const result=await router.build({start:start.coordinates,end:end.coordinates,lang,mode,walking,
    marks:routeMarkers().marks,geometry:previousGeometry});
  if(current!==state || result.code==='stale')return;
  current.result=result;
  current.pending=false;
  if(result.code==='ok'){
    current.previousGeometry=result.route.coordinates;
    current.routeName ||= endpointLabel(start,routeCopy[lang].from)+' → '+endpointLabel(end,routeCopy[lang].to);
    current.routeName=current.routeName.slice(0,160);
  }
  render();
}

function queueSearch(field,lang,render){
  cancelSearch(field);
  const input=state[field];
  const query=input.query.trim();
  input.matches=[];
  if(query.length<3){input.status='addressShort';render();return;}
  const stateAtStart=state;
  let url;
  try{url=buildSearchUrl(NOMINATIM_URL,query,lang).href;}catch{input.status='addressError';render();return;}
  if(cache.has(url)){
    input.matches=cache.get(url);
    input.status=input.matches.length?'':'addressEmpty';
    render();
    return;
  }
  const operation={};
  searches.set(field,operation);
  const current=()=>searches.get(field)===operation && stateAtStart===state;
  input.status='buildAddress';
  const start=async()=>{
    if(!current())return;
    const wait=nextSearch-Date.now();
    if(wait>0){operation.timer=setTimeout(start,wait);return;}
    nextSearch=Date.now()+interval;
    const controller=new AbortController();
    operation.controller=controller;
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(url,{signal:controller.signal,referrerPolicy:'strict-origin-when-cross-origin'});
      if(!current())return;
      if(!response.ok){input.status=response.status===429?'addressLimit':'addressError';return;}
      const raw=await response.json();
      if(!current())return;
      if(!Array.isArray(raw)){input.status='addressError';return;}
      const items=raw.flatMap(row=>{
        const coordinates=parseCoordinate(String(row?.lon)+','+String(row?.lat));
        return coordinates && inShymkent(coordinates) && typeof row.display_name==='string'
          ? [{coordinates,name:row.display_name.slice(0,160)}]:[];
      }).slice(0,5);
      if(cache.size>=100)cache.delete(cache.keys().next().value);
      cache.set(url,items);
      input.matches=items;
      input.status=items.length?'':'addressEmpty';
    }catch{if(current())input.status='addressError';}
    finally{clearTimeout(timer);if(current()){searches.delete(field);render();}}
  };
  operation.timer=setTimeout(start,debounce);
  render();
}

function locate(lang,render){
  const view=state, attempt=++geoAttempt;
  const geolocation=globalThis.navigator?.geolocation;
  if(!geolocation){state.notice='geoFailed';render();return;}
  state.notice='locating';
  render();
  geolocation.getCurrentPosition(({coords})=>{
    if(view!==state || attempt!==geoAttempt)return;
    const point=[coords.longitude,coords.latitude];
    if(validCoordinateForMap(point)){
      setEndpoint('start',point,routeCopy[lang].current);
      render();
      fitRouteMap();
    }else{state.notice='geoOutside';render();}
  },error=>{
    if(view!==state || attempt!==geoAttempt)return;
    state.notice=error.code===1?'geoDenied':'geoFailed';
    render();
  },{timeout:10000,maximumAge:30000});
}

function validCoordinateForMap(point){
  return Number.isFinite(point[0]) && Number.isFinite(point[1]) && inShymkent(point);
}

export function mountPlanner(host,lang,profile,render){
  if(!host)return;
  const {marks,issue}=routeMarkers();
  if(issue && !state.notice){state.notice=issue;queueMicrotask(render);}
  mountRouteMap(host,{
    start:state.start.coordinates,end:state.end.coordinates,draftPoint:state.draftPoint,marks,
    route:state.result?.route,walking:state.result?.walking,lang,owner:profile?.id,highlight:state.highlight,
    remove:id=>{state.notice=deleteRouteMarker(profile?.id,id);render();},
    mapError:()=>{if(state.mapStatus!=='mapFailed'){state.mapStatus='mapFailed';queueMicrotask(render);}},
    ready:()=>{if(state.mapStatus==='loadingMap'){state.mapStatus='';host.parentElement.querySelector('.route-map-status')?.remove();}},
    tileError:()=>{if(state.mapStatus!=='tileFailed'){state.mapStatus='tileFailed';queueMicrotask(render);}},
    pick:point=>{
      if(!state.pick)return;
      if(!validCoordinateForMap(point)){state.notice='outsidePoint';render();return;}
      if(state.pick==='mark'){state.draftPoint=roundCoordinate(point);state.notice='';}
      else {geoAttempt++;setEndpoint(state.pick,point,routeCopy[lang].mapPoint+' '+roundCoordinate(point).slice().reverse().join(', '));}
      render();
    }
  });
  if(state.mapStatus==='loadingMap' && host.querySelector('.leaflet-container')){
    state.mapStatus='';
    host.parentElement.querySelector('.route-map-status')?.remove();
  }
  if(automatic){
    automatic=false;
    const current=state;
    queueMicrotask(()=>{if(state===current && active)void compute(lang,render,current.walkingAuto);});
  }
}

export function plannerClick(action,id,lang,render,navigate){
  switch(action){
    case 'route-pick': state.pick=id;state.notice='';geoAttempt++;break;
    case 'route-geolocation': locate(lang,render);return true;
    case 'route-mark': state.pick=state.pick==='mark'?'':'mark';state.draftPoint=null;state.notice='';break;
    case 'route-swap':
      for(const field of ['start','end'])cancelSearch(field);
      geoAttempt++;
      [state.start,state.end]=[state.end,state.start];
      for(const point of [state.start,state.end]){point.matches=[];point.status='';}
      cancelRoute();
      state.notice='';
      break;
    case 'route-address-pick':{
      const [field,index]=id.split('-');
      const match=state[field]?.matches[Number(index)];
      if(match){geoAttempt++;setEndpoint(field,match.coordinates,match.name);render();fitRouteMap();}
      return true;
    }
    case 'route-try-soft': state.mode='soft';void compute(lang,render);return true;
    case 'route-walk': void compute(lang,render,true);return true;
    case 'route-build': void compute(lang,render);return true;
    case 'route-report-point':
      if(state.report && state.draftPoint)navigate(obstaclePath+'?point='+encodeURIComponent(state.draftPoint.join(',')));
      return true;
    default:return false;
  }
  render();
  return true;
}

export function plannerInput(element,lang,render){
  if(element.name==='route-mode'){
    if(element.value!==state.mode){state.mode=element.value;cancelRoute(false);render();}
    return true;
  }
  if(element.dataset?.routeEndpoint){
    const field=element.dataset.routeEndpoint;
    if(state[field].query===element.value)return true;
    const caret=element.selectionStart;
    const hadFeedback=state[field].coordinates || state[field].status || state[field].matches.length ||
      state.notice || state.result || state.pending;
    state[field]={...emptyPoint(),query:element.value};
    state.notice='';
    cancelSearch(field);
    cancelRoute();
    geoAttempt++;
    if(autoSearch && element.value.trim().length>=3)queueSearch(field,lang,render);
    else if(hadFeedback)render();
    if(caret!==null)globalThis.document?.getElementById?.('route-input-'+field)?.setSelectionRange?.(caret,caret);
    return true;
  }
  if(element.form?.id==='route-marker-form'){
    if(element.name==='category' || element.name==='description')state[element.name]=element.value;
    return true;
  }
  if(element.id==='route-name'){state.routeName=element.value;return true;}
  return false;
}

export function plannerSubmit(form,lang,render,requireProfile){
  if(form.id.startsWith('route-address-')){
    const field=form.dataset.endpoint;
    if(field!=='start' && field!=='end')return false;
    state[field].query=String(new FormData(form).get('address') || '');
    queueSearch(field,lang,render);
    return true;
  }
  if(form.id==='route-marker-form'){
    const formData=new FormData(form), point=state.draftPoint;
    const category=String(formData.get('category') || ''),description=String(formData.get('description') || '').trim();
    if(!point || !Object.hasOwn(obstacleCategories,category) || !description || description.length>300){
      state.notice='markRequired';render();return true;
    }
    requireProfile(profile=>{
      state.notice=addRouteMarker(profile?.id,point,category,description).code;
      if(state.notice==='markSaved'){state.pick='';state.draftPoint=null;state.description='';}
      render();
    });
    return true;
  }
  if(form.id==='route-save-form' && state.result?.code==='ok'){
    const w=routeCopy[lang];
    const route={start:state.start.coordinates,end:state.end.coordinates,from:endpointLabel(state.start,w.from),
      to:endpointLabel(state.end,w.to),mode:state.mode,walking:state.result.walking,
      name:String(new FormData(form).get('name') || '').trim().slice(0,160) || state.routeName};
    requireProfile(profile=>{state.notice=saveOnlineRoute(profile?.id,route);render();});
    return true;
  }
  return false;
}
