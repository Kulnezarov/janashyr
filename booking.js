import {escapeText,getProfiles,profileName,profileRoleName} from './profiles.js';

const copy = {
  kk:{choose:'Жазылу үшін бейінді таңдаңыз',switchRole:'Бұл әрекетке сай бейінді таңдаңыз',close:'Бас тарту',invalid:'Бейінді таңдау мүмкін болмады. Тізімнен басқа бейінді таңдаңыз.'},
  ru:{choose:'Выберите профиль, чтобы записаться',switchRole:'Выберите профиль с подходящей ролью',close:'Отмена',invalid:'Не удалось выбрать профиль. Выберите другой профиль из списка.'}
};

export function bookingProfileMatches(profile, role) {
  return Boolean(profile?.id && (!role || profile.role === role));
}

export function renderBookingProfile(request, profile, lang) {
  if (!request) return '';
  const text = copy[lang];
  return `<dialog id="booking-profile-dialog" class="panel booking-profile-dialog" aria-labelledby="booking-profile-title">
    <h2 id="booking-profile-title">${request.purpose==='save'?(lang==='kk'?'Сақтау үшін бейінді таңдаңыз':'Выберите профиль, чтобы сохранить данные'):profile?text.switchRole:text.choose}</h2>
    ${request.invalid ? `<p class="demo-notice" role="alert">${text.invalid}</p>` : ''}
    <div class="profile-picks">${getProfiles().filter(item=>bookingProfileMatches(item,request.role)).map(item=>
      `<button class="profile-pick" type="button" data-action="booking-profile-select" data-id="${escapeText(item.id)}"><strong>${escapeText(profileName(item,lang))}</strong>${item.alias?`<span>${profileRoleName(item,lang)}</span>`:''}</button>`
    ).join('')}</div>
    <button class="button secondary" type="button" data-action="booking-profile-close">${text.close}</button>
  </dialog>`;
}
