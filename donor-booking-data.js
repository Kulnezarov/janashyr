import {cities} from './donor-content.js';
import {readStoredList,writeStored} from './profiles.js';

const prefix='janashyr.donation.v1.';
const dayMs=86400000;
const zoneDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit'});
const two=value=>String(value).padStart(2,'0');
const groups=['O(I)+','O(I)−','A(II)+','A(II)−','B(III)+','B(III)−','AB(IV)+','AB(IV)−'];
export const bloodGroups=groups;

// The requested 60-day interval is a whole-blood rule for this demo scenario.
export const WHOLE_BLOOD_INTERVAL_DAYS=60;

const weekdayHours=(from,to)=>[null,[from,to],[from,to],[from,to],[from,to],[from,to],null];
export const donorCenters=[
  {id:'demo-abai',name:{kk:'Абай демо орталығы',ru:'Демо-центр «Абай»'},address:{kk:'Шымкент, Абай ауданы (шартты орын)',ru:'Шымкент, Абайский район (условная точка)'},lat:42.324,lon:69.576,
    hours:weekdayHours('09:00','13:00'),duration:30,capacity:1},
  {id:'demo-farabi',name:{kk:'Әл-Фараби демо орталығы',ru:'Демо-центр «Аль-Фараби»'},address:{kk:'Шымкент, Әл-Фараби ауданы (шартты орын)',ru:'Шымкент, Аль-Фарабийский район (условная точка)'},lat:42.313,lon:69.591,
    hours:[null,['10:00','14:00'],['10:00','14:00'],['10:00','14:00'],['10:00','14:00'],['10:00','14:00'],['09:00','12:00']],duration:30,capacity:2},
  {id:'demo-turan',name:{kk:'Тұран демо орталығы',ru:'Демо-центр «Туран»'},address:{kk:'Шымкент, Тұран ауданы (шартты орын)',ru:'Шымкент, район Туран (условная точка)'},lat:42.292,lon:69.544,
    hours:weekdayHours('11:00','15:00'),duration:40,capacity:3}
];
export const donorCenter=id=>donorCenters.find(center=>center.id===id);
export const urgentNeeds=[
  {centerId:'demo-abai',group:'A(II)+'},
  {centerId:'demo-farabi',group:'O(I)−'},
  {centerId:'demo-turan',group:'B(III)+'}
];

export const assessmentRules={
  age:{min:18,max:60},weight:{min:50},
  flags:{
    unwell:{retryDays:1},illness:{retryDays:14},antibiotics:{retryDays:14},
    tattoo:{retryDays:120},vaccination:{retryDays:14},pregnancy:{retryDays:null}
  },
  intervalDays:WHOLE_BLOOD_INTERVAL_DAYS
};
export const assessmentSteps=[['age','weight','unwell'],['illness','antibiotics','tattoo','vaccination','pregnancy'],['lastDonation']];
export const assessmentFields=assessmentSteps.flat();
export function donorToday(now=Date.now()) {
  const parts=Object.fromEntries(zoneDate.formatToParts(now).map(part=>[part.type,part.value]));
  return [parts.year,parts.month,parts.day].join('-');
}
export const addDonorDays=(date,days)=>new Date(Date.parse(date+'T00:00:00Z')+days*dayMs).toISOString().slice(0,10);
export const donorStart=(date,time)=>Date.parse(date+'T'+time+':00+05:00');
export const donorDaysUntil=(date,today=donorToday())=>Math.max(0,Math.round((Date.parse(date)-Date.parse(today))/dayMs));
const validDate=date=>typeof date==='string' && /^\d{4}-\d\d-\d\d$/.test(date) &&
  Number.isFinite(Date.parse(date)) && addDonorDays(date,0)===date;
const validTime=time=>typeof time==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
const minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
const timeLabel=value=>two(Math.floor(value/60))+':'+two(value%60);
const validStamp=value=>Number.isFinite(value) && Number.isFinite(new Date(value).getTime());

export function validAssessmentStep(step,answers,today=donorToday()) {
  return Boolean(assessmentSteps[step]?.every(field=>{
    if(field==='age')return Number.isInteger(Number(answers.age)) && Number(answers.age)>0;
    if(field==='weight')return Number.isFinite(Number(answers.weight)) && Number(answers.weight)>0;
    if(field==='lastDonation')return !answers.lastDonation || (validDate(answers.lastDonation) && answers.lastDonation<=today);
    return ['yes','no'].includes(answers[field]);
  }));
}

export function assessDonation(answers,today=donorToday()) {
  const rules=assessmentRules;
  if(!assessmentSteps.every((_,step)=>validAssessmentStep(step,answers,today)))return {ok:false,reason:'required'};
  const age=Number(answers.age);
  if(age<rules.age.min || age>rules.age.max)return {ok:false,reason:'age',retryYears:age<rules.age.min?rules.age.min-age:0};
  if(Number(answers.weight)<rules.weight.min)return {ok:false,reason:'weight'};
  const flags=Object.entries(rules.flags).filter(([field])=>answers[field]==='yes');
  const permanent=flags.find(([,rule])=>rule.retryDays===null);
  if(permanent)return {ok:false,reason:permanent[0]};
  const interval=answers.lastDonation?addDonorDays(answers.lastDonation,rules.intervalDays):'';
  const waits=flags.map(([reason,rule])=>({reason,retry:addDonorDays(today,rule.retryDays)}));
  if(interval>today)waits.push({reason:'lastDonation',retry:interval});
  waits.sort((a,b)=>b.retry.localeCompare(a.retry));
  return waits.length?{ok:false,...waits[0]}:{ok:true};
}

export const donorStorageKey=id=>prefix+id;
export const donorStatus=row=>row.status || (row.cancelled?'cancelled':'active');
export const donorBloodGroup=rows=>rows.find(row=>row.type==='blood-group')?.group || '';

export function readDonorHistory(userId) {
  if(!userId)return {rows:[],issue:''};
  return readStoredList(donorStorageKey(userId),row=>{
    if(row?.type==='blood-group')return groups.includes(row.group);
    if(!row || typeof row.number!=='string' || !/^D-[A-Z0-9]+-[A-Z0-9]+$/.test(row.number) || !validStamp(row.created))return false;
    if(row.type==='event')return cities.some(([id])=>id===row.event);
    if(row.type!=='booking' || !validDate(row.date) || !validTime(row.time))return false;
    if(!row.centerId)return cities.some(([id])=>id===row.center);
    return Boolean(donorCenter(row.centerId)) && row.userId===userId && row.id===row.number &&
      typeof row.ticketCode==='string' && /^[A-Z0-9-]{1,17}$/.test(row.ticketCode) && (!row.group || groups.includes(row.group)) &&
      ['active','cancelled','completed'].includes(row.status) && (row.status!=='completed' || validDate(row.donatedOn));
  });
}

export function latestDonation(rows) {
  const dates=rows.filter(row=>row.type==='booking' && donorStatus(row)==='completed')
    .map(row=>row.donatedOn).filter(validDate).sort();
  return dates.at(-1) || '';
}

export function nextDonorDate(rows) {
  const date=latestDonation(rows);
  return date?addDonorDays(date,WHOLE_BLOOD_INTERVAL_DAYS):'';
}

export function readAllDonorRecords() {
  const rows=[];
  try {
    const storage=globalThis.localStorage;
    for(let index=0;index<storage.length;index++){
      const key=storage.key(index);
      if(key?.startsWith(prefix)){
        const history=readDonorHistory(key.slice(prefix.length));
        if(history.issue==='unavailable')return {rows:[],issue:'unavailable'};
        rows.push(...history.rows);
      }
    }
  } catch {
    return {rows:[],issue:'unavailable'};
  }
  return {rows,issue:''};
}

export function donorSchedule(center,rows,now=Date.now(),earliest='') {
  const today=donorToday(now);
  const count=new Map();
  for(const row of rows){
    if(row.type!=='booking' || row.centerId!==center.id || donorStatus(row)!=='active')continue;
    const key=row.date+' '+row.time;
    count.set(key,(count.get(key) || 0)+1);
  }
  return Array.from({length:14},(_,offset)=>{
    const date=addDonorDays(today,offset);
    const hours=center.hours[new Date(date+'T12:00:00Z').getUTCDay()];
    const times=[];
    if(hours)for(let start=minutes(hours[0]);start+center.duration<=minutes(hours[1]);start+=center.duration){
      const time=timeLabel(start);
      const remaining=Math.max(0,center.capacity-(count.get(date+' '+time) || 0));
      times.push({time,remaining,available:remaining>0 && donorStart(date,time)>now && date>=earliest});
    }
    return {date,hours,times};
  });
}

export function updateDonor(task) {
  return globalThis.navigator?.locks ? navigator.locks.request(prefix,task) : task();
}

const error=code=>({ok:false,code});
const success=(code,record)=>({ok:true,code,record});

export function changeDonorBooking(action,userId,values={},now=Date.now()) {
  if(!userId)return error('profileRequired');
  const history=readDonorHistory(userId);
  if(history.issue==='unavailable')return error('unavailable');
  const {rows}=history;
  const store=(next,code,record)=>writeStored(donorStorageKey(userId),next)?success(code,record):error('saveFailed');
  if(action==='group'){
    if(values.group && !groups.includes(values.group))return error('required');
    const others=rows.filter(row=>row.type!=='blood-group');
    return store(values.group?[{type:'blood-group',group:values.group},...others]:others,'groupSaved');
  }
  if(action==='book'){
    if(rows.some(row=>row.type==='booking' && donorStatus(row)==='active'))return error('existing');
    const today=donorToday(now), assessment=assessDonation(values.answers ?? {},today);
    if(!assessment.ok)return error('assessmentRequired');
    if(values.date<nextDonorDate(rows))return error('interval');
    const center=donorCenter(values.centerId);
    if(!center || (values.group && !groups.includes(values.group)))return error('required');
    const all=readAllDonorRecords();
    if(all.issue)return error(all.issue);
    const day=donorSchedule(center,all.rows,now).find(day=>day.date===values.date);
    if(!day?.times.some(slot=>slot.time===values.time && slot.available))return error('slotUnavailable');
    const random=globalThis.crypto.getRandomValues(new Uint8Array(7));
    const ticketCode='J'+Array.from(random,byte=>byte.toString(16).padStart(2,'0')).join('').toUpperCase();
    const number='D-'+now.toString(36).toUpperCase()+'-'+ticketCode.slice(1);
    const record={type:'booking',id:number,number,userId,centerId:center.id,date:values.date,time:values.time,
      duration:center.duration,group:values.group || '',status:'active',ticketCode,created:now};
    return store([record,...rows],'booked',record);
  }
  const current=rows.find(row=>row.type==='booking' && row.number===values.number);
  if(!current || donorStatus(current)!=='active')return error('changed');
  if(action==='cancel' || action==='complete'){
    const status=action==='cancel'?'cancelled':'completed';
    const record={...current,status,cancelled:action==='cancel',...(action==='complete'?{donatedOn:donorToday(now)}:{})};
    return store(rows.map(row=>row===current?record:row),status,record);
  }
  return error('changed');
}

export function donationCalendar(record,description) {
  const escape=value=>String(value).replaceAll('\\','\\\\').replace(/\r?\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
  const stamp=millis=>new Date(millis).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const start=donorStart(record.date,record.time);
  const encoder=new TextEncoder();
  const fold=line=>{
    let result='', length=0;
    for(const character of line){
      const width=encoder.encode(character).length;
      if(length+width>75){result+='\r\n ';length=1;}
      result+=character;
      length+=width;
    }
    return result;
  };
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//JANASHYR//Demo Donation//EN','BEGIN:VEVENT',
    'UID:'+record.number+'@janashyr.invalid','DTSTAMP:'+stamp(record.created),'DTSTART:'+stamp(start),
    'DTEND:'+stamp(start+(record.duration || 30)*60000),'SUMMARY:'+escape(description.title),
    'LOCATION:'+escape(description.location),'STATUS:TENTATIVE','END:VEVENT','END:VCALENDAR',''].map(fold).join('\r\n');
}
