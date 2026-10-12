// DOM layer: smooth scroll, chapter triggers, text reveals, cursor,
// magnetic buttons, theme dots, sound toggle, progress.
// gsap / ScrollTrigger / Lenis arrive as globals from CDN script tags.
import { THEMES, REDUCED_MOTION } from './config.js';

export function initUI({ state, onChapter, onTheme, audio }) {
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (!REDUCED_MOTION) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.0 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // released by the preloader reveal
  }

  // global story progress. A full-screen stage page (the modernization bench)
  // spends only a short slice of the 3D journey, stretched over its whole
  // scroll: the camera drifts on slowly and the traveler keeps running through
  // it, while the chapters before and after keep the timing they were made for.
  const stages = [...document.querySelectorAll('.stage-page')];
  const SLICE = 0.45; // viewport heights of journey a stage page spends
  // nav dots follow every page in order: the chapters plus any stage pages
  const pages = [...document.querySelectorAll('.chapter, .stage-page')];
  let dotOn = -1;
  function markDot(k) {
    if (k === dotOn) return;
    dotOn = k;
    document.querySelectorAll('.nav-dot').forEach((d, j) => d.classList.toggle('on', j === k));
  }
  ScrollTrigger.create({
    trigger: '#content',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const at = self.scroll() - self.start;
      let y = at;
      let total = self.end - self.start;
      stages.forEach((el) => {
        const from = el.offsetTop - innerHeight * 0.5;
        const len = el.offsetHeight;
        const keep = innerHeight * SLICE;
        const inside = Math.min(Math.max(at - from, 0), len);
        y -= inside - inside * (keep / len);
        total -= len - keep;
      });
      state.p = Math.min(Math.max(y / Math.max(total, 1), 0), 1);
      // the active nav dot is whichever page holds the middle of the screen
      const mid = self.scroll() - self.start + innerHeight / 2;
      let k = 0;
      pages.forEach((el, j) => { if (el.offsetTop <= mid) k = j; });
      markDot(k);
    },
  });

  // chapter enter/leave
  const sections = document.querySelectorAll('.chapter');
  sections.forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => setChapter(i),
      onEnterBack: () => setChapter(i),
    });
  });

  function setChapter(i) {
    if (state.chapter === i) return;
    state.chapter = i;
    onChapter(i);
  }

  // masked line reveals
  document.querySelectorAll('.reveal .line').forEach((line) => {
    const inner = document.createElement('span');
    inner.className = 'line-inner';
    while (line.firstChild) inner.appendChild(line.firstChild);
    line.appendChild(inner);
  });
  if (REDUCED_MOTION) {
    gsap.set('.line-inner', { y: 0 });
    gsap.set('.fade-up', { opacity: 1, y: 0 });
  } else {
    pages.forEach((ch) => {
      const lines = ch.querySelectorAll('.line-inner');
      if (lines.length) {
        gsap.to(lines, {
          y: 0, stagger: 0.07, duration: 0.9, ease: 'power4.out',
          scrollTrigger: { trigger: ch, start: 'top 62%' },
        });
      }
      const fades = ch.querySelectorAll('.fade-up');
      if (fades.length) {
        gsap.to(fades, {
          opacity: 1, y: 0, stagger: 0.06, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: ch, start: 'top 55%' },
        });
      }
    });
  }

  // nav dots scroll-to
  document.querySelectorAll('.nav-dot').forEach((d, i) => {
    d.addEventListener('click', () => {
      const target = pages[i];
      if (lenis) lenis.scrollTo(target, { duration: 2.2 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // custom cursor
  const cur = document.getElementById('cursor');
  if (cur && matchMedia('(hover: hover)').matches) {
    const c = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
    addEventListener('pointermove', (e) => { c.tx = e.clientX; c.ty = e.clientY; });
    gsap.ticker.add(() => {
      c.x += (c.tx - c.x) * 0.2;
      c.y += (c.ty - c.y) * 0.2;
      cur.style.transform = `translate(${c.x}px, ${c.y}px)`;
    });
    document.querySelectorAll('a, button, [data-hover]').forEach((el) => {
      el.addEventListener('pointerenter', () => cur.classList.add('grow'));
      el.addEventListener('pointerleave', () => cur.classList.remove('grow'));
    });
  }

  // magnetic buttons
  if (matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) * 0.28,
          y: (e.clientY - r.top - r.height / 2) * 0.28,
          duration: 0.4,
        });
      });
      btn.addEventListener('pointerleave', () =>
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' }));
    });
  }

  // theme dots
  const dotsWrap = document.getElementById('theme-dots');
  Object.entries(THEMES).forEach(([key, t], i) => {
    const b = document.createElement('button');
    b.className = 'theme-dot' + (i === 0 ? ' active' : '');
    b.style.setProperty('--c', t.css.acc);
    b.setAttribute('aria-label', `Theme: ${t.label}`);
    b.title = t.label;
    b.addEventListener('click', () => {
      dotsWrap.querySelectorAll('.theme-dot').forEach((d) => d.classList.remove('active'));
      b.classList.add('active');
      onTheme(key);
    });
    dotsWrap.appendChild(b);
  });

  // sound toggle
  const soundBtn = document.getElementById('sound-toggle');
  soundBtn.addEventListener('click', () => {
    const on = audio.toggle();
    soundBtn.classList.toggle('on', on);
    soundBtn.setAttribute('aria-pressed', String(on));
  });

  // progress hairline
  const bar = document.getElementById('progress-bar');
  gsap.ticker.add(() => { bar.style.transform = `scaleX(${state.p})`; });

  return { lenis };
}

export function applyCssTheme(themeKey) {
  const t = THEMES[themeKey].css;
  const root = document.documentElement;
  root.style.setProperty('--acc', t.acc);
  root.style.setProperty('--acc-soft', t.accSoft);
  root.style.setProperty('--bg', t.bg);
}
