import { Entity } from './entity.js';
import { GROUND_Y, ARENA_LEFT, ARENA_RIGHT } from '../constants.js';

const SWORD_ATTACK = {
  id: 'swordSlash', animState: 'attack', damage: 9, startup: 0.24, active: 0.12, recovery: 0.34,
  hitbox: { x: 46, y: 52, w: 46, h: 30 }, knockback: { x: 220, y: -80 }, hitstun: 0.3, blockstun: 0.16, meterGain: 8,
};
const SCYTHE_ATTACK = {
  id: 'scytheSwing', animState: 'attack', damage: 16, startup: 0.42, active: 0.16, recovery: 0.52,
  hitbox: { x: 62, y: 50, w: 72, h: 40 }, knockback: { x: 320, y: -140 }, hitstun: 0.38, blockstun: 0.2, meterGain: 10,
};
const GUN_ATTACK = {
  id: 'gunShot', animState: 'attack', damage: 0, startup: 0.4, active: 0.08, recovery: 0.32,
  hitbox: { x: 0, y: 0, w: 0, h: 0 }, knockback: { x: 0, y: 0 }, hitstun: 0, blockstun: 0, meterGain: 0,
};

class Mob extends Entity {
  constructor(x, kind) {
    super(x, 'enemy');
    this.kind = kind;
    this.aiCooldown = 0.4 + Math.random() * 0.4;
    this.time = 0;
  }

  updateCommon(dt) {
    this.time += dt;
    const frozen = this.updateTimers(dt);
    if (frozen) return true;

    if (this.knockedDown > 0) {
      this.vx *= 0.9;
      this.updatePhysics(dt);
      return true;
    }
    if (this.hp <= 0) {
      this.alive = false;
      this.deathTimer += dt;
      this.vx *= 0.9;
      this.updatePhysics(dt);
      return true;
    }
    if (this.attack) this.updateAttackTimer(dt);
    if (this.inHitstun || this.inBlockstun) {
      this.vx *= 0.85;
      this.updatePhysics(dt);
      return true;
    }
    return false;
  }

  faceTarget(target) {
    if (!this.isAttacking) this.facing = target.x >= this.x ? 1 : -1;
  }
}

export class SwordMob extends Mob {
  constructor(x) {
    super(x, 'sword');
    this.maxHp = 40;
    this.hp = 40;
    this.speed = 230;
    this.attackRange = 78;
    this.name = 'Blade Thug';
  }

  update(dt, player) {
    if (this.updateCommon(dt)) return;
    this.faceTarget(player);
    const dist = Math.abs(player.x - this.x);

    if (!this.isAttacking) {
      if (dist > this.attackRange) {
        this.vx = Math.sign(player.x - this.x) * this.speed;
        this.setState('walk');
      } else {
        this.vx *= 0.7;
        this.aiCooldown -= dt;
        if (this.aiCooldown <= 0 && !player.inHitstun) {
          this.startAttack(SWORD_ATTACK);
          this.aiCooldown = 0.9 + Math.random() * 0.5;
        } else {
          this.setState('idle');
        }
      }
    }
    this.updatePhysics(dt);
    if (!this.isAttacking && this.state !== 'walk') this.setState('idle');
  }

  getPose() {
    return buildMobPose(this, {
      idleSwordArm: true,
      attackKind: 'sword',
    });
  }
}

export class ScytheMob extends Mob {
  constructor(x) {
    super(x, 'scythe');
    this.maxHp = 58;
    this.hp = 58;
    this.speed = 165;
    this.attackRange = 110;
    this.name = 'Reaper';
  }

  update(dt, player) {
    if (this.updateCommon(dt)) return;
    this.faceTarget(player);
    const dist = Math.abs(player.x - this.x);

    if (!this.isAttacking) {
      if (dist > this.attackRange) {
        this.vx = Math.sign(player.x - this.x) * this.speed;
        this.setState('walk');
      } else {
        this.vx *= 0.6;
        this.aiCooldown -= dt;
        if (this.aiCooldown <= 0 && !player.inHitstun) {
          this.startAttack(SCYTHE_ATTACK);
          this.aiCooldown = 1.2 + Math.random() * 0.6;
        } else {
          this.setState('idle');
        }
      }
    }
    this.updatePhysics(dt);
    if (!this.isAttacking && this.state !== 'walk') this.setState('idle');
  }

  getPose() {
    return buildMobPose(this, { attackKind: 'scythe' });
  }
}

export class GunnerMob extends Mob {
  constructor(x) {
    super(x, 'gunner');
    this.maxHp = 30;
    this.hp = 30;
    this.speed = 190;
    this.preferredMin = 300;
    this.preferredMax = 480;
    this.name = 'Gunner';
  }

  update(dt, player, world) {
    if (this.updateCommon(dt)) return;
    this.faceTarget(player);
    const dist = Math.abs(player.x - this.x);

    if (this.attack && this.attack.phase === 'active' && !this.attack.firedBullet) {
      this.attack.firedBullet = true;
      world?.spawnBullet?.(this);
    }

    if (!this.isAttacking) {
      if (dist < this.preferredMin) {
        this.vx = Math.sign(this.x - player.x) * this.speed;
        this.setState('walk');
      } else if (dist > this.preferredMax) {
        this.vx = Math.sign(player.x - this.x) * this.speed;
        this.setState('walk');
      } else {
        this.vx *= 0.7;
        this.aiCooldown -= dt;
        if (this.aiCooldown <= 0) {
          this.startAttack(GUN_ATTACK);
          this.aiCooldown = 1.4 + Math.random() * 0.7;
        } else {
          this.setState('idle');
        }
      }
    }
    this.updatePhysics(dt);
    if (!this.isAttacking && this.state !== 'walk') this.setState('idle');
  }

  getPose() {
    return buildMobPose(this, { attackKind: 'gun' });
  }
}

export class Bullet {
  constructor(x, y, dir, owner) {
    this.x = x;
    this.y = y;
    this.vx = 900 * dir;
    this.dir = dir;
    this.width = 14;
    this.height = 6;
    this.damage = 10;
    this.owner = owner;
    this.team = 'enemy';
    this.alive = true;
  }
  update(dt) {
    this.x += this.vx * dt;
    if (this.x < ARENA_LEFT - 40 || this.x > ARENA_RIGHT + 40) this.alive = false;
  }
  get hurtbox() {
    return { x: this.x - this.width / 2, y: this.y - this.height / 2, w: this.width, h: this.height };
  }
}

// One rig-pose builder shared by all three mob types; `opts.attackKind`
// selects the weapon-specific swing shape during the attack state.
function buildMobPose(mob, opts) {
  const t = mob.stateTime;
  const facing = mob.facing;
  let pose = {
    x: mob.x,
    y: mob.y,
    facing,
    crouch: 0,
    lean: 0,
    bob: 0,
    scaleX: 1,
    scaleY: 1,
    legBack: { hipAngle: -0.1, kneeAngle: 0.2 },
    legFront: { hipAngle: 0.1, kneeAngle: -0.2 },
    armBack: { shoulderAngle: -0.3, elbowAngle: 0.6 },
    armFront: { shoulderAngle: 0.3, elbowAngle: -0.5 },
    weapon: { show: true, kind: opts.attackKind, angle: 0.9, reach: opts.attackKind === 'scythe' ? 46 : 34 },
  };

  if (mob.flashTimer > 0 && mob.state !== 'knockdown' && mob.state !== 'dead') {
    pose.tint = { color: '#ffffff', alpha: Math.min(0.6, mob.flashTimer * 6) };
  }

  switch (mob.state) {
    case 'idle': {
      const sway = Math.sin(t * 1.8) * 0.05;
      pose.lean = sway;
      pose.bob = Math.sin(t * 1.8) * 2;
      pose.weapon.angle = 0.7 + sway;
      break;
    }
    case 'walk': {
      const cyc = t * 10;
      pose.legBack = { hipAngle: Math.sin(cyc) * 0.5, kneeAngle: Math.max(0, Math.cos(cyc)) * 0.6 + 0.15 };
      pose.legFront = { hipAngle: Math.sin(cyc + Math.PI) * 0.5, kneeAngle: Math.max(0, Math.cos(cyc + Math.PI)) * 0.6 + 0.15 };
      pose.bob = Math.abs(Math.sin(cyc)) * 3;
      pose.weapon.angle = 0.6 + Math.sin(cyc) * 0.1;
      break;
    }
    case 'knockdown':
    case 'dead': {
      pose.crouch = 1;
      pose.bob = 48;
      pose.lean = 1.55;
      pose.scaleY = mob.state === 'dead' ? 0.85 : 1;
      pose.weapon.show = false;
      break;
    }
    case 'attack':
      applyMobAttackPose(pose, mob.attack, opts.attackKind);
      break;
  }

  if (mob.inHitstun) {
    pose.lean = -0.28 + Math.sin(t * 28) * 0.05;
  }

  return pose;
}

function applyMobAttackPose(pose, attack, kind) {
  const d = attack.def;
  const phase = attack.phase;
  const p = phase === 'startup' ? attack.timer / d.startup : phase === 'active' ? attack.timer / d.active : attack.timer / d.recovery;

  if (kind === 'sword') {
    pose.armFront = { shoulderAngle: phase === 'startup' ? lerp(-1.2, -1.6, p) : phase === 'active' ? lerp(-1.6, 1.4, p) : lerp(1.4, 0.3, p), elbowAngle: -0.3 };
    pose.weapon.angle = pose.armFront.shoulderAngle + 0.6;
    pose.lean = 0.3;
  } else if (kind === 'scythe') {
    pose.armFront = { shoulderAngle: phase === 'startup' ? lerp(-1.6, -2.0, p) : phase === 'active' ? lerp(-2.0, 1.7, p) : lerp(1.7, 0.4, p), elbowAngle: -0.2 };
    pose.weapon.angle = pose.armFront.shoulderAngle + 0.9;
    pose.weapon.reach = 52;
    pose.lean = 0.35;
  } else if (kind === 'gun') {
    pose.armFront = { shoulderAngle: 1.35, elbowAngle: -0.1 };
    pose.weapon.angle = 1.35;
    pose.weapon.flash = phase === 'active';
    pose.lean = phase === 'startup' ? -0.1 : 0;
  }
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}
