import {scheduleTimestamp,helpText,helpWindowLabel,readHelpWindow,renderHelpWindowFields} from './ui.js';
import {pageShell,demoNotice} from './ui.js';
import {readLocal,writeLocal} from './profiles.js';
import {dict} from './access-content.js';
export const base='/directions/accessibility';
const features=['ramp','lift','pavement','crossing','noStairs','slope','noHoles'];
const nodes=[[60,65],[220,65],[400,65],[60,195],[220,195],[400,195]];
const edges=[{a:0,b:1,d:140,s:'green',f:[0,2,3,4,5,6]},{a:1,b:2,d:150,s:'yellow',f:[0,1,2,3,4,6]},{a:0,b:3,d:100,s:'gray',f:[2,4,5]},{a:1,b:4,d:110,s:'green',f:[0,1,2,3,4,5,6]},{a:2,b:5,d:100,s:'red',f:[1,2,3]},{a:3,b:4,d:160,s:'green',f:[0,1,2,3,4,5,6]},{a:4,b:5,d:155,s:'yellow',f:[0,1,2,3,4,5,6]},{a:1,b:3,d:190,s:'red',f:[2,3]}];
const initial=()=>({start:0,end:5,mode:'shortest',filters:[],index:0,selectedPoint:0,requests:[],routes:[],open:new Set(),draft:{},photo:null,photoUrl:'',notice:'',routeNotice:''});
let state=initial();
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const index=(n)=>Number.isInteger(Number(n))?Number(n):0;
const E=(s)=>escapeHTML(s);
const date=(n,l)=>scheduleTimestamp(l,n);
function getPaths(){if(state.start===state.end)return [];let paths=[];const visit=(node,visited,chosen,length,penalty)=>{if(node===state.end){paths.push({edges:[...chosen],nodes:[...visited],length,score:length+penalty});return}edges.forEach((e,i)=>{let next=e.a===node?e.b:e.b===node?e.a:-1;if(next<0||visited.includes(next)||!state.filters.every(f=>e.f.includes(features.indexOf(f))))return;visit(next,[...visited,next],[...chosen,i],length+e.d,penalty+({green:0,yellow:200,gray:400,red:1500}[e.s]));})};visit(state.start,[state.start],[],0,0);paths.sort((a,b)=>(state.mode==='shortest'?a.length-b.length:a.score-b.score)||a.length-b.length);return paths;}
export function computeDemoPaths(start,end,filters=[],mode='shortest'){let old={start:state.start,end:state.end,filters:state.filters,mode:state.mode};Object.assign(state,{start,end,filters,mode});let result=getPaths();Object.assign(state,old);return result;}
const opt=(items,selected)=>items.map((x,i)=>`<option value="${i}" ${Number(selected)===i?'selected':''}>${E(x)}</option>`).join('');
const note=t=>demoNotice(t.demo);
const shell=(t,title,body)=>pageShell({base,back:t.back,kicker:'JANASHYR',title,body});
function home(t,lang){
  const kk=lang==='kk';
  const secondary=[['obstacle',t.obstacle],['delivery',t.delivery],['discount',t.discount],['places',t.places],['volunteer',t.volunteer]];
  return `<main class="inner wrap access-workspace"><a class="back" href="/" data-link>JANASHYR</a>
    <header class="access-hero"><div><h1>${t.title}</h1><p>${t.intro}</p><a class="button primary" href="${base}/map" data-link>${t.map}</a>
    <a class="button secondary" href="/account#accessibility" data-link>${t.account}</a></div></header>
    ${note(t)}
    <div class="access-home-layout"><section class="access-menu"><h2>${kk?'Қандай көмек керек?':'Какая помощь нужна?'}</h2>
    <div class="access-menu-list">${secondary.map(([slug,title])=>`<a href="${base}/${slug}" data-link><strong>${title}</strong><span aria-hidden="true">↗</span></a>`).join('')}</div></section>
    <section class="access-home-preview" aria-labelledby="access-preview-title">
      <h2 id="access-preview-title">${kk?'Маршрут үлгісі':'Пример маршрута'}</h2>
      <p>${kk?'Шартты сызбада бағыт пен қолжетімділік өлшемдерін салыстырыңыз.':'Сравните направление и критерии доступности на демонстрационной схеме.'}</p>
      ${mapGraphic(t,computeDemoPaths(0,5,[],'accessible')[0])}
      <a class="button secondary" href="${base}/map" data-link>${kk?'Маршрутты қарап көру':'Посмотреть варианты маршрута'}</a>
    </section></div>
  </main>`;
}

function mapGraphic(t,path,selectable=false){let routes=path?.edges||[];return `<div class="access-map" role="group" aria-label="${t.map}"><svg viewBox="0 0 460 260" role="img" aria-label="${t.routeInfo}">${edges.map((e,i)=>`<line x1="${nodes[e.a][0]}" y1="${nodes[e.a][1]}" x2="${nodes[e.b][0]}" y2="${nodes[e.b][1]}" class="road ${e.s}"></line>${routes.includes(i)?`<line x1="${nodes[e.a][0]}" y1="${nodes[e.a][1]}" x2="${nodes[e.b][0]}" y2="${nodes[e.b][1]}" class="selected-road"></line>`:''}`).join('')}${nodes.map((xy,i)=>`<circle cx="${xy[0]}" cy="${xy[1]}" r="${selectable&&state.selectedPoint===i?14:10}" class="map-node ${selectable&&state.selectedPoint===i?'chosen':''}"></circle><text x="${xy[0]}" y="${xy[1]+30}" text-anchor="middle">${E(t.stops[i])}</text>`).join('')}</svg>${selectable?nodes.map((xy,i)=>`<button type="button" class="map-point" style="left:${xy[0]/460*100}%;top:${xy[1]/260*100}%" data-action="access-point" data-id="${i}" aria-label="${t.location}: ${E(t.stops[i])}" aria-pressed="${state.selectedPoint===i}"></button>`).join(''):''}</div>`}
function mapPage(t,lang){
  const paths=getPaths(), path=paths[state.index]||paths[0];
  const reason=state.start===state.end?t.same:t.unavailable;
  const kk=lang==='kk';
  return shell(t,t.map,`${note(t)}
    <div class="access-route-layout">
      <section class="access-route-settings">
        <h2>${kk?'Маршрут баптаулары':'Настройки маршрута'}</h2>
        <div class="access-controls access-endpoints">
          <label>${t.start}<select id="access-start">${opt(t.stops,state.start)}</select></label>
          <label>${t.end}<select id="access-end">${opt(t.stops,state.end)}</select></label>
        </div>
        <details class="access-options">
          <summary>${kk?'Маршрут түрі мен сүзгілер':'Тип маршрута и фильтры'}${state.filters.length?` <span>(${state.filters.length})</span>`:''}</summary>
          <label>${t.mode}<select id="access-mode"><option value="shortest" ${state.mode==='shortest'?'selected':''}>${t.shortest}</option><option value="accessible" ${state.mode==='accessible'?'selected':''}>${t.accessible}</option></select></label>
        <fieldset class="access-filters"><legend>${t.filters}</legend>
          ${features.map(f=>`<label><input type="checkbox" data-access-filter="${f}" ${state.filters.includes(f)?'checked':''}> ${t[f]}</label>`).join('')}
        </fieldset>
        </details>
        <a class="button primary access-preview-jump" href="#access-route-preview">${kk?'Нәтижені қарау':'Посмотреть результат'}</a>
      </section>
      <section class="access-route-preview" id="access-route-preview" tabindex="-1">
        <h2>${kk?'Маршрут сызбасы':'Схема маршрута'}</h2><p>${t.routeInfo}</p>
        ${mapGraphic(t,path)}
        <div class="map-legend"><b>${t.legend}:</b> <span>${t.green}</span><span>${t.yellow}</span><span>${t.red}</span><span>${t.gray}</span><span>${t.blue}</span></div>
        ${path?`<div class="access-route-result">
          <div class="access-route-stats"><p><strong>${path.length} ${t.meters}</strong><span>${t.distance}</span></p><p><strong>~${Math.ceil(path.length/60)} ${t.minutes}</strong><span>${t.duration}</span></p><p><strong>${state.index+1} / ${paths.length}</strong><span>${t.routeCount}</span></p></div>
          <p>${t.points}: ${path.nodes.map(n=>E(t.stops[n])).join(' → ')}</p>
          <div class="hero-actions"><button class="button secondary" data-action="access-alternative" ${paths.length<2?'disabled':''}>${t.alternative}</button><button class="button primary" data-action="access-save">${t.save}</button></div>
          ${state.routeNotice?`<p class="success" role="status">${t.saved}</p>`:''}
        </div>`:`<p class="access-route-result" role="status">${reason}</p>`}
      </section>
    </div>`);
}
function formPage(t,type,lang){
  const kk=lang==='kk';
  const guest=kk?'Кабинетке сақтау үшін өтінімді жібермей тұрып кіріңіз. Қонақ өтінімі осы бетте ғана қолжетімді.':'Чтобы сохранить заявку в кабинете, войдите до отправки. Гостевая заявка доступна только в этой сессии.';
  const content=type==='obstacle'?`<p>${t.routeInfo}</p>${mapGraphic(t,null,true)}`
    :type==='delivery'?`<p>${t.deliveryInfo}</p>`
    :type==='discount'?`<p>${t.discountInfo}</p><h3>${t.offers}</h3><p>${t.offer}</p>`:'';
  return shell(t,t[type],`${note(t)}<div class="access-request-layout">
    <aside class="access-form-context"><h2>${kk?'Өтінім туралы':'Об обращении'}</h2>${content}<p>${t.privacy}</p>
      ${type==='volunteer'?`<a href="/directions/support/digital#digital-volunteers" data-link>${kk?'Волонтерлердің бос уақытын қарау':'Посмотреть доступное время волонтёров'}</a>`:''}</aside>
    <section class="access-request-panel"><h2>${kk?'Демо өтінімді толтыру':'Заполнить демо-заявку'}</h2>
      ${state.notice?`<div class="success" role="status">${state.notice==='invalidWindow'?helpText[lang].invalid:t[state.notice]} ${state.notice==='sent' && accessProfileId?`<a href="/account#accessibility" data-link>${t.account}</a>`:''}</div>`:''}
      ${accessProfileId?'':`<p class="demo-notice">${guest} <a href="/login" data-link>${kk?'Кіру':'Войти'}</a></p>`}
      <form id="access-form" data-type="${type}" class="access-form" novalidate>
        <div class="access-fields">${fields[type].map(name=>field(name,t,type,lang)).join('')}</div>
        ${type==='volunteer'?`<div class="help-window-fields access-help-window">${renderHelpWindowFields(lang,state.draft.accessHelpWindow,true)}</div>`:''}
        <button class="button primary" type="submit">${t.submit}</button>
      </form>
    </section></div>`);
}
const fields={delivery:['city','address','phone','medicine','date','time','comment'],discount:['city','comment'],volunteer:['type','comment'],obstacle:['location','category','description','photo']};
function field(name,t,type,lang){let val=state.draft[`${type}.${name}`]??'';if(name==='location')return `<label>${t.location}<select name="location" data-access-draft="${type}.location">${opt(t.stops,state.selectedPoint)}</select></label>`;if(name==='category'||name==='type')return `<label>${t[name]}<select name="${name}" data-access-draft="${type}.${name}">${opt(name==='category'?t.categories:t.volTypes,val||0)}</select></label>`;if(name==='photo')return `<div class="access-field-wide"><p class="access-file-label">${t.photo}</p><label class="access-file-picker"><input type="file" id="access-photo" accept="image/*" aria-label="${t.photo}"><span>${lang==='kk'?'Файл таңдау':'Выбрать файл'}</span></label>${state.photo?`<p>${E(state.photo.name)}</p><button type="button" class="text-button" data-action="access-remove-photo">${t.removePhoto}</button>`:''}</div>`;let required=type==='delivery'?['city','address','phone','medicine','date','time'].includes(name):type==='discount'?name==='city':name==='description';let inputType=name==='date'?'date':name==='time'?'time':'text';return `<label class="${name==='description'||name==='comment'?'access-field-wide':''}">${t[name]}${name==='description'||name==='comment'?`<textarea rows="3" name="${name}" data-access-draft="${type}.${name}" maxlength="300" ${required?'required':''}>${E(val)}</textarea>`:`<input type="${inputType}" name="${name}" data-access-draft="${type}.${name}" value="${E(val)}" maxlength="120" ${required?'required':''}>`}</label>`}
function places(t){return shell(t,t.places,`${note(t)}<p>${t.catalogInfo}</p><div class="course-grid">${t.placeTypes.map((p,i)=>`<article class="panel"><h2>${E(p)}</h2><p>${t.facilities}</p><ul><li>${t.ramp}: ${i%2?t.unknown:t.yes}</li><li>${t.lift}: ${i%2?t.yes:t.unknown}</li><li>${t.entrance}: ${t.yes}</li></ul></article>`).join('')}</div>`)}
function requestDetails(r,t,l){let info=Object.entries(r.data).map(([k,v])=>{let val=k==='location'?t.stops[index(v)]:k==='category'?t.categories[index(v)]:k==='type'?t.volTypes[index(v)]:v;return `<p><b>${t[k]||k}:</b> ${E(val)}</p>`}).join('');let hist=r.history.map(h=>`<li>${date(h.at,l)} — ${t[h.status]}${h.comment?`: ${E(h.comment)}`:''}</li>`).join('');return `<div class="request-details">${info}${r.availability?`<p>${E(helpWindowLabel(l,r.availability))}</p>`: ''}${r.photoUrl?`<img class="access-photo" src="${E(r.photoUrl)}" alt="${t.photoLabel}">`:''}<p><b>${t.views}</b></p><ul>${hist}</ul></div>`}
function records(t,l){
  return state.requests.length?state.requests.map(r=>`<article class="request-card"><strong>${t.types[r.type]} · #${r.id}</strong><p>${t.created}: ${date(r.created,l)} · ${t.status}: <b>${t[r.status]}</b></p>
    <button class="text-button" data-action="access-detail" data-id="${r.id}" aria-expanded="${state.open.has(r.id)}">${state.open.has(r.id)?t.hide:t.details}</button>
    ${state.open.has(r.id)?requestDetails(r,t,l):''}${r.status!=='cancelled'?`<button class="button secondary" data-action="access-cancel" data-id="${r.id}">${t.cancel}</button>`:''}</article>`).join(''):`<p>${t.empty}</p>`;
}
export function renderAccess(path,l){let t=dict[l];if(path===base || path===base+'/admin')return home(t,l);if(path===base+'/map')return mapPage(t,l);if(['obstacle','delivery','discount','volunteer'].some(x=>path===base+'/'+x))return formPage(t,path.split('/').pop(),l);if(path===base+'/places')return places(t);return null}
export function accessAccount(l){let t=dict[l];return `<section id="accessibility" class="account-list"><h2>${t.my}</h2><p>${t.local}</p><h3>${t.routes}</h3>${state.routes.length?state.routes.map(r=>`<article class="request-card"><strong>${t.routeStatus}</strong><p>${r.nodes.map(n=>E(t.stops[n])).join(' → ')}</p><p>${t.distance}: ${r.length} ${t.meters} · ${t.duration}: ~${Math.ceil(r.length/60)} ${t.minutes}</p><p>${t.mode}: ${t[r.mode]} · ${t.filters}: ${r.filters.length?r.filters.map(x=>t[x]).join(', '):t.all}</p><button class="text-button" data-action="access-delete-route" data-id="${r.id}">${t.removeRoute}</button></article>`).join(''):`<p>${t.empty}</p>`}<h3>${t.requests}</h3>${records(t,l)}</section>`}
export function accessAction(action,id,l,render){if(action==='access-point'){state.selectedPoint=index(id);state.draft['obstacle.location']=state.selectedPoint;render();return true}if(action==='access-alternative'){let p=getPaths();if(p.length>1)state.index=(state.index+1)%p.length;state.routeNotice='';render();return true}if(action==='access-save'){let p=getPaths()[state.index];if(p){state.routes.unshift({...p,mode:state.mode,filters:[...state.filters],id:`r${Date.now()}${state.routes.length}`});state.routeNotice='saved'}render();return true}if(action==='access-delete-route'){state.routes=state.routes.filter(r=>r.id!==id);render();return true}if(action==='access-remove-photo'){if(state.photoUrl)URL.revokeObjectURL(state.photoUrl);state.photo=null;state.photoUrl='';render();return true}if(action==='access-detail'){state.open.has(id)?state.open.delete(id):state.open.add(id);render();return true}if(action==='access-cancel'){let r=state.requests.find(x=>x.id===id);if(r&&r.status!=='cancelled'){r.status='cancelled';r.history.push({status:'cancelled',at:Date.now(),comment:''})}render();return true}return false}
export function accessInput(el,l,render){let id=el.id;if(id==='access-start'||id==='access-end'){state[id==='access-start'?'start':'end']=index(el.value);state.index=0;state.routeNotice='';render();return true}if(id==='access-mode'){state.mode=el.value;state.index=0;state.routeNotice='';render();return true}if(el.dataset?.accessFilter){let f=el.dataset.accessFilter;state.filters=el.checked?[...new Set([...state.filters,f])]:state.filters.filter(x=>x!==f);state.index=0;state.routeNotice='';render();return true}if(el.dataset?.accessDraft){state.draft[el.dataset.accessDraft]=el.value;if(el.name==='location'){state.selectedPoint=index(el.value);render()}return true}if(id==='access-photo'){let file=el.files?.[0];if(!file)return true;if(!file.type.startsWith('image/')||file.size>5*1024*1024){state.notice='photoError';render();return true}if(state.photoUrl)URL.revokeObjectURL(state.photoUrl);state.photo=file;state.photoUrl=URL.createObjectURL(file);state.notice='';render();return true}return false}
export function accessSubmit(form,l,render){if(form.id!=='access-form')return false;let type=form.dataset.type;if(!fields[type])return true;let data={};for(let name of fields[type]){if(name==='photo')continue;let val=state.draft[`${type}.${name}`];data[name]=name==='location'?String(state.selectedPoint):name==='category'||name==='type'?String(val||0):String(val||'').trim()}let required=type==='delivery'?['city','address','phone','medicine','date','time']:type==='obstacle'?['description']:type==='discount'?['city']:[];if(required.some(k=>!data[k])){state.notice='missing';render();return true}let availability=null;if(type==='volunteer'&&form.elements){const preference=new FormData(form);availability=readHelpWindow(preference,preference.get('format'));if(!availability){state.draft.accessHelpWindow={format:preference.get('format'),from:preference.get('from'),until:preference.get('until'),location:preference.get('location')};state.notice='invalidWindow';render();return true}delete state.draft.accessHelpWindow}let at=Date.now(),status='submitted';state.requests.unshift({id:`A${at.toString(36).toUpperCase()}${state.requests.length}`,type,data,availability,created:at,status,history:[{status,at,comment:''}],photoUrl:type==='obstacle'?state.photoUrl:''});if(type==='obstacle'){state.photo=null;state.photoUrl=''}for(let k of Object.keys(state.draft))if(k.startsWith(type+'.'))delete state.draft[k];state.notice='sent';render();return true}
export function clearAccessNotice(){state.notice='';state.routeNotice=''}
export function endAccessSession(){if(state.photoUrl)URL.revokeObjectURL(state.photoUrl);for(const r of state.requests)if(r.photoUrl)URL.revokeObjectURL(r.photoUrl);state=initial()}

let accessProfileId=null;
export function useAccessProfile(profile){
  endAccessSession();
  accessProfileId=profile?.id || null;
  if(accessProfileId)Object.assign(state,readLocal('access-'+accessProfileId,{}));
}
export function saveAccessProfile(){
  if(!accessProfileId)return;
  const requests=state.requests.map(({photoUrl,...row})=>{
    const {address,phone,description,comment,medicine,...data}=row.data;
    return {...row,data};
  });
  writeLocal('access-'+accessProfileId,{requests,routes:state.routes});
}

export function accessOverview(lang) {
  const t=dict[lang];
  return state.requests.filter(row=>row.status!=='cancelled').map(()=>({
    section:'accessibility',group:t.my,label:t.my
  }));
}

