// Themes + chapter metadata. Colors are hex ints for three.js, strings for CSS.
export const THEMES = {
  gold: {
    label: 'Gold',
    hot: 0xffe7b0, main: 0xff9c2e, deep: 0x87370a,
    rim: 0xffab45, bg: 0x05070f, fog: 0x05070f,
    css: { acc: '#ffa03c', accSoft: 'rgba(255,160,60,.16)', bg: '#05070f' },
  },
  saffron: {
    label: 'Saffron',
    hot: 0xffe2c2, main: 0xff7d1a, deep: 0x8f2606,
    rim: 0xff9636, bg: 0x0a0508, fog: 0x0a0508,
    css: { acc: '#ff8a26', accSoft: 'rgba(255,138,38,.16)', bg: '#0a0508' },
  },
  green: {
    label: 'Emerald',
    hot: 0xd9ffe9, main: 0x24e394, deep: 0x0a6644,
    rim: 0x45ecaa, bg: 0x030a08, fog: 0x030a08,
    css: { acc: '#2ce89a', accSoft: 'rgba(44,232,154,.16)', bg: '#030a08' },
  },
  blue: {
    label: 'Sapphire',
    hot: 0xdcefff, main: 0x4d9bff, deep: 0x1a45a8, // deep navy
    rim: 0x6cb0ff, bg: 0x04060f, fog: 0x04060f,
    css: { acc: '#54a1ff', accSoft: 'rgba(84,161,255,.16)', bg: '#04060f' },
  },
  red: {
    label: 'Crimson',
    hot: 0xffe0d2, main: 0xff5f42, deep: 0x99190c,
    rim: 0xff7a5c, bg: 0x0c0406, fog: 0x0c0406,
    css: { acc: '#ff6a4e', accSoft: 'rgba(255,106,78,.16)', bg: '#0c0406' },
  },
};

// Formation centers along the journey (world space, travelling down -Z).
export const STATIONS = [
  { x: 0,   y: 0, z: 0 },     // 0 hero — helix tunnel (axis along Z)
  { x: -26, y: 5, z: -110 },  // 1 about — identity galaxy
  { x: 22,  y: -3, z: -185 }, // 2 career — mainframe data city
  { x: -20, y: 7, z: -265 },  // 3 ai — neural constellation
  { x: 16,  y: 0, z: -345 },  // 4 music — sound mandala
  { x: -14, y: 3, z: -425 },  // 5 skills — orbital shells
  { x: 0,   y: 0, z: -505 },  // 6 contact — DNA reborn (upright)
];

export const CHAPTERS = [
  { id: 'hero',    clip: 'flying',   yOff: -2.2, face: 'path',   timeScale: 1.0 },
  { id: 'about',   clip: 'floating', yOff: -1.6, face: 'path',   timeScale: 0.9 },
  { id: 'career',  clip: 'running',  yOff: -3.0, face: 'path',   timeScale: 1.05 },
  { id: 'ai',      clip: 'fastrun',  yOff: -2.6, face: 'path',   timeScale: 1.0 },
  { id: 'music',   clip: 'treading', yOff: -1.8, face: 'camera', timeScale: 0.9 },
  { id: 'skills',  clip: 'flying',   yOff: -2.0, face: 'path',   timeScale: 0.85 },
  { id: 'contact', clip: 'idle',     yOff: -3.2, face: 'camera', timeScale: 1.0 },
];

export const IS_MOBILE = matchMedia('(pointer: coarse)').matches;
export const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const PARTICLE_COUNT = IS_MOBILE ? 16000 : 42000;
export const DUST_COUNT = IS_MOBILE ? 1200 : 3200;
