// Module 'Letters': Faye hoort een klank en zoekt de letter.
// Elke module levert dezelfde vorm, zodat er later makkelijk andere
// oefeningen bij kunnen (beginklank, woordjes maken, lezen…):
//   items()           -> [{ key, make() }] voor de oefen-motor
//   ask(q)            -> wat de stem zegt bij een nieuwe opdracht
//   hint(q, wrong)    -> wat de stem zegt na een fout antwoord
//   options(q, n)     -> n antwoorden om uit te kiezen (incl. het goede)
//   keyboard()        -> alle tokens voor het toetsenbord
import * as store from '../store.js';
import { mastery, avgBox, MAX_BOX, shuffle } from '../engine.js';
import * as clips from '../clips.js';

// Volgorde van aanbieden: eerst letters die goed van elkaar verschillen,
// lastige paren (b/d, m/n, v/f, s/z) ver uit elkaar. q, x en y doen niet mee.
// Het woord begint met de klank van de letter (korte klank waar dat kan).
export const LETTERS = [
  { l: 'm', w: 'maan', e: '🌙' },
  { l: 's', w: 'sok', e: '🧦' },
  { l: 'a', w: 'appel', e: '🍎' },
  { l: 'i', w: 'inktvis', e: '🦑' },
  { l: 'o', w: 'otter', e: '🦦' },
  { l: 'r', w: 'raket', e: '🚀' },
  { l: 'v', w: 'vis', e: '🐟' },
  { l: 'k', w: 'kat', e: '🐱' },
  { l: 'p', w: 'pinguïn', e: '🐧' },
  { l: 'e', w: 'emmer', e: '🪣' },
  { l: 'n', w: 'neus', e: '👃' },
  { l: 't', w: 'taart', e: '🎂' },
  { l: 'l', w: 'lamp', e: '💡' },
  { l: 'h', w: 'hond', e: '🐶' },
  { l: 'j', w: 'jas', e: '🧥' },
  { l: 'z', w: 'zon', e: '☀️' },
  { l: 'b', w: 'banaan', e: '🍌' },
  { l: 'g', w: 'geit', e: '🐐' },
  { l: 'w', w: 'wolk', e: '☁️' },
  { l: 'u', w: 'ufo', e: '🛸' },
  { l: 'f', w: 'fiets', e: '🚲' },
  { l: 'd', w: 'dino', e: '🦕' },
  { l: 'c', w: 'cactus', e: '🌵' },
];
export const ORDER = LETTERS.map((x) => x.l);

// Wat de opgenomen stem (Harper) leest om de klank te maken, als papa hem
// niet zelf heeft ingesproken. Twee varianten per letter; papa kiest op het
// opnamescherm de beste (of zet hem uit). Zijn eigen opname gaat altijd voor.
export const KLANK_TTS = {
  m: ['mmm', 'mmmmm'], s: ['sss', 'ssssss'], a: ['a', 'ah'], i: ['i', 'ih'], o: ['o', 'oh'],
  r: ['rrr', 'rrrrr'], v: ['vvv', 'vvvvv'], k: ['k', 'kh'], p: ['p', 'ph'], e: ['e', 'eh'],
  n: ['nnn', 'nnnnn'], t: ['t', 'th'], l: ['lll', 'lllll'], h: ['h', 'hhh'], j: ['j', 'jjj'],
  z: ['zzz', 'zzzzz'], b: ['b', 'bh'], g: ['ggg', 'gh'], w: ['w', 'www'], u: ['u', 'uh'],
  f: ['fff', 'fffff'], d: ['d', 'dh'], c: ['k', 'kh'],
};
export const info = (l) => LETTERS.find((x) => x.l === l);
export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

// Letters die op elkaar lijken (vorm of klank): goede afleiders als het al goed gaat.
const NEAR = {
  b: ['d', 'p'], d: ['b', 'p'], p: ['b', 'd'], m: ['n', 'w'], n: ['m', 'u', 'h'], u: ['n', 'v'],
  v: ['f', 'w'], f: ['v', 't'], w: ['v', 'm'], s: ['z'], z: ['s'], e: ['i', 'a'], i: ['e', 'l', 'j'],
  a: ['o', 'e'], o: ['a', 'u'], k: ['h', 'g'], h: ['k', 'n'], t: ['f', 'l'], l: ['i', 't'],
  g: ['k', 'j'], j: ['i', 'g'], r: ['n'], c: ['k', 's'],
};

const keyOf = (l) => `l:${l}`;
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const askWord = (w) => `Welke letter hoor je vooraan bij… ${w}?`;
const findWord = (w) => `Zoek de letter van ${w}.`;
const ofWord = (w) => `van ${w}.`;
const introWord = (w) => `${cap(w)} begint met deze letter. ${cap(w)}!`;
const active = () => store.get().letters.filter((l) => ORDER.includes(l));

function question(l) {
  const x = info(l);
  return { key: keyOf(l), answer: l, letter: l, word: x.w, picture: x.e, recorded: clips.has(l) };
}

export default {
  id: 'letters',
  name: 'Letters',
  modes: ['kies', 'toetsen', 'vangen'],

  items() { return active().map((l) => ({ key: keyOf(l), make: () => question(l) })); },

  // Met opname: 'Welke letter hoor je? mmm'. Zonder: 'vooraan bij maan'.
  // Hele zinnen waar het kan: die klinken met de opgenomen stem het mooist.
  ask(q, { first = true } = {}) {
    if (clips.has(q.letter)) return [first ? 'Welke letter hoor je?' : 'Luister nog eens.', { clip: q.letter }];
    return [askWord(q.word)];
  },

  // Na een fout: zeg welke klank ze aantikte (als die is ingesproken),
  // en dan nog een keer de goede.
  hint(q, wrong, tries) {
    const parts = [];
    if (wrong && clips.has(wrong)) parts.push('Dat is de', { clip: wrong }, { pause: 200 });
    else parts.push(tries > 1 ? 'Nog een keer.' : 'Bijna!');
    if (clips.has(q.letter)) parts.push('Zoek de', { clip: q.letter });
    else parts.push(findWord(q.word));
    if (tries > 1) parts.push('Kijk, hij licht op!');
    return parts;
  },

  // Uitleg bij een nieuwe letter.
  intro(l) {
    const x = info(l);
    if (clips.has(l)) return ['Dit is een nieuwe letter!', { pause: 200 }, { clip: l }, ofWord(x.w), { clip: l }];
    return ['Dit is een nieuwe letter!', { pause: 200 }, introWord(x.w)];
  },

  // Alles wat deze module kan zeggen (voor het maken van de stem-bestanden).
  lines() {
    return [
      'Welke letter hoor je?', 'Luister nog eens.', 'Dat is de', 'Nog een keer.', 'Bijna!', 'Zoek de',
      'Kijk, hij licht op!', 'Dit is een nieuwe letter!',
      ...LETTERS.flatMap((x) => [askWord(x.w), findWord(x.w), ofWord(x.w), introWord(x.w)]),
    ];
  },

  // Hoeveel keuzes: begint met 3 en groeit mee als het goed gaat.
  choiceCount(max = 6) {
    const a = avgBox(active().map(keyOf));
    const n = 3 + (a >= 1.5) + (a >= 2.5) + (a >= 3.5);
    return Math.max(2, Math.min(n, max, active().length));
  },

  options(q, n) {
    const others = active().filter((l) => l !== q.answer);
    const strong = mastery(q.key).box >= 3;
    const near = strong ? shuffle((NEAR[q.answer] || []).filter((l) => others.includes(l))).slice(0, 1) : [];
    const rest = shuffle(others.filter((l) => !near.includes(l)));
    return shuffle([q.answer, ...near, ...rest].slice(0, n));
  },

  keyboard() { return ALPHABET; },
  isActive(l) { return active().includes(l); },

  // Volgende letter die nog geen uitleg heeft gehad.
  nextIntro() {
    const s = store.get();
    return active().find((l) => !s.introduced.includes(l)) || null;
  },
  markIntroduced(l) {
    const s = store.get();
    if (!s.introduced.includes(l)) s.introduced.push(l);
  },

  // Na een ronde: als alle letters goed gaan, komt er een nieuwe bij.
  checkUnlock() {
    const s = store.get();
    const act = active();
    const ready = act.every((l) => mastery(keyOf(l)).box >= 3);
    if (!ready) return null;
    const next = ORDER.find((l) => !act.includes(l) && !s.lettersOff.includes(l));
    if (!next) return null;
    s.letters.push(next);
    return next;
  },

  isGold(l) { return mastery(keyOf(l)).box >= MAX_BOX; },
  box(l) { return mastery(keyOf(l)).box; },
};
