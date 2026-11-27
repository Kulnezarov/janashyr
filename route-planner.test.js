import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRouter,makeAvoidPolygons,routeHitsMarks,routingBody,nominatimUrl,supportsAutocomplete,routeHref} from './route-core.js';
import {renderAccess,accessNavigate,accessInput,accessSubmit,accessAccount,useAccessProfile,endAccessSession} from './access.js';
import {routeMarkers,deleteRouteMarker,saveOnlineRoute,getOnlineRoute} from './route-storage.js';
import {localizedStep} from './route-copy.js';

const start=[69.58,42.32],end=[69.62,42.32],base='/directions/accessibility';
const fixture={features:[{geometry:{type:'LineString',coordinates:[[...start,100],[69.60,42.321,112],[...end,107]]},
  properties:{summary:{distance:3200,duration:1200},segments:[{steps:[{type:0,instruction:'Поверните налево',name:'Абай',distance:100}]}]}}]};
const response=(status,payload)=>({status,ok:status<400,json:async()=>payload});
const input={start,end,lang:'ru',mode:'strict'};
const routerFor=fetcher=>createRouter({apiKey:'fixture',fetcher,storage:()=>null});

test('ORS uses POST, longitude-latitude, wheelchair restrictions, local instructions and a session cache',async()=>{
  const cache=new Map(),calls=[];
  const router=createRouter({apiKey:'fixture',storage:()=>({getItem:key=>cache.get(key),setItem:(key,value)=>cache.set(key,value)}),
    fetcher:async(url,request)=>{calls.push({url,request});return response(200,fixture);}});
  const result=await router.build(input);
  assert.equal(result.code,'ok');
  assert.equal(result.route.distance,3200);
  assert.equal(result.route.duration,1200);
  assert.equal(result.route.ascent,12);
  assert.equal(result.route.descent,5);
  assert.equal(calls[0].url,'https://api.heigit.org/openrouteservice/v2/directions/wheelchair/geojson');
  assert.equal(calls[0].request.method,'POST');
  assert.equal(calls[0].request.headers.Authorization,'fixture');
  assert.equal(calls[0].request.headers['Content-Type'],'application/json');
  const body=JSON.parse(calls[0].request.body);
  assert.deepEqual(body.coordinates,[[69.58,42.32],[69.62,42.32]]);
  assert.deepEqual(body.options.profile_params.restrictions,{surface_type:'paved',smoothness_type:'good',maximum_sloped_kerb:.06,maximum_incline:6});
  assert.equal(body.instructions,true);
  assert.equal(body.elevation,true);
  assert.match(localizedStep(result.route.steps[0],'kk'),/Солға бұрылыңыз.*Абай/);
  assert.equal((await router.build(input)).code,'ok');
  assert.equal(calls.length,1);
  assert.deepEqual(routingBody(start,end,'kk','soft').options.profile_params.restrictions,
    {surface_type:'compacted',smoothness_type:'good',maximum_sloped_kerb:.06,maximum_incline:8});
  assert.equal(routingBody(start,end,'kk','soft').language,'ru');
});

test('walking uses a distinct endpoint without wheelchair restrictions',async()=>{
  const router=routerFor(async(url,request)=>{
    assert.match(url,/\/foot-walking\/geojson$/);
    const body=JSON.parse(request.body);
    assert.ok(!body.options?.profile_params);
    return response(200,fixture);
  });
  assert.equal((await router.build({...input,walking:true})).walking,true);
});

test('ORS returns distinct errors for empty routes, key rejection, limits and inaccessible waypoints',async()=>{
  const cases=[
    [200,{features:[]},'notFound'],[401,{},'badKey'],[403,{},'badKey'],[429,{},'rateLimit'],
    [404,{},'snap'],[400,{error:{code:2010}},'snap'],[404,{error:{code:2009}},'notFound']
  ];
  for(const [status,payload,code] of cases)assert.equal((await routerFor(async()=>response(status,payload)).build(input)).code,code);
  assert.equal((await routerFor(async()=>{throw new TypeError('offline')}).build(input)).code,'network');
});

test('timeout aborts the fetch even if the fetcher never settles',async()=>{
  let signal;
  const router=createRouter({apiKey:'fixture',storage:()=>null,timeout:8,fetcher:(_url,init)=>{
    signal=init.signal;
    return new Promise(()=>{});
  }});
  assert.equal((await router.build(input)).code,'timeout');
  assert.equal(signal.aborted,true);
});

test('a response arriving after a newer request is ignored even when fetch ignores abort',async()=>{
  const pending=[];
  const router=routerFor((_url,request)=>new Promise(resolve=>pending.push({resolve,request})));
  const previous=router.build(input);
  const current=router.build({...input,mode:'soft'});
  assert.equal(pending[0].request.signal.aborted,true);
  pending[1].resolve(response(200,fixture));
  assert.equal((await current).code,'ok');
  pending[0].resolve(response(200,fixture));
  assert.equal((await previous).code,'stale');
});

test('no key makes no request and preserves the bilingual training scheme',async()=>{
  const router=createRouter({apiKey:'  ',fetcher:()=>{assert.fail('must stay offline');}});
  assert.equal((await router.build(input)).code,'missingKey');
  assert.match(renderAccess(base+'/map','ru'),/Сравните маршруты на учебной схеме/);
  assert.match(renderAccess(base+'/map','kk'),/Шартты сызбада бағыттарды салыстырып/);
  assert.match(renderAccess(base+'/map','ru'),/data-action="access-save"/);
});

test('avoid geometry prioritizes the line, skips endpoints and closes 15-metre rings',()=>{
  const marks=[{id:'start-zone',coordinates:[69.58002,42.32]},{id:'far',coordinates:[69.61,42.325]},
    {id:'near',coordinates:[69.60,42.32]},{id:'outside',coordinates:[69.60,43]},
    {id:'finish-zone',coordinates:[69.61999,42.32]}];
  const avoid=makeAvoidPolygons(start,end,marks,[],{area:1000});
  assert.equal(avoid.polygon.type,'MultiPolygon');
  assert.deepEqual(avoid.marks.map(mark=>mark.id),['near']);
  assert.deepEqual(new Set(avoid.ignoredAtEnds),new Set(['start-zone','finish-zone']));
  assert.equal(avoid.skipped,1);
  const ring=avoid.polygon.coordinates[0][0];
  assert.deepEqual(ring[0],ring.at(-1));
  assert.ok(Math.abs(ring[0][0]-69.60)<.001);
  assert.equal(routeHitsMarks([start,end],avoid.marks),true);
  assert.equal(routeHitsMarks(fixture.features[0].geometry.coordinates,avoid.marks),false);
});

test('address search is bounded to Shymkent and never autocompletes against the public API',()=>{
  const service='https://nominatim.openstreetmap.org/search';
  const params=nominatimUrl(service,'Абая','kk').searchParams;
  assert.equal(params.get('q'),'Абая');
  assert.equal(params.get('bounded'),'1');
  assert.equal(params.get('countrycodes'),'kz');
  assert.equal(params.get('viewbox'),'69.35,42.17,69.87,42.53');
  assert.equal(params.get('accept-language'),'kk,ru');
  assert.equal(supportsAutocomplete(service,true),false);
  assert.equal(supportsAutocomplete('https://maps.example.org/nominatim',true),true);
  const parsed=new URL(routeHref({start,end,from:'Начало',to:'Парк'}),'https://example.org');
  assert.equal(parsed.pathname,base+'/map');
  assert.equal(parsed.searchParams.get('start'),'69.58,42.32');
  assert.equal(parsed.searchParams.get('end'),'69.62,42.32');
});

test('a linked obstacle preserves its map marker and saved routes are private to the profile',context=>{
  const data=new Map();
  const prior=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:key=>data.get(key) ?? null,setItem:(key,value)=>data.set(key,value)
  }});
  context.after(()=>{
    useAccessProfile(null);
    endAccessSession();
    if(prior)Object.defineProperty(globalThis,'localStorage',prior);
    else delete globalThis.localStorage;
  });
  useAccessProfile({id:'owner'});
  accessNavigate(base+'/obstacle?point=69.60,42.32');
  accessInput({dataset:{accessDraft:'obstacle.description'},value:'Демо: нет пандуса'},'ru',()=>{});
  accessInput({dataset:{accessDraft:'obstacle.category'},value:'ramp'},'ru',()=>{});
  accessSubmit({id:'access-form',dataset:{type:'obstacle'}},'ru',()=>{});
  const stored=JSON.parse(data.get('janashyr.demo.v2.access-owner'));
  const request=stored.requests[0];
  const marker=routeMarkers().marks.find(row=>row.id===request.data.markerId);
  assert.deepEqual(marker.coordinates,[69.60,42.32]);
  assert.equal(marker.requestId,request.id);
  assert.equal(deleteRouteMarker('other',marker.id),'markMissing');
  assert.equal(saveOnlineRoute('owner',{start,end,from:'Откуда',to:'Куда',mode:'strict',walking:false,name:'Мой путь'}),'routeSaved');
  const saved=JSON.parse(data.get('janashyr.demo.v2.access-owner')).routes[0];
  assert.equal(getOnlineRoute('owner',saved.id).name,'Мой путь');
  assert.equal(getOnlineRoute('other',saved.id),null);
  assert.match(accessAccount('ru'),/Мой путь/);
});
