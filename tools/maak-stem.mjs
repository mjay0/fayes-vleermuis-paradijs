// Maakt de MP3's voor alle zinnen uit js/lines.js met MAI-Voice-2.1
// (via OpenRouter) en schrijft stem/index.json. Alleen nieuwe of
// veranderde zinnen worden gemaakt; zinnen die niet meer bestaan, worden
// opgeruimd.
//
// Gebruik:  node tools/maak-stem.mjs
// De API-sleutel staat in ~/.openrouter-key (buiten de repo!).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { allLines } = await import('../js/lines.js');
const { KLANK_TTS } = await import('../js/modules/letters.js');

const MODEL = 'microsoft/mai-voice-2.1';
const VOICE = 'nl-NL-Harper:MAI-Voice-2.1';
const NAAM = 'Fee'; // zo staat {naam} in de bestanden (zo klinkt 'Faye' goed)
const dir = join(root, 'stem');
mkdirSync(dir, { recursive: true });

const key = readFileSync(join(homedir(), '.openrouter-key'), 'utf8').trim();
const lines = allLines();

const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\{naam\}/g, 'naam').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
const fileFor = (t) => `${slug(t)}-${createHash('sha1').update(`${VOICE}|${NAAM}|${t}`).digest('hex').slice(0, 8)}.mp3`;

async function make(text, file, raw = false) {
  const input = raw ? text : text.replaceAll('{naam}', NAAM);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, input, voice: VOICE, response_format: 'mp3' }),
    });
    if (res.ok) {
      writeFileSync(join(dir, file), Buffer.from(await res.arrayBuffer()));
      return;
    }
    const msg = (await res.text()).slice(0, 200);
    if (attempt === 3 || (res.status < 500 && res.status !== 429)) throw new Error(`${res.status} ${msg}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const index = { model: MODEL, voice: VOICE, naam: NAAM, lines: {}, klanken: {} };
const todo = [];
for (const t of lines) {
  const f = fileFor(t);
  index.lines[t] = f;
  if (!existsSync(join(dir, f))) todo.push([t, f]);
}
// Klanken: letter -> [bestand variant 1, variant 2].
for (const [l, inputs] of Object.entries(KLANK_TTS)) {
  index.klanken[l] = inputs.map((t, i) => {
    const f = `klank-${l}-${i + 1}-${createHash('sha1').update(`${VOICE}|klank|${t}`).digest('hex').slice(0, 8)}.mp3`;
    if (!existsSync(join(dir, f))) todo.push([t, f, true, l]);
    return f;
  });
}
console.log(`${lines.length} zinnen, ${todo.length} nieuw te maken (${todo.reduce((n, [t]) => n + t.length, 0)} tekens)`);

let done = 0;
const failed = [];
const workers = Array.from({ length: 4 }, async () => {
  while (todo.length) {
    const [t, f, raw, l] = todo.shift();
    try {
      await make(t, f, raw);
      done++;
      if (done % 20 === 0) console.log(`  ${done} klaar…`);
    } catch (e) {
      failed.push(t);
      if (l) index.klanken[l] = index.klanken[l].filter((x) => x !== f); else delete index.lines[t];
      console.log(`  MISLUKT: "${t}": ${e.message}`);
    }
  }
});
await Promise.all(workers);

// Opruimen: bestanden die bij geen zin meer horen.
const keep = new Set([...Object.values(index.lines), ...Object.values(index.klanken).flat()]);
for (const f of readdirSync(dir)) if (f.endsWith('.mp3') && !keep.has(f)) unlinkSync(join(dir, f));

writeFileSync(join(dir, 'index.json'), `${JSON.stringify(index, null, 1)}\n`);
console.log(`Klaar: ${done} gemaakt, ${failed.length} mislukt. stem/index.json bijgewerkt.`);
if (failed.length) process.exitCode = 1;
