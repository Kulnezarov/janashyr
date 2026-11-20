import {scheduleDate} from './ui.js';
const prefix = 'janashyr.demo.v2.';
const fallback = new Map();

export function readLocal(key, initial = null) {
  try {
    const data = globalThis.localStorage?.getItem(prefix + key);
    if (data !== null && data !== undefined) return JSON.parse(data);
  } catch {}
  return fallback.has(key) ? JSON.parse(fallback.get(key)) : initial;
}

export function writeLocal(key, value) {
  const data = JSON.stringify(value);
  fallback.set(key, data);
  try { globalThis.localStorage?.setItem(prefix + key, data); } catch {}
}

export const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[c]));

const roles = {
  volunteer: ['Волонтер','Волонтёр','Қаланы тазалау топтарына қосылыңыз.','Присоединяйтесь к группам уборки города.','/directions/city'],
  psychologist: ['Психолог','Психолог','Демо қабылдау кестесін қараңыз.','Проверьте демонстрационное расписание консультаций.','/directions/support/psychology'],
  teacher: ['Мұғалім','Учитель','Оқушылар іздеп, көмек ұсыныңыз.','Ищите учеников и предлагайте помощь с учёбой.','/directions/support/education'],
  learner: ['Оқушы','Ученик','Тәлімгер іздеп, оқу сұрауын жариялаңыз.','Ищите наставника и публикуйте запрос на обучение.','/directions/support/education'],
  pensioner: ['Зейнеткер','Пенсионер','Нұсқаулықты оқыңыз немесе көмек сұраңыз.','Откройте инструкцию или задайте вопрос помощнику.','/directions/support/digital'],
  helper: ['Цифрлық көмекші','Помощник пожилых','Цифрлық сұрауларға жауап беріңіз.','Помогайте разобраться с цифровыми вопросами.','/directions/support/digital']
};
const demos = Object.keys(roles).map(role => ({id:'preview-'+role,alias:'',role,demo:true}));
const words = {
  kk:{ login:'Демонстрациялық кіру', intro:'Осы браузерде қолданылатын профильді таңдаңыз немесе жаңасын жасаңыз.', presets:'Дайын демо аккаунттар', create:'Аккаунт жасау', alias:'Лақап ат', aliasHint:'Нақты аты-жөніңізді жазбаңыз', role:'Рөл', mine:'Жеке кабинет', profile:'Профиль', history:'Әрекеттер тарихы', signout:'Профильден шығу', change:'Басқа профиль', open:'Бөлімді ашу', local:'Профильдер мен демо тарих осы браузерде сақталады. Рөлдер сайттағы әрекеттерді көрсету үшін қолданылады.', type:'Қолжетімді әрекеттер', add:'Жаңа профиль', guests:'Әрекеттерді сақтау үшін демо профиліңізге кіріңіз.', lists:['Қолдау','Оқу','Цифрлық көмек','Донорлық','Қолжетімді орта','Қала']},
  ru:{ login:'Демонстрационный вход', intro:'Выберите готовый профиль для просмотра или создайте свой в этом браузере.', presets:'Готовые демо-аккаунты', create:'Создать аккаунт', alias:'Псевдоним', aliasHint:'Не указывайте настоящее имя', role:'Роль', mine:'Демонстрационный личный кабинет', profile:'Профиль', history:'История действий', signout:'Выйти из профиля', change:'Другой профиль', open:'Открыть раздел', local:'Профили и демо-история хранятся в этом браузере. Роли показывают доступные действия в интерфейсе.', type:'Доступные действия', add:'Новый профиль', guests:'Войдите в демо-профиль, чтобы сохранить свои действия.', lists:['Поддержка','Обучение','Цифровая помощь','Донорство','Доступная среда','Город']}
};
const index = lang => lang==='kk'?0:1;
export const profileName = (profile,lang) => profile.alias || roles[profile.role][index(lang)];
export const getProfiles = () => [...demos,...readLocal('profiles',[])];
export function currentProfile() {
  const id = readLocal('active');
  return getProfiles().find(profile=>profile.id===id) || null;
}
export function activateProfile(id) {
  const profile = getProfiles().find(row=>row.id===id);
  if(profile)writeLocal('active',profile.id);
  return profile || null;
}
export function createProfile(alias, role) {
  alias=String(alias??'').trim();
  if(alias.length<2 || alias.length>40 || !Object.hasOwn(roles,role))return null;
  const id=globalThis.crypto?.randomUUID?.() || ('local-'+Date.now()+'-'+Math.random().toString(36).slice(2));
  const profile={id,alias,role};
  writeLocal('profiles',[...readLocal('profiles',[]),profile]);
  writeLocal('active',id);
  return profile;
}
export function signOutProfile(){writeLocal('active',null)}

export function renderLogin(lang) {
  const w=words[lang], i=index(lang);
  return `<main class="wrap inner demo-profile-page">
    <header class="profile-lead"><h1><span class="profile-title-full">${w.login}</span><span class="profile-title-short">${lang==='kk'?'Демо кіру':'Демо-вход'}</span></h1><p>${w.intro}</p></header>
    <div class="profile-login-layout"><section aria-labelledby="profile-picks">
      <h2 id="profile-picks">${w.presets}</h2>
      <div class="profile-picks">${getProfiles().map(p=>`<button type="button" class="profile-pick" data-action="profile-select" data-id="${p.id}">
        <strong>${escapeText(profileName(p,lang))}</strong><span>${roles[p.role][i+2]}</span>
      </button>`).join('')}</div></section>
      <section class="profile-create"><h2>${w.add}</h2>
        <form id="profile-create-form">
          <div class="profile-field">
            <label for="profile-alias">${w.alias}</label>
            <input id="profile-alias" name="alias" type="text" minlength="2" maxlength="40" required autocomplete="off" aria-describedby="profile-alias-hint">
            <span class="profile-field-hint" id="profile-alias-hint">${w.aliasHint}</span>
          </div>
          <div class="profile-field">
            <label for="profile-role">${w.role}</label>
            <select id="profile-role" name="role">${Object.entries(roles).map(([id,role])=>`<option value="${id}">${role[i]}</option>`).join('')}</select>
          </div>
          <p>${w.local}</p><button type="submit" class="button primary">${w.create}</button>
        </form>
      </section></div></main>`;
}


// Outline icon shapes based on Lucide (https://lucide.dev), ISC license.
const profileIcons={
  overview:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  clinician:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-12 6 2 2 4-4"/>',
  'support-account':'<path d="M21 11.5a7.5 7.5 0 0 1-7.5 7.5 9 9 0 0 1-3-.5L4 21l1.8-5A7.5 7.5 0 1 1 21 11.5Z"/>',
  'education-history':'<path d="m2 10 10-5 10 5-10 5-10-5Zm4 2v5c3 3 9 3 12 0v-5"/>',
  'digital-history':'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/>',
  donation:'<path d="M12 2C9 6 5 10 5 15a7 7 0 0 0 14 0c0-5-4-9-7-13Z"/>',
  accessibility:'<circle cx="6" cy="18" r="2"/><path d="M9 18h9a3 3 0 0 0 0-6H6a3 3 0 0 1 0-6h7m4-3 4 3-4 3"/>',
  'profile-cleanup':'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'
};

function profileOverview(lang, rows) {
  const kk=lang==='kk';
  const upcoming=rows.filter(row=>row.date && Date.parse(row.date+'T'+row.time+'+05:00')>=Date.now())
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0];
  const noUpcoming=kk?'Алдағы жазылу жоқ':'Предстоящих записей пока нет';
  const active=new Map();
  for(const row of rows) {
    const item=active.get(row.section);
    if(item)item.count++;
    else active.set(row.section,{...row,count:1});
  }
  return `<section class="profile-summary" aria-labelledby="next-booking">
    <h2 id="next-booking">${kk?'Алдағы жазылу':'Ближайшая запись'}</h2>
    ${upcoming?`<a href="/account#${upcoming.section}" data-link><strong>${escapeText(upcoming.label)}</strong><span>${scheduleDate(lang,upcoming.date)} · ${escapeText(upcoming.time)}</span></a>`:`<p>${noUpcoming}</p>`}
  </section><section class="profile-summary" aria-labelledby="active-requests">
    <h2 id="active-requests">${kk?'Белсенді өтінімдер мен жазылулар':'Активные заявки и записи'}</h2>
    ${active.size?`<ul>${[...active.values()].map(row=>`<li><a href="/account#${row.section}" data-link>${escapeText(row.group)} <strong>${row.count}</strong></a></li>`).join('')}</ul>`:`<p>${kk?'Белсенді өтінімдер мен жазылулар жоқ':'Пока нет активных заявок и записей'}</p>`}
  </section>`;
}

export function renderProfile(lang,profile,hash,sections,rows=[]) {
  const w=words[lang], i=index(lang), role=roles[profile.role];
  const names=[['overview',lang==='kk'?'Шолу':'Обзор']];
  if(profile.role==='psychologist')names.push(['clinician',lang==='kk'?'Қабылдау кестесі':'Расписание консультаций']);
  const ids=['support-account','education-history','digital-history','donation','accessibility','profile-cleanup'];
  names.push(...ids.map((id,index)=>[id,w.lists[index]]));
  const tab=hash==='city'?'profile-cleanup':hash;
  const current=names.find(([id])=>id===tab)||names[0];
  const [section,label]=current;
  return `<main class="wrap inner demo-profile-page profile-dashboard">
    <header class="profile-lead"><span>${w.mine} · ${role[i]}</span><h1>${escapeText(profileName(profile,lang))}</h1></header>
    <div class="profile-history"><aside><nav class="profile-anchors" aria-label="${w.history}">
      ${names.map(([id,name])=>`<a href="/account${id==='overview'?'':'#'+id}" data-link ${section===id?'aria-current="page"':''}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${profileIcons[id]}</svg>
        <span class="profile-tab-label">${name}</span></a>`).join('')}</nav></aside>
      <div class="account-content" aria-label="${label}">
        ${section==='overview'?`<div class="profile-overview">${profileOverview(lang,rows)}</div>
        <p class="profile-local">${w.local}</p>`:sections[section]()}
        <div class="profile-toolbar">${section==='overview'?`<a class="button primary" href="${role[4]}" data-link>${w.open}</a>`:''}<a class="button secondary" href="/login" data-link>${w.change}</a><button type="button" class="text-button" data-action="logout">${w.signout}</button></div>
      </div>
    </div>
  </main>`;
}

