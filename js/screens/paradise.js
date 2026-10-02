// Mijn paradijs: alle unicorns, vleermuizen en versiering die Faye heeft,
// plus de winkel om er nieuwe bij te kopen met sterren.
import { h, tap, go, confetti } from '../ui.js';
import { sfx } from '../audio.js';
import * as speech from '../speech.js';
import { hillsSVG, treeSVG } from '../art.js';
import { UNICORNS, BATS, DECOR, ownedOf, owns, shopList, canBuy, buy, art } from '../rewards.js';
import * as store from '../store.js';

// Vaste plekjes: unicorns op het gras, vleermuizen aan de tak.
const UNI_SPOTS = [[42, 86], [62, 90], [26, 92], [80, 88], [52, 97], [90, 96]];
// (in procenten van de boom, net onder de tak)
const BAT_SPOTS = [[40, 14], [54, 13.5], [68, 13], [82, 12.5], [95, 12]];

export function paradiseScreen({ fresh = null } = {}) {
  const s = store.get();

  const scene = () => {
    const unis = ownedOf(UNICORNS).map((u, i) => {
      const [x, y] = UNI_SPOTS[i % UNI_SPOTS.length];
      return `<button class="dweller uni ${u.id === fresh ? 'arrive' : ''}" data-id="${u.id}" style="left:${x}%;top:${y}%">${art(u)}</button>`;
    }).join('');
    const bats = ownedOf(BATS).map((b, i) => {
      const [x, y] = BAT_SPOTS[i % BAT_SPOTS.length];
      return `<button class="dweller bat-hang ${b.id === fresh ? 'arrive' : ''}" data-id="${b.id}" style="left:${x}%;top:${y}%">${art(b, { hang: true, mood: 'sleep' })}</button>`;
    }).join('');
    const decor = ownedOf(DECOR).map((d) =>
      `<button class="dweller decor ${d.id === fresh ? 'arrive' : ''}" data-id="${d.id}" style="left:${d.x}%;top:${d.y}%">${art(d)}</button>`).join('');
    return `<div class="moon"></div>${hillsSVG}<div class="tree-wrap">${treeSVG}${bats}</div>${decor}${unis}`;
  };

  const shop = () => shopList().map((it) => {
    const own = owns(it.id);
    const can = canBuy(it);
    return `<button class="shop-tile ${own ? 'owned' : can ? 'can' : 'save'}" data-id="${it.id}">
      <span class="tile-art">${art(it)}</span>
      <span class="price">${own ? '✔' : `⭐ ${it.cost}`}</span></button>`;
  }).join('');

  const el = h(`<div>
    <header class="bar">
      <button class="icon-btn back" aria-label="Terug">←</button>
      <h2>🏰 Mijn paradijs</h2>
      <div class="pill stars">⭐ <b>${s.stars}</b></div>
    </header>
    <div class="paradise">${scene()}</div>
    <div class="shop">${shop()}</div>
  </div>`);

  tap(el.querySelector('.back'), () => go('home'));

  const all = [...UNICORNS, ...BATS, ...DECOR];
  const find = (id) => all.find((x) => x.id === id);

  el.querySelectorAll('.dweller').forEach((d) => tap(d, () => {
    const it = find(d.dataset.id);
    d.classList.remove('trick'); void d.offsetWidth; d.classList.add('trick');
    if (it.kind === 'uni') { sfx.magic(); speech.say(`Hoi! Ik ben ${it.name}!`); }
    else if (it.kind === 'bat') { sfx.squeak(); speech.say(`Hoi! Ik ben ${it.name}!`); }
    else { sfx.pop(); speech.say(it.name); }
  }, { sound: false }));

  el.querySelectorAll('.shop-tile').forEach((t) => tap(t, () => openItem(find(t.dataset.id))));

  function openItem(it) {
    const own = owns(it.id);
    const can = canBuy(it);
    const short = it.cost - store.get().stars;
    const ov = h(`<div class="overlay item">
      <div class="item-card">
        <div class="item-art">${art(it, { sparkle: true })}</div>
        <h1>${it.name}</h1>
        <div class="price big">${own ? 'Is al van jou! ✔' : `⭐ ${it.cost}`}</div>
        <div class="actions">
          ${!own && can ? '<button class="btn primary buy">✨ Kopen!</button>' : ''}
          ${!own && !can ? `<div class="need">Nog ${short} ⭐ sparen</div>` : ''}
          <button class="btn close">✖</button>
        </div>
      </div>
    </div>`);
    el.appendChild(ov);
    if (own) speech.say(`${it.name} woont al in je paradijs!`);
    else if (can) speech.say([`${it.name}.`, `Dit kost ${it.cost} sterren.`, 'Wil je hem kopen?']);
    else speech.say([`${it.name}.`, `Dit kost ${it.cost} sterren.`, `Je hebt er nog ${short} nodig. Ga lekker letters oefenen!`]);
    tap(ov.querySelector('.close'), () => { speech.stop(); ov.remove(); });
    ov.addEventListener('click', (e) => { if (e.target === ov) { speech.stop(); ov.remove(); } });
    const b = ov.querySelector('.buy');
    if (b) tap(b, () => {
      if (!buy(it)) return;
      sfx.buy();
      setTimeout(() => sfx.fanfare(), 200);
      go('paradise', { fresh: it.id });
    }, { sound: false });
  }

  if (fresh) {
    const it = find(fresh);
    confetti(el, 90);
    setTimeout(() => speech.say(`Hoera! ${it.name} woont nu in je paradijs!`), 500);
  } else {
    setTimeout(() => speech.say('Welkom in je paradijs!'), 300);
  }

  return { el };
}
