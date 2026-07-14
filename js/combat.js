import { COMBO_DAMAGE_SCALE, COMBO_DROP_TIME, HITSTOP_LIGHT, HITSTOP_HEAVY, HITSTOP_SPECIAL } from './constants.js';

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Runs every frame: finds live attacker hitboxes, tests them against opposing
// hurtboxes, and applies damage/block/knockback/combo/meter/finisher logic.
// `game` supplies player, enemies, bullets and an onHit(event) callback used
// for particles / screen shake / score / finisher orchestration.
export function updateCombat(game) {
  const { player, enemies, bullets } = game;
  const attackers = [player, ...enemies].filter((e) => e && e.alive && e.activeHitbox);

  for (const attacker of attackers) {
    const hb = attacker.activeHitbox;
    if (!hb) continue;
    const targets = attacker.team === 'player' ? enemies.filter((e) => e.alive) : [player].filter((p) => p.alive);
    for (const defender of targets) {
      if (attacker.attack.hitTargets.has(defender.id)) continue;
      if (defender.invulnerable > 0) continue;
      if (!overlaps(hb, defender.hurtbox)) continue;
      attacker.attack.hitTargets.add(defender.id);
      resolveHit(attacker, defender, hb.def, game);
    }
  }

  if (bullets && bullets.length) {
    for (const b of bullets) {
      if (!b.alive) continue;
      if (player.invulnerable > 0 || !player.alive) continue;
      if (overlaps(b.hurtbox, player.hurtbox)) {
        b.alive = false;
        resolveBulletHit(b, player, game);
      }
    }
  }
}

function resolveHit(attacker, defender, def, game) {
  const dir = attacker.facing;
  const blocked = defender.isBlocking && !def.unblockable;

  // Combo chain bookkeeping lives on the defender (how many hits they've
  // eaten without recovering) so it works the same whether the player is
  // juggling a mob or a pack of mobs is juggling the player.
  if (!blocked) {
    defender.comboCount = defender.comboTimer > 0 ? defender.comboCount + 1 : 1;
    defender.comboTimer = COMBO_DROP_TIME;
  } else {
    defender.comboCount = 0;
    defender.comboTimer = 0;
  }

  const scale = blocked ? 1 : Math.pow(COMBO_DAMAGE_SCALE, Math.max(0, defender.comboCount - 1));
  const rawDamage = blocked ? def.damage * 0.12 : def.damage * scale;
  const damage = Math.max(1, Math.round(rawDamage));

  defender.hp = Math.max(0, defender.hp - damage);
  defender.takeHitFlash();

  if (blocked) {
    defender.blockstun = def.blockstun;
    defender.vx = def.knockback.x * 0.25 * dir;
  } else {
    defender.hitstun = def.hitstun;
    defender.vx = def.knockback.x * dir;
    if (def.knockback.y < 0) {
      defender.vy = def.knockback.y;
      defender.onGround = false;
    } else if (def.knockback.y > 0 && !defender.onGround) {
      defender.vy = def.knockback.y; // spike back toward the ground
    }
    if (def.knockdown && defender.onGround) {
      defender.knockedDown = 0.9;
    }
  }

  if (attacker.meter !== undefined && def.meterGain) {
    attacker.meter = Math.min(attacker.maxMeter, attacker.meter + def.meterGain);
  }
  if (!blocked && defender.meter !== undefined) {
    defender.meter = Math.min(defender.maxMeter, defender.meter + damage * 0.6);
  }

  const hitstopBase = def.ultimate ? HITSTOP_SPECIAL : def.special || def.launcher ? HITSTOP_HEAVY : HITSTOP_LIGHT;
  const hitstop = hitstopBase * (def.hitstopMul ?? (blocked ? 0.4 : 1));
  attacker.hitstop = Math.max(attacker.hitstop, hitstop);
  defender.hitstop = Math.max(defender.hitstop, hitstop);

  if (attacker.onAttackLanded) attacker.onAttackLanded();

  game.onHit?.({
    attacker,
    defender,
    def,
    damage,
    blocked,
    x: defender.x,
    y: defender.y - 60,
    killed: defender.hp <= 0,
    comboCount: defender.comboCount,
  });
}

function resolveBulletHit(bullet, player, game) {
  const blocked = player.isBlocking;
  const damage = blocked ? 1 : bullet.damage;
  player.hp = Math.max(0, player.hp - damage);
  player.takeHitFlash();
  if (blocked) {
    player.blockstun = 0.14;
  } else {
    player.hitstun = 0.22;
    player.vx = 160 * bullet.dir;
    player.comboCount = player.comboTimer > 0 ? player.comboCount + 1 : 1;
    player.comboTimer = COMBO_DROP_TIME;
    if (player.meter !== undefined) player.meter = Math.min(player.maxMeter, player.meter + damage * 0.6);
  }
  player.hitstop = Math.max(player.hitstop, blocked ? 0.02 : HITSTOP_LIGHT);

  game.onHit?.({
    attacker: bullet.owner,
    defender: player,
    def: { id: 'gunShot', damage },
    damage,
    blocked,
    x: player.x,
    y: player.y - 60,
    killed: player.hp <= 0,
    comboCount: player.comboCount,
    isBullet: true,
  });
}
