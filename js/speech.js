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

// Safari geeft de stemmen soms pas later, en 'voiceschanged' komt daar niet
// betrouwbaar (en alleen via onvoiceschanged). Daarom vragen we de lijst
// opnieuw op zolang hij nog leeg is.
function loadVoices() {
  if (!synth) return voices;
  try { voices = synth.getVoices().filter((v) => /^nl/i.test(v.lang)); } catch {}
  return voices;
}
if (synth) {
  loadVoices();
  try { synth.onvoiceschanged = loadVoices; } catch {}
  try { synth.addEventListener?.('voiceschanged', loadVoices); } catch {}
}

export const dutchVoices = () => loadVoices();

// De gekozen stem wordt bewaard op voiceURI (namen zijn in Safari niet altijd
// uniek); een eerder bewaarde naam werkt ook nog.
export const voiceId = (v) => v.voiceURI || v.name;

function voice() {
  if (!voices.length) loadVoices();
  const want = store.get().settings.voice;
  return (want && (voices.find((v) => v.voiceURI === want) || voices.find((v) => v.name === want)))
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
    // Altijd een stem meegeven, met dezelfde taal als die stem: anders
    // pakt Safari soms toch de standaardstem.
    const v = voice();
    u.lang = v ? v.lang : 'nl-NL';
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
