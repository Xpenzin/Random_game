import { bone, rect, circle, polygon } from './pixel.js';

// A fighter is a small procedural skeleton (head, torso, 2 arms, 2 legs, optional
// weapon) posed every frame from plain numbers. This is what lets one renderer
// draw the player, three mob types and the boss with completely different
// silhouettes/weapons just by swapping palette + limb-length + weapon config,
// while animation stays buttery smooth (it's interpolated joint angles, not
// a hand-drawn sprite sheet).
//
// All limb angles are ABSOLUTE radians where 0 = pointing straight down and
// positive rotates clockwise (toward the character's facing direction).
// Joints are authored back-to-front: shoulder->elbow, hip->knee.

const DEFAULT_PROPORTIONS = {
  legUpper: 22,
  legLower: 22,
  torso: 34,
  armUpper: 18,
  armLower: 18,
  headR: 11,
  limbThick: 9,
  torsoThick: 16,
  hipThick: 15,
};

export function drawFighter(ctx, palette, pose, proportions = DEFAULT_PROPORTIONS) {
  const P = proportions;
  const scale = pose.scale ?? 1;
  const scaleY = (pose.scaleY ?? 1) * scale;
  const scaleX = (pose.scaleX ?? 1) * scale;
  const crouch = pose.crouch ?? 0;
  const legShrink = 1 - crouch * 0.42;

  ctx.save();
  ctx.translate(Math.round(pose.x), Math.round(pose.y + (pose.bob ?? 0)));
  ctx.scale(pose.facing * scaleX, scaleY);

  const rootY = -(P.legUpper + P.legLower) * legShrink; // hip joint, relative to feet baseline
  const lean = pose.lean ?? 0;

  // --- back leg ---
  drawLeg(ctx, 0, rootY, pose.legBack, P, legShrink, palette.pants, palette.boots);
  // --- back arm ---
  drawArm(ctx, 0, rootY - P.torso * 0.92, pose.armBack, P, palette.jacketShade, palette.skin);

  // --- torso ---
  ctx.save();
  ctx.translate(0, rootY);
  ctx.rotate(lean);
  rect(ctx, -P.hipThick / 2, -4, P.hipThick, 10, palette.pants);
  polygon(
    ctx,
    [
      [-P.torsoThick / 2, 0],
      [P.torsoThick / 2, 0],
      [P.torsoThick / 2 + 2, -P.torso],
      [-P.torsoThick / 2 - 2, -P.torso],
    ],
    palette.jacket
  );
  rect(ctx, -P.torsoThick / 2, -P.torso * 0.55, P.torsoThick, 5, palette.jacketShade);
  ctx.restore();

  // --- head ---
  const headBaseX = Math.sin(lean) * P.torso;
  const headBaseY = rootY - Math.cos(lean) * P.torso;
  ctx.save();
  ctx.translate(headBaseX, headBaseY);
  ctx.rotate((pose.headTilt ?? 0) + lean * 0.4);
  circle(ctx, 0, -P.headR * 0.85, P.headR, palette.skin);
  polygon(
    ctx,
    [
      [-P.headR, -P.headR * 1.5],
      [P.headR, -P.headR * 1.5],
      [P.headR - 2, -P.headR * 0.6],
      [-P.headR + 2, -P.headR * 0.6],
    ],
    palette.hair
  );
  if (pose.facing !== undefined) {
    rect(ctx, 2, -P.headR * 0.9, 3, 2, '#000'); // eye mark for a hint of facing/expression
  }
  ctx.restore();

  // --- front leg ---
  drawLeg(ctx, 0, rootY, pose.legFront, P, legShrink, palette.pants, palette.boots);
  // --- front arm + weapon ---
  const handPos = drawArm(
    ctx,
    0,
    rootY - P.torso * 0.92,
    pose.armFront,
    P,
    palette.jacket,
    palette.skin
  );

  if (pose.weapon && pose.weapon.show) {
    drawWeapon(ctx, handPos, pose.weapon, palette);
  }

  if (pose.tint) {
    ctx.globalAlpha = pose.tint.alpha;
    ctx.fillStyle = pose.tint.color;
    ctx.fillRect(-30, rootY - P.torso - P.headR * 2, 60, 120);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawLeg(ctx, ox, oy, leg, P, legShrink, colorUpper, colorLower) {
  const knee = bone(ctx, ox, oy, leg.hipAngle, P.legUpper * legShrink, P.limbThick, colorUpper);
  const foot = bone(ctx, knee.x, knee.y, leg.kneeAngle, P.legLower * legShrink, P.limbThick - 1, colorLower);
  return foot;
}

function drawArm(ctx, ox, oy, arm, P, colorUpper, colorHand) {
  const elbow = bone(ctx, ox, oy, arm.shoulderAngle, P.armUpper, P.limbThick - 1, colorUpper);
  const hand = bone(ctx, elbow.x, elbow.y, arm.elbowAngle, P.armLower, P.limbThick - 2, colorHand);
  return hand;
}

function drawWeapon(ctx, hand, weapon, palette) {
  ctx.save();
  ctx.translate(hand.x, hand.y);
  ctx.rotate(weapon.angle);
  const reach = weapon.reach ?? 40;
  const color = weapon.color ?? palette.weapon ?? '#ccc';
  switch (weapon.kind) {
    case 'sword':
      rect(ctx, -3, -8, 6, 8, '#3a2a1a'); // hilt
      polygon(ctx, [[-3, -8], [3, -8], [2, -8 - reach], [-2, -8 - reach]], color);
      break;
    case 'scythe': {
      rect(ctx, -2, -reach, 4, reach + 10, '#241c14'); // pole
      polygon(
        ctx,
        [
          [-2, -reach],
          [-2 - reach * 0.6, -reach - 6],
          [-2 - reach * 0.55, -reach + 14],
          [-2, -reach + 10],
        ],
        color
      );
      break;
    }
    case 'gun':
      rect(ctx, -4, -6, 22, 8, color);
      rect(ctx, 14, -8, 6, 4, '#222');
      if (weapon.flash) {
        polygon(
          ctx,
          [
            [22, -4],
            [34, -8],
            [34, 0],
          ],
          '#ffe27a'
        );
        polygon(
          ctx,
          [
            [22, -4],
            [34, 0],
            [34, 6],
          ],
          '#ffe27a'
        );
      }
      break;
    case 'aura':
      ctx.globalAlpha = weapon.alpha ?? 0.7;
      circle(ctx, 0, -8, reach * 0.4, color);
      ctx.globalAlpha = 1;
      break;
  }
  ctx.restore();
}
