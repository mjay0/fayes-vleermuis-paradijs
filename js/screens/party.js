// Het feestje na een ronde: confetti, muziekje, sterren, en eventueel
// een nieuwe letter of het dagdoel.
import { h, tap, go, confetti, wait } from '../ui.js';
import { sfx, playTune, stopTune } from '../audio.js';
import * as speech from '../speech.js';
import { unicornSVG, batSVG } from '../art.js';
import { buddyUni, buddyBat, anyAffordable } from '../rewards.js';
import { info } from '../modules/letters.js';
import * as store from '../store.js';

export function partyScreen({ earned = 0, newLetter = null, big = false, again = null }) {
  store.save();
  const timers = [];
  let alive = true;
  const streak = store.currentStreak();
  const shop = anyAffordable();

  const el = h(`<div class="party ${big ? 'big' : ''}">
    <div class="party-stage">
      <div class="uni-wrap dance">${unicornSVG(buddyUni(), { mood: 'wow', sparkle: true })}</div>
      <div class="bat-wrap loop">${batSVG(buddyBat(), { mood: 'wow' })}</div>
      ${big ? `<div class="uni-wrap dance mirror">${unicornSVG(buddyUni(), { mood: 'wow', sparkle: true })}</div>` : ''}
    </div>
    <div class="party-card">
      <h1>${big ? 'Feest! 🎉' : 'Hoera! 🎉'}</h1>
      <div class="earned">+${earned} ⭐</div>
      ${big ? `<p class="goal-done">🌕🌕🌕 Dagdoel gehaald!${streak > 1 ? ` 🔥 ${streak} dagen op rij` : ''}</p>` : ''}
      ${newLetter ? `<div class="new-letter"><div class="tag">Nieuwe letter verdiend!</div>
        <div class="letter-card big">${newLetter}</div><span class="nl-pic">${info(newLetter)?.e || ''}</span></div>` : ''}
      <div class="actions">
        ${again ? '<button class="btn primary again">🔁 Nog een keer</button>' : ''}
        <button class="btn to-paradise ${shop ? 'glow' : ''}">🏰 Paradijs${shop ? ' ✨' : ''}</button>
        <button class="btn to-home" aria-label="Naar huis">🏠</button>
      </div>
    </div>
  </div>`);

  if (again) tap(el.querySelector('.again'), () => go(again.screen, again.args));
  tap(el.querySelector('.to-paradise'), () => go('paradise'));
  tap(el.querySelector('.to-home'), () => go('home'));

  sfx.fanfare();
  confetti(el, big ? 140 : 70);
  if (big) timers.push(setTimeout(() => confetti(el, 100), 2500));
  timers.push(setTimeout(() => playTune({ loops: big ? 3 : 1 }), 1300));

  (async () => {
    await wait(600);
    const parts = [big ? 'Feest! Je hebt vandaag drie rondjes gedaan!' : 'Hoera!', `Je hebt ${earned} sterren verdiend!`];
    if (newLetter) parts.push('En je hebt een nieuwe letter verdiend!');
    if (shop) parts.push('Je kunt iets nieuws kopen in je paradijs!');
    if (alive) speech.say(parts);
  })();

  return {
    el,
    leave() { alive = false; timers.forEach(clearTimeout); stopTune(); },
  };
}
