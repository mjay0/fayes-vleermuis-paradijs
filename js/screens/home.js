// Startscherm (de eerste tik zet geluid en stem aan) en het thuisscherm.
import { h, tap, go, pick, moons, parentCheck } from '../ui.js';
import { sfx, unlock } from '../audio.js';
import * as speech from '../speech.js';
import { unicornSVG, batSVG } from '../art.js';
import { buddyUni, buddyBat, anyAffordable } from '../rewards.js';
import { MODULES, MODES } from '../modules/index.js';
import * as store from '../store.js';

let greeted = false;

export function startScreen() {
  const s = store.get();
  const el = h(`<div class="start">
    <div class="start-stage">
      <div class="uni-wrap bounce">${unicornSVG(buddyUni(), { sparkle: true })}</div>
      <div class="bat-wrap fly">${batSVG(buddyBat())}</div>
    </div>
    <h1 class="logo">${s.settings.name ? `${s.settings.name}s` : 'Het'} <span>Vleermuis Paradijs</span></h1>
    <button class="btn primary huge">✨ Start!</button>
  </div>`);
  tap(el.querySelector('button'), () => {
    unlock();
    speech.warm();
    sfx.magic();
    go('home');
  }, { sound: false });
  return { el };
}

export function homeScreen() {
  const s = store.get();
  const uni = buddyUni();
  const bat = buddyBat();
  const done = Math.min(store.roundsToday(), store.GOAL_ROUNDS);
  const streak = store.currentStreak();
  const hello = [
    'Hoi {naam}! Zullen we letters zoeken?',
    `Hoi {naam}! ${bat.name} wil vleermuizen vangen!`,
    `${uni.name} heeft zin in letters!`,
    'Hoi {naam}! Wat gaan we doen?',
  ];
  const line = pick(hello);

  const modeButtons = MODULES.map((m) => m.modes.map((id) => {
    const md = MODES[id];
    return `<button class="mode mode-${id}" data-mode="${id}" data-mod="${m.id}">
      <span class="mode-icon">${md.emoji}</span><span class="mode-name">${md.name}</span></button>`;
  }).join('')).join('');

  const el = h(`<div>
    <header class="bar">
      <div class="pill stars">⭐ <b>${s.stars}</b></div>
      <div class="pill goal" aria-label="Vandaag ${done} van ${store.GOAL_ROUNDS} rondes">${moons(done, store.GOAL_ROUNDS)}</div>
      ${streak > 1 ? `<div class="pill">🔥 ${streak}</div>` : ''}
      <span class="grow"></span>
      <button class="icon-btn settings" aria-label="Instellingen (voor papa)">⚙️</button>
    </header>
    <div class="home">
      <div class="home-stage">
        <div class="uni-wrap tapme">${unicornSVG(uni)}</div>
        <div class="bat-wrap tapme fly"><div class="bubble pop">${line.replaceAll('{naam}', s.settings.name)}</div>${batSVG(bat)}</div>
      </div>
      <div class="modes">${modeButtons}
        <button class="mode mode-paradise ${anyAffordable() ? 'glow' : ''}">
          <span class="mode-icon">🏰</span><span class="mode-name">Mijn paradijs</span></button>
      </div>
    </div>
  </div>`);

  el.querySelectorAll('[data-mode]').forEach((b) => tap(b, () => {
    go(MODES[b.dataset.mode].screen, { mode: b.dataset.mode, module: b.dataset.mod });
  }));
  tap(el.querySelector('.mode-paradise'), () => go('paradise'));
  tap(el.querySelector('.settings'), () => { if (parentCheck()) go('settings'); });
  tap(el.querySelector('.bat-wrap'), () => { sfx.squeak(); speech.say(line); }, { sound: false });
  tap(el.querySelector('.uni-wrap'), () => {
    const u = el.querySelector('.uni-wrap');
    u.classList.remove('trick'); void u.offsetWidth; u.classList.add('trick');
    sfx.magic();
  }, { sound: false });

  if (!greeted) {
    greeted = true;
    setTimeout(() => speech.say(line), 400);
  }
  return { el };
}
