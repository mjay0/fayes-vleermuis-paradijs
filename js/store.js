// Alle voortgang staat lokaal op het apparaat (localStorage).
// Testmodus (voor ouders) gebruikt een apart profiel waarin alles open is,
// zodat Faye's echte voortgang niet verandert.
// Let op: Henry's Feestje (Lewis) staat op hetzelfde domein; alle sleutels
// beginnen daarom met 'fayes-paradijs'.
const MODE_KEY = 'fayes-paradijs-mode';
const testMode = (() => { try { return localStorage.getItem(MODE_KEY) === 'test'; } catch { return false; } })();
const KEY = testMode ? 'fayes-paradijs-test' : 'fayes-paradijs';
const VERSION = 1;

export const isTest = () => testMode;

export function setTestMode(on) {
  try {
    if (on) localStorage.setItem(MODE_KEY, 'test');
    else localStorage.removeItem(MODE_KEY);
  } catch {}
  location.reload();
}

export const START_LETTERS = ['m', 's', 'a'];

const fresh = () => ({
  version: VERSION,
  created: Date.now(),
  stars: 0,              // te besteden in de winkel
  starsTotal: 0,         // totaal ooit verdiend
  mastery: {},           // sleutel -> { box, seen, ok }
  letters: [...START_LETTERS], // letters die meedoen
  lettersOff: [],        // letters die papa bewust uit heeft gezet
  introduced: [],        // letters die al een 'nieuwe letter'-uitleg hebben gehad
  owned: ['pip', 'roosje'],
  buddyBat: 'pip',
  buddyUni: 'roosje',
  rounds: 0,
  days: {},              // 'JJJJ-MM-DD' -> aantal rondes
  streak: { last: null, count: 0 },
  goalDays: 0,
  settings: { sound: true, music: true, voice: '', rate: 0.9, name: 'Faye', spokenName: 'Fee' },
});

const freshTest = () => ({
  ...fresh(),
  stars: 999,
  starsTotal: 999,
  owned: ['*'], // alles
});

const initial = () => (testMode ? freshTest() : fresh());

let state = initial();

function migrate(s) {
  const base = fresh();
  // v3: 'Faye' klinkt als 'Fee'; de opgenomen stem is daarmee gemaakt.
  if (s.settings && s.settings.spokenName === 'Faye') s.settings.spokenName = 'Fee';
  return {
    ...base,
    ...s,
    settings: { ...base.settings, ...(s.settings || {}) },
    streak: { ...base.streak, ...(s.streak || {}) },
    version: VERSION,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? migrate(JSON.parse(raw)) : initial();
  } catch {
    state = initial();
  }
  try { navigator.storage?.persist?.(); } catch {}
  return state;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export function reset() {
  const settings = state.settings; // stem en naam blijven bewaard
  state = initial();
  state.settings = { ...state.settings, ...settings };
  save();
}

export const get = () => state;

export function today(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const GOAL_ROUNDS = 3;

export const roundsToday = () => state.days[today()] || 0;

export function addStars(n) {
  state.stars += n;
  state.starsTotal += n;
}

// Telt een ronde; geeft true terug op het moment dat het dagdoel gehaald wordt.
export function addRound() {
  const t = today();
  const before = state.days[t] || 0;
  state.days[t] = before + 1;
  state.rounds++;
  if (before < GOAL_ROUNDS && state.days[t] >= GOAL_ROUNDS) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    state.streak.count = state.streak.last === today(y) ? state.streak.count + 1 : 1;
    state.streak.last = t;
    state.goalDays++;
    save();
    return true;
  }
  save();
  return false;
}

// Een reeks telt nog zolang het doel gisteren of vandaag gehaald is.
export function currentStreak() {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return state.streak.last === today() || state.streak.last === today(y) ? state.streak.count : 0;
}

// Zo spreekt de stem haar naam uit (papa kan dit aanpassen).
export const spokenName = () => state.settings.spokenName || state.settings.name || '';
