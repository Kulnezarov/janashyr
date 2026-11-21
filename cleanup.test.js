import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { activateProfile, createProfile, currentProfile, getProfiles, renderLogin, renderProfile, signOutProfile, writeLocal } from './profiles.js';
import {cleanupHistory,renderCleanup} from './cleanup.js';
import {activityStart,activityEnd,changeParticipation,cityActivities,readParticipation,filterActivities,helpMinutes} from './city-participation.js';

const roles = ['volunteer', 'psychologist', 'teacher', 'learner', 'pensioner', 'helper'];
let previousStorage;

beforeEach(() => {
  previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    }
  });
  writeLocal('profiles', []);
  writeLocal('cleanup-entries', []);
  signOutProfile();
});

afterEach(() => {
  if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
  else delete globalThis.localStorage;
});

test('six local roles can be created, switched, and restored without storing credentials', () => {
  const previews = getProfiles();
  assert.deepEqual([...new Set(previews.map(profile => profile.role))], roles);
  assert.equal(currentProfile(), null);
  assert.equal(createProfile('X', 'volunteer'), null);
  assert.equal(createProfile('Mistake', 'admin'), null);

  const custom = roles.map(role => {
    const profile = createProfile('Test ' + role, role);
    assert.deepEqual(currentProfile(), profile);
    assert.equal(profile.role, role);
    assert.deepEqual(Object.keys(profile).sort(), ['alias', 'id', 'role']);
    return profile;
  });
  assert.equal(new Set(custom.map(profile => profile.id)).size, roles.length);
  for (const profile of [...previews, ...custom]) {
    assert.deepEqual(activateProfile(profile.id), profile);
    assert.deepEqual(currentProfile(), profile);
  }

  const escaped = createProfile('<b>Sample</b>', 'teacher');
  assert.match(renderLogin('ru'), /&lt;b&gt;Sample&lt;\/b&gt;/);
  assert.match(renderProfile('kk', escaped, []), /&lt;b&gt;Sample&lt;\/b&gt;/);
  signOutProfile();
  assert.equal(currentProfile(), null);
  assert.ok(getProfiles().some(profile => profile.id === escaped.id));
  assert.deepEqual(activateProfile(custom[0].id), custom[0]);
});

const now=Date.parse('2030-05-06T00:00:00Z');
const activity=(prefix,time=now)=>cityActivities(readParticipation().rows,time)
  .find(row=>row.id.startsWith(prefix) && activityStart(row)>time);
const apply=(action,id,actor='one',time=now)=>changeParticipation(action,id,actor,time);

test('city catalog offers eight upcoming actions across five districts with combined filters',()=>{
  const items=cityActivities([],now);
  const upcoming=items.filter(row=>activityStart(row)>now);
  assert.equal(upcoming.length,8);
  assert.equal(new Set(upcoming.map(row=>row.district)).size,5);
  assert.equal(new Set(upcoming.map(row=>row.type)).size,4);
  const filtered=filterActivities(upcoming,{district:'abai',type:'cleanup',date:''});
  assert.equal(filtered.length,1);
  assert.deepEqual(filterActivities(upcoming,{district:'abai',type:'planting',date:filtered[0].date}),[upcoming.find(row=>row.type==='planting' && row.district==='abai')]);
  for(const lang of ['ru','kk'])assert.match(renderCleanup(lang,null),/id="cleanup-filters"/);
});

test('full activity rejects direct signup and offers a separate waitlist',()=>{
  const full=activity('center-seniors');
  assert.equal(full.status,'full');
  assert.equal(apply('join',full.id),'full');
  assert.equal(apply('wait',full.id),'waited');
  assert.equal(readParticipation().rows[0].status,'waiting');
  assert.equal(activity('center-seniors').signedUp.length,full.capacity);
  assert.equal(apply('wait',full.id),'duplicate');
});

test('duplicate activity signup does not increment participant count',()=>{
  const item=activity('park-cleanup');
  assert.equal(apply('join',item.id),'entered');
  assert.equal(apply('join',item.id),'duplicate');
  assert.equal(activity('park-cleanup').signedUp.length,item.seeded+1);
});

test('signup rejects overlapping time while allowing another non-overlapping activity',()=>{
  const first=activity('park-cleanup'), overlap=activity('park-planting'), later=activity('walk-cleanup');
  assert.equal(first.date,overlap.date);
  assert.equal(apply('join',first.id),'entered');
  assert.equal(apply('join',overlap.id),'overlap');
  assert.equal(apply('join',later.id),'entered');
});

test('cancellation releases a seat and both the original participant and a waiting participant can register again',()=>{
  const item=activity('walk-cleanup');
  assert.equal(apply('join',item.id,'one'),'entered');
  assert.equal(apply('wait',item.id,'two'),'waited');
  assert.equal(apply('leave',item.id,'one'),'cancelled');
  assert.equal(activity('walk-cleanup').signedUp.length,item.seeded);
  assert.equal(apply('join',item.id,'one'),'entered');
  assert.equal(apply('leave',item.id,'one'),'cancelled');
  assert.equal(apply('join',item.id,'two'),'entered');
  assert.equal(readParticipation().rows.find(row=>row.userId==='two').status,'joined');
});

test('a guest cannot sign up, reserve a waitlist spot or change activity storage',()=>{
  assert.equal(apply('join',activity('park-cleanup').id,null),'profileRequired');
  assert.equal(apply('wait',activity('center-seniors').id,null),'profileRequired');
  assert.equal(readParticipation().rows.length,0);
});

test('past participation counts as help hours and can no longer be cancelled',()=>{
  const item=activity('park-cleanup');
  assert.equal(apply('join',item.id),'entered');
  assert.equal(helpMinutes(readParticipation().rows,'one',activityEnd(item)-1),0);
  assert.equal(helpMinutes(readParticipation().rows,'one',activityEnd(item)),120);
  assert.equal(cityActivities(readParticipation().rows,activityEnd(item)).find(row=>row.id===item.id).status,'past');
  assert.equal(apply('leave',item.id,'one',activityEnd(item)),'closed');
});

test('old enrollment snapshots are retained and can be cancelled by their original profile',()=>{
  const slot={id:'abai-0-2030-05-08',zone:'abai',point:0,date:'2030-05-08',time:'10:00',base:22,capacity:40};
  writeLocal('cleanup-entries',[{profile:'one',slot,cancelled:false}]);
  const old=readParticipation().rows[0];
  assert.equal(old.activityId,slot.id);
  assert.equal(old.status,'joined');
  assert.match(cleanupHistory('ru',{id:'one'}),/Группа уборки 1/);
  assert.equal(apply('leave',slot.id,'one'),'cancelled');
  assert.equal(readParticipation().rows[0].status,'cancelled');
});
