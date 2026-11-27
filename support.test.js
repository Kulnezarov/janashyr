import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderSupport,accountContent,supportAction,supportSubmit,supportInput,endSession} from './support.js';
const base='/directions/support';
test('support services render in both languages',()=>{for(const l of ['kk','ru'])for(const p of ['', '/psychology','/education','/education/math','/digital','/chat'])assert.ok(renderSupport(base+p,l));});
test('course registration, filtering and consultation cancellation',()=>{
 endSession();let renders=0;const render=()=>renders++;
 supportInput({id:'course-category',value:'math'},'ru',render);
 let html=renderSupport(base+'/education','ru');assert.match(html,/Основы математики/);assert.doesNotMatch(html,/Основы программирования/);
 supportAction('enroll','math','ru',render);supportAction('enroll','math','ru',render);assert.equal((accountContent('ru').match(/Демо-запись/g)||[]).length,1);
 const Original=globalThis.FormData;globalThis.FormData=class{constructor(f){this.f=f}get(k){return this.f.values[k]}};
 const previousDocument=globalThis.document;
 globalThis.document={getElementById:()=>null,querySelector:()=>null};
 try {
   supportAction('psych-book','aida','ru',render);
   const available=renderSupport(base+'/psychology','ru').match(/name="slot" value="([^"]+)/)[1];
   const form={id:'consult-form',values:{format:'online',slot:available}};
   supportSubmit(form,'ru',render);
   assert.match(accountContent('ru'),/Айда Сарсенова/);
   assert.doesNotMatch(renderSupport(base+'/psychology','ru'),/id="consult-form"/);
   supportAction('psych-book','aida','ru',render);
   supportSubmit(form,'ru',render);
   assert.equal((accountContent('ru').match(/Айда Сарсенова/g)||[]).length,1);
   assert.match(renderSupport(base+'/psychology','ru'),/Занято/);
   supportAction('cancel-request','0','ru',render);
   assert.match(accountContent('ru'),/Отменена/);
   assert.doesNotMatch(renderSupport(base+'/psychology','ru'),/Занято/);
 } finally { globalThis.document=previousDocument; }
 supportSubmit({id:'volunteer-form',values:{subject:'Телефон'}},'ru',render);assert.match(accountContent('ru'),/Помощь волонтёра/);
 globalThis.FormData=Original;endSession();assert.match(accountContent('ru'),/Пока нет/);
});
test('chat responds to crisis and is cleared on logout',async()=>{
 endSession();globalThis.location={pathname:base+'/chat'};let render=()=>{};let Original=globalThis.FormData;globalThis.FormData=class{constructor(f){this.f=f}get(k){return this.f.values[k]}};
 supportSubmit({id:'chat-form',values:{message:'Я хочу умереть'}},'ru',render);assert.match(renderSupport(base+'/chat','ru'),/Подбираю ответ/);
 await new Promise(r=>setTimeout(r,700));assert.match(renderSupport(base+'/chat','ru'),/экстренные службы/);
 supportAction('clear-chat',null,'ru',render);assert.doesNotMatch(renderSupport(base+'/chat','ru'),/Я хочу умереть/);
 globalThis.FormData=Original;endSession();
});
