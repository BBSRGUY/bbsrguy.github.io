// Fig 1 · The modernization bench.
// Source decks (COBOL, JCL, copybooks) feed an AI parser; each member is filed
// in a RAG index, wired into a dependency map, and turned by a doc generator
// into the outputs an Enterprise Analyzer / CAST run would give, sorted into
// six pockets. Every station carries its own engraved nameplate.
//
//   node figures/modernization/build.mjs            -> preview.html + site files
//   node figures/modernization/build.mjs --preview  -> preview.html only
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as G from "../kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "..");

/* ---------- the model ---------- */
const MODULES = 150; // COBOL modules assessed in the knowledge continuity program
const SOURCES = [
  { name: "COBOL", cards: 150 },
  { name: "JCL", cards: 96 },
  { name: "COPYBOOK", cards: 72 },
];
const OUTPUTS = ["CALL GRAPH", "CRUD MATRIX", "JOB FLOW", "BIZ RULES", "SAD · AID", "JAVA STORY"];
const CARD_T = 0.3;
const SHEET_T = 0.1;

/* ---------- world ---------- */
const WIDTH = 900;
const HEIGHT = 390;
const BASE = { x: -294, y: -76, w: 640, d: 126, r: 10 };
const BASE_H = 10;
const FOOT_H = 4;

const BED = { x: -284, y: -12, w: 384, d: 24, r: 2 };
const BED_H = 3;
const RAIL_H = 9;
const AXLE_Z = BED_H + 2.2;
const ROLL_R = 1.4;
const TRACK_Z = AXLE_Z + ROLL_R;
const ROLLERS = [-142, -84, -46, 18, 56];

const CARD = { w: 32, d: 15 };
const HOPPERS = [-250, -208, -166];
const STACK_Z = TRACK_Z + CARD_T;
const POST_TOP = STACK_Z + SOURCES[0].cards * CARD_T + 10;
const X_READ = -110;
const X_GONE = 98;

const BRIDGE_Y = [-24, 19];
const BEAM_Z = 52;
const BEAM_H = 7;
const HEAD_Z = 32;
const LENS_Z = 25;
const SCAN = 5;

const CAB = { x: -95, y: -62, w: 50, d: 30, r: 2 };
const CAB_H = 56;
const DRAWERS = [4, 18, 32]; // bottom of each drawer front
const DRAWER_H = 12;
const DRAWER_OPEN = 15;

const PANEL = { x: -28, y: -68, w: 104, d: 5, r: 1 };
const PANEL_Z0 = 3;
const PANEL_TOP = 82;
const FACE_Y = PANEL.y + PANEL.d;
const JACK_COLS = 9;
const JACK_ROWS = 6;

const GEN = { x: 82, y: -30, w: 52, d: 60, r: 3 };
const GEN_H = 44;
const SLOT_Z = 33;

const POCKET_W = 30;
const POCKET_X0 = 142;
const POCKET = { y: -16, d: 32 };
const POCKET_FLOOR = 5;
const WALL_H = 11;
const RAIL_Z = 34;
const SHEET = { w: 22, d: 24 };
const PILE_Z = POCKET_FLOOR + 1.2;
const pocketX = (i) => POCKET_X0 + POCKET_W * i;
const pocketCentre = (i) => pocketX(i) + POCKET_W / 2;
const SHUTTLE_HOME = GEN.x + GEN.w + 8;
const SHUTTLE_END = pocketCentre(OUTPUTS.length - 1) + 6;

const P = k.fitProjection(
  [...k.boxCorners(BASE, -BASE_H - FOOT_H, 0), [PANEL.x, PANEL.y, PANEL_TOP + 2], [HOPPERS[0] - 18, -10, POST_TOP + 3], ...k.boxCorners(GEN, 0, GEN_H + 3)],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 70 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (list, key = (p) => p) => [...list].sort((a, b) => depth(key(a)) - depth(key(b)));
const halo = (plan, z, h, blur = 0) => `<path class="iso-halo" d="${k.haloOf(plan, z, h, P)}"${blur ? ` style="filter:blur(${blur}px)"` : ""}/>`;
const seq = (n) => Array.from({ length: n }, (_, i) => i);

/* ---------- nameplates: a thin plate on a face, engraved ---------- */
const TEXT_W = 0.62; // mono advance per unit of font size
function plateY(xc, yFace, zMid, text, size = 4.4, pad = 2.4) {
  const w = text.length * size * TEXT_W + pad * 2;
  const h = size * 1.7;
  const plan = { x: xc - w / 2, y: yFace, w, d: 0.7, r: 0.3 };
  return [
    S(k.slabOf(plan, zMid - h / 2, h, P, 2), { tone: "mid", crease: "none" }),
    D([at([plan.x + 1.1, yFace + 0.7, zMid]), at([plan.x + w - 1.1, yFace + 0.7, zMid])], { size: 0.38, tone: "lo" }),
    k.faceTextSvg(k.sideMatrix([xc, yFace + 0.7], zMid - size * 0.36, P, "left"), text, { size, tone: "hi", anchor: "middle" }),
  ].join("");
}
function plateX(xFace, yc, zMid, text, size = 4.4, pad = 2.4) {
  const w = text.length * size * TEXT_W + pad * 2;
  const h = size * 1.7;
  const plan = { x: xFace, y: yc - w / 2, w: 0.7, d: w, r: 0.3 };
  return [
    S(k.slabOf(plan, zMid - h / 2, h, P, 2), { tone: "mid", crease: "none" }),
    D([at([xFace + 0.7, plan.y + 1.1, zMid]), at([xFace + 0.7, plan.y + w - 1.1, zMid])], { size: 0.38, tone: "lo" }),
    k.faceTextSvg(k.sideMatrix([xFace + 0.7, yc], zMid - size * 0.36, P, "right"), text, { size, tone: "hi", anchor: "middle" }),
  ].join("");
}
const badge = (n) => String(n).padStart(2, "0");

/* ---------- base ---------- */
function base() {
  const out = [halo(BASE, -BASE_H - FOOT_H, BASE_H)];
  for (const [x, y] of byDepth(k.corners(BASE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -BASE_H - FOOT_H, 1.4, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.2, -BASE_H - FOOT_H + 1.4, FOOT_H - 1.4, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BASE, -BASE_H, BASE_H, P, 8, 1.4), { tone: "mid", inner: L(k.sideSeam(BASE, -3, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BASE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BASE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.1, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -84, y: BASE.y + BASE.d - 13, w: 164, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.45 }));
  return out.join("");
}

/* ---------- 04 dependency map: a patch panel ---------- */
const jack = (c, r) => [PANEL.x + 12 + c * 10, FACE_Y, PANEL_TOP - 24 - r * 9.4];
const CORDS = (() => {
  let s = 4242;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const used = new Set();
  const out = [];
  while (out.length < 14) {
    const a = [Math.floor(rand() * JACK_COLS), Math.floor(rand() * JACK_ROWS)];
    const b = [Math.floor(rand() * JACK_COLS), Math.floor(rand() * JACK_ROWS)];
    if (Math.abs(a[0] - b[0]) < 2 || used.has(a.join()) || used.has(b.join())) continue;
    used.add(a.join());
    used.add(b.join());
    out.push([a, b]);
  }
  return out;
})();
function cordPath([a, b]) {
  const p = jack(...a);
  const q = jack(...b);
  const sag = 6 + Math.abs(a[0] - b[0]) * 2.2;
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = p[0] + (q[0] - p[0]) * t;
    const z = p[2] + (q[2] - p[2]) * t - Math.sin(Math.PI * t) * sag;
    pts.push(at([x, FACE_Y + 0.9 + Math.sin(Math.PI * t) * 1.6, z]));
  }
  return k.pathOf(pts);
}
function panel() {
  const out = [];
  for (const x of [PANEL.x + 8, PANEL.x + PANEL.w - 16]) {
    out.push(S(k.slabOf({ x, y: PANEL.y - 4, w: 8, d: PANEL.d + 10, r: 1.2 }, 0, PANEL_Z0, P, 3, 0.4), { tone: "mid" }));
  }
  const seam = L(k.sideSeam(PANEL, PANEL_TOP - 14, P, 2), { tone: "faint" });
  out.push(S(k.slabOf(PANEL, PANEL_Z0, PANEL_TOP - PANEL_Z0, P, 2, 0.4), { tone: "mid", inner: seam }));
  out.push(plateY(PANEL.x + PANEL.w / 2, FACE_Y, PANEL_TOP - 7, `${badge(4)}  DEPENDENCY MAP`, 4.6));
  const jacks = [];
  for (const c of seq(JACK_COLS)) for (const r of seq(JACK_ROWS)) jacks.push(jack(c, r));
  out.push(L(jacks.map((j) => k.sideRing(j, 1.5, "y", P, 18)).join(""), { tone: "lo" }));
  out.push(D(jacks.map(at), { size: 0.55, tone: "mid" }));
  // the field is wired up one cord per source member (live toggles them)
  out.push(`<g data-part="cords">${CORDS.map((c, i) => `<path class="iso-line" data-cord="${i}" data-tone="mid" d="${cordPath(c)}" style="display:none"/>`).join("")}</g>`);
  out.push(D([PANEL.x + 4, PANEL.x + PANEL.w - 4].flatMap((x) => [at([x, FACE_Y, PANEL_TOP - 3]), at([x, FACE_Y, PANEL_Z0 + 3])]), { size: 0.45 }));
  return out.join("");
}

/* ---------- 03 RAG index: a card-index cabinet ---------- */
function cabinet() {
  const out = [halo(CAB, 0, 2, 4)];
  out.push(S(k.slabOf(CAB, 0, CAB_H, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(CAB, CAB_H - 3, P, 3), { tone: "faint" }) }));
  const fy = CAB.y + CAB.d;
  DRAWERS.forEach((z, i) => {
    if (i === 1) return; // the live drawer is drawn on its own
    out.push(drawerFront(z, 0));
  });
  out.push(L(k.planOutline(k.insetPlan(CAB, 4), CAB_H, P, 3), { tone: "faint" }));
  out.push(D(k.corners(CAB, 2.2).map(([x, y]) => at([x, y, CAB_H])), { size: 0.42 }));
  out.push(plateY(CAB.x + CAB.w / 2, fy, CAB_H - 6.5, `${badge(3)} RAG INDEX`, 4.2, 2));
  out.push(`<g data-part="rag-lamp">${D([at([CAB.x + CAB.w - 6, fy - 4, CAB_H])], { size: 0.8, tone: "faint" })}</g>`);
  return out.join("");
}
function drawerFront(z, open) {
  const fy = CAB.y + CAB.d;
  const out = [];
  if (open > 0.05) {
    const box = { x: CAB.x + 4, y: fy, w: CAB.w - 8, d: open, r: 0.3 };
    out.push(S(k.slabOf(box, z + 0.8, DRAWER_H - 2.6, P, 2), { tone: "mid", crease: "none" }));
    // index cards standing in the drawer, tab rows across
    const lines = [];
    for (let y = fy + 2.2; y < fy + open - 1; y += 2.2) lines.push(k.lineOnTop([box.x, y], [box.x + box.w, y], z + DRAWER_H - 1.8, P));
    if (lines.length) out.push(L(lines.join(""), { tone: "lo" }));
  }
  const front = { x: CAB.x + 2.4, y: fy + open, w: CAB.w - 4.8, d: 1.2, r: 0.5 };
  out.push(S(k.slabOf(front, z, DRAWER_H, P, 2, 0.3), { tone: "mid" }));
  const pull = { x: CAB.x + CAB.w / 2 - 6, y: fy + open + 1.2, w: 12, d: 1.4, r: 0.6 };
  out.push(S(k.slabOf(pull, z + 3.4, 1.6, P, 2), { tone: "hi", crease: "lo" }));
  return out.join("");
}

/* ---------- track ---------- */
const railPlan = (y) => ({ x: BED.x + 4, y, w: BED.w - 8, d: 2.4, r: 0.8 });
function bed() {
  return [
    S(k.slabOf(BED, 0, BED_H, P, 4, 0.6), { tone: "mid" }),
    D([BED.x + 3, BED.x + BED.w - 3].flatMap((x) => [at([x, -9, BED_H]), at([x, 9, BED_H])]), { size: 0.42 }),
    S(k.slabOf(railPlan(-11.6), BED_H, RAIL_H - BED_H, P, 3, 0.4), { tone: "mid" }),
    D([-270, -190, -60, 40].map((x) => at([x, -10.4, RAIL_H])), { size: 0.4 }),
  ].join("");
}
function roller(x) {
  const F = G.frameAlong([x, -9.8, AXLE_Z], [0, 1, 0]);
  return [
    S(k.slabOf({ x: x - 2.2, y: -11.2, w: 4.4, d: 1.4, r: 0.4 }, BED_H, AXLE_Z + 1 - BED_H, P, 2), { tone: "mid", crease: "none" }),
    S(G.solidOf([[0, 1], [0.5, 1], [0.5, ROLL_R], [19.1, ROLL_R], [19.1, 1], [19.6, 1]], F, P), { tone: "hi", crease: "lo" }),
    S(k.slabOf({ x: x - 2.2, y: 9.8, w: 4.4, d: 1.4, r: 0.4 }, BED_H, AXLE_Z + 1 - BED_H, P, 2), { tone: "mid", crease: "none" }),
    D([at([x, 10.5, AXLE_Z + 1])], { size: 0.38 }),
  ].join("");
}
function nearRail() {
  return [
    S(k.slabOf(railPlan(9.2), BED_H, RAIL_H - BED_H, P, 3, 0.4), { tone: "mid" }),
    D([-270, -190, -60, 40].map((x) => at([x, 10.4, RAIL_H])), { size: 0.4 }),
  ].join("");
}

/* ---------- the card (built at x = 0) ---------- */
const cardRing = () => {
  const { w, d } = CARD;
  const c = 2;
  return [[-w / 2 + c, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2], [-w / 2, -d / 2 + c]];
};
function holes(z, seed) {
  let s = seed;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [];
  for (let col = 0; col < 26; col++) {
    const x = -CARD.w / 2 + 3 + col * 1.0;
    const rows = rand() < 0.7 ? [Math.floor(rand() * 10)] : [Math.floor(rand() * 10), Math.floor(rand() * 10)];
    for (const row of rows) out.push(k.planOutline({ x: x - 0.2, y: -CARD.d / 2 + 2 + row * 1.2, w: 0.4, d: 0.7, r: 0.1 }, z, P, 1));
  }
  return out.join("");
}
function card() {
  const top = TRACK_Z + CARD_T * 2;
  return [
    S(k.extrude(cardRing(), TRACK_Z, CARD_T * 2, P), { tone: "hi", crease: "lo" }),
    L(holes(top, 97), { tone: "lo" }),
    L(k.lineOnTop([-CARD.w / 2 + 1.4, -CARD.d / 2 + 1], [CARD.w / 2 - 1.4, -CARD.d / 2 + 1], top, P), { tone: "faint", free: true }),
  ].join("");
}

/* ---------- 01 source hoppers ---------- */
const hopPlan = (cx) => ({ x: cx - CARD.w / 2, y: -CARD.d / 2, w: CARD.w, d: CARD.d, r: 0.5 });
const postsOf = (cx) => {
  const h = hopPlan(cx);
  return [[h.x - 2.2, h.y - 2.2], [h.x + h.w + 2.2, h.y - 2.2], [h.x - 2.2, h.y + h.d + 2.2], [h.x + h.w + 2.2, h.y + h.d + 2.2]];
};
const isFront = (cx) => ([x, y]) => x > cx + CARD.w / 2 || y > CARD.d / 2;
const deckTop = (left) => STACK_Z + left * CARD_T;
const deckSvg = (cx, left) => {
  if (left <= 0) return "";
  const plan = { x: cx - CARD.w / 2, y: -CARD.d / 2, w: CARD.w, d: CARD.d, r: 0.5 };
  const top = STACK_Z + left * CARD_T;
  const seams = [];
  for (let z = STACK_Z + 5; z < top - 1; z += 5) seams.push(sideSeam(plan, z, P, 2));
  return solidSvg(slabOf(plan, STACK_Z, top - STACK_Z, P, 2), { tone: "hi", crease: "lo", inner: lineSvg(seams.join(""), { tone: "faint" }) });
};
function post([x, y]) {
  return [
    S(k.cylinder(x, y, 2.2, BED_H, 1.8, P, 18), { tone: "mid" }),
    S(k.cylinder(x, y, 1.3, BED_H + 1.8, POST_TOP - BED_H - 1.8, P, 14), { tone: "mid", crease: "none" }),
    S(k.cylinder(x, y, 1.9, POST_TOP, 1.4, P, 18), { tone: "mid" }),
  ].join("");
}
function hopperBack(cx) {
  const plate = { x: cx - CARD.w / 2 - 4, y: -11, w: CARD.w + 4, d: 22, r: 1 };
  return S(k.slabOf(plate, BED_H, TRACK_Z - BED_H, P, 3, 0.3), { tone: "mid" }) + byDepth(postsOf(cx).filter((p) => !isFront(cx)(p))).map(post).join("");
}
function follower() {
  const plan = k.insetPlan({ x: -CARD.w / 2, y: -CARD.d / 2, w: CARD.w, d: CARD.d, r: 0.5 }, 1.2);
  return [
    S(k.slabOf(plan, 0, 3.4, P, 3, 0.4), { tone: "mid" }),
    L(k.planOutline(k.insetPlan(plan, 2), 3.4, P, 2), { tone: "faint" }),
    S(k.cylinder(0, 0, 2.6, 3.4, 2.6, P, 22), { tone: "mid" }),
    L(k.knurl(0, 0, 2.6, 3.4, 6, 18, P), { tone: "lo" }),
  ].join("");
}
function hopperFront(cx) {
  const gx = cx + CARD.w / 2 + 0.4;
  return [
    S(k.slabOf({ x: gx, y: -CARD.d / 2 - 1, w: 1.4, d: CARD.d + 2, r: 0.3 }, STACK_Z + 1.2, 18, P, 2, 0.3), { tone: "mid" }),
    D([at([gx + 1.4, -4, STACK_Z + 16]), at([gx + 1.4, 4, STACK_Z + 16])], { size: 0.4 }),
    byDepth(postsOf(cx).filter(isFront(cx))).map(post).join(""),
  ].join("");
}
function placard(xc, y, text) {
  // a nameplate on a small stand, in front of the station it names
  return [
    S(k.slabOf({ x: xc - 6, y: y - 2, w: 12, d: 4, r: 0.8 }, 0, 1.4, P, 2), { tone: "mid" }),
    S(k.slabOf({ x: xc - 1.2, y: y - 0.6, w: 2.4, d: 1.2, r: 0.4 }, 1.4, 1.6, P, 2), { tone: "mid", crease: "none" }),
    plateY(xc, y, 6.2, text, 4, 2),
  ].join("");
}
function sourcePlaques() {
  // one placard per deck on a stand in front of the track
  const out = [];
  const y = 15;
  for (const [i, cx] of HOPPERS.entries()) {
    const name = SOURCES[i].name;
    out.push(S(k.slabOf({ x: cx - 6, y: y - 2, w: 12, d: 4, r: 0.8 }, 0, 1.6, P, 2), { tone: "mid" }));
    out.push(S(k.slabOf({ x: cx - 1.2, y: y - 0.6, w: 2.4, d: 1.2, r: 0.4 }, 1.6, 2.4, P, 2), { tone: "mid", crease: "none" }));
    out.push(plateY(cx, y, 7.4, name, 4.2, 2));
  }
  out.push(plateY(HOPPERS[1], 25, 2.9, `${badge(1)}  SOURCE DECKS`, 3.6, 2));

  return out.join("");
}

/* ---------- 02 AI parser bridge ---------- */
function upright(y) {
  const foot = { x: X_READ - 9, y: y - 2, w: 18, d: 8, r: 1.2 };
  const leg = { x: X_READ - 5, y, w: 10, d: 4, r: 0.8 };
  return [
    S(k.slabOf(foot, 0, 2.4, P, 3, 0.4), { tone: "mid" }),
    D([at([X_READ - 6, y + 2, 2.4]), at([X_READ + 6, y + 2, 2.4])], { size: 0.42 }),
    S(k.slabOf(leg, 2.4, BEAM_Z - 2.4, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(leg, 18, P, 3), { tone: "faint" }) }),
  ].join("");
}
function beam() {
  const plan = { x: X_READ - 7, y: BRIDGE_Y[0] - 1, w: 14, d: BRIDGE_Y[1] - BRIDGE_Y[0] + 6, r: 1.2 };
  const top = BEAM_Z + BEAM_H;
  const out = [S(k.slabOf(plan, BEAM_Z, BEAM_H, P, 3, 0.6), { tone: "mid" })];
  out.push(L(k.planOutline({ x: X_READ - 3, y: plan.y + 3, w: 6, d: plan.d - 6, r: 1 }, top, P, 2), { tone: "faint" }));
  out.push(D([plan.y + 1.6, plan.y + plan.d - 1.6].flatMap((y) => [at([X_READ - 4.5, y, top]), at([X_READ + 4.5, y, top])]), { size: 0.42 }));
  const knob = [X_READ, BRIDGE_Y[0] + 2.4];
  out.push(S(k.cylinder(knob[0], knob[1], 3.4, top, 3.2, P, 26), { tone: "mid" }));
  out.push(L(k.knurl(knob[0], knob[1], 3.4, top, top + 3.2, 24, P), { tone: "lo" }));
  out.push(L(k.lineOnTop(knob, [knob[0] + 3, knob[1]], top + 3.2, P), { tone: "hi" }));
  return out.join("");
}
function head() {
  const body = { x: X_READ - 8, y: -6, w: 16, d: 12, r: 1.4 };
  return [
    S(k.slabOf({ x: X_READ - 5, y: -4, w: 10, d: 8, r: 1 }, HEAD_Z + 8, BEAM_Z - HEAD_Z - 8, P, 3), { tone: "mid", crease: "none" }),
    S(k.slabOf(body, HEAD_Z, 8, P, 4, 0.5), { tone: "mid", inner: L(k.sideSeam(body, HEAD_Z + 2.4, P, 4), { tone: "faint" }) }),
    L(k.planOutline({ x: X_READ - 5.6, y: -3.4, w: 2.2, d: 6.8, r: 1.1 }, HEAD_Z + 8, P, 3), { tone: "lo" }),
    L(k.planOutline({ x: X_READ - 2.2, y: -3.4, w: 2.2, d: 6.8, r: 1.1 }, HEAD_Z + 8, P, 3), { tone: "lo" }),
    D([at([X_READ + 5, -3.4, HEAD_Z + 8]), at([X_READ + 5, 3.4, HEAD_Z + 8])], { size: 0.42 }),
    S(k.cylinder(X_READ, 0, 4.4, LENS_Z + 4, HEAD_Z - LENS_Z - 4, P, 30), { tone: "mid" }),
    L(k.knurl(X_READ, 0, 4.4, LENS_Z + 4, HEAD_Z, 28, P), { tone: "lo" }),
    S(k.cylinder(X_READ, 0, 3.2, LENS_Z, 4, P, 30, 0.4), { tone: "hi", lit: true }),
  ].join("");
}

/* ---------- 05 doc generator ---------- */
function generator() {
  const out = [halo(GEN, 0, 2, 4)];
  for (const [x, y] of byDepth(k.corners(GEN, 5))) out.push(S(k.cylinder(x, y, 2.6, 0, 1.6, P, 16), { tone: "lo" }));
  out.push(S(k.slabOf(GEN, 1.6, GEN_H - 1.6, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(GEN, GEN_H - 9, P, 4), { tone: "faint" }) }));
  const top = GEN_H;
  const panel = { x: GEN.x + 30, y: GEN.y + 8, w: 16, d: 44, r: 2 };
  out.push(L(k.planOutline(panel, top, P, 3), { tone: "lo" }));
  out.push(S(k.cylinder(panel.x + 8, panel.y + 32, 2.8, top, 1.6, P, 22), { tone: "mid" }));
  out.push(S(k.cylinder(panel.x + 8, panel.y + 23, 2.8, top, 1.6, P, 22), { tone: "mid" }));
  out.push(L(k.ring(panel.x + 8, panel.y + 11, 1.6, top, P, 16), { tone: "lo" }));
  out.push(`<g data-part="gen-lamp">${D([at([panel.x + 8, panel.y + 11, top])], { size: 0.7, tone: "faint" })}</g>`);
  out.push(D(k.corners(GEN, 3.2).map(([x, y]) => at([x, y, top])), { size: 0.45 }));
  for (let i = 0; i < 6; i++) out.push(L(k.planOutline({ x: GEN.x + 6 + i * 3.6, y: GEN.y + 10, w: 1.4, d: 20, r: 0.7 }, top, P, 2), { tone: "lo" }));
  const faceY = GEN.y + GEN.d;
  const face = k.sideMatrix([GEN.x, faceY], GEN_H, P, "left");
  out.push(
    `<g transform="${face}"><rect x="6" y="15" width="20" height="9" rx="1" class="iso-window"/>` +
      `<text x="16" y="21.6" class="iso-counter" text-anchor="middle" data-part="counter">000</text></g>`,
  );
  out.push(plateY(GEN.x + GEN.w / 2, faceY, GEN_H - 4.6, `${badge(5)} DOC GENERATOR`, 3.6, 1.8));
  out.push(plateY(GEN.x + 39, faceY, GEN_H - 20.5, "MEMBERS", 2.6, 1.4));
  const side = k.sideMatrix([GEN.x + GEN.w, GEN.y + GEN.d], GEN_H, P, "right");
  out.push(`<g transform="${side}"><rect x="${GEN.d / 2 - SHEET.d / 2 - 2}" y="${GEN_H - SLOT_Z - 1.1}" width="${SHEET.d + 4}" height="2" rx="1" class="iso-slot"/></g>`);
  return out.join("");
}

/* ---------- 06 output sorter ---------- */
function sorterBack() {
  const out = [];
  const x0 = pocketX(0) - 2;
  const x1 = pocketX(OUTPUTS.length) + 2;
  const wall = { x: x0, y: POCKET.y - 3, w: x1 - x0, d: 3, r: 0.8 };
  out.push(halo({ x: x0, y: POCKET.y - 3, w: x1 - x0, d: POCKET.d + 6, r: 2 }, 0, 2, 4));
  out.push(S(k.slabOf(wall, 0, RAIL_Z - 3, P, 2, 0.4), { tone: "mid", inner: L(k.sideSeam(wall, 8, P, 2), { tone: "faint" }) }));
  const rail = { x: x0 - 14, y: POCKET.y - 4, w: x1 - x0 + 14, d: 5, r: 1 };
  out.push(S(k.slabOf(rail, RAIL_Z - 3, 3, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: rail.x, y: rail.y - 1, w: 5, d: 7, r: 1 }, 0, RAIL_Z - 3, P, 2, 0.4), { tone: "mid" }));
  out.push(L(k.lineOnTop([rail.x, rail.y + 2.5], [rail.x + rail.w, rail.y + 2.5], RAIL_Z, P), { tone: "faint" }));
  out.push(D(seq(OUTPUTS.length + 1).map((i) => at([pocketX(i), rail.y + 1, RAIL_Z])), { size: 0.4 }));
  return out.join("");
}
function pocket(i) {
  const x0 = pocketX(i);
  const out = [];
  const floor = { x: x0 + 1, y: POCKET.y, w: POCKET_W - 2, d: POCKET.d, r: 1 };
  out.push(S(k.slabOf(floor, POCKET_FLOOR - 1.2, 1.2, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x0 + 3, y: -4, w: POCKET_W - 6, d: 8, r: 1 }, 0, POCKET_FLOOR - 1.2, P, 2), { tone: "lo" }));
  out.push(`<g data-part="pile-${i}"></g>`);
  out.push(`<g data-part="top-${i}" transform="${k.translateAlong(P, [0, 0, 0])}">${topSheet(i)}</g>`);
  return out.join("");
}
function divider(i) {
  const x = pocketX(i) - 0.6;
  return S(k.slabOf({ x, y: POCKET.y, w: 1.2, d: POCKET.d, r: 0.3 }, 0, WALL_H, P, 2), { tone: "mid", crease: "none" });
}
function frontPlate(i) {
  const x0 = pocketX(i);
  const lip = { x: x0 + 1, y: POCKET.y + POCKET.d, w: POCKET_W - 2, d: 1.2, r: 0.3 };
  return [
    S(k.slabOf(lip, 0, 7.4, P, 2, 0.3), { tone: "mid" }),
    k.faceTextSvg(k.sideMatrix([x0 + POCKET_W / 2, lip.y + lip.d], 3.6, P, "left"), OUTPUTS[i], { size: 3.6, tone: "hi", anchor: "middle" }),
  ].join("");
}
// the drawing on the top sheet of each pocket says what kind of output it is
const SH = (i) => ({ x: pocketCentre(i) - SHEET.w / 2, y: -SHEET.d / 2 - 1, w: SHEET.w, d: SHEET.d, r: 0.3 });
function topSheet(i) {
  const s = SH(i);
  const z = PILE_Z + SHEET_T * 2;
  const X = (u) => s.x + u;
  const Y = (v) => s.y + v;
  const out = [S(k.slabOf(s, PILE_Z, SHEET_T * 2, P, 2), { tone: "hi", crease: "lo" })];
  const line = (a, b) => k.lineOnTop([X(a[0]), Y(a[1])], [X(b[0]), Y(b[1])], z, P);
  const box = (u, v, w, d) => k.planOutline({ x: X(u), y: Y(v), w, d, r: 0.4 }, z, P, 1);
  const kind = OUTPUTS[i];
  if (kind === "CALL GRAPH") {
    const nodes = [[11, 4], [5, 10], [17, 10], [3, 17], [9, 17], [15, 17], [19, 20]];
    const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [4, 5]];
    out.push(L(edges.map(([a, b]) => line(nodes[a], nodes[b])).join(""), { tone: "lo" }));
    out.push(D(nodes.map(([u, v]) => at([X(u), Y(v), z])), { size: 0.75, tone: "hi" }));
  } else if (kind === "CRUD MATRIX") {
    const g = { u: 3, v: 4, w: 16, d: 16 };
    const rows = [];
    for (let r = 1; r < 4; r++) rows.push(line([g.u, g.v + r * 4], [g.u + g.w, g.v + r * 4]));
    for (let c = 1; c < 4; c++) rows.push(line([g.u + c * 4, g.v], [g.u + c * 4, g.v + g.d]));
    out.push(L(box(g.u, g.v, g.w, g.d) + rows.join(""), { tone: "lo" }));
    const marks = [[0, 0], [1, 2], [2, 1], [3, 3], [0, 3], [2, 2]];
    out.push(D(marks.map(([c, r]) => at([X(g.u + c * 4 + 2), Y(g.v + r * 4 + 2), z])), { size: 0.6, tone: "hi" }));
  } else if (kind === "JOB FLOW") {
    const steps = [3, 9, 15];
    out.push(L(steps.map((v) => box(6, v, 10, 3.4)).join("") + line([11, 6.4], [11, 9]) + line([11, 12.4], [11, 15]), { tone: "lo" }));
    out.push(L(line([16, 16.7], [19, 16.7]) + line([19, 16.7], [19, 21]) + box(14, 21, 7, 2), { tone: "lo" }));
  } else if (kind === "BIZ RULES") {
    const rows = [[3, 14], [5.5, 16], [8, 12], [11.5, 15], [14, 16], [16.5, 10], [20, 14]];
    out.push(L(rows.map(([v, len]) => line([3, v], [3 + len, v])).join(""), { tone: "lo", free: true }));
    out.push(D([3, 11.5].map((v) => at([X(2), Y(v), z])), { size: 0.5, tone: "hi" }));
  } else if (kind === "SAD · AID") {
    out.push(L(box(3, 3, 7, 5) + box(12, 3, 7, 5) + box(7.5, 12, 7, 5) + line([6.5, 8], [9.5, 12]) + line([15.5, 8], [12.5, 12]), { tone: "lo" }));
    out.push(L([19.5, 21.5].map((v) => line([3, v], [19, v])).join(""), { tone: "lo", free: true }));
  } else {
    const rows = [[3, 0, 12], [5.5, 2, 10], [8, 4, 9], [10.5, 4, 11], [13, 2, 6], [15.5, 2, 12], [18, 4, 8], [20.5, 0, 4]];
    out.push(L(rows.map(([v, ind, len]) => line([3 + ind, v], [3 + ind + len, v])).join(""), { tone: "lo", free: true }));
  }
  return out.join("");
}
function shuttle() {
  // built at x = 0 on the rail; carries one document set
  const y0 = POCKET.y - 4;
  const out = [];
  out.push(S(k.slabOf({ x: -7, y: y0 - 1, w: 14, d: 7, r: 1 }, RAIL_Z, 5, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -3, y: y0 + 4, w: 6, d: 16, r: 0.8 }, RAIL_Z + 1, 3, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(0, y0 + 18, 2, RAIL_Z - 7, 8, P, 18), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: -SHEET.w / 2 - 1, y: y0 + 18 - 4, w: SHEET.w + 2, d: 8, r: 1 }, RAIL_Z - 9, 2, P, 2, 0.3), { tone: "mid" }));
  out.push(`<g data-part="carried">${S(k.slabOf({ x: -SHEET.w / 2, y: -SHEET.d / 2 - 1, w: SHEET.w, d: SHEET.d, r: 0.3 }, RAIL_Z - 10.2, 0.8, P, 2), { tone: "hi", crease: "lo" })}</g>`);
  out.push(`<g data-part="shuttle-lamp">${D([at([4, y0 + 2.5, RAIL_Z + 5])], { size: 0.7, tone: "faint" })}</g>`);
  out.push(D([at([-4, y0 + 2.5, RAIL_Z + 5])], { size: 0.42 }));
  return out.join("");
}

/* ---------- clip for a card entering the generator, sheet leaving it ---------- */
const exitClip = (() => {
  const a = at([GEN.x + GEN.w, -400, SLOT_Z]);
  const b = at([GEN.x + GEN.w, 400, SLOT_Z]);
  const far = at([GEN.x + GEN.w + 900, 0, SLOT_Z]);
  const dx = far[0] - (a[0] + b[0]) / 2;
  const dy = far[1] - (a[1] + b[1]) / 2;
  return `M${[a, b, [b[0] + dx, b[1] + dy], [a[0] + dx, a[1] + dy]].map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}Z`;
})();

/* ---------- assemble ---------- */
const sortedRollers = byDepth(ROLLERS, (x) => [x, 0]);
const sortedHoppers = byDepth(HOPPERS.map((cx, i) => ({ cx, i })), ({ cx }) => [cx, 0]);
const pocketsByDepth = byDepth(seq(OUTPUTS.length), (i) => [pocketCentre(i), 0]);
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "A modernization workbench. Three card decks, labelled COBOL, JCL and COPYBOOK, feed source members onto a roller track. An AI parser bridge scans each card while a RAG index cabinet files it in a drawer and a patch panel labelled dependency map gains a new cord. The card enters a doc generator with a member counter, and a shuttle carries the result along six labelled pockets: call graph, CRUD matrix, job flow, business rules, SAD and AID, and Java story, each topped by a sheet drawn in its own kind.",
  body: [
    `<defs><clipPath id="mb-exit"><path d="${exitClip}"/></clipPath></defs>`,
    base(),
    panel(),
    cabinet(),
    `<g data-part="drawer">${drawerFront(DRAWERS[1], 0)}</g>`,
    bed(),
    upright(BRIDGE_Y[0]),
    sortedRollers.map(roller).join(""),
    sortedHoppers.map(({ cx }) => hopperBack(cx)).join(""),
    `<g data-part="card" transform="${k.translateAlong(P, [HOPPERS[0], 0, 0])}">${card()}</g>`,
    sortedHoppers
      .map(({ cx, i }) => `<g data-part="deck-${i}"></g><g data-part="follower-${i}" transform="${k.translateAlong(P, [cx, 0, deckTop(SOURCES[i].cards)])}">${follower()}</g>${hopperFront(cx)}`)
      .join(""),
    nearRail(),
    sourcePlaques(),
    `<g data-part="spot" opacity="0">${L(k.ring(X_READ, 0, 3.2, TRACK_Z + CARD_T * 2, P, 30), { tone: "lit" })}${L(k.ring(X_READ, 0, 5.8, TRACK_Z + CARD_T * 2, P, 40), { tone: "lit", dotted: true })}</g>`,
    beam(),
    `<g data-part="head">${head()}</g>`,
    upright(BRIDGE_Y[1]),
    generator(),
    sorterBack(),
    pocketsByDepth.map((i) => pocket(i)).join(""),
    seq(OUTPUTS.length + 1).map(divider).join(""),
    `<g data-part="shuttle" transform="${k.translateAlong(P, [SHUTTLE_HOME, 0, 0])}">${shuttle()}</g>`,
    seq(OUTPUTS.length).map(frontPlate).join(""),
    placard(X_READ, 34, `${badge(2)}  AI PARSER · LLM`),
    placard(pocketX(3), 38, `${badge(6)}  OUTPUTS · AI-GENERATED`),
  ],
});

/* ---------- live ---------- */
const live = `
(() => {
const root = document.querySelector('[data-figure="modernization"]');
if (!root) return;
const P = ${JSON.stringify(P)};
const SOURCES = ${JSON.stringify(SOURCES)}, OUTPUTS = ${JSON.stringify(OUTPUTS)};
const HOPPERS = ${JSON.stringify(HOPPERS)}, CARD = ${JSON.stringify(CARD)};
const CARD_T = ${CARD_T}, SHEET_T = ${SHEET_T}, STACK_Z = ${STACK_Z}, PILE_Z = ${PILE_Z};
const X_READ = ${X_READ}, X_GONE = ${X_GONE}, SCAN = ${SCAN}, DRAWER_OPEN = ${DRAWER_OPEN};
const SHUTTLE_HOME = ${SHUTTLE_HOME}, SHUTTLE_END = ${SHUTTLE_END}, POCKET_X0 = ${POCKET_X0}, POCKET_W = ${POCKET_W};
const CAB = ${JSON.stringify(CAB)}, DRAWER_Z = ${DRAWERS[1]}, DRAWER_H = ${DRAWER_H};
const CORDS = ${CORDS.length}, SHEET = ${JSON.stringify(SHEET)};
const SH = ${SH.toString()};
const pocketCentre = (i) => POCKET_X0 + POCKET_W * i + POCKET_W / 2;
const deckTop = ${deckTop.toString()};
const deckSvg = ${deckSvg.toString()};
const drawerFront = ${drawerFront.toString().replace(/\bk\.|\bS\(|\bL\(|\bD\(/g, (m) => ({ "k.": "", "S(": "solidSvg(", "L(": "lineSvg(", "D(": "dotsSvg(" })[m])};
const at = (p) => iso(p, P);
const stage = root.querySelector(".iso-stage");
const part = (name) => root.querySelector('[data-part="' + name + '"]');
const cardEl = part("card"), headEl = part("head"), spotEl = part("spot"), drawerEl = part("drawer");
const shuttleEl = part("shuttle"), carriedEl = part("carried"), counterEl = part("counter");
const lamps = { rag: part("rag-lamp"), gen: part("gen-lamp"), shuttle: part("shuttle-lamp") };
const decks = SOURCES.map((_, i) => part("deck-" + i)), followers = SOURCES.map((_, i) => part("follower-" + i));
const piles = OUTPUTS.map((_, i) => part("pile-" + i)), tops = OUTPUTS.map((_, i) => part("top-" + i));
const cords = [...root.querySelectorAll("[data-cord]")];
const readout = root.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const ease = (t) => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const span = (u, a, b) => ease((u - a) / (b - a));
const PHASES = [[0.24, "feeding"], [0.4, "AI parsing"], [0.5, "indexing in RAG"], [0.6, "mapping dependencies"], [0.7, "generating docs"], [1, "sorting outputs"]];

let n = 0, u = 0, hovering = false, paused = false, visible = false, frame = 0, last = 0;
const fedFrom = [0, 0, 0];
const filed = OUTPUTS.map(() => 0);
const shown = { decks: [-1, -1, -1], piles: OUTPUTS.map(() => -1), drawer: -1, cords: -1, counter: -1 };
const pad = (v) => String(v).padStart(3, "0");
const sourceOf = (m) => m % SOURCES.length;

function setLamp(el, on) { if (el) el.dataset.on = on ? "1" : ""; }
function draw() {
  const src = sourceOf(n);
  const hx = HOPPERS[src];
  // card: feed from its deck, read, then into the generator
  const cx = u < 0.24 ? hx + (X_READ - hx) * span(u, 0.02, 0.24) : u < 0.5 ? X_READ : X_READ + (X_GONE - X_READ) * span(u, 0.5, 0.66);
  cardEl.setAttribute("transform", translateAlong(P, [cx, 0, 0]));
  cardEl.style.display = u < 0.66 ? "" : "none";
  SOURCES.forEach((s, i) => {
    const left = s.cards - (fedFrom[i] % s.cards) - (i === src && u > 0.02 ? 1 : 0);
    if (left !== shown.decks[i]) { shown.decks[i] = left; decks[i].innerHTML = deckSvg(HOPPERS[i], left); }
    followers[i].setAttribute("transform", translateAlong(P, [HOPPERS[i], 0, deckTop(Math.max(left, 0))]));
  });
  // parser head scans across the card
  const reading = u >= 0.24 && u < 0.4;
  const r = reading ? (u - 0.24) / 0.16 : 0;
  const hy = reading ? -SCAN * Math.cos(r * Math.PI * 2) : -SCAN;
  headEl.setAttribute("transform", translateAlong(P, [0, hy, 0]));
  spotEl.setAttribute("transform", translateAlong(P, [0, hy, 0]));
  spotEl.setAttribute("opacity", reading ? String(Math.min(1, Math.sin(r * Math.PI) * 2.2)) : "0");
  // RAG drawer slides out, files the member, closes
  const open = Math.round(DRAWER_OPEN * (span(u, 0.38, 0.44) - span(u, 0.47, 0.53)) * 4) / 4;
  if (open !== shown.drawer) { shown.drawer = open; drawerEl.innerHTML = drawerFront(DRAWER_Z, open); }
  setLamp(lamps.rag, u >= 0.38 && u < 0.53);
  // a new cord on the dependency map
  const wired = (n % (CORDS + 1)) + (u >= 0.52 ? 1 : 0);
  if (wired !== shown.cords) {
    shown.cords = wired;
    cords.forEach((c, i) => {
      c.style.display = i < Math.min(wired, CORDS) ? "" : "none";
      c.dataset.tone = i === wired - 1 ? "lit" : "mid";
    });
  }
  setLamp(lamps.gen, u >= 0.58 && u < 0.72);
  // the shuttle takes a document set from the slot and drops one sheet per pocket
  const sx = u < 0.12 ? SHUTTLE_END + (SHUTTLE_HOME - SHUTTLE_END) * span(u, 0, 0.12) : u < 0.7 ? SHUTTLE_HOME : SHUTTLE_HOME + (SHUTTLE_END - SHUTTLE_HOME) * span(u, 0.7, 0.98);
  shuttleEl.setAttribute("transform", translateAlong(P, [sx, 0, 0]));
  const carrying = u >= 0.68 && sx < pocketCentre(OUTPUTS.length - 1) + 1;
  carriedEl.style.display = carrying ? "" : "none";
  setLamp(lamps.shuttle, carrying);
  OUTPUTS.forEach((_, i) => {
    const count = filed[i] + (u >= 0.7 && sx >= pocketCentre(i) ? 1 : 0);
    if (count === shown.piles[i]) return;
    shown.piles[i] = count;
    const s = SH(i);
    piles[i].innerHTML = count > 1 ? solidSvg(slabOf(s, PILE_Z, (count - 1) * SHEET_T, P, 2), { tone: "hi", crease: "lo" }) : "";
    tops[i].setAttribute("transform", translateAlong(P, [0, 0, count > 0 ? (count - 1) * SHEET_T : 0]));
    tops[i].style.display = count > 0 ? "" : "none";
  });
  const docs = n + (u >= 0.66 ? 1 : 0);
  if (docs !== shown.counter) { shown.counter = docs; counterEl.textContent = pad(docs % 1000); }
  const phase = PHASES.find(([end]) => u < end)[1];
  const text = "member " + pad(n + 1) + " · " + SOURCES[src].name + " · " + phase;
  if (readout && readout.textContent !== text) readout.textContent = text;
}
function advance(du) {
  u += du;
  while (u >= 1) {
    u -= 1;
    fedFrom[sourceOf(n)] += 1;
    OUTPUTS.forEach((_, i) => { filed[i] = Math.min(filed[i] + 1, 120); });
    n += 1;
  }
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (!paused && !still.matches) advance(dt / (hovering ? 1.8 : 5.2));
  draw();
  frame = visible && !(paused || still.matches) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointerenter", () => { hovering = true; });
stage.addEventListener("pointerleave", () => { hovering = false; });
stage.addEventListener("pointerdown", (event) => { if (event.pointerType !== "mouse") hovering = !hovering; });
const describe = () => stage.setAttribute("aria-valuetext", n + " source members processed" + (paused ? ", paused" : ""));
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") advance(1 - u);
  else if (event.key === " " || event.key === "Enter") paused = !paused;
  else return;
  event.preventDefault();
  stage.setAttribute("aria-valuenow", String(n));
  describe();
  draw();
  run();
});
// start with a few members already through, so every pocket shows its kind of output
for (let i = 0; i < 4; i++) advance(1);
describe();
draw();
})();
`;

const EXTRA_CSS = `
.iso-window{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke}
.iso-slot{fill:var(--anatomy-shade-0);stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke}
.iso-counter{fill:var(--anatomy-lit);font-family:var(--anatomy-mono);font-size:6px;letter-spacing:.08em}
.iso-face-text{font-weight:600}
[data-part$="lamp"][data-on="1"] circle{fill:var(--anatomy-lit);opacity:1}
[data-figure="modernization"] .iso-stage{outline:none;touch-action:pan-y;cursor:default}
[data-figure="modernization"] .iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
`;

const plate = k.plateHtml({
  fig: "Fig 1",
  title: "The modernization bench",
  hint: "Hover to run faster · Space pauses",
  readout: "member 001 · COBOL · feeding",
  keys: [
    { mark: "lit", label: "02 AI parser: an LLM reads code nobody documented" },
    { mark: "raised", label: "01 Source decks: COBOL programs, JCL, copybooks" },
    { mark: "flat", label: "03 RAG index · 04 dependency map · 05 doc generator · 06 output pockets" },
  ],
  caption: `Each card is one source member. The AI parser reads it, files it in a retrieval index and wires its calls, files and jobs into the dependency map; the generator then writes the outputs an Enterprise Analyzer or CAST run would give — call graph, CRUD matrix, job flow, business rules, SAD and AID — plus a Java modernization story, all generated by AI. ${MODULES}+ COBOL modules were assessed this way.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Modernization bench: Space pauses, right arrow runs one member through" aria-valuemin="0" aria-valuenow="0">${svg}</div>`,
});
const figureHtml = `<div class="iso anatomy-fig" data-figure="modernization">${plate}</div>`;
const kitSource = readFileSync(join(HERE, "..", "kit", "iso-kit.mjs"), "utf8").replace(/^export /gm, "");

writeFileSync(join(HERE, "preview.html"), k.pageHtml({ title: "Modernization bench", theme: "dark", body: figureHtml, script: kitSource + live, width: 1000 }).replace("</style>", `${EXTRA_CSS}</style>`));
console.log("wrote preview.html");

if (!process.argv.includes("--preview")) {
  writeFileSync(join(SITE, "css", "iso.css"), (k.ISO_CSS + EXTRA_CSS).trim() + "\n");
  writeFileSync(join(SITE, "js", "modernization.js"), `// Generated by figures/modernization/build.mjs — do not edit.\n${kitSource}\n${live}`);
  const index = join(SITE, "index.html");
  const html = readFileSync(index, "utf8");
  const START = "<!-- anatomy:figure -->";
  const END = "<!-- /anatomy:figure -->";
  const from = html.indexOf(START);
  const to = html.indexOf(END);
  if (from < 0 || to < 0) throw new Error("index.html is missing the anatomy:figure markers");
  writeFileSync(index, html.slice(0, from + START.length) + "\n" + figureHtml + "\n" + html.slice(to));
  console.log("updated css/iso.css, js/modernization.js and index.html");
}
