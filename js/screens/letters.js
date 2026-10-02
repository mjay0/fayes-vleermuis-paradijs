// Letters kiezen (voor papa): welke letters doen mee, en hoe goed gaat elke
// letter (box 0-5, bij 5 is hij goud). Nieuwe letters komen ook vanzelf erbij
// als alle letters die meedoen goed gaan.
import { h, tap, go } from '../ui.js';
import * as clips from '../clips.js';
import letters, { LETTERS } from '../modules/letters.js';
import { MAX_BOX } from '../engine.js';
import * as store from '../store.js';

export function lettersScreen() {
  const s = store.get();
  const tile = (x) => {
    const on = s.letters.includes(x.l);
    const box = letters.box(x.l);
    return `<button class="lt-tile ${on ? 'on' : ''} ${box >= MAX_BOX ? 'gold' : ''}" data-l="${x.l}">
      <span class="lt-letter">${x.l}</span>
      <span class="lt-box">${'★'.repeat(box)}${'☆'.repeat(MAX_BOX - box)}</span>
      <span class="lt-state">${on ? 'doet mee' : s.lettersOff.includes(x.l) ? 'uit' : 'komt nog'}${clips.hasOwn(x.l) ? ' · 🎙️' : ''}</span>
    </button>`;
  };
  const el = h(`<div>
    <header class="bar">
      <button class="icon-btn back" aria-label="Terug">←</button>
      <h2>🔤 Letters</h2>
      <span class="spacer"></span>
    </header>
    <div class="letters-page">
      <p class="small">Tik op een letter om hem aan of uit te zetten. ★ = hoe goed hij gaat (5 is goud).
      Gaan alle letters goed (3 ★ of meer), dan komt de volgende letter er vanzelf bij, in deze volgorde.
      Een letter die je zelf uitzet, komt niet vanzelf terug. 🎙️ = klank ingesproken.</p>
      <div class="lt-grid">${LETTERS.map(tile).join('')}</div>
    </div>
  </div>`);

  tap(el.querySelector('.back'), () => go('settings'));
  el.querySelectorAll('.lt-tile').forEach((t) => tap(t, () => {
    const l = t.dataset.l;
    if (s.letters.includes(l)) {
      if (s.letters.length <= 3) { alert('Er moeten minstens 3 letters meedoen.'); return; }
      s.letters = s.letters.filter((x) => x !== l);
      if (!s.lettersOff.includes(l)) s.lettersOff.push(l);
    } else {
      s.letters.push(l);
      s.lettersOff = s.lettersOff.filter((x) => x !== l);
    }
    store.save();
    go('letters');
  }));
  return { el };
}
