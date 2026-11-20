import {scheduleDate} from './ui.js';
import {readLocal,writeLocal,escapeText} from './profiles.js';

const zones = [
  ['abai','Абай ауданы','Абайский район',2],
  ['farabi','Әл-Фараби ауданы','Аль-Фарабийский район',3],
  ['enbekshi','Еңбекші ауданы','Енбекшинский район',3],
  ['karatau','Қаратау ауданы','Каратауский район',2],
  ['turan','Тұран ауданы','Район Туран',1]
];
const points = [
  ['Тұрғын үй маңындағы аумақ','Территория у жилого квартала'],
  ['Жаяу жүргінші аллеясы','Пешеходная аллея'],
  ['Саябақ шеті','Участок рядом с парком']
];
const words = {
  kk:{title:'Менің қалам',city:'Шымкент',intro:'Ауданды таңдап, тазалық жұмыстарына арналған демо топтың уақыты мен бос орындарын қараңыз.',note:'Аудандар нақты. Тазалау қажеттілігі, орындар, кесте және қатысушылар — көрсетуге арналған мысалдар.',district:'Аудан',priority:'Тазалау ұсынысы',groups:'Топтар',statuses:['Жоспарлы тазалау','Тазалау ұсынылады','Тазалау басым'],show:'Топтарды көру',team:'Топ',places:'адам',join:'Жазылу',leave:'Қатысудан бас тарту',full:'Орын жоқ',entered:'Жазылдыңыз',login:'Жазылу үшін кіру',history:'Қала бойынша тарих',empty:'Тазалық жұмыстарына жазылулар әзірге жоқ.',cancelled:'Бас тартылды',active:'Демо жазылу',clock:'Шымкент уақыты',volunteer:'Қоғамдық бастамалар'},
  ru:{title:'Мой город',city:'Шымкент',intro:'Выберите район, чтобы посмотреть группы уборки, время сбора и свободные места.',note:'Районы реальные. Состояние участков, места сбора, расписание и участники показаны для демонстрации.',district:'Район',priority:'Рекомендация по уборке',groups:'Группы',statuses:['Плановая уборка','Рекомендуется уборка','Приоритетная уборка'],show:'Посмотреть группы',team:'Группа',places:'чел.',join:'Записаться',leave:'Отменить участие',full:'Нет мест',entered:'Вы записаны',login:'Войти для записи',history:'История участия в городе',empty:'Записей на уборку пока нет.',cancelled:'Отменено',active:'Демо-запись',clock:'Время Шымкента',volunteer:'Городские инициативы'}
};
const districtNotes={
  abai:['Аулаларда жеңіл қоқыс жинау және сұрыптау.','Сбор и сортировка лёгкого мусора во дворах.'],
  farabi:['Демо топтар жаяу жүргінші аллеялары мен қоғамдық орындарға бөлінеді.','Демо-группы распределяются между аллеями и общественными пространствами.'],
  enbekshi:['Тұрғын аумақтар мен жаяу жүргінші жолдарының тазалығына көңіл бөлінеді.','В центре внимания жилые территории и пешеходные дорожки.'],
  karatau:['Топтар саябақ маңында және серуендеу жолдарында жұмыс істейді.','Группы работают рядом с парками и на прогулочных дорожках.'],
  turan:['Жеңіл қоқыс жинауға және тазалықты сақтауға арналған жоспарлы жұмыс.','Плановая уборка лёгкого мусора на прогулочных участках.']
};
let selectedZone='abai';
const CAPACITY=40;
const defaults=[22,36,38];

function upcomingDay(weekday, weekOffset=0) {
  const [month,day,year]=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Almaty',month:'numeric',day:'numeric',year:'numeric'}).format().split('/').map(Number);
  const today=new Date(Date.UTC(year,month-1,day));
  const delta=(weekday+7-today.getUTCDay())%7 || 7;
  today.setUTCDate(today.getUTCDate()+delta+7*weekOffset);
  return today.toISOString().slice(0,10);
}

function sessions(zoneId) {
  const zone=zones.find(([id])=>id===zoneId);
  if(!zone)return [];
  return points.map((_,index)=>{
    const date=upcomingDay([3,6,7][index]);
    return {id:`${zoneId}-${index}-${date}`,zone:zoneId,point:index,date,time:['10:00','15:00','11:30'][index],base:defaults[index],capacity:CAPACITY};
  }).sort((a,b)=>a.date.localeCompare(b.date));
}
const entries=()=>readLocal('cleanup-entries',[]);
const dateLabel=(date,lang)=>scheduleDate(lang,date);
const count=(slot, list)=>slot.base+list.filter(row=>row.slot.id===slot.id && !row.cancelled).length;

export function cleanupClick(action,id,profile) {
  if(action==='cleanup-zone'){
    if(zones.some(row=>row[0]===id))selectedZone=id;
    return true;
  }
  if(!['cleanup-join','cleanup-leave'].includes(action))return false;
  if(!profile)return true;
  const rows=entries();
  const existing=rows.find(row=>row.slot.id===id && row.profile===profile.id && !row.cancelled);
  if(action==='cleanup-leave'){
    if(existing){existing.cancelled=true;writeLocal('cleanup-entries',rows)}
    return true;
  }
  const slot=zones.flatMap(([zone])=>sessions(zone)).find(item=>item.id===id);
  if(slot && !existing && count(slot,rows)<CAPACITY){
    rows.unshift({profile:profile.id,slot,cancelled:false});
    writeLocal('cleanup-entries',rows);
  }
  return true;
}

export function renderCleanup(lang,profile) {
  const w=words[lang], i=lang==='kk'?1:2, district=zones.find(row=>row[0]===selectedZone);
  const rows=entries();
  const nextDates=new Intl.DateTimeFormat(lang==='kk'?'kk-KZ':'ru-RU',{day:'numeric',month:'short',timeZone:'UTC'});
  const nextDate=sessions(selectedZone)[0].date;
  const shortStatus=lang==='kk'?['Жоспарлы','Ұсынылады','Басым']:['Плановая','Рекомендуется','Приоритет'];
  return `<main class="wrap inner cleanup-page"><a class="back" href="/" data-link>JANASHYR</a>
    <header class="cleanup-lead"><span>${w.city}</span><h1>${w.title}</h1><p>${w.intro}</p></header>
    <p class="cleanup-note">${w.note}</p>
    <div class="cleanup-layout">
      <section><table class="cleanup-table"><caption>${w.city} · ${w.district}</caption><thead><tr><th scope="col">${w.district}</th><th scope="col">${w.priority}</th><th scope="col"><span class="cleanup-wide">${w.groups}</span><span class="cleanup-compact">${lang==='kk'?'Күні':'Дата'}</span></th></tr></thead>
      <tbody>${zones.map(([id,kk,ru,priority])=>`<tr class="${id===selectedZone?'is-selected':''}"><th scope="row"><button type="button" data-action="cleanup-zone" data-id="${id}" aria-pressed="${id===selectedZone}">${lang==='kk'?kk:ru}</button></th><td><span class="cleanup-priority level-${priority}"><span class="cleanup-wide">${w.statuses[priority-1]}</span><span class="cleanup-compact">${shortStatus[priority-1]}</span></span></td><td><span class="cleanup-wide">3</span><time class="cleanup-compact" datetime="${nextDate}">${nextDates.format(new Date(nextDate))}</time></td></tr>`).join('')}</tbody></table></section>
      <section class="cleanup-groups" aria-labelledby="cleanup-zone-title" tabindex="-1"><h2 id="cleanup-zone-title">${district[i]}</h2><p class="cleanup-district-note">${districtNotes[selectedZone][i-1]}</p>
      ${sessions(selectedZone).map(slot=>{
        const total=count(slot,rows), joined=profile && rows.some(row=>row.profile===profile.id&&row.slot.id===slot.id&&!row.cancelled);
        const cta=joined?`<button class="text-button" type="button" data-action="cleanup-leave" data-id="${slot.id}">${w.leave}</button>`:total>=CAPACITY?`<span>${w.full}</span>`:profile?`<button class="button primary" type="button" data-action="cleanup-join" data-id="${slot.id}">${w.join}</button>`:`<a class="button secondary" href="/login" data-link>${w.login}</a>`;
        return `<article class="cleanup-slot"><div><h3>${w.team} ${slot.point+1} · ${points[slot.point][i-1]}</h3><p>${dateLabel(slot.date,lang)} · ${slot.time}</p>
          <p class="cleanup-slot-free">${lang==='kk'?`Бос орын: ${CAPACITY-total}`:`Свободных мест: ${CAPACITY-total}`}</p></div><div><p>${total} / ${CAPACITY} ${w.places}${joined?' · '+w.entered:''}</p><progress value="${total}" max="${CAPACITY}" aria-label="${w.places}"></progress></div>${cta}</article>`;
      }).join('')}</section>
    </div>
    <section class="cleanup-guide"><div><h2>${lang==='kk'?'Қатысу тәртібі':'Как участвовать'}</h2>
      <p>${lang==='kk'?'Ауданды және топты таңдаңыз. Жазылғаннан кейін уақыт пен жиналу орны профильде сақталады.':'Выберите район и группу. Дата, время и пример места сбора появятся в истории профиля.'}</p></div>
      <div><h2>${lang==='kk'?'Тазалау жұмысына дайындық':'Что взять с собой'}</h2>
      <p>${lang==='kk'?'Қолғап, су және ыңғайлы жабық аяқ киім пайдалы. Қауіпті қалдықтарға тимеңіз.':'Для обычной уборки пригодятся перчатки, вода и удобная закрытая обувь. Опасные отходы оставьте специалистам.'}</p></div>
    </section>
    <nav class="cleanup-more" aria-label="${w.volunteer}">
      <a href="/directions/city/map" data-link>${lang==='kk'?'Қала мәселелерінің демо картасы':'Демо-карта городских сообщений'}</a>
      <a href="/directions/city/new" data-link>${lang==='kk'?'Демо хабарлама қосу':'Добавить демо-сообщение'}</a>
      <a href="/directions/city/events" data-link>${lang==='kk'?'Басқа демо іс-шаралар':'Другие демо-мероприятия'}</a>
    </nav>
  </main>`;
}

export function cleanupHistory(lang,profile) {
  const w=words[lang], i=lang==='kk'?1:2;
  const rows=entries().filter(row=>row.profile===profile?.id);
  return `<section class="account-list" id="profile-cleanup"><h2>${w.history}</h2>
    ${rows.length?rows.map(({slot,cancelled})=>`<article class="request-card"><strong>${escapeText(zones.find(row=>row[0]===slot.zone)?.[i])} · ${points[slot.point][i-1]}</strong><p>${dateLabel(slot.date,lang)} · ${slot.time}</p><p>${cancelled?w.cancelled:w.active}</p>${cancelled?'':`<button class="text-button" type="button" data-action="cleanup-leave" data-id="${slot.id}">${w.leave}</button>`}</article>`).join(''):`<p>${w.empty}</p>`}</section>`;
}

export function cleanupOverview(lang,profile) {
  const w=words[lang];
  return entries().filter(row=>row.profile===profile?.id&&!row.cancelled).map(({slot})=>({
    section:'profile-cleanup',group:w.title,label:w.team+' '+(slot.point+1),date:slot.date,time:slot.time
  }));
}

