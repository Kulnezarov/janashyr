import {escapeText as e,getProfiles,profileName,storageText} from './profiles.js';
import {helpPlace,scheduleDate,scheduleTimestamp} from './ui.js';
import {subjects,formats,lessonToday,lessonStart,lessonEnd,lessonState,availableLessons,
  lessonRating,lessonNotifications,changeLesson,updateEducation} from './education-data.js';

const copy = {
  kk:{
    catalog:'Сабақтар кестесі',demo:'Демонстрациялық сабақтар осы браузерде сақталады. Көрсетілген уақыт — Шымкент уақыты.',
    schedule:'Менің сабақ кестем',requests:'Өтінімдер',students:'Менің оқушыларым',mine:'Менің жазбаларым',
    subject:'Пән',format:'Формат',date:'Күні',time:'Басталу уақыты',duration:'Ұзақтығы (минут)',minutes:'мин',
    place:'Кездесу орны',library:'Демо кітапхана',community:'Демо қауымдастық орталығы',link:'Демо сілтеме',
    add:'Сабақ уақытын қосу',remove:'Жою',free:'Бос',occupied:'Бос емес',book:'Жазылу',any:'Барлығы',
    filter:'Көрсету',reset:'Сүзгілерді тазарту',empty:'Сәйкес сабақ уақыты табылмады',back:'Сабақтар кестесін ашу',
    noSchedule:'Сабақ уақыты әлі қосылмаған.',noRequests:'Жаңа өтінімдер жоқ.',noStudents:'Расталған жазбалар жоқ.',
    noBookings:'Сабаққа жазбалар әлі жоқ.',noReviews:'Пікірлер әлі жоқ',rating:'Рейтинг',reviews:'Пікір саны',
    slotDetails:'Сабақ туралы',comment:'Оқушының түсініктемесі',commentOptional:'Ұстазға түсініктеме (міндетті емес)',
    reason:'Бас тарту себебі',reasonOptional:'Бас тарту себебі (міндетті емес)',
    pending:'Растауды күтуде',confirmed:'Расталды',declined:'Қабылданбады',cancelled:'Бас тартылды',
    approve:'Растау',decline:'Қабылдамау',cancel:'Жазбадан бас тарту',cancelQuestion:'Осы сабаққа жазылудан бас тартасыз ба?',
    cancelYes:'Иә, бас тарту',close:'Жабу',review:'Пікір қалдыру',score:'Баға (1–5)',chooseScore:'Бағаны таңдаңыз',reviewText:'Пікір мәтіні (міндетті емес)',
    sendReview:'Пікірді сақтау',reviewLabel:'Пікір',notifications:'Хабарландырулар',unread:'Оқылмаған',
    read:'Оқылды',markRead:'Оқылды деп белгілеу',noNotifications:'Жаңа хабарландырулар жоқ.',
    new:'Жаңа өтінім',notificationConfirmed:'Өтінім расталды',notificationDeclined:'Өтінім қабылданбады',
    applicationSent:'Өтінім жіберілді, жауапты күтіңіз.',slotCreated:'Сабақ уақыты қосылды.',slotDeleted:'Сабақ уақыты жойылды.',
    reviewSaved:'Пікір сақталды.',notificationRead:'Хабарландыру оқылды деп белгіленді.',
    profileRequired:'Сабаққа жазылу үшін бейінді таңдаңыз.',roleRequired:'Бұл әрекетке бейіннің рөлі сәйкес келмейді.',
    invalidSlot:'Пәнді, форматты, күнді, уақытты және ұзақтықты бүтін минутпен көрсетіңіз.',
    past:'Бұл сабақтың басталу уақыты өтіп кетті.',teacherOverlap:'Бұл уақыт кестеңіздегі басқа сабақпен қабаттасады.',
    studentOverlap:'Бұл уақыт сіздің басқа жазбаңызбен қабаттасады.',missingSlot:'Бұл сабақ уақыты енді қолжетімді емес.',
    missingBooking:'Жазба табылмады.',changed:'Жазбаның күйі өзгерген. Тізімді тексеріңіз.',
    reviewUnavailable:'Пікірді расталған сабақ өткеннен кейін бір рет қалдыруға болады.',invalidReview:'1–5 аралығында баға таңдаңыз.',
    busy:'Сақталуда…',taken:'Бұл сабақ уақыты бос емес.'
  },
  ru:{
    catalog:'Каталог занятий',demo:'Демонстрационные занятия хранятся в этом браузере. В расписании указано время Шымкента.',
    schedule:'Моё расписание',requests:'Заявки',students:'Мои ученики',mine:'Мои записи',
    subject:'Предмет',format:'Формат',date:'Дата',time:'Время начала',duration:'Длительность (минуты)',minutes:'мин',
    place:'Место встречи',library:'Демо-библиотека',community:'Демо-центр сообщества',link:'Ссылка-заглушка',
    add:'Добавить слот',remove:'Удалить',free:'Свободен',occupied:'Занят',book:'Записаться',any:'Все',
    filter:'Показать',reset:'Сбросить фильтры',empty:'Нет подходящих слотов',back:'Открыть каталог занятий',
    noSchedule:'Свободное время ещё не добавлено.',noRequests:'Новых заявок нет.',noStudents:'Подтверждённых записей нет.',
    noBookings:'Записей на занятия пока нет.',noReviews:'Отзывов пока нет',rating:'Рейтинг',reviews:'Число отзывов',
    slotDetails:'О занятии',comment:'Комментарий ученика',commentOptional:'Комментарий учителю (необязательно)',
    reason:'Причина отказа',reasonOptional:'Причина отказа (необязательно)',
    pending:'Ожидает подтверждения',confirmed:'Подтверждена',declined:'Отклонена',cancelled:'Отменена',
    approve:'Подтвердить',decline:'Отклонить',cancel:'Отменить запись',cancelQuestion:'Отменить запись на это занятие?',
    cancelYes:'Да, отменить',close:'Закрыть',review:'Оставить отзыв',score:'Оценка (1–5)',chooseScore:'Выберите оценку',reviewText:'Текст отзыва (необязательно)',
    sendReview:'Сохранить отзыв',reviewLabel:'Отзыв',notifications:'Уведомления',unread:'Непрочитанных',
    read:'Прочитано',markRead:'Отметить прочитанным',noNotifications:'Уведомлений пока нет.',
    new:'Новая заявка',notificationConfirmed:'Заявка подтверждена',notificationDeclined:'Заявка отклонена',
    applicationSent:'Заявка отправлена, ожидайте ответа.',slotCreated:'Слот добавлен в расписание.',slotDeleted:'Слот удалён.',
    reviewSaved:'Отзыв сохранён.',notificationRead:'Уведомление отмечено прочитанным.',
    profileRequired:'Выберите профиль, чтобы записаться.',roleRequired:'Для этого действия нужен профиль с подходящей ролью.',
    invalidSlot:'Укажите предмет, формат, дату, время и положительную длительность в целых минутах.',
    past:'Время начала этого занятия уже прошло.',teacherOverlap:'Этот слот пересекается с другим занятием в вашем расписании.',
    studentOverlap:'В это время у вас уже есть другая запись.',missingSlot:'Этот слот больше недоступен.',
    missingBooking:'Запись не найдена.',changed:'Статус записи изменился. Проверьте список.',
    reviewUnavailable:'Отзыв можно оставить один раз после окончания подтверждённого занятия.',invalidReview:'Выберите оценку от 1 до 5.',
    busy:'Сохраняем…',taken:'Этот слот уже занят.'
  }
};

const emptyFilters = () => ({subject:'',format:'',date:''});
const state = {filters:emptyFilters(),draft:{},modal:null,feedback:null,busy:false};
const translate = (lang,value) => value?.[lang==='kk'?0:1] ?? '';
const name = (lang,people,id) => people.has(id) ? profileName(people.get(id),lang) : id;
const peopleIndex = () => new Map(getProfiles().map(profile=>[profile.id,profile]));
const subject = (slot,lang) => translate(lang,subjects[slot.subject]);
const lessonTime = (slot,lang) => scheduleDate(lang,slot.date)+' · '+slot.time+' · '+slot.duration+' '+copy[lang].minutes;
const stateFor = message => message?.code==='occupied' && !message.ok?'taken':message?.code;

export function clearLessonView(profileChanged=false) {
  state.modal=null;
  state.feedback=null;
  if(profileChanged)state.draft={};
}

function notice(lang,message,issue) {
  const text=message ? copy[lang][stateFor(message)] || storageText[lang][message.code] : storageText[lang][issue];
  if(!text)return '';
  return `<p class="${message?.ok?'success':'edu-notice'}" role="${message?.ok?'status':'alert'}">${text}</p>`;
}

function field(label,key,options,selected,empty) {
  return `<label>${label}<select name="${key}">${empty?`<option value="">${empty}</option>`:''}${Object.entries(options).map(([value,text])=>
    `<option value="${value}"${selected===value?' selected':''}>${text}</option>`
  ).join('')}</select></label>`;
}

const choices = (lang,values) => Object.fromEntries(Object.entries(values).map(([key,value])=>[key,translate(lang,value)]));

function button(label,action,slot,booking,className='button secondary') {
  return `<button type="button" class="${className}" data-action="${action}"${slot?` data-id="${e(slot.id)}"`:''}${booking?` data-booking="${e(booking.id)}"`:''}>${label}</button>`;
}

const status = (lang,key) => `<span class="lesson-status" data-status="${key}">${copy[lang][key]}</span>`;
const detail = (label,text) => text ? `<p><strong>${label}</strong> · ${e(text)}</p>` : '';

function venue(lang,slot) {
  return slot.format==='local'
    ? detail(copy[lang].place,helpPlace(lang,slot.location))
    : detail(copy[lang].link,slot.location);
}

export function renderLessonCatalog(lang,profile) {
  const w=copy[lang], now=Date.now(), {slots,issue}=lessonState(now), people=peopleIndex(), filters=state.filters;
  const available=availableLessons(slots,filters,now);
  return `<section id="lesson-catalog" class="edu-directory lesson-catalog" aria-labelledby="lesson-catalog-title">
    <h2 id="lesson-catalog-title">${w.catalog}</h2><p>${w.demo}</p>
    <form id="lesson-filters" class="lesson-fields edu-filters">
      ${field(w.subject,'subject',choices(lang,subjects),filters.subject,w.any)}
      ${field(w.format,'format',choices(lang,formats),filters.format,w.any)}
      <label>${w.date}<input type="date" name="date" value="${e(filters.date)}"></label>
      <div class="lesson-actions"><button class="edu-button edu-button-accent" type="submit">${w.filter}</button>${button(w.reset,'lesson-reset',null,null,'edu-button edu-button-neutral')}</div>
    </form>
    ${notice(lang,state.feedback,issue)}
    ${available.length?`<div class="lesson-grid">${available.map(slot=>{
      const rating=lessonRating(slots,slot.teacherId);
      const value=new Intl.NumberFormat(lang==='kk'?'kk-KZ':'ru-RU',{minimumFractionDigits:1,maximumFractionDigits:1}).format(rating.average);
      return `<article class="request-card lesson-card" data-slot="${e(slot.id)}">
        <h3>${subject(slot,lang)}</h3><p>${e(name(lang,people,slot.teacherId))} · ${translate(lang,formats[slot.format])}</p>
        <p>${lessonTime(slot,lang)}</p><p class="lesson-rating">${rating.count?`${w.rating} ${value} / 5 · ${w.reviews.toLowerCase()} ${rating.count}`:w.noReviews}</p>
        ${button(w.book,'lesson-open',slot,null,'edu-button edu-button-accent')}
      </article>`;
    }).join('')}</div>`:`<p class="edu-empty" role="status">${w.empty}</p>`}
    ${profile?.role==='learner'?`<p><a class="text-link" href="/account#education-history" data-link>${w.mine}</a></p>`:''}
  </section>`;
}

function teacherSchedule(lang,slots) {
  const w=copy[lang], groups=new Map();
  for(const slot of slots){
    if(!groups.has(slot.date))groups.set(slot.date,[]);
    groups.get(slot.date).push(slot);
  }
  return groups.size ? [...groups].map(([date,rows])=>`<div class="lesson-day">
    <h4>${scheduleDate(lang,date)} · <time datetime="${date}">${date.slice(0,4)}</time></h4>
    ${rows.map(slot=>`<article class="request-card lesson-card" data-slot="${e(slot.id)}">
      <h5>${subject(slot,lang)} · ${slot.time}</h5>
      <p>${translate(lang,formats[slot.format])} · ${slot.duration} ${w.minutes}</p>
      ${status(lang,slot.status)}
      ${slot.status==='free'?button(w.remove,'lesson-delete',slot):''}
    </article>`).join('')}
  </div>`).join('') : `<p>${w.noSchedule}</p>`;
}

function bookingCard(lang,slot,booking,person,actions,showVenue=false) {
  const w=copy[lang];
  return `<article class="request-card lesson-card" data-booking-row="${e(booking.id)}">
    <h4>${subject(slot,lang)} · ${e(person)}</h4><p>${lessonTime(slot,lang)} · ${translate(lang,formats[slot.format])}</p>
    ${status(lang,booking.status)}
    ${showVenue?venue(lang,slot):''}
    ${detail(w.comment,booking.comment)}${detail(w.reason,booking.reason)}
    ${booking.review?detail(w.reviewLabel,booking.review.rating+' / 5'+(booking.review.text?' · '+booking.review.text:'')):''}
    ${actions?`<div class="lesson-actions">${actions}</div>`:''}
  </article>`;
}

export function renderLessonProfile(lang,profile) {
  if(!['teacher','learner'].includes(profile.role))return '';
  const w=copy[lang], now=Date.now(), {slots,issue}=lessonState(now), people=peopleIndex();
  const teacher=profile.role==='teacher';
  const records=slots.flatMap(slot=>slot.bookings.map(booking=>({slot,booking}))).filter(({booking})=>
    profile.id===(teacher?booking.teacherId:booking.studentId));
  const draft=state.draft;
  if(!teacher)return `<section class="account-list lesson-workspace" aria-labelledby="lesson-mine-title">
    <h2 id="lesson-mine-title">${w.mine}</h2><a class="text-link" href="/directions/support/education#lesson-catalog" data-link>${w.back}</a>
    ${notice(lang,state.feedback,issue)}
    ${records.length?records.map(({slot,booking})=>{
      let actions='';
      if(['pending','confirmed'].includes(booking.status) && lessonStart(slot)>now)actions=button(w.cancel,'lesson-cancel',slot,booking);
      else if(booking.status==='confirmed' && lessonEnd(slot)<=now && !booking.review)actions=button(w.review,'lesson-review',slot,booking,'button primary');
      return bookingCard(lang,slot,booking,name(lang,people,booking.teacherId),actions,booking.status==='confirmed');
    }).join(''):`<p>${w.noBookings}</p>`}
  </section>`;
  const incoming=records.filter(({booking})=>booking.status==='pending');
  const confirmed=records.filter(({booking})=>booking.status==='confirmed');
  return `<section class="account-list lesson-workspace" aria-labelledby="lesson-schedule-title">
    <h2 id="lesson-schedule-title">${w.schedule}</h2><p>${w.demo}</p>${notice(lang,state.feedback,issue)}
    <form id="lesson-create" class="lesson-fields" novalidate>
      ${field(w.subject,'subject',choices(lang,subjects),draft.subject)}
      ${field(w.format,'format',choices(lang,formats),draft.format)}
      <label>${w.date}<input type="date" name="date" min="${lessonToday(now)}" value="${e(draft.date)}" required></label>
      <label>${w.time}<input type="time" name="time" value="${e(draft.time)}" required></label>
      <label>${w.duration}<input type="number" name="duration" min="1" value="${e(draft.duration ?? 45)}" required></label>
      <label data-lesson-location${draft.format==='local'?'':' hidden'}>${w.place}<select name="location">
        <option value="library">${w.library}</option><option value="community"${draft.location==='community'?' selected':''}>${w.community}</option>
      </select></label>
      <button class="button primary" type="submit"${state.busy?' disabled':''}>${w.add}</button>
    </form>
    ${teacherSchedule(lang,slots.filter(slot=>slot.teacherId===profile.id && !slot.deleted))}
    <section aria-labelledby="lesson-incoming-title"><h3 id="lesson-incoming-title">${w.requests}</h3>
      ${incoming.length?incoming.map(({slot,booking})=>bookingCard(lang,slot,booking,name(lang,people,booking.studentId),
        button(w.approve,'lesson-confirm',slot,booking,'button primary')+button(w.decline,'lesson-decline',slot,booking))).join(''):`<p>${w.noRequests}</p>`}
    </section>
    <section aria-labelledby="lesson-students-title"><h3 id="lesson-students-title">${w.students}</h3>
      ${confirmed.length?confirmed.map(({slot,booking})=>bookingCard(lang,slot,booking,name(lang,people,booking.studentId),'',true)).join(''):`<p>${w.noStudents}</p>`}
    </section>
  </section>`;
}

export function renderLessonBell(lang,profile) {
  if(!['teacher','learner'].includes(profile?.role))return '';
  const w=copy[lang], {slots}=lessonState();
  const unread=lessonNotifications(slots,profile).filter(item=>!item.read).length;
  return `<button type="button" class="lesson-bell" data-action="lesson-bell" aria-haspopup="dialog"
      aria-label="${w.notifications} · ${w.unread} ${unread}">
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>
    </svg>${unread?`<span aria-hidden="true" class="lesson-unread">${unread}</span>`:''}
  </button>`;
}

function notificationList(lang,profile) {
  const w=copy[lang], {slots,issue}=lessonState();
  const notes=lessonNotifications(slots,profile);
  return notice(lang,state.modal.feedback,issue)+(notes.length ? notes.map(({slot,booking,kind,date,read})=>`
    <article class="request-card lesson-card" data-notification="${kind}">
      <h3>${kind==='new'?w.new:kind==='confirmed'?w.notificationConfirmed:w.notificationDeclined}</h3>
      <p>${subject(slot,lang)} · ${scheduleTimestamp(lang,date)}</p>
      ${kind==='declined'?detail(w.reason,booking.reason):''}
      ${read?`<p>${w.read}</p>`:button(w.markRead,'lesson-read',slot,booking)}
    </article>`).join('') : `<p>${w.noNotifications}</p>`)+
    `<p><a class="text-link" href="/account#education-history" data-link>${profile?.role==='teacher'?w.requests:w.mine}</a></p>`;
}

export function renderLessonDialog(lang,profile) {
  const modal=state.modal;
  if(!modal)return '';
  const w=copy[lang], {kind,slot,values,feedback}=modal;
  const titles={bell:w.notifications,book:w.slotDetails,cancel:w.cancel,decline:w.decline,review:w.review};
  let body;
  if(kind==='bell')body=notificationList(lang,profile)+button(w.close,'lesson-close');
  else {
    const fields={
      book:`<label>${w.commentOptional}<textarea name="comment" rows="3" maxlength="300">${e(values.comment)}</textarea></label>`,
      decline:`<label>${w.reasonOptional}<textarea name="reason" rows="3" maxlength="300">${e(values.reason)}</textarea></label>`,
      cancel:`<p>${w.cancelQuestion}</p>`,
      review:field(w.score,'rating',{'1':'1','2':'2','3':'3','4':'4','5':'5'},values.rating,w.chooseScore)+
        `<label>${w.reviewText}<textarea name="text" rows="3" maxlength="500">${e(values.text)}</textarea></label>`
    };
    const labels={book:w.book,decline:w.decline,cancel:w.cancelYes,review:w.sendReview};
    body=`<p><strong>${subject(slot,lang)}</strong> · ${e(name(lang,peopleIndex(),slot.teacherId))}</p>
      <p>${lessonTime(slot,lang)} · ${translate(lang,formats[slot.format])}</p>${kind==='book'?venue(lang,slot):''}
      ${notice(lang,feedback)}
      <form id="lesson-dialog-form" class="lesson-fields">
        ${fields[kind]}
        <div class="lesson-actions"><button type="submit" class="button primary"${state.busy?' disabled':''}>${state.busy?w.busy:labels[kind]}</button>
          ${button(w.close,'lesson-close')}</div>
      </form>`;
  }
  return `<dialog id="lesson-dialog" class="panel booking-profile-dialog lesson-dialog" aria-labelledby="lesson-dialog-title">
    <h2 id="lesson-dialog-title">${titles[kind]}</h2>${state.busy && kind==='bell'?`<p role="status">${w.busy}</p>`:''}${body}
  </dialog>`;
}

export function openLesson(id,profile,render) {
  if(profile?.role!=='learner'){state.feedback={ok:false,code:'profileRequired'};render();return;}
  const slot=lessonState().slots.find(row=>row.id===id && !row.deleted);
  if(slot)state.modal={kind:'book',slot,values:{},feedback:null};
  else state.feedback={ok:false,code:'missingSlot'};
  render();
}

async function act(action,profile,values,render,modal=null) {
  if(state.busy)return;
  state.busy=true;
  render();
  let result;
  try {
    result=await updateEducation(()=>changeLesson(action,profile,values));
  } catch {
    result={ok:false,code:'saveFailed'};
  } finally {
    state.busy=false;
  }
  if(modal && state.modal!==modal)return;
  if(modal && (!result.ok || modal.kind==='bell'))modal.feedback=result;
  else {
    state.feedback=result;
    if(modal)state.modal=null;
    if(action==='create' && result.ok)state.draft={};
  }
  render();
  if(result.ok && action==='book'){
    const confirmation=document.querySelector('#lesson-catalog .success');
    confirmation?.scrollIntoView({block:'nearest',behavior:'instant'});
  }
}

export function lessonClick(action,data,profile,render) {
  if(action==='lesson-reset'){
    state.filters=emptyFilters();
    state.feedback=null;
  } else if(action==='lesson-close'){
    if(state.busy)return true;
    state.modal=null;
  } else if(action==='lesson-bell'){
    state.modal={kind:'bell',feedback:null};
  } else if(['lesson-delete','lesson-confirm','lesson-read'].includes(action)){
    void act(action.slice(7),profile,{slotId:data.id,bookingId:data.booking},render,action==='lesson-read'?state.modal:null);
    return true;
  } else if(['lesson-decline','lesson-cancel','lesson-review'].includes(action)){
    const slot=lessonState().slots.find(row=>row.id===data.id);
    if(slot)state.modal={kind:action.slice(7),slot,bookingId:data.booking,values:{},feedback:null};
    else state.feedback={ok:false,code:'missingSlot'};
  } else return false;
  render();
  return true;
}

export function lessonSubmit(form,profile,render) {
  const values=Object.fromEntries(new FormData(form));
  if(form.id==='lesson-filters'){
    state.filters=values;
    state.feedback=null;
    render();
  } else if(form.id==='lesson-create'){
    state.draft=values;
    void act('create',profile,values,render);
  } else if(form.id==='lesson-dialog-form' && state.modal){
    const modal=state.modal;
    modal.values=values;
    void act(modal.kind,profile,{...values,slotId:modal.slot.id,bookingId:modal.bookingId},render,modal);
  }
}

export function lessonInput(field) {
  if(field.form?.id!=='lesson-create' || field.name!=='format')return false;
  field.form.querySelector('[data-lesson-location]').hidden=field.value!=='local';
  return true;
}
