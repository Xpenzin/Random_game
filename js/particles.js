// Lightweight particle pool for hit sparks, block sparks, dust and the
// finisher shatter burst. Nothing here is essential to simulation, so it's
// deliberately simple: an array of plain objects updated/drawn each frame.
export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(p) {
    this.particles.push({ vx: 0, vy: 0, life: 0.4, maxLife: 0.4, size: 4, color: '#fff', gravity: 0, shape: 'rect', ...p });
  }

  hitSpark(x, y, dir, big = false) {
    const n = big ? 10 : 6;
    for (let i = 0; i < n; i++) {
      const a = (Math.random() - 0.5) * 1.4 - (dir > 0 ? 0 : Math.PI);
      const speed = (big ? 420 : 260) * (0.5 + Math.random());
      this.spawn({
        x, y,
        vx: Math.cos(a) * speed * dir,
        vy: Math.sin(a) * speed - 80,
        life: big ? 0.35 : 0.22,
        maxLife: big ? 0.35 : 0.22,
        size: big ? 6 : 4,
        color: big ? '#ffdd55' : '#fff6d8',
        gravity: 900,
      });
    }
  }

  blockSpark(x, y, dir) {
    for (let i = 0; i < 5; i++) {
      const a = (Math.random() - 0.5) * 1.0;
      const speed = 220 * (0.5 + Math.random());
      this.spawn({
        x, y,
        vx: Math.cos(a) * speed * -dir,
        vy: Math.sin(a) * speed - 40,
        life: 0.2,
        maxLife: 0.2,
        size: 4,
        color: '#7ecbff',
        gravity: 600,
      });
    }
  }

  muzzleFlash(x, y, dir) {
    for (let i = 0; i < 4; i++) {
      this.spawn({
        x, y,
        vx: dir * (200 + Math.random() * 200),
        vy: (Math.random() - 0.5) * 80,
        life: 0.1,
        maxLife: 0.1,
        size: 3,
        color: '#ffe27a',
        gravity: 0,
      });
    }
  }

  dust(x, y) {
    for (let i = 0; i < 4; i++) {
      this.spawn({
        x, y,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 60,
        life: 0.3,
        maxLife: 0.3,
        size: 5,
        color: '#c9c2b0',
        gravity: 300,
      });
    }
  }

  finisherBurst(x, y, color = '#ff5c3f') {
    for (let i = 0; i < 36; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 480;
      this.spawn({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0.7 + Math.random() * 0.4,
        maxLife: 1.1,
        size: 4 + Math.random() * 6,
        color: Math.random() < 0.5 ? color : '#fff',
        gravity: 500,
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = p.size * (0.4 + alpha * 0.6);
      ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), Math.round(s), Math.round(s));
    }
    ctx.globalAlpha = 1;
  }
}
