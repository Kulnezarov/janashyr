import {escapeText as e,storageText} from './profiles.js';
import {scheduleDate,demoSaveNote} from './ui.js';
import {mapEmbedUrl} from './landing-sections.js';
import {renderTicketQr} from './donor-qr.js';
import {assessmentRules,assessmentFields,assessmentSteps,assessDonation,validAssessmentStep,bloodGroups,donorCenters,donorCenter,
  donorSchedule,donorToday,donorDaysUntil,donorStatus,donorBloodGroup,readDonorHistory,readAllDonorRecords,nextDonorDate,latestDonation,
  urgentNeeds,changeDonorBooking,updateDonor,donationCalendar} from './donor-booking-data.js';

const copy={
  ru:{
    title:'Демонстрационная запись',assessment:'Учебная анкета допуска',disclaimer:'Это учебная анкета и не заменяет консультацию врача.',
    privacy:'Используйте вымышленные ответы. Они остаются в памяти открытой страницы и не записываются в профиль.',
    step:'Шаг',next:'Далее',back:'Назад',check:'Проверить анкету',restart:'Заполнить анкету заново',
    age:'Возраст, лет',weight:'Вес, кг',unwell:'Сегодня вы чувствуете недомогание?',
    illness:'За последние две недели вы болели или простужались?',antibiotics:'Принимали антибиотики за последние две недели?',
    tattoo:'Делали татуировку или пирсинг за последние четыре месяца?',vaccination:'Была прививка за последние две недели?',
    pregnancy:'Вы беременны или кормите грудью?',lastDonation:'Дата последней донации (оставьте пустой, если её не было)',
    yes:'Да',no:'Нет',eligible:'Можно записаться',notEligible:'Пока нельзя',
    reasons:{
      age:`В учебном сценарии допустим возраст от ${assessmentRules.age.min} до ${assessmentRules.age.max} лет.`,weight:`В учебном сценарии требуется вес от ${assessmentRules.weight.min} кг.`,
      unwell:'В анкете указано недомогание.',illness:'В анкете указана недавняя болезнь или простуда.',
      antibiotics:'В анкете указан недавний приём антибиотиков.',tattoo:'В анкете указана недавняя татуировка или пирсинг.',
      vaccination:'В анкете указана недавняя прививка.',pregnancy:'В анкете указана беременность или грудное вскармливание.',
      lastDonation:`В учебном сценарии между донациями цельной крови должно пройти ${assessmentRules.intervalDays} дней.`
    },
    retry:'Ориентир для повторной учебной попытки',retryAfter:'Повторите учебную анкету, когда условие сценария будет выполнено.',
    retryYears:'Лет до нижней границы по учебным правилам',noRetry:'Для этих ответов учебная анкета не рассчитывает дату повтора.',
    centers:'Учебные центры',today:'Сегодня',closed:'Выходной',map:'Показать на карте',mapClose:'Закрыть карту',choose:'Выбрать центр',
    chosen:'Центр выбран',pickCenter:'Выберите учебный центр из списка.',
    days:'Ближайшие 14 дней',time:'Выберите время',places:'Свободных мест',noSlots:'Свободных слотов на ближайшие 14 дней нет.',
    noDaySlots:'На эту дату свободных слотов нет. Выберите другой день.',group:'Группа крови (необязательно)',
    profileGroup:'Демонстрационная группа крови в профиле',groupBlank:'Не указана',saveGroup:'Сохранить группу',
    urgent:'Срочная потребность',urgentDemo:'Вымышленные запросы для демонстрации. Запись проходит через учебную анкету.',
    need:'Нужна кровь',matches:'Совпадает с группой профиля',quick:'Быстрая запись',
    review:'Проверьте детали записи',submit:'Подтвердить демо-запись',minutes:'мин',ticket:'Демонстрационный талон',
    calendar:'Добавить в календарь',cancel:'Отменить запись',cancelAsk:'Отменить эту демонстрационную запись?',
    complete:'Отметить как состоявшуюся',history:'История донаций',noHistory:'Состоявшихся донаций пока нет.',
    nextDate:'Следующая дата по правилам демо',daysLeft:'Дней до записи',active:'Активна',cancelled:'Отменена',completed:'Состоялась',
    booked:'Демо-запись сохранена.',groupSaved:'Группа крови сохранена в профиле.',changed:'Статус записи уже изменился.',
    required:'Заполните поля этого шага.',lastDate:'Укажите дату последней донации, которая уже прошла, или оставьте поле пустым.',
    assessmentRequired:'Сначала пройдите учебную анкету.',
    profileRequired:'Выберите профиль, чтобы записаться.',existing:'У вас уже есть активная запись. Откройте её в профиле.',
    interval:'Дата раньше следующей возможной донации по правилам демо.',
    slotUnavailable:'Это время больше недоступно. Выберите другой слот.',
    emptyTicket:'Талон доступен из профиля, с которого сделана запись.',profile:'Открыть профиль',
    viewTicket:'Открыть талон',newBooking:'Перейти к записи',ticketNote:'Демо-талон хранит только код. Это учебная запись.',
    fallbackCenter:'Ранее выбранный учебный центр',pickGroup:'Сохраните группу в профиле, чтобы увидеть совпадения.'
  },
  kk:{
    title:'Демонстрациялық жазылу',assessment:'Оқу мақсатындағы сауалнама',disclaimer:'Бұл — оқу сауалнамасы, ол дәрігер кеңесін алмастырмайды.',
    privacy:'Ойдан шығарылған жауаптарды қолданыңыз. Олар ашық беттің жадында ғана қалады және бейінге жазылмайды.',
    step:'Қадам',next:'Келесі',back:'Артқа',check:'Сауалнаманы тексеру',restart:'Сауалнаманы қайта толтыру',
    age:'Жас, жыл',weight:'Салмақ, кг',unwell:'Бүгін өзіңізді жайсыз сезінесіз бе?',
    illness:'Соңғы екі аптада ауырдыңыз ба немесе суық тиді ме?',antibiotics:'Соңғы екі аптада антибиотик қабылдадыңыз ба?',
    tattoo:'Соңғы төрт айда татуировка немесе пирсинг жасаттыңыз ба?',vaccination:'Соңғы екі аптада екпе алдыңыз ба?',
    pregnancy:'Жүктісіз бе немесе бала емізіп жүрсіз бе?',lastDonation:'Соңғы қан тапсырған күн (тапсырмаған болсаңыз, бос қалдырыңыз)',
    yes:'Иә',no:'Жоқ',eligible:'Жазылуға болады',notEligible:'Әзірге жазылуға болмайды',
    reasons:{
      age:`Оқу сценарийінде жас шегі ${assessmentRules.age.min}–${assessmentRules.age.max} жас.`,weight:`Оқу сценарийінде салмақ кемінде ${assessmentRules.weight.min} кг болуы керек.`,
      unwell:'Сауалнамада өзіңізді жайсыз сезінетініңіз көрсетілген.',illness:'Сауалнамада жақында ауырғаныңыз көрсетілген.',
      antibiotics:'Сауалнамада жақында антибиотик қабылдағаныңыз көрсетілген.',tattoo:'Сауалнамада жақында татуировка немесе пирсинг жасатқаныңыз көрсетілген.',
      vaccination:'Сауалнамада жақында екпе алғаныңыз көрсетілген.',pregnancy:'Сауалнамада жүктілік немесе бала емізу көрсетілген.',
      lastDonation:`Оқу сценарийінде тұтас қан тапсыру аралығы ${assessmentRules.intervalDays} күн болуы керек.`
    },
    retry:'Оқу сауалнамасын қайта өтуге арналған шамамен күн',retryAfter:'Сценарий шарты орындалғанда оқу сауалнамасын қайталаңыз.',
    retryYears:'Оқу ережесіндегі ең төменгі жасқа дейінгі жыл саны',noRetry:'Бұл жауаптар үшін оқу сауалнамасы қайталау күнін есептемейді.',
    centers:'Оқу орталықтары',today:'Бүгін',closed:'Демалыс күні',map:'Картадан көрсету',mapClose:'Картаны жабу',choose:'Орталықты таңдау',
    chosen:'Орталық таңдалды',pickCenter:'Оқу орталығын тізімнен таңдаңыз.',
    days:'Алдағы 14 күн',time:'Уақытты таңдаңыз',places:'Бос орындар',noSlots:'Алдағы 14 күнде бос уақыт жоқ.',
    noDaySlots:'Таңдалған күні бос уақыт жоқ. Басқа күнді таңдаңыз.',group:'Қан тобы (міндетті емес)',
    profileGroup:'Бейіндегі демонстрациялық қан тобы',groupBlank:'Көрсетілмеген',saveGroup:'Қан тобын сақтау',
    urgent:'Шұғыл қажеттілік',urgentDemo:'Көрсету үшін ойдан шығарылған сұраулар. Жазылу оқу сауалнамасынан басталады.',
    need:'Қан қажет',matches:'Бейіндегі қан тобына сәйкес',quick:'Жылдам жазылу',
    review:'Жазылу деректерін тексеріңіз',submit:'Демо жазылуды растау',minutes:'мин',ticket:'Демонстрациялық талон',
    calendar:'Күнтізбеге қосу',cancel:'Жазылудан бас тарту',cancelAsk:'Осы демонстрациялық жазылудан бас тартасыз ба?',
    complete:'Өтті деп белгілеу',history:'Қан тапсыру тарихы',noHistory:'Өткен қан тапсыру жазбалары әзірге жоқ.',
    nextDate:'Демо ережесі бойынша келесі күн',daysLeft:'Жазылуға қалған күн',active:'Белсенді',cancelled:'Бас тартылды',completed:'Өтті',
    booked:'Демо жазылу сақталды.',groupSaved:'Қан тобы бейінге сақталды.',changed:'Жазылу күйі бұрын өзгерген.',
    required:'Осы қадамның өрістерін толтырыңыз.',lastDate:'Өткен қан тапсыру күнін көрсетіңіз немесе өрісті бос қалдырыңыз.',
    assessmentRequired:'Алдымен оқу сауалнамасын толтырыңыз.',
    profileRequired:'Жазылу үшін бейінді таңдаңыз.',existing:'Белсенді жазылуыңыз бар. Оны бейініңізден ашыңыз.',
    interval:'Таңдалған күн демо ережесіндегі келесі қан тапсыру күнінен ерте.',
    slotUnavailable:'Бұл уақыт енді қолжетімді емес. Басқа уақытты таңдаңыз.',
    emptyTicket:'Талон жазылу жасалған бейінде қолжетімді.',profile:'Бейінді ашу',
    viewTicket:'Талонды ашу',newBooking:'Жазылуға өту',ticketNote:'Демо талонда тек код сақталады. Бұл — оқу мақсатындағы жазылу.',
    fallbackCenter:'Бұрын таңдалған оқу орталығы',pickGroup:'Сәйкес сұрауларды көру үшін қан тобын бейінге сақтаңыз.'
  }
};

const base='/directions/donation';
const ticketPath=number=>base+'/result?ticket='+encodeURIComponent(number);
const newDraft=()=>({step:0,answers:{},centerId:'',mapId:'',day:'',time:'',group:null,assessment:null,feedback:null});
let draft=newDraft();
let busy=false;
let accountFeedback=null;
let ticketNumber='';

export function resetDonationDraft(keepDraft=false){
  if(!keepDraft)draft=newDraft();
  accountFeedback=null;
  ticketNumber='';
}
export function openDonationPath(url){
  const center=donorCenter(url.searchParams.get('center'));
  if(center && draft.centerId!==center.id)Object.assign(draft,{centerId:center.id,day:'',time:''});
  ticketNumber=url.searchParams.get('ticket') || '';
}

const button=(label,action,value='',style='button secondary',disabled=false)=>`<button type="button" class="${style}" data-action="${action}"${value?` data-id="${e(value)}"`:''}${disabled?' disabled':''}>${label}</button>`;
const radio=(label,key,value,checked)=>`<label><input type="radio" name="${key}" value="${value}"${checked?' checked':''}> ${label}</label>`;
const centerLabel=(lang,row)=>donorCenter(row.centerId)?.name[lang] || copy[lang].fallbackCenter;
const visitTime=(lang,row)=>scheduleDate(lang,row.date)+' · '+row.time;
const historyLink=(label)=>`<a class="text-link" href="/account#donation" data-link>${label}</a>`;

function notice(lang,result,issue=''){
  const w=copy[lang];
  if(!result && !issue)return '';
  const code=result?.code || issue;
  const text=w[code] || storageText[lang][code];
  if(!text)return '';
  return `<p class="${result?.ok?'success':'donor-hub-error'}" role="${result?.ok?'status':'alert'}">${text} ${code==='existing'?historyLink(w.profile):''}</p>`;
}

function questionnaire(lang) {
  const w=copy[lang], values=draft.answers, step=draft.step;
  const field=key=>{
    if(key==='age' || key==='weight')return `<label>${w[key]}<input name="${key}" type="number" min="1" step="${key==='age'?'1':'0.1'}" value="${e(values[key])}"></label>`;
    if(key==='lastDonation')return `<label>${w[key]}<input name="lastDonation" type="date" max="${donorToday()}" value="${e(values[key])}"></label>`;
    return `<fieldset class="donor-hub-field"><legend>${w[key]}</legend><div class="donor-choice-row">
      ${radio(w.yes,key,'yes',values[key]==='yes')}${radio(w.no,key,'no',values[key]==='no')}
    </div></fieldset>`;
  };
  return `<h3>${w.assessment}</h3><p>${w.privacy}</p><p class="donor-small-label">${w.step} ${step+1} / ${assessmentSteps.length}</p>
    <form id="donor-assessment" class="donor-visit-fields" novalidate>
      ${assessmentSteps[step].map(field).join('')}
      <div class="donor-choice-row">${step?button(w.back,'donor-assessment-back'):''}
      <button class="button donor-submit" type="submit">${step+1===assessmentSteps.length?w.check:w.next}</button></div>
    </form>`;
}

function refusal(lang){
  const w=copy[lang], result=draft.assessment;
  const retry=result.retry?`${w.retry} · ${scheduleDate(lang,result.retry)} (${result.retry})`
    :result.retryYears?`${w.retryYears} · ${result.retryYears}`
    :result.reason==='weight' || result.reason==='pregnancy'?w.retryAfter:w.noRetry;
  return `<div class="demo-notice donor-assessment-result" role="status" data-assessment="refused">
    <h3>${w.notEligible}</h3><p>${w.reasons[result.reason] || w.required}</p><p>${retry}</p>
  </div>${button(w.restart,'donor-assessment-reset')}`;
}

function groupField(lang,selected,label,id) {
  const w=copy[lang];
  return `<label>${label}<select id="${id}" name="group"><option value="">${w.groupBlank}</option>
    ${bloodGroups.map(group=>`<option value="${group}"${selected===group?' selected':''}>${group}</option>`).join('')}</select></label>`;
}

export function renderDonationCenters(lang,profileId) {
  const w=copy[lang], group=donorBloodGroup(readDonorHistory(profileId).rows);
  return `<section id="donor-center-search" class="donor-hub-center" aria-labelledby="donor-centers-title">
    <h2 id="donor-centers-title">${w.centers}</h2>
    ${donorCenters.map(center=>{
      const hours=donorSchedule(center,[])[0].hours;
      const shown=draft.mapId===center.id;
      return `<article class="donor-center-record" data-center="${center.id}">
        <h3>${center.name[lang]}</h3><p class="donor-center-address">${center.address[lang]}</p>
        <p>${w.today} · ${hours?hours.join('–'):w.closed}</p><div class="donor-choice-row">
          ${button(draft.centerId===center.id?w.chosen:w.choose,'donor-center-select',center.id)}
          ${button(shown?w.mapClose:w.map,'donor-visit-map',center.id,'text-button')}
        </div>
        ${shown?`<iframe class="donor-center-map" title="${w.map} · ${center.name[lang]}" loading="lazy" src="${mapEmbedUrl(center.lat,center.lon)}"></iframe>`:''}
      </article>`;
    }).join('')}
    <section class="donor-needs" aria-labelledby="donor-needs-title"><h3 id="donor-needs-title">${w.urgent}</h3><p>${w.urgentDemo}</p>
      ${urgentNeeds.map(need=>`<article class="donor-center-record${need.group===group?' is-match':''}" data-need="${need.centerId}">
        <strong>${w.need} ${need.group}</strong><p>${donorCenter(need.centerId).name[lang]}</p>
        ${need.group===group?`<p>${w.matches}</p>${button(w.quick,'donor-center-select',need.centerId,'button donor-submit')}`:''}
      </article>`).join('')}
      ${!group && profileId?`<p>${w.pickGroup} ${historyLink(w.profile)}</p>`:''}
    </section>
  </section>`;
}

function picker(lang,history) {
  const w=copy[lang], center=donorCenter(draft.centerId), next=nextDonorDate(history);
  if(!center)return `<p role="status">${w.pickCenter} <a class="text-link" href="#donor-center-search">${w.centers}</a></p>`;
  const all=readAllDonorRecords();
  if(all.issue)return notice(lang,null,all.issue);
  const now=Date.now(), schedule=donorSchedule(center,all.rows,now,next);
  const first=schedule.find(day=>day.times.some(slot=>slot.available));
  const selected=schedule.find(day=>day.date===draft.day) || first;
  return `<h3>${center.name[lang]}</h3>${next?`<p>${w.nextDate} · ${next}</p>`:''}
    <fieldset class="donor-booking-field"><legend>${w.days}</legend><div class="donor-day-strip donor-visit-days">
      ${schedule.map(day=>`<button type="button" class="donor-day" data-action="donor-visit-day" data-id="${day.date}"
        aria-pressed="${day.date===selected?.date}" aria-label="${day.date} · ${scheduleDate(lang,day.date)}"${day.times.some(slot=>slot.available)?'':' disabled'}>
        <span>${scheduleDate(lang,day.date,{weekday:'short'})}</span><strong>${Number(day.date.slice(-2))}</strong><small>${scheduleDate(lang,day.date,{month:'short'})}</small>
      </button>`).join('')}
    </div></fieldset>
    ${!first?`<p role="status">${w.noSlots}</p>`:`
      <fieldset class="donor-booking-field"><legend>${w.time}</legend><div class="donor-time-strip">
        ${selected?.times.map(slot=>`<button type="button" class="donor-time-slot" data-action="donor-visit-time" data-id="${selected.date}T${slot.time}"
          aria-pressed="${draft.day===selected.date && draft.time===slot.time}"${slot.available?'':' disabled'}>${slot.time}<small>${w.places} ${slot.remaining}</small></button>`).join('') || ''}
      </div></fieldset>
      ${selected && !selected.times.some(slot=>slot.available)?`<p role="status">${w.noDaySlots}</p>`:''}
      <div class="donor-visit-fields">${groupField(lang,draft.group ?? donorBloodGroup(history),w.group,'donor-visit-group')}</div>
      ${button(w.next,'donor-visit-review','','button donor-submit',!draft.time)}
    `}`;
}

export function renderDonationFlow(lang,profileId) {
  const w=copy[lang], {rows,issue}=readDonorHistory(profileId), active=rows.some(row=>row.type==='booking'&&donorStatus(row)==='active');
  const center=donorCenter(draft.centerId);
  let body;
  if(active)body=notice(lang,{ok:false,code:'existing'});
  else if(draft.step<assessmentSteps.length)body=questionnaire(lang);
  else if(!draft.assessment?.ok)body=refusal(lang);
  else if(draft.step===4 && center){
    body=`<h3>${w.review}</h3><p><strong>${center.name[lang]}</strong> · ${center.address[lang]}</p>
      <p>${visitTime(lang,{date:draft.day,time:draft.time})} · ${center.duration} ${w.minutes}</p>
      ${(draft.group ?? donorBloodGroup(rows))?`<p>${w.group} · ${e(draft.group ?? donorBloodGroup(rows))}</p>`:''}
      ${demoSaveNote(lang)}
      <div class="donor-choice-row">${button(w.back,'donor-visit-edit')}${button(w.submit,'donor-visit-book','','button donor-submit',busy)}</div>`;
  }else body=`<p class="success" role="status" data-assessment="eligible">${w.eligible}</p>${picker(lang,rows)}${button(w.restart,'donor-assessment-reset')}`;
  return `<section class="donor-hub-booking" id="donor-booking" aria-labelledby="donor-hub-booking-title">
    <h2 id="donor-hub-booking-title">${w.title}</h2><p class="demo-notice">${w.disclaimer}</p>
    ${notice(lang,active && draft.feedback?.code==='existing'?null:draft.feedback,issue)}${body}
  </section>`;
}

function ticketActions(lang,record) {
  const w=copy[lang];
  return `<div class="donor-choice-row">${button(w.calendar,'donor-calendar',record.number)}
    ${button(w.cancel,'donor-visit-cancel',record.number,'button secondary',busy)}</div>`;
}

export function renderDonationTicket(lang,profileId) {
  const w=copy[lang], {rows,issue}=readDonorHistory(profileId);
  const record=rows.find(row=>row.type==='booking' && row.number===ticketNumber)
    || (!ticketNumber && rows.find(row=>row.type==='booking' && donorStatus(row)==='active'));
  if(!record)return `${notice(lang,null,issue)}<p>${w.emptyTicket}</p>${historyLink(w.profile)}`;
  const status=donorStatus(record), code=record.ticketCode || record.number.slice(0,17);
  return `<section class="panel donor-ticket" aria-labelledby="donor-ticket-title">
    <div><h2 id="donor-ticket-title">${w.ticket}</h2>
      ${notice(lang,accountFeedback,issue)}
      <p><strong>${centerLabel(lang,record)}</strong></p><p>${visitTime(lang,record)} · ${w[status]}</p>
      ${record.group?`<p>${w.group} · ${e(record.group)}</p>`:''}
      <p><strong class="donor-ticket-code">${e(code)}</strong></p><p>${w.ticketNote}</p>
      ${status==='active'?ticketActions(lang,record):''}${historyLink(w.profile)}
    </div>${renderTicketQr(code)}
  </section>`;
}

export function renderDonationAccount(lang,profileId) {
  const w=copy[lang], {rows,issue}=readDonorHistory(profileId);
  const bookings=rows.filter(row=>row.type==='booking'), completed=bookings.filter(row=>donorStatus(row)==='completed')
    .sort((a,b)=>(b.donatedOn || b.date).localeCompare(a.donatedOn || a.date));
  const active=bookings.filter(row=>donorStatus(row)==='active'), cancelled=bookings.filter(row=>donorStatus(row)==='cancelled');
  const next=nextDonorDate(rows);
  return `${notice(lang,accountFeedback,issue)}
    <form id="donor-profile-group-form" class="donor-visit-fields">
      ${groupField(lang,donorBloodGroup(rows),w.profileGroup,'donor-profile-group')}
      <button class="button secondary" type="submit"${busy?' disabled':''}>${w.saveGroup}</button>
    </form>
    ${active.map(record=>`<article class="request-card donor-active" data-visit-status="active">
      <strong>${w.active} · ${centerLabel(lang,record)}</strong><p>${visitTime(lang,record)}</p>
      <p>${w.daysLeft} · ${donorDaysUntil(record.date)}</p>
      <p><a class="text-link" href="${ticketPath(record.number)}" data-link>${w.viewTicket}</a></p>
      ${ticketActions(lang,record)}${button(w.complete,'donor-visit-complete',record.number,'text-button',busy)}
    </article>`).join('')}
    <h3>${w.history}</h3>${next?`<p>${w.nextDate} · <time datetime="${next}">${next}</time></p>`:''}
    ${completed.length?`<ul>${completed.map(record=>`<li data-visit-status="completed"><time datetime="${record.donatedOn}">${record.donatedOn}</time> · ${centerLabel(lang,record)}</li>`).join('')}</ul>`:`<p>${w.noHistory}</p>`}
    ${cancelled.map(record=>`<article class="request-card" data-visit-status="cancelled"><strong>${w.cancelled} · ${centerLabel(lang,record)}</strong><p>${visitTime(lang,record)}</p></article>`).join('')}
    <p><a class="text-link" href="${base}#donor-booking" data-link>${w.newBooking}</a></p>`;
}

export function donationInput(element) {
  if(element.form?.id==='donor-assessment' && assessmentFields.includes(element.name)){
    draft.answers[element.name]=element.value;
    return true;
  }
  if(element.id==='donor-visit-group'){draft.group=element.value;return true;}
  return false;
}

async function act(action,profileId,values,render,navigate) {
  if(busy)return;
  busy=true;
  let result;
  try{result=await updateDonor(()=>changeDonorBooking(action,profileId,values));}
  catch{result={ok:false,code:'saveFailed'};}
  finally{busy=false;}
  if(action==='book'){
    if(result.ok){
      draft=newDraft();
      accountFeedback=result;
      navigate(ticketPath(result.record.number));
      return;
    }
    draft.feedback=result;
    if(result.code==='slotUnavailable' || result.code==='interval'){draft.step=3;draft.time='';}
    if(result.code==='assessmentRequired')draft.step=0;
  }else accountFeedback=result;
  render();
}

export function donationSubmit(form,profileId,render,navigate) {
  if(form.id==='donor-profile-group-form'){
    void act('group',profileId,{group:new FormData(form).get('group')},render,navigate);
    return true;
  }
  if(form.id!=='donor-assessment' || !assessmentSteps[draft.step])return false;
  const step=draft.step;
  const values=new FormData(form);
  for(const key of assessmentSteps[step])draft.answers[key]=values.get(key) || '';
  if(!validAssessmentStep(step,draft.answers)){
    draft.feedback={ok:false,code:assessmentSteps[step].includes('lastDonation')?'lastDate':'required'};
    render();
    return true;
  }
  draft.feedback=null;
  draft.step++;
  if(draft.step===assessmentSteps.length){
    const last=latestDonation(readDonorHistory(profileId).rows);
    draft.assessment=assessDonation({...draft.answers,lastDonation:last>draft.answers.lastDonation?last:draft.answers.lastDonation});
  }
  render();
  return true;
}

export function donationAction(action,id,lang,profileId,render,navigate) {
  switch(action){
    case 'donor-assessment-back': draft.step=Math.max(0,draft.step-1);break;
    case 'donor-assessment-reset': draft={...newDraft(),centerId:draft.centerId};break;
    case 'donor-visit-map': draft.mapId=draft.mapId===id?'':id;break;
    case 'donor-center-select':
      if(!donorCenter(id))return false;
      Object.assign(draft,{centerId:id,day:'',time:''});
      if(draft.step===4)draft.step=3;
      render();
      globalThis.document?.getElementById?.('donor-booking')?.scrollIntoView({block:'start'});
      return true;
    case 'donor-visit-day': Object.assign(draft,{day:id,time:''});break;
    case 'donor-visit-time': [draft.day,draft.time]=id.split('T');break;
    case 'donor-visit-review':
      if(!draft.assessment?.ok || !draft.time || !draft.day || !donorCenter(draft.centerId))return false;
      draft.step=4;
      break;
    case 'donor-visit-edit': draft.step=3;break;
    case 'donor-visit-book':
      void act('book',profileId,{centerId:draft.centerId,date:draft.day,time:draft.time,answers:{...draft.answers},
        group:draft.group ?? donorBloodGroup(readDonorHistory(profileId).rows)},render,navigate);
      return true;
    case 'donor-visit-complete':
    case 'donor-visit-cancel':
      if(action==='donor-visit-cancel' && typeof window.confirm==='function' && !window.confirm(copy[lang].cancelAsk))return true;
      void act(action==='donor-visit-cancel'?'cancel':'complete',profileId,{number:id},render,navigate);
      return true;
    case 'donor-calendar': {
      const record=readDonorHistory(profileId).rows.find(row=>row.type==='booking' && row.number===id && donorStatus(row)==='active');
      if(!record){accountFeedback={ok:false,code:'changed'};render();return true;}
      const place=donorCenter(record.centerId);
      const content=donationCalendar(record,{title:copy[lang].title,location:place?.address[lang] || centerLabel(lang,record)});
      const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
      const anchor=document.createElement('a');
      anchor.href=url;
      anchor.download='janashyr-'+record.number+'.ics';
      anchor.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      return true;
    }
    default: return false;
  }
  draft.feedback=null;
  render();
  return true;
}

export function donorScheduleSummary(lang,bookingNote){
  const center=donorCenters[0], now=Date.now();
  const {rows,issue}=readAllDonorRecords();
  const days=issue?[]:donorSchedule(center,rows,now).filter(day=>day.times.some(slot=>slot.available)).slice(0,3);
  return [center.name[lang],center.address[lang],...days.map(day=>
    scheduleDate(lang,day.date)+': '+day.times.filter(slot=>slot.available).slice(0,4).map(slot=>slot.time).join(', ')),
    days.length?bookingNote:copy[lang].noSlots].join('\n');
}
