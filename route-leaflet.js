import {obstacleCategories} from './route-storage.js';
import {routeCopy} from './route-copy.js';
import {scheduleTimestamp} from './ui.js';

const leafletCdn='https://unpkg.com/leaflet@1.9.4/dist/leaflet.';
const attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
let leafletPromise;
let view=null;
let hostNow=null;
let model=null;
let loading=false;
let loadFailed=false;

function loadLeaflet() {
  if(globalThis.L)return Promise.resolve(globalThis.L);
  if(leafletPromise)return leafletPromise;
  leafletPromise=new Promise((resolve,reject)=>{
    const css=document.createElement('link');
    css.rel='stylesheet';
    css.href=leafletCdn+'css';
    css.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    css.crossOrigin='anonymous';
    document.head.append(css);
    const js=document.createElement('script');
    js.src=leafletCdn+'js';
    js.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    js.crossOrigin='anonymous';
    js.onload=()=>globalThis.L?resolve(globalThis.L):reject(new Error('Leaflet'));
    js.onerror=()=>reject(new Error('Leaflet'));
    document.head.append(js);
  });
  return leafletPromise;
}

const latLng=([lon,lat])=>[lat,lon];
const categoryName=(category,lang)=>category.name[lang==='kk'?0:1];

function markerIcon(L,symbol,color){
  return L.divIcon({className:'route-map-icon',iconSize:[44,44],iconAnchor:[22,22],popupAnchor:[0,-14],
    html:'<span style="--pin-color:'+color+'">'+symbol+'</span>'});
}

function obstaclePopup(mark,lang,owner,remove) {
  const w=routeCopy[lang], node=document.createElement('div');
  const title=document.createElement('strong');
  title.textContent=categoryName(obstacleCategories[mark.category],lang);
  const text=document.createElement('p');
  text.textContent=mark.demo?w.demoMark:mark.description;
  const date=document.createElement('small');
  date.textContent=scheduleTimestamp(lang,mark.created);
  node.append(title,text,date);
  if(!mark.demo && owner && mark.owner===owner){
    const button=document.createElement('button');
    button.type='button';
    button.className='text-button';
    button.textContent=w.deleteMark;
    button.addEventListener('click',()=>remove(mark.id));
    node.append(button);
  }
  return node;
}

function syncLayers(){
  if(!view || !model)return;
  const {L,map,layers}=view;
  const {start,end,draftPoint,marks,route,walking,lang,owner,remove,highlight}=model;
  const signature=JSON.stringify([start,end,draftPoint,marks,lang,owner,highlight]);
  const routeChanged=view.route!==route;
  if(signature!==view.signature || routeChanged){
    view.signature=signature;
    view.route=route;
    layers.clearLayers();
    if(route) L.polyline(route.coordinates.map(latLng),{
      color:walking?'#94561c':'#643786',weight:6,opacity:.88,dashArray:walking?'9 7':null,className:'route-map-line'
    }).addTo(layers);
    const w=routeCopy[lang];
    for(const [point,symbol,color,title] of [[start,'A','#286154',w.from],[end,'B','#59386a',w.to],[draftPoint,'+','#974243',w.mark]]){
      if(point)L.marker(latLng(point),{icon:markerIcon(L,symbol,color),title,alt:title,
        interactive:false,keyboard:false,zIndexOffset:300}).addTo(layers);
    }
    for(const marker of marks){
      const category=obstacleCategories[marker.category];
      const name=categoryName(category,lang);
      const pin=L.marker(latLng(marker.coordinates),{icon:markerIcon(L,category.icon,category.color),title:name,alt:name})
        .bindPopup(obstaclePopup(marker,lang,owner,remove)).addTo(layers);
      pin.on('popupclose',()=>{
        const trigger=pin.getElement();
        if(trigger?.isConnected && document.activeElement===document.body)trigger.focus({preventScroll:true});
      });
      if(marker.id===highlight && view.highlight!==highlight){
        view.highlight=highlight;
        map.setView(latLng(marker.coordinates),16);
        pin.openPopup();
      }
    }
  }
  if(routeChanged && route)fitRoute();
  const pointSignature=JSON.stringify([start,end]);
  if(view.fittedPoints!==pointSignature && !route && start && end){
    view.fittedPoints=pointSignature;
    map.fitBounds([latLng(start),latLng(end)],fitOptions());
  }
}

function fitOptions(){
  const panel=document.querySelector('.route-panel');
  const mobile=globalThis.matchMedia?.('(max-width: 760px)').matches;
  const size=view.map.getSize();
  const bottom=mobile?Math.min(panel?.offsetHeight || 0,Math.max(0,size.y-110)):0;
  return {paddingTopLeft:[35,40],paddingBottomRight:[35,35+bottom],maxZoom:17,animate:false};
}

function fitRoute(){
  if(view?.route)view.map.fitBounds(view.route.coordinates.map(latLng),fitOptions());
}

export function fitRouteMap(){
  if(view?.route){fitRoute();return;}
  if(view && model?.start && model?.end)view.map.fitBounds([latLng(model.start),latLng(model.end)],fitOptions());
  else if(view && (model?.start || model?.end))view.map.setView(latLng(model.start || model.end),15);
}

function createMap(L){
  const element=document.createElement('div');
  element.className='route-leaflet';
  hostNow.replaceChildren(element);
  const map=L.map(element,{preferCanvas:false,scrollWheelZoom:false}).setView([42.32,69.60],13);
  const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution});
  tiles.on('tileerror',()=>model?.tileError());
  tiles.addTo(map);
  map.on('click',event=>model?.pick([event.latlng.lng,event.latlng.lat]));
  view={element,map,L,layers:L.layerGroup().addTo(map),signature:'',route:null,fittedPoints:''};
  syncLayers();
  model?.ready();
}

export function mountRouteMap(host,data){
  hostNow=host;
  model=data;
  if(view){
    if(view.element.parentElement!==host)host.replaceChildren(view.element);
    view.map.invalidateSize({pan:false});
    syncLayers();
    return;
  }
  if(loadFailed){data.mapError();return;}
  if(loading)return;
  loading=true;
  void loadLeaflet().then(L=>{
    if(hostNow?.isConnected)createMap(L);
  }).catch(()=>{
    loadFailed=true;
    model?.mapError();
  }).finally(()=>{loading=false;});
}

export function unmountRouteMap(){
  if(view)view.map.remove();
  view=null;
  hostNow=null;
  model=null;
}
