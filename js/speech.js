// De stem van het spel. Faye kan nog niet lezen, dus alles wordt gezegd.
// say() krijgt een lijstje onderdelen:
//   'tekst'                       -> iPad-stem (nl-NL)
//   { clip: 'm', or: [...] }      -> papa's opname, of anders 'or' (terugval)
//   { pause: 300 }                -> even stil
// Een nieuwe say() onderbreekt de vorige.
import * as clips from './clips.js';
import * as store from './store.js';

const synth = window.speechSynthesis || null;
let voices = [];
let token = 0;
const keep = new Set(); // Safari ruimt uitingen soms te vroeg op

function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices().filter((v) => /^nl/i.test(v.lang));
}
if (synth) {
  loadVoices();
  synth.addEventListener?.('voiceschanged', loadVoices);
}

export const dutchVoices = () => { loadVoices(); return voices; };

function voice() {
  const want = store.get().settings.voice;
  return voices.find((v) => v.name === want)
    || voices.find((v) => v.lang === 'nl-NL' && !/compact/i.test(v.voiceURI))
    || voices.find((v) => v.lang === 'nl-NL')
    || voices[0] || null;
}

// Moet binnen de eerste tik gebeuren (iOS).
export function warm() {
  if (!synth) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  } catch {}
}

export function stop() {
  token++;
  try { synth?.cancel(); } catch {}
  clips.stop();
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function tts(text) {
  return new Promise((res) => {
    if (!synth || !text.trim()) { res(); return; }
    const u = new SpeechSynthesisUtterance(text.replaceAll('{naam}', store.spokenName()));
    u.lang = 'nl-NL';
    const v = voice();
    if (v) u.voice = v;
    u.rate = store.get().settings.rate || 0.9;
    u.pitch = 1.1;
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      keep.delete(u);
      res();
    };
    u.onend = fin;
    u.onerror = fin;
    // Vangnet: op iOS komt 'onend' soms niet.
    const t = setTimeout(fin, 1500 + text.length * 110);
    keep.add(u);
    synth.speak(u);
  });
}

async function run(parts, my) {
  for (const p of parts) {
    if (my !== token) return false;
    if (typeof p === 'string') await tts(p);
    else if (p.pause) await wait(p.pause);
    else if (p.clip !== undefined) {
      if (clips.has(p.clip)) { await clips.play(p.clip); await wait(120); }
      else if (p.or) { const ok = await run(p.or, my); if (!ok) return false; }
    }
  }
  return my === token;
}

// Geeft true terug als alles is uitgesproken (en niet onderbroken).
export function say(parts) {
  stop();
  const my = ++token;
  return run(Array.isArray(parts) ? parts : [parts], my);
}
