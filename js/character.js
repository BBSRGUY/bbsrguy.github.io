// The traveler — Mixamo character rendered as a being of magic particles:
// points sampled on the animated skin form the body, tinted by the theme,
// with a faint fresnel silhouette holding the shape together.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { IS_MOBILE } from './config.js';

const CLIP_FILES = {
  flying: 'assets/models/flying.glb',
  floating: 'assets/models/floating.glb',
  fastrun: 'assets/models/fastrun.glb',
  running: 'assets/models/running.glb',
  idle: 'assets/models/idle.glb',
  treading: 'assets/models/treading.glb',
};

export class Traveler {
  constructor(scene, manager, theme) {
    this.scene = scene;
    this.manager = manager;
    this.rig = new THREE.Group();
    scene.add(this.rig);
    this.actions = {};
    this.current = null;
    this.ready = false;
    this.face = 'path';
    this.yOff = -2.2;
    this._dir = 1; // travel direction along the rail: 1 = deeper, -1 = back out
    this._lastP = 0;
    this._targetQuat = new THREE.Quaternion();
    this._m = new THREE.Matrix4();
    this._pos = new THREE.Vector3();
    this._tan = new THREE.Vector3();
    this._up = new THREE.Vector3(0, 1, 0);
    this.rimUniforms = { uRimCol: { value: new THREE.Color(theme.rim) }, uRimStr: { value: 1.3 } };
    this.theme = theme;
  }

  async load() {
    const draco = new DRACOLoader(this.manager)
      .setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
    const loader = new GLTFLoader(this.manager).setDRACOLoader(draco);
    const load = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

    const base = await load(CLIP_FILES.flying);
    const model = base.scene;

    // normalize scale/height
    const box = new THREE.Box3().setFromObject(model);
    const h = box.max.y - box.min.y;
    const s = 4.6 / h;
    model.scale.setScalar(s);

    // ghost shell — nearly invisible body whose theme-colored fresnel edge
    // gives the particle cloud a coherent silhouette
    const rimU = this.rimUniforms;
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.theme.deep),
      metalness: 0.0,
      roughness: 1.0,
      transparent: true,
      opacity: 0.06, // faint fill so the silhouette reads against background dust
      depthWrite: false, // never occlude the particles that form the body
      emissive: new THREE.Color(this.theme.deep),
      emissiveIntensity: 0.5,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uRimCol = rimU.uRimCol;
      shader.uniforms.uRimStr = rimU.uRimStr;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\nuniform vec3 uRimCol;\nuniform float uRimStr;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float fres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
          totalEmissiveRadiance += uRimCol * fres * uRimStr;
          diffuseColor.a = clamp(diffuseColor.a + fres * 0.3, 0.0, 1.0);`);
    };
    this.material = mat;

    model.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        // the GLB was exported unlit, with no normals — without this every
        // lighting/fresnel term is NaN and the mesh renders as a solid blob
        if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
        o.material = mat;
        o.frustumCulled = false;
        o.castShadow = false;
      }
    });

    this.holder = new THREE.Group();
    this.holder.add(model);
    this.rig.add(this.holder);
    this.model = model;

    this.mixer = new THREE.AnimationMixer(model);
    this._registerClip('flying', base.animations[0]);

    const others = await Promise.all(
      Object.entries(CLIP_FILES)
        .filter(([k]) => k !== 'flying')
        .map(async ([k, url]) => [k, await load(url)])
    );
    for (const [k, gltf] of others) this._registerClip(k, gltf.animations[0]);

    // normalize scale against the upright idle pose (flying is horizontal,
    // so its Y-extent is body thickness, not height)
    this.play('idle', 0);
    this.mixer.update(0.3);
    this._normalizeToPose(model);

    this.play('flying', 0);
    this.ready = true;

    this._makeBodyParticles();
    this._makeTrail();
  }

  // The body itself: particles pinned to random vertices of the animated skin.
  // Each frame they're re-skinned on the CPU, so the cloud runs, flies and
  // treads water exactly like the mesh underneath.
  _makeBodyParticles() {
    const meshes = [];
    this.model.traverse((o) => { if (o.isSkinnedMesh) meshes.push(o); });
    if (!meshes.length) return;

    const M = IS_MOBILE ? 2200 : 5000;
    const total = meshes.reduce((n, m) => n + m.geometry.attributes.position.count, 0);
    this.samples = [];
    for (const mesh of meshes) {
      const count = mesh.geometry.attributes.position.count;
      const share = Math.max(1, Math.round((count / total) * M));
      for (let i = 0; i < share; i++) {
        this.samples.push({ mesh, idx: Math.floor(Math.random() * count) });
      }
    }

    const N = this.samples.length;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)
      .setUsage(THREE.DynamicDrawUsage));
    const rand = new Float32Array(N);
    for (let i = 0; i < N; i++) rand[i] = Math.random();
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

    this.bodyUniforms = {
      uCol: { value: new THREE.Color(this.theme.main) },
      uTime: { value: 0 },
      uPR: { value: Math.min(devicePixelRatio, 2) },
    };
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: this.bodyUniforms,
      vertexShader: /* glsl */`
        attribute float aRand; uniform float uTime, uPR; varying float vTw;
        void main(){
          vec3 p = position;
          // gentle magic drift so the body shimmers instead of sitting still
          float ph = aRand * 6.2831;
          p += 0.09 * vec3(sin(uTime * 1.7 + ph), cos(uTime * 2.1 + ph * 1.7), sin(uTime * 1.3 + ph * 2.3));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vTw = 0.65 + 0.35 * sin(uTime * (2.0 + aRand * 3.0) + ph);
          gl_PointSize = clamp((5.0 + 7.0 * aRand) * vTw * uPR / max(0.6, -mv.z), 0.75, 16.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; varying float vTw;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.08, d);
          vec3 col = mix(uCol, vec3(1.0), smoothstep(0.3, 0.0, d) * 0.35);
          gl_FragColor = vec4(col, a * a * vTw * 0.8);
          if (gl_FragColor.a < 0.004) discard;
        }`,
    });
    this.bodyPoints = new THREE.Points(geo, mat);
    this.bodyPoints.frustumCulled = false;
    this.scene.add(this.bodyPoints);
    this._v = new THREE.Vector3();
  }

  _updateBodyParticles(time) {
    this.rig.updateMatrixWorld(true);
    const attr = this.bodyPoints.geometry.attributes.position;
    const v = this._v;
    for (let i = 0; i < this.samples.length; i++) {
      const s = this.samples[i];
      v.fromBufferAttribute(s.mesh.geometry.attributes.position, s.idx);
      s.mesh.applyBoneTransform(s.idx, v);
      v.applyMatrix4(s.mesh.matrixWorld);
      attr.array[i * 3] = v.x;
      attr.array[i * 3 + 1] = v.y;
      attr.array[i * 3 + 2] = v.z;
    }
    attr.needsUpdate = true;
    this.bodyUniforms.uTime.value = time;
  }

  // Some GLB exports carry armature/unit scales that make the rest-pose
  // bounding box wildly different from the skinned result, so measure the
  // ACTUAL skinned vertices and rescale until the character stands 4.6 units.
  _normalizeToPose(model) {
    let sm = null;
    model.traverse((o) => { if (o.isSkinnedMesh && !sm) sm = o; });
    if (!sm) return;
    model.updateMatrixWorld(true);
    const pos = sm.geometry.attributes.position;
    const v = new THREE.Vector3();
    const box = new THREE.Box3();
    const step = Math.max(1, Math.floor(pos.count / 2000));
    for (let i = 0; i < pos.count; i += step) {
      v.fromBufferAttribute(pos, i);
      sm.applyBoneTransform(i, v);
      v.applyMatrix4(sm.matrixWorld);
      box.expandByPoint(v);
    }
    const h = box.max.y - box.min.y;
    if (h < 1e-4) return;
    const k = 4.6 / h;
    model.scale.multiplyScalar(k);
    // feet on the rig origin so chapter yOff values mean what they say
    model.position.y -= box.min.y * k;
    model.updateMatrixWorld(true);
  }

  _registerClip(name, clip) {
    if (!clip) return;
    // strip root translation so movement stays on our rail
    clip.tracks = clip.tracks.filter((t) => !t.name.endsWith('.position'));
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat);
    this.actions[name] = action;
  }

  play(name, fade = 0.7, timeScale = 1) {
    const next = this.actions[name];
    if (!next || this.current === next) {
      if (next) next.timeScale = timeScale;
      return;
    }
    next.reset().setEffectiveTimeScale(timeScale).setEffectiveWeight(1).fadeIn(fade).play();
    if (this.current) this.current.fadeOut(fade);
    this.current = next;
  }

  setChapter(ch) {
    this.play(ch.clip, 0.8, ch.timeScale);
    this.face = ch.face;
    this.yOff = ch.yOff;
  }

  setTheme(theme, gsap) {
    const rc = new THREE.Color(theme.rim);
    const mc = new THREE.Color(theme.main);
    const ec = new THREE.Color(theme.deep);
    gsap.to(this.rimUniforms.uRimCol.value, { r: rc.r, g: rc.g, b: rc.b, duration: 1.2 });
    if (this.bodyUniforms) {
      gsap.to(this.bodyUniforms.uCol.value, { r: mc.r, g: mc.g, b: mc.b, duration: 1.2 });
    }
    if (this.material) {
      gsap.to(this.material.color, { r: ec.r, g: ec.g, b: ec.b, duration: 1.2 });
      gsap.to(this.material.emissive, { r: ec.r, g: ec.g, b: ec.b, duration: 1.2 });
    }
  }

  _makeTrail() {
    const N = (this.trailN = 220);
    this.trailHead = 0;
    const pos = new Float32Array(N * 3);
    const age = new Float32Array(N).fill(1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aAge', new THREE.BufferAttribute(age, 1));
    this.trailUniforms = {
      uCol: { value: this.rimUniforms.uRimCol.value },
      uPR: { value: Math.min(devicePixelRatio, 2) },
    };
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: this.trailUniforms,
      vertexShader: /* glsl */`
        attribute float aAge; uniform float uPR; varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float life = 1.0 - aAge;
          gl_PointSize = clamp((34.0 * life + 5.0) * uPR / max(0.6, -mv.z), 0.5, 38.0);
          vA = life * life;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; varying float vA;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.05, d); a *= a;
          gl_FragColor = vec4(uCol * 1.4, a * vA * 0.8);
          if (gl_FragColor.a < 0.003) discard;
        }`,
    });
    this.trail = new THREE.Points(geo, mat);
    this.trail.frustumCulled = false;
    this.scene.add(this.trail);
  }

  update(dt, rail, p, camera, time) {
    if (!this.ready) return;
    this.mixer.update(dt);

    // ride slightly ahead of the camera on the rail
    const pc = Math.min(p + 0.02, 1);
    rail.getPointAt(pc, this._pos);
    rail.getTangentAt(pc, this._tan);
    this._pos.y += this.yOff + Math.sin(time * 1.4) * 0.22;

    this.rig.position.lerp(this._pos, 1 - Math.exp(-4.5 * dt));

    // orientation: face the direction of travel (into the scene when
    // scrolling down, back toward the viewer when scrolling up), or turn
    // to meet the viewer on 'camera' chapters
    const dp = p - this._lastP;
    if (Math.abs(dp) > 1e-5) this._dir = dp >= 0 ? 1 : -1;
    this._lastP = p;
    if (this.face === 'camera') {
      this._m.lookAt(camera.position, this.rig.position, this._up);
    } else {
      // lookAt(eye, target) aims +Z from target toward eye, and mixamo
      // models face +Z — so aiming at the travel point needs no extra flip
      const ahead = this._pos.clone().addScaledVector(this._tan, this._dir);
      this._m.lookAt(ahead, this.rig.position, this._up);
    }
    this._targetQuat.setFromRotationMatrix(this._m);
    this.rig.quaternion.slerp(this._targetQuat, 1 - Math.exp(-3.0 * dt));

    if (this.bodyPoints) this._updateBodyParticles(time);

    // comet trail
    if (this.trail) {
      const attr = this.trail.geometry.attributes;
      const i = this.trailHead;
      attr.position.array[i * 3] = this.rig.position.x + (Math.random() - 0.5) * 0.35;
      attr.position.array[i * 3 + 1] = this.rig.position.y + 1.9 + (Math.random() - 0.5) * 0.8;
      attr.position.array[i * 3 + 2] = this.rig.position.z + (Math.random() - 0.5) * 0.35;
      this.trailHead = (i + 1) % this.trailN;
      // ages: 0 = newborn at head, → 1 oldest
      for (let k = 0; k < this.trailN; k++) {
        const rel = (k - this.trailHead + this.trailN) % this.trailN;
        attr.aAge.array[k] = 1 - rel / this.trailN;
      }
      attr.position.needsUpdate = true;
      attr.aAge.needsUpdate = true;
    }
  }
}
