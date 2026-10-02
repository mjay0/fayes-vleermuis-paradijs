// Alle zinnen die het spel zegt, op één plek. tools/maak-stem.mjs maakt er
// eenmalig MP3's van (MAI-Voice via OpenRouter); het spel speelt die af en
// valt alleen terug op de iPad-stem als een zin (nog) geen bestand heeft.
// Een nieuwe zin? Zet hem hier (of in de lines() van een module) en draai
// het script opnieuw: alleen nieuwe zinnen worden gemaakt.
import { UNICORNS, BATS, DECOR, shopList } from './rewards.js';
import { MODULES } from './modules/index.js';

export const PRAISE = ['Goed zo!', 'Super!', 'Knap hoor!', 'Wauw!', 'Toppie!', 'Helemaal goed!', 'Goed zo, {naam}!', 'Jij kan het!'];

export const hello = (uni, bat) => [
  'Hoi {naam}! Zullen we letters zoeken?',
  `Hoi {naam}! ${bat.name} wil vleermuizen vangen!`,
  `${uni.name} heeft zin in letters!`,
  'Hoi {naam}! Wat gaan we doen?',
];

// 5 opdrachten × (2 sterren + 1 extra in de moeilijke stand)
export const MAX_ROUND_STARS = 15;
export const party = {
  bigStart: 'Feest! Je hebt vandaag drie rondjes gedaan!',
  start: 'Hoera!',
  stars: (n) => `Je hebt ${n} ${n === 1 ? 'ster' : 'sterren'} verdiend!`,
  newLetter: 'En je hebt een nieuwe letter verdiend!',
  shop: 'Je kunt iets nieuws kopen in je paradijs!',
};

export const paradise = {
  welcome: 'Welkom in je paradijs!',
  hi: (it) => `Hoi! Ik ben ${it.name}!`,
  name: (it) => `${it.name}.`,
  owned: (it) => `${it.name} woont al in je paradijs!`,
  cost: (n) => `Dit kost ${n} sterren.`,
  buy: 'Wil je dit kopen?',
  save: 'Je hebt nog niet genoeg sterren. Ga lekker letters oefenen!',
  bought: (it) => `Hoera! ${it.name} woont nu in je paradijs!`,
};

export const settingsTest = 'Hoi {naam}!';

export const level = {
  makkelijk: 'Makkelijk!',
  moeilijk: 'Moeilijk! Dan krijg je een extra ster.',
};

export function allLines() {
  const items = [...UNICORNS, ...BATS, ...DECOR];
  const lines = [
    ...PRAISE,
    ...UNICORNS.flatMap((u) => BATS.map((b) => hello(u, b))).flat(),
    party.bigStart, party.start, party.newLetter, party.shop,
    ...Array.from({ length: MAX_ROUND_STARS }, (_, i) => party.stars(i + 1)),
    paradise.welcome, paradise.buy, paradise.save,
    ...items.flatMap((it) => [paradise.owned(it), paradise.name(it), paradise.bought(it)]),
    ...[...UNICORNS, ...BATS].map(paradise.hi),
    ...[...new Set(shopList().map((it) => it.cost))].map(paradise.cost),
    settingsTest, level.makkelijk, level.moeilijk,
    ...MODULES.flatMap((m) => (m.lines ? m.lines() : [])),
  ];
  return [...new Set(lines)];
}
