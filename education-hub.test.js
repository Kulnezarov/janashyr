import assert from 'node:assert/strict';
import {test} from 'node:test';
import {educationClick, educationHistory, educationSubmit, renderEducation} from './education-hub.js';

test('education discovery, permissions, local postings and private history in both languages', () => {
  const values = new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,value)
  }});
  globalThis.FormData = class {
    constructor(form) { this.fields=form.fields; }
    get(key) { return this.fields[key] ?? null; }
  };
  const submit=(id,fields,profile)=>educationSubmit({id,fields},'ru',profile);
  const learner={id:'p1',role:'learner',alias:'Учебный профиль'};
  const other={id:'p2',role:'learner',alias:'Второй профиль'};
  const teacher={id:'p3',role:'teacher',alias:'<Преподаватель>'};
  const volunteer={id:'p4',role:'volunteer',alias:'Волонтёр'};
  assert.match(renderEducation('kk',null),/Ұстаз іздеу/);
  assert.match(renderEducation('ru',null),/Найти ученика/);
  assert.match(renderEducation('ru',null),/\/directions\/support\/education\/courses/);
  assert.equal(educationClick('edu-interest','mentor-sofia','ru',volunteer),false);
  assert.equal(submit('education-search',{query:'София',subject:'languages',source:'school',speech:'ru'},learner),true);
  assert.match(renderEducation('ru',learner),/Найдено: 1/);
  assert.match(renderEducation('ru',learner),/София/);
  assert.doesNotMatch(renderEducation('ru',learner),/Аскар/);
  educationClick('edu-interest','mentor-sofia','ru',learner);
  educationClick('edu-interest','mentor-sofia','ru',learner);
  assert.equal((educationHistory('ru',learner).match(/София/g) ?? []).length,1);
  assert.doesNotMatch(educationHistory('ru',other),/София/);
  educationClick('edu-unsave','mentor-sofia','ru',learner);
  assert.doesNotMatch(educationHistory('ru',learner),/София/);
  educationClick('edu-mode','learner','ru',teacher);
  assert.match(renderEducation('ru',teacher),/Малика/);
  educationClick('edu-interest','learner-malika','ru',teacher);
  assert.match(educationHistory('ru',teacher),/Малика/);
  const ad={subject:'humanities',source:'retired',format:'online',speech:'both',schedule:'weekend',from:'10:00',until:'12:00'};
  assert.equal(submit('education-publish',ad,volunteer),false);
  assert.equal(submit('education-publish',ad,teacher),true);
  assert.match(renderEducation('ru',learner),/&lt;Преподаватель&gt;/);
  assert.doesNotMatch(renderEducation('ru',learner),/<Преподаватель>/);
  educationClick('edu-interest','education-p3','ru',learner);
  educationClick('edu-unpublish',undefined,'ru',teacher);
  assert.doesNotMatch(renderEducation('ru',learner),/&lt;Преподаватель&gt;/);
  assert.match(educationHistory('ru',learner),/&lt;Преподаватель&gt;/);
});
