import * as store from './store.js';
import * as clips from './clips.js';
import { register, go } from './ui.js';
import { setEnabled, setMusicEnabled, resume } from './audio.js';
import * as speech from './speech.js';
import { startScreen, homeScreen } from './screens/home.js';
import { playScreen } from './screens/play.js';
import { catchScreen } from './screens/catch.js';
import { partyScreen } from './screens/party.js';
import { paradiseScreen } from './screens/paradise.js';
import { settingsScreen } from './screens/settings.js';
import { recordScreen } from './screens/record.js';
import { lettersScreen } from './screens/letters.js';

store.load();
if (store.isTest()) {
  document.body.insertAdjacentHTML('beforeend', '<div class="test-badge">🧪 TESTMODUS</div>');
  // Testprofiel: alle letters doen mee.
  const s = store.get();
  if (!s.testInit) {
    import('./modules/letters.js').then(({ ORDER }) => {
      s.letters = [...ORDER];
      s.introduced = [...ORDER];
      s.testInit = true;
      store.save();
    });
  }
}
setEnabled(store.get().settings.sound);
setMusicEnabled(store.get().settings.music);

register('start', startScreen);
register('home', homeScreen);
register('play', playScreen);
register('catch', catchScreen);
register('party', partyScreen);
register('paradise', paradiseScreen);
register('settings', settingsScreen);
register('record', recordScreen);
register('letters', lettersScreen);

clips.init().finally(() => go('start'));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { speech.stop(); store.save(); } else resume();
});

// Geen zoom door dubbeltikken of knijpen op iPad.
document.addEventListener('gesturestart', (e) => e.preventDefault());

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
