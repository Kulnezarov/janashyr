import {sitePath} from './ui.js';
import {scheduleDate,scheduleTimestamp} from './ui.js';
import {pageShell,demoNotice} from './ui.js';
import {donorText as texts,cities,shymkentBloodCenter,donorHubText} from './donor-content.js';
const base='/directions/donation';
const state={query:'',filter:'all',eventFilter:'all',step:1,city:'',center:'',date:'',time:'',consent:false,records:[],open:new Set(),error:'',last:null};
const city=(id,lang)=>cities.find(c=>c[0]===id)?.[lang==='kk'?1:2]||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const center=(id,l)=>id==='shymkent'?shymkentBloodCenter.name[l]:`${texts[l].demoCenter} — ${city(id,l)}`;
const events=cities.map((c,i)=>{const d=new Date();d.setDate(d.getDate()+14+i*7);return {id:c[0],date:[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),time:['10:00','11:00','12:00'][i]}});
const note=t=>demoNotice(t.demo);
const shell=(t,title,body)=>pageShell({base,back:t.back,kicker:'JANASHYR',title,body});
const options=(t,l,selected,all=true)=>`${all?`<option value="all">${t.all}</option>`:`<option value="">${t.select}</option>`}${cities.map(c=>`<option value="${c[0]}" ${selected===c[0]?'selected':''}>${city(c[0],l)}</option>`).join('')}`;
const hubState = {query:'', day:'', time:'', consent:false, error:'', success:''};
const shymkentTime = 'Asia/Almaty';
let profileId = null;

function donorStorageKey(id) {
  return `janashyr.donation.v1.${id}`;
}
function readDonorRecords(id) {
  if (!id) return [];
  try {
    const records = JSON.parse(globalThis.localStorage?.getItem(donorStorageKey(id)) || '[]');
    if (!Array.isArray(records)) return [];
    return records.filter(record => {
      if (!record || typeof record.number !== 'string' || !/^D-[A-Z0-9]+-[A-Z0-9]+$/.test(record.number) ||
          !Number.isFinite(record.created) || !Number.isFinite(new Date(record.created).getTime())) return false;
      if (record.type === 'event') return events.some(event => event.id === record.event);
      return record.type === 'booking' && cities.some(([id]) => id === record.center) &&
        /^\d{4}-\d{2}-\d{2}$/.test(record.date) && /^\d{2}:\d{2}$/.test(record.time);
    });
  } catch {
    return [];
  }
}
function saveDonorRecords() {
  if (!profileId) return;
  try {
    globalThis.localStorage?.setItem(donorStorageKey(profileId), JSON.stringify(state.records));
  } catch {
    // The in-memory record stays usable when browser storage is disabled.
  }
}

export function useDonorProfile(profile) {
  const nextId = typeof profile?.id === 'string' && profile.id ? profile.id : null;
  if (nextId === profileId) return;
  endDonorSession();
  profileId = nextId;
  state.records = readDonorRecords(profileId);
}

function dayKey(date) {
  const fields = new Intl.DateTimeFormat('en-CA', {timeZone:shymkentTime, year:'numeric', month:'2-digit', day:'2-digit'})
    .formatToParts(date);
  return ['year','month','day'].map(type => fields.find(field => field.type === type).value).join('-');
}
const formatDay = scheduleDate;
function demoSchedule(now = Date.now()) {
  const schedule = [];
  for (let offset = 1; offset < 14 && schedule.length < 5; offset++) {
    const date = new Date(now + offset * 86400000);
    const key = dayKey(date);
    const weekDay = new Date(`${key}T12:00:00Z`).getUTCDay();
    if (weekDay === 0 || weekDay === 6) continue;
    schedule.push({key, times:weekDay % 2 ? ['09:30','11:00','14:30'] : ['10:00','12:00','15:00']});
  }
  return schedule;
}
function isHubSlotTaken(day, time) {
  let records = state.records;
  if (profileId) {
    try {
      const storage = globalThis.localStorage;
      for (let index = 0; index < storage?.length; index++) {
        const key = storage.key(index);
        const prefix = donorStorageKey('');
        if (key?.startsWith(prefix) && key !== donorStorageKey(profileId)) {
          records = records.concat(readDonorRecords(key.slice(prefix.length)));
        }
      }
    } catch {
      // Limit availability to the active profile when storage is disabled.
    }
  }
  return records.some(record => record.type === 'booking' && record.center === 'shymkent' &&
    record.date === day && record.time === time && !record.cancelled);
}

export function donorAvailability(lang) {
  const h = donorHubText[lang];
  const openDays = demoSchedule().map(day => ({
    ...day,
    times:day.times.filter(time => !isHubSlotTaken(day.key, time))
  })).filter(day => day.times.length).slice(0,3);
  const display = openDays.map(day => `${formatDay(lang, day.key, {weekday:'long',day:'numeric',month:'long'})}: ${day.times.join(', ')}`);
  return [h.dateSummary, shymkentBloodCenter.name[lang], shymkentBloodCenter.address[lang], ...display,
    display.length ? h.bookingNote : h.noSlots].join('\n');
}

function renderHubCenter(lang, copy, text) {
  const query = hubState.query.trim().toLocaleLowerCase();
  const haystack = `${shymkentBloodCenter.name.kk} ${shymkentBloodCenter.name.ru} ${shymkentBloodCenter.address.kk} ${shymkentBloodCenter.address.ru} shymkent nursat blood 442`.toLocaleLowerCase();
  const address = shymkentBloodCenter.address[lang];
  const show = !query || query.split(/\s+/).every(word => haystack.includes(word));
  return `<section class="donor-hub-center" id="donor-center-search" aria-labelledby="donor-hub-center-title">
    <h2 id="donor-hub-center-title">${copy.location}</h2>
    <div class="donor-search">
      <label class="donor-search-field" for="donor-hub-search">${lang==='kk'?'Орталықты іздеу':'Поиск центра'}</label>
      <div class="donor-search-input">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6"></circle><path d="m15 15 5 5"></path></svg>
        <input id="donor-hub-search" type="search" value="${esc(hubState.query)}" placeholder="${copy.centerSearch}" autocomplete="off">
        ${query?`<button type="button" data-action="donor-hub-clear" aria-label="${copy.clear}">×</button>`:''}
      </div>
    </div>
    ${show ? `<article class="donor-center-record">
      <p class="donor-small-label">${copy.addressLabel}</p>
      <h3>${shymkentBloodCenter.name[lang]}</h3>
      <p class="donor-center-address">${address}</p><p>${copy.centerIntro}</p>
      <div class="donor-center-links">
        <a href="${shymkentBloodCenter.source}" target="_blank" rel="noopener noreferrer">${copy.official}</a>
        <a href="https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}" target="_blank" rel="noopener noreferrer">${copy.onMap}</a>
      </div>
    </article>` : `<div class="donor-center-record" role="status"><p>${text.empty}</p><button type="button" class="text-button" data-action="donor-hub-clear">${copy.clear}</button></div>`}
  </section>`;
}

function renderHubBooking(lang, copy, text) {
  const schedule = demoSchedule();
  const selected = schedule.find(day => day.key === hubState.day) || schedule[0];
  const result = hubState.success ? state.records.find(record => record.number === hubState.success && !record.cancelled) : null;
  return `<section class="donor-hub-booking" id="donor-booking" aria-labelledby="donor-hub-booking-title">
    <div class="donor-booking-heading"><div><h2 id="donor-hub-booking-title">${copy.bookingTitle}</h2><p>${copy.bookingNote}</p></div></div>
    ${result ? `<section class="donor-hub-success" role="status"><strong>${copy.bookingSaved}</strong>
      <p>${formatDay(lang, result.date, {weekday:'long', day:'numeric', month:'long'})} · ${result.time}</p>
      <a href="/account#donation" data-link>${copy.profileHistory}</a></section>` : ''}
    ${hubState.error ? `<p class="donor-hub-error" role="alert">${hubState.error === 'unavailable' ? copy.unavailable : text.required}</p>` : ''}
    <fieldset class="donor-booking-field"><legend>${copy.date}</legend><div class="donor-day-strip">
      ${schedule.map(day => `<button type="button" class="donor-day" data-action="donor-hub-day" data-id="${day.key}"
        aria-pressed="${day.key === selected?.key}" aria-label="${formatDay(lang, day.key, {weekday:'long', day:'numeric', month:'long'})}">
        <span>${formatDay(lang, day.key,{weekday:'short'})}</span>
        <strong>${formatDay(lang, day.key,{day:'numeric'})}</strong>
        <small>${formatDay(lang, day.key,{month:'short'})}</small>
      </button>`).join('')}
    </div></fieldset>
    <fieldset class="donor-booking-field"><legend>${copy.time}</legend><div class="donor-time-strip">
      ${(selected?.times || []).map(time => {
        const available = !isHubSlotTaken(selected.key, time);
        return `<button class="donor-time-slot" type="button" title="${available?(lang==='kk'?'Бос уақыт':'Свободное время'):(lang==='kk'?'Бос емес':'Занято')}" data-action="donor-hub-slot" data-id="${time.replace(':','')}" aria-pressed="${hubState.time === time && hubState.day === selected.key}" ${available ? '' : 'disabled'}>${time}</button>`;
      }).join('')}
    </div></fieldset>
    ${profileId ? `<label class="donor-hub-consent"><input type="checkbox" id="donor-hub-consent" ${hubState.consent ? 'checked' : ''}> <span>${text.confirm}</span></label>
        <button class="button donor-submit" type="button" data-action="donor-hub-book">${text.submit}</button>`
      : `<p class="donor-hub-signin">${copy.loginNote}</p><a class="button donor-submit" href="/login" data-link>${copy.signin}</a>`}
  </section>`;
}

function home(t, lang) {
  const h = donorHubText[lang];
  return `<main class="inner wrap support-page donor-hub">
    <a class="back" href="/" data-link>${t.back}</a>
    <section class="donor-hero">
      <div class="donor-hero-copy"><p class="donor-small-label">${h.city} / ${t.title}</p><h1>${h.headline}</h1><p>${h.intro}</p>
        <div class="donor-hero-actions"><a class="button donor-submit" href="#donor-booking">${t.become}</a><a class="donor-hero-link" href="#donor-center-search">${t.centers}</a></div>
      </div>
    </section>
    <div class="donor-hub-layout" aria-label="${h.demoProgress}">
      ${renderHubCenter(lang, h, t)}
      ${renderHubBooking(lang, h, t)}
    </div>
    <section class="donor-hub-prepare">
      <div><p class="donor-small-label">${h.prep}</p><h2>${h.prepTitle}</h2><p>${h.prepBody}</p><a href="${base}/info" data-link>${h.details}</a></div>
      <ul class="donor-resource-links" aria-label="${h.more}">
        <li><a href="${base}/groups" data-link>${t.groups}</a></li>
        <li><a href="${base}/events" data-link>${t.events}</a></li>
        <li><a href="/account#donation" data-link>${h.profileHistory}</a></li>
      </ul>
    </section>
  </main>`;
}

function donorHubAction(action, id, render) {
  if (action === 'donor-hub-clear') {
    hubState.query = '';
  } else if (action === 'donor-hub-day') {
    if (!demoSchedule().some(day => day.key === id)) return true;
    Object.assign(hubState, {day:id, time:'', error:'', success:''});
  } else if (action === 'donor-hub-slot') {
    const schedule = demoSchedule();
    const day = schedule.find(entry => entry.key === hubState.day) || schedule[0];
    const time = day?.times.find(slot => slot.replace(':','') === id);
    if (time && !isHubSlotTaken(day.key, time)) Object.assign(hubState, {day:day.key, time, error:'', success:''});
  } else if (action === 'donor-hub-book') {
    if (!profileId) return true;
    state.records = mergeCurrentDonorRecords();
    const selected = demoSchedule().find(day => day.key === hubState.day);
    if (!hubState.consent || !hubState.time) {
      hubState.error = 'required';
    } else if (!selected?.times.includes(hubState.time) || isHubSlotTaken(hubState.day, hubState.time)) {
      hubState.error = 'unavailable';
    } else {
      const record = {type:'booking', number:number(), city:'shymkent', center:'shymkent', venue:'official-shymkent',
        date:hubState.day, time:hubState.time, created:Date.now(), cancelled:false};
      state.records.unshift(record);
      state.last = record;
      saveDonorRecords();
      Object.assign(hubState, {success:record.number, time:'', consent:false, error:''});
    }
  } else {
    return false;
  }
  render();
  return true;
}

function mergeCurrentDonorRecords() {
  const current = new Map(state.records.map(record => [record.number, record]));
  for (const record of readDonorRecords(profileId)) current.set(record.number, record);
  return [...current.values()].sort((a,b) => b.created-a.created);
}

function centersPage(t,l){
  const found=cities.filter(c=>{
    const name=city(c[0],l);
    const keywords=c[0]==='shymkent'?`${name} ${shymkentBloodCenter.name[l]} ${shymkentBloodCenter.address[l]}`:name;
    return (state.filter==='all'||state.filter===c[0]) && keywords.toLowerCase().includes(state.query.trim().toLowerCase());
  });
  return shell(t,t.centers,`${note(t)}<div class="filters"><label>${t.search}<input type="search" id="donor-search" value="${esc(state.query)}"></label><label>${t.city}<select id="donor-filter">${options(t,l,state.filter)}</select></label></div><div class="course-grid">${found.length?found.map(c=>{
    const actual=c[0]==='shymkent';
    return `<article class="panel"><span class="kicker">${actual?donorHubText[l].addressLabel:t.example}</span><h2>${center(c[0],l)}</h2><p>${actual?shymkentBloodCenter.address[l]:t.centerInfo}</p><p><a class="text-link" href="${base}/centers/${c[0]}" data-link>${t.open}</a></p><a class="button secondary" href="${actual?base+'#donor-booking':base+'/book?center='+c[0]}" data-link>${t.choose}</a></article>`;
  }).join(''):`<p>${t.empty}</p>`}</div>`);
}
function centerPage(t,l,id){
  if(!cities.some(c=>c[0]===id))return centersPage(t,l);
  if(id==='shymkent'){
    const h=donorHubText[l], address=shymkentBloodCenter.address[l];
    return shell(t,center(id,l),`<section class="panel"><p><strong>${address}</strong></p><p>${h.centerIntro}</p><p><a class="text-link" href="${shymkentBloodCenter.source}" target="_blank" rel="noopener noreferrer">${h.official}</a> · <a class="text-link" href="https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}" target="_blank" rel="noopener noreferrer">${h.onMap}</a></p><a class="button primary" href="${base}#donor-booking" data-link>${h.start}</a></section>`);
  }
  return shell(t,center(id,l),`${note(t)}<section class="panel"><p>${t.centerInfo}</p><h2>${t.map}</h2><div class="demo-notice">${t.mapUnavailable}</div><a class="button primary" href="${base}/book?center=${id}" data-link>${t.choose}</a></section>`);
}
function book(t,l){let f=state;let html=f.step===1?`<label>${t.city}<select id="donor-city" required>${options(t,l,f.city,false)}</select></label>`:f.step===2?`<label>${t.center}<select id="donor-center" required><option value="">${t.select}</option><option value="${f.city}" ${f.center===f.city?'selected':''}>${center(f.city,l)}</option></select></label><p>${t.centerInfo}</p>`:f.step===3?`<label>${t.date}<input id="donor-date" type="date" value="${esc(f.date)}" required></label><label>${t.time}<input id="donor-time" type="time" value="${esc(f.time)}" required></label>`:`<p>${t.city}: <b>${city(f.city,l)}</b></p><p>${t.center}: <b>${center(f.center,l)}</b></p><p>${t.when}: <b>${esc(f.date)} · ${esc(f.time)}</b></p><label class="donor-check"><input id="donor-consent" type="checkbox" ${f.consent?'checked':''}> ${t.confirm}</label>`;return shell(t,t.appointment,`${note(t)}<div class="panel donor-form"><p>${t.privacy}</p><p class="kicker">${t.step} ${f.step} / 4</p>${f.error?`<p class="donor-error" role="alert">${t[f.error]}</p>`:''}<div class="donor-fields">${html}</div><div class="hero-actions">${f.step>1?`<button class="button secondary" data-action="donor-prev">${t.previous}</button>`:''}<button class="button primary" data-action="donor-next">${f.step===4?t.submit:t.next}</button></div></div>`)}
function result(t,l){return shell(t,t.appointment,`${note(t)}${state.last?`<div class="success" role="status"><p>${t.success}</p><p>${t.number}: <b>${state.last.number}</b></p><p>${t.status}: <b>${state.last.cancelled?t.cancelled:t.active}</b></p>${profileId?`<a href="/account#donation" data-link>${t.account} →</a>`:`<p>${donorGuestNotice(l)}</p>`}</div>`:`<p>${t.empty}</p>`}`)}
function info(t,lang){return shell(t,t.info,`<div class="info-sections">${['about','process','prepare','requirements','screening','after'].map(k=>`<section class="panel"><h2>${t[k]}</h2><p>${t[k+'Text']}</p></section>`).join('')}<p>${t.sources}: <a class="text-link" href="https://www.who.int/news-room/questions-and-answers/item/blood-products-why-should-i-donate-blood" target="_blank" rel="noopener noreferrer">${lang==='kk'?'ДДСҰ':'ВОЗ'}</a></p></div>`)}
function groups(t,lang){return shell(t,t.groups,`<div class="panel"><p>${t.bloodText}</p><div class="blood-groups"><b>O (I) + / −</b><b>A (II) + / −</b><b>B (III) + / −</b><b>AB (IV) + / −</b></div><p>${t.compat}</p><p>${t.sources}: <a class="text-link" href="https://www.who.int/teams/health-product-policy-and-standards/standards-and-specifications/blood-and-products-of-human-origin/quality-and-safety/donation-testing" target="_blank" rel="noopener noreferrer">${lang==='kk'?'ДДСҰ':'ВОЗ'}</a></p></div>`)}
function eventName(id,l){return `${texts[l].eventName} — ${city(id,l)}`}
function eventsPage(t,l){let rows=events.filter(e=>state.eventFilter==='all'||e.id===state.eventFilter);return shell(t,t.events,`<p>${t.eventIntro}</p>${note(t)}<div class="filters"><label>${t.city}<select id="event-filter">${options(t,l,state.eventFilter)}</select></label></div><div class="course-grid">${rows.map(e=>`<article class="panel"><span class="kicker">${t.example}</span><h2>${eventName(e.id,l)}</h2><p>${t.when}: ${e.date} · ${e.time}</p><p>${t.organizer}: ${t.fictionalOrg}</p><a class="text-link" href="${base}/events/${e.id}" data-link>${t.details} ↗</a></article>`).join('')}</div>`)}
function donorGuestNotice(lang){
  return lang==='kk'?'Қонақ жазбасы кабинетке сақталмайды.':'Гостевая запись не сохранится в личном кабинете.';
}
function eventPage(t,l,id){let e=events.find(x=>x.id===id);if(!e)return eventsPage(t,l);let existing=state.records.find(r=>r.type==='event'&&r.event===id&&!r.cancelled);return shell(t,eventName(id,l),`${note(t)}<div class="panel"><p>${t.eventDesc}</p><p>${t.when}: ${e.date} · ${e.time}</p><p>${t.organizer}: ${t.fictionalOrg}</p>${existing?`<p class="success" role="status">${t.registerSuccess}</p>${profileId?`<a href="/account#donation" data-link>${t.account} →</a>`:`<p>${donorGuestNotice(l)}</p>`}`:`${profileId?'':`<p class="demo-notice">${donorGuestNotice(l)} <a href="/login" data-link>${l==='kk'?'Кіру':'Войти'}</a></p>`}<button class="button primary" data-action="donor-register" data-id="${id}">${t.register}</button>`}</div>`)}
export function renderDonor(path,l){const t=texts[l];if(path===base)return home(t,l);if(path===base+'/centers')return centersPage(t,l);if(path.startsWith(base+'/centers/'))return centerPage(t,l,path.split('/').pop());if(path===base+'/book')return book(t,l);if(path===base+'/result')return result(t,l);if(path===base+'/info')return info(t,l);if(path===base+'/groups')return groups(t,l);if(path===base+'/events')return eventsPage(t,l);if(path.startsWith(base+'/events/'))return eventPage(t,l,path.split('/').pop());return null}
export function donorAccount(l){let t=texts[l];let section=(type,title,empty)=>{let list=state.records.filter(r=>r.type===type);return `<h3>${title}</h3>${list.length?list.map(r=>`<article class="request-card"><strong>${r.type==='booking'?t.appointment:eventName(r.event,l)}</strong><p>${t.number}: ${r.number}</p><p>${t.created}: ${scheduleTimestamp(l,r.created)}</p><p>${t.status}: <b>${r.cancelled?t.cancelled:r.type==='booking'?t.active:t.registered}</b></p><button class="text-button" data-action="donor-detail" data-id="${r.number}" aria-expanded="${state.open.has(r.number)}">${state.open.has(r.number)?t.hide:t.details}</button>${state.open.has(r.number)?`<div class="request-details"><p>${r.type==='booking'?`${t.center}: ${r.venue==='official-shymkent'?shymkentBloodCenter.name[l]:center(r.center,l)}<br>${t.when}: ${esc(r.date)} · ${esc(r.time)}`:`${t.when}: ${esc(r.date||events.find(e=>e.id===r.event).date)} · ${esc(r.time||events.find(e=>e.id===r.event).time)}<br>${t.organizer}: ${t.fictionalOrg}`}</p>${r.cancelled?'':`<button class="button secondary" data-action="donor-cancel" data-id="${r.number}">${r.type==='booking'?t.cancel:t.cancelEvent}</button>`}</div>`:''}</article>`).join(''):`<p>${empty}</p>`}`};return `<section class="account-list" id="donation"><h2>${t.my}</h2><p>${profileId ? donorHubText[l].local : t.local}</p>${section('booking',t.myBookings,t.noBookings)}${section('event',t.myEvents,t.noEvents)}</section>`}
function number(){return `D-${Date.now().toString(36).toUpperCase()}-${(state.records.length+1).toString(36).toUpperCase()}`}
export function donorAction(action,id,l,render,navigate){if(donorHubAction(action,id,render))return true;if(action==='donor-prev'){state.step--;state.error='';render();return true}if(action==='donor-next'){if(profileId)state.records=mergeCurrentDonorRecords();let today=new Date();let day=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');let err=state.step===1&&!state.city||state.step===2&&state.center!==state.city||state.step===3&&(!state.date||!state.time)||state.step===4&&!state.consent?'required':state.step===3&&state.date<day?'notPast':'';if(err){state.error=err;render();return true}state.error='';if(state.step<4){state.step++;render();return true}let r={type:'booking',number:number(),city:state.city,center:state.center,date:state.date,time:state.time,created:Date.now(),cancelled:false};state.records.unshift(r);saveDonorRecords();state.last=r;state.step=1;state.city='';state.center='';state.date='';state.time='';state.consent=false;navigate(base+'/result');return true}if(action==='donor-register'){if(profileId)state.records=mergeCurrentDonorRecords();if(events.some(e=>e.id===id)&&!state.records.some(r=>r.type==='event'&&r.event===id&&!r.cancelled))state.records.unshift({type:'event',event:id,date:events.find(e=>e.id===id).date,time:events.find(e=>e.id===id).time,number:number(),created:Date.now(),cancelled:false});saveDonorRecords();render();return true}if(action==='donor-detail'){state.open.has(id)?state.open.delete(id):state.open.add(id);render();return true}if(action==='donor-cancel'){if(profileId)state.records=mergeCurrentDonorRecords();let r=state.records.find(x=>x.number===id);if(r){r.cancelled=true;saveDonorRecords()}render();return true}return false}
export function donorInput(el,lang,render){if(el.id==='donor-hub-consent'){hubState.consent=el.checked;hubState.error='';return true}if(el.id==='donor-hub-search'){
  if(hubState.query===el.value)return true;
  const pos=el.selectionStart;
  hubState.query=el.value;
  render();
  const input=document.getElementById(el.id);
  input?.focus();
  if(pos!==null)try{input?.setSelectionRange(pos,pos)}catch{}
  return true;
}if(el.id==='donor-search'){let pos=el.selectionStart;state.query=el.value;render();let n=document.getElementById(el.id);n?.focus();try{n?.setSelectionRange(pos,pos)}catch{}return true}if(el.id==='donor-filter'||el.id==='event-filter'){state[el.id==='donor-filter'?'filter':'eventFilter']=el.value;render();return true}if(el.id==='donor-city'){state.city=el.value;state.center='';state.error='';return true}if(el.id==='donor-center'){state.center=el.value;state.error='';return true}if(el.id==='donor-date'){state.date=el.value;state.error='';return true}if(el.id==='donor-time'){state.time=el.value;state.error='';return true}if(el.id==='donor-consent'){state.consent=el.checked;state.error='';return true}return false}
export function donorNavigate(url){let parsed=new URL(url,'http://localhost');if(sitePath(parsed.pathname)===base+'/book'&&parsed.searchParams.has('center')){let id=parsed.searchParams.get('center');if(cities.some(c=>c[0]===id)){state.city=id;state.center=id;state.step=3;state.error=''}}}
export function endDonorSession(){profileId=null;Object.assign(hubState,{query:'',day:'',time:'',consent:false,error:'',success:''});state.records=[];state.open.clear();state.last=null;state.step=1;state.city='';state.center='';state.date='';state.time='';state.consent=false;state.error=''}

export function donorOverview(lang) {
  const t=texts[lang];
  return state.records.filter(row=>!row.cancelled).map(row=>{
    const event=row.type==='event'?events.find(item=>item.id===row.event):null;
    return {section:'donation',group:t.my,label:event?eventName(row.event,lang):t.appointment,
      date:row.date||event?.date,time:row.time||event?.time};
  });
}

