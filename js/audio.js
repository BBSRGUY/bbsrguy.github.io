// Procedural ambient score — deep tanpura-like drone pad, air shimmer,
// and a filtered whoosh on chapter transitions. Fully synthesized, no files.
// Starts muted; toggled by the user (autoplay policy compliant).
export class AmbientAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.on = false;
    this.chapter = 0;
  }

  _init() {
    const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
    const master = (this.master = ctx.createGain());
    master.gain.value = 0;
    master.connect(ctx.destination);

    // warm drone — root + fifth + octave, slowly breathing detune
    const padBus = ctx.createGain();
    padBus.gain.value = 0.5;
    const lp = (this.padFilter = ctx.createBiquadFilter());
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    lp.Q.value = 0.6;
    padBus.connect(lp).connect(master);

    [[55, 0.09], [82.41, 0.05], [110, 0.045], [164.81, 0.02], [220, 0.012]].forEach(([f, g], i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = g;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.021;
      const lg = ctx.createGain();
      lg.gain.value = 2.4;
      lfo.connect(lg).connect(o.detune);
      lfo.start();
      o.connect(og).connect(padBus);
      o.start();
    });

    // air shimmer — looped noise through a drifting highpass
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'bandpass';
    hp.frequency.value = 5200;
    hp.Q.value = 1.4;
    const ng = ctx.createGain();
    ng.gain.value = 0.012;
    const nlfo = ctx.createOscillator();
    nlfo.frequency.value = 0.07;
    const nlg = ctx.createGain();
    nlg.gain.value = 1800;
    nlfo.connect(nlg).connect(hp.frequency);
    nlfo.start();
    noise.connect(hp).connect(ng).connect(master);
    noise.start();

    this._noiseBuf = buf;
  }

  toggle() {
    if (!this.ctx) this._init();
    this.ctx.resume();
    this.on = !this.on;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.on ? 0.6 : 0, t + 1.0);
    return this.on;
  }

  // brighten the pad as the story progresses; extra warmth for the music chapter
  setChapter(i) {
    if (!this.ctx || i === this.chapter) { this.chapter = i; return; }
    this.chapter = i;
    const t = this.ctx.currentTime;
    const target = i === 4 ? 900 : 320 + i * 90;
    this.padFilter.frequency.cancelScheduledValues(t);
    this.padFilter.frequency.setValueAtTime(this.padFilter.frequency.value, t);
    this.padFilter.frequency.exponentialRampToValueAtTime(Math.max(target, 60), t + 2.0);
    if (this.on) this.whoosh();
  }

  whoosh() {
    if (!this.ctx || !this.on) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2.2;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(1400, t + 0.7);
    bp.frequency.exponentialRampToValueAtTime(240, t + 1.4);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + 1.6);
  }
}
