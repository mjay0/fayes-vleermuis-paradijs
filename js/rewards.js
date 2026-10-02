// Alles wat Faye kan verdienen met sterren: unicorns, vleermuizen en
// versiering voor haar paradijs. Elk ding heeft een vaste plek in het paradijs.
import * as store from './store.js';
import { unicornSVG, batSVG } from './art.js';

export const UNICORNS = [
  { id: 'roosje', name: 'Roosje', cost: 0, body: '#fff4fb', shade: '#f1d6e8', mane: ['#ff8fd0', '#ffb3e1', '#ff5fb8'] },
  { id: 'lila', name: 'Lila', cost: 15, body: '#f6eeff', shade: '#dccbf3', mane: ['#b07cff', '#d6b8ff', '#8a4dff'] },
  { id: 'mintje', name: 'Mintje', cost: 25, body: '#effffa', shade: '#cbeee2', mane: ['#5fe3c0', '#a6f5df', '#2fc7a0'] },
  { id: 'sterretje', name: 'Sterretje', cost: 40, body: '#fffbea', shade: '#f0e3b8', mane: ['#ffd34d', '#ffe89a', '#ffb800'] },
  { id: 'regenboog', name: 'Regenboog', cost: 60, body: '#ffffff', shade: '#e3def0', mane: ['#ff5f7a', '#ffb84d', '#ffe14d', '#6fe07a', '#4dc3ff', '#a77bff', '#ff7ad9'] },
  { id: 'nachtje', name: 'Nachtje', cost: 85, body: '#4a3f86', shade: '#352d66', mane: ['#7fd1ff', '#c7a6ff', '#ffffff'], hoof: '#c7a6ff' },
].map((x) => ({ ...x, kind: 'uni' }));

export const BATS = [
  { id: 'pip', name: 'Pip', cost: 0, body: '#9068d6', wing: '#5d3fa3', belly: '#e2d4fb' },
  { id: 'flap', name: 'Flap', cost: 20, body: '#ff86c4', wing: '#d94f97', belly: '#ffe0ef' },
  { id: 'blauwtje', name: 'Blauwtje', cost: 30, body: '#58b2ff', wing: '#2c6fd1', belly: '#d6ecff' },
  { id: 'goudje', name: 'Goudje', cost: 50, body: '#ffc93c', wing: '#e09a00', belly: '#fff3c9', ear: '#ff9f6b' },
  { id: 'glitter', name: 'Glitter', cost: 70, body: '#9b6bff', wing: '#ff5fc8', belly: '#ffe3f6' },
].map((x) => ({ ...x, kind: 'bat' }));

// Versiering als emoji (ziet er op de iPad mooi uit). x/y = plek in procenten.
export const DECOR = [
  { id: 'sterren', name: 'Glitter-sterren', e: '✨', cost: 10, x: 50, y: 18 },
  { id: 'paddenstoel', name: 'Paddenstoelen', e: '🍄', cost: 12, x: 8, y: 80 },
  { id: 'bloemen', name: 'Bloemen', e: '🌸', cost: 12, x: 68, y: 64 },
  { id: 'cupcake', name: 'Cupcake', e: '🧁', cost: 15, x: 12, y: 94 },
  { id: 'lampion', name: 'Lampion', e: '🏮', cost: 18, x: 30, y: 30 },
  { id: 'regenboog-boog', name: 'Regenboog', e: '🌈', cost: 35, x: 74, y: 30 },
  { id: 'draaimolen', name: 'Draaimolen', e: '🎠', cost: 45, x: 20, y: 64 },
  { id: 'kasteel', name: 'Kasteel', e: '🏰', cost: 55, x: 84, y: 56 },
].map((x) => ({ ...x, kind: 'decor' }));

export const ALL = [...UNICORNS, ...BATS, ...DECOR];
export const byId = (id) => ALL.find((x) => x.id === id);

export const owns = (id) => { const o = store.get().owned; return o.includes('*') || o.includes(id); };
export const ownedOf = (list) => list.filter((x) => owns(x.id));

export function art(item, opts = {}) {
  if (item.kind === 'uni') return unicornSVG(item, opts);
  if (item.kind === 'bat') return batSVG(item, opts);
  return `<span class="decor-emoji">${item.e}</span>`;
}

// In de winkel: goedkoopste eerst, maar per soort om en om.
export function shopList() {
  return [...ALL].filter((x) => x.cost > 0).sort((a, b) => a.cost - b.cost);
}

export const canBuy = (item) => !owns(item.id) && store.get().stars >= item.cost;
export const anyAffordable = () => shopList().some(canBuy);

export function buy(item) {
  const s = store.get();
  if (!canBuy(item)) return false;
  s.stars -= item.cost;
  s.owned.push(item.id);
  if (item.kind === 'uni') s.buddyUni = item.id;
  if (item.kind === 'bat') s.buddyBat = item.id;
  store.save();
  return true;
}

export const buddyUni = () => byId(store.get().buddyUni) || UNICORNS[0];
export const buddyBat = () => byId(store.get().buddyBat) || BATS[0];

// Sterren per opdracht: meteen goed 2, met hulp 1.
export const starsFor = (firstTry) => (firstTry ? 2 : 1);
