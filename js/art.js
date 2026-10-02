// Alle tekeningen als SVG-strings: unicorns, vleermuizen en het paradijs.

// Unicorn (kijkt naar rechts). u: { body, shade, mane: [kleuren], hoof }
export function unicornSVG(u, { mood = 'happy', sparkle = false } = {}) {
  const m = u.mane;
  const c = (i) => m[i % m.length];
  const hoof = u.hoof || '#ffd35c';
  const eye = mood === 'sleep'
    ? '<path d="M159 66 Q166 72 173 66" stroke="#2a1640" stroke-width="3.5" fill="none" stroke-linecap="round"/>'
    : `<ellipse cx="166" cy="66" rx="6.5" ry="8.5" fill="#2a1640"/>
       <circle cx="168.5" cy="62.5" r="2.6" fill="#fff"/>
       <circle cx="164" cy="70" r="1.2" fill="#fff"/>
       <path d="M159.5 58.5 L155 54.5 M163.5 56.5 L161 51.5 M168 56.5 L167.5 51" stroke="#2a1640" stroke-width="2.4" stroke-linecap="round"/>`;
  const mouth = mood === 'wow'
    ? '<ellipse cx="187" cy="97" rx="4.5" ry="5" fill="#7a2a55"/>'
    : '<path d="M180 95 Q187 101 194 95" stroke="#7a2a55" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
  const stars = sparkle ? `<g class="sparkles" fill="#fff6b0">
      <path d="M30 40 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/>
      <path d="M200 20 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/>
      <path d="M205 140 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5z"/>
    </g>` : '';
  return `<svg class="unicorn" viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg">
    ${stars}
    <g class="uni-tail">
      <path d="M50 112 C 22 98, 6 124, 18 146 C 26 160, 16 174, 4 180 C 38 188, 60 162, 56 130 Z" fill="${c(0)}"/>
      <path d="M50 118 C 34 116, 24 134, 32 150 C 38 162, 32 172, 24 178 C 46 178, 58 160, 54 134 Z" fill="${c(1)}"/>
    </g>
    <rect x="66" y="138" width="16" height="44" rx="8" fill="${u.shade}"/>
    <rect x="122" y="138" width="16" height="44" rx="8" fill="${u.shade}"/>
    <rect x="66" y="172" width="16" height="11" rx="4" fill="${hoof}" opacity="0.85"/>
    <rect x="122" y="172" width="16" height="11" rx="4" fill="${hoof}" opacity="0.85"/>
    <ellipse cx="100" cy="128" rx="58" ry="36" fill="${u.body}"/>
    <rect x="80" y="140" width="17" height="44" rx="8.5" fill="${u.body}"/>
    <rect x="136" y="140" width="17" height="44" rx="8.5" fill="${u.body}"/>
    <rect x="80" y="173" width="17" height="12" rx="4" fill="${hoof}"/>
    <rect x="136" y="173" width="17" height="12" rx="4" fill="${hoof}"/>
    <path d="M124 116 C 130 92, 138 80, 150 72 L 176 92 C 166 106, 160 122, 152 136 Z" fill="${u.body}"/>
    <path d="M141 44 L 136 18 L 158 37 Z" fill="${u.body}"/>
    <path d="M143 40 L 140 25 L 152 36 Z" fill="#ffb3d9"/>
    <circle cx="160" cy="70" r="32" fill="${u.body}"/>
    <ellipse cx="184" cy="88" rx="21" ry="17" fill="${u.body}"/>
    <ellipse cx="192" cy="86" rx="3" ry="2.2" fill="${u.shade}"/>
    <g class="horn">
      <path d="M156 42 L 179 2 L 172 46 Z" fill="#ffd54d"/>
      <path d="M160 36 L 172 33 M164 27 L 174 24 M168 18 L 176 16" stroke="#f0a400" stroke-width="2.6" stroke-linecap="round"/>
    </g>
    <circle cx="138" cy="48" r="12" fill="${c(0)}"/>
    <circle cx="130" cy="64" r="13" fill="${c(1)}"/>
    <circle cx="126" cy="82" r="13" fill="${c(2)}"/>
    <circle cx="124" cy="100" r="12" fill="${c(3)}"/>
    <circle cx="150" cy="38" r="10" fill="${c(4)}"/>
    <circle cx="164" cy="40" r="8.5" fill="${c(5)}"/>
    <circle cx="120" cy="116" r="10" fill="${c(6)}"/>
    ${eye}
    <ellipse cx="176" cy="82" rx="7.5" ry="4.5" fill="#ff8fc8" opacity="0.6"/>
    ${mouth}
  </svg>`;
}

// Vleermuis (kijkt naar voren). b: { body, wing, belly, ear }
// letter: grote letter op het buikje (voor het vang-spel).
export function batSVG(b, { letter = '', mood = 'happy', hang = false } = {}) {
  const lt = !!letter;
  const ey = lt ? 54 : 72;
  const eyes = mood === 'sleep'
    ? `<path d="M96 ${ey} Q104 ${ey + 6} 112 ${ey}" stroke="#1d1030" stroke-width="3.5" fill="none" stroke-linecap="round"/>
       <path d="M128 ${ey} Q136 ${ey + 6} 144 ${ey}" stroke="#1d1030" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : `<circle cx="104" cy="${ey}" r="12" fill="#fff"/><circle cx="136" cy="${ey}" r="12" fill="#fff"/>
       <circle cx="106" cy="${ey + 2}" r="7.5" fill="#1d1030"/><circle cx="138" cy="${ey + 2}" r="7.5" fill="#1d1030"/>
       <circle cx="108.5" cy="${ey - 1}" r="2.8" fill="#fff"/><circle cx="140.5" cy="${ey - 1}" r="2.8" fill="#fff"/>`;
  const my = ey + 16;
  const mouth = mood === 'wow'
    ? `<ellipse cx="120" cy="${my + 2}" rx="6" ry="5" fill="#5a1838"/>`
    : `<path d="M110 ${my} Q120 ${my + 8} 130 ${my}" stroke="#1d1030" stroke-width="2.6" fill="none" stroke-linecap="round"/>
       <path d="M113 ${my + 2} l2.5 5 2.5 -4.5 Z M122 ${my + 2.5} l2.5 4.5 2.5 -5 Z" fill="#fff"/>`;
  const wing = `<path d="M100 72 C 72 40, 30 32, 4 48 C 14 60, 16 72, 12 88 C 26 80, 38 84, 44 98 C 54 88, 68 90, 76 104 C 82 94, 92 92, 102 100 Z" fill="${b.wing}"/>
      <path d="M96 76 C 70 60, 40 54, 18 56 M92 84 C 72 76, 54 80, 44 96 M96 90 C 86 88, 80 94, 76 102" stroke="${b.body}" stroke-width="2.2" fill="none" opacity="0.45"/>`;
  return `<svg class="bat ${hang ? 'hang' : ''}" viewBox="0 0 240 170" xmlns="http://www.w3.org/2000/svg">
    <g class="wing wl">${wing}</g>
    <g transform="translate(240 0) scale(-1 1)"><g class="wing wr">${wing}</g></g>
    <path d="M90 54 L 80 12 L 114 40 Z" fill="${b.body}"/>
    <path d="M150 54 L 160 12 L 126 40 Z" fill="${b.body}"/>
    <path d="M92 46 L 86 22 L 106 40 Z" fill="${b.ear || '#ff9fd2'}"/>
    <path d="M148 46 L 154 22 L 134 40 Z" fill="${b.ear || '#ff9fd2'}"/>
    <circle cx="120" cy="86" r="46" fill="${b.body}"/>
    ${lt
      ? `<circle cx="120" cy="${my + 40}" r="33" fill="${b.belly}"/>
         <text x="120" y="${my + 41}" class="bat-letter" text-anchor="middle" dominant-baseline="central">${letter}</text>`
      : `<ellipse cx="120" cy="104" rx="26" ry="22" fill="${b.belly}" opacity="0.9"/>`}
    ${eyes}
    <ellipse cx="94" cy="${ey + 14}" rx="7" ry="4" fill="#ff8fc8" opacity="0.55"/>
    <ellipse cx="146" cy="${ey + 14}" rx="7" ry="4" fill="#ff8fc8" opacity="0.55"/>
    ${mouth}
    <path d="M108 130 q-4 8 -10 8 M132 130 q4 8 10 8" stroke="${b.wing}" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// Heuvels onderaan het paradijs.
export const hillsSVG = `<svg class="hills" viewBox="0 0 1200 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 140 C 200 60, 380 80, 560 130 C 760 180, 940 70, 1200 110 L 1200 300 L 0 300 Z" fill="#3b2a78"/>
  <path d="M0 200 C 240 140, 460 170, 640 200 C 840 230, 1000 160, 1200 190 L 1200 300 L 0 300 Z" fill="#4c3594"/>
</svg>`;

// Boom met een tak waar de vleermuizen aan hangen.
export const treeSVG = `<svg class="tree" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 300 C 52 220, 46 160, 60 100 C 70 60, 90 40, 120 36 C 200 30, 300 40, 400 30 L 400 52 C 300 62, 200 56, 130 60 C 100 64, 90 90, 86 130 C 80 190, 92 240, 96 300 Z" fill="#2a1d55"/>
  <path d="M120 40 C 130 20, 150 10, 170 14 M250 38 C 262 18, 280 12, 296 16" stroke="#2a1d55" stroke-width="8" fill="none" stroke-linecap="round"/>
</svg>`;

// App-icoon (ook gebruikt om de PNG's te maken).
export function iconSVG(uni, bat) {
  return `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b1a55"/><stop offset="1" stop-color="#7b3fa8"/></linearGradient></defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <circle cx="400" cy="110" r="56" fill="#fff3c4"/><circle cx="378" cy="96" r="56" fill="#2f1d5c"/>
    <g fill="#fff6b0"><circle cx="80" cy="80" r="5"/><circle cx="170" cy="50" r="4"/><circle cx="250" cy="120" r="3"/><circle cx="60" cy="200" r="3"/></g>
    <g transform="translate(40 190) scale(1.55)">${unicornSVG(uni).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>
    <g transform="translate(250 40) scale(0.95)">${batSVG(bat).replace(/<svg[^>]*>|<\/svg>/g, '')}</g>
  </svg>`;
}
