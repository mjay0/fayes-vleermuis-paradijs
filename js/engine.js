// Oefen-motor: houdt per letter (of later: per woord, per opdracht) bij hoe
// goed die zit, en kiest vaker wat nog niet goed gaat.
// Voor kleuters telt snelheid niet: in één keer goed is genoeg.
import * as store from './store.js';

export const MAX_BOX = 5;          // box 5 = goud
const WEIGHT = [10, 8, 5, 3, 2, 1]; // kans om gekozen te worden per box

export function mastery(key) {
  return store.get().mastery[key] || { box: 0, seen: 0, ok: 0 };
}

// firstTry: meteen goed (box +1). Anders was er hulp nodig (box -1).
export function record(key, firstTry) {
  const e = { ...mastery(key) };
  e.seen++;
  if (firstTry) {
    e.ok++;
    e.box = Math.min(MAX_BOX, e.box + 1);
  } else {
    e.box = Math.max(0, e.box - 1);
  }
  store.get().mastery[key] = e;
  return e;
}

// items: [{ key, make() }] -> functie die steeds een nieuwe opdracht geeft.
// Met next.retry(key) komt een opdracht die fout ging twee beurten later terug.
export function makePicker(getItems) {
  const recent = [];
  const retries = [];
  function next() {
    const items = getItems();
    const due = retries.findIndex((r) => --r.wait <= 0);
    let pick = null;
    if (due >= 0) {
      const [r] = retries.splice(due, 1);
      pick = items.find((it) => it.key === r.key) || null;
    }
    if (!pick) {
      let pool = items.filter((it) => !recent.includes(it.key));
      if (!pool.length) pool = items;
      const weights = pool.map((it) => WEIGHT[mastery(it.key).box]);
      let r = Math.random() * weights.reduce((a, b) => a + b, 0);
      pick = pool[pool.length - 1];
      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) { pick = pool[i]; break; }
      }
    }
    recent.push(pick.key);
    if (recent.length > Math.min(2, items.length - 1)) recent.shift();
    return pick.make();
  }
  next.retry = (key) => { if (!retries.some((r) => r.key === key)) retries.push({ key, wait: 2 }); };
  return next;
}

// Gemiddelde box (0..MAX_BOX) over een lijst sleutels.
export function avgBox(keys) {
  if (!keys.length) return 0;
  return keys.reduce((s, k) => s + mastery(k).box, 0) / keys.length;
}

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
