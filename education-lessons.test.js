import {beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {availableLessons,changeLesson,lessonEnd,lessonNotifications,lessonRating,lessonStart,lessonState,lessonToday,listingsKey} from './education-data.js';
import {renderEducation,educationClick} from './education-hub.js';
import {renderLessonProfile,renderLessonBell} from './education-lessons.js';

const now=Date.parse('2030-05-04T06:00:00Z');
const teacher={id:'tutor',role:'teacher'};
const anotherTeacher={id:'other-tutor',role:'teacher'};
const learner={id:'student',role:'learner'};
const anotherLearner={id:'another-student',role:'learner'};
const lesson={subject:'math',format:'online',date:'2030-05-05',time:'10:00',duration:45};
let storage;

beforeEach(()=>{
  storage=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:key=>storage.get(key) ?? null,
    setItem:(key,value)=>storage.set(key,value)
  }});
});

function slot(actor=teacher,details=lesson) {
  assert.equal(changeLesson('create',actor,details,now).code,'slotCreated');
  const saved=lessonState(now).slots.find(row=>row.teacherId===actor.id && row.date===details.date && row.time===details.time);
  assert.ok(saved);
  return saved;
}
const findSlot = (id,time=now) => lessonState(time).slots.find(row=>row.id===id);
const book = (item,actor=learner) => changeLesson('book',actor,{slotId:item.id,comment:'Демо-вопрос'},now);
function bookingRef(item,actor=learner) {
  assert.equal(book(item,actor).code,'applicationSent');
  return {slotId:item.id,bookingId:findSlot(item.id).bookings.at(-1).id};
}

test('a student cannot double-book the same slot',()=>{
  const item=slot();
  book(item);
  assert.equal(book(item).code,'occupied');
  assert.equal(findSlot(item.id).bookings.length,1);
});

test('a stale booking for a deleted slot is rejected',()=>{
  const item=slot();
  assert.equal(changeLesson('delete',teacher,{slotId:item.id},now).code,'slotDeleted');
  assert.equal(book(item).code,'missingSlot');
  assert.ok(!availableLessons(lessonState(now).slots,{},now).some(row=>row.id===item.id));
});

test('cancelling a confirmed booking before its start releases the slot',()=>{
  const item=slot(), ref=bookingRef(item);
  assert.equal(changeLesson('confirm',teacher,ref,now).code,'confirmed');
  assert.equal(changeLesson('cancel',learner,ref,now).code,'cancelled');
  assert.equal(findSlot(item.id).studentId,null);
  assert.equal(findSlot(item.id).status,'free');
  assert.equal(book(item,anotherLearner).code,'applicationSent');
});

test('a guest cannot reserve a slot or write to storage',()=>{
  const item=slot(), stored=storage.get(listingsKey);
  assert.equal(book(item,null).code,'profileRequired');
  assert.equal(storage.get(listingsKey),stored);
});

test('damaged localStorage shows a warning and preserves healthy records',()=>{
  const item=slot();
  const rows=JSON.parse(storage.get(listingsKey));
  storage.set(listingsKey,JSON.stringify([...rows,null,{type:'lesson-slot',id:'damaged'}]));
  assert.equal(lessonState(now).issue,'damaged');
  assert.match(renderLessonProfile('ru',teacher),/Повреждённые данные/);
  assert.equal(findSlot(item.id).id,item.id);
  assert.equal(book(item).code,'applicationSent');
  assert.equal(lessonState(now).issue,'');
  const [reserved]=JSON.parse(storage.get(listingsKey));
  reserved.bookings[0].created=1e300;
  storage.set(listingsKey,JSON.stringify([reserved]));
  assert.equal(lessonState(now).issue,'damaged');
  assert.match(renderLessonBell('ru',teacher),/Непрочитанных 0/);
  storage.set(listingsKey,'{bad-json');
  assert.equal(lessonState(now).issue,'damaged');
  assert.match(renderLessonProfile('kk',teacher),/Бүлінген деректер/);
});

test('a past slot cannot be created or booked',()=>{
  assert.equal(changeLesson('create',teacher,{...lesson,date:'2030-05-03'},now).code,'past');
  const item=slot();
  assert.equal(changeLesson('book',learner,{slotId:item.id},lessonStart(item)).code,'past');
  assert.ok(!availableLessons(lessonState(lessonStart(item)).slots,{},lessonStart(item)).some(row=>row.id===item.id));
});

test('two different students cannot reserve the same slot in succession',()=>{
  const item=slot();
  assert.equal(book(item,learner).code,'applicationSent');
  assert.equal(book(item,anotherLearner).code,'occupied');
  assert.equal(findSlot(item.id).studentId,learner.id);
});

test('teacher and student time overlaps are rejected while touching intervals are allowed',()=>{
  const item=slot();
  assert.equal(changeLesson('create',teacher,{...lesson,duration:0},now).code,'invalidSlot');
  assert.equal(slot(teacher,{...lesson,date:'2030-05-06',duration:5}).duration,5);
  assert.equal(slot(teacher,{...lesson,date:'2030-05-07',duration:240}).duration,240);
  assert.equal(changeLesson('create',teacher,{...lesson,time:'10:30'},now).code,'teacherOverlap');
  const overlap=slot(anotherTeacher,{...lesson,time:'10:30'});
  const following=slot(teacher,{...lesson,time:'10:45'});
  bookingRef(item);
  assert.equal(book(overlap).code,'studentOverlap');
  assert.equal(book(following).code,'applicationSent');
});

test('confirm, notify, review after the lesson and rate the teacher once',()=>{
  const item=slot(), ref=bookingRef(item);
  const notices=actor=>lessonNotifications(lessonState(now).slots,actor);
  assert.equal(notices(teacher)[0].kind,'new');
  assert.equal(notices(teacher)[0].read,false);
  assert.match(renderLessonBell('ru',teacher),/Непрочитанных 1/);
  assert.match(renderLessonProfile('ru',teacher),/Демо-вопрос/);
  assert.equal(changeLesson('read',teacher,ref,now).code,'notificationRead');
  assert.equal(notices(teacher)[0].read,true);
  assert.equal(changeLesson('confirm',anotherTeacher,ref,now).code,'roleRequired');
  assert.equal(changeLesson('confirm',teacher,ref,now).code,'confirmed');
  assert.equal(notices(learner)[0].kind,'confirmed');
  assert.equal(notices(learner)[0].read,false);
  assert.match(renderLessonProfile('kk',learner),/Расталды/);
  assert.equal(changeLesson('read',learner,ref,now).code,'notificationRead');
  assert.equal(notices(learner)[0].read,true);
  assert.equal(changeLesson('cancel',learner,ref,lessonStart(item)).code,'past');
  assert.equal(changeLesson('review',learner,{...ref,rating:5},lessonEnd(item)-1).code,'reviewUnavailable');
  assert.equal(changeLesson('review',learner,{...ref,rating:6},lessonEnd(item)).code,'invalidReview');
  assert.equal(changeLesson('review',learner,{...ref,rating:5,text:'Демо-отзыв'},lessonEnd(item)).code,'reviewSaved');
  assert.equal(changeLesson('review',learner,{...ref,rating:1},lessonEnd(item)).code,'reviewUnavailable');
  assert.deepEqual(lessonRating(lessonState(now).slots,teacher.id),{count:1,average:5});
});

test('declining records the reason and makes the slot available again',()=>{
  const item=slot(), ref=bookingRef(item);
  assert.equal(changeLesson('decline',teacher,{...ref,reason:'Демо-причина'},now).code,'declined');
  const [notice]=lessonNotifications(lessonState(now).slots,learner);
  assert.equal(notice.kind,'declined');
  assert.equal(notice.booking.reason,'Демо-причина');
  assert.equal(findSlot(item.id).status,'free');
  assert.equal(book(item,anotherLearner).code,'applicationSent');
});

test('rolling demos, catalog filters and legacy listings share the existing storage key',()=>{
  const initial=availableLessons(lessonState(now).slots,{},now);
  assert.equal(new Set(initial.map(row=>row.teacherId)).size,3);
  assert.ok(initial.every((row,index)=>index===0 || lessonStart(initial[index-1])<=lessonStart(row)));
  const later=now+10*86400000;
  assert.ok(availableLessons(lessonState(later).slots,{},later).every(row=>row.date>=lessonToday(later)));
  const {subject,format,date}=initial[0];
  assert.ok(availableLessons(initial,{subject,format,date},now).every(row=>row.subject===subject && row.format===format && row.date===date));
  assert.deepEqual(availableLessons(initial,{date:'2999-12-31'},now),[]);
  const offer={id:'education-tutor',owner:teacher.id,kind:'teacher',alias:'Демо-наставник',subject:'math',
    source:'teacher',format:'online',speech:'both',schedule:'weekday'};
  storage.set(listingsKey,JSON.stringify([offer]));
  const item=slot();
  assert.match(renderEducation('ru',learner),/Демо-наставник/);
  educationClick('edu-unpublish',null,'ru',teacher);
  assert.equal(findSlot(item.id).id,item.id);
  assert.doesNotMatch(renderEducation('ru',learner),/Демо-наставник/);
});

test('storage write failure does not reserve a lesson',()=>{
  const item=slot();
  globalThis.localStorage.setItem=()=>{throw new Error('storage blocked');};
  assert.equal(book(item).code,'saveFailed');
  assert.equal(findSlot(item.id).status,'free');
});
