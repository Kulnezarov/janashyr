import {scheduleDate} from './ui.js';
const projectPrefix = 'janashyr.';
const prefix = projectPrefix + 'demo.v2.';
const fallback = new Map();

export function resetDemoStorage() {
  const stores = [];
  try {
    for (const name of ['localStorage','sessionStorage']) {
      const storage = globalThis[name];
      const keys = Array.from({length:storage.length}, (_, index) => storage.key(index));
      stores.push({storage,keys:keys.filter(key => key?.startsWith(projectPrefix))});
    }
  } catch {
    return false;
  }
  let succeeded = true;
  for (const {storage,keys} of stores) {
    for (const key of keys) {
      try { storage.removeItem(key); }
      catch { succeeded = false; }
    }
  }
  if (succeeded) fallback.clear();
  return succeeded;
}

export const demoResetText = {
  kk:{title:'Демо деректерді қалпына келтіру',confirm:'Демо деректерді өшіру',cancel:'Бас тарту',
    warning:'Осы браузердегі JANASHYR профильдері, жазбалар, белгілер және осы қойындыдағы чат өшіріледі. Бастапқы демо деректер қайта көрсетіледі.',
    done:'Демо деректер қалпына келтірілді. Бастау үшін дайын профильді таңдаңыз.',
    failed:'Барлық демо деректер өшірілмеді. Браузер қоймасына рұқсатты тексеріп, қайта көріңіз.'},
  ru:{title:'Сбросить демо-данные',confirm:'Сбросить данные',cancel:'Отмена',
    warning:'Профили, записи и метки JANASHYR в этом браузере, а также чат этой вкладки будут удалены. Снова появятся стартовые демо-данные.',
    done:'Демо-данные сброшены. Чтобы начать, выберите готовый профиль.',
    failed:'Удалось удалить не все демо-данные. Проверьте доступ к хранилищу браузера и повторите.'}
};

export function renderDemoReset(lang) {
  const w=demoResetText[lang];
  return `<dialog id="demo-reset-dialog" class="panel booking-profile-dialog" aria-labelledby="demo-reset-title" aria-describedby="demo-reset-warning">
    <h2 id="demo-reset-title">${w.title}</h2><p id="demo-reset-warning">${w.warning}</p>
    <div class="profile-toolbar"><button type="button" class="button secondary" data-action="demo-reset-close" autofocus>${w.cancel}</button>
      <button type="button" class="button primary" data-action="demo-reset-confirm">${w.confirm}</button></div>
  </dialog>`;
}

export function readLocal(key, initial = null) {
  if (fallback.has(key)) return structuredClone(fallback.get(key));
  try {
    const data = globalThis.localStorage?.getItem(prefix + key);
    if (data !== null && data !== undefined) return JSON.parse(data);
  } catch {}
  return initial;
}

export function writeLocal(key, value) {
  if (writeStored(prefix + key, value)) {
    fallback.delete(key);
    return true;
  }
  fallback.set(key, structuredClone(value));
  return false;
}

export function writeStored(key, value) {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readStoredList(key, valid = () => true) {
  try {
    const raw = globalThis.localStorage.getItem(key);
    if (raw == null) return {rows:[], issue:''};
    const value = JSON.parse(raw);
    if (Array.isArray(value)) {
      const rows = value.filter(valid);
      return {rows, issue:rows.length === value.length ? '' : 'damaged'};
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) return {rows:[], issue:'unavailable'};
  }
  return {rows:[], issue:'damaged'};
}

export const readLocalList = (key, valid) => readStoredList(prefix + key, valid);
export const writeLocalList = (key, rows) => writeStored(prefix + key, rows);

export function readLocalObject(key) {
  try {
    const raw=globalThis.localStorage.getItem(prefix+key);
    if(raw==null)return {value:{},issue:''};
    const value=JSON.parse(raw);
    if(value && typeof value==='object' && !Array.isArray(value))return {value,issue:''};
  } catch(error) {
    if(!(error instanceof SyntaxError))return {value:{},issue:'unavailable'};
  }
  return {value:{},issue:'damaged'};
}
export const writeLocalObject = (key,value) => writeStored(prefix+key,value);

export const storageText = {
  kk:{damaged:'Бүлінген деректер еленбеді. Сақтау жұмыс істесе, жазбаны қайта жасауға болады.', unavailable:'Браузер қоймасы қолжетімсіз. Сақталған жазбалар көрсетілмейді.', saveFailed:'Жазбаны сақтау мүмкін болмады. Браузер қоймасын тексеріп, қайталап көріңіз.'},
  ru:{damaged:'Повреждённые данные пропущены. Если хранилище доступно, запись можно создать заново.', unavailable:'Хранилище браузера недоступно. Сохранённые записи не отображаются.', saveFailed:'Не удалось сохранить запись. Проверьте настройки хранилища браузера и повторите попытку.'}
};

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
demos.push(
  {id:'preview-lesson-samal',alias:'Самал',role:'teacher',demo:true},
  {id:'preview-lesson-lira',alias:'Лира',role:'teacher',demo:true}
);
const words = {
  kk:{ login:'Демонстрациялық кіру', intro:'Осы браузерде қолданылатын профильді таңдаңыз немесе жаңасын жасаңыз.', presets:'Дайын демо аккаунттар', create:'Аккаунт жасау', alias:'Лақап ат', aliasHint:'Нақты аты-жөніңізді жазбаңыз', role:'Рөл', mine:'Жеке кабинет', profile:'Профиль', history:'Әрекеттер тарихы', signout:'Профильден шығу', change:'Басқа профиль', open:'Бөлімді ашу', local:'Профильдер мен демо тарих осы браузерде сақталады. Рөлдер сайттағы әрекеттерді көрсету үшін қолданылады.', type:'Қолжетімді әрекеттер', add:'Жаңа профиль', guests:'Әрекеттерді сақтау үшін демо профиліңізге кіріңіз.', lists:['Қолдау','Оқу','Цифрлық көмек','Донорлық','Қолжетімді орта','Қала']},
  ru:{ login:'Демонстрационный вход', intro:'Выберите готовый профиль для просмотра или создайте свой в этом браузере.', presets:'Готовые демо-аккаунты', create:'Создать аккаунт', alias:'Псевдоним', aliasHint:'Не указывайте настоящее имя', role:'Роль', mine:'Демонстрационный личный кабинет', profile:'Профиль', history:'История действий', signout:'Выйти из профиля', change:'Другой профиль', open:'Открыть раздел', local:'Профили и демо-история хранятся в этом браузере. Роли показывают доступные действия в интерфейсе.', type:'Доступные действия', add:'Новый профиль', guests:'Войдите в демо-профиль, чтобы сохранить свои действия.', lists:['Поддержка','Обучение','Цифровая помощь','Донорство','Доступная среда','Город']}
};
const index = lang => lang==='kk'?0:1;
export const profileRoleName = (profile,lang) => roles[profile.role][index(lang)];
export const profileName = (profile,lang) => profile.alias || profileRoleName(profile,lang);
const validProfile = row => typeof row?.id === 'string' && Boolean(row.id) &&
  typeof row.alias === 'string' && Object.hasOwn(roles,row.role) && !demos.some(demo=>demo.id===row.id);
const localProfiles = () => readLocalList('profiles',validProfile);
export const profileStorageIssue = () => localProfiles().issue;
export const getProfiles = () => [...demos,...(fallback.get('profiles') ?? localProfiles().rows)];
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
  writeLocal('profiles',[...getProfiles().filter(row=>!row.demo),profile]);
  writeLocal('active',id);
  return profile;
}
export function signOutProfile(){writeLocal('active',null)}

export function renderLogin(lang,wasReset=false) {
  const w=words[lang], i=index(lang);
  return `<main class="wrap inner demo-profile-page">
    <header class="profile-lead"><h1><span class="profile-title-full">${w.login}</span><span class="profile-title-short">${lang==='kk'?'Демо кіру':'Демо-вход'}</span></h1><p>${w.intro}</p></header>
    ${wasReset?`<p class="success" role="status" id="demo-reset-success">${demoResetText[lang].done}</p>`:''}
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
  const tab=hash==='city' || hash==='city-report-history'?'profile-cleanup':hash;
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
        <div class="profile-toolbar">${section==='overview'?`<a class="button primary" href="${role[4]}" data-link>${w.open}</a>`:''}<a class="button secondary" href="/login" data-link>${w.change}</a><button type="button" class="text-button" data-action="logout">${w.signout}</button><button type="button" class="text-button" data-action="demo-reset-open" aria-haspopup="dialog">${demoResetText[lang].title}</button></div>
      </div>
    </div>
  </main>`;
}

