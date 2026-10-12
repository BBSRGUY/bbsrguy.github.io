// Formation generators. Each returns Float32Array(count*3) of world-space
// positions. Deterministic per session (seeded once) so scrubbing back and
// forth is stable.
import { STATIONS } from './config.js';

// Mulberry32 — deterministic, fast
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;

function gauss(r) { return (r() + r() + r() - 1.5) * 0.816; }

// 0 — HERO: double-helix tunnel along Z, camera flies through it
export function helixTunnel(count) {
  const r = rng(101);
  const out = new Float32Array(count * 3);
  const c = STATIONS[0];
  const R = 7, LEN = 120, TWIST = 0.16;
  for (let i = 0; i < count; i++) {
    const k = r();
    let x, y, z;
    if (k < 0.62) {
      // two backbone strands
      const s = k < 0.31 ? 0 : 1;
      z = (r() - 0.5) * LEN;
      const a = z * TWIST + s * Math.PI;
      const rr = R + gauss(r) * 0.45;
      x = Math.cos(a) * rr; y = Math.sin(a) * rr;
    } else if (k < 0.80) {
      // base-pair rungs bridging the strands
      const zi = (Math.floor(r() * 40) - 20) * (LEN / 40);
      const a = zi * TWIST;
      const t = r() * 2 - 1;
      x = Math.cos(a) * R * t + gauss(r) * 0.25;
      y = Math.sin(a) * R * t + gauss(r) * 0.25;
      z = zi + gauss(r) * 0.35;
    } else {
      // ember cloud drifting around the tunnel
      const a = r() * TAU;
      const rr = 11 + r() * 34;
      x = Math.cos(a) * rr; y = Math.sin(a) * rr * 0.7;
      z = (r() - 0.5) * (LEN + 60);
    }
    out[i * 3] = x + c.x; out[i * 3 + 1] = y + c.y; out[i * 3 + 2] = z + c.z;
  }
  return out;
}

// 1 — ABOUT: spiral identity galaxy
export function galaxy(count) {
  const r = rng(202);
  const out = new Float32Array(count * 3);
  const c = STATIONS[1];
  for (let i = 0; i < count; i++) {
    const k = r();
    let x, y, z;
    if (k < 0.85) {
      const arm = Math.floor(r() * 3);
      const rad = Math.pow(r(), 0.6) * 15;
      const a = rad * 0.42 + (arm / 3) * TAU + gauss(r) * (0.28 - rad * 0.012);
      x = Math.cos(a) * rad;
      z = Math.sin(a) * rad;
      y = gauss(r) * (2.2 - rad * 0.1);
    } else {
      // halo
      const a = r() * TAU, b = Math.acos(r() * 2 - 1);
      const rad = 16 + r() * 14;
      x = Math.sin(b) * Math.cos(a) * rad;
      y = Math.cos(b) * rad * 0.6;
      z = Math.sin(b) * Math.sin(a) * rad;
    }
    out[i * 3] = x + c.x; out[i * 3 + 1] = y + c.y; out[i * 3 + 2] = z + c.z;
  }
  return out;
}

// 2 — CAREER: mainframe data city (glowing columns + data highway)
export function dataCity(count) {
  const r = rng(303);
  const out = new Float32Array(count * 3);
  const c = STATIONS[2];
  const GX = 10, GZ = 7, SP = 3.6;
  // deterministic column heights
  const heights = [];
  const hr = rng(304);
  for (let i = 0; i < GX * GZ; i++) heights.push(3 + Math.pow(hr(), 1.6) * 14);
  for (let i = 0; i < count; i++) {
    const k = r();
    let x, y, z;
    if (k < 0.72) {
      const gi = Math.floor(r() * GX * GZ);
      const gx = gi % GX, gz = Math.floor(gi / GX);
      const h = heights[gi];
      x = (gx - (GX - 1) / 2) * SP + gauss(r) * 0.22;
      z = (gz - (GZ - 1) / 2) * SP + gauss(r) * 0.22;
      y = -6 + Math.pow(r(), 0.8) * h;
    } else if (k < 0.9) {
      // data highway ribbon weaving through the city
      const t = r();
      x = Math.sin(t * TAU * 1.2) * 16;
      z = (t - 0.5) * 34;
      y = -4.5 + Math.sin(t * TAU * 2.4) * 1.4 + gauss(r) * 0.3;
    } else {
      // sparks above the skyline
      x = (r() - 0.5) * 42; z = (r() - 0.5) * 32;
      y = -6 + r() * 22;
    }
    out[i * 3] = x + c.x; out[i * 3 + 1] = y + c.y; out[i * 3 + 2] = z + c.z;
  }
  return out;
}

// 3 — AI: neural constellation (node clusters + synapse lines)
export function neural(count) {
  const r = rng(404);
  const out = new Float32Array(count * 3);
  const c = STATIONS[3];
  const N = 72;
  const nodes = [];
  const nr = rng(405);
  for (let i = 0; i < N; i++) {
    nodes.push([gauss(nr) * 9, gauss(nr) * 6, gauss(nr) * 8]);
  }
  // precompute nearby pairs
  const edges = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      const dx = nodes[i][0] - nodes[j][0], dy = nodes[i][1] - nodes[j][1], dz = nodes[i][2] - nodes[j][2];
      if (dx * dx + dy * dy + dz * dz < 42) edges.push([i, j]);
    }
  }
  for (let i = 0; i < count; i++) {
    const k = r();
    let x, y, z;
    if (k < 0.5) {
      const n = nodes[Math.floor(r() * N)];
      x = n[0] + gauss(r) * 0.5; y = n[1] + gauss(r) * 0.5; z = n[2] + gauss(r) * 0.5;
    } else if (edges.length) {
      const e = edges[Math.floor(r() * edges.length)];
      const a = nodes[e[0]], b = nodes[e[1]], t = r();
      x = a[0] + (b[0] - a[0]) * t + gauss(r) * 0.12;
      y = a[1] + (b[1] - a[1]) * t + gauss(r) * 0.12;
      z = a[2] + (b[2] - a[2]) * t + gauss(r) * 0.12;
    } else { x = gauss(r) * 9; y = gauss(r) * 6; z = gauss(r) * 8; }
    out[i * 3] = x + c.x; out[i * 3 + 1] = y + c.y; out[i * 3 + 2] = z + c.z;
  }
  return out;
}

// 4 — MUSIC: sound mandala (waveform rings facing the camera, +Z)
export function mandala(count) {
  const r = rng(505);
  const out = new Float32Array(count * 3);
  const c = STATIONS[4];
  const RINGS = 11;
  for (let i = 0; i < count; i++) {
    const k = r();
    let x, y, z;
    if (k < 0.12) {
      // radiant core
      x = gauss(r) * 1.1; y = gauss(r) * 1.1; z = gauss(r) * 0.7;
    } else if (k < 0.86) {
      const ring = Math.floor(r() * RINGS);
      const base = 2.4 + ring * 1.35;
      const a = r() * TAU;
      const wave = Math.sin(a * (3 + ring * 2)) * (0.22 + ring * 0.05);
      const rad = base + wave;
      x = Math.cos(a) * rad; y = Math.sin(a) * rad;
      z = Math.sin(a * (2 + ring)) * 0.5 + gauss(r) * 0.16;
    } else {
      // sound rays shooting outward
      const a = Math.floor(r() * 24) / 24 * TAU;
      const rad = 16 + r() * 9;
      x = Math.cos(a) * rad + gauss(r) * 0.2;
      y = Math.sin(a) * rad + gauss(r) * 0.2;
      z = gauss(r) * 0.5;
    }
    out[i * 3] = x + c.x; out[i * 3 + 1] = y + c.y; out[i * 3 + 2] = z + c.z;
  }
  return out;
}

// 5 — SKILLS: five tilted orbital shells around a nucleus
export function orbitals(count) {
  const r = rng(606);
  const out = new Float32Array(count * 3);
  const c = STATIONS[5];
  const SHELLS = 5;
  const tilts = [];
  const tr = rng(607);
  for (let s = 0; s < SHELLS; s++) {
    tilts.push([tr() * Math.PI, tr() * Math.PI, 5.5 + s * 2.3]);
  }
  for (let i = 0; i < count; i++) {
    const k = r();
    let x, y, z;
    if (k < 0.18) {
      x = gauss(r) * 1.6; y = gauss(r) * 1.6; z = gauss(r) * 1.6;
    } else {
      const s = Math.floor(r() * SHELLS);
      const [rx, rz, rad] = tilts[s];
      const a = r() * TAU;
      let px = Math.cos(a) * rad, py = Math.sin(a) * rad * 0.94, pz = 0;
      pz += gauss(r) * 0.18; px += gauss(r) * 0.18; py += gauss(r) * 0.18;
      // rotate around X then Z
      let y1 = py * Math.cos(rx) - pz * Math.sin(rx);
      let z1 = py * Math.sin(rx) + pz * Math.cos(rx);
      let x2 = px * Math.cos(rz) - y1 * Math.sin(rz);
      let y2 = px * Math.sin(rz) + y1 * Math.cos(rz);
      x = x2; y = y2; z = z1;
    }
    out[i * 3] = x + c.x; out[i * 3 + 1] = y + c.y; out[i * 3 + 2] = z + c.z;
  }
  return out;
}

// 6 — CONTACT: DNA reborn — upright vertical helix, the signature mark.
// Proportions/rung layout must stay in sync with makeFinaleDNA (particles.js),
// which draws the luminous backbone tubes over this same lattice.
export const FINALE_DNA = { R: 4.6, H: 26, TWIST: 0.42, RUNGS: 18 };
export function helixFinale(count) {
  const r = rng(707);
  const out = new Float32Array(count * 3);
  const c = STATIONS[6];
  const { R, H, TWIST, RUNGS } = FINALE_DNA;
  for (let i = 0; i < count; i++) {
    const k = r();
    let x, y, z;
    if (k < 0.62) {
      // two crisp backbone strands
      const s = k < 0.31 ? 0 : 1;
      y = (r() - 0.5) * H;
      const a = y * TWIST + s * Math.PI;
      const rr = R + gauss(r) * 0.2;
      x = Math.cos(a) * rr; z = Math.sin(a) * rr;
    } else if (k < 0.84) {
      // discrete base-pair rungs, denser toward the strand attachment points
      const yi = (Math.floor(r() * RUNGS) - RUNGS / 2 + 0.5) * (H / RUNGS);
      const a = yi * TWIST;
      let t = r() * 2 - 1;
      t = Math.sign(t) * Math.pow(Math.abs(t), 0.7); // bias to the ends
      x = Math.cos(a) * R * t + gauss(r) * 0.14;
      z = Math.sin(a) * R * t + gauss(r) * 0.14;
      y = yi + gauss(r) * 0.18;
    } else {
      // wide ember halo kept clear of the structure so it reads clean
      const a = r() * TAU;
      const rr = 11 + r() * 26;
      x = Math.cos(a) * rr; z = Math.sin(a) * rr;
      y = (r() - 0.5) * (H + 26);
    }
    out[i * 3] = x + c.x; out[i * 3 + 1] = y + c.y + 2; out[i * 3 + 2] = z + c.z;
  }
  return out;
}

export function buildAllShapes(count) {
  return [
    helixTunnel(count),
    galaxy(count),
    dataCity(count),
    neural(count),
    mandala(count),
    orbitals(count),
    helixFinale(count),
  ];
}
