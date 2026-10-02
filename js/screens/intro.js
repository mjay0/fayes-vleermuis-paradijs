// 'Nieuwe letter!': een korte uitleg voordat een nieuwe letter meedoet.
// Wordt als laag over het speelscherm gelegd.
import { h, tap, confetti } from '../ui.js';
import { sfx } from '../audio.js';
import * as speech from '../speech.js';
import { batSVG } from '../art.js';
import { buddyBat } from '../rewards.js';
import { info } from '../modules/letters.js';
import * as store from '../store.js';

function showIntro(screen, mod, l) {
  return new Promise((resolve) => {
    const x = info(l);
    const ov = h(`<div class="overlay intro">
      <div class="intro-card">
        <div class="tag">Nieuwe letter!</div>
        <div class="intro-row">
          <div class="letter-card big">${l}</div>
          <div class="intro-pic"><span>${x.e}</span><b>${x.w}</b></div>
        </div>
        <div class="bat-wrap mini fly">${batSVG(buddyBat())}</div>
        <div class="actions">
          <button class="btn listen">🔊 Nog een keer</button>
          <button class="btn primary next">Verder ➜</button>
        </div>
      </div>
    </div>`);
    screen.appendChild(ov);
    sfx.fanfare();
    confetti(ov, 50);
    const sayIt = () => speech.say(mod.intro(l));
    setTimeout(sayIt, 700);
    tap(ov.querySelector('.listen'), sayIt);
    tap(ov.querySelector('.next'), () => {
      speech.stop();
      mod.markIntroduced(l);
      store.save();
      ov.remove();
      resolve();
    });
  });
}

// Laat de uitleg zien voor (maximaal 3) letters die nog nieuw zijn.
export async function runIntros(screen, mod, max = 3) {
  if (!mod.nextIntro) return;
  for (let i = 0; i < max; i++) {
    const l = mod.nextIntro();
    if (!l) return;
    await showIntro(screen, mod, l);
  }
  // Meer dan 3 nieuw (bijv. door papa aangezet): de rest zonder uitleg.
  let l;
  while ((l = mod.nextIntro())) mod.markIntroduced(l);
  store.save();
}
