// Orchestrator — renderer, camera rail, particle genome, traveler, post, loop.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { THEMES, CHAPTERS, PARTICLE_COUNT, DUST_COUNT, IS_MOBILE, REDUCED_MOTION } from './config.js';
import { buildAllShapes } from './shapes.js';
import { MorphParticles, makeDust, makeVeins, makeFinaleDNA, FINALE_SPIN } from './particles.js';
import { Traveler } from './character.js';
import { AmbientAudio } from './audio.js';
import { initUI, applyCssTheme } from './ui.js';

window.__appStarted = true; // read by the stuck-preloader fallback in index.html
const state = { p: 0, chapter: -1 };
let themeKey = 'gold';
const theme = () => THEMES[themeKey];

/* ---------- renderer ---------- */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({
  canvas, antialias: true, powerPreference: 'high-performance', stencil: false,
});
const DPR = Math.min(devicePixelRatio, IS_MOBILE ? 1.5 : 2);
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(theme().bg);
scene.fog = new THREE.FogExp2(theme().fog, 0.0042);

const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 400);
camera.position.set(0, 1.5, 82);

/* ---------- environment + lights (for the traveler) ---------- */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();

const key = new THREE.DirectionalLight(0xffd090, 2.6);
key.position.set(6, 8, 4);
const fill = new THREE.DirectionalLight(0x6d86c8, 0.4);
fill.position.set(-6, 2, -3);
const rim = new THREE.DirectionalLight(0xffab45, 2.0);
rim.position.set(-3, 5, -8);
scene.add(key, fill, rim);
// lights follow the camera so the traveler is always lit like a studio shot
const lightRig = new THREE.Group();
scene.remove(key, fill, rim);
lightRig.add(key, fill, rim);
scene.add(lightRig);

/* ---------- camera rail ---------- */
const rail = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 1.5, 82),
  new THREE.Vector3(1.5, 0.5, 45),
  new THREE.Vector3(-2, -0.5, 10),
  new THREE.Vector3(2, 1, -25),
  new THREE.Vector3(0, 2, -58),
  new THREE.Vector3(-12, 6, -88),
  new THREE.Vector3(-17, 4, -132),
  new THREE.Vector3(8, 7, -160),
  new THREE.Vector3(19, 4, -208),
  new THREE.Vector3(-4, 9, -238),
  new THREE.Vector3(-15, 7, -286),
  new THREE.Vector3(4, 1, -318),
  new THREE.Vector3(13, 0, -368),
  new THREE.Vector3(-6, 4, -398),
  new THREE.Vector3(-11, 3, -448),
  new THREE.Vector3(0, 1.5, -481),
], false, 'catmullrom', 0.35);

const lookRail = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 40),
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -40),
  new THREE.Vector3(-4, 1, -78),
  new THREE.Vector3(-26, 5, -110),
  new THREE.Vector3(-14, 3, -148),
  new THREE.Vector3(22, -2, -185),
  new THREE.Vector3(14, 0, -212),
  new THREE.Vector3(-20, 7, -265),
  new THREE.Vector3(-8, 4, -292),
  new THREE.Vector3(16, 0, -345),
  new THREE.Vector3(8, 1, -372),
  new THREE.Vector3(-14, 3, -425),
  new THREE.Vector3(-6, 2, -452),
  new THREE.Vector3(0, 2, -503),
], false, 'catmullrom', 0.35);

/* ---------- world ---------- */
const shapes = buildAllShapes(PARTICLE_COUNT);
const particles = new MorphParticles(scene, shapes, PARTICLE_COUNT, theme(), DPR);
const dust = makeDust(scene, rail, DUST_COUNT, theme(), DPR);
const veins = makeVeins(scene, theme());
const finale = makeFinaleDNA(scene, theme());

function updateFinale(p, t) {
  const finOp = THREE.MathUtils.smoothstep(p, 0.84, 0.96);
  finale.group.visible = finOp > 0.01;
  finale.group.rotation.y = t * FINALE_SPIN;
  finale.uniformsList.forEach((u) => { u.uTime.value = t; u.uOpacity.value = finOp; });
}

const manager = new THREE.LoadingManager();
const traveler = new Traveler(scene, manager, theme());

/* ---------- post ---------- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// grain acts as dither — kills gradient banding without visible noise
const GrainVignette = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 },
    uGrain: { value: 0.028 }, uVig: { value: 0.32 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)) + mod(uTime, 6.2831) * 43.7) * 43758.5453); }
    void main(){
      vec4 col = texture2D(tDiffuse, vUv);
      col.rgb += (hash(vUv * 1913.0) - 0.5) * uGrain;
      float d = distance(vUv, vec2(0.5));
      col.rgb *= smoothstep(0.92, 0.92 - uVig, d * 1.08);
      gl_FragColor = col;
    }`,
};
const grainPass = new ShaderPass(GrainVignette);
composer.addPass(grainPass);
composer.addPass(new OutputPass());

/* ---------- audio + UI ---------- */
const audio = new AmbientAudio();

function onChapter(i) {
  const ch = CHAPTERS[i];
  if (!ch) return;
  traveler.setChapter(ch);
  audio.setChapter(i);
}

function onTheme(key2) {
  themeKey = key2;
  const t = theme();
  applyCssTheme(key2);
  particles.setTheme(t, gsap);
  traveler.setTheme(t, gsap);
  const dc = new THREE.Color(t.main);
  gsap.to(dust.uniforms.uCol.value, { r: dc.r, g: dc.g, b: dc.b, duration: 1.2 });
  const hc = new THREE.Color(t.main);
  veins.uniformsList.forEach((u) =>
    gsap.to(u.uCol.value, { r: hc.r, g: hc.g, b: hc.b, duration: 1.2 }));
  const fh = new THREE.Color(t.hot);
  finale.uniformsList.forEach((u) => {
    gsap.to(u.uCol.value, { r: hc.r, g: hc.g, b: hc.b, duration: 1.2 });
    gsap.to(u.uHot.value, { r: fh.r, g: fh.g, b: fh.b, duration: 1.2 });
  });
  const bg = new THREE.Color(t.bg);
  gsap.to(scene.background, { r: bg.r, g: bg.g, b: bg.b, duration: 1.4 });
  gsap.to(scene.fog.color, { r: bg.r, g: bg.g, b: bg.b, duration: 1.4 });
  const rc = new THREE.Color(t.rim);
  gsap.to(rim.color, { r: rc.r, g: rc.g, b: rc.b, duration: 1.2 });
}

applyCssTheme('gold');
const { lenis } = initUI({ state, onChapter, onTheme, audio });

/* ---------- pointer parallax ---------- */
const pointer = { x: 0, y: 0 };
addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / innerWidth) * 2 - 1;
  pointer.y = (e.clientY / innerHeight) * 2 - 1;
});

/* ---------- preloader ---------- */
let loaded = false;
const counterEl = document.getElementById('counter');
manager.onProgress = (_u, l, t) => {
  const pct = Math.round((l / t) * 100);
  if (counterEl) counterEl.textContent = String(pct).padStart(2, '0');
};

const bootTime = performance.now();
function reveal() {
  if (loaded) return;
  loaded = true;
  const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' } });
  tl.to('#preloader .pre-inner', { opacity: 0, y: -30, duration: 0.6 })
    .to('#preloader', { yPercent: -100, duration: 1.1 }, '-=0.2')
    .set('#preloader', { display: 'none' })
    .from('.hero .line-inner', {
      y: '110%', stagger: 0.09, duration: 1.1, ease: 'power4.out',
    }, '-=0.75')
    .fromTo('.hero .fade-up', { opacity: 0, y: 24 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.9, ease: 'power3.out' }, '-=0.8')
    .add(() => { if (lenis) lenis.start(); });
}

traveler.load()
  .catch((e) => console.error('traveler load failed', e))
  .finally(() => {
    const wait = Math.max(0, 1400 - (performance.now() - bootTime));
    setTimeout(reveal, wait);
  });

/* ---------- loop ---------- */
const clock = new THREE.Clock();
const camState = { p: 0 };
const _pos = new THREE.Vector3(), _look = new THREE.Vector3();
let acc = 0, frames = 0, degraded = false;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.getElapsedTime();

  if (sizeGuard++ % 30 === 0) {
    const s = renderer.getSize(new THREE.Vector2());
    if (Math.abs(s.x - innerWidth) > 1 || Math.abs(s.y - innerHeight) > 1) fitViewport();
  }

  camState.p = THREE.MathUtils.damp(camState.p, state.p, 3.2, dt);
  const p = THREE.MathUtils.clamp(camState.p, 0, 1);

  rail.getPointAt(p, _pos);
  lookRail.getPointAt(p, _look);
  _pos.x += pointer.x * 0.5;
  _pos.y += -pointer.y * 0.32;
  camera.position.copy(_pos);
  camera.lookAt(_look);
  camera.rotation.z += Math.sin(t * 0.23) * 0.008; // breath of hand-held life

  lightRig.position.copy(camera.position);

  particles.update(p, t);
  dust.uniforms.uTime.value = t;

  const veinOp = 1 - THREE.MathUtils.smoothstep(p, 0.10, 0.17);
  veins.group.visible = veinOp > 0.01;
  veins.uniformsList.forEach((u) => { u.uTime.value = t; u.uOpacity.value = veinOp; });

  updateFinale(p, t);

  traveler.update(dt, rail, p, camera, t);

  grainPass.uniforms.uTime.value = t;
  composer.render();

  // watchdog — step down once if we can't hold frame rate
  acc += dt; frames++;
  if (acc >= 2.5) {
    const fps = frames / acc; acc = 0; frames = 0;
    if (fps < 42 && !degraded) {
      degraded = true;
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
      particles.uniforms.uSize.value *= 0.9;
    }
  }
}

if (REDUCED_MOTION) {
  // static composed hero frame; text visible via ui.js
  rail.getPointAt(0.02, _pos);
  lookRail.getPointAt(0.02, _look);
  camera.position.copy(_pos);
  camera.lookAt(_look);
  particles.update(0.02, 1);
  traveler.load?.();
  composer.render();
  document.getElementById('preloader').style.display = 'none';
  if (lenis) lenis.destroy();
} else {
  renderer.setAnimationLoop(tick);
}

document.addEventListener('visibilitychange', () => {
  if (REDUCED_MOTION) return;
  renderer.setAnimationLoop(document.hidden ? null : tick);
  if (!document.hidden) clock.getDelta(); // swallow the time jump
});

function fitViewport() {
  const w = Math.max(innerWidth, 1), h = Math.max(innerHeight, 1);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
}
addEventListener('resize', fitViewport);
// guard: if the page booted in a hidden/zero-size viewport, fix on first real frame
let sizeGuard = 0;

// debug/verification handle (harmless in production)
window.__app = {
  state, camState, renderer, composer, scene, camera, particles, traveler, rail, lookRail,
  frame(p) {
    // render one deterministic frame at story progress p
    state.p = p; camState.p = p;
    const t = clock.getElapsedTime();
    rail.getPointAt(p, _pos); lookRail.getPointAt(p, _look);
    camera.position.copy(_pos); camera.lookAt(_look);
    lightRig.position.copy(camera.position);
    particles.update(p, t);
    dust.uniforms.uTime.value = t;
    const veinOp = 1 - THREE.MathUtils.smoothstep(p, 0.10, 0.17);
    veins.group.visible = veinOp > 0.01;
    veins.uniformsList.forEach((u) => { u.uTime.value = t; u.uOpacity.value = veinOp; });
    updateFinale(p, t);
    if (traveler.ready) traveler.update(1 / 60, rail, p, camera, t);
    grainPass.uniforms.uTime.value = t;
    composer.render();
  },
  shot(w = 900) {
    const src = renderer.domElement;
    const h = Math.round(w * src.height / src.width);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(src, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.72);
  },
};

canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  const el = document.getElementById('context-lost');
  if (el) el.style.display = 'flex';
});
