// Klanken inspreken (voor papa). Eén keer per letter: tik op opnemen, zeg
// de klank, en tik op stop (of wacht 3 seconden). De stilte gaat er vanzelf af.
import { h, tap, go } from '../ui.js';
import { sfx } from '../audio.js';
import * as clips from '../clips.js';
import { LETTERS } from '../modules/letters.js';

export function recordScreen() {
  let active = null; // { l, rec }

  const row = (x) => `<div class="rec-row ${clips.has(x.l) ? 'done' : ''}" data-l="${x.l}">
      <span class="rec-letter">${x.l}</span>
      <span class="rec-word">${x.e} ${x.w}</span>
      <button class="btn rec" aria-label="Opnemen">⏺️</button>
      <button class="btn play" aria-label="Afspelen" ${clips.has(x.l) ? '' : 'disabled'}>▶️</button>
      <button class="btn del" aria-label="Wissen" ${clips.has(x.l) ? '' : 'disabled'}>🗑️</button>
    </div>`;

  const el = h(`<div>
    <header class="bar">
      <button class="icon-btn back" aria-label="Terug">←</button>
      <h2>🎙️ Klanken inspreken</h2>
      <span class="spacer"></span>
    </header>
    <div class="record-page">
      <p class="small">Zeg alleen de <b>klank</b>, kort en duidelijk, zoals op school: "mmm", "sss", "a" (van appel), "k" (zonder "uh" erachter).
      Tik op ⏺️, zeg de klank en tik op ⏹️. Je hoort hem meteen terug. Niet goed? Gewoon opnieuw opnemen.</p>
      ${clips.canRecord() ? '' : '<p class="warn">Opnemen werkt niet in deze browser. Gebruik Safari op de iPad.</p>'}
      <div class="rec-list">${LETTERS.map(row).join('')}</div>
    </div>
  </div>`);

  tap(el.querySelector('.back'), () => go('settings'));

  function refresh(l) {
    const old = el.querySelector(`.rec-row[data-l="${l}"]`);
    const nw = h(row(LETTERS.find((x) => x.l === l)));
    old.replaceWith(nw);
    bind(nw);
    return nw;
  }

  function bind(r) {
    const l = r.dataset.l;
    tap(r.querySelector('.rec'), async () => {
      if (active && active.l === l) { // stoppen
        const b = r.querySelector('.rec');
        b.textContent = '⏳';
        await active.rec.stop();
        return;
      }
      if (active) return; // eerst de andere opname afmaken
      try {
        const rec = await clips.startRecording(3000);
        active = { l, rec };
        r.classList.add('recording');
        r.querySelector('.rec').textContent = '⏹️';
        const wav = await rec.done;
        active = null;
        if (!wav) { alert('Ik hoorde niks. Probeer het nog eens, iets dichter bij de iPad.'); refresh(l); return; }
        await clips.save(l, wav);
        const nr = refresh(l);
        nr.classList.add('saved');
        clips.play(l);
      } catch (e) {
        active = null;
        refresh(l);
        alert('Opnemen lukt niet. Geef de app toestemming voor de microfoon (Instellingen → Safari → Microfoon).');
      }
    }, { sound: false });
    tap(r.querySelector('.play'), () => clips.play(l), { sound: false });
    tap(r.querySelector('.del'), async () => {
      if (!confirm(`De opname van "${l}" wissen?`)) return;
      await clips.remove(l);
      sfx.pop();
      refresh(l);
    });
  }

  el.querySelectorAll('.rec-row').forEach(bind);

  return {
    el,
    leave() { if (active) active.rec.stop(); },
  };
}
