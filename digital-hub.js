import {readLocal,writeLocal,profileName} from './profiles.js';
import {scheduleTimestamp,helpText,helpWindowLabel,readHelpWindow,renderHelpWindowFields,demoSaveNote} from './ui.js';
import {guides as existingGuides} from './support-content.js';

const route = '/directions/support/digital';
const storageKey = 'janashyr.digital.requests.v1';
const guideIndex = [
  {id:'phone', category:'device', terms:'телефон смартфон приложение қолданба баптау настройка android ios'},
  {id:'services', category:'online', terms:'egov егов эгов құжат анықтама документ справка портал'},
  {id:'safety', category:'safe', terms:'мошенник алаяқ смс sms сілтеме ссылка қауіпсіздік фишинг'},
  {id:'text', category:'device', terms:'шрифт размер крупнее үлкейту қаріп мәтін экран'},
  {id:'video', category:'online', terms:'видеозвонок камера микрофон бейнеқоңырау байланыс'}
];
const strings = {
  ru:{
    back:'Поддержка', title:'Цифровой помощник', intro:'Разберитесь с телефоном и онлайн-сервисами в своём темпе.',
    jump:'Перейти к инструкциям', library:'Пошаговые инструкции', search:'Поиск по инструкциям',
    placeholder:'Например, размер текста или видеозвонок', find:'Найти', reset:'Очистить',
    categories:{all:'Все темы',device:'Телефон',online:'Онлайн-сервисы',safe:'Безопасность'},
    emptyGuide:'По вашему запросу ничего не найдено. Попробуйте другое слово или покажите все темы.',
    guides:[
      ...existingGuides.ru,
      ['Как увеличить текст на телефоне','Откройте настройки телефона.','Найдите раздел «Экран» или «Универсальный доступ».','Найдите настройку размера текста и сдвиньте ползунок, пока читать не станет удобно.'],
      ['Подготовка к видеозвонку','Проверьте, подключён ли телефон к интернету.','Откройте знакомое приложение связи и выберите человека, которому хотите позвонить.','Начните видеозвонок. Если вас не видно или не слышно, проверьте кнопки камеры и микрофона на экране.']
    ],
    help:'Помощь с цифровыми задачами', demo:'Учебный режим. Заявки остаются в этом браузере.',
    ask:'Выберите тему и попробуйте создать демо-заявку.',
    helper:'Возьмите учебную заявку и отметьте её завершение после демонстрации.',
    guest:'Демо-профиль позволяет попробовать отправить заявку или взять её в работу.',
    other:'Для заявки выберите профиль пенсионера. Для ответа подойдёт профиль помощника или волонтёра.',
    signIn:'Открыть вход', profiles:'Выбрать профиль', topic:'С чем нужна помощь?', send:'Создать демо-заявку',
    active:'Мои заявки', queue:'Очередь для помощников', noQueue:'Сейчас нет открытых заявок.',
    noActive:'У вас пока нет заявок.', claim:'Взять в работу', resolve:'Завершить',
    cancel:'Отменить', history:'Цифровая помощь', seeAll:'История в профиле',
    noHistory:'Записей о цифровой помощи пока нет.', opened:'Открыта', claimed:'В работе',
    resolved:'Завершена', cancelled:'Отменена', outgoing:'Моя заявка', helping:'Я помогаю',
    created:'Демо-заявка создана.', taken:'Вы взяли заявку в работу.', finished:'Демо-заявка завершена.',
    removed:'Демо-заявка отменена.', conflict:'Открытая заявка по этой теме уже есть.',
    stale:'Статус заявки изменился. Проверьте список.'
  },
  kk:{
    back:'Қолдау', title:'Цифрлық көмекші', intro:'Телефон мен онлайн қызметтерді өзіңізге ыңғайлы қарқынмен үйреніңіз.',
    jump:'Нұсқаулықтарды қарау', library:'Қадамдық нұсқаулықтар', search:'Нұсқаулықтарды іздеу',
    placeholder:'Мысалы, мәтін өлшемі немесе бейнеқоңырау', find:'Іздеу', reset:'Тазарту',
    categories:{all:'Барлық тақырып',device:'Телефон',online:'Онлайн қызметтер',safe:'Қауіпсіздік'},
    emptyGuide:'Сұрауыңыз бойынша ештеңе табылмады. Басқа сөзді қолданып көріңіз немесе барлық тақырыпты ашыңыз.',
    guides:[
      ...existingGuides.kk,
      ['Телефондағы мәтінді қалай үлкейтуге болады','Телефон баптауларын ашыңыз.','«Экран» немесе «Арнайы мүмкіндіктер» бөлімін табыңыз.','Мәтін өлшемі параметрін тауып, оқуға ыңғайлы болғанша жүгірткіні жылжытыңыз.'],
      ['Бейнеқоңырауға дайындық','Телефонның интернетке қосылғанын тексеріңіз.','Өзіңізге таныс байланыс қолданбасын ашып, қоңырау шалатын адамды таңдаңыз.','Бейнеқоңырауды бастаңыз. Сізді көрмесе немесе естімесе, экрандағы камера мен микрофон батырмаларын тексеріңіз.']
    ],
    help:'Цифрлық істерге көмек', demo:'Оқу режимі. Өтінімдер осы браузерде қалады.',
    ask:'Тақырыпты таңдап, демо өтінім жасап көріңіз.',
    helper:'Оқу өтінімін қабылдап, көрсетілімнен кейін оны аяқталған деп белгілеңіз.',
    guest:'Демо профиль өтінім жіберіп, оны жұмысқа қабылдап көруге мүмкіндік береді.',
    other:'Өтінім беру үшін зейнеткер профилін таңдаңыз. Жауап беру үшін көмекші немесе ерікті профилі жарайды.',
    signIn:'Кіру', profiles:'Профильді таңдау', topic:'Қай тақырып бойынша көмек қажет?', send:'Демо өтінім жасау',
    active:'Менің өтінімдерім', queue:'Көмекшілерге арналған кезек', noQueue:'Ашық өтінім жоқ.',
    noActive:'Сізде әзірге өтінім жоқ.', claim:'Жұмысқа алу', resolve:'Аяқтау',
    cancel:'Бас тарту', history:'Цифрлық көмек', seeAll:'Профильдегі тарих',
    noHistory:'Цифрлық көмек бойынша жазба жоқ.', opened:'Ашық', claimed:'Жұмыста',
    resolved:'Аяқталды', cancelled:'Күші жойылды', outgoing:'Менің өтінімім', helping:'Мен көмектесемін',
    created:'Демо өтінім жасалды.', taken:'Өтінімді жұмысқа алдыңыз.', finished:'Демо өтінім аяқталды.',
    removed:'Демо өтінімнің күші жойылды.', conflict:'Осы тақырып бойынша ашық өтінім бар.',
    stale:'Өтінімнің күйі өзгерді. Тізімді тексеріңіз.'
  }
};

const initialView = {query:'',category:'all',notice:'',volunteerQuery:'',volunteerFormat:'',selectedVolunteer:'',availabilityNotice:'',availabilityDraft:null,requestTopic:''};
let view = {...initialView};
let viewOwner = '';
let memory = [];
let memoryOnly = false;
const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isRequester = profile => Boolean(profile?.id && profile.role==='pensioner');
const isHelper = profile => Boolean(profile?.id && ['helper','volunteer'].includes(profile.role));
const isActive = item => ['opened','claimed'].includes(item.status);
const topicIndex = id => guideIndex.findIndex(topic=>topic.id===id);
const topicTitle = (id,w) => w.guides[topicIndex(id)]?.[0] || w.help;

function getRequests() {
  if (memoryOnly) return memory;
  try {
    const saved = globalThis.localStorage?.getItem(storageKey);
    if (saved === null) return [];
    if (saved === undefined) return memory;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item=>item && typeof item.id==='string' && typeof item.requester==='string' &&
      topicIndex(item.topic)>=0 && ['opened','claimed','resolved','cancelled'].includes(item.status) &&
      Number.isFinite(item.updatedAt) && Math.abs(item.updatedAt)<=8.64e15);
  } catch {
    return memory;
  }
}

function saveRequests(requests) {
  memory = requests;
  try {
    globalThis.localStorage?.setItem(storageKey,JSON.stringify(requests));
  } catch {
    memoryOnly = true;
  }
}

const volunteerText={
  kk:{heading:'Волонтер табу',note:'Көрсетілген уақыт пен мекенжайлар демоға арналған.', search:'Есім бойынша іздеу', any:'Кез келген волонтер', select:'Өтінімге таңдау', none:'Сәйкес волонтер табылмады.', publish:'Бос уақытым', save:'Кестені сақтау', saved:'Демо кесте сақталды.', every:'Барлық форматтар'},
  ru:{heading:'Найти волонтёра',note:'Время и адреса предназначены для демонстрации.', search:'Поиск по имени', any:'Любой волонтёр', select:'Выбрать для заявки', none:'Подходящих волонтёров не найдено.', publish:'Моё свободное время', save:'Сохранить расписание', saved:'Демо-расписание сохранено.', every:'Все форматы'}
};
const volunteerOffers=[
  {id:'preview-helper',names:['Айгерім · демо көмекші','Айгерим · демо-помощник'],format:'online',from:'10:00',until:'12:00'},
  {id:'preview-volunteer',names:['Данияр · демо волонтер','Данияр · демо-волонтёр'],format:'local',from:'15:00',until:'18:00',location:'community'}
];
function offers(){
  const saved=readLocal('digital-offers',[]);
  return [...saved,...volunteerOffers.filter(example=>!saved.some(row=>row.id===example.id))];
}
const offerName=(row,lang)=>Array.isArray(row.names)?row.names[lang==='kk'?0:1]:row.names;
function renderVolunteers(lang,profile){
  const w=volunteerText[lang], labels=helpText[lang];
  const query=view.volunteerQuery.toLowerCase();
  const shown=offers().filter(row=>
    (!view.volunteerFormat||row.format===view.volunteerFormat) &&
    [offerName(row,lang),...(Array.isArray(row.names)?row.names:[])].join(' ').toLowerCase().includes(query));
  const current=view.availabilityDraft||offers().find(row=>row.id===profile?.id);
  return `<section class="wrap digital-volunteers" id="digital-volunteers" aria-labelledby="digital-volunteers-title">
    <h2 id="digital-volunteers-title">${w.heading}</h2><p>${w.note}</p>
    <form id="digital-volunteer-search" class="help-search" role="search">
      <label>${w.search}<input type="search" name="query" value="${escapeHtml(view.volunteerQuery)}" maxlength="80"></label>
      <label>${labels.format}<select name="format"><option value="">${w.every}</option>
        ${['online','local'].map(id=>`<option value="${id}" ${view.volunteerFormat===id?'selected':''}>${labels[id]}</option>`).join('')}
      </select></label><button class="button primary" type="submit">${strings[lang].find}</button>
    </form>
    <div class="digital-volunteer-list">
      ${shown.length?shown.map(row=>`<article><h3>${escapeHtml(offerName(row,lang))}</h3><p>${escapeHtml(helpWindowLabel(lang,row))}</p>
        ${isRequester(profile)?`<button type="button" class="button secondary" data-action="digital-select-volunteer" data-id="${escapeHtml(row.id)}">${w.select}</button>`:
          !profile?`<a class="button secondary" href="/login" data-link>${strings[lang].signIn}</a>`:''}
        </article>`).join(''):`<p role="status">${w.none}</p>`}
    </div>
    ${isHelper(profile)?`<form id="digital-availability" class="help-availability"><h3>${w.publish}</h3>
      <div class="help-window-fields">${renderHelpWindowFields(lang,current,true)}</div>
      ${view.availabilityNotice?`<p role="status">${view.availabilityNotice==='invalid'?labels.invalid:w.saved}</p>`:''}
      <button class="button primary" type="submit">${w.save}</button>
    </form>`:''}
  </section>`;
}

function requestCard(item,w,profile,lang) {
  const actions = [];
  if (isRequester(profile) && item.requester===profile.id && isActive(item)) actions.push(['digital-cancel',w.cancel]);
  if (isHelper(profile) && item.status==='opened' && item.requester!==profile.id && (!item.requestedHelper || item.requestedHelper===profile.id)) actions.push(['digital-claim',w.claim]);
  if (isHelper(profile) && item.status==='claimed' && item.helper===profile.id) actions.push(['digital-resolve',w.resolve]);
  return `<li class="digital-ticket">
    <div><strong>${topicTitle(item.topic,w)}</strong><span class="digital-status" data-status="${item.status}">${w[item.status]}</span>${item.availability?`<p>${escapeHtml(offerName(item.availability,lang))} · ${escapeHtml(helpWindowLabel(lang,item.availability))}</p>`: ''}</div>
    ${actions.map(([action,label])=>`<button type="button" class="button secondary" data-action="${action}" data-id="${escapeHtml(item.id)}">${label}</button>`).join('')}
  </li>`;
}

function helpDesk(w,profile,lang) {
  const requests = getRequests();
  const requester = isRequester(profile);
  const helper = isHelper(profile);
  let content;
  if (requester) {
    const mine = requests.filter(item=>item.requester===profile.id && isActive(item));
    const selected=offers().find(row=>row.id===view.selectedVolunteer);
    content = `<p>${w.ask}</p>
      <form id="digital-request-form"><label for="digital-request-topic">${w.topic}</label>
        <select id="digital-request-topic" name="topic">${guideIndex.map(({id})=>`<option value="${id}" ${view.requestTopic===id?'selected':''}>${topicTitle(id,w)}</option>`).join('')}</select>
        <label for="digital-request-volunteer">${volunteerText[lang].heading}</label>
        <select id="digital-request-volunteer" name="volunteer"><option value="">${volunteerText[lang].any}</option>
          ${offers().map(row=>`<option value="${escapeHtml(row.id)}" ${view.selectedVolunteer===row.id?'selected':''}>${escapeHtml(offerName(row,lang))}</option>`).join('')}
        </select>
        ${selected?`<p class="help-selected-window">${escapeHtml(helpWindowLabel(lang,selected))}</p>`: ''}
        <a href="#digital-volunteers">${volunteerText[lang].heading}</a>
        ${demoSaveNote(lang)}
        <button class="button primary" type="submit">${w.send}</button>
      </form>
      <h3>${w.active}</h3>${mine.length?`<ul class="digital-tickets">${mine.map(item=>requestCard(item,w,profile,lang)).join('')}</ul>`:`<p>${w.noActive}</p>`}`;
  } else if (helper) {
    const queue = requests.filter(item=>item.requester!==profile.id && ((item.status==='opened' && (!item.requestedHelper || item.requestedHelper===profile.id)) || (item.status==='claimed' && item.helper===profile.id)));
    content = `<p>${w.helper}</p><h3>${w.queue}</h3>${queue.length?`<ul class="digital-tickets">${queue.map(item=>requestCard(item,w,profile,lang)).join('')}</ul>`:`<p>${w.noQueue}</p>`}`;
  } else {
    content = `<p>${profile?w.other:w.guest}</p><a class="button primary" href="/login" data-link>${profile?w.profiles:w.signIn}</a>`;
  }
  return `<aside class="digital-desk" id="digital-request" aria-labelledby="digital-desk-title">
    <h2 id="digital-desk-title">${w.help}</h2>
    <p class="digital-demo">${w.demo}</p>
    ${view.notice?`<p class="digital-feedback" role="status">${w[view.notice]}</p>`:''}
    ${content}
    ${requester||helper?`<a class="digital-history-link" href="/account#digital-history" data-link>${w.seeAll}</a>`:''}
  </aside>`;
}

export function renderDigital(lang,profile) {
  const owner = profile?.id || '';
  if (viewOwner !== owner) {
    viewOwner = owner;
    view = {...initialView};
  }
  const w = strings[lang] || strings.kk;
  const query = view.query.toLocaleLowerCase(lang==='kk'?'kk-KZ':'ru-RU').split(/\s+/).filter(Boolean);
  const results = guideIndex.filter(({category,terms},i)=>{
    const haystack = [...w.guides[i],terms].join(' ').toLowerCase();
    return (view.category==='all' || category===view.category) && query.every(word=>haystack.includes(word));
  });
  return `<main class="digital-hub" lang="${lang==='ru'?'ru':'kk'}">
    <section class="digital-hero photo-hero">
      <div class="wrap">
        <a class="back" href="/directions/support" data-link>${w.back}</a>
        <h1>${w.title}</h1><p>${w.intro}</p>
        <div class="digital-hero-links"><a class="button primary" href="#digital-guides">${w.jump}</a><a class="button secondary" href="#digital-request">${w.help}</a><a class="button secondary" href="#digital-volunteers">${volunteerText[lang].heading}</a></div>
        <form class="digital-search" id="digital-search-form" role="search" aria-labelledby="digital-search-label">
          <label id="digital-search-label" for="digital-search-query">${w.search}</label>
          <div><input id="digital-search-query" name="query" type="search" maxlength="80" placeholder="${w.placeholder}" value="${escapeHtml(view.query)}">
            <button class="button primary" type="submit">${w.find}</button></div>
        </form>
      </div>
    </section>
    <div class="wrap digital-layout">
      <section id="digital-guides" aria-labelledby="digital-guides-title">
        <h2 id="digital-guides-title">${w.library}</h2>
        <div class="digital-filters" role="group" aria-label="${w.search}">${Object.entries(w.categories).map(([id,title])=>`<button type="button" data-action="digital-category" data-id="${id}" aria-pressed="${id===view.category}">${title}</button>`).join('')}</div>
        <ul class="digital-lessons">
          ${results.map(({id,category})=>{
            const [title,...steps] = w.guides[topicIndex(id)];
            return `<li><details>
              <summary><span><small>${w.categories[category]}</small><strong>${title}</strong></span></summary>
              <ol>${steps.map(step=>`<li>${step}</li>`).join('')}</ol>
            </details></li>`;
          }).join('')}
        </ul>
        ${results.length?'':`<p role="status">${w.emptyGuide}</p><button class="button secondary" type="button" data-action="digital-reset">${w.reset}</button>`}
      </section>
      ${helpDesk(w,profile,lang)}
    </div>
    ${renderVolunteers(lang,profile)}
  </main>`;
}

export function digitalInput(el,render){
  if(el.form?.id!=='digital-request-form')return false;
  if(el.name==='topic'){
    view.requestTopic=el.value;
    return true;
  }
  if(el.name==='volunteer' && view.selectedVolunteer!==el.value){
    view.selectedVolunteer=el.value;
    render();
    return true;
  }
  return false;
}

export function digitalClick(action,id,lang,profile) {
  if(action==='digital-select-volunteer'){
    if(isRequester(profile) && offers().some(row=>row.id===id))view.selectedVolunteer=id;
    return true;
  }
  if (action==='digital-category') {
    if (Object.hasOwn(strings.kk.categories,id)) view.category = id;
    view.notice = '';
    return true;
  }
  if (action==='digital-reset') {
    view = {...initialView};
    return true;
  }
  if (!['digital-claim','digital-resolve','digital-cancel'].includes(action)) return false;
  if (action==='digital-cancel' ? !isRequester(profile) : !isHelper(profile)) return true;

  const requests = getRequests();
  const item = requests.find(request=>request.id===id);
  const match = item && (
    action==='digital-claim' && item.status==='opened' && item.requester!==profile.id && (!item.requestedHelper || item.requestedHelper===profile.id) ||
    action==='digital-resolve' && item.status==='claimed' && item.helper===profile.id ||
    action==='digital-cancel' && isActive(item) && item.requester===profile.id
  );
  if (!match) {
    view.notice = 'stale';
    return true;
  }
  if (action==='digital-claim') {
    item.helper = profile.id;
    item.status = 'claimed';
    view.notice = 'taken';
  } else if (action==='digital-resolve') {
    item.status = 'resolved';
    view.notice = 'finished';
  } else {
    item.status = 'cancelled';
    view.notice = 'removed';
  }
  item.updatedAt = Date.now();
  saveRequests(requests);
  return true;
}

export function digitalSubmit(form,lang,profile) {
  if(form.id==='digital-volunteer-search'){
    const data=new FormData(form);
    view.volunteerQuery=String(data.get('query')||'').trim().slice(0,80);
    const format=data.get('format');
    view.volunteerFormat=['online','local'].includes(format)?format:'';
    return true;
  }
  if(form.id==='digital-availability'){
    if(!isHelper(profile))return true;
    const data=new FormData(form);
    const availability=readHelpWindow(data,data.get('format'));
    if(!availability){
      view.availabilityDraft={format:data.get('format'),from:data.get('from'),until:data.get('until'),location:data.get('location')};
      view.availabilityNotice='invalid';return true;
    }
    const old=offers().find(row=>row.id===profile.id);
    const names=old?.names || [profileName(profile,'kk'),profileName(profile,'ru')];
    writeLocal('digital-offers',[{id:profile.id,names,...availability},...readLocal('digital-offers',[]).filter(row=>row.id!==profile.id)]);
    view.availabilityDraft=null;
    view.availabilityNotice='saved';
    return true;
  }
  if (form.id==='digital-search-form') {
    view.query = String(new FormData(form).get('query') || '').trim().slice(0,80);
    view.notice = '';
    return true;
  }
  if (form.id!=='digital-request-form') return false;
  if (!isRequester(profile)) return true;
  const data = new FormData(form);
  const topic = data.get('topic');
  const volunteer=data.get('volunteer');
  const availability=offers().find(row=>row.id===volunteer);
  if(volunteer && !availability){view.notice='stale';return true}
  if (topicIndex(topic)<0) return true;
  const requests = getRequests();
  if (requests.some(item=>item.requester===profile.id && item.topic===topic && isActive(item))) {
    view.notice = 'conflict';
    return true;
  }
  requests.unshift({id:globalThis.crypto.randomUUID(),requester:profile.id,helper:null,requestedHelper:availability?.id || null,availability:availability || null,topic,status:'opened',updatedAt:Date.now()});
  saveRequests(requests);
  view.notice = 'created';
  view.selectedVolunteer='';
  view.requestTopic='';
  return true;
}

export function digitalHistory(lang,profile) {
  if (!profile?.id) return '';
  const w = strings[lang] || strings.kk;
  const mine = getRequests().filter(item=>item.requester===profile.id || item.helper===profile.id).sort((a,b)=>b.updatedAt-a.updatedAt);
  return `<section class="digital-account" id="digital-history" aria-labelledby="digital-history-title">
    <h2 id="digital-history-title">${w.history}</h2>
    ${mine.length?`<ul>${mine.map(item=>`<li><div><strong>${topicTitle(item.topic,w)}</strong>
      <p>${item.requester===profile.id?w.outgoing:w.helping} · ${scheduleTimestamp(lang,item.updatedAt,false)}</p>${item.availability?`<p>${escapeHtml(offerName(item.availability,lang))} · ${escapeHtml(helpWindowLabel(lang,item.availability))}</p>`:''}</div>
      <span class="digital-status" data-status="${item.status}">${w[item.status]}</span></li>`).join('')}</ul>`:`<p>${w.noHistory}</p>`}
    <a class="digital-history-link" href="${route}" data-link>${w.title}</a>
  </section>`;
}

export function digitalOverview(lang,profile) {
  const w=strings[lang];
  return getRequests().filter(item=>(item.requester===profile.id || item.helper===profile.id) &&
    ['opened','claimed'].includes(item.status)).map(item=>({
    section:'digital-history',group:w.title,label:topicTitle(item.topic,w)
  }));
}

