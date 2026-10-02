// Instellingen (voor papa, achter de ouder-check): klanken inspreken,
// letters kiezen, stem en naam, geluid, testmodus, alles wissen.
import { h, tap, go } from '../ui.js';
import { setEnabled, setMusicEnabled } from '../audio.js';
import * as speech from '../speech.js';
import * as clips from '../clips.js';
import { ORDER } from '../modules/letters.js';
import * as store from '../store.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function settingsScreen() {
  const s = store.get();
  const voices = speech.dutchVoices();
  const rec = clips.count(ORDER);
  const el = h(`<div>
    <header class="bar">
      <button class="icon-btn back" aria-label="Terug">←</button>
      <h2>⚙️ Instellingen</h2>
      <span class="spacer"></span>
    </header>
    <div class="settings-page">
      <button class="btn primary record">🎙️ Klanken inspreken <small>${rec} van ${ORDER.length} ingesproken</small></button>
      <button class="btn letters">🔤 Letters kiezen en voortgang <small>${s.letters.length} letters doen mee</small></button>

      <section class="group">
        <h3>🗣️ Stem</h3>
        ${voices.length
          ? `<label>Stem <select class="voice">
              <option value="">Automatisch</option>
              ${voices.map((v) => `<option value="${esc(speech.voiceId(v))}" ${[speech.voiceId(v), v.name].includes(s.settings.voice) ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('')}
            </select></label>
            <p class="small">De iPad geeft ${voices.length} Nederlandse ${voices.length === 1 ? 'stem' : 'stemmen'} door. Gedownloade 'Verbeterd'- of 'Premium'-stemmen laat Safari vaak niet zien.</p>`
          : '<p class="small">Geen Nederlandse stem gevonden. Op de iPad: Instellingen → Toegankelijkheid → Gesproken materiaal → Stemmen → Nederlands.</p>'}
        <label>Tempo <select class="rate">
          ${[[0.75, 'Langzaam'], [0.9, 'Normaal'], [1, 'Vlot']].map(([r, n]) => `<option value="${r}" ${Number(s.settings.rate) === r ? 'selected' : ''}>${n}</option>`).join('')}
        </select></label>
        <label>Naam in beeld <input class="name" value="${esc(s.settings.name)}" maxlength="20"></label>
        <label>Zo zegt de stem haar naam <input class="spoken" value="${esc(s.settings.spokenName)}" maxlength="30"></label>
        <button class="btn test-voice">▶️ Test de stem</button>
        <p class="small">Klinkt de naam raar? Schrijf hem zoals je hem uitspreekt, bijvoorbeeld "Fee" of "Fej".</p>
      </section>

      <section class="group">
        <h3>🔊 Geluid</h3>
        <button class="btn sound">${s.settings.sound ? '🔊 Geluidjes staan aan' : '🔇 Geluidjes staan uit'}</button>
        <button class="btn music">${s.settings.music ? '🎵 Feestmuziek staat aan' : '🎵 Feestmuziek staat uit'}</button>
        <p class="small">De stem en de klanken blijven altijd aan.</p>
      </section>

      <section class="group">
        <h3>👨‍👧 Voor ouders</h3>
        ${store.isTest()
          ? `<button class="btn primary test-off">↩️ Terug naar het spel van ${esc(s.settings.name || 'Faye')}</button>
             <button class="btn danger wipe">🗑️ Testprofiel opnieuw beginnen</button>
             <p class="small">🧪 Je zit in de testmodus: alles is open. Wat je hier doet telt niet mee. De ingesproken klanken zijn wel dezelfde.</p>`
          : `<button class="btn test-on">🧪 Testmodus (alles open, telt niet mee)</button>
             <button class="btn danger wipe">🗑️ Alle voortgang wissen</button>`}
        <p class="small">Tip: zet het spel op het beginscherm (Safari → Deel → Zet op beginscherm). Dan werkt het ook zonder internet. Alle voortgang en opnames blijven op deze iPad.</p>
      </section>
    </div>
  </div>`);

  tap(el.querySelector('.back'), () => go('home'));
  tap(el.querySelector('.record'), () => go('record'));
  tap(el.querySelector('.letters'), () => go('letters'));

  const voice = el.querySelector('.voice');
  if (voice) voice.addEventListener('change', () => { s.settings.voice = voice.value; store.save(); speech.say('Hoi {naam}!'); });
  const rate = el.querySelector('.rate');
  rate.addEventListener('change', () => { s.settings.rate = Number(rate.value); store.save(); speech.say('Hoi {naam}!'); });
  const name = el.querySelector('.name');
  name.addEventListener('change', () => { s.settings.name = name.value.trim(); store.save(); });
  const spoken = el.querySelector('.spoken');
  spoken.addEventListener('change', () => { s.settings.spokenName = spoken.value.trim(); store.save(); });
  tap(el.querySelector('.test-voice'), () => {
    s.settings.spokenName = spoken.value.trim();
    speech.say(['Hoi {naam}!', 'Welke letter hoor je?', { clip: 'm', or: ['Welke letter hoor je vooraan bij: maan?'] }]);
  });

  tap(el.querySelector('.sound'), () => {
    s.settings.sound = !s.settings.sound;
    setEnabled(s.settings.sound);
    store.save();
    go('settings');
  });
  tap(el.querySelector('.music'), () => {
    s.settings.music = !s.settings.music;
    setMusicEnabled(s.settings.music);
    store.save();
    go('settings');
  });
  tap(el.querySelector('.wipe'), () => {
    if (store.isTest()) {
      if (confirm('Testprofiel opnieuw beginnen? (Het echte spel blijft zoals het is.)')) { store.reset(); go('home'); }
      return;
    }
    if (confirm('Weet je het zeker? Alle sterren, letters en unicorns worden gewist. (De ingesproken klanken blijven.)')
      && confirm('Echt alles wissen?')) {
      store.reset();
      go('start');
    }
  });
  const on = el.querySelector('.test-on');
  if (on) tap(on, () => { store.save(); store.setTestMode(true); });
  const off = el.querySelector('.test-off');
  if (off) tap(off, () => store.setTestMode(false));
  // Safari geeft de stemmen soms pas na een moment: dan het scherm opnieuw tonen.
  let tries = 0;
  const poll = voices.length ? null : setInterval(() => {
    if (speech.dutchVoices().length) { clearInterval(poll); go('settings'); } else if (++tries > 10) clearInterval(poll);
  }, 300);
  return { el, leave() { if (poll) clearInterval(poll); store.save(); } };
}
