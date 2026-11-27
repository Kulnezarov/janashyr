import { test } from 'node:test';
import assert from 'node:assert/strict';
import { content } from './content.js';

test('interface navigation, language and demo session', async () => {
  const listeners = {}; const app = { innerHTML: '' };
  globalThis.document = { documentElement: {}, title: '', querySelector: selector => selector === '#app' ? app : null, addEventListener: (name, fn) => { listeners[name] = fn; } };
  globalThis.location = { pathname: '/', hash: '' };
  globalThis.history = { pushState: (_a, _b, url) => { const parsed = new URL(url, 'http://localhost'); location.pathname = parsed.pathname; location.hash = parsed.hash; } };
  globalThis.window = { addEventListener: (name, fn) => { listeners[name] = fn; }, scrollTo() {} };
  await import('./app.js');
  assert.match(app.innerHTML, /Көмек әрқашан <em[^>]*>жаныңда/);
  assert.equal(document.documentElement.lang, 'kk');
  assert.equal((app.innerHTML.match(/class="home-service-card /g)||[]).length,4);
  assert.match(app.innerHTML,/href="#directions"/); assert.match(app.innerHTML,/href="#how"/); assert.match(app.innerHTML,/id="how"/);
  const click = (selector, value) => listeners.click({target:{closest: query => query === selector ? value : null},button:0,preventDefault(){}});
  click('[data-lang]', { dataset: {lang:'ru'} });
  assert.equal(document.documentElement.lang, 'ru'); assert.match(app.innerHTML, /Помощь всегда <em[^>]*>рядом/); assert.match(app.innerHTML,/Как это работает\?/);
  for (const lane of content.ru.lanes) {
    const url = `/directions/${lane.slug}`;
    click('[data-link]', {getAttribute:()=>url});
    assert.equal(location.pathname,url); assert.ok(app.innerHTML.includes(lane.title)); if(!['donation','accessibility','city'].includes(lane.slug)) assert.ok(app.innerHTML.includes(lane.items[0]));
  }
  click('[data-link]', {getAttribute:()=>'/login'}); assert.match(app.innerHTML,/Демонстрационный вход/);
  click('[data-action]',{dataset:{action:'profile-select',id:'preview-volunteer'}}); assert.equal(location.pathname,'/account'); assert.match(app.innerHTML,/Демонстрационный личный кабинет/);
  click('[data-action]',{dataset:{action:'logout'}}); assert.equal(location.pathname,'/');
});

test('both languages cover all four directions', () => {
  assert.deepEqual(content.kk.lanes.map(x=>x.slug),content.ru.lanes.map(x=>x.slug));
  assert.equal(content.kk.lanes.length,4);
  for (let i=0;i<4;i++) assert.equal(content.kk.lanes[i].items.length,content.ru.lanes[i].items.length);
});
