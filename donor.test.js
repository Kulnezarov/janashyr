import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderDonor,donorAccount,donorAction,donorInput,donorNavigate,endDonorSession,useDonorProfile,donorAvailability} from './donor.js';
const base='/directions/donation';let render=()=>{};let dest='';let navigate=x=>dest=x;
test('all donation pages are available in both languages',()=>{for(let l of ['kk','ru'])for(let p of ['','/centers','/centers/almaty','/book','/info','/groups','/events','/events/astana'])assert.ok(renderDonor(base+p,l));});
test('search and city filters work',()=>{donorInput({id:'donor-filter',value:'astana'},'ru',render);let h=renderDonor(base+'/centers','ru');assert.match(h,/Демонстрационный центр — Астана/);assert.doesNotMatch(h,/Демонстрационный центр — Алматы/);donorInput({id:'event-filter',value:'shymkent'},'ru',render);h=renderDonor(base+'/events','ru');assert.match(h,/Шымкент/);assert.doesNotMatch(h,/Демонстрационное мероприятие — Астана/)});
test('booking steps, validation, account cancellation and event registration',()=>{endDonorSession();donorAction('donor-next',null,'ru',render,navigate);assert.match(renderDonor(base+'/book','ru'),/Заполните все поля/);donorInput({id:'donor-city',value:'almaty'},'ru',render);donorAction('donor-next',null,'ru',render,navigate);donorInput({id:'donor-center',value:'almaty'},'ru',render);donorAction('donor-next',null,'ru',render,navigate);donorInput({id:'donor-date',value:'2999-01-01'},'ru',render);donorInput({id:'donor-time',value:'10:00'},'ru',render);donorAction('donor-next',null,'ru',render,navigate);donorInput({id:'donor-consent',checked:true},'ru',render);donorAction('donor-next',null,'ru',render,navigate);assert.equal(dest,base+'/result');let account=donorAccount('ru');let id=account.match(/D-[A-Z0-9]+-[A-Z0-9]+/)[0];donorAction('donor-detail',id,'ru',render,navigate);assert.match(donorAccount('ru'),/2999-01-01/);donorAction('donor-cancel',id,'ru',render,navigate);assert.match(donorAccount('ru'),/Отменена/);donorAction('donor-register','astana','ru',render,navigate);assert.match(donorAccount('ru'),/Демонстрационное мероприятие — Астана/);donorAction('donor-register','astana','ru',render,navigate);assert.equal((donorAccount('ru').match(/Демонстрационное мероприятие — Астана/g)||[]).length,1);endDonorSession();assert.match(donorAccount('ru'),/Демо-заявок пока нет/)});
test('selecting a center prepopulates the correct booking step',()=>{endDonorSession();donorNavigate(base+'/book?center=astana');assert.match(renderDonor(base+'/book','ru'),/Шаг 3/);endDonorSession()});


test('Shymkent donor hub books a local slot and restores only the active profile history', () => {
  const records = new Map();
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {configurable:true, value:{
    get length(){return records.size},
    key:i=>Array.from(records.keys())[i] ?? null,
    getItem:key=>records.get(key) ?? null,
    setItem:(key,value)=>records.set(key,value)
  }});
  try {
    const first={id:'first',alias:'First',role:'volunteer'};
    const second={id:'second',alias:'Second',role:'learner'};
    endDonorSession();
    const guest = renderDonor(base,'ru');
    assert.match(guest,/микрорайон Нурсат, 442/);
    assert.match(guest,/href="\/login"/);
    useDonorProfile(first);
    const page=renderDonor(base,'kk');
    assert.match(page,/Нұрсәт шағын ауданы, 442/);
    const day=page.match(/data-action="donor-hub-day" data-id="([^"]+)"/)[1];
    const time=page.match(/data-action="donor-hub-slot" data-id="([^"]+)"/)[1];
    donorAction('donor-hub-day',day,'kk',render,navigate);
    donorAction('donor-hub-slot',time,'kk',render,navigate);
    donorAction('donor-hub-book',null,'kk',render,navigate);
    assert.match(renderDonor(base,'kk'),/Барлық өрісті/);
    donorInput({id:'donor-hub-consent',checked:true},'kk',render);
    donorAction('donor-hub-book',null,'kk',render,navigate);
    assert.match(renderDonor(base,'kk'),/профиліңізге сақталды/);
    const history=donorAccount('ru');
    const number=history.match(/D-[A-Z0-9]+-[A-Z0-9]+/)[0];
    assert.match(history,/локальном профиле/);
    assert.match(donorAvailability('ru'),/Пробное расписание для Шымкента/);
    useDonorProfile(second);
    assert.match(donorAccount('ru'),/Демо-заявок пока нет/);
    assert.match(renderDonor(base,'ru'),new RegExp(`data-id="${time}" aria-pressed="false" disabled`));
    endDonorSession();
    useDonorProfile(first);
    assert.match(donorAccount('ru'),new RegExp(number));
    donorAction('donor-detail',number,'ru',render,navigate);
    assert.match(donorAccount('ru'),/Городской центр крови Шымкента/);
    donorAction('donor-cancel',number,'ru',render,navigate);
    useDonorProfile(second);
    assert.doesNotMatch(renderDonor(base,'ru'),new RegExp(`data-id="${time}" aria-pressed="false" disabled`));
    useDonorProfile(first);
    assert.match(donorAccount('ru'),/Отменена/);
  } finally {
    endDonorSession();
    if(previousStorage)Object.defineProperty(globalThis,'localStorage',previousStorage);
    else delete globalThis.localStorage;
  }
});
