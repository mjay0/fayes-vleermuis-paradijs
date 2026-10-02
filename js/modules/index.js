// Register van alle oefen-modules. Een nieuwe soort oefening (bijvoorbeeld
// beginklank of woordjes lezen) is een nieuw bestand in deze map dat hier
// wordt toegevoegd; zie letters.js voor de vorm.
import letters from './letters.js';

export const MODULES = [letters];

export const moduleById = (id) => MODULES.find((m) => m.id === id) || MODULES[0];

// De spelvormen. Een module zegt zelf welke ze ondersteunt (modes).
export const MODES = {
  kies: { name: 'Kies de letter', emoji: '🔤', screen: 'play' },
  toetsen: { name: 'Letter-toetsen', emoji: '⌨️', screen: 'play' },
  vangen: { name: 'Vleermuizen vangen', emoji: '🦇', screen: 'catch' },
};
