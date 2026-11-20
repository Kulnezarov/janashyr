import {sitePath,siteHref,siteMarkup} from './ui.js';
import {currentProfile,activateProfile,createProfile,signOutProfile,renderLogin,renderProfile,readLocal,writeLocal} from './profiles.js';
import {renderCleanup,cleanupClick,cleanupHistory,cleanupOverview} from './cleanup.js';
import {renderHomeChat,homeChatAction,homeChatSubmit,homeChatInput,fitHomeChat,resetHomeChat} from './home-chat.js';
import {renderEducation,educationClick,educationSubmit,educationHistory} from './education-hub.js';
import {renderDigital,digitalClick,digitalSubmit,digitalHistory,digitalOverview,digitalInput} from './digital-hub.js';
import {renderProjectInfo} from './project-info.js';
import {renderCity,cityAccount,cityAction,cityInput,citySubmit,clearCityNotice,useCityProfile,saveCityProfile} from './city.js';
import {renderAccess,accessAccount,accessOverview,accessAction,accessInput,accessSubmit,clearAccessNotice,useAccessProfile,saveAccessProfile} from './access.js';
import {renderDonor,donorAccount,donorOverview,donorAction,donorInput,donorNavigate,useDonorProfile} from './donor.js';
import {renderSupport,bindPsychCarousel,accountContent,supportOverview,supportAction,supportSubmit,supportInput,clearNotice,useSupportProfile,saveSupportProfile,clinicianWorkspace} from './support.js';
import {homeCommunity, homeMapAction, siteFooter, supportIconPath} from './landing-sections.js';
import {content} from './content.js';
let lang = readLocal('language')==='ru'?'ru':'kk';
let profile = currentProfile();
function loadProfile(next){
  profile=next;
  useSupportProfile(profile);
  useAccessProfile(profile);
  useCityProfile(profile);
  useDonorProfile(profile);
}
loadProfile(profile);
let menuOpen = false;
let servicesOpen = false;
let cardsRevealed = false;
let cardRevealObserver = null;
const app = document.querySelector('#app');
const href = slug => `/directions/${slug}`;
const chrome = {
  kk:{home:'Басты бет',services:'Қызметтер',volunteers:'Волонтерлер',organizations:'Ұйымдар',about:'Платформа туралы',login:'Кіру',account:'Жеке кабинет',menu:'Мәзір',close:'Жабу'},
  ru:{home:'Главная',services:'Услуги',volunteers:'Волонтёры',organizations:'Организации',about:'О платформе',login:'Войти',account:'Личный кабинет',menu:'Меню',close:'Закрыть'}
};
function header(t) {
  const c=chrome[lang],current=sitePath();
  const languages=(variant)=>`<div class="languages languages-${variant}" role="group" aria-label="${t.language}"><button id="language-${variant}-kk" data-lang="kk" aria-pressed="${lang==='kk'}">ҚАЗ</button><span class="language-separator" aria-hidden="true">/</span><button id="language-${variant}-ru" data-lang="ru" aria-pressed="${lang==='ru'}">РУС</button></div>`;
  return `<a class="skip-link" href="#main-content">${lang==='kk'?'Негізгі мазмұнға өту':'Перейти к содержимому'}</a><header class="header"><div class="wrap header-inner"><a class="brand" href="/" data-link aria-label="JANASHYR — ${c.home}"><img class="brand-logo" src="/assets/care-logo.png?v=first" alt="" width="48" height="48"><span>JANASHYR</span></a>${languages('mobile')}<button type="button" class="menu-toggle" data-action="menu" aria-expanded="${menuOpen}" aria-controls="site-navigation" aria-label="${menuOpen?c.close:c.menu}"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="${menuOpen?'M6 6l12 12M18 6 6 18':'M4 6h16M4 12h16M4 18h16'}"/></svg></button><div id="site-navigation" class="header-content ${menuOpen?'open':''}"><nav class="main-nav" aria-label="${t.nav}"><a class="nav-home ${current==='/'?'nav-active':''}" href="/" data-link ${current==='/'?'aria-current="page"':''}>${c.home}</a><div class="services-menu ${servicesOpen?'is-open':''}"><button class="services-trigger ${current.startsWith('/directions/')?'nav-active':''}" type="button" data-action="services-menu" aria-expanded="${servicesOpen}" aria-haspopup="true" aria-controls="services-list">${c.services}<svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div id="services-list" class="services-dropdown">${t.lanes.map(x=>`<a href="${href(x.slug)}" data-link ${current.startsWith(href(x.slug))?'aria-current="page"':''}>${x.title}</a>`).join('')}</div></div><a href="/volunteers" data-link ${current==='/volunteers'?'aria-current="page"':''}>${c.volunteers}</a><a href="/organizations" data-link ${current==='/organizations'?'aria-current="page"':''}>${c.organizations}</a><a href="/about" data-link ${current==='/about'?'aria-current="page"':''}>${c.about}</a></nav><div class="tools">${languages('desktop')}<a class="login" href="${profile?'/account':'/login'}" data-link><svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.6"/><path d="M5 20c.3-3.5 3.1-5.5 7-5.5s6.7 2 7 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span>${profile?c.account:c.login}</span></a></div></div></div></header>`
}
const heroCopy={
  kk:{eyebrow:'ӘЛЕУМЕТТІК ПЛАТФОРМА',headline:'Көмек әрқашан жаныңда.',lead:'Көмек әрқашан ',highlight:'жаныңда.',desc:'Психологиялық қолдау, қан донорлығы, мүмкіндігі шектеулі адамдарға көмек және қаламызға қамқорлық — бір платформада.',help:'Көмек алу',how:'Бұл қалай жұмыс істейді',},
  ru:{eyebrow:'СОЦИАЛЬНАЯ ПЛАТФОРМА',headline:'Помощь всегда рядом.',lead:'Помощь всегда ',highlight:'рядом.',desc:'Единая платформа поддержки: психологическая помощь, донорство крови, помощь людям с инвалидностью и забота о городе.',help:'Получить помощь',how:'Как это работает',}
};
const homeSectionsCopy={
  kk:{heading:'Бірге қолдау көрсетеміз',sub:'Қажетті бағытты таңдаңыз.',titles:['Қолдау','Донорлық','Қолжетімді орта','Менің қалам'],descs:['Психологиялық көмек, білім және күнделікті қолдау.','Қан донорлығы туралы біліп, қатысу жолдарын қараңыз.','Қолжетімді маршруттар мен көмек мүмкіндіктері.','Қала мәселелерін шешуге және ортақ іске қосылыңыз.'],how:'Бұл қалай жұмыс істейді?',howSub:'Қажетті бағытты тауып, платформа мүмкіндіктерімен танысыңыз.',steps:[['Бағытты таңдаңыз','Қолдау, донорлық, қолжетімді орта немесе қалаңызға көмектесу бағыттарының бірін таңдаңыз.'],['Мүмкіндіктермен танысыңыз','Таңдаған бөлімдегі қызметтерді қарап, қажетті демо өтінімді немесе қызметті таңдаңыз.'],['Жеке кабинеттен қараңыз','Өзіңіздің демо өтінімдеріңізді, тіркелулеріңізді және олардың мәртебелерін бақылаңыз.']],note:'Бұл — демонстрациялық нұсқа. Өтінімдер нақты ұйымдарға жіберілмейді.'},
  ru:{heading:'Поддержка начинается вместе',sub:'Выберите направление, которое вам нужно.',titles:['Поддержка','Донорство','Доступная среда','Мой город'],descs:['Психологическая помощь, образование и поддержка.','Узнайте о донорстве крови и возможностях участия.','Доступные маршруты и возможности помощи.','Сообщайте о проблемах и участвуйте в жизни города.'],how:'Как это работает?',howSub:'Найдите нужное направление и познакомьтесь с возможностями платформы.',steps:[['Выберите направление','Выберите поддержку, донорство, доступную среду или помощь своему городу.'],['Изучите возможности','Откройте нужный сервис и познакомьтесь с его демонстрационными функциями.'],['Проверьте в кабинете','Просматривайте свои демо-заявки, регистрации и их текущие статусы.']],note:'Это демонстрационная версия. Заявки не отправляются реальным организациям.'}
};
const homeCardIcons=[
  supportIconPath,
  '<path d="M12 2.7C9.7 6.3 5.7 10.5 5.7 14.2a6.3 6.3 0 0 0 12.6 0C18.3 10.5 14.3 6.3 12 2.7Z"/><path d="M9.4 14.5a2.7 2.7 0 0 0 2.7 2.7"/>',
  '<circle cx="13.1" cy="4.3" r="1.9"/><path d="m11.8 8 1.2 5h4.2l2.8 4.8M12.2 9h4.1M10.6 9.8a5.5 5.5 0 1 0 4.2 6.3"/>',
  '<path d="M3 20h18M5 20V9l7-5 7 5v11M9 20v-5.5h6V20M8.5 10.5h.01M15.5 10.5h.01"/><path d="M12 7.4v2.9M10.6 8.9h2.8"/>'
];
const homeStepIcons=[
  '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="m14 13 5.5 3-2.5.7-.7 2.8-2.3-6.5Z"/>',
  '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5M8 10.5h5M10.5 8v5"/>',
  '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 12.5l2.2 2.1 4.8-5"/>'
];
function homeSections(t){const h=homeSectionsCopy[lang],slugs=['support','donation','accessibility','city'],visuals=['support','donation','access','city'];return `<section id="directions" class="home-services" aria-label="${h.heading}"><div class="wrap"><div class="home-service-grid">${slugs.map((slug,i)=>`<a class="home-service-card home-service-${visuals[i]}" href="${href(slug)}" data-link><span class="home-card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${homeCardIcons[i]}</svg></span><h2>${h.titles[i]}</h2><p>${h.descs[i]}</p><span class="home-card-arrow" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>`).join('')}</div></div></section><section id="how" class="home-how" aria-labelledby="home-how-title"><div class="wrap home-how-layout"><div class="home-how-intro"><h2 id="home-how-title">${h.how}</h2><p>${h.howSub}</p></div><div class="home-how-steps">${h.steps.map((step,i)=>`<article class="home-how-step"><span class="home-step-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${homeStepIcons[i]}</svg></span><div><h3>${step[0]}</h3><p>${step[1]}</p></div>${i<h.steps.length-1?`<span class="home-step-connector" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 12h15m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`:``}</article>`).join('')}</div><p class="home-how-note">${h.note}</p></div></section>`}
function home(t){const h=heroCopy[lang];return `<main><section class="hero"><div class="hero-overlay" aria-hidden="true"></div><div class="wrap hero-grid"><div class="hero-copy"><p class="hero-label">${h.eyebrow}</p><h1 aria-label="JANASHYR ${h.headline}"><span>${h.lead}<em class="hero-highlight">${h.highlight}</em></span></h1><p class="hero-intro">${h.desc}</p><div class="hero-actions"><a class="button primary" href="/directions/support" data-link>${h.help}<svg class="help-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg></a><a class="button secondary hero-how" href="#how"><svg class="play-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.3v7.4L15.7 12 10 8.3Z" fill="currentColor"/></svg>${h.how}</a></div></div></div></section>${homeSections(t)}${homeCommunity(lang)}${renderHomeChat(lang)}</main>`}
function volunteerPage(){
  const kk=lang==='kk';
  const copy=kk?{
    title:'Волонтерлер', intro:'Шымкентке көмектесіңіз, оқушыға қолдау көрсетіңіз немесе цифрлық сұрақты бірге шешіңіз.',
    action:'Бағыт таңдау', areas:'Қай бағытта көмектескіңіз келеді?', how:'Қалай қатысуға болады?',
    steps:['Бағытты таңдаңыз.','Қажет болса, сәйкес демо профильге кіріңіз.','Топқа қосылыңыз немесе көмек сұрауын алыңыз.'],
    demo:'Бұл демо. Жазылулар осы браузерде сақталады.', account:'Демо профильді таңдау',
    options:[
      ['Қаланы таза ұстайық','Аудан, уақыт және бос орын бойынша тазалау тобын таңдаңыз.','/directions/city','city'],
      ['Оқуға қолдау','Пәнді немесе дағдыны үйренуге көмек іздеген оқушыларды табыңыз.','/directions/support/education','learning'],
      ['Цифрлық көмек','Зейнеткерлерге телефонды және онлайн қызметтерді түсінуге көмектесіңіз.','/directions/support/digital','digital']
    ]
  }:{
    title:'Волонтёры', intro:'Помогайте Шымкенту, поддерживайте учеников или разбирайте цифровые вопросы вместе с пожилыми людьми.',
    action:'Выбрать направление', areas:'Чем вы хотите помочь?', how:'Как присоединиться',
    steps:['Выберите направление.','При необходимости откройте демо-профиль с подходящей ролью.','Вступите в группу или возьмите запрос на помощь.'],
    demo:'Это демоверсия. Записи сохраняются в этом браузере.', account:'Выбрать демо-профиль',
    options:[
      ['Уборка города','Выберите район, время и группу, в которой есть свободные места.','/directions/city','city'],
      ['Помощь с учёбой','Найдите учеников, которым нужна помощь с предметом или навыком.','/directions/support/education','learning'],
      ['Цифровая помощь','Помогите пожилым людям разобраться с телефоном и онлайн-сервисами.','/directions/support/digital','digital']
    ]
  };
  return `<main class="volunteers-page">
    <section class="volunteer-hero">
      <div class="wrap volunteer-hero-shell">
        <nav class="volunteer-crumb" aria-label="${kk?'Бөлімдер':'Разделы'}"><a href="/" data-link>${chrome[lang].home}</a><span aria-hidden="true">/</span><span aria-current="page">${copy.title}</span></nav>
        <div class="volunteer-hero-text"><h1>${copy.title}</h1><p>${copy.intro}</p><a href="#volunteer-paths" class="button primary">${copy.action}</a></div>
      </div>
    </section>
    <div class="wrap volunteer-content">
      <section id="volunteer-paths" aria-labelledby="volunteer-paths-title">
        <h2 id="volunteer-paths-title">${copy.areas}</h2>
        <div class="volunteer-paths">${copy.options.map(([title,desc,url,kind])=>`<a class="volunteer-path volunteer-path-${kind}" href="${url}" data-link><h3>${title}</h3><p>${desc}</p></a>`).join('')}</div>
      </section>
      <section class="volunteer-steps"><div><h2>${copy.how}</h2><p>${copy.demo}</p><a class="button secondary" href="${profile?'/account':'/login'}" data-link>${profile?chrome[lang].account:copy.account}</a></div>
        <ol>${copy.steps.map(text=>`<li>${text}</li>`).join('')}</ol>
      </section>
    </div>
  </main>`;
}
function routePage(path,t,lane){
  if(path==='/login')return renderLogin(lang);
  if(path==='/account')return profile?renderProfile(lang,profile,location.hash.slice(1),{
    'clinician':()=>clinicianWorkspace(lang,profile),
    'support-account':()=>accountContent(lang),
    'education-history':()=>educationHistory(lang,profile),
    'digital-history':()=>digitalHistory(lang,profile),
    'donation':()=>donorAccount(lang),
    'accessibility':()=>accessAccount(lang),
    'profile-cleanup':()=>cleanupHistory(lang,profile)+cityAccount(lang),
  },[...supportOverview(lang),...donorOverview(lang),...accessOverview(lang),...digitalOverview(lang,profile),...cleanupOverview(lang,profile)]):renderLogin(lang);
  if(path==='/organizations'||path==='/about')return renderProjectInfo(path.slice(1),lang);
  if(path==='/volunteers')return volunteerPage();
  if(path==='/directions/city'||path==='/directions/city/groups')return renderCleanup(lang,profile);
  if(path==='/directions/support/education')return renderEducation(lang,profile);
  if(path==='/directions/support/digital')return renderDigital(lang,profile);
  const feature=renderCity(path,lang) ?? renderAccess(path,lang) ?? renderDonor(path,lang) ?? renderSupport(path,lang);
  if(feature)return feature;
  if(path==='/')return home(t);
  return `<main class="wrap inner info-page"><h1>${lang==='kk'?'Бет табылмады':'Страница не найдена'}</h1><a class="button primary" href="/" data-link>${chrome[lang].home}</a></main>`;
}
function focusedSelector(){
  const el=document.activeElement;
  if(!el || !app.contains?.(el))return null;
  const safe=value=>globalThis.CSS?.escape?CSS.escape(value):String(value).replace(/[^a-zA-Z0-9_-]/g,'');
  if(el.id)return `#${safe(el.id)}`;
  for(const key of ['action','lang','accessFilter','cityDraft','accessDraft','cityAdminStatus','cityAdminLevel','cityAdminReason','adminStatus','adminComment']){
    if(el.dataset?.[key]){const attr=key.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());let selector=`[data-${attr}="${safe(el.dataset[key])}"]`;if(el.dataset.id)selector+=`[data-id="${safe(el.dataset.id)}"]`;return selector}
  }
  if(el.name&&el.form?.id)return `#${safe(el.form.id)} [name="${safe(el.name)}"]`;
  return null;
}
function prepareCardReveal(){
  cardRevealObserver?.disconnect();
  const grid=document.querySelector('.home-service-grid');
  if(!grid||cardsRevealed)return;
  if(!window.IntersectionObserver||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){cardsRevealed=true;return}
  grid.classList.add('reveal-pending');
  cardRevealObserver=new window.IntersectionObserver(entries=>{
    if(!entries.some(entry=>entry.isIntersecting))return;
    cardsRevealed=true;
    grid.classList.add('reveal-visible');
    const last=grid.lastElementChild;
    last?.addEventListener('animationend',()=>grid.classList.remove('reveal-pending','reveal-visible'),{once:true});
    cardRevealObserver.disconnect();
  },{threshold:0.12});
  cardRevealObserver.observe(grid);
}
function render(){let focus=focusedSelector();const optionsOpen=document.querySelector('.access-options')?.open;let t=content[lang];document.documentElement.lang=lang;let path=sitePath();let lane=t.lanes.find(x=>href(x.slug)===path);let body=routePage(path,t,lane);const theme=path.startsWith('/directions/support')?'support':path.startsWith('/directions/donation')?'donation':path.startsWith('/directions/accessibility')?'access':path.startsWith('/directions/city')?'city':path==='/account'||path==='/login'||path==='/organizations'||path==='/about'||path==='/volunteers'?'account':'home'; if(path.startsWith('/directions/')){const laneForPath=t.lanes.find(x=>path===href(x.slug)||path.startsWith(href(x.slug)+'/'));if(laneForPath){const sectionPath=href(laneForPath.slug);const crumbs=`<nav class="breadcrumbs" aria-label="${lang==='kk'?'Навигация жолы':'Навигационная цепочка'}"><a href="/" data-link>${t.home}</a><span aria-hidden="true">/</span>${path===sectionPath?`<span aria-current="page">${laneForPath.title}</span>`:`<a href="${sectionPath}" data-link>${laneForPath.title}</a>`}</nav>`;body=body.replace(/<a class="back"[^>]*>.*?<\/a>/,crumbs)}} body=body.replace('<main', '<main id="main-content" tabindex="-1"'); app.innerHTML=siteMarkup(`<div class="site theme-${theme}${path==="/directions/support/psychology"?' theme-psychology':''}${['/','/directions/support/psychology','/directions/support/digital','/directions/donation','/directions/accessibility','/directions/city','/directions/city/groups','/volunteers','/organizations','/about'].includes(path)?' header-over-cover':''}${['/directions/support/psychology','/directions/support/digital','/directions/donation','/directions/accessibility'].includes(path)?' header-light-cover':''}">${header(t)}${body}${siteFooter(t,lang)}</div>`);
 if(optionsOpen){const options=document.querySelector('.access-options');if(options)options.open=true}
 const activeTab=document.querySelector('.profile-anchors [aria-current="page"]');
 if(activeTab && window.matchMedia?.('(max-width: 980px)').matches){
   const tabs=activeTab.parentElement;
   const left=activeTab.offsetLeft-tabs.offsetLeft;
   if(tabs.scrollWidth>tabs.clientWidth)tabs.scrollLeft=Math.max(0,left-10);
 }
 prepareCardReveal();
 bindPsychCarousel(document.querySelector('.psych-carousel-scroll'));
 const bookingDialog=document.getElementById?.('psych-booking');
 if(bookingDialog?.showModal){
   bookingDialog.showModal();
   bookingDialog.addEventListener('cancel',event=>{event.preventDefault();supportAction('psych-close',null,lang,render)});
   bookingDialog.addEventListener('click',event=>{
     if(event.target!==bookingDialog)return;
     const bounds=bookingDialog.getBoundingClientRect();
     if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)
       supportAction('psych-close',null,lang,render);
   });
 }
 const chatPanel=document.querySelector('.home-chat-panel');
 if(chatPanel){
   for(const part of document.querySelectorAll('.site > .skip-link,.site > .header,.site > .site-footer,main > :not(.home-chat-widget)'))part.inert=true;
 } else if(menuOpen && window.matchMedia?.('(max-width: 980px)').matches){
   for(const part of document.querySelectorAll('.site > main,.site > .site-footer'))part.inert=true;
 }
 fitHomeChat();
 for(const key of ['.chat-log','.home-chat-log']){const log=document.querySelector(key);if(log)log.scrollTop=log.scrollHeight;}if(focus)document.querySelector(focus)?.focus({preventScroll:true}); document.title=(lane?lane.title+' — ':'')+'JANASHYR';}
function navigate(url){clearNotice();clearAccessNotice();clearCityNotice();donorNavigate(url);servicesOpen=false;history.pushState({},'',siteHref(url));menuOpen=false;render(); if(location.hash && sitePath()!=='/account') document.getElementById(location.hash.slice(1))?.scrollIntoView(); else {window.scrollTo(0,0);document.querySelector('#main-content')?.focus({preventScroll:true})}}
document.addEventListener('click',event=>{
  if(menuOpen && !event.target.closest('.header')){menuOpen=false;servicesOpen=false;render();return}
  const link=event.target.closest('[data-link]');
  if(link && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button===0){
    event.preventDefault();navigate(link.getAttribute('href'));return;
  }
  const language=event.target.closest('[data-lang]');
  if(language && ['kk','ru'].includes(language.dataset.lang)){lang=language.dataset.lang;writeLocal('language',lang);render();return}
  const control=event.target.closest('[data-action]');
  const action=control?.dataset.action, id=control?.dataset.id;
  if(!action)return;
  if(action==='profile-select'){
    const next=activateProfile(id);
    if(next){if(profile?.id!==next.id)resetHomeChat();loadProfile(next);navigate('/account')}
    return;
  }
  if(action==='logout'){signOutProfile();resetHomeChat();loadProfile(null);navigate('/');return}
  if(homeChatAction(action,id,lang,render)||homeMapAction(action,id,render))return;
  if(cleanupClick(action,id,profile)||educationClick(action,id,lang,profile)||digitalClick(action,id,lang,profile)){render();
    if(action==='digital-select-volunteer')document.getElementById?.('digital-request-topic')?.focus();
    if(action==='cleanup-zone' && window.matchMedia?.('(max-width: 620px)').matches){
      const groups=document.querySelector('.cleanup-groups');
      groups?.focus({preventScroll:true});
      groups?.scrollIntoView({block:'start'});
    }
    return;
  }
  if(action.startsWith('city-admin'))return;
  const destructive=['clear-chat','cancel-request','donor-cancel','access-cancel','access-delete-route','city-close-group','city-cancel-event','city-photo-remove','access-remove-photo'];
  if(destructive.includes(action) && typeof window.confirm==='function' && !window.confirm(lang==='kk'?'Бұл демо әрекетті орындауды растайсыз ба?':'Подтвердить это действие в демо-версии?'))return;
  if(cityAction(action,id,lang,()=>{saveCityProfile();render()},url=>{saveCityProfile();navigate(url)}))return;
  if(accessAction(action,id,lang,()=>{saveAccessProfile();render()}))return;
  if(donorAction(action,id,lang,render,navigate))return;
  if(supportAction(action,id,lang,()=>{saveSupportProfile();render()}))return;
  if(action==='services-menu'){servicesOpen=!servicesOpen;render()}
  if(action==='menu'){menuOpen=!menuOpen;servicesOpen=false;render()}
});
document.addEventListener('submit',event=>{
  const form=event.target;
  if(form.id==='profile-create-form'){
    event.preventDefault();
    const data=new FormData(form);
    const next=createProfile(data.get('alias'),data.get('role'));
    if(next){resetHomeChat();loadProfile(next);navigate('/account')}
    else if(form.elements?.alias){
      form.elements.alias.setCustomValidity(lang==='kk'?'Лақап атты тексеріңіз.':'Проверьте псевдоним.');
      form.elements.alias.reportValidity();
    }
    return;
  }
  if(form.id==='home-ai-form'){event.preventDefault();homeChatSubmit(form,render);return}
  if(/^(education-|digital-)/.test(form.id)){
    event.preventDefault();
    if(educationSubmit(form,lang,profile)||digitalSubmit(form,lang,profile))render();
    return;
  }
  if(['city-group-form','city-event-form','city-edit-group','city-comment-form','city-event-time','city-event-status','city-report-form'].includes(form.id)){
    event.preventDefault();
    citySubmit(form,lang,()=>{saveCityProfile();render()},url=>{saveCityProfile();navigate(url)});
    return;
  }
  if(form.id==='access-form'){event.preventDefault();accessSubmit(form,lang,()=>{saveAccessProfile();render()});return}
  if(['consult-form','psych-survey-form','volunteer-form','chat-form'].includes(form.id)){
    event.preventDefault();supportSubmit(form,lang,()=>{saveSupportProfile();render()});
  }
});
document.addEventListener('input',e=>{if(homeChatInput(e.target))return;if(e.target.form?.id==='profile-create-form' && e.target.name==='alias')e.target.setCustomValidity('');cityInput(e.target,lang,render);accessInput(e.target,lang,render);donorInput(e.target,lang,render);supportInput(e.target,lang,render)});
document.addEventListener('change',e=>{if(digitalInput(e.target,render))return;cityInput(e.target,lang,render);accessInput(e.target,lang,render);donorInput(e.target,lang,render);supportInput(e.target,lang,render)});
document.addEventListener('pointerover',e=>{const menu=e.target.closest?.('.services-menu');if(menu)menu.querySelector('.services-trigger')?.setAttribute('aria-expanded','true')});
document.addEventListener('pointerout',e=>{const menu=e.target.closest?.('.services-menu');if(menu&&!menu.contains(e.relatedTarget)&&!servicesOpen)menu.querySelector('.services-trigger')?.setAttribute('aria-expanded','false')});
document.addEventListener('keydown',event=>{
  if(event.defaultPrevented)return;
  const chatPanel=document.querySelector('.home-chat-panel');
  if(event.key==='Tab' && chatPanel){
    const controls=[...chatPanel.querySelectorAll('a[href],button:not(:disabled),input,[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const edge=event.shiftKey?controls[0]:controls.at(-1);
    if(document.activeElement===edge || !chatPanel.contains(document.activeElement)){
      event.preventDefault();
      (event.shiftKey?controls.at(-1):controls[0])?.focus();
    }
    return;
  }
  if(event.key!=='Escape')return;
  if(menuOpen||servicesOpen){
    const selector=menuOpen?'.menu-toggle':'.services-trigger';
    menuOpen=false;servicesOpen=false;render();
    document.querySelector(selector)?.focus();
    return;
  }
  if(document.querySelector('.home-chat-widget.is-open'))homeChatAction('home-ai-toggle',null,lang,render);
});
window.visualViewport?.addEventListener('resize',fitHomeChat);
window.visualViewport?.addEventListener('scroll',fitHomeChat);
window.addEventListener('popstate',()=>{menuOpen=false;servicesOpen=false;clearNotice();render()});donorNavigate(location.href);render();

