export const supportIconPath = '<path d="M12 11.2s-3.2-1.9-3.2-4a1.9 1.9 0 0 1 3.2-1.4 1.9 1.9 0 0 1 3.2 1.4c0 2.1-3.2 4-3.2 4Z"/><path d="M3.5 13.5 7 15l3.5 3h4l5-3.1c1.2-.7 2.2.7 1.2 1.7l-4.4 4H9L3.5 18Z"/><path d="M7 15h5c1.5 0 1.5 2 0 2H9.8"/>';

const copy = {
  kk: {
    map: 'Көмек картасы',
    open: 'Картаны ашу',
    volunteers: 'Волонтерлер қатарына қосылыңыз',
    volunteerText: 'Қалаңыздағы қоғамдық топтарды қарап, өзіңізге жақын бастамаға қосылыңыз.',
    join: 'Волонтер болу',
    links: 'Қызметтер',
    platform: 'Платформа',
    email: 'Электрондық пошта мен әлеуметтік желілер кейін жарияланады.'
  },
  ru: {
    map: 'Карта помощи',
    open: 'Открыть карту',
    volunteers: 'Присоединяйтесь к волонтёрам',
    volunteerText: 'Посмотрите городские группы и выберите инициативу, к которой хотите присоединиться.',
    join: 'Стать волонтёром',
    links: 'Услуги',
    platform: 'Платформа',
    email: 'Электронная почта и социальные сети будут опубликованы позже.'
  }
};

const mapPlaces = [
  {key:'blood', labels:['Қан тапсыру','Сдача крови'], names:['Қалалық қан орталығы','Городской центр крови'], addresses:['Нұрсәт шағын ауданы, 442','мкр. Нурсат, 442'], lat:42.35706, lon:69.62704, source:'https://bloodcenter.shymzdrav.kz/biography/'},
  {key:'pharmacy', labels:['Дәріхана','Аптека'], names:['Europharma дәріханасы','Аптека Europharma'], addresses:['Тәуке хан даңғылы, 13','пр. Тауке хана, 13'], lat:42.319354, lon:69.595837, source:'https://yandex.kz/maps/ru/org/europharma/174799923189/?lang=ru'},
  {key:'mental', labels:['Психологиялық қолдау','Психологическая поддержка'], names:['Психикалық денсаулық орталығы','Центр психического здоровья'], addresses:['Парник көшесі, 35','ул. Парниковая, 35'], lat:42.354145, lon:69.621635, source:'https://shym-cpz.kz/ru/kontakty/'}
];
const arrow = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let mapKey='blood', origin=null, locating=false, locationError=false;

function mapDistance(place) {
  const radians = Math.PI / 180;
  const dLat = (place.lat - origin.latitude) * radians;
  const dLon = (place.lon - origin.longitude) * radians;
  const h = Math.sin(dLat / 2)**2 + Math.cos(origin.latitude*radians)*Math.cos(place.lat*radians)*Math.sin(dLon / 2)**2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function homeMapAction(action,id,render) {
  if(action==='map-place' && mapPlaces.some(p=>p.key===id)){
    mapKey=id;render();return true;
  }
  if(action!=='map-location')return false;
  if(locating)return true;
  locating=true;locationError=false;render();
  const finish = () => {
    locating=false;
    if(document.getElementById('help-map'))render();
  };
  const fail = () => { locationError=true;finish(); };
  if(!navigator.geolocation){fail();return true}
  navigator.geolocation.getCurrentPosition(({coords})=>{
    origin=coords;
    mapKey=[...mapPlaces].sort((a,b)=>mapDistance(a)-mapDistance(b))[0].key;
    finish();
  },fail,{timeout:8000,maximumAge:120000});
  return true;
}

export function homeCommunity(lang) {
  const c = copy[lang];
  const kk=lang==='kk', i=kk?0:1;
  const point=mapPlaces.find(p=>p.key===mapKey);
  const {lat,lon}=point;
  const bbox=[lon-.019, lat-.012, lon+.019, lat+.012].map(x=>x.toFixed(6)).join('%2C');
  const sorted=origin?[...mapPlaces].sort((a,b)=>mapDistance(a)-mapDistance(b)):mapPlaces;
  const distance=origin?new Intl.NumberFormat(kk?'kk-KZ':'ru-RU',{maximumFractionDigits:1}).format(mapDistance(point))+' км':'';
  return `<div class="wrap home-community">
    <section id="help-map" class="home-map" aria-labelledby="help-map-title">
      <div class="home-map-copy">
        <h2 id="help-map-title">${c.map}</h2>
        <p>${kk?'Шымкенттегі қан орталығын, дәріхананы немесе психологиялық көмек көрсететін мекемені картадан қараңыз.':'Посмотрите на карте центр крови, аптеку и учреждение психологической поддержки в Шымкенте.'}</p>
        <div class="home-map-options" role="group" aria-label="${c.map}">${sorted.map(p=>`<button type="button" data-action="map-place" data-id="${p.key}" aria-pressed="${p===point}"><span class="map-dot map-dot-${p.key}" aria-hidden="true"></span>${p.labels[i]}</button>`).join('')}</div>
        <div class="home-map-actions">
          <a class="button primary" href="https://www.openstreetmap.org/?mlat=${lat}&amp;mlon=${lon}#map=16/${lat}/${lon}" target="_blank" rel="noopener noreferrer">${c.open} ${arrow}</a>
          <button class="text-button" type="button" data-action="map-location" aria-disabled="${locating}">${kk?'Маған ең жақыны':'Ближайшее ко мне'}</button>
        </div>
        <p class="home-map-status" role="status">${locating?(kk?'Орналасқан жеріңіз анықталуда…':'Определяем местоположение…'):locationError?(kk?'Орналасқан жерді анықтау мүмкін болмады.':'Не удалось определить местоположение.'):origin?(kk?'Көрсетілген мекемелер арақашықтық бойынша реттелді.':'Места из этой подборки отсортированы по расстоянию по прямой.'):(kk?'Картада Шымкенттегі үш мекеме көрсетілген.':'На карте показана подборка из трёх мест в Шымкенте.')}</p>
      </div>
      <div class="home-map-frame">
        <iframe title="${c.map} — OpenStreetMap" tabindex="-1" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&amp;layer=mapnik&amp;marker=${lat}%2C${lon}"></iframe>
        <div class="home-map-location" aria-live="polite">
          <strong>${point.names[i]}</strong><span>${point.addresses[i]}${distance?' · '+distance:''}</span>
          <a href="${point.source}" target="_blank" rel="noopener noreferrer">${kk?'Мекеме туралы':'Об организации'} ↗</a>
        </div>
        <a class="map-credit" href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>
      </div>
    </section>
    <section id="volunteers" class="home-volunteers" aria-labelledby="volunteers-title">
      <div class="home-volunteer-copy">
        <h2 id="volunteers-title">${c.volunteers}</h2>
        <p>${c.volunteerText}</p>
        <div class="home-volunteer-actions"><a class="button primary" href="/volunteers" data-link>${c.join} ${arrow}</a></div>
      </div>
    </section>
  </div>`;
}

export function siteFooter(t, lang) {
  const c = copy[lang];
  return `<footer class="site-footer" id="contacts"><div class="wrap footer-grid">
    <div><a class="brand footer-brand" href="/" data-link><img src="/assets/care-logo.png" width="38" height="38" alt="">JANASHYR</a><p class="footer-description">${t.footer}</p></div>
    <div><h3>${c.links}</h3><ul>${t.lanes.map(lane => `<li><a href="/directions/${lane.slug}" data-link>${lane.title}</a></li>`).join('')}</ul></div>
    <div><h3>${c.platform}</h3><ul>
      <li><a href="/about" data-link>${t.about}</a></li>
      <li><a href="/organizations" data-link>${t.organizations}</a></li>
      <li><a href="/volunteers" data-link>${c.join}</a></li>
    </ul></div>
    <div class="footer-contacts"><h3>${t.contacts}</h3><p>${c.email}</p></div>
  </div><div class="wrap footer-bottom">© JANASHYR <span>${t.demo}</span></div></footer>`;
}
