import {test} from 'node:test';
import assert from 'node:assert/strict';
import {donorCenters,donorSchedule,donorStorageKey} from './donor-booking-data.js';
import {endDonorSession} from './donor.js';

async function preview(name, path, seed = {}, blocked = false) {
  const listeners = {};
  const app = {innerHTML:''};
  const stored = new Map(Object.entries({'janashyr.demo.v2.language':'"ru"', ...seed}));
  Object.defineProperty(globalThis, 'localStorage', {configurable:true,value:{
    get length(){return stored.size},
    key:index=>[...stored.keys()][index],
    getItem:key=>stored.get(key) ?? null,
    setItem(key,value){if(blocked)throw new Error('Storage blocked');stored.set(key,value)}
  }});
  globalThis.document = {
    documentElement:{},
    querySelector:selector=>selector==='#app'?app:null,
    addEventListener:(type,listener)=>{listeners[type]=listener}
  };
  globalThis.location = {pathname:path,hash:'',href:'http://localhost'+path};
  globalThis.history = {pushState:(_state,_unused,url)=>{
    const target=new URL(url,location.href);
    Object.assign(location,{pathname:target.pathname,hash:target.hash,href:target.href});
  }};
  globalThis.window = {addEventListener(){},scrollTo(){}};
  globalThis.FormData = class {
    constructor(form){this.data=form.values;}
    get(key){return this.data[key] ?? null;}
  };
  endDonorSession();
  await import('./app.js?booking='+name);
  const click = (selector, control) => listeners.click({
    target:{closest:query=>query===selector?control:null},button:0,preventDefault(){}
  });
  return {
    app, stored,
    action:(action,id)=>click('[data-action]',{dataset:{action,id}}),
    language:lang=>click('[data-lang]',{dataset:{lang}}),
    input:target=>listeners.input({target}),
    submit:(id,values)=>listeners.submit({target:{id,values},preventDefault(){}}),
    change:target=>listeners.change({target}),
    link:url=>click('[data-link]',{getAttribute:()=>url})
  };
}

function firstId(markup, action) {
  return markup.match(new RegExp('data-action="'+action+'" data-id="([^"]+)"'))[1];
}

function passSurvey(preview, extras={}) {
  preview.submit('donor-assessment',{age:'30',weight:'65',unwell:'no'});
  preview.submit('donor-assessment',{illness:'no',antibiotics:'no',tattoo:'no',vaccination:'no',pregnancy:'no',...extras});
  preview.submit('donor-assessment',{lastDonation:''});
}

function reviewDonation(preview) {
  passSurvey(preview);
  preview.action('donor-center-select','demo-abai');
  const time=[...preview.app.innerHTML.matchAll(/<button[^>]+data-action="donor-visit-time" data-id="([^"]+)"[^>]*>/g)]
    .find(match=>!match[0].includes(' disabled'))[1];
  preview.action('donor-visit-time',time);
  preview.action('donor-visit-review');
  return time.split('T');
}

test('education resumes the selected reply after switching to an eligible profile', async () => {
  const {app,action,link,stored}=await preview('education','/directions/support/education',{
    'janashyr.demo.v2.active':'"preview-volunteer"'
  });
  const offer=firstId(app.innerHTML,'edu-interest');
  action('edu-interest',offer);
  assert.match(app.innerHTML,/id="booking-profile-dialog"/);
  assert.doesNotMatch(app.innerHTML,/data-action="booking-profile-select" data-id="preview-volunteer"/);
  action('booking-profile-select','preview-volunteer');
  assert.match(app.innerHTML,/id="booking-profile-dialog"/);
  action('booking-profile-select','preview-learner');
  assert.equal(location.pathname,'/directions/support/education');
  assert.match(app.innerHTML,/Сохранено в профиле/);
  assert.equal(JSON.parse(stored.get('janashyr.education.history.v1.preview-learner'))[0].id,offer);
  link('/account#education-history');
  assert.match(app.innerHTML,/data-action="edu-unsave"/);
});

test('donation resumes the selected day and time after guest profile selection', async () => {
  const view=await preview('donation','/directions/donation');
  const {app,action,stored}=view;
  const [day,time]=reviewDonation(view);
  action('donor-visit-book');
  assert.match(app.innerHTML,/id="booking-profile-dialog"/);
  action('booking-profile-close');
  assert.doesNotMatch(app.innerHTML,/id="booking-profile-dialog"/);
  assert.equal(stored.has('janashyr.demo.v2.active'),false);
  action('donor-visit-book');
  action('booking-profile-select','preview-pensioner');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(location.pathname,'/directions/donation/result');
  assert.match(app.innerHTML,/donor-ticket-qr/);
  const [booking]=JSON.parse(stored.get('janashyr.donation.v1.preview-pensioner'));
  assert.equal(booking.date,day);
  assert.equal(booking.time,time);
});

test('switching the language keeps entered questionnaire answers and a refusal is translated',async()=>{
  const {app,input,language,submit,stored}=await preview('donor-language','/directions/donation');
  const form={id:'donor-assessment'};
  input({form,name:'age',value:'36'});
  input({form,name:'weight',value:'72.5'});
  input({form,name:'unwell',value:'no'});
  language('kk');
  assert.match(app.innerHTML,/name="age"[^>]+value="36"/);
  assert.match(app.innerHTML,/name="weight"[^>]+value="72.5"/);
  assert.match(app.innerHTML,/name="unwell" value="no" checked/);
  submit('donor-assessment',{age:'36',weight:'72.5',unwell:'no'});
  submit('donor-assessment',{illness:'yes',antibiotics:'no',tattoo:'no',vaccination:'no',pregnancy:'no'});
  submit('donor-assessment',{lastDonation:''});
  assert.match(app.innerHTML,/Әзірге жазылуға болмайды/);
  language('ru');
  assert.match(app.innerHTML,/Пока нельзя/);
  assert.match(app.innerHTML,/недавняя болезнь/);
  assert.equal([...stored.keys()].some(key=>key.startsWith('janashyr.donation.v1.')),false);
});

test('there is an explicit empty state when every session in a center is full',async()=>{
  const seed={};
  const center=donorCenters[0];
  let index=0;
  for(const day of donorSchedule(center,[]))for(const slot of day.times){
    if(!slot.available)continue;
    const userId='filled-'+(++index), number='D-DEMO-'+index;
    seed[donorStorageKey(userId)]=JSON.stringify([{type:'booking',id:number,number,userId,centerId:center.id,
      date:day.date,time:slot.time,created:Date.now(),group:'',status:'active',ticketCode:'J0123'}]);
  }
  const view=await preview('donor-full','/directions/donation',seed);
  passSurvey(view);
  view.action('donor-center-select',center.id);
  assert.match(view.app.innerHTML,/Свободных слотов на ближайшие 14 дней нет/);
  assert.equal((view.app.innerHTML.match(/data-action="donor-visit-day"/g) || []).length,14);
  assert.doesNotMatch(view.app.innerHTML,/data-action="donor-visit-review"/);
});

test('city signup recovers from damaged profiles and cleanup data, then saves the chosen group', async () => {
  const {app,action,stored}=await preview('cleanup','/directions/city',{
    'janashyr.demo.v2.profiles':'{}',
    'janashyr.demo.v2.cleanup-entries':'[null]'
  });
  assert.match(app.innerHTML,/Повреждённые данные/);
  const slot=firstId(app.innerHTML,'cleanup-join');
  action('cleanup-join',slot);
  assert.match(app.innerHTML,/id="booking-profile-dialog"/);
  action('booking-profile-select','preview-teacher');
  assert.match(app.innerHTML,/id="city-activity-dialog"/);
  action('cleanup-confirm');
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(location.pathname,'/directions/city');
  assert.match(app.innerHTML,/Вы записаны/);
  assert.equal(JSON.parse(stored.get('janashyr.demo.v2.cleanup-entries'))[0].activityId,slot);
});

test('blocked storage reports failure and leaves donation and cleanup unconfirmed', async () => {
  const view=await preview('blocked','/directions/donation',{
    'janashyr.demo.v2.active':'"preview-learner"'
  },true);
  const {app,action,link,stored}=view;
  reviewDonation(view);
  action('donor-visit-book');
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(app.innerHTML,/Не удалось сохранить/);
  assert.doesNotMatch(app.innerHTML,/donor-ticket-qr/);
  assert.equal(stored.has('janashyr.donation.v1.preview-learner'),false);
  link('/directions/city');
  action('cleanup-join',firstId(app.innerHTML,'cleanup-join'));
  action('cleanup-confirm');
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(app.innerHTML,/Не удалось сохранить/);
  assert.doesNotMatch(app.innerHTML,/Вы записаны/);
  assert.equal(stored.has('janashyr.demo.v2.cleanup-entries'),false);
  link('/directions/support/education');
  action('edu-interest',firstId(app.innerHTML,'edu-interest'));
  assert.match(app.innerHTML,/Браузер не разрешил сохранить запись/);
  assert.equal(stored.has('janashyr.education.history.v1.preview-learner'),false);
});

test('a draft city report survives guest profile selection and two submits save just one issue',async()=>{
  const {app,submit,action,stored}=await preview('city-report','/directions/city/new');
  const values={category:'trash',district:'abai',description:'Демо-обращение о мусоре возле парка'};
  submit('city-issue-form',values);
  assert.match(app.innerHTML,/id="booking-profile-dialog"/);
  assert.equal(stored.has('janashyr.demo.v2.city-preview-volunteer'),false);
  action('booking-profile-select','preview-volunteer');
  submit('city-issue-form',values);
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(app.innerHTML,/Демо-обращение сохранено/);
  const {reports}=JSON.parse(stored.get('janashyr.demo.v2.city-preview-volunteer'));
  assert.equal(reports.length,1);
  assert.equal(reports[0].description,values.description);
});

test('a guest choosing a lesson resumes its details as a learner without reserving it yet', async () => {
  const {app,action,stored}=await preview('lesson-guest','/directions/support/education',{
    'janashyr.demo.v2.active':'null'
  });
  const id=firstId(app.innerHTML,'lesson-open');
  action('lesson-open',id);
  assert.match(app.innerHTML,/id="booking-profile-dialog"/);
  assert.doesNotMatch(app.innerHTML,/data-action="booking-profile-select" data-id="preview-teacher"/);
  action('booking-profile-select','preview-learner');
  assert.match(app.innerHTML,/id="lesson-dialog"/);
  assert.match(app.innerHTML,/Комментарий учителю/);
  assert.equal(stored.has('janashyr.education.listings.v1'),false);
});
