import assert from 'node:assert/strict';
import {test} from 'node:test';
import {digitalClick,digitalHistory,digitalSubmit,renderDigital} from './digital-hub.js';

test('digital requests can be resolved only by their assigned helper and histories stay separate',()=>{
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const oldFormData = globalThis.FormData;
  const storage = new Map();
  Object.defineProperty(globalThis,'localStorage',{
    configurable:true,value:{
      getItem:key=>storage.get(key)??null,
      setItem:(key,value)=>storage.set(key,value)
    }
  });
  globalThis.FormData = class {
    constructor(form){this.form=form;}
    get(key){return this.form[key]??null;}
  };
  try {
    const requester = {id:'requester',role:'pensioner'};
    const helper = {id:'helper',role:'helper'};
    const other = {id:'other',role:'volunteer'};
    const learner = {id:'learner',role:'learner'};
    const form = {id:'digital-request-form',topic:'safety'};
    const records = ()=>JSON.parse([...storage.values()][0]);

    assert.match(renderDigital('kk'),/Цифрлық көмекші/);
    digitalSubmit(form,'ru',learner);
    assert.equal(storage.size,0);
    assert.match(renderDigital('ru',requester),/id="digital-request-form"/);
    digitalSubmit(form,'ru',requester);
    digitalSubmit(form,'ru',requester);
    assert.equal(records().length,1);
    const id = records()[0].id;

    assert.match(renderDigital('ru',helper),/Взять в работу/);
    digitalClick('digital-claim',id,'ru',helper);
    digitalClick('digital-resolve',id,'ru',other);
    assert.equal(records()[0].status,'claimed');
    digitalClick('digital-resolve',id,'ru',helper);
    assert.equal(records()[0].status,'resolved');
    assert.match(digitalHistory('ru',requester),/Завершена/);
    assert.match(digitalHistory('kk',helper),/Аяқталды/);
    assert.doesNotMatch(digitalHistory('ru',other),/Безопасность в интернете/);

    digitalSubmit(form,'ru',requester);
    digitalClick('digital-cancel',records()[0].id,'ru',requester);
    assert.equal(records()[0].status,'cancelled');
    assert.match(digitalHistory('ru',requester),/Отменена/);
  } finally {
    if (oldStorage) Object.defineProperty(globalThis,'localStorage',oldStorage);
    else delete globalThis.localStorage;
    globalThis.FormData = oldFormData;
  }
});

test('digital search intersects with the selected category',()=>{
  const oldFormData = globalThis.FormData;
  globalThis.FormData = class { get(){return 'видеозвонок';} };
  try {
    renderDigital('ru',null);
    digitalSubmit({id:'digital-search-form'},'ru',null);
    const results = renderDigital('ru',null);
    assert.match(results,/<strong>Подготовка к видеозвонку<\/strong>/);
    assert.doesNotMatch(results,/<strong>Электронные государственные услуги<\/strong>/);
    digitalClick('digital-category','safe','ru',null);
    assert.match(renderDigital('ru',null),/ничего не найдено/);
    digitalClick('digital-reset',null,'ru',null);
    assert.match(renderDigital('ru',null),/<strong>Безопасность в интернете<\/strong>/);
  } finally {
    globalThis.FormData = oldFormData;
  }
});
