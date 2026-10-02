// Spelvormen 'Kies de letter' (3 tot 6 grote kaarten) en 'Letter-toetsen'
// (het hele alfabet). Faye hoort een klank en tikt de letter aan.
// Fouten zijn nooit straf: een lieve hint, en na twee keer licht de goede op.
import { h, tap, press, go, floatText, pick, moons, wait } from '../ui.js';
import { PRAISE } from '../lines.js';
import { sfx } from '../audio.js';
import * as speech from '../speech.js';
import { batSVG } from '../art.js';
import { buddyBat, starsFor } from '../rewards.js';
import { makePicker, record } from '../engine.js';
import { moduleById } from '../modules/index.js';
import { runIntros } from './intro.js';
import * as store from '../store.js';

export const ROUND = 5;

export function playScreen({ mode = 'kies', module: mid = 'letters' }) {
  const mod = moduleById(mid);
  const next = makePicker(() => mod.items());
  const keyboard = mode === 'toetsen';
  let n = 0;
  let q = null;
  let tries = 0;
  let busy = true;
  let earned = 0;
  let streak = 0;
  let alive = true;

  const el = h(`<div class="${keyboard ? 'kb-mode' : 'pick-mode'}">
    <header class="bar">
      <button class="icon-btn back" aria-label="Terug">←</button>
      <div class="round-moons">${moons(0, ROUND)}</div>
      <div class="pill stars">⭐ <b>${store.get().stars}</b></div>
    </header>
    <div class="play">
      <div class="ask">
        <div class="bat-wrap fly">${batSVG(buddyBat())}</div>
        <button class="listen-btn" aria-label="Luister">🔊</button>
        <div class="picture hidden"></div>
      </div>
      <div class="answers"></div>
    </div>
  </div>`);

  const answers = el.querySelector('.answers');
  const picture = el.querySelector('.picture');
  const batWrap = el.querySelector('.bat-wrap');
  const starsEl = el.querySelector('.stars b');

  tap(el.querySelector('.back'), () => go('home'));
  tap(el.querySelector('.listen-btn'), () => { if (q) speech.say(mod.ask(q, { first: false })); }, { sound: false });

  function cards() {
    if (keyboard) {
      return mod.keyboard().map((t) =>
        `<button class="key ${mod.isActive(t) ? '' : 'faded'}" data-t="${t}">${t}</button>`).join('');
    }
    return mod.options(q, mod.choiceCount(6)).map((t, i) =>
      `<button class="letter-card c${i % 6}" data-t="${t}">${t}</button>`).join('');
  }

  // Makkelijk: plaatje met het woord eronder. Moeilijk: geen woord, en als
  // de klank te horen is ook geen plaatje. Na een fout komt alles in beeld.
  function showPicture(on, word = true) {
    picture.innerHTML = `<span>${q.picture}</span><b>${q.word}</b>`;
    picture.classList.toggle('hidden', !on);
    picture.classList.toggle('no-word', !word);
  }
  const showHint = () => showPicture(true, true);
  const showStart = () => (store.isHard() ? showPicture(!q.recorded, false) : showPicture(true, true));

  function ask() {
    q = next();
    tries = 0;
    busy = false;
    // Zonder opname vraagt de stem 'vooraan bij maan': dan hoort het plaatje erbij.
    showStart();
    if (!keyboard || !answers.children.length) {
      answers.innerHTML = cards();
      answers.querySelectorAll('[data-t]').forEach((b) => press(b, () => choose(b)));
    } else {
      answers.querySelectorAll('[data-t]').forEach((b) => b.classList.remove('nope', 'right', 'glow'));
    }
    answers.classList.remove('enter'); void answers.offsetWidth; answers.classList.add('enter');
    speech.say(mod.ask(q));
  }

  async function choose(b) {
    if (busy || !q) return;
    const t = b.dataset.t;
    if (b.classList.contains('nope')) { sfx.wrong(); return; }
    if (t === q.answer) {
      busy = true;
      const first = tries === 0;
      record(q.key, first);
      if (!first) next.retry(q.key);
      const st = starsFor(first);
      earned += st;
      store.addStars(st);
      store.save();
      streak = first ? streak + 1 : 0;
      b.classList.add('right');
      sfx.correct(streak);
      setTimeout(() => sfx.star(), 250);
      floatText(b, `+${st} ⭐`, 'gold');
      starsEl.textContent = store.get().stars;
      batWrap.classList.remove('happy'); void batWrap.offsetWidth; batWrap.classList.add('happy');
      n++;
      el.querySelector('.round-moons').innerHTML = moons(n, ROUND);
      await Promise.all([speech.say(pick(PRAISE)), wait(1100)]);
      if (!alive) return;
      if (n >= ROUND) finish();
      else ask();
      return;
    }
    tries++;
    streak = 0;
    b.classList.add('nope');
    sfx.wrong();
    showHint();
    if (tries >= 2) answers.querySelector(`[data-t="${q.answer}"]`)?.classList.add('glow');
    speech.say(mod.hint(q, t, tries));
  }

  function finish() {
    const newLetter = mod.checkUnlock ? mod.checkUnlock() : null;
    const big = store.addRound();
    go('party', { earned, newLetter, big, again: { screen: 'play', args: { mode, module: mid } } });
  }

  // Ook met een echt toetsenbord (iPad-toetsenbord of laptop).
  const onKey = (e) => {
    const b = answers.querySelector(`[data-t="${CSS.escape(e.key.toLowerCase())}"]`);
    if (b) choose(b);
  };
  window.addEventListener('keydown', onKey);

  (async () => {
    await wait(300);
    await runIntros(el, mod);
    if (alive) ask();
  })();

  return {
    el,
    leave() { alive = false; window.removeEventListener('keydown', onKey); store.save(); },
  };
}
