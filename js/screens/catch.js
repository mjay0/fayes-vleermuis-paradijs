// Spelvorm 'Vleermuizen vangen': vleermuizen met een letter op hun buik
// fladderen rond. Faye hoort een klank en tikt de goede vleermuis aan.
import { h, tap, go, floatText, pick, moons, wait, PRAISE } from '../ui.js';
import { sfx } from '../audio.js';
import * as speech from '../speech.js';
import { batSVG } from '../art.js';
import { BATS, starsFor } from '../rewards.js';
import { makePicker, record, shuffle } from '../engine.js';
import { moduleById } from '../modules/index.js';
import { runIntros } from './intro.js';
import { ROUND } from './play.js';
import * as store from '../store.js';

export function catchScreen({ module: mid = 'letters' }) {
  const mod = moduleById(mid);
  const next = makePicker(() => mod.items());
  let n = 0;
  let q = null;
  let tries = 0;
  let busy = true;
  let earned = 0;
  let streak = 0;
  let alive = true;
  let bats = [];
  let raf = 0;
  let last = 0;

  const el = h(`<div class="catch-mode">
    <header class="bar">
      <button class="icon-btn back" aria-label="Terug">←</button>
      <div class="round-moons">${moons(0, ROUND)}</div>
      <button class="listen-btn small" aria-label="Luister">🔊</button>
      <div class="pill stars">⭐ <b>${store.get().stars}</b></div>
    </header>
    <div class="field">
      <div class="picture hidden"></div>
      <div class="jar">🫙<b>0</b></div>
    </div>
  </div>`);

  const field = el.querySelector('.field');
  const picture = el.querySelector('.picture');
  const starsEl = el.querySelector('.stars b');
  const jar = el.querySelector('.jar');

  tap(el.querySelector('.back'), () => go('home'));
  tap(el.querySelector('.listen-btn'), () => { if (q) speech.say(mod.ask(q, { first: false })); }, { sound: false });

  function showPicture(on) {
    picture.innerHTML = `<span>${q.picture}</span><b>${q.word}</b>`;
    picture.classList.toggle('hidden', !on);
  }

  function spawn() {
    bats.forEach((b) => b.el.remove());
    const W = field.clientWidth;
    const H = field.clientHeight;
    const letters = mod.options(q, mod.choiceCount(5));
    const looks = shuffle(BATS);
    const size = Math.min(200, Math.max(130, Math.min(W, H) * 0.26));
    bats = letters.map((t, i) => {
      const b = h(`<button class="flyer" data-t="${t}" style="width:${size}px">${batSVG(looks[i % looks.length], { letter: t })}</button>`);
      field.appendChild(b);
      const fromLeft = i % 2 === 0;
      // Elke vleermuis krijgt een eigen 'baan' zodat ze elkaar niet bedekken.
      const lane = (i + 0.5) / letters.length;
      const bat = {
        t, el: b, w: size, h: size * 0.71,
        x: fromLeft ? -size * 0.4 : W - size * 0.6,
        y: lane * (H - size * 0.71),
        vx: (fromLeft ? 1 : -1) * (60 + Math.random() * 40),
        vy: (Math.random() - 0.5) * 30,
        phase: Math.random() * 6.28,
        speed: 1,
        state: 'fly',
      };
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(bat); });
      return bat;
    });
    sfx.flap();
  }

  function step(ts) {
    const dt = Math.min(0.05, (ts - (last || ts)) / 1000);
    last = ts;
    const W = field.clientWidth;
    const H = field.clientHeight;
    for (const b of bats) {
      if (b.state === 'caught') continue;
      b.phase += dt * 2.2;
      b.x += b.vx * dt * b.speed;
      b.y += (b.vy + Math.sin(b.phase) * 28) * dt * b.speed;
      if (b.state === 'flee') { b.speed = Math.max(1, b.speed - dt * 2); if (b.speed === 1) b.state = 'fly'; }
      // Binnen het veld blijven (na het binnenvliegen).
      if (b.x < 0 && b.vx < 0) b.vx = Math.abs(b.vx);
      if (b.x > W - b.w && b.vx > 0) b.vx = -Math.abs(b.vx);
      if (b.y < 0 && b.vy < 0) b.vy = Math.abs(b.vy);
      if (b.y > H - b.h && b.vy > 0) b.vy = -Math.abs(b.vy);
      b.y = Math.max(-20, Math.min(H - b.h + 20, b.y));
      b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${Math.sin(b.phase * 1.3) * 6}deg)`;
    }
    raf = requestAnimationFrame(step);
  }

  function ask() {
    q = next();
    tries = 0;
    busy = false;
    showPicture(!q.recorded);
    spawn();
    speech.say(mod.ask(q));
  }

  async function choose(bat) {
    if (busy || !q || bat.state === 'caught') return;
    if (bat.t === q.answer) {
      busy = true;
      const first = tries === 0;
      record(q.key, first);
      if (!first) next.retry(q.key);
      const st = starsFor(first);
      earned += st;
      store.addStars(st);
      store.save();
      streak = first ? streak + 1 : 0;
      bat.state = 'caught';
      bat.el.classList.add('caught');
      // Vlieg naar het potje.
      const jr = jar.getBoundingClientRect();
      const fr = field.getBoundingClientRect();
      bat.el.style.transition = 'transform 0.7s cubic-bezier(.5,-0.3,.6,1)';
      bat.el.style.transform = `translate(${jr.left - fr.left - bat.w * 0.3}px, ${jr.top - fr.top - bat.h * 0.5}px) scale(0.35)`;
      sfx.correct(streak);
      setTimeout(() => sfx.star(), 300);
      floatText(field, `+${st} ⭐`, 'gold center');
      starsEl.textContent = store.get().stars;
      bats.filter((b) => b !== bat).forEach((b) => { b.state = 'flee'; b.speed = 3; b.vx *= 1.5; });
      n++;
      el.querySelector('.round-moons').innerHTML = moons(n, ROUND);
      setTimeout(() => { jar.querySelector('b').textContent = n; jar.classList.add('bump'); setTimeout(() => jar.classList.remove('bump'), 300); }, 700);
      await Promise.all([speech.say(pick(PRAISE)), wait(1400)]);
      if (!alive) return;
      if (n >= ROUND) finish();
      else ask();
      return;
    }
    tries++;
    streak = 0;
    sfx.giggle();
    bat.el.classList.remove('nope'); void bat.el.offsetWidth; bat.el.classList.add('nope');
    bat.state = 'flee';
    bat.speed = 3;
    showPicture(true);
    if (tries >= 2) {
      const good = bats.find((b) => b.t === q.answer);
      if (good) { good.el.classList.add('glow'); good.speed = 0.4; good.state = 'slow'; }
    }
    speech.say(mod.hint(q, bat.t, tries));
  }

  function finish() {
    const newLetter = mod.checkUnlock ? mod.checkUnlock() : null;
    const big = store.addRound();
    go('party', { earned, newLetter, big, again: { screen: 'catch', args: { mode: 'vangen', module: mid } } });
  }

  (async () => {
    await wait(300);
    raf = requestAnimationFrame(step);
    await runIntros(el, mod);
    if (alive) ask();
  })();

  return {
    el,
    leave() { alive = false; cancelAnimationFrame(raf); store.save(); },
  };
}
