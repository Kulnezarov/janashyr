import {beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {writeLocal} from './profiles.js';
import {changeCityReport,readCityReports,reportPoint,validateReportPhoto,photoLimit,filterReports,demoReports} from './city-report-data.js';
import {renderReportForm,renderReportHistory} from './city-reports.js';
import {useCityProfile,saveCityProfile} from './city.js';

const now=Date.parse('2030-05-06T00:00:00Z');
const report={id:'G-TEST-1',category:'ramp',district:'karatau',description:'Пример повреждённого пандуса',point:'north'};
let storage;

beforeEach(()=>{
  storage=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:key=>storage.get(key) ?? null,
    setItem:(key,value)=>storage.set(key,value)
  }});
});

test('empty and too-short descriptions produce a field error and write nothing',()=>{
  for(const description of ['', '   ', 'коротко']){
    const result=changeCityReport('submit','one',{...report,description},true,now);
    assert.equal(result.errors.description,'descriptionShort');
  }
  assert.equal(storage.size,0);
});

test('invalid category and district are identified independently',()=>{
  const result=changeCityReport('submit','one',{...report,category:'',district:'unknown'},true,now);
  assert.deepEqual(result.errors,{category:'categoryRequired',district:'districtRequired'});
});

test('photo rejects non-images and over 5 MB but accepts an image at the limit',()=>{
  assert.equal(validateReportPhoto({type:'text/plain',size:12}),'photoType');
  assert.equal(validateReportPhoto({type:'',size:12}),'photoType');
  assert.equal(validateReportPhoto({type:'image/png',size:photoLimit+1}),'photoSize');
  assert.equal(validateReportPhoto({type:'image/png',size:photoLimit}),'');
});

test('submission persists an author, optional point and number without saving photo data or duplicates',()=>{
  const payload={...report,photo:'blob:private-local-only'};
  const result=changeCityReport('submit','one',payload,true,now);
  assert.equal(result.code,'sent');
  assert.equal(result.record.author,'one');
  assert.equal(result.record.status,'sent');
  assert.deepEqual(result.record.point,reportPoint('karatau','north'));
  assert.equal(changeCityReport('submit','one',payload,true,now+1).record.created,now);
  assert.equal(readCityReports('one').rows.length,1);
  assert.equal(readCityReports('two').rows.length,0);
  assert.equal(storage.get('janashyr.demo.v2.city-one').includes('blob:'),false);
  const noPoint=changeCityReport('submit','one',{...report,id:'G-TEST-2',point:''},true,now);
  assert.equal(noPoint.record.point,null);
});

test('only the author can advance through the demo statuses and only in demo mode',()=>{
  changeCityReport('submit','one',report,true,now);
  assert.equal(changeCityReport('advance','two',report,true,now).code,'changed');
  assert.equal(changeCityReport('advance','one',report,false,now).code,'changed');
  for(const next of ['accepted','working','resolved']){
    const result=changeCityReport('advance','one',report,true,now);
    assert.equal(result.record.status,next);
  }
  assert.equal(changeCityReport('advance','one',report,true,now).code,'changed');
  const {rows}=readCityReports('one',now);
  assert.equal(filterReports(rows,'resolved').length,1);
  assert.deepEqual(filterReports(rows,'sent'),[]);
  assert.match(renderReportHistory('ru',{id:'one'}),/Решено/);
});

test('guest reports and unavailable storage cannot commit an issue',()=>{
  assert.equal(changeCityReport('submit',null,report,true,now).code,'profileRequired');
  localStorage.setItem=()=>{throw Error('blocked');};
  assert.equal(changeCityReport('submit','one',report,true,now).code,'saveFailed');
  assert.equal(storage.size,0);
});

test('older city data and reports can coexist even after saving the old city section',()=>{
  writeLocal('city-one',{issues:[{id:40,owner:1,cat:3,desc:'Старое описание фонаря',status:4,history:[{at:now}]}],groups:[],events:[],next:41});
  assert.equal(readCityReports('one',now).rows[0].status,'working');
  changeCityReport('submit','one',report,true,now);
  useCityProfile({id:'one'});
  saveCityProfile();
  assert.deepEqual(readCityReports('one',now).rows.map(row=>row.id).sort(),['G-OLD-40','G-TEST-1']);
  assert.equal(JSON.parse(storage.get('janashyr.demo.v2.city-one')).next,41);
});

test('three demo examples render in both languages and broken storage shows a fallback',()=>{
  assert.equal(demoReports(now).length,3);
  assert.match(renderReportForm('ru',null),/Примеры обращений/);
  assert.match(renderReportForm('kk',null),/Өтініш үлгілері/);
  storage.set('janashyr.demo.v2.city-one','{broken');
  assert.match(renderReportHistory('ru',{id:'one'}),/Повреждённые данные/);
});
