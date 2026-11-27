import {escapeText as e,storageText} from './profiles.js';
import {pageShell,scheduleTimestamp,demoSaveNote} from './ui.js';
import {mapEmbedUrl} from './landing-sections.js';
import {districts,newCityId,updateCity} from './city-participation.js';
import {reportCategories,reportStatuses,readCityReports,reportPoint,demoReports,validateReport,validateReportPhoto,
  changeCityReport,filterReports} from './city-report-data.js';

const base='/directions/city';
const demoMode=true;
const copy={
  kk:{
    title:'Мәселе туралы хабарлау',back:'«Менің қалам» бөліміне',mine:'Менің өтініштерім',examples:'Өтініш үлгілері',
    demo:'Бұл — демонстрациялық өтініш. Ол осы браузерде сақталады және қала қызметтеріне жіберілмейді.',
    category:'Санат',district:'Аудан',description:'Сипаттама (кемінде 10 таңба)',select:'Таңдаңыз',all:'Барлық мәртебелер',
    privacy:'Ойдан шығарылған деректерді пайдаланыңыз. Жеке мекенжайларды, телефондарды және адамдардың суреттерін қоспаңыз.',
    map:'Шағын картаны ашу',mapClose:'Шағын картаны жабу',mapTitle:'Үлгі картадағы нүкте (міндетті емес)',
    north:'Солтүстік бөлік',center:'Орталық бөлік',south:'Оңтүстік бөлік',removePoint:'Белгіні алып тастау',
    photo:'Фото (міндетті емес, 5 МБ-қа дейін)',photoHint:'Фото тек осы жерде алдын ала көрсетіледі және тарихқа сақталмайды.',
    photoPreview:'Таңдалған суретті алдын ала көрсету',removePhoto:'Фотоны алып тастау',photoChecking:'Сурет тексерілуде…',
    submit:'Демо өтінішті сақтау',busy:'Сақталуда…',sent:'Демо өтініш сақталды. Нөмірі',advanced:'Өтініш мәртебесі жаңартылды.',
    advance:'Мәртебені өзгерту',filter:'Көрсету',status:'Мәртебе',empty:'Бұл сүзгі бойынша өтініштер жоқ.',noDistrict:'Аудан бұрын көрсетілмеген',
    categoryRequired:'Мәселенің санатын таңдаңыз.',districtRequired:'Шымкент ауданын таңдаңыз.',
    descriptionShort:'Кемінде 10 таңба енгізіңіз.',descriptionLong:'Сипаттама 500 таңбадан аспауы керек.',
    photoType:'Браузер аша алатын сурет файлын таңдаңыз.',photoSize:'Фотоның өлшемі 5 МБ-тан аспауы керек.',
    changed:'Өтініш қолжетімсіз немесе мәртебесі бұрын өзгерді.',profileRequired:'Өтінішті сақтау үшін бейінді таңдаңыз.'
  },
  ru:{
    title:'Сообщить о проблеме',back:'К разделу «Мой город»',mine:'Мои обращения',examples:'Примеры обращений',
    demo:'Это демонстрационное обращение. Оно сохраняется в этом браузере и не отправляется городским службам.',
    category:'Категория',district:'Район',description:'Описание (минимум 10 символов)',select:'Выберите',all:'Все статусы',
    privacy:'Используйте вымышленные данные. Не добавляйте частные адреса, телефоны и фотографии людей.',
    map:'Открыть мини-карту',mapClose:'Закрыть мини-карту',mapTitle:'Точка на демо-карте (необязательно)',
    north:'Северная часть',center:'Центральная часть',south:'Южная часть',removePoint:'Убрать метку',
    photo:'Фото (необязательно, до 5 МБ)',photoHint:'Фото доступно только в предпросмотре и не сохраняется в истории.',
    photoPreview:'Предпросмотр выбранного изображения',removePhoto:'Удалить фото',photoChecking:'Проверяем изображение…',
    submit:'Сохранить демо-обращение',busy:'Сохраняем…',sent:'Демо-обращение сохранено. Номер',advanced:'Статус обращения обновлён.',
    advance:'Продвинуть статус',filter:'Показать',status:'Статус',empty:'Обращений по этому фильтру нет.',noDistrict:'Район раньше не указывался',
    categoryRequired:'Выберите категорию проблемы.',districtRequired:'Выберите район Шымкента.',
    descriptionShort:'Введите не менее 10 символов.',descriptionLong:'Описание должно быть не длиннее 500 символов.',
    photoType:'Выберите файл изображения, который может открыть браузер.',photoSize:'Размер фото не должен превышать 5 МБ.',
    changed:'Обращение недоступно или его статус уже изменился.',profileRequired:'Выберите профиль, чтобы сохранить обращение.'
  }
};

const blank=()=>({id:'',category:'',district:'',description:'',point:'',map:false});
let draft=blank(), errors={}, photo='', revision=0, checkingPhoto=false, busy=false, formNotice=null, accountNotice=null, statusFilter='';
const tr=(lang,value)=>Array.isArray(value)?value[lang==='kk'?0:1]:value;
const button=(label,action,id='',style='button secondary')=>`<button type="button" class="${style}" data-action="${action}"${id?` data-id="${e(id)}"`:''}>${label}</button>`;

function resetPhoto() {
  revision++;
  if(photo)URL.revokeObjectURL(photo);
  photo='';
  checkingPhoto=false;
}

export function resetReportView(keepDraft=false){
  if(!keepDraft){
    resetPhoto();
    draft=blank();
    errors={};
    formNotice=null;
  }
  accountNotice=null;
}

function notice(lang,result,issue='') {
  const w=copy[lang], code=result?.code || issue;
  if(!code || code==='invalid')return '';
  const success=['sent','advanced'].includes(code);
  return `<p class="${success?'success':'demo-notice'}" role="${success?'status':'alert'}" data-report-feedback="${code}">
    ${w[code] || storageText[lang][code]}${code==='sent'?` · <strong>${e(result.record.id)}</strong>`:''}
  </p>`;
}

function inlineError(lang,key) {
  return errors[key]?`<span class="city-error" id="city-report-${key}-error" role="alert">${copy[lang][errors[key]]}</span>`:'';
}
const fieldAttributes=key=>errors[key]?` aria-invalid="true" aria-describedby="city-report-${key}-error"`:'';

function selectField(lang,key,options) {
  const w=copy[lang];
  return `<label>${w[key]}<select name="${key}"${fieldAttributes(key)}><option value="">${w.select}</option>
    ${Object.entries(options).map(([id,name])=>`<option value="${id}"${draft[key]===id?' selected':''}>${tr(lang,name)}</option>`).join('')}
  </select>${inlineError(lang,key)}</label>`;
}

function miniMap(lang){
  const w=copy[lang];
  if(!Object.hasOwn(districts,draft.district))return '';
  if(!draft.map)return button(w.map,'report-map');
  const point=reportPoint(draft.district,draft.point) || reportPoint(draft.district,'center');
  return `<fieldset class="city-report-map"><legend>${w.mapTitle}</legend>
    <iframe title="${w.mapTitle}" loading="lazy" src="${mapEmbedUrl(point.lat,point.lon,Boolean(draft.point))}"></iframe>
    <div class="city-activity-actions">
      ${['north','center','south'].map(key=>`<button type="button" class="text-button" data-action="report-point" data-id="${key}" aria-pressed="${draft.point===key}">${w[key]}</button>`).join('')}
      ${draft.point?button(w.removePoint,'report-point-remove') : ''}${button(w.mapClose,'report-map')}
    </div></fieldset>`;
}

function card(lang,report,allowAdvance=false){
  const w=copy[lang];
  return `<article class="request-card city-report-card" data-report="${e(report.id)}" data-status="${report.status}">
    <strong>${e(report.id)} · ${tr(lang,reportCategories[report.category])}</strong>
    <p>${districts[report.district]?tr(lang,districts[report.district].name):w.noDistrict}${report.created?' · '+scheduleTimestamp(lang,report.created):''}</p>
    <p><span class="city-report-status">${tr(lang,reportStatuses[report.status])}</span></p>
    <p class="city-report-description">${e(tr(lang,report.description))}</p>
    ${report.point?`<p>${w.mapTitle} · ${w[report.point.key]}</p>`:''}
    ${demoMode && allowAdvance && report.status!=='resolved'?button(w.advance,'report-advance',report.id):''}
  </article>`;
}

export function renderReportForm(lang,profile) {
  const w=copy[lang];
  return pageShell({base,back:w.back,kicker:'JANASHYR',title:w.title,body:`
    <p class="demo-notice">${w.demo} ${w.privacy}</p>
    ${notice(lang,formNotice,readCityReports(profile?.id).issue)}
    ${formNotice?.code==='sent'?`<p><a href="/account#city-report-history" data-link class="text-link">${w.mine}</a></p>`:''}
    <form id="city-issue-form" class="panel city-report-fields" novalidate>
      ${selectField(lang,'category',reportCategories)}
      ${selectField(lang,'district',Object.fromEntries(Object.entries(districts).map(([id,district])=>[id,district.name])))}
      <label>${w.description}<textarea name="description" rows="4" maxlength="500"${fieldAttributes('description')}>${e(draft.description)}</textarea>${inlineError(lang,'description')}</label>
      ${miniMap(lang)}
      <div class="city-report-image">
        <label>${w.photo}<input id="city-issue-photo" type="file" accept="image/*" aria-describedby="city-report-photo-hint${errors.photo?' city-report-photo-error':''}"${errors.photo?' aria-invalid="true"':''}></label>
        <p id="city-report-photo-hint">${w.photoHint}</p>${inlineError(lang,'photo')}
        ${checkingPhoto?`<p role="status">${w.photoChecking}</p>`:''}
        ${photo?`<img src="${e(photo)}" alt="${w.photoPreview}">`:''}
        ${photo || errors.photo || checkingPhoto?button(w.removePhoto,'report-photo-remove'):''}
      </div>
      ${demoSaveNote(lang)}
      <button class="button primary" type="submit"${busy || checkingPhoto?' disabled':''}>${busy?w.busy:w.submit}</button>
    </form>
    <details class="guide city-past"><summary>${w.examples}</summary>${demoReports().map(report=>card(lang,report)).join('')}</details>
  `});
}

export function renderReportHistory(lang,profile){
  const w=copy[lang], {rows,issue}=readCityReports(profile?.id), shown=filterReports(rows,statusFilter);
  return `<section class="account-list" id="city-report-history"><h2>${w.mine}</h2>
    <a class="text-link" href="${base}/new" data-link>${w.title}</a>
    ${notice(lang,accountNotice,issue)}
    <form id="city-report-filter" class="city-activity-fields">
      <label>${w.status}<select name="status"><option value="">${w.all}</option>${Object.entries(reportStatuses).map(([id,name])=>
        `<option value="${id}"${statusFilter===id?' selected':''}>${tr(lang,name)}</option>`).join('')}</select></label>
      <button class="button secondary" type="submit">${w.filter}</button>
    </form>
    ${shown.length?shown.map(row=>card(lang,row,true)).join(''):`<p role="status">${w.empty}</p>`}
  </section>`;
}

async function selectPhoto(file,render) {
  if(!file)return;
  resetPhoto();
  errors.photo=validateReportPhoto(file);
  if(errors.photo){render();return;}
  const current=revision;
  let url='';
  checkingPhoto=true;
  render();
  try{
    url=URL.createObjectURL(file);
    const image=new Image();
    image.src=url;
    await image.decode();
    if(current===revision){photo=url;url='';}
  } catch {
    if(current===revision)errors.photo='photoType';
  } finally {
    if(url)URL.revokeObjectURL(url);
    if(current===revision){checkingPhoto=false;render();}
  }
}

export function reportInput(element,render) {
  if(element.form?.id!=='city-issue-form')return false;
  if(element.id==='city-issue-photo'){void selectPhoto(element.files?.[0],render);return true;}
  if(['category','district','description'].includes(element.name)){
    const key=element.name, changed=draft[key]!==element.value;
    draft[key]=element.value;
    if(key==='district' && changed){
      draft.point='';
      delete errors.district;
      render();
    }
    return true;
  }
  return false;
}

async function submitReport(profile,values,render){
  if(busy)return;
  busy=true;
  formNotice=null;
  render();
  try{formNotice=await updateCity(()=>changeCityReport('submit',profile?.id,values,demoMode));}
  catch{formNotice={code:'saveFailed'};}
  finally{busy=false;}
  if(formNotice.code==='sent'){
    resetPhoto();
    draft=blank();
    errors={};
  }
  render();
  globalThis.document?.querySelector?.('[data-report-feedback]')?.scrollIntoView?.({block:'nearest'});
}

export function reportSubmit(form,render,withProfile){
  const data=new FormData(form);
  if(form.id==='city-report-filter'){
    const status=data.get('status');
    statusFilter=Object.hasOwn(reportStatuses,status)?status:'';
    accountNotice=null;
    render();
    return;
  }
  if(busy || checkingPhoto)return;
  const photoError=errors.photo;
  const district=data.get('district') || '';
  if(draft.district!==district)draft.point='';
  Object.assign(draft,{category:data.get('category') || '',district,description:data.get('description') || ''});
  errors=validateReport(draft);
  if(photoError)errors.photo=photoError;
  formNotice=null;
  if(Object.keys(errors).length){render();return;}
  draft.id ||= 'G-'+newCityId().toUpperCase();
  const {id,category,description,point}=draft;
  withProfile(profile=>submitReport(profile,{id,category,district,description,point},render));
}

async function advanceReport(profile,id,render){
  if(busy)return;
  busy=true;
  try{accountNotice=await updateCity(()=>changeCityReport('advance',profile?.id,{id},demoMode));}
  catch{accountNotice={code:'saveFailed'};}
  finally{busy=false;}
  render();
}

export function reportAction(action,id,profile,render) {
  if(action==='report-map')draft.map=!draft.map;
  else if(action==='report-point' && reportPoint(draft.district,id))draft.point=id;
  else if(action==='report-point-remove')draft.point='';
  else if(action==='report-photo-remove'){resetPhoto();delete errors.photo;}
  else if(action==='report-advance'){void advanceReport(profile,id,render);return true;}
  else return false;
  render();
  return true;
}
