import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { activateProfile, createProfile, currentProfile, getProfiles, renderLogin, renderProfile, signOutProfile, writeLocal } from './profiles.js';
import { cleanupClick, cleanupHistory, renderCleanup } from './cleanup.js';

const roles = ['volunteer', 'psychologist', 'teacher', 'learner', 'pensioner', 'helper'];
const districts = ['abai', 'farabi', 'enbekshi', 'karatau', 'turan'];
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
  cleanupClick('cleanup-zone', 'abai', null);
});

afterEach(() => {
  if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
  else delete globalThis.localStorage;
});

const slotIds = markup => [...markup.matchAll(/data-action="cleanup-join" data-id="([^"]+)"/g)].map(match => match[1]);

test('six local roles can be created, switched, and restored without storing credentials', () => {
  const previews = getProfiles();
  assert.deepEqual(previews.map(profile => profile.role), roles);
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

test('Shymkent district table exposes at most three 40-person demo groups in each language', () => {
  const profile = activateProfile('preview-volunteer');
  for (const lang of ['ru','kk']) {
    for (const district of districts) {
      assert.equal(cleanupClick('cleanup-zone', district, profile), true);
      const page = renderCleanup(lang, profile);
      assert.match(page, /Шымкент/);
      assert.deepEqual([...page.matchAll(/data-action="cleanup-zone" data-id="([^"]+)"/g)].map(match => match[1]), districts);
      assert.match(page,new RegExp(`data-id="${district}" aria-pressed="true"`));
      assert.equal(slotIds(page).length, 3);
      assert.equal((page.match(/<progress value="\d+" max="40"/g) || []).length, 3);
      assert.ok(slotIds(page).every(slot => slot.startsWith(district + '-')));
    }
  }
  assert.equal(cleanupClick('cleanup-zone', 'missing', profile), true);
  assert.match(renderCleanup('ru', profile), /data-id="turan" aria-pressed="true"/);
});

test('cleanup signup respects capacity, avoids duplicate spots, and keeps cancellation history separate', () => {
  const volunteer = createProfile('Тестовый волонтёр', 'volunteer');
  const helper = createProfile('Тестовый помощник', 'helper');
  const learner = createProfile('Тестовый ученик', 'learner');
  const initial = renderCleanup('ru', volunteer);
  const group = slotIds(initial).find(slot => slot.startsWith('abai-2-'));
  assert.ok(group);
  assert.match(initial, /38 \/ 40/);

  cleanupClick('cleanup-join', group, null);
  cleanupClick('cleanup-join', 'made-up-slot', volunteer);
  assert.match(cleanupHistory('ru', volunteer), /Записей на уборку пока нет/);
  cleanupClick('cleanup-join', group, volunteer);
  cleanupClick('cleanup-join', group, volunteer);
  assert.match(renderCleanup('ru', volunteer), /39 \/ 40[^<]*Вы записаны/);
  assert.equal((cleanupHistory('ru', volunteer).match(/Демо-запись/g) || []).length, 1);
  assert.match(cleanupHistory('ru', helper), /Записей на уборку пока нет/);

  cleanupClick('cleanup-join', group, helper);
  assert.match(renderCleanup('ru', learner), /40 \/ 40/);
  assert.match(renderCleanup('ru', learner), /Нет мест/);
  cleanupClick('cleanup-join', group, learner);
  cleanupClick('cleanup-leave', group, learner);
  assert.match(cleanupHistory('ru', learner), /Записей на уборку пока нет/);
  assert.match(cleanupHistory('kk', helper), /Демо жазылу/);

  signOutProfile();
  assert.match(cleanupHistory('ru', currentProfile()), /Записей на уборку пока нет/);
  cleanupClick('cleanup-leave', group, activateProfile(volunteer.id));
  assert.match(cleanupHistory('ru', volunteer), /Отменено/);
  assert.match(cleanupHistory('ru', helper), /Демо-запись/);
  cleanupClick('cleanup-join', group, activateProfile(learner.id));
  assert.match(cleanupHistory('ru', learner), /Демо-запись/);
  assert.match(renderCleanup('ru', learner), /40 \/ 40[^<]*Вы записаны/);
});
