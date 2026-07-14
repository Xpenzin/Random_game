import { Entity } from './entity.js';

const JAB = { id: 'bossJab', animState: 'attack', damage: 7, startup: 0.12, active: 0.08, recovery: 0.17, hitbox: { x: 44, y: 56, w: 38, h: 26 }, knockback: { x: 150, y: -40 }, hitstun: 0.24, blockstun: 0.13, meterGain: 8, chain: true };
const JAB2 = { id: 'bossJab2', animState: 'attack', damage: 9, startup: 0.13, active: 0.09, recovery: 0.22, hitbox: { x: 46, y: 56, w: 40, h: 26 }, knockback: { x: 260, y: -100 }, hitstun: 0.3, blockstun: 0.16, meterGain: 10 };
const HEAVY = { id: 'bossHeavy', animState: 'attack', damage: 16, startup: 0.24, active: 0.1, recovery: 0.36, hitbox: { x: 50, y: 55, w: 48, h: 34 }, knockback: { x: 360, y: -170 }, hitstun: 0.42, blockstun: 0.22, meterGain: 16 };
const SPECIAL = { id: 'bossSpecial', animState: 'attack', damage: 28, startup: 0.2, active: 0.18, recovery: 0.4, hitbox: { x: 60, y: 55, w: 62, h: 40 }, knockback: { x: 440, y: -230 }, hitstun: 0.5, blockstun: 0.28, meterGain: 0, selfVx: 720, special: true };

export class Boss extends Entity {
  constructor(x) {
    super(x, 'enemy');
    this.maxHp = 220;
    this.hp = 220;
    this.speed = 260;
    this.attackRange = 96;
    this.name = 'Kael, The Rival';
    this.meter = 0;
    this.maxMeter = 100;
    this.time = 0;
    this.decisionCooldown = 0.3;
    this.blockTimer = 0;
    this.comboStep = 0;
    this.lastAttackEndAt = -999;
    this.introTimer = 1.1;
  }

  update(dt, player) {
    this.time += dt;
    const frozen = this.updateTimers(dt);
    if (frozen) return;

    if (this.introTimer > 0) {
      this.introTimer -= dt;
      this.setState('intro');
      return;
    }

    if (this.knockedDown > 0) {
      this.vx *= 0.9;
      this.updatePhysics(dt);
      return;
    }
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer += dt;
      this.setState('dead');
      this.vx *= 0.9;
      this.updatePhysics(dt);
      return;
    }
    if (player.hp <= 0) {
      this.setState('victory');
      this.vx *= 0.8;
      this.updatePhysics(dt);
      return;
    }

    if (this.attack) {
      const d = this.attack.def;
      if (d.selfVx && this.attack.phase === 'active' && !this.attack.movedThisAttack) {
        this.vx = d.selfVx * this.facing;
        this.attack.movedThisAttack = true;
      }
      if (this.attack.phase === 'recovery') this.vx *= 0.85;
      this.updateAttackTimer(dt);
    }

    if (this.inHitstun || this.inBlockstun) {
      this.vx *= 0.85;
      this.blockTimer = 0;
      this.isBlocking = false;
      this.updatePhysics(dt);
      return;
    }

    this.isBlocking = this.blockTimer > 0;
    if (this.blockTimer > 0) this.blockTimer -= dt;

    if (!this.isAttacking) this.facing = player.x >= this.x ? 1 : -1;

    this.think(dt, player);
    this.updatePhysics(dt);

    if (!this.isAttacking && !this.isBlocking) {
      this.setState(Math.abs(this.vx) > 5 ? 'walk' : 'idle');
    } else if (this.isBlocking) {
      this.setState('block');
    }
  }

  think(dt, player) {
    if (this.isAttacking || this.isBlocking) return;
    const dist = player.x - this.x;
    const adist = Math.abs(dist);
    const meterFull = this.meter >= 100;

    // React to the player's attack windup with a chance to guard.
    if (player.isAttacking && player.attack.phase === 'startup' && adist < 140) {
      const blockChance = 0.45;
      if (Math.random() < blockChance * dt * 20) {
        this.blockTimer = 0.35;
        this.vx = 0;
        return;
      }
    }

    // Punish a player whose attack just entered recovery while in range.
    if (player.isAttacking && player.attack.phase === 'recovery' && adist < this.attackRange + 20) {
      this.startAttack(HEAVY);
      return;
    }

    this.decisionCooldown -= dt;
    if (adist > this.attackRange) {
      this.vx = Math.sign(dist) * this.speed * (this.hp < this.maxHp * 0.25 && Math.random() < 0.3 ? -1 : 1);
      return;
    }

    this.vx *= 0.6;
    if (this.decisionCooldown > 0) return;
    this.decisionCooldown = 0.35 + Math.random() * 0.5;

    if (meterFull && Math.random() < 0.55) {
      this.meter = 0;
      this.startAttack(SPECIAL);
      return;
    }
    const roll = Math.random();
    if (roll < 0.4) this.startAttack(JAB);
    else if (roll < 0.7) this.startAttack(JAB2);
    else if (roll < 0.92) this.startAttack(HEAVY);
    // else: brief hesitation, keeps behavior readable instead of nonstop pressure
  }

  onLand() {}

  getPose() {
    const t = this.stateTime;
    const facing = this.facing;
    let pose = {
      x: this.x,
      y: this.y,
      facing,
      crouch: 0,
      lean: 0,
      bob: 0,
      scaleX: 1,
      scaleY: 1,
      legBack: { hipAngle: -0.1, kneeAngle: 0.2 },
      legFront: { hipAngle: 0.1, kneeAngle: -0.2 },
      armBack: { shoulderAngle: -0.3, elbowAngle: 0.6 },
      armFront: { shoulderAngle: 0.35, elbowAngle: -0.5 },
      weapon: { show: true, kind: 'sword', angle: 0.8, reach: 50 },
    };

    if (this.flashTimer > 0 && this.state !== 'knockdown' && this.state !== 'dead') {
      pose.tint = { color: '#ffffff', alpha: Math.min(0.6, this.flashTimer * 6) };
    }

    switch (this.state) {
      case 'intro':
        pose.lean = -0.1;
        pose.armFront = { shoulderAngle: -0.2, elbowAngle: 0.3 };
        pose.weapon.angle = -0.3;
        pose.bob = Math.sin(t * 6) * 1.5;
        break;
      case 'idle': {
        const sway = Math.sin(t * 1.9) * 0.05;
        pose.lean = sway;
        pose.bob = Math.sin(t * 1.9) * 2;
        pose.weapon.angle = 0.6 + sway;
        break;
      }
      case 'walk': {
        const cyc = t * 11;
        pose.legBack = { hipAngle: Math.sin(cyc) * 0.5, kneeAngle: Math.max(0, Math.cos(cyc)) * 0.6 + 0.15 };
        pose.legFront = { hipAngle: Math.sin(cyc + Math.PI) * 0.5, kneeAngle: Math.max(0, Math.cos(cyc + Math.PI)) * 0.6 + 0.15 };
        pose.bob = Math.abs(Math.sin(cyc)) * 3;
        break;
      }
      case 'block':
        pose.armFront = { shoulderAngle: 0.2, elbowAngle: -1.5 };
        pose.armBack = { shoulderAngle: -0.1, elbowAngle: 1.4 };
        pose.weapon.angle = 0.2;
        pose.lean = -0.1;
        break;
      case 'knockdown':
      case 'dead':
        pose.crouch = 1;
        pose.bob = 48;
        pose.lean = 1.55;
        pose.weapon.show = false;
        break;
      case 'victory':
        pose.lean = -0.15;
        pose.armFront = { shoulderAngle: -1.4 + Math.sin(t * 3) * 0.1, elbowAngle: -0.6 };
        pose.armBack = { shoulderAngle: -0.2, elbowAngle: 0.4 };
        pose.weapon.angle = -1.2;
        pose.bob = Math.sin(t * 3) * 3;
        break;
      case 'attack':
        applyBossAttackPose(pose, this.attack);
        break;
    }

    if (this.inHitstun) pose.lean = -0.3 + Math.sin(t * 30) * 0.05;
    return pose;
  }
}

function applyBossAttackPose(pose, attack) {
  const d = attack.def;
  const phase = attack.phase;
  const p = phase === 'startup' ? attack.timer / d.startup : phase === 'active' ? attack.timer / d.active : attack.timer / d.recovery;

  if (d.id === 'bossSpecial') {
    pose.armFront = { shoulderAngle: Math.sin(attack.timer * 45) * 1.5, elbowAngle: -0.2 };
    pose.weapon.angle = pose.armFront.shoulderAngle + 0.4;
    pose.weapon.reach = 70;
    pose.lean = 0.35;
    pose.scaleX = 1.05;
    return;
  }

  const shoulder = phase === 'startup' ? lerp(-1.4, -1.9, p) : phase === 'active' ? lerp(-1.9, 1.6, p) : lerp(1.6, 0.3, p);
  pose.armFront = { shoulderAngle: shoulder, elbowAngle: -0.25 };
  pose.weapon.angle = shoulder + 0.5;
  pose.weapon.reach = d.id === 'bossHeavy' ? 62 : 50;
  pose.lean = 0.3;
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
