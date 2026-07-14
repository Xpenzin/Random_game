import { CANVAS_W, CANVAS_H, GROUND_Y, ARENA_LEFT, ARENA_RIGHT, PALETTE } from './constants.js';
import { Player } from './entities/player.js';
import { SwordMob, ScytheMob, GunnerMob, Bullet } from './entities/mobs.js';
import { Boss } from './entities/boss.js';
import { updateCombat } from './combat.js';
import { ParticleSystem } from './particles.js';
import { drawFighter } from './render/rig.js';
import { drawHUD, drawStartScreen, drawGameOverScreen } from './ui.js';

const BOSS_EVERY = 5;

export class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.reset();
  }

  reset() {
    this.state = 'start'; // start | fight | gameover
    this.player = new Player(260);
    this.enemies = [];
    this.bullets = [];
    this.particles = new ParticleSystem();
    this.wave = 0;
    this.bossWave = false;
    this.score = 0;
    this.maxCombo = 0;
    this.comboInfo = { count: 0, timer: 0, popTime: 0 };
    this.bannerText = '';
    this.bannerTimer = 0;
    this.bannerColor = '#ff5c3f';
    this.slowMoTimer = 0;
    this.shakeTimer = 0;
    this.shakeMag = 0;
    this.waveClearDelay = 0;
    this.spawnTimer = 0;
    this.won = false;
    this.dt = 0;
  }

  nearestEnemy(from) {
    let best = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.abs(e.x - from.x);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  hudTarget() {
    return this.nearestEnemy(this.player) ?? this.enemies[this.enemies.length - 1] ?? null;
  }

  spawnBullet(gunner) {
    const dir = gunner.facing;
    this.bullets.push(new Bullet(gunner.x + 30 * dir, gunner.y - 62, dir, gunner));
    this.particles.muzzleFlash(gunner.x + 34 * dir, gunner.y - 62, dir);
  }

  startWave() {
    this.wave += 1;
    this.bossWave = this.wave % BOSS_EVERY === 0;
    this.enemies = [];
    if (this.bossWave) {
      const boss = new Boss(ARENA_RIGHT - 140);
      this.enemies.push(boss);
      this.banner(`RIVAL DUEL: ${boss.name.toUpperCase()}`, '#ffd23f', 2.2);
    } else {
      const count = Math.min(4, 1 + Math.floor(this.wave / 2));
      const types = [SwordMob, ScytheMob, GunnerMob];
      for (let i = 0; i < count; i++) {
        const Type = types[Math.floor(Math.random() * types.length)];
        const fromLeft = i % 2 === 0;
        const x = fromLeft ? ARENA_LEFT + 30 + Math.random() * 60 : ARENA_RIGHT - 30 - Math.random() * 60;
        const mob = new Type(x);
        // gentle scaling so later waves stay threatening without being unfair
        mob.maxHp += this.wave * 2;
        mob.hp = mob.maxHp;
        this.enemies.push(mob);
      }
      this.banner(`WAVE ${this.wave}`, '#5ad35a', 1.2);
    }
  }

  banner(text, color, time) {
    this.bannerText = text;
    this.bannerColor = color;
    this.bannerTimer = time;
  }

  onHit(evt) {
    const { attacker, defender, def, blocked, x, y, killed, comboCount } = evt;
    if (blocked) {
      this.particles.blockSpark(x, y, attacker.facing ?? 1);
      this.shake(4, 0.08);
    } else {
      this.particles.hitSpark(x, y, attacker.facing ?? 1, !!(def.launcher || def.special));
      this.shake(def.special ? 14 : def.launcher ? 9 : 5, def.special ? 0.18 : 0.1);
    }

    if (attacker === this.player && !blocked) {
      this.score += defender instanceof Boss ? 25 : 10;
      this.comboInfo.count = comboCount;
      this.comboInfo.timer = 0.9;
      this.comboInfo.popTime = 0;
      this.maxCombo = Math.max(this.maxCombo, comboCount);
    }

    if (killed && !defender.finisherTriggered) {
      defender.finisherTriggered = true;
      this.triggerFinisher(attacker, defender);
    }
  }

  triggerFinisher(attacker, defender) {
    defender.isFinisherVictim = true;
    const color = defender.team === 'player' ? '#7ecbff' : '#ff5c3f';
    this.particles.finisherBurst(defender.x, defender.y - 55, color);
    this.slowMoTimer = 0.85;
    this.shake(18, 0.3);
    if (defender === this.player) {
      this.banner('YOU WERE FINISHED', '#e14b3f', 1.6);
    } else if (defender instanceof Boss) {
      this.banner('RIVAL FINISHED!', '#ffd23f', 1.6);
      this.score += 300;
    } else {
      this.banner('FINISHED!', '#ffd23f', 0.9);
      this.score += 50;
    }
  }

  shake(mag, time) {
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeTimer = Math.max(this.shakeTimer, time);
  }

  update(rawDt, input) {
    if (this.state === 'start') {
      if (input.pressed('enter')) {
        this.state = 'fight';
        this.startWave();
      }
      return;
    }
    if (this.state === 'gameover') {
      if (input.pressed('enter')) this.reset();
      return;
    }

    const timeScale = this.slowMoTimer > 0 ? 0.22 : 1;
    const dt = rawDt * timeScale;
    this.dt = dt;
    if (this.slowMoTimer > 0) this.slowMoTimer -= rawDt;
    if (this.shakeTimer > 0) this.shakeTimer -= rawDt;
    if (this.bannerTimer > 0) this.bannerTimer -= rawDt;
    if (this.comboInfo.timer > 0) {
      this.comboInfo.timer -= rawDt;
      this.comboInfo.popTime = (this.comboInfo.popTime ?? 0) + rawDt;
    } else {
      this.comboInfo.count = 0;
    }

    this.player.update(dt, input, this);
    for (const e of this.enemies) {
      if (e.alive) e.update(dt, this.player, this);
      else if (e.deathTimer < 5) e.deathTimer += dt; // let the death pose linger, then it's swept below
    }
    for (const b of this.bullets) b.update(dt);
    this.bullets = this.bullets.filter((b) => b.alive);
    this.particles.update(dt);

    updateCombat(this);

    this.enemies = this.enemies.filter((e) => !(e.hp <= 0 && e.deathTimer > 1.4));

    if (!this.bossWave) {
      if (this.enemies.length === 0 && this.state === 'fight') {
        this.waveClearDelay += dt;
        if (this.waveClearDelay > 1.0) {
          this.waveClearDelay = 0;
          this.startWave();
        }
      }
    } else {
      const boss = this.enemies[0];
      if (!boss || boss.hp <= 0) {
        this.waveClearDelay += dt;
        if (this.waveClearDelay > 1.6) {
          this.waveClearDelay = 0;
          this.startWave();
        }
      }
    }

    if (this.player.hp <= 0 && this.player.deathTimer > 1.1) {
      this.won = false;
      this.state = 'gameover';
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    drawBackground(ctx);

    ctx.save();
    if (this.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * this.shakeMag, (Math.random() - 0.5) * this.shakeMag);
    }
    if (this.slowMoTimer > 0) {
      const z = 1 + 0.12 * (this.slowMoTimer / 0.85);
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
      ctx.scale(z, z);
      ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
    }

    for (const e of this.enemies) drawFighter(ctx, paletteFor(e), e.getPose());
    if (this.state !== 'start') drawFighter(ctx, PALETTE.player, this.player.getPose());
    for (const b of this.bullets) drawBullet(ctx, b);
    this.particles.draw(ctx);
    ctx.restore();

    if (this.state === 'fight' || this.state === 'gameover') drawHUD(ctx, this);
    if (this.state === 'start') drawStartScreen(ctx);
    if (this.state === 'gameover') drawGameOverScreen(ctx, this);
  }
}

function paletteFor(e) {
  if (e.kind === 'sword') return PALETTE.swordMob;
  if (e.kind === 'scythe') return PALETTE.scytheMob;
  if (e.kind === 'gunner') return PALETTE.gunnerMob;
  return PALETTE.boss;
}

function drawBullet(ctx, b) {
  ctx.fillStyle = '#ffe27a';
  ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
  ctx.fillStyle = 'rgba(255,226,122,0.4)';
  ctx.fillRect(b.x - b.width / 2 - 14 * b.dir, b.y - b.height / 2, 14 * b.dir, b.height);
}

function drawBackground(ctx) {
  ctx.fillStyle = '#232a3a';
  ctx.fillRect(0, 0, CANVAS_W, GROUND_Y - 40);
  ctx.fillStyle = '#1a2030';
  for (let i = 0; i < 8; i++) {
    const w = 60 + (i % 3) * 30;
    const h = 120 + (i % 4) * 60;
    ctx.fillRect(i * 160 - 20, GROUND_Y - 40 - h, w, h);
  }
  ctx.fillStyle = '#161b28';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(i * 110 + 20, GROUND_Y - 40 - 40, 46, 40);
  }
  ctx.fillStyle = '#33261c';
  ctx.fillRect(0, GROUND_Y - 40, CANVAS_W, CANVAS_H - (GROUND_Y - 40));
  ctx.fillStyle = '#241b14';
  for (let x = 0; x < CANVAS_W; x += 64) {
    ctx.fillRect(x, GROUND_Y - 40, 32, CANVAS_H - (GROUND_Y - 40));
  }
  ctx.fillStyle = '#0e0b08';
  ctx.fillRect(0, GROUND_Y - 42, CANVAS_W, 4);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(ARENA_LEFT - 20, GROUND_Y - 40, 4, CANVAS_H);
  ctx.fillRect(ARENA_RIGHT + 16, GROUND_Y - 40, 4, CANVAS_H);
}
