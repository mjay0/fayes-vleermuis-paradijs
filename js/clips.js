// Ingesproken klanken: papa neemt elke klank één keer op. De opname wordt
// bijgeknipt (stilte eraf), even hard gemaakt en als WAV bewaard in IndexedDB,
// lokaal op de iPad. Zowel het echte profiel als de testmodus gebruiken ze.
import { getAudio } from './audio.js';

const DB = 'fayes-paradijs-klanken';
const STORE = 'clips';
let dbp = null;
const raw = new Map();      // id -> ArrayBuffer (WAV)
const decoded = new Map();  // id -> AudioBuffer
let current = null;         // spelende bron

function db() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}

function tx(mode, fn) {
  return db().then((d) => new Promise((res, rej) => {
    const t = d.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  }));
}

// Bij het opstarten: alle opnames in het geheugen laden.
export async function init() {
  try {
    const d = await db();
    await new Promise((res) => {
      const t = d.transaction(STORE, 'readonly');
      const cur = t.objectStore(STORE).openCursor();
      cur.onsuccess = () => {
        const c = cur.result;
        if (!c) return;
        raw.set(c.key, c.value);
        c.continue();
      };
      t.oncomplete = res;
      t.onerror = res;
    });
  } catch {}
}

export const has = (id) => raw.has(id);
export const count = (ids) => ids.filter((id) => raw.has(id)).length;

export async function save(id, wav) {
  raw.set(id, wav);
  decoded.delete(id);
  await tx('readwrite', (s) => s.put(wav, id));
}

export async function remove(id) {
  raw.delete(id);
  decoded.delete(id);
  await tx('readwrite', (s) => s.delete(id));
}

async function buffer(id) {
  const { ctx } = getAudio();
  if (!ctx || !raw.has(id)) return null;
  if (!decoded.has(id)) {
    const b = await ctx.decodeAudioData(raw.get(id).slice(0));
    decoded.set(id, b);
  }
  return decoded.get(id);
}

// Speelt een klank af; de promise is klaar als hij is afgelopen.
export async function play(id) {
  let b = null;
  try { b = await buffer(id); } catch {}
  return playBuffer(b);
}

// Speelt een AudioBuffer af (ook gebruikt voor de stem-bestanden).
export function playBuffer(b) {
  const { ctx, master } = getAudio();
  if (!b || !ctx) return Promise.resolve(false);
  stop();
  return new Promise((res) => {
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(master);
    const done = () => { if (current === src) current = null; clearTimeout(t); res(true); };
    src.onended = done;
    const t = setTimeout(done, b.duration * 1000 + 400);
    current = src;
    src.start();
  });
}

export function stop() {
  if (current) { try { current.onended = null; current.stop(); } catch {} current = null; }
}

// ---------- Opnemen ----------
export const canRecord = () => !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

// Start een opname. Geeft { stop(): Promise<ArrayBuffer|null> } terug.
// Stopt vanzelf na maxMs.
export async function startRecording(maxMs = 3000) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
  });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  let resolveDone;
  const done = new Promise((r) => { resolveDone = r; });
  rec.onstop = async () => {
    stream.getTracks().forEach((t) => t.stop());
    try {
      const blob = new Blob(chunks, { type: rec.mimeType || chunks[0]?.type || 'audio/mp4' });
      resolveDone(await process(await blob.arrayBuffer()));
    } catch {
      resolveDone(null);
    }
  };
  rec.start();
  const timer = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, maxMs);
  return {
    stop() {
      clearTimeout(timer);
      if (rec.state === 'recording') rec.stop();
      return done;
    },
    done,
  };
}

// Stilte eraf knippen, zacht in- en uitfaden, op gelijke sterkte brengen.
async function process(arrayBuf) {
  const { ctx } = getAudio();
  const b = await ctx.decodeAudioData(arrayBuf);
  const sr = b.sampleRate;
  const d = new Float32Array(b.length);
  for (let c = 0; c < b.numberOfChannels; c++) {
    const ch = b.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] += ch[i] / b.numberOfChannels;
  }
  let peak = 0;
  for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  if (peak < 0.01) return null; // niks gehoord
  // Energie per blokje van 10 ms, zodat een tik of klik niet telt.
  const win = Math.round(sr * 0.01);
  const thr = peak * 0.12;
  let first = -1;
  let last = -1;
  for (let i = 0; i + win <= d.length; i += win) {
    let m = 0;
    for (let k = i; k < i + win; k++) m = Math.max(m, Math.abs(d[k]));
    if (m > thr) { if (first < 0) first = i; last = i + win; }
  }
  const start = Math.max(0, first - Math.round(sr * 0.04));
  const end = Math.min(d.length, last + Math.round(sr * 0.12));
  const out = d.slice(start, end);
  const gain = 0.9 / peak;
  const fade = Math.min(Math.round(sr * 0.015), Math.floor(out.length / 4));
  for (let i = 0; i < out.length; i++) {
    let g = gain;
    if (i < fade) g *= i / fade;
    if (i > out.length - fade) g *= (out.length - i) / fade;
    out[i] *= g;
  }
  return wav(out, sr);
}

function wav(samples, sr) {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 0x7fff, true);
  return buf;
}
