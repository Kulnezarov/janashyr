import {sitePath} from './ui.js';
import {escapeText} from './profiles.js';
import {psychAvailability} from './support.js';
import {donorAvailability} from './donor.js';
import {routeHref} from './route-core.js';
import {routeCopy} from './route-copy.js';
import {ORS_API_KEY} from './api-keys.js';

const lifetime=4*60*60*1000;
const key='janashyr.chat.current';
const hasRouting=Boolean(ORS_API_KEY.trim());
const parks=[
  {lat:42.32541,lon:69.58573,label:['Абай саябағы','Парк Абая']},
  {lat:42.31653,lon:69.60022,label:['Орталық саябақ','Центральный парк']},
  {lat:42.36861,lon:69.62309,label:['Дендросаябақ','Дендропарк']},
  {lat:42.30970,lon:69.63020,label:['Жеңіс саябағы','Парк Победы']}
];
const copy={
  kk:{title:'JANASHYR көмекшісі',open:'Чатты ашу',close:'Жабу',hello:'Сәлем! Сізге қандай көмек керек?',prompts:['Қан тапсырғым келеді','Жақын саябаққа маршрут','Сөйлескім келеді','Психологқа жазылу'],message:'Сұрағыңызды жазыңыз',send:'Жіберу',notice:'Жауаптар үлгі бойынша беріледі',expiry:'Чат осы қойындыда 4 сағат сақталады',clear:'Диалогты тазарту',messageHint:'Сұрағыңыз',demo:'Демо көмекші',donor:'Донорлық бөлімінде Шымкенттегі оқу орталықтарын салыстырып, жазылуды байқап көре аласыз.',psych:'Психологиялық көмек бөлімінде мамандарды салыстырып, демо кеңес уақытын таңдауға болады.',support:'Сізге қазір қиын болса, психологиялық көмек бөліміндегі сұрақтар әңгімені қай тақырыптан бастауға болатынын таңдауға көмектеседі.',danger:'Егер өзіңізге не басқа адамға қазір қауіп төніп тұрса, жергілікті жедел қызметке хабарласыңыз және сенімді адамға айтыңыз.',route:'Шымкенттегі тізімнен ең жақын саябақты таңдау үшін геолокация қажет. Бағытты «Қолжетімді орта» бөлімінен ашыңыз. Есептеу кезінде нүктелер OpenRouteService қызметіне жіберіледі. Нақты қолжетімділік карта деректеріне байланысты.',locate:'Орналасқан жерімді анықтау',example:'Қала орталығынан мысал көрсету',exampleStatus:'Бұл — Шымкент орталығынан мысал. Орналасқан жеріңіз пайдаланылмайды.',locationFail:'Орналасқан жер анықталмады. Саябақты картадан өзіңіз таңдай аласыз.',outside:'Орналасқан жер Шымкенттен тыс. Алдымен қала картасын ашыңыз.',map:'Үлкен картаны ашу',waiting:'Орналасқан жер анықталуда…'},
  ru:{title:'Помощник JANASHYR',open:'Открыть чат',close:'Закрыть',hello:'Привет! Чем могу помочь?',prompts:['Хочу сдать кровь','Маршрут до ближайшего парка','Хочу поговорить','Записаться к психологу'],message:'Напишите свой вопрос',send:'Отправить',notice:'Ответы по сценариям',expiry:'Чат хранится в этой вкладке до 4 часов',clear:'Очистить диалог',messageHint:'Напишите вопрос',demo:'Демо-помощник',donor:'В разделе донорства можно сравнить учебные центры Шымкента и попробовать запись.',psych:'В разделе психологической помощи можно сравнить профили и выбрать время демо-консультации.',support:'Если вам сейчас непросто, в разделе психологической помощи есть вопросы, которые помогают выбрать, с какой темы начать.',danger:'Если вам или другому человеку сейчас угрожает опасность, обратитесь в местную экстренную службу и сообщите человеку, которому доверяете.',route:'Для выбора ближайшего парка из подборки Шымкента нужна геолокация. Откройте маршрут в разделе «Доступная среда». При расчёте точки передаются в OpenRouteService. Доступность на месте зависит от данных карты.',locate:'Разрешить геолокацию',example:'Показать пример от центра',exampleStatus:'Это пример от центра Шымкента. Он не использует ваше местоположение.',locationFail:'Геолокация недоступна. Парк можно выбрать на карте вручную.',outside:'Вы находитесь за пределами Шымкента. Откройте карту города, чтобы посмотреть парки.',map:'Открыть большую карту',waiting:'Определяем местоположение…'}
};
const shortPrompts={
  kk:['Қан тапсыру','Саябақ','Сөйлесу','Психолог'],
  ru:['Сдать кровь','До парка','Поговорить','К психологу']
};
const nextSteps={
  kk:{
    welcome:'Тақырыпты таңдаңыз немесе сұрағыңызды жазыңыз.',
    unknown:'Сұрағыңызды түсіне алмадым.',
    retry:'Мына тақырыптардың бірін таңдап көріңіз.',
    centers:'Қан тапсыру орталықтарын қарау', specialist:'Демо маман таңдау',
    schedule:'Демо кестені қарау', sample:'Маршруттың оқу сызбасын ашу',
    support:'Қолдауды неден бастауға болады'
  },
  ru:{
    welcome:'Выберите тему или напишите свой вопрос.',
    unknown:'Я не смог распознать вопрос.',
    retry:'Попробуйте выбрать одну из этих тем.',
    centers:'Посмотреть донорские центры', specialist:'Выбрать демо-специалиста',
    schedule:'Посмотреть демо-расписание', sample:'Открыть учебный маршрут',
    support:'Узнать, с чего начать'
  }
};
let opened=false, timer=null, route=null, locationState='', draft='';
let memory=null, locationRequest=0;

function readChat(){
  try { const raw=globalThis.sessionStorage?.getItem(key); if(raw)memory=JSON.parse(raw); } catch {}
  if(memory && memory.expires<=Date.now())saveChat(null);
  return memory;
}
function saveChat(data){
  memory=data;
  try{
    if(data)globalThis.sessionStorage?.setItem(key,JSON.stringify(data));
    else globalThis.sessionStorage?.removeItem(key);
  }catch{}
}
function schedule(render){
  clearTimeout(timer);
  const chat=readChat();
  if(!chat)return;
  timer=setTimeout(()=>{
    saveChat(null);route=null;locationState='';
    if(document.querySelector('.home-chat-panel'))render();
  },Math.max(0,chat.expires-Date.now()));
}
export function resetHomeChat(){
  opened=false;draft='';route=null;locationState='';locationRequest++;clearTimeout(timer);saveChat(null);
}
export function closeHomeChat(){opened=false;}
const classify=input=>{
  if(/не хочу жить|убить себя|суицид|покончить с собой|навредить себе|хочу умереть|өзіме зиян|өлгім кел|өзімді өлтір/i.test(input))return 'danger';
  if(/донор|сдать кровь|кровь|қан тап|қан бер/i.test(input))return 'donor';
  if(/маршрут|парк|коляск|саябақ|арба|бағыт/i.test(input))return 'route';
  if(/психолог|психотерапевт|маман|кеңеске/i.test(input))return 'psych';
  if(/стресс|тревог|тяжело|устал|одинок|поговор|сөйлес|қинал|мазасыз|жалғыз/i.test(input))return 'support';
  return 'fallback';
};
function send(input,render,fromPrompt=false){
  const message=String(input??'').trim().slice(0,500);
  if(!message)return;
  draft='';
  const current=readChat()||{expires:Date.now()+lifetime,turns:[]};
  const kind=classify(message);
  current.turns.push({message,kind});current.turns=current.turns.slice(-24);
  saveChat(current);schedule(render);render();
  const log=document.querySelector('.home-chat-log');
  const latest=log?.lastElementChild;
  if(latest)log.scrollTop+=latest.getBoundingClientRect().top-log.getBoundingClientRect().top-12;
  const target=fromPrompt && window.matchMedia('(pointer: coarse)').matches?'.home-chat-log':'#home-chat-input';
  document.querySelector(target)?.focus({preventScroll:true});
}
const topicButtons=lang=>`<div class="home-chat-prompts">${shortPrompts[lang].map((label,i)=>
  `<button type="button" data-action="home-ai-prompt" data-id="${i}">${label}</button>`).join('')}</div>`;
function renderReply(kind,lang,w,latest){
  const next=nextSteps[lang];
  const action=(href,label)=>`<a class="home-chat-result-link" href="${href}" data-link>${label}</a>`;
  if(kind==='donor'||kind==='psych'){
    const raw=kind==='donor'?donorAvailability(lang):psychAvailability(lang);
    const slots=(Array.isArray(raw)?raw:String(raw??'').split('\n')).filter(Boolean);
    const href=kind==='donor'?'/directions/donation#donor-center-search':'/directions/support/psychology#psych-clinicians';
    const label=kind==='donor'?next.centers:next.specialist;
    return `<p>${w[kind]}</p>${slots.length?`<details><summary>${next.schedule}</summary>
      <ul class="home-chat-slots">${slots.map(slot=>`<li>${escapeText(slot)}</li>`).join('')}</ul></details>`:''}${action(href,label)}`;
  }
  if(kind==='route'){
    if(!hasRouting){
      const hint=lang==='kk'?'Жаяу маршрутты есептеу қазір қолжетімсіз. Қолжетімділік сүзгілерін оқу сызбасында қолданып көріңіз.':'Расчёт маршрута сейчас недоступен. Попробуйте настроить параметры доступности на учебной схеме.';
      return `<p>${hint}</p>${action('/directions/accessibility/map',next.sample)}`;
    }
    const path=route?routeHref({start:route.start,end:route.end,from:routeCopy[lang].homeExample,to:route.name[lang==='kk'?0:1]}):'/directions/accessibility/map?markers=1';
    const map=action(path,route?route.name[lang==='kk'?0:1]+' · '+w.map:w.map);
    return `<p>${w.route}</p><p>${locationState?escapeText(w[locationState]):''}</p>
      <div class="home-chat-reply-links"><button type="button" class="button secondary" data-action="home-ai-locate" ${locationState==='waiting'?'disabled':''}>${w.locate}</button><button type="button" class="text-button" data-action="home-ai-route-example">${w.example}</button>${map}</div>`;
  }
  if(kind==='support'||kind==='follow')return `<p>${w.support}</p>${action('/directions/support/psychology#psych-reflection',next.support)}`;
  if(kind==='danger')return `<p>${w.danger}</p>`;
  return `<p>${next.unknown}${latest?' '+next.retry:''}</p>${latest?topicButtons(lang):''}`;
}
export function renderHomeChat(lang){
  const w=copy[lang], chat=readChat(), turns=chat?.turns||[];
  const hasMessages=turns.length>0;
  return `<div class="home-chat-widget${opened?' is-open':''}">
    ${opened?`<section class="home-chat-panel" id="home-chat-panel" role="dialog" aria-modal="true" aria-labelledby="home-chat-title">
      <header>
        <div class="home-chat-identity"><img src="/assets/care-logo.webp" alt="" width="35" height="35"><div><h2 id="home-chat-title">${w.title}</h2><p>${w.demo}</p></div></div>
        <div>
          <button class="home-chat-clear" type="button" data-action="home-ai-clear" ${hasMessages||draft?'':'hidden'} aria-label="${w.clear}" title="${w.clear}">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16m-10 0V4h4v3m-8 0 1 13h10l1-13m-6 3v6m-3-6v6m6-6v6"/></svg>
          </button>
          <button class="home-chat-close" type="button" data-action="home-ai-toggle" aria-label="${w.close}">×</button>
        </div>
      </header>
      <div class="home-chat-log${hasMessages?'':' is-empty'}" role="log" aria-live="polite" tabindex="0">${hasMessages?'':`
        <div class="home-chat-welcome">
          <p class="home-chat-greeting">${w.hello}</p>
          <p class="home-chat-welcome-copy">${nextSteps[lang].welcome}</p>
          ${topicButtons(lang)}
        </div>`}
      ${turns.map(({message,kind},index)=>`<article class="home-chat-turn"><p class="home-chat-user">${escapeText(message)}</p><div class="home-chat-reply">${kind==='route' && hasRouting && index!==chat.turns.findLastIndex(t=>t.kind==='route')?`<p>${w.route}</p>`:renderReply(kind,lang,w,index===turns.length-1)}</div></article>`).join('')}</div>
      <form id="home-ai-form"><label class="home-chat-input-label" for="home-chat-input">${w.message}</label><input id="home-chat-input" name="message" value="${escapeText(draft)}" placeholder="${w.messageHint}" required maxlength="500" autocomplete="off" enterkeyhint="send"><button type="submit" class="button primary home-chat-send" aria-label="${w.send}" ${draft.trim()?'':'disabled'}><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button></form>
      <p class="home-chat-note">${w.notice} <span aria-hidden="true">·</span> ${w.expiry}</p>
    </section>`:''}
    <button class="home-chat-launcher ${opened?'is-open':''}" type="button" data-action="home-ai-toggle" aria-label="${opened?w.close:w.open}" aria-expanded="${opened}" ${opened?'aria-controls="home-chat-panel"':''}>
      <svg width="27" height="27" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v12H9l-5 3V5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 10h8m-8 3h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
    </button>
  </div>`;
}
function parkRoute(lat,lon){
  const distance=p=>((p.lat-lat)**2)+(((p.lon-lon)*Math.cos(lat*Math.PI/180))**2);
  const park=[...parks].sort((a,b)=>distance(a)-distance(b))[0];
  return {name:park.label,start:[lon,lat],end:[park.lon,park.lat]};
}
export function homeChatAction(action,id,lang,render){
  if(action==='home-ai-toggle'){
    opened=!opened;schedule(render);render();
    if(opened){
      const target=window.matchMedia('(pointer: coarse)').matches?'[data-action="home-ai-toggle"].home-chat-close':'#home-chat-input';
      document.querySelector(target)?.focus({preventScroll:true});
    }
    else document.querySelector('.home-chat-launcher')?.focus({preventScroll:true});
    return true;
  }
  if(action==='home-ai-clear'){
    draft='';clearTimeout(timer);saveChat(null);route=null;locationState='';locationRequest++;render();
    const target=window.matchMedia('(pointer: coarse)').matches?'.home-chat-close':'#home-chat-input';
    document.querySelector(target)?.focus({preventScroll:true});
    return true;
  }
  if(action==='home-ai-prompt'){
    send(copy[lang].prompts[Number(id)],render,true);return true;
  }
  if(action==='home-ai-route-example'){
    locationRequest++;
    route=parkRoute(42.3186,69.5977);
    locationState='exampleStatus';
    render();
    return true;
  }
  if(action==='home-ai-locate'){
    const request=++locationRequest;
    locationState='waiting';route=null;
    const finish=next=>{
      if(request!==locationRequest || locationState!=='waiting')return;
      locationState=next;
      if(opened && sitePath()==='/')render();
    };
    if(!navigator.geolocation){finish('locationFail');return true}
    navigator.geolocation.getCurrentPosition(({coords})=>{
      if(request!==locationRequest || locationState!=='waiting')return;
      const {latitude:lat,longitude:lon}=coords;
      if(lat<42.17||lat>42.53||lon<69.35||lon>69.87){finish('outside');return}
      route=parkRoute(lat,lon);
      finish('');
    },()=>finish('locationFail'),{timeout:8000});
    render();
    return true;
  }
  return false;
}
export function homeChatSubmit(form,render){send(new FormData(form).get('message'),render)}

export function homeChatInput(input){
  if(input.id!=='home-chat-input')return false;
  draft=input.value;
  const panel=input.closest('.home-chat-panel');
  panel.querySelector('.home-chat-send').disabled=!draft.trim();
  panel.querySelector('[data-action="home-ai-clear"]').hidden=!draft && !readChat()?.turns.length;
  return true;
}

export function fitHomeChat(){
  const viewport=window.visualViewport;
  const panel=document.querySelector('.home-chat-widget.is-open');
  if(!panel || !viewport)return;
  panel.style.setProperty('--chat-viewport-height',viewport.height+'px');
  panel.style.setProperty('--chat-bottom-inset',Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop)+'px');
}
