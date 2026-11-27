import {sitePath} from './ui.js';
import {scheduleDate,scheduleTimestamp,helpPlace,timeAfter} from './ui.js';
import {readLocal,writeLocal,writeLocalObject,getProfiles,storageText} from './profiles.js';
import {supportIconPath} from './landing-sections.js';
import {pageShell,demoNotice} from './ui.js';
import {text,courses,categories,guides,reflection} from './support-content.js';
const state={requests:[],messages:[],query:'',category:'all',guideQuery:'',drafts:{consult:{},volunteer:{},chat:{}},open:new Set(),notice:'',typing:false,timer:null};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base='/directions/support';
const links=['psychology','education','digital'];
Object.assign(state,{specialty:'all',topic:'',clinician:null,bookingError:false,reflection:{step:0,answers:[]}});
const L=(s,l)=>s[l==='kk'?1:2];
const button=(label,attrs='')=>`<button class="button primary" ${attrs}>${label}</button>`;
const shell=(t,title,body)=>pageShell({base,back:t.back,kicker:t.support,title,body});
const notice=t=>demoNotice(t.demo);
const created=t=>state.notice?`<div class="success" role="status">${t[state.notice]} <a href="/account" data-link>${t.account}</a></div>`:'';
function supportHome(t, lang) {
  const kk=lang==='kk';
  const descriptions=kk
    ? ['Мамандарды бағыт бойынша қарап, демо кеңеске ыңғайлы уақытты таңдаңыз.','Математика, тілдер және цифрлық дағдылар бойынша курстарды қараңыз.','Телефон мен онлайн қызметтерді қадамдап үйреніңіз.']
    : ['Выберите специалиста по теме и удобное время для демо-консультации.','Изучайте языки, математику и цифровые навыки в своём темпе.','Разберитесь с телефоном и онлайн-сервисами по пошаговым инструкциям.'];
  const names=[t.psych,t.edu,t.digital];
  return `<main class="support-page support-landing">
    <header class="support-welcome photo-hero"><div class="wrap">
      <a class="back" href="/" data-link>${t.back}</a>
      <h1>${t.support}</h1><p>${kk?'Психологиялық қолдау, тегін оқу және цифрлық көмек. Өзіңізге керегін таңдаңыз.':'Психологическая поддержка, бесплатное обучение и цифровая помощь. Выберите, что нужно вам.'}</p>
      <a class="button primary" href="#support-options">${kk?'Қызметтерді қарау':'Посмотреть услуги'}</a>
    </div></header>
    <div class="wrap support-feature-grid" id="support-options" tabindex="-1">${links.map((slug,i)=>`<a class="support-feature feature-${slug}" href="${base}/${slug}" data-link><div><h2>${names[i]}</h2><p>${descriptions[i]}</p><span class="support-feature-arrow" aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div></a>`).join('')}</div></main>`;
}

const clinicians = [
  {id:'aida', portrait:0, name:['Айда Сәрсенова','Айда Сарсенова'], roles:['clinical','therapy'], topics:['stress','fear','burnout'], years:10, days:{1:['11:00','15:00'],3:['14:00','17:00'],6:['10:00','15:00']}},
  {id:'arman', portrait:1, name:['Арман Әлиев','Арман Алиев'], roles:['counsel','gestalt'], topics:['crisis','lonely','fear'], years:5, days:{2:['10:00','15:00'],4:['12:00','16:00'],6:['11:00','13:00']}},
  {id:'dana', portrait:2, name:['Дана Омарова','Дана Омарова'], roles:['counsel','clinical','gestalt'], topics:['stress','burnout','crisis','lonely'], years:2, days:{1:['17:00'],3:['10:00','13:00'],5:['12:00','15:00','18:00']}}
];
const psychWords = {
  kk: {
    roles:{clinical:'Клиникалық психолог',therapy:'Психотерапевт',counsel:'Психолог-кеңесші',gestalt:'Гештальт-терапевт'},
    topics:{stress:'Мазасыздық пен стресс',fear:'Қорқыныш',burnout:'Эмоциялық қажу',crisis:'Дағдарыс кезіндегі қолдау',lonely:'Жалғыздық сезімі'},
    title:'Демо мамандар', demo:'Мамандар мен олардың кестелері үлгі ретінде берілген.',
    filters:'Мамандық бойынша', all:'Барлық мамандар', helps:'Қандай мәселелермен жұмыс істейді', years:n=>`${n} жыл тәжірибе`,
    book:'Демо жазылу', survey:'Неден бастаймын?', question:'Сізге қандай тақырып бойынша қолдау керек?', suggest:'Мамандарды көрсету',
    noMatch:'Бұл сүзгіге сай маман табылмады.', reset:'Сүзгіні тазарту', schedule:'Қабылдау кестесі', zone:'Шымкент уақыты · Келесі 7 күн',
    day:'Күн', time:'Уақыт', taken:'Бос емес', confirm:'Демо жазылуды растау', invalid:'Бұл уақыт бос емес немесе өтіп кеткен. Басқа уақытты таңдаңыз.',
    intro:'Мазасыздық, стресс немесе қиын кезең кезінде қолдау іздесеңіз, осында маман таңдау мен жазылуды байқап көре аласыз.',
    local:'Жазылу осы браузерде ғана сақталады. Нақты консультация өткізілмейді.',
    count:n=>`Табылған маман саны: ${n}`,
    optional:'Тақырып бойынша іріктеу (міндетті емес)', specialist:'Маман'
  },
  ru: {
    roles:{clinical:'Клинический психолог',therapy:'Психотерапевт',counsel:'Психолог-консультант',gestalt:'Гештальт-терапевт'},
    topics:{stress:'Тревога и стресс',fear:'Страхи',burnout:'Эмоциональное выгорание',crisis:'Поддержка в кризисе',lonely:'Чувство одиночества'},
    title:'Демо-специалисты', demo:'Профили и расписания приведены для примера.',
    filters:'Специальность', all:'Все специалисты', helps:'С чем помогает', years:n=>`${n} ${n===2?'года':'лет'} опыта`,
    book:'Демо-запись', survey:'С чего начать?', question:'С каким вопросом вы хотите получить поддержку?', suggest:'Показать специалистов',
    noMatch:'По этому фильтру специалисты не найдены.', reset:'Сбросить фильтры', schedule:'Расписание консультаций', zone:'Время Шымкента · Следующие 7 дней',
    day:'Дата', time:'Время', taken:'Занято', confirm:'Подтвердить демо-запись', invalid:'Время занято или уже прошло. Выберите другое.',
    intro:'Если вы ищете поддержку в сложный период, здесь можно попробовать выбрать специалиста и записаться на консультацию.',
    local:'Запись сохраняется только в этом браузере. Реальная консультация не состоится.',
    count:n=>`Найдено специалистов: ${n}`,
    optional:'Подбор по теме (необязательно)', specialist:'Специалист'
  }
};
const clinicianName = (person, lang) => person.name[lang === 'kk' ? 0 : 1];
function clinicianDays(person, now = Date.now()) {
  const [month, day, year] = new Intl.DateTimeFormat('en-US', {
    timeZone:'Asia/Almaty', year:'numeric', month:'numeric', day:'numeric'
  }).format(now).split('/').map(Number);
  return Array.from({length:7}, (_, offset)=>{
    const date = new Date(Date.UTC(year, month-1, day+offset));
    const key = date.toISOString().slice(0,10);
    const slots = (person.days[date.getUTCDay()] || []).filter(time => Date.parse(`${key}T${time}:00+05:00`) > now);
    return {key,date,slots};
  }).filter(d => d.slots.length);
}
let supportProfileId=null, supportRole=null;
export function useSupportProfile(profile){
  endSession();
  supportProfileId=profile?.id || null;
  supportRole=profile?.role || null;
  if(supportProfileId)state.requests=readLocal('support-'+supportProfileId,[]);
}
export function saveSupportProfile(){
  if(supportProfileId)writeLocal('support-'+supportProfileId,state.requests.map(({subject,...entry})=>entry));
}
const isBooked = (id,date,time) => {
  const otherRequests=getProfiles().filter(p=>p.id!==supportProfileId).flatMap(p=>readLocal('support-'+p.id,[]));
  return [...state.requests,...otherRequests].some(r => r.clinician===id && r.date===date && r.time===time && !r.cancelled);
};
const closedSlots = id => readLocal('clinician-closed-'+id,[]);
const isClosed = (id,slot) => closedSlots(id).includes(slot);
const isTaken = (id,date,time) => isClosed(id,date+'T'+time) || isBooked(id,date,time);


function booking(t, lang, person) {
  const w = psychWords[lang];
  const fmt = {format: date => scheduleDate(lang,date)};
  const name = clinicianName(person, lang);
  return `<dialog class="psych-booking" id="psych-booking" aria-labelledby="psych-booking-title">
    <button class="psych-close" type="button" data-action="psych-close" aria-label="${t.close}" autofocus>×</button>
    <h2 id="psych-booking-title">${w.schedule}</h2><p><strong>${name}</strong> · ${w.zone}</p>
    ${created(t)}
    ${state.notice==='success'?'':`<form id="consult-form" data-clinician="${person.id}">
      <fieldset class="booking-format"><legend>${t.format}</legend>
        ${[['online',t.online],['offline',t.offline]].map(([id,label])=>`<label><input type="radio" name="format" value="${id}" ${(state.drafts.consult.format||'online')===id?'checked':''}><span>${label}</span></label>`).join('')}
      </fieldset>
      <p class="psych-meeting">${helpPlace(lang,'library')}</p>
      <table class="psych-slots">
        <thead><tr><th scope="col">${w.day}</th><th scope="col">${w.time}</th></tr></thead>
        <tbody>${clinicianDays(person).map(({key,date,slots})=>`<tr><th scope="row">${fmt.format(date)}</th><td><div class="psych-times">${slots.map(time=>{
          const taken=isTaken(person.id,key,time);
          return `<label class="psych-time"><input type="radio" name="slot" value="${key}T${time}" aria-label="${fmt.format(date)}, ${time}${taken?', '+w.taken:''}" ${taken?'disabled':''} ${!taken&&state.drafts.consult.slot===key+'T'+time?'checked':''} required><span>${time}–${timeAfter(time,50)}${taken?` <small>${w.taken}</small>`: ''}</span></label>`;
        }).join('')}</div></td></tr>`).join('')}</tbody>
      </table>
      <p class="psych-booking-error" role="alert">${state.bookingError==='storage'?storageText[lang].saveFailed:state.bookingError?w.invalid:''}</p>
      <p class="demo-action-note">${w.local}</p>
      ${button(w.confirm,'type="submit" id="consult-submit"')}
    </form>`}
  </dialog>`;
}

function psych(t, lang) {
  const w = psychWords[lang];
  const filtered = clinicians.filter(p => (state.specialty==='all' || p.roles.includes(state.specialty)) && (!state.topic || p.topics.includes(state.topic)));
  const selected = clinicians.find(p=>p.id===state.clinician);

  const kk = lang === 'kk';
  const card = p => `<article class="psych-clinician">
    <div class="psych-portrait portrait-${p.portrait}" aria-hidden="true"></div>
    <div class="psych-clinician-body">
      <h3>${clinicianName(p,lang)}</h3>
      <p class="psych-roles">${p.roles.map(role=>w.roles[role]).join(', ')}</p>
      <p class="psych-experience">${w.years(p.years)}</p>
      <p class="psych-helps"><strong>${w.helps}:</strong> ${p.topics.map(topic=>w.topics[topic]).join(', ')}.</p>
      <button class="button psych-cta" type="button" data-action="psych-book" data-id="${p.id}" aria-haspopup="dialog" aria-label="${w.book}: ${clinicianName(p,lang)}">${w.book}</button>
    </div>
  </article>`;
  return `<main class="support-page psych-page">
    <section class="psych-hero photo-hero">
      <div class="wrap psych-hero-copy">
        <a class="back" href="${base}" data-link>${t.back}</a>
        <div class="psych-title"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${supportIconPath}</svg><h1>${t.psych}</h1></div>
        <p>${w.intro}</p>
        <div class="psych-hero-actions">
          <a class="button psych-cta" href="#psych-clinicians">${kk?'Демо маман таңдау':'Выбрать демо-специалиста'}</a>
          <a class="button secondary" href="#psych-reflection">${w.survey}</a>
        </div>
        <p class="psych-demo-caption">${w.local}</p>
      </div>
    </section>
    <div class="wrap psych-content">
      <section class="psych-directory" id="psych-clinicians" tabindex="-1">
        <header><div><h2>${w.title}</h2><p>${w.demo}</p></div></header>
        <div class="psych-specialties" role="group" aria-label="${w.filters}">
          ${[['all',kk?'Барлығы':'Все'],...Object.entries(w.roles)].map(([id,label])=>`<button type="button" data-action="psych-specialty" data-id="${id}" aria-pressed="${state.specialty===id}">${label}</button>`).join('')}
        </div>
        ${state.topic?`<p>${w.topics[state.topic]} <button class="text-button" type="button" data-action="psych-reset">${w.reset}</button></p>`:''}
        <p class="psych-filter-result" role="status">${filtered.length ? w.count(filtered.length) : w.noMatch}</p>
        ${filtered.length?`<div class="psych-clinician-grid">${filtered.map(card).join('')}</div>`:''}
      </section>
      ${reflectionPanel(lang)}
    </div>
    ${selected ? booking(t,lang,selected) : ''}
  </main>`;
}

function reflectionPanel(lang) {
  const w=reflection[lang];
  const {step,answers}=state.reflection;
  const total=w.questions.length;
  if(step===total){
    const groups=w.blocks.map((label,i)=>({
      label,count:answers.slice(i*5,i*5+5).filter(x=>Number(x)>=2).length,
      topic:['stress','burnout','lonely'][i]
    }));
    const highest=Math.max(...groups.map(group=>group.count));
    return `<section class="psych-survey" id="psych-reflection" tabindex="-1">
      <h2>${w.result}</h2><p>${highest?w.hint:w.none}</p>
      <ul class="reflection-results">${groups.map(group=>`<li><strong>${group.label}</strong><p>${w.frequent(group.count)}</p>
        ${group.count && group.count===highest?button(w.suggest,`type="button" data-action="reflection-match" data-id="${group.topic}"`):''}</li>`).join('')}</ul>
      <button type="button" class="text-button" data-action="reflection-reset">${w.reset}</button>
    </section>`;
  }
  const position=`${step+1} / ${total}`;
  return `<section class="psych-survey" id="psych-reflection" tabindex="-1">
    <div class="reflection-head"><h2>${w.title}</h2><span>${position}</span></div>
    <p>${w.intro}</p><progress value="${step+1}" max="${total}" aria-label="${position}"></progress>
    <form id="psych-survey-form">
      <fieldset>
        <legend>${w.questions[step]}</legend>
        <div class="psych-topics">${w.options.map((label,value)=>`<label><input type="radio" name="q${step}" value="${value}" ${answers[step]===String(value)?'checked':''} required><span>${label}</span></label>`).join('')}</div>
      </fieldset>
      <div class="reflection-actions">
        ${step?`<button class="button secondary" type="button" data-action="reflection-back">${w.back}</button>`:''}
        ${button(step===total-1?w.finish:w.next,'type="submit"')}
      </div>
    </form>
  </section>`;
}

function education(t,l){let opts=categories[l].map((x,i)=>`<option value="${courses[i][0]}" ${state.category===courses[i][0]?'selected':''}>${x}</option>`).join('');let list=courses.filter(c=>(state.category==='all'||c[0]===state.category)&&L(c,l).toLowerCase().includes(state.query.toLowerCase()));return shell(t,t.edu,`<p class="lead">${t.courseIntro}</p>${notice(t)}<div class="filters"><label>${t.search}<input id="course-search" type="search" placeholder="${t.searchCourses}" value="${esc(state.query)}"></label><label>${t.category}<select id="course-category"><option value="all">${t.all}</option>${opts}</select></label></div><div id="course-results" class="course-grid">${list.length?list.map(c=>`<a class="support-tile" href="${base}/education/${c[0]}" data-link><span class="kicker">${l==='kk'?'Демо курс':'Демо-курс'}</span><h2>${L(c,l)}</h2><p>${t.enrollStatus}</p><span>${t.open}</span></a>`).join(''):`<p>${t.noResults}</p>`}</div>`)}
function coursePage(t,l,id){let c=courses.find(x=>x[0]===id);if(!c)return education(t,l);let registered=state.requests.some(x=>x.type==='course'&&x.course===id);return shell(t,L(c,l),`<p class="lead">${t.courseDesc}</p>${notice(t)}<div class="panel"><span class="kicker">${t.enrollStatus}</span><p>${t.courseIntro}</p>${created(t)}${button(registered?t.enrolled:t.enroll,`data-action="enroll" data-id="${id}" ${registered?'disabled':''}`)}</div>`)}
function digital(t,l){let result=guides[l].filter(g=>g.join(' ').toLowerCase().includes(state.guideQuery.toLowerCase()));return shell(t,t.digital,`<div class="accessible digital-workspace"><div class="digital-guides"><p class="lead">${t.digitalIntro}</p><h2>${t.guides}</h2><label>${t.search}<input id="guide-search" type="search" placeholder="${t.searchGuide}" value="${esc(state.guideQuery)}"></label><div id="guide-results">${result.length?result.map(g=>`<details class="guide"><summary>${g[0]}</summary><ol>${g.slice(1).map(step=>`<li>${step}</li>`).join('')}</ol></details>`).join(''):`<p>${t.noResults}</p>`}</div></div><section class="panel digital-request"><h2>${t.volunteer}</h2><p>${t.volunteerText}</p><p class="digital-safety">${t.safety}</p>${notice(t)}${created(t)}<form id="volunteer-form"><label>${t.question}<textarea name="subject" required maxlength="300" rows="3">${esc(state.drafts.volunteer.subject||'')}</textarea></label>${button(t.send,'type="submit"')}</form></section></div>`)}
function chat(t){return shell(t,t.chat,`<p class="lead">${t.chatIntro}</p>${notice(t)}<div class="chat-box"><div class="chat-log" role="log" aria-live="polite"><div class="bubble bot">${t.chatStart}</div>${state.messages.map(m=>`<div class="bubble ${m.role}">${esc(m.text)}</div>`).join('')}${state.typing?`<div class="bubble bot">${t.typing}</div>`:''}</div><div class="prompts">${t.prompts.map((p,i)=>`<button type="button" data-action="prompt" data-id="${i}">${p}</button>`).join('')}</div><form id="chat-form"><label>${t.message}<input name="message" required maxlength="1000" autocomplete="off" value="${esc(state.drafts.chat.message||'')}"></label>${button(t.sendMessage,'type="submit"')}</form><button class="text-button" data-action="clear-chat">${t.clear}</button></div>`)}
export function renderSupport(path,lang){let t=text[lang];if(path===base)return supportHome(t,lang);if(path===`${base}/psychology`)return psych(t,lang);if(path===`${base}/education`||path===`${base}/education/courses`)return education(t,lang);if(path.startsWith(`${base}/education/`))return coursePage(t,lang,path.split('/').pop());if(path===`${base}/digital`)return digital(t,lang);if(path===`${base}/chat`)return chat(t);return null}
export function accountContent(lang){let t=text[lang];return `<section class="account-list" id="support-account"><h2>${t.requests}</h2><p>${t.local}</p>${state.requests.length?state.requests.map((r,i)=>{let title=r.type==='consult'?t.consultType:r.type==='volunteer'?t.volunteerType:t.courseType;let course=courses.find(c=>c[0]===r.course);let specialist=clinicians.find(p=>p.id===r.clinician);let status=r.cancelled?t.cancelled:r.type==='course'?t.registered:t.active;return `<article class="request-card"><div><strong>${title}${specialist?` · ${clinicianName(specialist,lang)}`: ''}</strong><p>${t.created}: ${scheduleTimestamp(lang,r.created)}</p><p>${t.status}: <b>${status}</b></p></div><button class="text-button" data-action="detail" data-id="${i}" aria-expanded="${state.open.has(i)}">${state.open.has(i)?t.close:t.details}</button>${state.open.has(i)?`<div class="request-details">${r.subject?`<p>${t.subject}: ${esc(r.subject)}</p>`:''}${r.date?`<p>${t.date}: ${esc(r.date)} · ${esc(r.time)}${r.clinician?'–'+timeAfter(r.time,50):''} · ${r.format==='online'?t.online:t.offline}</p>${r.clinician && r.format==='offline'?`<p>${helpPlace(lang,'library')}</p>`:''}`:''}${course?`<p>${t.courseLabel}: ${L(course,lang)}</p>`:''}${r.type==='consult'&&!r.cancelled?`<button class="button secondary" data-action="cancel-request" data-id="${i}">${t.cancel}</button>`:''}</div>`:''}</article>`}).join(''):`<p>${t.empty}</p>`}</section>`}
export function supportAction(action,id,lang,render){let t=text[lang];
  if(action==='psych-workspace-toggle'){
    if(supportRole!=='psychologist')return true;
    const person=clinicians[0];
    const [date,time]=String(id).split('T');
    const exists=clinicianDays(person).some(day=>day.key===date && day.slots.includes(time));
    if(!exists || isBooked(person.id,date,time))return true;
    const closed=closedSlots(person.id);
    writeLocal('clinician-closed-'+person.id,closed.includes(id)?closed.filter(slot=>slot!==id):[...closed,id]);
    render();
    return true;
  }
  if(action==='psych-book'){
    if(!clinicians.some(p=>p.id===id))return false;
    state.clinician=id;state.bookingError=false;state.notice='';state.drafts.consult={};render();
    return true;
  }
  if(action==='psych-close'){
    const previous=state.clinician;
    state.clinician=null;state.bookingError=false;state.notice='';render();
    document.querySelector(`.psych-clinician-grid [data-id="${previous}"]`)?.focus({preventScroll:true});
    return true;
  }
  if(action==='reflection-back' || action==='reflection-reset'){
    if(action==='reflection-reset')state.reflection={step:0,answers:[]};
    else state.reflection.step=Math.max(0,state.reflection.step-1);
    render();
    document.getElementById('psych-reflection')?.focus();
    return true;
  }
  if(action==='reflection-match' && ['stress','burnout','lonely'].includes(id)){
    state.topic=id;state.specialty='all';render();
    document.getElementById('psych-clinicians')?.focus();
    return true;
  }
  if(action==='psych-specialty'){
    if(id==='all' || Object.hasOwn(psychWords[lang].roles,id)){
      state.specialty=id;state.topic='';render();
    }
    return true;
  }
  if(action==='psych-reset'){state.topic='';state.specialty='all';render();return true}
  if(action==='enroll'){if(!state.requests.some(x=>x.type==='course'&&x.course===id))state.requests.unshift({type:'course',course:id,created:Date.now()});state.open.clear();state.notice='enrolledNote';render();return true}if(action==='detail'){let i=Number(id);state.open.has(i)?state.open.delete(i):state.open.add(i);render();return true}if(action==='cancel-request'){state.requests[Number(id)].cancelled=true;render();return true}if(action==='clear-chat'){clearTimeout(state.timer);state.typing=false;state.messages=[];state.drafts.chat={};render();return true}if(action==='prompt'){sendChat(t.prompts[Number(id)],lang,render);return true}return false}
function sendChat(message,lang,render){let v=message.trim();if(!v||state.typing)return;state.drafts.chat={};state.messages.push({role:'user',text:v});state.typing=true;render();state.timer=setTimeout(()=>{let t=text[lang];let lower=v.toLowerCase();let crisis=/(суицид|самоуб|поконч|убить себя|убить |убью|убей|не хочу жить|хочу умереть|умереть|навредить|порезать|самоповрежд|өзімді өлтір|өлім|өлгім|өлтір|өзіме зиян|өмір сүргім келмейді)/i.test(lower);let answer=crisis?t.crisis:/(тревог|беспок|страш|мазасыз|қорқ)/i.test(lower)?t.chatAnxiety:/(устал|утом|шарша)/i.test(lower)?t.chatTired:t.chatGeneral;state.messages.push({role:'bot',text:answer});state.typing=false;if(sitePath()===`${base}/chat`)render()},600)}
export function supportSubmit(form,lang,render){let t=text[lang];
  if(form.id==='psych-survey-form'){
    const {step,answers}=state.reflection;
    if(step>=reflection[lang].questions.length)return true;
    const answer=new FormData(form).get('q'+step);
    if(!['0','1','2','3'].includes(answer))return true;
    answers[step]=answer;
    state.reflection.step++;
    render();
    document.getElementById('psych-reflection')?.focus();
    return true;
  }
  if(form.id==='consult-form'){
    const data=new FormData(form);
    const person=clinicians.find(p=>p.id===(form.dataset?.clinician || state.clinician));
    const [date,time]=String(data.get('slot')||'').split('T');
    const format=data.get('format');
    state.clinician=person?.id || null;
    const available=person && clinicianDays(person).some(d=>d.key===date && d.slots.includes(time));
    if(!available || isTaken(person.id,date,time) || !['online','offline'].includes(format)){
      state.bookingError=true;render();return true;
    }
    const requests=[{type:'consult',clinician:person.id,date,time,format,created:Date.now()},...state.requests];
    if(supportProfileId && !writeLocalObject('support-'+supportProfileId,requests.map(({subject,...entry})=>entry))){
      state.bookingError='storage';render();return true;
    }
    state.requests=requests;
    state.drafts.consult={};state.open.clear();state.bookingError=false;state.notice='success';render();
    document.querySelector('#psych-booking .success a')?.focus();
    return true;
  }
  if(form.id==='chat-form'){let data=new FormData(form);sendChat(data.get('message'),lang,render);return true}if(form.id==='volunteer-form'){
  const subject=String(new FormData(form).get('subject')||'').trim();
  if(!subject)return true;
  state.requests.unshift({type:'volunteer',subject,created:Date.now()});
  state.drafts.volunteer={};state.open.clear();state.notice='success';render();return true;
}return false}
export function supportInput(el,lang,render){
  if(el.form?.id==='psych-survey-form' && /^q\d+$/.test(el.name) && el.checked){
    state.reflection.answers[Number(el.name.slice(1))]=el.value;
    return true;
  }
let draftKey={'consult-form':'consult','volunteer-form':'volunteer','chat-form':'chat'}[el.form?.id];if(draftKey&&el.name)state.drafts[draftKey][el.name]=el.value;if(el.id==='course-search'||el.id==='guide-search'){let id=el.id,pos=el.selectionStart;state[id==='course-search'?'query':'guideQuery']=el.value;render();let next=document.getElementById(id);next?.focus();try{next?.setSelectionRange(pos,pos)}catch{}return true}if(el.id==='course-category'){state.category=el.value;render();return true}if(el.name==='date')el.setCustomValidity('');return false}
export function clearNotice(){state.notice='';state.clinician=null}
export function endSession(){Object.assign(state,{specialty:'all',topic:'',clinician:null,bookingError:false,reflection:{step:0,answers:[]}});clearTimeout(state.timer);state.messages=[];state.requests=[];state.open.clear();state.typing=false;state.notice='';state.drafts={consult:{},volunteer:{},chat:{}}}

export function psychAvailability(lang){
  const fmt={format: date => scheduleDate(lang,date,{weekday:'short',day:'numeric',month:'short'})};
  return clinicians.flatMap(person=>{
    const day=clinicianDays(person).find(day=>day.slots.some(time=>!isTaken(person.id,day.key,time)));
    if(!day)return [];
    return clinicianName(person,lang)+' · '+fmt.format(day.date)+', '+day.slots.filter(time=>!isTaken(person.id,day.key,time)).slice(0,2).map(time=>time+'–'+timeAfter(time,50)).join(', ');
  });
}

export function clinicianWorkspace(lang,profile){
  if(profile?.role!=='psychologist')return '';
  const kk=lang==='kk';
  const title=kk?'Психологтың демо жұмыс аймағы':'Демо-кабинет психолога';
  const person=clinicians[0];
  const w=psychWords[lang];
  const formatter={format: date => scheduleDate(lang,date)};
  return `<section class="account-list clinician-workspace"><h2>${title}</h2>
    <p>${kk?'Демо кабинетте Айда Сәрсенованың бос уақыттарын жасыруға және қайта ашуға болады.':'В этом демо-кабинете можно закрывать и снова открывать свободные окна Айды Сарсеновой.'}</p>
    ${clinicianDays(person).map(({key,date,slots})=>`<div class="clinician-workspace-day">
      <strong>${formatter.format(date)}</strong>
      <div>${slots.map(time=>{
        const id=key+'T'+time, closed=isClosed(person.id,id), booked=isBooked(person.id,key,time);
        const state=booked?w.taken:closed?(kk?'Жабық':'Закрыто'):(kk?'Ашық':'Открыто');
        return `<button type="button" class="button secondary" data-action="psych-workspace-toggle" data-id="${id}" aria-pressed="${closed}" ${booked?'disabled':''}>${time} · ${state}</button>`;
      }).join('')}</div></div>`).join('')}
  </section>`;
}

export function supportOverview(lang) {
  const t=text[lang];
  return state.requests.filter(row=>!row.cancelled && row.type!=='course').map(row=>({
    section:'support-account',group:t.support,label:row.type==='consult'?t.consultType:t.volunteerType,
    date:row.date,time:row.time
  }));
}

