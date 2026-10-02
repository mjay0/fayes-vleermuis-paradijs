// Alle geluidjes en het feestmuziekje worden live gemaakt met Web Audio:
// geen geluidsbestanden nodig. De ingesproken klanken (clips.js) gaan ook
// door deze master-uitgang.
let ctx = null;
let master = null;   // alles (klanken + effecten)
let fx = null;       // effecten en muziek (kan uit)
let noiseBuf = null;
let enabled = true;
let musicOn = true;

export function unlock() {
  try {
    // iOS: speel ook als de stil-schakelaar aan staat (Safari 16.4+).
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {}
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    fx = ctx.createGain();
    fx.gain.value = enabled ? 0.8 : 0;
    fx.connect(master);
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Eén stil buffertje tijdens de tik, zodat iOS de uitgang echt opent.
    const s = ctx.createBufferSource();
    s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    s.connect(ctx.destination);
    s.start();
  }
  resume();
}

export function resume() {
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

export const getAudio = () => ({ ctx, master });

export function setEnabled(on) {
  enabled = on;
  if (fx) fx.gain.setTargetAtTime(on ? 0.8 : 0, ctx.currentTime, 0.02);
}

export function setMusicEnabled(on) { musicOn = on; if (!on) stopTune(); }

const now = () => (ctx ? ctx.currentTime : 0);
export const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

function tone({ freq, type = 'sine', at = 0, dur = 0.15, vol = 0.3, slideTo, attack = 0.005, out }) {
  if (!ctx) return;
  const t = now() + Math.max(0, at);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(out || fx);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise({ at = 0, dur = 0.1, vol = 0.3, type = 'highpass', freq = 6000, q = 1, sweepTo, out }) {
  if (!ctx) return;
  const t = now() + Math.max(0, at);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.02, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(out || fx);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
}

// Klokje: grondtoon + boventoon, klinkt als een speeldoos.
function bell(m, at = 0, dur = 0.6, vol = 0.14, out) {
  tone({ freq: midi(m), type: 'sine', at, dur, vol, out });
  tone({ freq: midi(m) * 2.01, type: 'sine', at, dur: dur * 0.5, vol: vol * 0.35, out });
  tone({ freq: midi(m) * 3, type: 'triangle', at, dur: dur * 0.2, vol: vol * 0.15, out });
}

export const sfx = {
  tap() { tone({ freq: 1100, type: 'triangle', dur: 0.05, vol: 0.1 }); },
  key() { tone({ freq: 700 + Math.random() * 80, type: 'triangle', dur: 0.06, vol: 0.14 }); },
  // Goed: een tovertrapje omhoog, steeds een beetje hoger bij een reeks.
  correct(streak = 0) {
    const b = 76 + Math.min(streak, 5) * 2;
    [0, 4, 7, 12].forEach((s, i) => bell(b + s, i * 0.07, 0.5, 0.13));
    noise({ at: 0.2, dur: 0.5, vol: 0.05, type: 'highpass', freq: 7000 });
  },
  // Fout: zacht en lief, nooit 'straf'.
  wrong() {
    tone({ freq: 420, slideTo: 300, type: 'sine', dur: 0.25, vol: 0.18 });
    tone({ freq: 360, slideTo: 260, type: 'sine', at: 0.14, dur: 0.3, vol: 0.14 });
  },
  star() {
    bell(96, 0, 0.3, 0.08);
    bell(100, 0.06, 0.4, 0.08);
  },
  fanfare() {
    [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => bell(m, i * 0.12, i === 6 ? 1.2 : 0.4, 0.13));
    noise({ at: 0.7, dur: 0.8, vol: 0.08, type: 'highpass', freq: 6000 });
  },
  // Vleermuis: hoge piepjes.
  squeak() {
    const n = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) {
      const f = 1800 + Math.random() * 700;
      tone({ freq: f, slideTo: f * 1.4, type: 'sine', at: i * 0.09, dur: 0.06, vol: 0.12 });
    }
  },
  giggle() {
    [0, 1, 2, 3].forEach((i) => tone({ freq: 1500 - i * 120, slideTo: 1700 - i * 120, type: 'triangle', at: i * 0.08, dur: 0.06, vol: 0.1 }));
  },
  flap() {
    noise({ dur: 0.12, vol: 0.12, type: 'bandpass', freq: 900, q: 1.5, sweepTo: 400 });
    noise({ at: 0.14, dur: 0.12, vol: 0.1, type: 'bandpass', freq: 900, q: 1.5, sweepTo: 400 });
  },
  // Unicorn: een harp-glissando met glitter.
  magic() {
    [72, 74, 76, 79, 81, 84, 86, 88].forEach((m, i) => bell(m, i * 0.04, 0.5, 0.08));
    noise({ at: 0.1, dur: 0.7, vol: 0.06, type: 'highpass', freq: 8000 });
  },
  whoosh() { noise({ dur: 0.4, vol: 0.16, type: 'bandpass', freq: 400, sweepTo: 3000, q: 1.2 }); },
  pop() { tone({ freq: 400, slideTo: 900, type: 'sine', dur: 0.08, vol: 0.12 }); },
  buy() {
    [84, 88, 91, 96].forEach((m, i) => bell(m, i * 0.06, 0.4, 0.1));
  },
};

// ---------- Feestmuziekje (eigen compositie, speeldoos + zachte beat) ----------
const TUNE = [
  // [noot, lengte in achtsten]
  [72, 2], [76, 2], [79, 2], [76, 2], [77, 2], [81, 2], [79, 4],
  [76, 2], [79, 2], [84, 2], [83, 2], [81, 2], [79, 2], [77, 4],
  [74, 2], [77, 2], [81, 2], [77, 2], [76, 2], [79, 2], [84, 4],
  [83, 2], [81, 2], [79, 2], [74, 2], [76, 4], [72, 4],
];
const BASS = [48, 53, 55, 48, 50, 53, 55, 48];
let tuneStop = null;

export function playTune({ loops = 2 } = {}) {
  stopTune();
  if (!ctx || !musicOn || !enabled) return;
  const out = ctx.createGain();
  out.gain.value = 0.9;
  out.connect(fx);
  const eighth = 0.19;
  const start = 0.15;
  let t = start;
  for (let l = 0; l < loops; l++) {
    TUNE.forEach(([m, len]) => { bell(m, t, len * eighth * 1.8, 0.12, out); t += len * eighth; });
  }
  const total = t - start;
  const bars = Math.round(total / (8 * eighth));
  for (let b = 0; b < bars; b++) {
    const bt = start + b * 8 * eighth;
    const root = BASS[b % BASS.length];
    tone({ freq: midi(root), type: 'triangle', at: bt, dur: 0.5, vol: 0.18, out });
    tone({ freq: midi(root + 7), type: 'triangle', at: bt + 4 * eighth, dur: 0.4, vol: 0.12, out });
    for (let k = 0; k < 4; k++) {
      tone({ freq: 90, slideTo: 45, at: bt + k * 2 * eighth, dur: 0.18, vol: 0.25, out });
      noise({ at: bt + k * 2 * eighth + eighth, dur: 0.06, vol: 0.05, freq: 8000, out });
    }
  }
  const end = now() + start + total + 1;
  tuneStop = () => {
    out.gain.cancelScheduledValues(now());
    out.gain.setTargetAtTime(0, now(), 0.15);
    setTimeout(() => out.disconnect(), 800);
  };
  return end;
}

export function stopTune() {
  if (tuneStop) { tuneStop(); tuneStop = null; }
}
