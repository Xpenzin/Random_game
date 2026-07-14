import { Entity } from './entity.js';
import {
  KEYS,
  MOVE_SPEED,
  DASH_SPEED,
  DASH_TIME,
  DOUBLE_TAP_WINDOW,
  JUMP_VELOCITY,
  JUMP_CUT_MULT,
  JUMP_ATTACK_BUFFER,
  INPUT_BUFFER,
  CHAIN_WINDOW,
  PLAYER_MAX_HP,
  PALETTE,
  GROUND_Y,
} from '../constants.js';

const A = {
  jab1: { id: 'jab1', name: 'Jab', damage: 5, startup: 0.05, active: 0.07, recovery: 0.11, hitbox: { x: 34, y: 56, w: 34, h: 24 }, knockback: { x: 130, y: -30 }, hitstun: 0.22, blockstun: 0.13, meterGain: 5, chain: 'jab2' },
  jab2: { id: 'jab2', name: 'Cross', damage: 6, startup: 0.06, active: 0.07, recovery: 0.13, hitbox: { x: 36, y: 56, w: 36, h: 24 }, knockback: { x: 150, y: -30 }, hitstun: 0.24, blockstun: 0.14, meterGain: 6, chain: 'jab3' },
  jab3: { id: 'jab3', name: 'Finishing Kick', damage: 10, startup: 0.09, active: 0.08, recovery: 0.24, hitbox: { x: 40, y: 50, w: 40, h: 30 }, knockback: { x: 300, y: -140 }, hitstun: 0.32, blockstun: 0.18, meterGain: 9 },
  chainHeavy: { id: 'chainHeavy', name: 'Rising Elbow', damage: 15, startup: 0.1, active: 0.09, recovery: 0.28, hitbox: { x: 38, y: 58, w: 38, h: 34 }, knockback: { x: 260, y: -420 }, hitstun: 0.4, blockstun: 0.2, meterGain: 12, launcher: true },
  heavy: { id: 'heavy', name: 'Heavy Strike', damage: 13, startup: 0.17, active: 0.09, recovery: 0.3, hitbox: { x: 40, y: 55, w: 40, h: 30 }, knockback: { x: 320, y: -80 }, hitstun: 0.38, blockstun: 0.22, meterGain: 11 },
  crouchLight: { id: 'crouchLight', name: 'Low Jab', damage: 5, startup: 0.06, active: 0.07, recovery: 0.14, hitbox: { x: 32, y: 16, w: 34, h: 20 }, knockback: { x: 110, y: 0 }, hitstun: 0.2, blockstun: 0.12, meterGain: 5 },
  sweep: { id: 'sweep', name: 'Sweep', damage: 9, startup: 0.13, active: 0.09, recovery: 0.26, hitbox: { x: 40, y: 10, w: 42, h: 18 }, knockback: { x: 200, y: -60 }, hitstun: 0.3, blockstun: 0.18, meterGain: 10, knockdown: true },
  uppercut: { id: 'uppercut', name: 'Rising Uppercut', damage: 17, startup: 0.08, active: 0.12, recovery: 0.32, hitbox: { x: 30, y: 70, w: 38, h: 76 }, knockback: { x: 80, y: -680 }, hitstun: 0.5, blockstun: 0.24, meterGain: 14, launcher: true, selfVy: -1150, invulnFrames: 0.24, special: true },
  airRush: { id: 'airRush', name: 'Aerial Rush', damage: 11, startup: 0.05, active: 0.14, recovery: 0.16, hitbox: { x: 40, y: 60, w: 42, h: 30 }, knockback: { x: 460, y: -30 }, hitstun: 0.28, blockstun: 0.16, meterGain: 10, selfVx: 900, aerial: true, special: true },
  aerialLight: { id: 'aerialLight', name: 'Jump Kick', damage: 7, startup: 0.06, active: 0.1, recovery: 0.14, hitbox: { x: 32, y: 66, w: 32, h: 26 }, knockback: { x: 180, y: 80 }, hitstun: 0.26, blockstun: 0.14, meterGain: 7, aerial: true },
  aerialHeavy: { id: 'aerialHeavy', name: 'Stomp', damage: 12, startup: 0.09, active: 0.1, recovery: 0.18, hitbox: { x: 34, y: 58, w: 34, h: 30 }, knockback: { x: 240, y: 160 }, hitstun: 0.3, blockstun: 0.16, meterGain: 9, aerial: true, groundBounce: true },
  overdrive: { id: 'overdrive', name: 'Overdrive Flurry', damage: 25, startup: 0.12, active: 0.18, recovery: 0.34, hitbox: { x: 46, y: 55, w: 52, h: 40 }, knockback: { x: 380, y: -160 }, hitstun: 0.46, blockstun: 0.26, meterGain: 0, meterCost: 35, special: true, selfVx: 260, hitstopMul: 1.6, unblockable: false },
  ultimate: { id: 'ultimate', name: 'Starburst Rush', damage: 46, startup: 0.14, active: 0.22, recovery: 0.42, hitbox: { x: 50, y: 55, w: 60, h: 46 }, knockback: { x: 520, y: -260 }, hitstun: 0.6, blockstun: 0.3, meterGain: 0, meterCost: 100, special: true, ultimate: true, selfVx: 400, hitstopMul: 2.4, unblockable: true },
  focusJab: { id: 'focusJab', name: 'Focus Jab', damage: 6, startup: 0.09, active: 0.06, recovery: 0.16, hitbox: { x: 34, y: 55, w: 32, h: 22 }, knockback: { x: 140, y: -20 }, hitstun: 0.22, blockstun: 0.13, meterGain: 8 },
};
for (const k in A) A[k].animState = 'attack';

export class Player extends Entity {
  constructor(x) {
    super(x, 'player');
    this.maxHp = PLAYER_MAX_HP;
    this.hp = this.maxHp;
    this.meter = 0;
    this.maxMeter = 100;
    this.jumpHeld = false;
    this.jumpCutDone = true;
    this.lastJumpPressAt = -999;
    this.time = 0;
    this.bufferedInput = null; // {type, at}
    this.hitEvents = []; // populated by combat.js each frame, consumed for FX/meter
    this.name = 'YOU';
    this.dashTimer = 0;
    this.comboStep = 0;
    this.lastAttackEndAt = -999;
    this.crouchAttacking = false;
  }

  buffer(type) {
    this.bufferedInput = { type, at: this.time };
  }

  update(dt, input, world) {
    this.time += dt;
    const frozen = this.updateTimers(dt);
    if (frozen) return;

    if (this.knockedDown > 0) {
      this.setState('knockdown');
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

    // finish/continue an in-flight attack
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
      this.vx *= 0.88;
      this.updatePhysics(dt);
      return;
    }

    // --- facing: auto-face nearest live enemy when free to act ---
    if (!this.isAttacking && world) {
      const nearest = world.nearestEnemy?.(this);
      if (nearest) this.facing = nearest.x >= this.x ? 1 : -1;
    }

    this.handleInput(dt, input);
    this.updatePhysics(dt);

    if (!this.isAttacking) {
      if (!this.onGround) this.setState(this.vy < 0 ? 'jump' : 'fall');
      else if (this.dashTimer > 0) this.setState('dash');
      else if (this.crouching) this.setState('crouch');
      else if (Math.abs(this.vx) > 5) this.setState('walk');
      else this.setState('idle');
    }

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) this.vx = 0;
    }
  }

  handleInput(dt, input) {
    const grounded = this.onGround;
    const canAct = !this.isAttacking || this.attack.phase === 'recovery';

    // crouch toggle
    this.crouching = grounded && input.isDown(KEYS.crouch) && !this.isAttacking;

    // movement
    let dir = 0;
    if (input.isDown(KEYS.left)) dir -= 1;
    if (input.isDown(KEYS.right)) dir += 1;
    const attackLocked = this.isAttacking && this.attack.phase !== 'recovery';
    if (!attackLocked && !(this.dashTimer > 0)) {
      this.vx = this.crouching ? 0 : dir * MOVE_SPEED;
    }

    // dash: double tap A or D
    if (grounded && !this.isAttacking) {
      if (input.wasDoubleTapped(KEYS.left, DOUBLE_TAP_WINDOW)) this.startDash(-1);
      else if (input.wasDoubleTapped(KEYS.right, DOUBLE_TAP_WINDOW)) this.startDash(1);
    }

    // jump
    if (input.pressed(KEYS.jump) && grounded && !this.isAttacking) {
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
      this.jumpCutDone = false;
      this.lastJumpPressAt = this.time;
      this.setState('jump');
    }
    if (input.released(KEYS.jump) && !this.jumpCutDone && this.vy < 0) {
      this.vy *= JUMP_CUT_MULT;
      this.jumpCutDone = true;
    }

    // blocking: hold crouch while grounded & idle-ish = guard stance
    this.isBlocking = grounded && input.isDown(KEYS.crouch) && !this.isAttacking && !this.crouchAttacking;

    if (!canAct) return;

    const justJumped = this.time - this.lastJumpPressAt <= JUMP_ATTACK_BUFFER;

    if (input.pressed(KEYS.special)) this.tryAttack('special', grounded, justJumped);
    else if (input.pressed(KEYS.heavy)) this.tryAttack('heavy', grounded, justJumped);
    else if (input.pressed(KEYS.light)) this.tryAttack('light', grounded, justJumped);
    else if (this.bufferedInput && this.time - this.bufferedInput.at <= INPUT_BUFFER) {
      this.tryAttack(this.bufferedInput.type, grounded, justJumped);
      this.bufferedInput = null;
    }
  }

  startDash(dir) {
    this.dashTimer = DASH_TIME;
    this.vx = dir * DASH_SPEED;
    this.facing = this.facing; // dashing doesn't force a turn
    if (dir !== this.facing) this.invulnerable = Math.max(this.invulnerable, 0.12); // back-dash = brief evasion
  }

  tryAttack(kind, grounded, justJumped) {
    if (this.isAttacking && this.attack.phase !== 'recovery') {
      this.buffer(kind);
      return;
    }
    let def = null;

    if (!grounded) {
      if (kind === 'heavy' && justJumped) def = A.uppercut;
      else if (kind === 'light' && justJumped) def = A.airRush;
      else if (kind === 'heavy') def = A.aerialHeavy;
      else if (kind === 'light') def = A.aerialLight;
      else if (kind === 'special') def = this.pickSpecial();
    } else if (this.crouching) {
      if (kind === 'light') def = A.crouchLight;
      else if (kind === 'heavy') def = A.sweep;
      else if (kind === 'special') def = this.pickSpecial();
    } else {
      if (kind === 'light') def = this.pickChainLight();
      else if (kind === 'heavy') def = this.pickChainHeavy();
      else if (kind === 'special') def = this.pickSpecial();
    }

    if (!def) return;
    if (def.meterCost && this.meter < def.meterCost) def = A.focusJab;
    if (def.meterCost) this.meter = Math.max(0, this.meter - def.meterCost);

    this.comboStep = def.chain ? (this.comboStep ?? 0) + 1 : 0;
    this.lastMoveId = def.id;
    this.crouchAttacking = this.crouching;
    this.vx = 0;
    this.startAttack(def);
  }

  pickChainLight() {
    const step = this.recentChainStep();
    if (step === 1 && this.lastMoveId === 'jab1') return A.jab2;
    if (step === 2 && this.lastMoveId === 'jab2') return A.jab3;
    this.comboStep = 0;
    return A.jab1;
  }

  pickChainHeavy() {
    const step = this.recentChainStep();
    if (step >= 1 && (this.lastMoveId === 'jab1' || this.lastMoveId === 'jab2')) return A.chainHeavy;
    return A.heavy;
  }

  recentChainStep() {
    if (!this.lastAttackEndAt) return 0;
    if (this.time - this.lastAttackEndAt > CHAIN_WINDOW) return 0;
    return this.comboStep ?? 0;
  }

  pickSpecial() {
    if (this.meter >= A.ultimate.meterCost) return A.ultimate;
    if (this.meter >= A.overdrive.meterCost) return A.overdrive;
    return A.focusJab;
  }

  onAttackLanded() {
    this.lastAttackEndAt = this.time;
  }

  updateAttackTimer(dt) {
    const wasAttacking = this.isAttacking;
    super.updateAttackTimer(dt);
    if (wasAttacking && !this.isAttacking) {
      this.lastAttackEndAt = this.time;
      this.crouchAttacking = false;
    }
  }

  onLand() {
    this.jumpCutDone = true;
  }

  takeDamage() {}

  getPose() {
    const t = this.stateTime;
    const facing = this.facing;
    let pose = {
      x: this.x,
      y: this.y,
      facing,
      crouch: this.crouching ? 1 : 0,
      lean: 0,
      bob: 0,
      scaleX: 1,
      scaleY: 1,
      headTilt: 0,
      legBack: { hipAngle: -0.15, kneeAngle: 0.3 },
      legFront: { hipAngle: 0.15, kneeAngle: -0.3 },
      armBack: { shoulderAngle: -0.3, elbowAngle: 0.6 },
      armFront: { shoulderAngle: 0.35, elbowAngle: -0.5 },
      weapon: null,
    };

    if (this.flashTimer > 0 && this.state !== 'knockdown' && this.state !== 'dead') {
      pose.tint = { color: '#ffffff', alpha: Math.min(0.6, this.flashTimer * 6) };
    }

    switch (this.state) {
      case 'idle': {
        const sway = Math.sin(t * 2.2) * 0.04;
        pose.lean = sway;
        pose.bob = Math.sin(t * 2.2) * 2;
        pose.legBack = { hipAngle: -0.08, kneeAngle: 0.18 };
        pose.legFront = { hipAngle: 0.08, kneeAngle: -0.18 };
        pose.armBack = { shoulderAngle: -0.25 + sway, elbowAngle: 0.55 };
        pose.armFront = { shoulderAngle: 0.4 + sway, elbowAngle: -0.65 };
        break;
      }
      case 'walk': {
        const cyc = t * 11;
        pose.legBack = { hipAngle: Math.sin(cyc) * 0.55, kneeAngle: Math.max(0, Math.cos(cyc)) * 0.7 + 0.15 };
        pose.legFront = { hipAngle: Math.sin(cyc + Math.PI) * 0.55, kneeAngle: Math.max(0, Math.cos(cyc + Math.PI)) * 0.7 + 0.15 };
        pose.armBack = { shoulderAngle: Math.sin(cyc + Math.PI) * 0.4 - 0.2, elbowAngle: 0.5 };
        pose.armFront = { shoulderAngle: Math.sin(cyc) * 0.4 + 0.3, elbowAngle: -0.5 };
        pose.bob = Math.abs(Math.sin(cyc)) * 3;
        pose.lean = 0.05 * facing * 0 + 0.06;
        break;
      }
      case 'crouch': {
        pose.crouch = Math.min(1, t / 0.1);
        pose.legBack = { hipAngle: -0.5, kneeAngle: 1.6 };
        pose.legFront = { hipAngle: 0.5, kneeAngle: -1.6 };
        pose.armBack = { shoulderAngle: -0.1, elbowAngle: 1.1 };
        pose.armFront = { shoulderAngle: 0.5, elbowAngle: -1.0 };
        pose.lean = 0.18;
        break;
      }
      case 'dash': {
        pose.lean = 0.5 * Math.sign(this.vx || facing);
        pose.legBack = { hipAngle: -0.9, kneeAngle: 1.3 };
        pose.legFront = { hipAngle: 0.7, kneeAngle: -0.4 };
        pose.armBack = { shoulderAngle: -0.7, elbowAngle: 0.8 };
        pose.armFront = { shoulderAngle: 0.9, elbowAngle: -0.3 };
        break;
      }
      case 'jump':
      case 'fall': {
        const rising = this.vy < 0;
        pose.legBack = { hipAngle: rising ? -0.6 : -0.2, kneeAngle: rising ? 1.2 : 0.9 };
        pose.legFront = { hipAngle: rising ? 0.5 : 0.15, kneeAngle: rising ? -1.0 : -0.8 };
        pose.armBack = { shoulderAngle: -1.4, elbowAngle: 0.6 };
        pose.armFront = { shoulderAngle: -1.1, elbowAngle: -0.6 };
        pose.lean = -0.05;
        break;
      }
      case 'knockdown': {
        pose.crouch = 1;
        pose.bob = 46;
        pose.lean = 1.55;
        pose.legBack = { hipAngle: 1.3, kneeAngle: 0.2 };
        pose.legFront = { hipAngle: 1.5, kneeAngle: -0.1 };
        pose.armBack = { shoulderAngle: 1.2, elbowAngle: 0.2 };
        pose.armFront = { shoulderAngle: 1.4, elbowAngle: -0.1 };
        break;
      }
      case 'dead': {
        pose.crouch = 1;
        pose.bob = 50;
        pose.lean = 1.55;
        pose.scaleY = 0.9;
        pose.legBack = { hipAngle: 1.3, kneeAngle: 0.2 };
        pose.legFront = { hipAngle: 1.5, kneeAngle: -0.1 };
        pose.armBack = { shoulderAngle: 1.2, elbowAngle: 0.2 };
        pose.armFront = { shoulderAngle: 1.4, elbowAngle: -0.1 };
        break;
      }
      case 'attack':
        applyAttackPose(pose, this.attack, facing);
        break;
    }

    if (this.inBlockstun) {
      pose.lean = -0.35;
      pose.armFront = { shoulderAngle: 0.1, elbowAngle: -1.4 };
      pose.armBack = { shoulderAngle: -0.1, elbowAngle: 1.4 };
    } else if (this.isBlocking) {
      pose.armFront = { shoulderAngle: 0.15, elbowAngle: -1.5 };
      pose.armBack = { shoulderAngle: -0.15, elbowAngle: 1.5 };
      pose.lean = -0.08;
    } else if (this.inHitstun) {
      pose.lean = -0.3 + Math.sin(t * 30) * 0.05;
      pose.headTilt = -0.3;
    }

    return pose;
  }
}

// Shared by player + could be reused conceptually by boss (kept local for clarity).
function applyAttackPose(pose, attack, facing) {
  const d = attack.def;
  const phase = attack.phase;
  const p = phase === 'startup' ? attack.timer / d.startup : phase === 'active' ? attack.timer / d.active : attack.timer / d.recovery;

  const arm = (windup, strike, follow) => ({
    shoulderAngle: phase === 'startup' ? lerp(windup, strike, p) : phase === 'active' ? lerp(strike, follow, p) : lerp(follow, 0.4, p),
    elbowAngle: -0.4,
  });

  switch (d.id) {
    case 'jab1':
    case 'jab2':
    case 'focusJab':
      pose.armFront = arm(-0.6, 1.5, 1.1);
      pose.armFront.elbowAngle = phase === 'active' ? -0.15 : -0.7;
      pose.lean = 0.25;
      break;
    case 'jab3':
      pose.legFront = { hipAngle: phase === 'active' ? 1.7 : 0.8, kneeAngle: -0.2 };
      pose.lean = 0.4;
      pose.armBack = { shoulderAngle: -0.9, elbowAngle: 0.6 };
      break;
    case 'chainHeavy':
    case 'uppercut':
      pose.armFront = { shoulderAngle: phase === 'active' ? -1.8 : -0.4, elbowAngle: phase === 'active' ? -0.2 : 1.2 };
      pose.legBack = { hipAngle: -0.7, kneeAngle: 1.4 };
      pose.legFront = { hipAngle: 0.5, kneeAngle: -0.3 };
      pose.bob = phase === 'active' ? -18 : phase === 'recovery' ? -6 : 0;
      pose.lean = -0.15;
      break;
    case 'heavy':
      pose.armFront = arm(-1.3, 1.7, 1.2);
      pose.armFront.elbowAngle = phase === 'active' ? -0.05 : -0.6;
      pose.lean = 0.35;
      break;
    case 'crouchLight':
      pose.crouch = 1;
      pose.armFront = { shoulderAngle: phase === 'active' ? 1.3 : 0.3, elbowAngle: -0.2 };
      break;
    case 'sweep':
      pose.crouch = 1;
      pose.legFront = { hipAngle: phase === 'active' ? 1.6 : 0.4, kneeAngle: -0.1 };
      pose.lean = 0.5;
      break;
    case 'airRush':
      pose.legBack = { hipAngle: 0.9, kneeAngle: -0.3 };
      pose.legFront = { hipAngle: 1.1, kneeAngle: -0.2 };
      pose.armFront = { shoulderAngle: 1.4, elbowAngle: -0.1 };
      pose.lean = 0.6;
      break;
    case 'aerialLight':
      pose.legFront = { hipAngle: 1.3, kneeAngle: -0.2 };
      pose.armFront = { shoulderAngle: 0.6, elbowAngle: -0.3 };
      break;
    case 'aerialHeavy':
      pose.legFront = { hipAngle: 1.5, kneeAngle: 0.05 };
      pose.legBack = { hipAngle: 1.4, kneeAngle: 0.05 };
      pose.lean = 0.2;
      break;
    case 'overdrive':
      pose.armFront = { shoulderAngle: Math.sin(attack.timer * 40) * 1.4, elbowAngle: -0.3 };
      pose.armBack = { shoulderAngle: Math.cos(attack.timer * 40) * 1.4, elbowAngle: 0.3 };
      pose.lean = 0.3;
      pose.weapon = { show: true, kind: 'aura', color: '#ffd23f', alpha: 0.5, reach: 60 };
      break;
    case 'ultimate':
      pose.armFront = { shoulderAngle: Math.sin(attack.timer * 50) * 1.6, elbowAngle: -0.2 };
      pose.armBack = { shoulderAngle: Math.cos(attack.timer * 50) * 1.6, elbowAngle: 0.2 };
      pose.lean = 0.35;
      pose.scaleX = 1.05;
      pose.weapon = { show: true, kind: 'aura', color: '#ff5c3f', alpha: 0.65, reach: 90 };
      break;
  }
}

function lerp(a, b, t) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export { A as PLAYER_MOVES };
