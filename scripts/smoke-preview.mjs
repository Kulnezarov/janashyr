import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

const require = createRequire(import.meta.url);
const base = new URL(process.argv[2] || 'http://localhost:3000');
const previewHref = path => base.pathname.replace(/\/$/, '') + path;
if (!['localhost','127.0.0.1','[::1]'].includes(base.hostname)) {
  throw new Error('The smoke test accepts only a local preview URL.');
}

function playwright() {
  const configured = process.env.JANASHYR_PLAYWRIGHT;
  if (configured) return require(configured);
  try { return require('playwright'); } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
  const local = process.env.LOCALAPPDATA;
  if (local) {
    const cache = join(local,'npm-cache','_npx');
    if (existsSync(cache)) {
      for (const entry of readdirSync(cache)) {
        const modulePath = join(cache,entry,'node_modules','playwright');
        if (existsSync(join(modulePath,'package.json'))) return require(modulePath);
      }
    }
  }
  throw new Error('Playwright is unavailable. Set JANASHYR_PLAYWRIGHT to the path of an installed Playwright package.');
}

const browserPaths = [
  process.env.JANASHYR_CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
].filter(Boolean);
const executablePath = browserPaths.find(path=>existsSync(path));
const browser = await playwright().chromium.launch({headless:true,executablePath});
try {
  const context = await browser.newContext({viewport:{width:1440,height:950},reducedMotion:'reduce'});
  // The test deliberately checks local features without waiting on external map tiles.
  await context.route('**/*',route=>new URL(route.request().url()).origin===base.origin ? route.continue() : route.abort());
  // Use scripted coordinates to exercise both outcomes independently of OS location providers.
  await context.addInitScript(() => {
    const method = (_success, failure) => queueMicrotask(() => failure({code: 1}));
    Object.defineProperty(navigator.geolocation,'getCurrentPosition',{configurable:true,writable:true,value:method});
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror',error=>errors.push(error.message));

  async function open(path, marker) {
    const target=new URL(previewHref(path),base).href;
    const response = await page.goto(target,{waitUntil:'domcontentloaded'});
    assert.ok(response?response.ok():page.url()===target,`HTTP failed for ${path}: ${response?.status()}`);
    await page.locator(marker).first().waitFor({state:'visible',timeout:5000});
  }

  const screens = [
    ['/','.theme-home h1'],
    ['/directions/support','.support-landing h1'],
    ['/directions/support/psychology','.psych-hero h1'],
    ['/directions/support/education','.edu-hub h1'],
    ['/directions/support/education/courses','.support-heading h1'],
    ['/directions/support/digital','.digital-hub h1'],
    ['/directions/donation','.donor-hub h1'],
    ['/directions/accessibility','.access-workspace h1'],
    ['/directions/city','.cleanup-page h1'],
    ['/volunteers','main h1'],
    ['/organizations','.project-info h1'],
    ['/about','.project-info h1']
  ];
  await open('/','.theme-home h1');
  await page.locator('[data-lang="ru"]:visible').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'ru');
  await page.locator('[data-lang="kk"]:visible').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'kk');
  for(const [path,marker] of screens) await open(path,marker);

  async function selectProfile(role) {
    await open('/login','.profile-pick');
    await page.locator(`[data-action="profile-select"][data-id="preview-${role}"]`).click();
    await page.waitForURL(new URL(previewHref('/account'),base).href);
    await page.locator('.profile-lead h1').waitFor();
  }
  for(const role of ['volunteer','psychologist','teacher','learner','pensioner','helper']) await selectProfile(role);

  await open('/login','#profile-create-form');
  await page.locator('#profile-create-form input[name="alias"]').fill('E2E Demo');
  await page.locator('#profile-create-form select[name="role"]').selectOption('pensioner');
  await page.locator('#profile-create-form button[type="submit"]').click();
  await page.waitForURL(new URL(previewHref('/account'),base).href);
  assert.equal(await page.locator('.profile-lead h1').textContent(),'E2E Demo');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('.profile-lead h1').waitFor();
  assert.equal(await page.locator('.profile-lead h1').textContent(),'E2E Demo');

  await open('/directions/support/digital','#digital-request-form');
  await page.locator('#digital-search-query').fill('мәтін');
  await page.locator('#digital-search-form button').click();
  assert.equal(await page.locator('.digital-lessons details').count(),1);
  await page.locator('#digital-request-topic').selectOption('safety');
  await page.locator('#digital-request-form button').click();
  await page.locator('.digital-ticket [data-status="opened"]').waitFor();
  await selectProfile('helper');
  await open('/directions/support/digital','[data-action="digital-claim"]');
  await page.locator('[data-action="digital-claim"]').first().click();
  await page.locator('[data-action="digital-resolve"]').first().click();
  await open('/account#digital-history','#digital-history [data-status="resolved"]');

  await selectProfile('pensioner');
  await open('/directions/support/digital','#digital-volunteer-search');
  await page.locator('#digital-volunteer-search select[name="format"]').selectOption('local');
  await page.locator('#digital-volunteer-search button').click();
  assert.equal(await page.locator('.digital-volunteer-list article').count(),1);
  await page.locator('[data-action="digital-select-volunteer"][data-id="preview-volunteer"]').click();
  assert.match(await page.locator('.help-selected-window').textContent(),/15:00–18:00.*Шымкент/);
  await page.locator('#digital-request-form button').click();
  assert.match(await page.locator('.digital-ticket').first().textContent(),/15:00–18:00/);
  await selectProfile('helper');
  await open('/directions/support/digital','.digital-desk');
  assert.equal(await page.locator('[data-action="digital-claim"]').count(),0);
  await selectProfile('volunteer');
  await open('/directions/support/digital','[data-action="digital-claim"]');
  await page.locator('[data-action="digital-claim"]').click();
  await page.locator('[data-action="digital-resolve"]').click();
  await open('/account#digital-history','#digital-history');
  assert.match(await page.locator('#digital-history').textContent(),/15:00–18:00.*Шымкент/);

  await selectProfile('teacher');
  await open('/directions/support/education','#education-publish');
  await page.locator('#education-publish select[name="format"]').selectOption('local');
  assert.equal(await page.locator('#education-publish select[name="location"]').isVisible(),true);
  await page.locator('#education-publish input[name="from"]').fill('13:00');
  const until=page.locator('#education-publish input[name="until"]');
  await until.fill('12:00');
  await page.locator('#education-publish button[type="submit"]').click();
  await page.locator('#education-publish .help-window-error').waitFor();
  assert.equal(await until.inputValue(),'12:00');
  assert.equal(await page.locator('#education-publish select[name="format"]').inputValue(),'local');
  await until.fill('15:00');
  await page.locator('#education-publish button[type="submit"]').click();
  await page.locator('[data-action="edu-unpublish"]').waitFor();
  await page.locator('[data-action="edu-mode"][data-id="learner"]').click();
  await page.locator('[data-action="edu-interest"]').first().click();
  await open('/account#education-history','.edu-history');

  await selectProfile('learner');
  await open('/directions/support/education','#education-search');
  await page.locator('[data-action="edu-mode"][data-id="teacher"]').click();
  await page.locator('#education-search select[name="source"]').selectOption('student');
  await page.locator('#education-search button[type="submit"]').click();
  const student=page.locator('.edu-offer').filter({has:page.locator('[data-id="mentor-aru"]')});
  assert.match(await student.textContent(),/16:00–19:00/);
  await student.locator('[data-action="edu-interest"]').click();
  await open('/account#education-history','#education-history');
  assert.match(await page.locator('#education-history').textContent(),/16:00–19:00/);

  await selectProfile('psychologist');
  await page.locator('.profile-anchors a[href$="#clinician"]').click();
  const openWindow=page.locator('[data-action="psych-workspace-toggle"]:enabled').first();
  const windowId=await openWindow.getAttribute('data-id');
  await openWindow.click();
  assert.equal(await openWindow.getAttribute('aria-pressed'),'true');
  await openWindow.click();
  assert.equal(await openWindow.getAttribute('aria-pressed'),'false');
  await open('/directions/support/psychology','.psych-clinician');
  await page.locator('[data-action="psych-book"]').first().click();
  await page.locator('#psych-booking[open]').waitFor();
  const meeting=page.locator('#psych-booking .psych-meeting');
  assert.equal(await meeting.isVisible(),false);
  await page.locator('#consult-form input[value="offline"] + span').click();
  await meeting.waitFor();
  assert.match(await meeting.textContent(),/Шымкент/);
  const selector='#consult-form input[name="slot"][value="'+windowId+'"] + span';
  await page.locator(selector).click();
  await page.locator('#consult-form button[type="submit"]').click();
  await page.locator('#psych-booking .success').waitFor();
  assert.equal(await page.locator('#consult-form input[name="slot"][value="'+windowId+'"]').isDisabled(),true);
  await page.locator('[data-action="psych-close"]').click();
  await page.locator('#psych-booking').waitFor({state:'detached'});

  await open('/account#support-account','#support-account .request-card');
  await selectProfile('volunteer');
  await open('/account#support-account','#support-account');
  assert.equal(await page.locator('#support-account .request-card').count(),0);
  await page.evaluate(path=>{
    history.pushState({},'',path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  },previewHref('/directions/accessibility/admin'));
  await page.locator('.access-workspace').waitFor();
  assert.equal(await page.locator('.admin-controls').count(),0);
  await open('/directions/accessibility/map','[data-action="access-save"]');
  await page.locator('[data-action="access-save"]').click();
  await open('/account#accessibility','#accessibility .request-card');
  for(const [path,fields] of Object.entries({
    obstacle:{description:'Демо сызба'},
    delivery:{city:'Шымкент',address:'Демо 1',phone:'000',medicine:'Үлгі',date:'2099-01-01',time:'12:00'},
    discount:{city:'Шымкент'},
    volunteer:{}
  })){
    await open('/directions/accessibility/'+path,'#access-form');
    for(const [name,value] of Object.entries(fields)) await page.locator('#access-form [name="'+name+'"]').fill(value);
    if(path==='volunteer'){
      await page.locator('#access-form select[name="format"]').selectOption('local');
      await page.locator('#access-form select[name="location"]').waitFor();
    }
    await page.locator('#access-form button[type="submit"]').click();
    await page.locator('.access-request-panel .success').waitFor();
  }
  await open('/account#accessibility','#accessibility .request-card');
  assert.ok((await page.locator('#accessibility .request-card').count())>=5);

  await open('/directions/city','[data-action="cleanup-join"]');
  await page.locator('[data-action="cleanup-join"]').first().click();
  await page.locator('#city-activity-dialog [data-action="cleanup-confirm"]').click();
  await page.locator('[data-action="cleanup-leave"]').first().waitFor();
  await open('/account','[aria-labelledby="next-booking"] a');
  const cityEntry=page.locator('#active-requests').locator('xpath=..').locator('a[href="'+previewHref('/account#profile-cleanup')+'"]');
  assert.equal(await cityEntry.locator('strong').textContent(),'1');
  await cityEntry.click();
  await page.locator('#profile-cleanup [data-action="cleanup-leave"]').waitFor();

  await open('/directions/donation','#donor-assessment');
  await page.locator('#donor-assessment [name="age"]').fill('30');
  await page.locator('#donor-assessment [name="weight"]').fill('65');
  await page.locator('#donor-assessment [name="unwell"][value="no"]').check();
  await page.locator('#donor-assessment button[type="submit"]').click();
  for(const field of ['illness','antibiotics','tattoo','vaccination','pregnancy'])
    await page.locator('#donor-assessment [name="'+field+'"][value="no"]').check();
  await page.locator('#donor-assessment button[type="submit"]').click();
  await page.locator('#donor-assessment button[type="submit"]').click();
  await page.locator('[data-center="demo-abai"] [data-action="donor-center-select"]').click();
  await page.locator('[data-action="donor-visit-time"]:enabled').first().click();
  await page.locator('[data-action="donor-visit-review"]').click();
  await page.locator('[data-action="donor-visit-book"]').click();
  await page.locator('.donor-ticket-qr').waitFor();
  await open('/account#donation','#donation .request-card');

  await open('/','.home-chat-launcher');
  await page.clock.install();
  await page.locator('.home-chat-launcher').click();
  await page.locator('[data-action="home-ai-prompt"][data-id="0"]').click();
  await page.locator('#home-chat-panel a[href="'+previewHref('/directions/donation#donor-booking')+'"]').waitFor();
  assert.equal(await page.locator('.home-chat-prompts').count(),0);
  const input=page.locator('#home-chat-input');
  await input.fill('Хочу записаться к психологу');
  await input.press('Enter');
  await page.locator('#home-chat-panel a[href="'+previewHref('/directions/support/psychology#psych-clinicians')+'"]').waitFor();
  await input.fill('Маршрут до ближайшего парка');
  await input.press('Enter');
  await page.locator('[data-action="home-ai-locate"]').click();
  await page.locator('.home-chat-panel a[href*="/directions/accessibility/map?markers=1"]').waitFor();
  await page.locator('[data-action="home-ai-route-example"]').click();
  await page.locator('.home-chat-panel a[href*="/directions/accessibility/map?start="]').waitFor();
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = success => queueMicrotask(() => success({coords:{latitude:42.326,longitude:69.586}}));
  });
  await page.locator('[data-action="home-ai-locate"]').click();
  const routeLink=page.locator('.home-chat-panel a[href*="/directions/accessibility/map?start="]');
  await routeLink.waitFor({timeout:10000});
  const routeUrl=new URL(await routeLink.getAttribute('href'),base);
  assert.equal(routeUrl.searchParams.get('auto'),'1');
  assert.equal(routeUrl.searchParams.get('end'),'69.58573,42.32541');
  assert.equal(await page.locator('.home-chat-turn').count(),3);
  await page.clock.fastForward('04:00:01');
  assert.equal(await page.locator('.home-chat-turn').count(),0);

  await selectProfile('volunteer');
  const reset=page.locator('[data-action="demo-reset-open"]');
  const resetDialog=page.locator('#demo-reset-dialog[open]');
  await page.evaluate(()=>{
    localStorage.setItem('another-project.local','keep');
    sessionStorage.setItem('another-project.session','keep');
    sessionStorage.setItem('janashyr.route.v1:demo-smoke','temporary');
  });
  await reset.click();
  await resetDialog.waitFor();
  await page.keyboard.press('Escape');
  await resetDialog.waitFor({state:'detached'});
  await reset.evaluate(button=>{
    if(button!==document.activeElement)throw new Error('Reset did not restore focus');
  });
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('janashyr.route.v1:demo-smoke')),'temporary');
  await reset.click();
  await resetDialog.locator('[data-action="demo-reset-confirm"]').click();
  await page.locator('#demo-reset-success').waitFor();
  for(const role of ['volunteer','psychologist','teacher','learner','pensioner','helper'])
    await page.locator('.profile-pick[data-id="preview-'+role+'"]').waitFor();
  assert.deepEqual(await page.evaluate(()=>[Object.keys(localStorage).sort(),Object.keys(sessionStorage).sort()]),
    [['another-project.local'],['another-project.session']]);

  assert.deepEqual(errors,[],'Browser runtime errors');
  console.log('Desktop smoke passed: navigation, languages, six demo roles, profile creation and reload, student search and tutoring, volunteer availability and targeted requests, psychologist schedule and booking, accessible routes and all four forms, cleanup, donor history, chat replies, geolocation and expiry.');
} finally {
  await browser.close();
}
