/** Shared semantic page chrome. Content and application state stay in their feature modules. */
export function pageShell({base,back,kicker,title,body}){
  return `<main class="inner wrap support-page"><header class="support-heading photo-hero photo-hero-bleed photo-hero-compact">
    <a class="back" href="${base}" data-link>← ${back}</a><span class="kicker">${kicker}</span><h1>${title}</h1>
  </header>${body}</main>`;
}
export function demoNotice(message){return `<div class="demo-notice" role="note">${message}</div>`}

/** Schedule labels use project translations even on browsers without Kazakh calendar data. */
const scheduleWords={
  kk:{
    days:['Жексенбі','Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі'],
    shortDays:['Жс','Дс','Сс','Ср','Бс','Жм','Сб'],
    months:['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'],
    shortMonths:['қаң.','ақп.','нау.','сәу.','мам.','мау.','шіл.','там.','қыр.','қаз.','қар.','жел.']
  },
  ru:{
    days:['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
    shortDays:['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
    months:['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
    shortMonths:['янв.','февр.','мар.','апр.','мая','июн.','июл.','авг.','сент.','окт.','нояб.','дек.']
  }
};

export function scheduleDate(lang, date, format={weekday:'long',day:'numeric',month:'long'}){
  const value=typeof date==='string'?new Date(date+'T12:00:00Z'):date;
  const calendar=scheduleWords[lang];
  const weekday=value.getUTCDay(), month=value.getUTCMonth(), day=value.getUTCDate();
  const dayName=format.weekday==='short'?calendar.shortDays[weekday]:calendar.days[weekday];
  const monthName=format.month==='short'?calendar.shortMonths[month]:calendar.months[month];
  const numeric=[format.day?day:'',format.month?monthName:''].filter(Boolean).join(' ');
  return [format.weekday?dayName:'',numeric].filter(Boolean).join(', ');
}

const shymkentTimestampParts = new Intl.DateTimeFormat('en-CA',{
  timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'
});
export function scheduleTimestamp(lang,value,showTime=true){
  const parts=Object.fromEntries(shymkentTimestampParts.formatToParts(value).map(({type,value})=>[type,value]));
  const key=[parts.year,parts.month,parts.day].join('-');
  const date=scheduleDate(lang,key,{day:'numeric',month:'long'})+' '+parts.year;
  return showTime?date+' · '+parts.hour+':'+parts.minute:date;
}

const helpPlaces={
  library:['Демо мекенжай: Шымкент, Кітапхана көшесі, 1 (ойдан шығарылған)','Демо-адрес: Шымкент, ул. Библиотечная, 1 (вымышленный)'],
  community:['Демо мекенжай: Шымкент, Қауымдастық көшесі, 2 (ойдан шығарылған)','Демо-адрес: Шымкент, ул. Сообщества, 2 (вымышленный)']
};
export const helpText={
  kk:{format:'Көмек форматы',online:'Онлайн',local:'Жүзбе-жүз',from:'Басталуы',until:'Аяқталуы',place:'Кездесу орны',hours:'Бос уақыт (Шымкент)',invalid:'Басталу уақыты аяқталу уақытынан ерте болуы керек.',unchecked:'Уақыт нақтыланады'},
  ru:{format:'Формат помощи',online:'Онлайн',local:'Очно',from:'Начало',until:'Окончание',place:'Место встречи',hours:'Свободное время (Шымкент)',invalid:'Время начала должно быть раньше окончания.',unchecked:'Время уточняется'}
};
export const helpPlace=(lang,id)=>helpPlaces[id]?.[lang==='kk'?0:1] || '';
const validHelpTime=value=>typeof value==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);

export function readHelpWindow(data, format){
  const from=data.get('from'), until=data.get('until'), location=data.get('location');
  if(!['local','online'].includes(format) || !validHelpTime(from) || !validHelpTime(until) || from>=until ||
    (format==='local' && !Object.hasOwn(helpPlaces,location)))return null;
  return {format,from,until,location:format==='local'?location:''};
}

export function helpTimeLabel(lang,row){
  return validHelpTime(row?.from) && validHelpTime(row?.until)
    ? row.from+'–'+row.until : helpText[lang].unchecked;
}
export function helpWindowLabel(lang,row){
  const w=helpText[lang];
  return [w[row.format],helpTimeLabel(lang,row),row.format==='local'?helpPlace(lang,row.location):''].filter(Boolean).join(' · ');
}

export function renderHelpWindowFields(lang,row={},includeFormat=false){
  const w=helpText[lang];
  const format=includeFormat?`<label>${w.format}<select name="format"><option value="online">${w.online}</option><option value="local" ${row.format==='local'?'selected':''}>${w.local}</option></select></label>`:'';
  const selectPlace=`<label class="help-location">${w.place}<select name="location">${Object.keys(helpPlaces).map(key=>`<option value="${key}" ${row.location===key?'selected':''}>${helpPlace(lang,key)}</option>`).join('')}</select></label>`;
  return `${format}<label>${w.from}<input type="time" name="from" value="${validHelpTime(row.from)?row.from:'10:00'}" required></label>
    <label>${w.until}<input type="time" name="until" value="${validHelpTime(row.until)?row.until:'12:00'}" required></label>${selectPlace}`;
}

export function timeAfter(start, minutes){
  if(!validHelpTime(start))return '';
  const [hour,minute]=start.split(':').map(Number);
  const total=(hour*60+minute+minutes)%1440;
  return String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0');
}

// All app routes are written from the site root, even on a GitHub project subpath.
const moduleUrl = new URL(import.meta.url);
const siteBase = moduleUrl.protocol==='file:'?'':new URL('.',moduleUrl).pathname.replace(/\/$/, '');

export function sitePath(pathname=globalThis.location?.pathname ?? '/') {
  const local=siteBase && (pathname===siteBase || pathname.startsWith(siteBase+'/'))
    ? pathname.slice(siteBase.length)
    : pathname;
  return local.replace(/\/+$/, '') || '/';
}

export function siteHref(href) {
  if (!siteBase || href===siteBase || href.startsWith(siteBase+'/')) return href;
  return /^\/(?!\/)/.test(href) ? siteBase+href : href;
}

export function siteMarkup(markup) {
  return siteBase ? markup.replace(/(\s(?:href|src)=")(\/(?!\/)[^"]*)/g,
    (_,attribute,href)=>attribute+siteHref(href)) : markup;
}
