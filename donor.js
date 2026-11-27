import {sitePath} from './ui.js';
import {scheduleTimestamp} from './ui.js';
import {pageShell,demoNotice} from './ui.js';
import {donorText as texts,cities,shymkentBloodCenter,donorHubText} from './donor-content.js';
import {storageText,writeStored} from './profiles.js';
import {readDonorHistory,donorStorageKey,donorStatus,updateDonor} from './donor-booking-data.js';
import {renderDonationCenters,renderDonationFlow,renderDonationAccount,renderDonationTicket,donorScheduleSummary,
  resetDonationDraft,openDonationPath,donationAction,donationInput,donationSubmit} from './donor-booking.js';
const base='/directions/donation';
const state={query:'',filter:'all',eventFilter:'all',error:''};
const city=(id,lang)=>cities.find(c=>c[0]===id)?.[lang==='kk'?1:2]||'';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const center=(id,l)=>id==='shymkent'?shymkentBloodCenter.name[l]:`${texts[l].demoCenter} — ${city(id,l)}`;
const events=cities.map((c,i)=>{const d=new Date();d.setDate(d.getDate()+14+i*7);return {id:c[0],date:[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),time:['10:00','11:00','12:00'][i]}});
const note=t=>demoNotice(t.demo);
const shell=(t,title,body)=>pageShell({base,back:t.back,kicker:'JANASHYR',title,body});
const options=(t,l,selected,all=true)=>`${all?`<option value="all">${t.all}</option>`:`<option value="">${t.select}</option>`}${cities.map(c=>`<option value="${c[0]}" ${selected===c[0]?'selected':''}>${city(c[0],l)}</option>`).join('')}`;

let profileId=null;
const currentRecords=()=>readDonorHistory(profileId).rows;
export function useDonorProfile(profile,keepDraft=false){
  const next=profile?.id || null;
  if(next===profileId)return;
  resetDonationDraft(keepDraft);
  profileId=next;
  state.error='';
}

export const donorBookingAction=action=>action==='donor-visit-book' || action==='donor-register';

function donorStorageNotice(lang,issue){
  return issue ? '<p class="donor-error" role="alert">'+storageText[lang][issue]+'</p>' : '';
}

export function donorAvailability(lang) {
  return donorScheduleSummary(lang,donorHubText[lang].bookingNote);
}

function home(t,lang) {
  const h=donorHubText[lang];
  return `<main class="inner wrap support-page donor-hub">
    <section class="donor-hero photo-hero photo-hero-bleed">
      <div class="donor-hero-copy"><a class="back" href="/" data-link>${t.back}</a><p class="donor-small-label">${h.city} / ${t.title}</p><h1>${h.headline}</h1><p>${h.intro}</p>
        <div class="donor-hero-actions"><a class="button donor-submit" href="#donor-booking">${t.become}</a><a class="donor-hero-link" href="#donor-center-search">${t.centers}</a></div>
      </div>
    </section>
    <div class="donor-hub-layout" aria-label="${h.demoProgress}">
      ${renderDonationCenters(lang,profileId)}
      ${renderDonationFlow(lang,profileId)}
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
function info(t,lang){return shell(t,t.info,`<div class="info-sections">${['about','process','prepare','requirements','screening','after'].map(k=>`<section class="panel"><h2>${t[k]}</h2><p>${t[k+'Text']}</p></section>`).join('')}<p>${t.sources}: <a class="text-link" href="https://www.who.int/news-room/questions-and-answers/item/blood-products-why-should-i-donate-blood" target="_blank" rel="noopener noreferrer">${lang==='kk'?'ДДСҰ':'ВОЗ'}</a></p></div>`)}
function groups(t,lang){return shell(t,t.groups,`<div class="panel"><p>${t.bloodText}</p><div class="blood-groups"><b>O (I) + / −</b><b>A (II) + / −</b><b>B (III) + / −</b><b>AB (IV) + / −</b></div><p>${t.compat}</p><p>${t.sources}: <a class="text-link" href="https://www.who.int/teams/health-product-policy-and-standards/standards-and-specifications/blood-and-products-of-human-origin/quality-and-safety/donation-testing" target="_blank" rel="noopener noreferrer">${lang==='kk'?'ДДСҰ':'ВОЗ'}</a></p></div>`)}
function eventName(id,l){return `${texts[l].eventName} — ${city(id,l)}`}
function eventsPage(t,l){let rows=events.filter(e=>state.eventFilter==='all'||e.id===state.eventFilter);return shell(t,t.events,`<p>${t.eventIntro}</p>${note(t)}<div class="filters"><label>${t.city}<select id="event-filter">${options(t,l,state.eventFilter)}</select></label></div><div class="course-grid">${rows.map(e=>`<article class="panel"><span class="kicker">${t.example}</span><h2>${eventName(e.id,l)}</h2><p>${t.when}: ${e.date} · ${e.time}</p><p>${t.organizer}: ${t.fictionalOrg}</p><a class="text-link" href="${base}/events/${e.id}" data-link>${t.details} ↗</a></article>`).join('')}</div>`)}
function donorGuestNotice(lang){
  return lang==='kk'?'Жазылуды сақтау үшін бейінді таңдаңыз.':'Выберите профиль, чтобы сохранить запись.';
}
function eventPage(t,l,id){let e=events.find(x=>x.id===id);if(!e)return eventsPage(t,l);let existing=currentRecords().find(r=>r.type==='event'&&r.event===id&&!r.cancelled);return shell(t,eventName(id,l),`${note(t)}<div class="panel"><p>${t.eventDesc}</p><p>${t.when}: ${e.date} · ${e.time}</p><p>${t.organizer}: ${t.fictionalOrg}</p>${state.error==='saveFailed'?donorStorageNotice(l,state.error):''}${existing?`<p class="success" role="status">${t.registerSuccess}</p>${profileId?`<a href="/account#donation" data-link>${t.account} →</a>`:`<p>${donorGuestNotice(l)}</p>`}`:`${profileId?'':`<p class="demo-notice">${donorGuestNotice(l)}</p>`}<button class="button primary" data-action="donor-register" data-id="${id}">${t.register}</button>`}</div>`)}
export function renderDonor(path,l){
  const t=texts[l];
  if(path===base || path===base+'/book')return home(t,l);
  if(path===base+'/centers')return centersPage(t,l);
  if(path.startsWith(base+'/centers/'))return centerPage(t,l,path.split('/').pop());
  if(path===base+'/result')return shell(t,t.appointment,note(t)+renderDonationTicket(l,profileId));
  if(path===base+'/info')return info(t,l);
  if(path===base+'/groups')return groups(t,l);
  if(path===base+'/events')return eventsPage(t,l);
  if(path.startsWith(base+'/events/'))return eventPage(t,l,path.split('/').pop());
  return null;
}

export function donorAccount(lang){
  const t=texts[lang];
  const eventsForProfile=currentRecords().filter(row=>row.type==='event');
  const eventCards=eventsForProfile.map(row=>`<article class="request-card"><strong>${eventName(row.event,lang)}</strong>
    <p>${t.number} · ${row.number}</p><p>${t.created} · ${scheduleTimestamp(lang,row.created)}</p>
    <p>${t.status} · ${row.cancelled?t.cancelled:t.registered}</p>
    ${!row.cancelled?`<button class="button secondary" data-action="donor-cancel" data-id="${row.number}">${t.cancelEvent}</button>`:''}
  </article>`).join('');
  return `<section class="account-list" id="donation"><h2>${t.my}</h2><p>${donorHubText[lang].local}</p>
    ${donorStorageNotice(lang,state.error)}${renderDonationAccount(lang,profileId)}
    <h3>${t.myEvents}</h3>${eventCards || `<p>${t.noEvents}</p>`}
  </section>`;
}

export function donorAction(action,id,lang,render,navigate){
  if(donationAction(action,id,lang,profileId,render,navigate))return true;
  if(action!=='donor-register' && action!=='donor-cancel')return false;
  const actor=profileId;
  const task=()=>{
    const {rows,issue}=readDonorHistory(actor);
    if(issue==='unavailable'){state.error=issue;render();return;}
    const event=events.find(row=>row.id===id);
    let next;
    if(action==='donor-register' && event && !rows.some(row=>row.type==='event' && row.event===id && !row.cancelled)){
      const created=Date.now();
      const number='D-'+created.toString(36).toUpperCase()+'-'+(rows.length+1).toString(36).toUpperCase();
      next=[{type:'event',event:id,date:event.date,time:event.time,number,created,cancelled:false},...rows];
    }
    if(action==='donor-cancel')next=rows.map(row=>row.type==='event' && row.number===id?{...row,cancelled:true}:row);
    if(next && (!actor || !writeStored(donorStorageKey(actor),next)))state.error='saveFailed';
    else state.error='';
    render();
  };
  void Promise.resolve(updateDonor(task)).catch(()=>{state.error='saveFailed';render()});
  return true;
}

export function donorInput(el,lang,render){
  if(donationInput(el))return true;
  if(el.id==='donor-search'){
    const pos=el.selectionStart;
    state.query=el.value;
    render();
    const input=document.getElementById(el.id);
    input?.focus();
    try{input?.setSelectionRange(pos,pos)}catch{}
    return true;
  }
  if(el.id==='donor-filter' || el.id==='event-filter'){
    state[el.id==='donor-filter'?'filter':'eventFilter']=el.value;
    render();
    return true;
  }
  return false;
}

export function donorSubmit(form,render,navigate){return donationSubmit(form,profileId,render,navigate);}

export function donorNavigate(url){
  const parsed=new URL(url,'http://localhost');
  if(sitePath(parsed.pathname).startsWith(base))openDonationPath(parsed);
}

export function endDonorSession(){
  profileId=null;
  state.error='';
  resetDonationDraft();
}

export function donorOverview(lang) {
  const t=texts[lang];
  return currentRecords().filter(row=>row.type==='event'?!row.cancelled:row.type==='booking' && donorStatus(row)==='active').map(row=>{
    const event=row.type==='event'?events.find(item=>item.id===row.event):null;
    return {section:'donation',group:t.my,label:event?eventName(row.event,lang):t.appointment,
      date:row.date||event?.date,time:row.time||event?.time};
  });
}
