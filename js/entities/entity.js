import { GRAVITY, GROUND_Y, ARENA_LEFT, ARENA_RIGHT } from '../constants.js';

let nextId = 1;

// Shared physics + state-machine + combat plumbing for the player, every mob
// type and the boss. Subclasses provide their own movesets/AI and override
// getPose() to describe how the rig should be posed for the current state.
export class Entity {
  constructor(x, team) {
    this.id = nextId++;
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.width = 40;
    this.height = 92;
    this.facing = team === 'player' ? 1 : -1;
    this.team = team; // 'player' | 'enemy'
    this.onGround = true;
    this.crouching = false;

    this.maxHp = 100;
    this.hp = 100;
    this.alive = true;
    this.dead = false; // true once death animation finished

    this.state = 'idle';
    this.stateTime = 0;
    this.hitstun = 0;
    this.blockstun = 0;
    this.hitstop = 0; // freeze-frame on impact, shared by attacker+victim
    this.invulnerable = 0;
    this.isBlocking = false;
    this.knockedDown = 0;

    this.attack = null; // active attack instance, see startAttack()
    this.comboCount = 0;
    this.comboTimer = 0;

    this.flashTimer = 0; // white hit-flash
    this.deathTimer = 0;
    this.finisherTimer = 0;
    this.isFinisherVictim = false;

    this.squash = { x: 1, y: 1 };
  }

  get left() {
    return this.x - this.width / 2;
  }
  get right() {
    return this.x + this.width / 2;
  }
  get top() {
    return this.y - (this.crouching ? this.height * 0.62 : this.height);
  }

  setState(s) {
    if (this.state !== s) {
      this.state = s;
      this.stateTime = 0;
    }
  }

  startAttack(def) {
    this.attack = {
      def,
      phase: 'startup',
      timer: 0,
      hasHit: false,
      hitTargets: new Set(),
    };
    this.setState(def.animState ?? 'attack');
  }

  cancelAttack() {
    this.attack = null;
  }

  get isAttacking() {
    return !!this.attack;
  }

  get activeHitbox() {
    if (!this.attack || this.attack.phase !== 'active') return null;
    const d = this.attack.def;
    const ox = d.hitbox.x * this.facing;
    return {
      x: this.x + ox - d.hitbox.w / 2,
      y: this.y - d.hitbox.y - d.hitbox.h / 2,
      w: d.hitbox.w,
      h: d.hitbox.h,
      def: d,
      owner: this,
    };
  }

  get hurtbox() {
    const h = this.crouching ? this.height * 0.62 : this.height;
    return { x: this.left + 4, y: this.y - h, w: this.width - 8, h: h - 4 };
  }

  updatePhysics(dt) {
    if (!this.onGround) {
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y;
        this.vy = 0;
        this.onGround = true;
        if (this.hitstun > 0) this.knockedDown = Math.max(this.knockedDown, 0.45);
        this.onLand?.();
      }
    }
    this.x += this.vx * dt;
    this.x = Math.max(ARENA_LEFT + this.width / 2, Math.min(ARENA_RIGHT - this.width / 2, this.x));
  }

  updateAttackTimer(dt) {
    if (!this.attack) return;
    const a = this.attack;
    const d = a.def;
    a.timer += dt;
    if (a.phase === 'startup' && a.timer >= d.startup) {
      a.phase = 'active';
      a.timer = 0;
    } else if (a.phase === 'active' && a.timer >= d.active) {
      a.phase = 'recovery';
      a.timer = 0;
    } else if (a.phase === 'recovery' && a.timer >= d.recovery) {
      this.attack = null;
      this.setState('idle');
    }
  }

  updateTimers(dt) {
    if (this.hitstop > 0) {
      this.hitstop = Math.max(0, this.hitstop - dt);
      return true; // frozen this frame
    }
    if (this.hitstun > 0) this.hitstun = Math.max(0, this.hitstun - dt);
    if (this.blockstun > 0) this.blockstun = Math.max(0, this.blockstun - dt);
    if (this.invulnerable > 0) this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt);
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }
    if (this.knockedDown > 0) this.knockedDown = Math.max(0, this.knockedDown - dt);
    this.stateTime += dt;
    return false;
  }

  get inHitstun() {
    return this.hitstun > 0;
  }
  get inBlockstun() {
    return this.blockstun > 0;
  }
  get isStunned() {
    return this.hitstun > 0 || this.blockstun > 0 || this.knockedDown > 0;
  }

  takeHitFlash() {
    this.flashTimer = 0.09;
  }

  distanceTo(other) {
    return other.x - this.x;
  }
}
