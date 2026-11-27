import {scheduleDate,demoSaveNote} from './ui.js';
import {escapeText as e,storageText} from './profiles.js';
import {districts,activityTypes,activityStart,readParticipation,cityActivities,filterActivities,participationFor,changeParticipation,helpMinutes,updateCity} from './city-participation.js';

const base='/directions/city';
const copy={
  kk:{
    title:'Менің қалам',city:'Шымкент',intro:'Шымкент ауданын таңдап, қоғамдық акцияға қосылыңыз немесе мәселе туралы хабарлаңыз.',
    demo:'Бұл — демонстрациялық деректер. Акциялар, қатысушылар және орындар шартты.',district:'Аудан',type:'Акция түрі',date:'Күні',
    all:'Барлығы',apply:'Көрсету',reset:'Сүзгілерді тазарту',upcoming:'Алдағы акциялар',past:'Өткен акциялар',
    my:'Менің акцияларым',hours:'Көмек сағаттары',empty:'Таңдалған шарттар бойынша акция табылмады.',
    noPast:'Өткен акциялар әзірге жоқ.',noMine:'Қатысу жазбалары әзірге жоқ.',report:'Демо өтініш жасау',map:'Демо карта',otherEvents:'Басқа демо іс-шаралар',
    joined:'Жазылдыңыз',join:'Демо жазылу',leave:'Қатысудан бас тарту',full:'Орын жоқ',wait:'Демо күту тізіміне қосылу',
    leaveWait:'Күту тізімінен шығу',waiting:'Күту тізімінде',cancelled:'Бас тартылды',finished:'Аяқталды',
    opened:'Ашық',running:'Өтіп жатыр',timeZone:'Шымкент уақыты',bring:'Өзіңізбен бірге алыңыз',confirm:'Растау',close:'Жабу',
    joinedCount:(n,max)=>`${max} орынның ${n}-іне жазылды`,
    enterQuestion:'Акцияға қатысуды растаңыз',leaveQuestion:'Қатысудан бас тартасыз ба?',waitQuestion:'Күту тізіміне қосылуды растаңыз',
    leaveWaitQuestion:'Күту тізімінен шығасыз ба?',placeOpen:'Бос орын бар. Қатысу үшін жазылыңыз.',
    entered:'Акцияға жазылдыңыз.',waited:'Күту тізіміне қосылдыңыз.',cancelledNotice:'Қатысу немесе күту жазбасы жойылды.',
    duplicate:'Бұл акцияға бұрын жазылғансыз.',overlap:'Бұл уақытта басқа акцияға жазылғансыз.',
    closed:'Акция басталды немесе қолжетімді емес.',changed:'Қатысу мәртебесі өзгерді. Тізімді тексеріңіз.',
    profileRequired:'Қатысу үшін бейінді таңдаңыз.',nowOpen:'Бұл акцияда бос орын бар. Тікелей жазыла аласыз.',
    waitNote:'Бос орын ашылса, осы беттен қатысуға жазыла аласыз.',working:'Сақталуда…'
  },
  ru:{
    title:'Мой город',city:'Шымкент',intro:'Выберите район Шымкента, присоединитесь к городской акции или сообщите о проблеме.',
    demo:'Демонстрационные данные. Акции, участники и места сбора условные.',district:'Район',type:'Тип акции',date:'Дата',
    all:'Все',apply:'Показать',reset:'Сбросить фильтры',upcoming:'Ближайшие акции',past:'Прошедшие',
    my:'Мои акции',hours:'Часы помощи',empty:'Нет акций по выбранным фильтрам.',
    noPast:'Прошедших акций пока нет.',noMine:'Участий пока нет.',report:'Создать демо-обращение',map:'Демо-карта',otherEvents:'Другие демо-мероприятия',
    joined:'Вы записаны',join:'Демо-запись',leave:'Отменить участие',full:'Мест нет',wait:'В демо-лист ожидания',
    leaveWait:'Выйти из листа ожидания',waiting:'В листе ожидания',cancelled:'Отменено',finished:'Завершена',
    opened:'Открыта',running:'Идёт',timeZone:'Время Шымкента',bring:'Что взять с собой',confirm:'Подтвердить',close:'Закрыть',
    joinedCount:(n,max)=>`Записалось ${n} из ${max}`,
    enterQuestion:'Подтвердите участие в акции',leaveQuestion:'Отменить участие в акции?',waitQuestion:'Подтвердите запись в лист ожидания',
    leaveWaitQuestion:'Выйти из листа ожидания?',placeOpen:'Есть свободное место. Подтвердите участие, чтобы занять его.',
    entered:'Вы записаны на акцию.',waited:'Вы в листе ожидания.',cancelledNotice:'Участие или ожидание отменено.',
    duplicate:'У вас уже есть запись на эту акцию.',overlap:'На это время у вас уже запланирована другая акция.',
    closed:'Акция уже началась или недоступна.',changed:'Статус участия изменился. Проверьте список.',
    profileRequired:'Выберите профиль, чтобы записаться.',nowOpen:'На акции есть свободное место. Можно записаться напрямую.',
    waitNote:'Когда место освободится, вы сможете подтвердить участие на этой странице.',working:'Сохраняем…'
  }
};
const label=(lang,value)=>value[lang==='kk'?0:1];
const emptyFilters=()=>({district:'',type:'',date:''});
let filters=emptyFilters();
let actionDialog=null;
let feedback='';
let busy=false;
const title=(lang,activity)=>label(lang,activity.title);
const detailDate=(lang,activity)=>scheduleDate(lang,activity.date)+' · '+activity.time;
const actionButton=(text,action,id,style='button secondary')=>`<button type="button" class="${style}" data-action="${action}"${id?` data-id="${e(id)}"`:''}>${text}</button>`;

export function clearCleanupFeedback(){
  actionDialog=null;
  feedback='';
}

function notice(lang,issue) {
  const code=feedback || issue;
  const w=copy[lang];
  if(!code)return '';
  const message=code==='cancelled'?w.cancelledNotice:w[code] || storageText[lang][code];
  if(!message)return '';
  const success=['entered','waited','cancelled'].includes(code);
  return `<p class="${success?'success':'demo-notice'}" role="${success?'status':'alert'}" data-activity-feedback="${code}">${message}</p>`;
}

function selectFilter(lang,key,options){
  const w=copy[lang];
  return `<label>${w[key]}<select name="${key}"><option value="">${w.all}</option>
    ${Object.entries(options).map(([id,item])=>`<option value="${id}"${filters[key]===id?' selected':''}>${label(lang,item.name)}</option>`).join('')}
  </select></label>`;
}

function controls(lang,activity,member,now){
  if(activityStart(activity)<=now)return '';
  const w=copy[lang];
  if(member?.status==='joined')return actionButton(w.leave,'cleanup-leave',activity.id,'text-button');
  if(member?.status==='waiting'){
    return `${activity.status==='open'?actionButton(w.join,'cleanup-join',activity.id,'button primary'):''}
      ${actionButton(w.leaveWait,'cleanup-leave',activity.id,'text-button')}`;
  }
  return activity.status==='full'
    ? actionButton(w.wait,'cleanup-wait',activity.id)
    : actionButton(w.join,'cleanup-join',activity.id,'button primary');
}

function activityCard(lang,activity,member,now) {
  const w=copy[lang], started=activityStart(activity)<=now;
  const heading=activity.status==='past'?w.finished:started?w.running:activity.status==='full'?w.full:w.opened;
  const signups=w.joinedCount(Math.min(activity.signedUp.length,activity.capacity),activity.capacity);
  const buttons=controls(lang,activity,member,now);
  return `<article class="cleanup-slot city-activity-card" data-activity="${e(activity.id)}" data-status="${activity.status}">
    <div><span class="kicker">${label(lang,activityTypes[activity.type].name)}</span>
      <h3>${e(title(lang,activity))}</h3><p>${label(lang,districts[activity.district].name)} · ${detailDate(lang,activity)}</p>
      <p>${e(label(lang,activity.place))}</p>
      ${member?`<p>${member.status==='waiting'?w.waiting:w.joined}</p>`:''}
    </div>
    <div class="city-activity-progress"><strong>${heading}</strong><p>${signups}</p>
      <progress value="${Math.min(activity.signedUp.length,activity.capacity)}" max="${activity.capacity}" aria-label="${signups}"></progress>
    </div>${buttons?`<div class="city-activity-actions">${buttons}</div>`:''}
  </article>`;
}

export function renderCleanup(lang,profile){
  const w=copy[lang], now=Date.now(), {rows,issue}=readParticipation();
  const matching=filterActivities(cityActivities(rows,now),filters);
  const upcoming=matching.filter(activity=>activity.status!=='past');
  const past=matching.filter(activity=>activity.status==='past').reverse();
  const card=activity=>activityCard(lang,activity,participationFor(rows,profile?.id,activity.id),now);
  return `<main class="wrap inner cleanup-page">
    <header class="cleanup-lead photo-hero photo-hero-bleed"><a class="back" href="/" data-link>JANASHYR</a><span>${w.city}</span><h1>${w.title}</h1><p>${w.intro}</p><a class="button primary" href="#city-activities">${w.upcoming}</a></header>
    <p class="cleanup-note">${w.demo} ${w.timeZone}.</p>
    <nav class="cleanup-more city-activity-actions" aria-label="${w.title}">
      <a href="${base}/new" data-link>${w.report}</a><a href="${base}/map" data-link>${w.map}</a><a href="${base}/events" data-link>${w.otherEvents}</a>
      ${profile?`<a href="/account#profile-cleanup" data-link>${w.my}</a>`:''}
    </nav>
    <section class="cleanup-groups" id="city-activities" aria-labelledby="city-upcoming-title">
      <h2 id="city-upcoming-title">${w.upcoming}</h2>
      <form id="cleanup-filters" class="city-activity-fields">
        ${selectFilter(lang,'district',districts)}${selectFilter(lang,'type',activityTypes)}
        <label>${w.date}<input type="date" name="date" value="${e(filters.date)}"></label>
        <div class="city-activity-actions"><button class="button primary" type="submit">${w.apply}</button>${actionButton(w.reset,'cleanup-reset')}</div>
      </form>
      ${notice(lang,issue)}
      ${upcoming.length?upcoming.map(card).join(''):`<p role="status">${w.empty}</p>`}
    </section>
    <details class="guide city-past"><summary>${w.past} (${past.length})</summary>
      ${past.length?past.map(card).join(''):`<p>${w.noPast}</p>`}
    </details>
  </main>`;
}

function dialogHeading(lang,dialog){
  const w=copy[lang];
  if(dialog.action==='wait')return w.waitQuestion;
  if(dialog.action==='leave')return dialog.waiting?w.leaveWaitQuestion:w.leaveQuestion;
  return w.enterQuestion;
}

export function renderActivityDialog(lang) {
  if(!actionDialog)return '';
  const w=copy[lang], {activity,action}=actionDialog;
  return `<dialog id="city-activity-dialog" class="panel booking-profile-dialog" aria-labelledby="city-activity-dialog-title">
    <h2 id="city-activity-dialog-title">${dialogHeading(lang,actionDialog)}</h2>
    <p><strong>${e(title(lang,activity))}</strong></p>
    <p>${label(lang,districts[activity.district].name)} · ${detailDate(lang,activity)}</p><p>${e(label(lang,activity.place))}</p>
    ${action==='join'?`<p><strong>${w.bring}</strong> · ${label(lang,activityTypes[activity.type].bring)}</p>`:''}
    ${action==='wait'?`<p>${w.waitNote}</p>`:''}
    ${action!=='leave'?demoSaveNote(lang):''}
    <div class="city-activity-actions">
      <button type="button" class="button primary" data-action="cleanup-confirm"${busy?' disabled':''}>${busy?w.working:w.confirm}</button>
      ${actionButton(w.close,'cleanup-close')}
    </div>
  </dialog>`;
}

async function confirmActivity(profile,render) {
  if(!actionDialog || busy)return;
  const {activity,action}=actionDialog;
  busy=true;
  render();
  try{feedback=await updateCity(()=>changeParticipation(action,activity.id,profile?.id));}
  catch{feedback='saveFailed';}
  finally{busy=false;}
  actionDialog=null;
  render();
  globalThis.document?.querySelector?.('[data-activity-feedback]')?.scrollIntoView?.({block:'nearest'});
}

export function cleanupClick(action,id,profile,render=()=>{}) {
  if(action==='cleanup-reset'){filters=emptyFilters();feedback='';render();return true;}
  if(action==='cleanup-close'){if(!busy){actionDialog=null;render();}return true;}
  if(action==='cleanup-confirm'){void confirmActivity(profile,render);return true;}
  if(!['cleanup-join','cleanup-wait','cleanup-leave'].includes(action))return false;
  const {rows}=readParticipation();
  const activity=cityActivities(rows).find(row=>row.id===id);
  feedback='';
  if(!profile)feedback='profileRequired';
  else if(!activity || activityStart(activity)<=Date.now())feedback='closed';
  else actionDialog={action:action.slice(8),activity,waiting:participationFor(rows,profile.id,id)?.status==='waiting'};
  render();
  return true;
}

export function cleanupSubmit(form,render) {
  const data=new FormData(form);
  filters={district:data.get('district') || '',type:data.get('type') || '',date:data.get('date') || ''};
  feedback='';
  render();
}

export function cleanupHistory(lang,profile) {
  const w=copy[lang], now=Date.now(), {rows,issue}=readParticipation();
  const mine=rows.filter(row=>row.userId===profile?.id);
  const activities=new Map(cityActivities(rows,now).map(activity=>[activity.id,activity]));
  const hours=new Intl.NumberFormat(lang==='kk'?'kk-KZ':'ru-RU',{maximumFractionDigits:2}).format(helpMinutes(rows,profile?.id,now)/60);
  return `<section class="account-list" id="profile-cleanup"><h2>${w.my}</h2>
    <p><strong>${w.hours}</strong> · <output id="city-help-hours">${hours}</output></p>${notice(lang,issue)}
    ${mine.length?mine.map(row=>{
      const activity=activities.get(row.activityId) || row.activity;
      const status=row.status==='cancelled'?w.cancelled:row.status==='waiting'?w.waiting:activity.status==='past'?w.finished:w.joined;
      const buttons=row.status==='cancelled'?'':controls(lang,activity,row,now);
      return `<article class="request-card" data-activity-entry="${e(row.id)}" data-participation="${row.status}">
        <strong>${e(title(lang,activity))}</strong><p>${label(lang,districts[activity.district].name)} · ${detailDate(lang,activity)}</p>
        <p>${status}</p>${buttons?`<div class="city-activity-actions">${buttons}</div>`:''}
      </article>`;
    }).join(''):`<p>${w.noMine}</p>`}
    <a class="text-link" href="${base}" data-link>${w.upcoming}</a>
  </section>`;
}

export function cleanupOverview(lang,profile) {
  const now=Date.now();
  return readParticipation().rows.filter(row=>row.userId===profile?.id && row.status==='joined' && activityStart(row.activity)>now)
    .map(({activity})=>({section:'profile-cleanup',group:copy[lang].title,label:title(lang,activity),date:activity.date,time:activity.time}));
}

