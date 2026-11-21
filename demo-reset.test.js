import test from 'node:test';
import assert from 'node:assert/strict';
import {resetDemoStorage,writeLocal,readLocal,getProfiles,renderDemoReset,renderLogin} from './profiles.js';
import {renderProjectInfo} from './project-info.js';
import {availableLessons,lessonStart,lessonState} from './education-data.js';
import {activityEnd,cityActivities} from './city-participation.js';
import {donorCenters,donorSchedule,donorStart} from './donor-booking-data.js';
import {demoReports} from './city-report-data.js';

function storage(entries,failKey){
  const values=new Map(entries.map(key=>[key,'1']));
  return {
    get length(){return values.size;},
    key(index){return [...values.keys()][index] ?? null;},
    getItem(key){return values.get(key) ?? null;},
    removeItem(key){if(key===failKey)throw new Error('blocked');values.delete(key);},
    setItem(key,value){values.set(key,value);}
  };
}

function withStores(context,local,session){
  for(const [name,value] of [['localStorage',local],['sessionStorage',session]]){
    const previous=Object.getOwnPropertyDescriptor(globalThis,name);
    Object.defineProperty(globalThis,name,{configurable:true,value});
    context.after(()=>{
      if(previous)Object.defineProperty(globalThis,name,previous);
      else delete globalThis[name];
    });
  }
}

test('demo reset deletes all JANASHYR namespaces and restores the six presets',context=>{
  const local=storage(['unrelated','janashyr-other','janashyr.education.listings.v1','janashyr.donation.v1.records','janashyr.digital.requests.v1']);
  const session=storage(['other.session','janashyr.chat.current','janashyr.route.v1:mock']);
  withStores(context,local,session);
  writeLocal('language','ru');
  writeLocal('access-obstacles',[{id:'test'}]);
  assert.equal(resetDemoStorage(),true);
  assert.deepEqual([local.key(0),local.key(1)],['unrelated','janashyr-other']);
  assert.equal(local.length,2);
  assert.equal(session.length,1);
  assert.equal(session.key(0),'other.session');
  assert.equal(readLocal('language'),null);
  assert.deepEqual(new Set(getProfiles().map(profile=>profile.role)),
    new Set(['volunteer','psychologist','teacher','learner','pensioner','helper']));
  assert.ok(getProfiles().every(profile=>profile.demo));
});

test('demo reset reports unavailable storage and allows a retry after a partial failure',context=>{
  const local=storage(['janashyr.ok','janashyr.blocked','other'],'janashyr.blocked');
  withStores(context,local,undefined);
  assert.equal(resetDemoStorage(),false);
  assert.equal(local.length,3);
  const session=storage(['janashyr.chat.current','other']);
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:session});
  assert.equal(resetDemoStorage(),false);
  assert.equal(local.getItem('janashyr.blocked'),'1');
  assert.equal(local.getItem('other'),'1');
  assert.equal(session.getItem('janashyr.chat.current'),null);
});

test('demo reset and the roadmap have Kazakh and Russian presentation copy',()=>{
  for(const [lang,phrase] of [['kk','Демо деректерді қалпына келтіру'],['ru','Сбросить демо-данные']]){
    assert.ok(renderDemoReset(lang).includes(phrase));
    assert.match(renderDemoReset(lang),/aria-describedby="demo-reset-warning"/);
    assert.match(renderLogin(lang,true),/id="demo-reset-success"/);
    assert.match(renderProjectInfo('about',lang),/id="project-roadmap-title"/);
    assert.doesNotMatch(renderProjectInfo('organizations',lang),/id="project-roadmap-title"/);
  }
});

test('a fresh demo has upcoming lessons, city activities and donor times in different seasons',()=>{
  for(const date of ['2026-12-31T20:30:00Z','2031-07-16T19:55:00Z']){
    const now=Date.parse(date);
    const lessons=availableLessons(lessonState(now,{rows:[],issue:''}).slots,{},now);
    assert.ok(new Set(lessons.map(slot=>slot.teacherId)).size>=2);
    assert.ok(lessons.every(slot=>lessonStart(slot)>now));
    const upcoming=cityActivities([],now).filter(activity=>activityEnd(activity)>now);
    assert.equal(upcoming.length,8);
    assert.ok(upcoming.every(activity=>activityEnd(activity)<=now+15*86400000));
    for(const center of donorCenters){
      const days=donorSchedule(center,[],now);
      assert.equal(days.length,14);
      assert.ok(days.some(day=>day.times.some(slot=>donorStart(day.date,slot.time)>now && slot.available)));
    }
    assert.equal(demoReports(now).length,3);
  }
});
