import {readStoredList,writeStored} from './profiles.js';

export const subjects = {
  math:['Математика','Математика'],
  languages:['Тілдер','Языки'],
  science:['Жаратылыстану','Естественные науки'],
  digital:['Цифрлық сауат','Цифровая грамотность'],
  humanities:['Гуманитарлық пәндер','Гуманитарные предметы']
};
export const formats = {online:['Онлайн','Онлайн'],local:['Шымкентте жүзбе-жүз','Очно в Шымкенте']};
export const listingsKey = 'janashyr.education.listings.v1';

const slotType = 'lesson-slot';
const demoRoom = 'https://example.invalid/lesson';
const statuses = ['pending','confirmed','declined','cancelled'];
const minute = 60000;
const localDate = new Intl.DateTimeFormat('en-CA',{
  timeZone:'Asia/Almaty',year:'numeric',month:'2-digit',day:'2-digit'
});
const starter = [
  ['preview-teacher','math','online','16:00',45,demoRoom],
  ['preview-lesson-samal','languages','local','17:00',60,'library'],
  ['preview-lesson-lira','science','online','18:00',45,demoRoom]
];
const string = (value,max) => typeof value==='string' && value.length<=max;
const validTimestamp = value => Number.isFinite(value) && Number.isFinite(new Date(value).getTime());
const id = value => string(value,160) && value.length>0;
const isActor = (actor,role) => actor?.role===role && id(actor.id);
const active = row => row.status==='pending' || row.status==='confirmed';
const newId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);

export function lessonToday(now=Date.now()) {
  const parts=Object.fromEntries(localDate.formatToParts(now).map(part=>[part.type,part.value]));
  return [parts.year,parts.month,parts.day].join('-');
}

export const lessonStart = slot => Date.parse(slot.date+'T'+slot.time+':00+05:00');
export const lessonEnd = slot => lessonStart(slot)+slot.duration*minute;
const overlaps = (a,b) => lessonStart(a)<lessonEnd(b) && lessonStart(b)<lessonEnd(a);
const validDate = date => typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) &&
  new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
const validTime = time => typeof time==='string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time);
const validDuration = duration => Number.isSafeInteger(duration) && duration>0;
const validDetails = slot => typeof slot.subject==='string' && Object.hasOwn(subjects,slot.subject) &&
  typeof slot.format==='string' && Object.hasOwn(formats,slot.format) &&
  validDate(slot.date) && validTime(slot.time) && validDuration(slot.duration) &&
  (slot.format==='online'?slot.location===demoRoom:['library','community'].includes(slot.location));
const validReview = (row,bookingId) => row && id(row.id) && row.bookingId===bookingId &&
  Number.isInteger(row.rating) && row.rating>=1 && row.rating<=5 &&
  string(row.text,500) && validTimestamp(row.date);
const validDecision = decision => decision && ['confirmed','declined'].includes(decision.status) &&
  validTimestamp(decision.date) && typeof decision.read==='boolean';

function validBooking(row,slot) {
  return row && id(row.id) && row.slotId===slot.id && row.teacherId===slot.teacherId && id(row.studentId) &&
    validTimestamp(row.created) && statuses.includes(row.status) && string(row.comment,300) && string(row.reason,300) &&
    typeof row.teacherRead==='boolean' && (row.decision==null || validDecision(row.decision)) &&
    (row.status!=='confirmed' || row.decision?.status==='confirmed') &&
    (row.status!=='declined' || row.decision?.status==='declined') &&
    (row.review==null || (row.status==='confirmed' && validReview(row.review,row.id)));
}

function validSlot(row) {
  if(!id(row.id) || !id(row.teacherId) || !validDetails(row) || !Array.isArray(row.bookings) ||
      !row.bookings.every(booking=>validBooking(booking,row)))return false;
  const reserved=row.bookings.filter(active);
  return new Set(row.bookings.map(booking=>booking.id)).size===row.bookings.length && reserved.length<=1 &&
    row.status===(reserved.length?'occupied':'free') && row.studentId===(reserved[0]?.studentId ?? null) &&
    (!row.deleted || !reserved.length);
}

export function readEducationRecords() {
  const {rows,issue}=readStoredList(listingsKey,row=>row && typeof row==='object' &&
    (row.type===slotType?validSlot(row):id(row.id) && id(row.owner) && ['teacher','learner'].includes(row.kind)));
  const seen=new Set();
  const records=rows.filter(row=>{
    if(seen.has(row.id))return false;
    seen.add(row.id);
    return true;
  });
  return {rows:records,issue:issue || (rows.length!==records.length?'damaged':'')};
}

// Every action updates the slot, booking history and notification flags in one write.
export function updateEducation(task) {
  if(globalThis.navigator?.locks)return navigator.locks.request(listingsKey,task);
  return task();
}

function starterSlots(now,stored) {
  const today=lessonToday(now);
  const blockedIds=new Set(stored.map(row=>row.id));
  const base=Date.parse(today+'T12:00:00Z');
  return [0,1,2].flatMap(offset=>{
    const date=new Date(base+offset*86400000).toISOString().slice(0,10);
    return starter.map(([teacherId,subject,format,time,duration,location])=>({
      type:slotType,id:'demo-lesson-'+teacherId+'-'+date,teacherId,subject,format,date,time,duration,location,
      status:'free',studentId:null,bookings:[],demo:true
    })).filter(slot=>lessonStart(slot)>now && !blockedIds.has(slot.id) &&
      !stored.some(row=>!row.deleted && row.teacherId===slot.teacherId && overlaps(row,slot)));
  });
}

export function lessonState(now=Date.now(), records=readEducationRecords()) {
  const stored=records.rows.filter(row=>row.type===slotType);
  const slots=[...stored,...starterSlots(now,stored)].sort((a,b)=>lessonStart(a)-lessonStart(b) || a.id.localeCompare(b.id));
  return {slots,issue:records.issue};
}

export function availableLessons(slots,filters={},now=Date.now()) {
  return slots.filter(slot=>!slot.deleted && slot.status==='free' && lessonStart(slot)>now &&
    ['subject','format','date'].every(field=>!filters[field] || filters[field]===slot[field]));
}

export function lessonRating(slots,teacherId) {
  const ratings=slots.filter(slot=>slot.teacherId===teacherId).flatMap(slot=>slot.bookings)
    .filter(row=>row.review).map(row=>row.review.rating);
  return {count:ratings.length,average:ratings.length?ratings.reduce((sum,value)=>sum+value,0)/ratings.length:0};
}

export function lessonNotifications(slots,actor) {
  if(!actor)return [];
  return slots.flatMap(slot=>slot.bookings.flatMap(booking=>{
    if(booking.teacherId===actor.id)return [{slot,booking,kind:'new',date:booking.created,read:booking.teacherRead}];
    if(booking.studentId===actor.id && booking.decision)return [{slot,booking,kind:booking.decision.status,date:booking.decision.date,read:booking.decision.read}];
    return [];
  })).sort((a,b)=>b.date-a.date);
}

const fail = code => ({ok:false,code});
const pass = code => ({ok:true,code});
const trimmed = (value,max) => typeof value==='string' ? value.trim().slice(0,max) : '';

export function changeLesson(action,actor,values={},now=Date.now()) {
  if(!actor?.id)return fail('profileRequired');
  const records=readEducationRecords();
  if(records.issue==='unavailable')return fail('unavailable');
  const {slots}=lessonState(now,records);
  const slot=slots.find(row=>row.id===values.slotId);
  const commit=(updated,code)=>{
    const rows=records.rows.some(row=>row.id===updated.id)
      ? records.rows.map(row=>row.id===updated.id?updated:row)
      : [...records.rows,updated];
    return writeStored(listingsKey,rows)?pass(code):fail('saveFailed');
  };

  if(action==='create'){
    if(!isActor(actor,'teacher'))return fail('roleRequired');
    const created={id:'lesson-'+newId(),type:slotType,teacherId:actor.id,subject:values.subject,format:values.format,
      date:values.date,time:values.time,duration:Number(values.duration),location:values.format==='online'?demoRoom:values.location,
      status:'free',studentId:null,bookings:[]};
    if(!validDetails(created))return fail('invalidSlot');
    if(lessonStart(created)<=now)return fail('past');
    if(slots.some(row=>!row.deleted && row.teacherId===actor.id && overlaps(row,created)))return fail('teacherOverlap');
    return commit(created,'slotCreated');
  }
  if(!slot)return fail('missingSlot');
  if(action==='delete'){
    if(!isActor(actor,'teacher') || slot.teacherId!==actor.id)return fail('roleRequired');
    if(slot.deleted)return fail('missingSlot');
    if(slot.status!=='free')return fail('occupied');
    return commit({...slot,deleted:true},'slotDeleted');
  }
  if(action==='book'){
    if(!isActor(actor,'learner') || actor.id===slot.teacherId)return fail('roleRequired');
    if(slot.deleted)return fail('missingSlot');
    if(lessonStart(slot)<=now)return fail('past');
    if(slot.status!=='free')return fail('occupied');
    if(slots.some(row=>!row.deleted && overlaps(row,slot) &&
      row.bookings.some(booking=>booking.studentId===actor.id && active(booking))))return fail('studentOverlap');
    const booking={id:'application-'+newId(),slotId:slot.id,studentId:actor.id,teacherId:slot.teacherId,
      created:now,status:'pending',comment:trimmed(values.comment,300),reason:'',teacherRead:false};
    return commit({...slot,status:'occupied',studentId:actor.id,bookings:[...slot.bookings,booking]},'applicationSent');
  }

  const booking=slot.bookings.find(row=>row.id===values.bookingId);
  if(!booking)return fail('missingBooking');
  const teacher=isActor(actor,'teacher') && booking.teacherId===actor.id;
  const student=isActor(actor,'learner') && booking.studentId===actor.id;
  const update=(changes,code,release=false)=>commit({...slot,
    status:release?'free':slot.status,studentId:release?null:slot.studentId,
    bookings:slot.bookings.map(row=>row.id===booking.id?{...row,...changes}:row)
  },code);

  if(action==='confirm' || action==='decline'){
    if(!teacher)return fail('roleRequired');
    if(booking.status!=='pending')return fail('changed');
    if(action==='confirm' && lessonStart(slot)<=now)return fail('past');
    const status=action==='confirm'?'confirmed':'declined';
    return update({status,reason:action==='decline'?trimmed(values.reason,300):'',
      teacherRead:true,decision:{status,date:now,read:false}},status,action==='decline');
  }
  if(action==='cancel'){
    if(!student)return fail('roleRequired');
    if(!active(booking))return fail('changed');
    if(lessonStart(slot)<=now)return fail('past');
    return update({status:'cancelled'},'cancelled',true);
  }
  if(action==='review'){
    if(!student)return fail('roleRequired');
    if(booking.status!=='confirmed' || lessonEnd(slot)>now || booking.review)return fail('reviewUnavailable');
    const rating=Number(values.rating);
    if(!Number.isInteger(rating) || rating<1 || rating>5)return fail('invalidReview');
    return update({review:{id:'review-'+newId(),bookingId:booking.id,rating,text:trimmed(values.text,500),date:now}},'reviewSaved');
  }
  if(action==='read'){
    if(teacher)return update({teacherRead:true},'notificationRead');
    if(student && booking.decision)return update({decision:{...booking.decision,read:true}},'notificationRead');
    return fail('roleRequired');
  }
  return fail('changed');
}
