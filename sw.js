// Offline: alle bestanden worden bewaard. Nieuwe versies worden op de
// achtergrond opgehaald en zijn er bij de volgende keer openen.
// Let op: Henry's Feestje staat op hetzelfde domein (mjay0.github.io), dus we
// ruimen alleen onze eigen caches op (die met PREFIX beginnen).
const PREFIX = 'fayes-paradijs-';
const CACHE = `${PREFIX}v4`;
const FILES = [
  './',
  'index.html',
  'style.css',
  'manifest.webmanifest',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'js/main.js',
  'js/store.js',
  'js/engine.js',
  'js/audio.js',
  'js/speech.js',
  'js/clips.js',
  'js/art.js',
  'js/ui.js',
  'js/lines.js',
  'stem/index.json',
  'js/rewards.js',
  'js/modules/index.js',
  'js/modules/letters.js',
  'js/screens/home.js',
  'js/screens/intro.js',
  'js/screens/play.js',
  'js/screens/catch.js',
  'js/screens/party.js',
  'js/screens/paradise.js',
  'js/screens/settings.js',
  'js/screens/record.js',
  'js/screens/letters.js',
];

// De stem-bestanden (zie stem/index.json) worden ook bewaard, maar een
// mislukte download blokkeert de rest niet. Bestanden die al in een vorige
// cache zaten (namen veranderen alleen als de zin verandert) worden hergebruikt.
async function cacheVoice(c) {
  try {
    const idx = await (await c.match('stem/index.json')).json();
    const files = [...new Set([...Object.values(idx.lines), ...Object.values(idx.klanken || {}).flat()])].map((f) => `stem/${f}`);
    let i = 0;
    await Promise.all(Array.from({ length: 6 }, async () => {
      while (i < files.length) {
        const f = files[i++];
        try {
          const old = await caches.match(f);
          if (old) await c.put(f, old); else await c.add(new Request(f, { cache: 'reload' }));
        } catch {}
      }
    }));
  } catch {}
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then(async (c) => {
      await c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })));
      await cacheVoice(c);
    })
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    }),
  );
});
