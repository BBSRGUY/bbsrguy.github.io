/**
 * P5.js code to create a futuristic, pulsating particle field background
 * that gives an "AI aura" vibe.
 */

let particles = [];

function setup() {
  const canvasContainer = document.getElementById('canvas-container');
  let cnv = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  cnv.parent('canvas-container');
  initParticles(150);  // Number of particles
}

function draw() {
  background(0, 10); // slight trail effect
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].show();
  }
}

function windowResized() {
  const canvasContainer = document.getElementById('canvas-container');
  resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  particles = [];
  initParticles(150);
}

function initParticles(num) {
  for (let i = 0; i < num; i++) {
    particles.push(new Particle(random(width), random(height)));
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = random(2, 4);
    this.xSpeed = random(-1, 1);
    this.ySpeed = random(-1, 1);
    this.alpha = random(80, 200);
  }

  update() {
    this.x += this.xSpeed * 0.5;
    this.y += this.ySpeed * 0.5;

    // Wrap around edges
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  show() {
    noStroke();
    fill(0, 255, 255, this.alpha);
    ellipse(this.x, this.y, this.r);
  }
}
