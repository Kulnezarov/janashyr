import {afterEach,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {renderDonor,donorAccount,donorAction,donorInput,endDonorSession,useDonorProfile} from './donor.js';
import {assessDonation,changeDonorBooking,donorCenters,donorSchedule,readAllDonorRecords,readDonorHistory,donorStorageKey,
  donorToday,addDonorDays,nextDonorDate,donationCalendar,WHOLE_BLOOD_INTERVAL_DAYS} from './donor-booking-data.js';
import {ticketQrMatrix} from './donor-qr.js';

const base='/directions/donation', now=Date.parse('2030-05-06T02:00:00Z'), today=donorToday(now);
const answers={age:'30',weight:'65',unwell:'no',illness:'no',antibiotics:'no',tattoo:'no',vaccination:'no',pregnancy:'no',lastDonation:''};
const render=()=>{};
let stored, previous;

beforeEach(()=>{
  previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  stored=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    get length(){return stored.size},
    key:index=>[...stored.keys()][index] ?? null,
    getItem:key=>stored.get(key) ?? null,
    setItem:(key,value)=>stored.set(key,value)
  }});
  endDonorSession();
});
afterEach(()=>{
  if(previous)Object.defineProperty(globalThis,'localStorage',previous);
  else delete globalThis.localStorage;
});

function selection(center=donorCenters[0]){
  const schedule=donorSchedule(center,readAllDonorRecords().rows,now);
  const day=schedule.find(day=>day.times.some(slot=>slot.available));
  return {centerId:center.id,date:day.date,time:day.times.find(slot=>slot.available).time,answers,group:'A(II)+'};
}
const book=(user,values=selection())=>changeDonorBooking('book',user,values,now);

test('donor pages, older public center directory and event registrations still work',async()=>{
  for(const lang of ['ru','kk'])for(const path of ['','/centers','/centers/almaty','/book','/result','/info','/groups','/events','/events/astana'])
    assert.ok(renderDonor(base+path,lang));
  donorInput({id:'donor-filter',value:'astana'},'ru',render);
  assert.match(renderDonor(base+'/centers','ru'),/Демонстрационный центр — Астана/);
  assert.doesNotMatch(renderDonor(base+'/centers','ru'),/Демонстрационный центр — Алматы/);
  donorInput({id:'event-filter',value:'shymkent'},'ru',render);
  assert.doesNotMatch(renderDonor(base+'/events','ru'),/Демонстрационное мероприятие — Астана/);
  useDonorProfile({id:'actor'});
  donorAction('donor-register','astana','ru',render,render);
  donorAction('donor-register','astana','ru',render,render);
  assert.match(donorAccount('ru'),/Демонстрационное мероприятие — Астана/);
  const [record]=readDonorHistory('actor').rows;
  assert.equal(readDonorHistory('actor').rows.length,1);
  donorAction('donor-cancel',record.number,'ru',render,render);
  assert.equal(readDonorHistory('actor').rows[0].cancelled,true);
});

test('a refusal reports one reason and a demo retry date and cannot book',()=>{
  const rejected={...answers,antibiotics:'yes'};
  assert.deepEqual(assessDonation(rejected,today),{ok:false,reason:'antibiotics',retry:'2030-05-20'});
  assert.equal(assessDonation({...answers,age:'17'},today).retryYears,1);
  assert.equal(assessDonation({...answers,weight:'49'},today).reason,'weight');
  assert.equal(assessDonation({...answers,pregnancy:'yes'},today).reason,'pregnancy');
  assert.equal(assessDonation({...answers,lastDonation:today},today).reason,'lastDonation');
  assert.equal(book('one',{...selection(),answers:rejected}).code,'assessmentRequired');
  assert.equal(stored.size,0);
});

test('a profile cannot create a second active donation, even at another center',()=>{
  const created=book('one');
  assert.equal(created.code,'booked');
  assert.equal(book('one',selection(donorCenters[1])).code,'existing');
  assert.equal(readDonorHistory('one').rows.length,1);
  assert.equal(readDonorHistory('other').rows.length,0);
});

test('a slot that filled after selection rejects a fourth visitor',()=>{
  const center=donorCenters[2], selected=selection(center);
  assert.equal(center.capacity,3);
  for(const id of ['one','two','three'])assert.equal(book(id,selected).code,'booked');
  assert.equal(book('four',selected).code,'slotUnavailable');
  assert.equal(donorSchedule(center,readAllDonorRecords().rows,now)[0].times[0].remaining,0);
});

test('cancelling an active appointment releases the place',()=>{
  const selected=selection();
  const {record}=book('one',selected);
  assert.equal(book('two',selected).code,'slotUnavailable');
  assert.equal(changeDonorBooking('cancel','one',{number:record.number},now).code,'cancelled');
  assert.equal(readDonorHistory('one').rows[0].status,'cancelled');
  assert.equal(book('two',selected).code,'booked');
});

test('a guest cannot change donor storage',()=>{
  assert.equal(book(null).code,'profileRequired');
  assert.equal(stored.size,0);
});

test('calendar covers 14 days and a fully reserved center shows its empty state',()=>{
  const center=donorCenters[0], schedule=donorSchedule(center,[],now);
  assert.equal(schedule.length,14);
  assert.equal(schedule[0].date,today);
  assert.equal(schedule.at(-1).date,addDonorDays(today,13));
  let index=0;
  const full=schedule.flatMap(day=>day.times.filter(slot=>slot.available).map(slot=>{
    const userId='filled-'+index++;
    return {type:'booking',id:'D-DEMO-'+index,number:'D-DEMO-'+index,userId,centerId:center.id,
      date:day.date,time:slot.time,created:now,group:'',status:'active',ticketCode:'J1234'};
  }));
  for(const row of full)stored.set(donorStorageKey(row.userId),JSON.stringify([row]));
  const reserved=donorSchedule(center,readAllDonorRecords().rows,now);
  assert.equal(reserved.flatMap(day=>day.times).some(slot=>slot.available),false);
});

test('completion moves the visit to history and enforces a 60-day interval',()=>{
  const {record}=book('one');
  assert.equal(changeDonorBooking('complete','one',{number:record.number},now).code,'completed');
  assert.equal(readDonorHistory('one').rows[0].donatedOn,today);
  assert.equal(nextDonorDate(readDonorHistory('one').rows),addDonorDays(today,WHOLE_BLOOD_INTERVAL_DAYS));
  assert.equal(book('one').code,'interval');
  const after=Date.parse(addDonorDays(today,60)+'T02:00:00Z');
  const day=donorSchedule(donorCenters[0],[],after).find(day=>day.times.some(slot=>slot.available));
  const result=changeDonorBooking('book','one',{...selection(),date:day.date,time:day.times[0].time},after);
  assert.equal(result.code,'booked');
});

test('the ticket puts only its code in the QR and exports a timed UTC calendar event',()=>{
  const {record}=book('one');
  assert.match(record.ticketCode,/^J[A-F0-9]{14}$/);
  assert.equal(record.userId,'one');
  assert.equal(Object.hasOwn(record,'answers'),false);
  const qr=ticketQrMatrix(record.ticketCode);
  assert.equal(qr.length,21);
  assert.ok(qr.every(row=>row.length===21 && row.every(bit=>bit===0 || bit===1)));
  assert.notDeepEqual(qr,ticketQrMatrix('J0123456789ABCD'));
  const place='Шымкент, Абайский район (вымышленный адрес приёма на учебную донацию)';
  const calendar=donationCalendar(record,{title:'Демо',location:place});
  assert.match(calendar,/DTSTART:20300506T040000Z\r\nDTEND:20300506T043000Z/);
  assert.ok(calendar.split('\r\n').every(line=>Buffer.byteLength(line)<=75));
  assert.ok(calendar.replaceAll('\r\n ','').includes('LOCATION:'+place.replace(',','\\,')));
});

test('profile blood group matches the sample urgent request without changing old donor rows',()=>{
  const old={type:'booking',number:'D-OLD-1',center:'shymkent',date:'2029-01-01',time:'10:00',created:now,cancelled:true};
  stored.set(donorStorageKey('one'),JSON.stringify([old]));
  assert.equal(changeDonorBooking('group','one',{group:'A(II)+'},now).code,'groupSaved');
  useDonorProfile({id:'one'});
  assert.match(renderDonor(base,'ru'),/is-match" data-need="demo-abai"/);
  assert.match(donorAccount('ru'),/Отменена/);
  assert.deepEqual(readDonorHistory('one').rows[1],old);
});

test('broken donor storage shows a localized fallback, and a blocked write cannot book',()=>{
  stored.set(donorStorageKey('one'),'{"bad":1}');
  useDonorProfile({id:'one'});
  assert.match(donorAccount('kk'),/Бүлінген деректер/);
  const selected=selection();
  localStorage.setItem=()=>{throw Error('blocked');};
  assert.equal(book('one',selected).code,'saveFailed');
  assert.equal(readDonorHistory('one').rows.length,0);
});
