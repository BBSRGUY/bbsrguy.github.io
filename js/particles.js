// One continuous GPU particle system that morphs between formations.
// position = "from" shape, aTo = next shape; uMorph scrubs the journey with
// per-particle stagger + curl swirl so transitions read as disintegration,
// flight, reintegration.
import * as THREE from 'three';
import { STATIONS } from './config.js';
import { FINALE_DNA } from './shapes.js';

const SNOISE = /* glsl */`
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}`;

export class MorphParticles {
  constructor(scene, shapes, count, theme, pixelRatio) {
    this.shapes = shapes;
    this.count = count;
    this.segment = -1;

    const geo = new THREE.BufferGeometry();
    const seed = new Float32Array(count);
    const size = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seed[i] = Math.random();
      const r = Math.random();
      size[i] = r < 0.85 ? 0.5 + r : 1.6 + Math.random() * 1.8; // few big glows
    }
    geo.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3));
    geo.setAttribute('aTo', new THREE.BufferAttribute(shapes[1].slice(), 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

    const fc = STATIONS[STATIONS.length - 1];
    this.uniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uSize: { value: 42.0 },
      uPR: { value: pixelRatio },
      uOpacity: { value: 1.0 },
      // finale DNA slowly rotates; must match FINALE_SPIN used for the tubes
      uSpin: { value: 0 },
      uSpinCenter: { value: new THREE.Vector2(fc.x, fc.z) },
      uColHot: { value: new THREE.Color(theme.hot) },
      uColMain: { value: new THREE.Color(theme.main) },
      uColDeep: { value: new THREE.Color(theme.deep) },
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: this.uniforms,
      vertexShader: /* glsl */`
        attribute vec3 aTo;
        attribute float aSeed, aSize;
        uniform float uTime, uMorph, uSize, uPR, uSpin;
        uniform vec2 uSpinCenter;
        varying float vA, vSeed, vHot;
        ${SNOISE}
        void main(){
          // per-particle staggered morph
          float t = clamp((uMorph - aSeed * 0.38) / 0.62, 0.0, 1.0);
          t = t * t * (3.0 - 2.0 * t);

          // in the last segment the target is the finale DNA, which rotates
          // in lockstep with its backbone tubes (group.rotation.y = t * spin)
          vec3 to = aTo;
          if (uSpin > 0.001) {
            float ang = uTime * uSpin;
            float cs = cos(ang), sn = sin(ang);
            vec2 d = to.xz - uSpinCenter;
            to.xz = uSpinCenter + vec2(d.x * cs + d.y * sn, -d.x * sn + d.y * cs);
          }
          vec3 p = mix(position, to, t);

          // swirl during transit — particles arc, they don't teleport
          float transit = t * (1.0 - t) * 4.0;
          if (transit > 0.001) {
            vec3 np = p * 0.06 + aSeed * 7.31;
            p += vec3(
              snoise(np + vec3(0.0, uTime * 0.05, 0.0)),
              snoise(np + vec3(31.7, uTime * 0.05, 0.0)),
              snoise(np + vec3(0.0, uTime * 0.05, 57.3))
            ) * transit * (2.5 + aSeed * 4.0);
          }

          // perpetual gentle drift — the field breathes
          float dr = uTime * 0.22 + aSeed * 40.0;
          p.x += sin(dr) * 0.16;
          p.y += cos(dr * 0.8 + aSeed * 9.0) * 0.14;
          p.z += sin(dr * 0.6 + aSeed * 17.0) * 0.12;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float ps = uSize * aSize * uPR / max(0.6, -mv.z);
          gl_PointSize = clamp(ps, 1.2, 60.0);

          // twinkle
          vA = (0.35 + 0.65 * aSeed) * (0.72 + 0.28 * sin(uTime * (0.8 + aSeed * 2.4) + aSeed * 100.0));
          // fade far particles slightly (aerial perspective)
          vA *= smoothstep(220.0, 60.0, -mv.z);
          vSeed = aSeed;
          vHot = step(0.93, aSeed); // rare white-hot sparks
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColHot, uColMain, uColDeep;
        uniform float uOpacity;
        varying float vA, vSeed, vHot;
        void main(){
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float a = smoothstep(0.5, 0.06, d);
          a *= a; // softer falloff, kills hard sprite edges
          vec3 col = mix(uColDeep, uColMain, 0.35 + 0.65 * vSeed);
          // hot core — only rare sparks flash toward white; the mass stays saturated
          float core = smoothstep(0.22, 0.0, d);
          col = mix(col, uColHot, core * (0.3 + 0.7 * vHot));
          col *= 1.0 + vHot * 1.1;
          gl_FragColor = vec4(col, a * vA * uOpacity);
          if (gl_FragColor.a < 0.003) discard;
        }`,
    });

    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  setSegment(i) {
    const last = this.shapes.length - 1;
    const from = this.shapes[Math.min(i, last)];
    const to = this.shapes[Math.min(i + 1, last)];
    const geo = this.points.geometry;
    geo.attributes.position.array.set(from);
    geo.attributes.aTo.array.set(to);
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aTo.needsUpdate = true;
    this.segment = i;
  }

  // p: 0..1 across the whole story
  update(p, time) {
    const segs = this.shapes.length - 1; // 6 transitions
    const f = Math.min(p, 0.99999) * segs;
    const i = Math.floor(f);
    if (i !== this.segment) this.setSegment(i);
    const local = f - i;
    // hold the formation, then morph as the next chapter approaches
    const m = THREE.MathUtils.smoothstep(local, 0.52, 0.96);
    this.uniforms.uMorph.value = m;
    this.uniforms.uTime.value = time;
    // only the finale target spins (harmless while m = 0)
    this.uniforms.uSpin.value = i === segs - 1 ? FINALE_SPIN : 0;
  }

  setTheme(theme, gsap) {
    const u = this.uniforms;
    const c = (t) => new THREE.Color(t);
    gsap.to(u.uColHot.value, { ...pick(c(theme.hot)), duration: 1.2, ease: 'power2.inOut' });
    gsap.to(u.uColMain.value, { ...pick(c(theme.main)), duration: 1.2, ease: 'power2.inOut' });
    gsap.to(u.uColDeep.value, { ...pick(c(theme.deep)), duration: 1.2, ease: 'power2.inOut' });
  }
}

function pick(c) { return { r: c.r, g: c.g, b: c.b }; }

// Ambient dust — persistent embers along the whole corridor for continuity
export function makeDust(scene, rail, count, theme, pixelRatio) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    rail.getPointAt(Math.random(), v);
    const a = Math.random() * Math.PI * 2;
    const rr = 4 + Math.random() * 26;
    pos[i * 3] = v.x + Math.cos(a) * rr;
    pos[i * 3 + 1] = v.y + (Math.random() - 0.5) * 24;
    pos[i * 3 + 2] = v.z + Math.sin(a) * rr;
    seed[i] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uTime: { value: 0 },
    uPR: { value: pixelRatio },
    uCol: { value: new THREE.Color(theme.main) },
  };
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms,
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime, uPR; varying float vA;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.25 + aSeed * 50.0) * 1.4;
        p.x += cos(uTime * 0.18 + aSeed * 70.0) * 1.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = clamp((10.0 + aSeed * 26.0) * uPR / max(0.6, -mv.z), 0.8, 26.0);
        vA = (0.15 + 0.5 * aSeed) * smoothstep(160.0, 30.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d); a *= a;
        gl_FragColor = vec4(uCol, a * vA * 0.55);
        if (gl_FragColor.a < 0.003) discard;
      }`,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  return { points: pts, uniforms };
}

// Finale DNA — luminous backbone tubes + base-pair rungs drawn over the
// particle helix of the last chapter, slowly rotating like a molecular
// visualization. Geometry mirrors FINALE_DNA so tubes and particles align.
export const FINALE_SPIN = 0.22; // rad/s — shared by tubes and particle shader

export function makeFinaleDNA(scene, theme) {
  const c = STATIONS[STATIONS.length - 1];
  const { R, H, TWIST, RUNGS } = FINALE_DNA;
  const group = new THREE.Group();
  group.position.set(c.x, c.y + 2, c.z); // +2 matches helixFinale's y offset
  const uniformsList = [];

  // uAxis picks which uv direction the pulse travels: x along tubes, y along rungs
  const glowMat = (phase, axis) => {
    const uniforms = {
      uTime: { value: 0 },
      uCol: { value: new THREE.Color(theme.main) },
      uHot: { value: new THREE.Color(theme.hot) },
      uOpacity: { value: 0 },
      uPhase: { value: phase },
      uAxis: { value: axis },
    };
    uniformsList.push(uniforms);
    return new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uOpacity, uPhase, uAxis;
        uniform vec3 uCol, uHot;
        varying vec2 vUv;
        void main(){
          float u = mix(vUv.x, vUv.y, uAxis);
          float p1 = fract(u * 2.0 - uTime * 0.09 + uPhase);
          float p2 = fract(u * 3.0 + uTime * 0.06 + uPhase * 1.7);
          float pulse = pow(smoothstep(0.38, 0.0, min(p1, 1.0 - p1)), 2.0) * 1.2
                      + pow(smoothstep(0.28, 0.0, min(p2, 1.0 - p2)), 2.0) * 0.6;
          vec3 col = mix(uCol, uHot, min(pulse * 0.55, 1.0));
          float glow = 0.3 + pulse;
          gl_FragColor = vec4(col * glow, min(glow, 1.6) * 0.7 * uOpacity);
        }`,
    });
  };

  // two helical backbone tubes
  for (let s = 0; s < 2; s++) {
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const y = -H / 2 + (i / 120) * H;
      const a = y * TWIST + s * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(a) * R, y, Math.sin(a) * R));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.09, 6, false);
    group.add(new THREE.Mesh(geo, glowMat(s * 0.5, 0)));
  }

  // base-pair rungs bridging the strands — same heights as the particle rungs
  const up = new THREE.Vector3(0, 1, 0);
  for (let j = 0; j < RUNGS; j++) {
    const y = (j - RUNGS / 2 + 0.5) * (H / RUNGS);
    const a = y * TWIST;
    const geo = new THREE.CylinderGeometry(0.05, 0.05, R * 2 * 0.94, 5, 1, true);
    const mesh = new THREE.Mesh(geo, glowMat(j * 0.37, 1));
    mesh.position.y = y;
    mesh.quaternion.setFromUnitVectors(up, new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
    group.add(mesh);
  }

  group.visible = false;
  scene.add(group);
  return { group, uniformsList };
}

// Energy veins — two glowing tubes tracing the hero helix strands with a
// traveling pulse (the "lightning filament" from the reference)
export function makeVeins(scene, theme) {
  const group = new THREE.Group();
  const uniformsList = [];
  const R = 7, LEN = 120, TWIST = 0.16;
  for (let s = 0; s < 2; s++) {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const z = -LEN / 2 + (i / 160) * LEN;
      const a = z * TWIST + s * Math.PI;
      pts.push(new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 240, 0.07, 6, false);
    const uniforms = {
      uTime: { value: 0 },
      uCol: { value: new THREE.Color(theme.main) },
      uOpacity: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uOpacity; uniform vec3 uCol; varying vec2 vUv;
        void main(){
          // two pulses travelling in opposite directions
          float p1 = fract(vUv.x * 2.0 - uTime * 0.11);
          float p2 = fract(vUv.x * 3.0 + uTime * 0.07);
          float pulse = pow(smoothstep(0.35, 0.0, min(p1, 1.0 - p1)), 2.0) * 1.4
                      + pow(smoothstep(0.25, 0.0, min(p2, 1.0 - p2)), 2.0) * 0.8;
          float base = 0.12;
          gl_FragColor = vec4(uCol * (base + pulse), (base + pulse) * 0.85 * uOpacity);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    uniformsList.push(uniforms);
  }
  scene.add(group);
  return { group, uniformsList };
}
