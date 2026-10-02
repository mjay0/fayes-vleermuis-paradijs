// Kleine UI-hulpjes en de schermwisselaar.
import { sfx } from './audio.js';
import * as speech from './speech.js';

const app = document.getElementById('app');
const screens = {};
let cleanup = null;

export function register(name, fn) { screens[name] = fn; }

// Wissel van scherm. Een scherm geeft { el, leave? } terug.
export function go(name, args = {}) {
  if (cleanup) { try { cleanup(); } catch {} }
  cleanup = null;
  speech.stop();
  const res = screens[name](args);
  cleanup = res.leave || null;
  res.el.classList.add('screen', `screen-${name}`);
  app.replaceChildren(res.el);
  window.scrollTo(0, 0);
}

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// Koppel een tik-handler (werkt snel op touch, zonder dubbeltik-zoom).
export function tap(el, fn, { sound = true } = {}) {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    if (sound) sfx.tap();
    fn(e);
  });
}

// Voor de letterkaarten en toetsen: reageert al bij het aanraken.
export function press(el, fn) {
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    fn(e);
  });
}

export function confetti(container, n = 60) {
  const colors = ['#ff7ad9', '#b58cff', '#6ff0c8', '#ffd65c', '#7fd1ff', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = i % 3 === 0 ? 'confetti star' : 'confetti';
    c.style.left = `${Math.random() * 100}%`;
    c.style.background = colors[i % colors.length];
    c.style.animationDelay = `${Math.random() * 0.8}s`;
    c.style.animationDuration = `${2.2 + Math.random() * 2}s`;
    c.style.setProperty('--drift', `${(Math.random() - 0.5) * 200}px`);
    container.appendChild(c);
    setTimeout(() => c.remove(), 5500);
  }
}

export function floatText(container, text, cls = '') {
  const f = h(`<div class="float ${cls}">${text}</div>`);
  container.appendChild(f);
  setTimeout(() => f.remove(), 1300);
}

// Ouder-check: een som die te moeilijk is voor groep 2.
export function parentCheck() {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  const answer = prompt(`Ouder-check: hoeveel is ${a} × ${b}?`);
  if (answer === null) return false;
  if (Number(answer.trim()) !== a * b) { alert('Helaas, dat is niet goed.'); return false; }
  return true;
}

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Voortgang van een ronde als maantjes.
export const moons = (done, total) =>
  Array.from({ length: total }, (_, i) => `<i class="${i < done ? 'on' : ''}">${i < done ? '🌕' : '🌑'}</i>`).join('');

export const PRAISE = ['Goed zo!', 'Super!', 'Knap hoor!', 'Wauw!', 'Toppie!', 'Helemaal goed!', 'Goed zo, {naam}!', 'Jij kan het!'];
