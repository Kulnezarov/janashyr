import {scheduleTimestamp,helpText,helpPlace,helpWindowLabel,helpTimeLabel,readHelpWindow,renderHelpWindowFields} from './ui.js';
const subjects = {
  math: ['Математика', 'Математика'],
  languages: ['Тілдер', 'Языки'],
  science: ['Жаратылыстану', 'Естественные науки'],
  digital: ['Цифрлық сауат', 'Цифровая грамотность'],
  humanities: ['Гуманитарлық пәндер', 'Гуманитарные предметы']
};
const sources = {
  student: ['Студент', 'Студент'],
  school: ['Озат оқушы', 'Успевающий школьник'],
  teacher: ['Мұғалім', 'Учитель'],
  retired: ['Зейнеттегі мұғалім', 'Педагог на пенсии']
};
const formats = {
  online: ['Онлайн', 'Онлайн'],
  local: ['Шымкентте жүзбе-жүз', 'Очно в Шымкенте']
};
const studyLanguages = {
  kk: ['Қазақша', 'Казахский'],
  ru: ['Орысша', 'Русский'],
  both: ['Қазақша және орысша', 'Казахский и русский']
};
const schedules = {
  weekday: ['Жұмыс күндері', 'Будни'],
  weekend: ['Демалыс күндері', 'Выходные'],
  flexible: ['Келісім бойынша', 'По договорённости']
};
const demos = [
  {id:'mentor-aru', kind:'teacher', alias:['Аруна', 'Аруна'], subject:'math', source:'student', format:'online', speech:'both', schedule:'weekday', detail:['Бөлшектер мен теңдеулерді қарапайым мысалдармен түсіндіремін.', 'Объясняет дроби и уравнения на простых примерах.']},
  {id:'mentor-askar', kind:'teacher', alias:['Асқар', 'Аскар'], subject:'digital', source:'retired', format:'local', speech:'both', schedule:'flexible', detail:['Компьютермен жұмыс істеу және құжаттарды рәсімдеу негіздері.', 'Основы работы с компьютером и оформления документов.']},
  {id:'mentor-sofia', kind:'teacher', alias:['София', 'София'], subject:'languages', source:'school', format:'online', speech:'ru', schedule:'weekend', detail:['Ағылшын тіліндегі қысқа мәтіндерді оқып, талқылаймыз.', 'Помогает читать и обсуждать короткие тексты на английском.']},
  {id:'mentor-dana', kind:'teacher', alias:['Дана', 'Дана'], subject:'science', source:'teacher', format:'online', speech:'kk', schedule:'weekday', detail:['Химия мен биология тақырыптарын мектеп деңгейінде қайталаймыз.', 'Помогает повторить школьные темы по химии и биологии.']},
  {id:'learner-aibek', kind:'learner', alias:['Айбек', 'Айбек'], subject:'math', format:'online', speech:'kk', schedule:'weekend', detail:['Пайыздар мен пропорцияларға жаттығу керек.', 'Ищет помощь с процентами и пропорциями.']},
  {id:'learner-malika', kind:'learner', alias:['Мәлика', 'Малика'], subject:'languages', format:'online', speech:'both', schedule:'weekday', detail:['Сөйлесу тәжірибесін жақсартқысы келеді.', 'Хочет больше практиковаться в разговорной речи.']},
  {id:'learner-roman', kind:'learner', alias:['Роман', 'Роман'], subject:'digital', format:'local', speech:'ru', schedule:'flexible', detail:['Мәтіндік құжаттар мен электрондық кестелерді үйренгісі келеді.', 'Хочет освоить текстовые документы и электронные таблицы.']}
];

const demoWindows=[['16:00','19:00'],['11:00','14:00'],['12:00','15:00'],['17:00','19:00'],['10:00','12:00'],['16:00','18:00'],['13:00','16:00']];
demos.forEach((row,i)=>{
  [row.from,row.until]=demoWindows[i];
  row.location=row.format==='local'?'library':'';
});

const copy = {
  kk:{
    back:'Қолдау', name:'Тегін білім', lead:'Бірге үйреніңіз, біліміңізбен бөлісіңіз.', intro:'Пән мен оқу форматын таңдап, ерікті ұстазды немесе көмек қажет оқушыны табыңыз.',
    courses:'Өз бетіңізше оқуға арналған курстар', teachers:'Ұстаз іздеу', learners:'Оқушы іздеу', search:'Іздеу', placeholder:'Есім немесе пән',
    subject:'Пән', source:'Ұстаз туралы', format:'Формат', speech:'Оқу тілі', schedule:'Ыңғайлы уақыт', any:'Барлығы', clear:'Сүзгіні тазарту',
    count:n=>`${n} ұсыныс`, none:'Сәйкес ұсыныс табылмады. Іздеу сөзін немесе сүзгілерді өзгертіп көріңіз.',
    demo:'Демо үлгі', local:'Жергілікті ұсыныс', free:'Тегін', own:'Сіздің ұсынысыңыз', saved:'Бейінге сақталды', save:'Қызығушылық білдіру',
    roster:'Ерікті ұстаздар', needs:'Көмек іздейтін оқушылар', forTeacher:'Оқушыға көмектесу үшін ұстаз бейінін пайдаланыңыз.',
    forLearner:'Ұстазға қызығушылық білдіру үшін оқушы бейінін пайдаланыңыз.', login:'Бейінге кіру', profile:'Менің бейінім',
    publish:'Ұсыныс жариялау', edit:'Ұсынысты жаңарту', remove:'Ұсынысты алып тастау', asTeacher:'Қай пәннен көмектесе аласыз?', asLearner:'Қай пәннен көмек керек?',
    scoped:'Ұсыныстар мен қызығушылықтар тек осы браузерде сақталады. Олар басқа адамдарға жіберілмейді.',
    teacherDetail:'Осы пән бойынша тегін түсіндіруге немесе жаттығуға көмектеседі.', learnerDetail:'Осы пән бойынша тегін көмек іздейді.',
    history:'Тегін білім тарихы', emptyHistory:'Әзірге сақталған ұсыныстар жоқ.', undo:'Тарихтан алып тастау', changed:'Ұсынысыңыз сақталды.', removed:'Ұсыныс алынды.', readOnly:'Браузер деректерді сақтауға рұқсат бермеді.'
  },
  ru:{
    back:'Поддержка', name:'Бесплатное образование', lead:'Учитесь вместе. Делитесь знаниями.', intro:'Выберите предмет и формат, чтобы найти наставника или ученика, которому нужна помощь.',
    courses:'Курсы для самостоятельного обучения', teachers:'Найти наставника', learners:'Найти ученика', search:'Поиск', placeholder:'Имя или предмет',
    subject:'Предмет', source:'Кто помогает', format:'Формат', speech:'Язык занятий', schedule:'Удобное время', any:'Все', clear:'Сбросить фильтры',
    count:n=>`Найдено: ${n}`, none:'Подходящих объявлений нет. Измените запрос или сбросьте фильтры.',
    demo:'Демо-анкета', local:'Локальное объявление', free:'Бесплатно', own:'Ваше объявление', saved:'Сохранено в профиле', save:'Откликнуться',
    roster:'Наставники-волонтёры', needs:'Ученики, которым нужна помощь', forTeacher:'Чтобы откликнуться ученику, используйте профиль наставника.',
    forLearner:'Чтобы откликнуться наставнику, используйте профиль ученика.', login:'Войти в профиль', profile:'Мой профиль',
    publish:'Опубликовать объявление', edit:'Обновить объявление', remove:'Снять объявление', asTeacher:'С каким предметом вы можете помочь?', asLearner:'С каким предметом нужна помощь?',
    scoped:'Объявления и отклики сохраняются в этом браузере. Демонстрационные отклики остаются у вас в профиле.',
    teacherDetail:'Предлагает бесплатные объяснения и практику по этому предмету.', learnerDetail:'Ищет бесплатную помощь по этому предмету.',
    history:'История бесплатного обучения', emptyHistory:'Откликов пока нет.', undo:'Убрать из истории', changed:'Объявление сохранено.', removed:'Объявление снято.', readOnly:'Браузер не разрешил сохранить запись.'
  }
};
const listingsKey = 'janashyr.education.listings.v1';
const historyKey = id => 'janashyr.education.history.v1.' + id;
const freshFilters = () => ({query:'', subject:'', source:'', format:'', speech:''});
const state = {view:'teacher', filters:freshFilters(), status:'', draft:null};
const tr = (value, lang) => Array.isArray(value) ? value[lang === 'kk' ? 0 : 1] : value;
const own = (dict, key) => Object.hasOwn(dict, key);
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const accepts = (profile, kind) => Boolean(profile?.id && profile.role === kind);
const actorFor = kind => kind === 'teacher' ? 'learner' : 'teacher';

function read(key) {
  try {
    const value = JSON.parse(globalThis.localStorage?.getItem(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
function write(key, records) {
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(key, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}
function listings() {
  return demos.concat(read(listingsKey).filter(row => row?.id && row.owner
    && ['teacher','learner'].includes(row.kind)
    && own(subjects,row.subject) && own(formats,row.format) && own(studyLanguages,row.speech)
    && own(schedules,row.schedule) && (row.kind !== 'teacher' || own(sources,row.source))));
}
function saved(profile) {
  return profile?.id ? read(historyKey(profile.id)).filter(row=>row?.id && own(subjects,row.subject)) : [];
}
function matches(row, lang) {
  const f=state.filters;
  const title=[tr(row.alias,lang),tr(subjects[row.subject],lang),tr(sources[row.source],lang),tr(row.detail,lang)].join(' ').toLowerCase();
  return row.kind===state.view && (!f.query || title.includes(f.query.toLowerCase()))
    && (!f.subject || row.subject===f.subject) && (!f.source || row.source===f.source)
    && (!f.format || row.format===f.format) && (!f.speech || row.speech===f.speech || row.speech==='both');
}
function select(name,label,options,lang,value,emptyLabel) {
  return `<label>${label}<select name="${name}">${emptyLabel ? `<option value="">${emptyLabel}</option>` : ''}
    ${Object.entries(options).map(([key,text])=>`<option value="${key}"${key===value?' selected':''}>${tr(text,lang)}</option>`).join('')}
  </select></label>`;
}
function listingCard(row, lang, profile, mine) {
  const w=copy[lang];
  const alias=escape(tr(row.alias,lang));
  const detail=escape(tr(row.detail,lang) || (row.kind==='teacher'?w.teacherDetail:w.learnerDetail));
  const action=mine
    ? `<span class="edu-listed">${w.saved}</span>`
    : accepts(profile,actorFor(row.kind))
      ? `<button type="button" class="edu-button edu-button-accent" data-action="edu-interest" data-id="${escape(row.id)}">${w.save}</button>`
      : row.owner===profile?.id && row.owner ? `<span class="edu-listed">${w.own}</span>` : '';
  return `<article class="edu-offer">
    <div class="edu-offer-top"><span class="edu-label">${row.owner?w.local:w.demo}</span><span class="edu-free">${w.free}</span></div>
    <div class="edu-identity"><span class="edu-initial" aria-hidden="true">${escape(String(tr(row.alias,lang) || '?').slice(0,1))}</span>
      <div><h3>${alias}</h3><p>${escape(tr(subjects[row.subject],lang))}${row.source?` · ${escape(tr(sources[row.source],lang))}`:''}</p></div>
    </div>
    <p class="edu-description">${detail}</p>
    <dl class="edu-offer-meta">
      <div><dt>${w.format}</dt><dd>${tr(formats[row.format],lang)}</dd></div>
      <div><dt>${w.speech}</dt><dd>${tr(studyLanguages[row.speech],lang)}</dd></div>
      <div><dt>${w.schedule}</dt><dd>${tr(schedules[row.schedule],lang)} · ${helpTimeLabel(lang,row)}</dd></div>
      ${row.format==='local' && row.location?`<div><dt>${helpText[lang].place}</dt><dd>${helpPlace(lang,row.location)}</dd></div>`:''}
    </dl>
    ${action ? `<div class="edu-offer-action">${action}</div>` : ''}
  </article>`;
}
function publishPanel(lang,profile,ownListing) {
  if (!accepts(profile,'teacher') && !accepts(profile,'learner')) return '';
  const w=copy[lang];
  const values=state.draft?.owner===profile.id?state.draft:ownListing;
  return `<section class="edu-publish" aria-labelledby="edu-publish-title">
    <div><h2 id="edu-publish-title">${profile.role==='teacher'?w.asTeacher:w.asLearner}</h2><p>${w.scoped}</p></div>
    <form id="education-publish" class="edu-publish-form">
      ${select('subject',w.subject,subjects,lang,values?.subject)}
      ${profile.role==='teacher'?select('source',w.source,sources,lang,values?.source):''}
      ${select('format',w.format,formats,lang,values?.format)}
      ${select('speech',w.speech,studyLanguages,lang,values?.speech)}
      ${select('schedule',w.schedule,schedules,lang,values?.schedule)}
      ${renderHelpWindowFields(lang,values)}
      ${state.status==='invalidWindow'?`<p class="help-window-error" role="alert">${helpText[lang].invalid}</p>`: ''}
      <div class="edu-form-actions"><button type="submit" class="edu-button edu-button-accent">${ownListing?w.edit:w.publish}</button>
      ${ownListing?`<button type="button" class="edu-button edu-button-neutral" data-action="edu-unpublish">${w.remove}</button>`:''}</div>
    </form>
  </section>`;
}
export function renderEducation(lang,profile) {
  const w=copy[lang];
  const rows=listings();
  const filtered=rows.filter(row=>matches(row,lang));
  const liked=new Set(saved(profile).map(row=>row.id));
  const canInterest=accepts(profile,actorFor(state.view));
  const callout=canInterest
    ? `<p class="edu-scope">${w.scoped}</p>`
    : `<div class="edu-access"><p>${state.view==='teacher'?w.forLearner:w.forTeacher}</p><a href="${profile?.id?'/account':'/login'}" data-link>${profile?.id?w.profile:w.login}</a></div>`;
  return `<main class="edu-hub">
    <div class="wrap edu-wrap">
      <nav class="edu-breadcrumb" aria-label="${lang==='kk'?'Бөлімдер':'Разделы'}"><a href="/directions/support" data-link>${w.back}</a><span aria-hidden="true">/</span><span aria-current="page">${w.name}</span></nav>
      <section class="edu-hero">
        <div><h1>${w.name}</h1><p class="edu-lead">${w.lead}</p><p>${w.intro}</p>
          <div class="edu-hero-actions">
            <a class="edu-button edu-button-on-dark" href="#education-search">${w.search}</a>
            <a class="edu-courses-link" href="/directions/support/education/courses" data-link>${w.courses}</a>
          </div>
        </div>
        <div class="edu-hero-art" aria-hidden="true"><span class="edu-notebook"></span><span class="edu-notebook edu-notebook-two"></span><span class="edu-pencil"></span></div>
      </section>
      <section class="edu-directory" aria-labelledby="edu-directory-title">
        <div class="edu-modes" role="group" aria-label="${w.search}">
          <button type="button" data-action="edu-mode" data-id="teacher" aria-pressed="${state.view==='teacher'}">${w.teachers}</button>
          <button type="button" data-action="edu-mode" data-id="learner" aria-pressed="${state.view==='learner'}">${w.learners}</button>
        </div>
        <div class="edu-directory-grid">
        <form id="education-search" class="edu-filters" tabindex="-1">
          <label class="edu-search-field">${w.search}<input type="search" name="query" maxlength="100" placeholder="${w.placeholder}" value="${escape(state.filters.query)}"></label>
          ${select('subject',w.subject,subjects,lang,state.filters.subject,w.any)}
          ${select('format',w.format,formats,lang,state.filters.format,w.any)}
          ${select('speech',w.speech,studyLanguages,lang,state.filters.speech,w.any)}
          ${state.view==='teacher'?select('source',w.source,sources,lang,state.filters.source,w.any):''}
          <div class="edu-filter-actions"><button class="edu-button edu-button-accent" type="submit">${w.search}</button><button class="edu-button edu-button-neutral" type="button" data-action="edu-reset">${w.clear}</button></div>
        </form>
        <div class="edu-directory-results">
        <div class="edu-results-head"><h2 id="edu-directory-title">${state.view==='teacher'?w.roster:w.needs}</h2><span role="status">${w.count(filtered.length)}</span></div>
        ${state.status && state.status!=='invalidWindow'?`<p class="edu-notice" role="status">${state.status==='interest'?w.saved:state.status==='invalidWindow'?helpText[lang].invalid:w[state.status]}</p>`:''}
        ${callout}
        ${filtered.length?`<div class="edu-offers">${filtered.map(row=>listingCard(row,lang,profile,liked.has(row.id))).join('')}</div>`:`<p class="edu-empty">${w.none}</p>`}
        </div></div>
      </section>
      ${publishPanel(lang,profile,rows.find(row=>row.owner===profile?.id && row.owner))}
    </div>
  </main>`;
}
export function educationClick(action,id,lang,profile) {
  if (!action?.startsWith('edu-')) return false;
  state.status='';
  if (action==='edu-mode' && ['teacher','learner'].includes(id)) {
    if (state.view!==id) state.filters=freshFilters();
    state.view=id;
    return true;
  }
  if (action==='edu-reset') {
    state.filters=freshFilters();
    return true;
  }
  if (action==='edu-interest') {
    const row=listings().find(item=>item.id===id);
    if (!row || !accepts(profile,actorFor(row.kind)) || row.owner===profile.id) return false;
    const entries=saved(profile);
    if (entries.some(item=>item.id===id)) return true;
    const next={id,alias:row.alias,kind:row.kind,subject:row.subject,format:row.format,from:row.from,until:row.until,location:row.location,at:Date.now()};
    state.status=write(historyKey(profile.id),[next,...entries])?'interest':'readOnly';
    return true;
  }
  if (action==='edu-unsave' && profile?.id) {
    state.status=write(historyKey(profile.id),saved(profile).filter(item=>item.id!==id))?'':'readOnly';
    return true;
  }
  if (action==='edu-unpublish' && (accepts(profile,'teacher') || accepts(profile,'learner'))) {
    state.status=write(listingsKey,read(listingsKey).filter(row=>row?.owner!==profile.id))?'removed':'readOnly';
    return true;
  }
  return false;
}
export function educationSubmit(form,lang,profile) {
  if (!['education-search','education-publish'].includes(form.id)) return false;
  const data=new FormData(form);
  if (form.id==='education-search') {
    const fields={subject:subjects,format:formats,speech:studyLanguages,source:sources};
    state.filters=freshFilters();
    state.filters.query=String(data.get('query') ?? '').trim().slice(0,100);
    for (const [name,options] of Object.entries(fields)) {
      const value=data.get(name);
      if (own(options,value) && (name!=='source' || state.view==='teacher')) state.filters[name]=value;
    }
    state.status='';
    return true;
  }
  const kind=profile?.role;
  if (!['teacher','learner'].includes(kind) || !accepts(profile,kind)) return false;
  const fields={subject:subjects,format:formats,speech:studyLanguages,schedule:schedules};
  if (kind==='teacher') fields.source=sources;
  const row={id:'education-'+profile.id,owner:profile.id,alias:profile.alias ? String(profile.alias).slice(0,45) : kind==='teacher' ? sources.teacher : ['Оқушы','Ученик'],kind};
  for (const [name,options] of Object.entries(fields)) {
    const value=data.get(name);
    if (!own(options,value)) return false;
    row[name]=value;
  }
  const availability=readHelpWindow(data,row.format);
  if(!availability){
    state.draft={...row,from:data.get('from'),until:data.get('until'),location:data.get('location')};
    state.status='invalidWindow';
    return true;
  }
  state.draft=null;
  Object.assign(row,availability);
  state.view=kind;
  state.filters=freshFilters();
  state.status=write(listingsKey,[row,...read(listingsKey).filter(item=>item?.owner!==profile.id)])?'changed':'readOnly';
  return true;
}
export function educationHistory(lang,profile) {
  const w=copy[lang];
  const entries=saved(profile);
  return `<section id="education-history" class="edu-history" aria-labelledby="edu-history-title"><h3 id="edu-history-title">${w.history}</h3>
    ${entries.length?`<ul>${entries.map(row=>`<li><div><strong>${escape(tr(row.alias,lang))}</strong><span>${escape(tr(subjects[row.subject],lang))}${Number.isFinite(row.at)?' · '+scheduleTimestamp(lang,row.at,false):''}</span>${row.format?`<span>${helpWindowLabel(lang,row)}</span>`:''}</div>
    <button type="button" class="edu-button edu-button-neutral" data-action="edu-unsave" data-id="${escape(row.id)}">${w.undo}</button></li>`).join('')}</ul>`:`<p>${w.emptyHistory}</p>`}
  </section>`;
}
