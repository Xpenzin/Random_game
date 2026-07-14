import { CANVAS_W } from './constants.js';

const BAR_W = 420;
const BAR_H = 26;

function healthColor(frac) {
  if (frac > 0.5) return '#5ad35a';
  if (frac > 0.2) return '#e8c93f';
  return '#e14b3f';
}

function drawHealthBar(ctx, x, y, w, h, frac, ghostFrac, anchorRight) {
  ctx.fillStyle = '#1a1a1f';
  ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y, w, h);

  const ghostW = Math.max(0, Math.min(1, ghostFrac)) * w;
  ctx.fillStyle = '#8a2f2f';
  if (anchorRight) ctx.fillRect(x + w - ghostW, y, ghostW, h);
  else ctx.fillRect(x, y, ghostW, h);

  const fillW = Math.max(0, Math.min(1, frac)) * w;
  ctx.fillStyle = healthColor(frac);
  if (anchorRight) ctx.fillRect(x + w - fillW, y, fillW, h);
  else ctx.fillRect(x, y, fillW, h);

  ctx.strokeStyle = '#e9e6da';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

export function drawHUD(ctx, game) {
  const { player } = game;
  const target = game.hudTarget();

  // ghost drain: lags behind real hp for that classic "delayed damage" readout
  game.playerGhost = approach(game.playerGhost ?? player.hp, player.hp, game.dt * 60);
  game.enemyGhost = approach(game.enemyGhost ?? (target?.hp ?? 0), target?.hp ?? 0, game.dt * 60);

  ctx.font = 'bold 15px monospace';
  ctx.textBaseline = 'alphabetic';

  // player bar (left)
  ctx.fillStyle = '#f2efe4';
  ctx.fillText(player.name, 30, 42);
  drawHealthBar(ctx, 30, 50, BAR_W, BAR_H, player.hp / player.maxHp, game.playerGhost / player.maxHp, false);

  // special meter under player bar
  const meterW = 260;
  ctx.fillStyle = '#111';
  ctx.fillRect(30, 84, meterW, 10);
  const segCount = 3;
  const segFrac = Math.min(1, player.meter / 100);
  ctx.fillStyle = player.meter >= 100 ? '#ffd23f' : '#4fa8ff';
  ctx.fillRect(30, 84, meterW * segFrac, 10);
  ctx.strokeStyle = '#333';
  for (let i = 1; i < segCount; i++) {
    const sx = 30 + (meterW / segCount) * i;
    ctx.beginPath();
    ctx.moveTo(sx, 84);
    ctx.lineTo(sx, 94);
    ctx.stroke();
  }
  ctx.strokeStyle = '#e9e6da';
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 84, meterW, 10);
  ctx.fillStyle = '#cfd6e0';
  ctx.font = '11px monospace';
  ctx.fillText(player.meter >= 100 ? 'ULTIMATE READY (J)' : 'SPECIAL METER', 30, 106);

  // enemy bar (right)
  if (target) {
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#f2efe4';
    const label = target.name ?? 'ENEMY';
    const tw = ctx.measureText(label).width;
    ctx.fillText(label, CANVAS_W - 30 - tw, 42);
    drawHealthBar(ctx, CANVAS_W - 30 - BAR_W, 50, BAR_W, BAR_H, target.hp / target.maxHp, game.enemyGhost / target.maxHp, true);
  }

  // wave / score banner
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#f2efe4';
  ctx.fillText(game.bossWave ? 'RIVAL DUEL' : `WAVE ${game.wave}`, CANVAS_W / 2, 40);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#c9c2b0';
  ctx.fillText(`SCORE ${game.score}`, CANVAS_W / 2, 60);
  ctx.textAlign = 'left';

  drawComboText(ctx, game);
  drawBanner(ctx, game);
}

function approach(cur, target, rate) {
  if (cur > target) return Math.max(target, cur - rate);
  if (cur < target) return Math.min(target, cur + rate);
  return cur;
}

function drawComboText(ctx, game) {
  const info = game.comboInfo;
  if (!info || info.count < 2 || info.timer <= 0) return;
  const pop = Math.min(1, (info.popTime ?? 0) / 0.15);
  const scale = 1 + (1 - pop) * 0.6;
  ctx.save();
  ctx.translate(CANVAS_W / 2, 150);
  ctx.scale(scale, scale);
  ctx.textAlign = 'center';
  ctx.font = 'bold 40px monospace';
  ctx.fillStyle = '#ffd23f';
  ctx.strokeStyle = '#3a2a10';
  ctx.lineWidth = 5;
  const text = `${info.count} HIT COMBO`;
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  ctx.textAlign = 'left';
}

function drawBanner(ctx, game) {
  if (game.bannerTimer > 0 && game.bannerText) {
    const t = game.bannerTimer;
    const alpha = Math.min(1, t * 3);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.font = 'bold 46px monospace';
    ctx.fillStyle = game.bannerColor ?? '#ff5c3f';
    ctx.strokeStyle = '#1a1005';
    ctx.lineWidth = 6;
    ctx.strokeText(game.bannerText, CANVAS_W / 2, 240);
    ctx.fillText(game.bannerText, CANVAS_W / 2, 240);
    ctx.restore();
    ctx.textAlign = 'left';
  }
}

export function drawStartScreen(ctx) {
  ctx.fillStyle = 'rgba(8,8,12,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 64px monospace';
  ctx.fillText('PIXEL BRAWLER', CANVAS_W / 2, 190);
  ctx.fillStyle = '#e9e6da';
  ctx.font = '20px monospace';
  ctx.fillText('Survive the waves. Duel the rival every 5th wave.', CANVAS_W / 2, 230);

  const lines = [
    'A / D - move        W - jump        S - crouch / block',
    'L - light attack     K - heavy attack     J - special / ultimate',
    'Double-tap A or D to dash. Jump then K = Rising Uppercut.',
    'Jump then L = Aerial Rush. Chain L, L, L or L, L, K for combos.',
  ];
  ctx.font = '17px monospace';
  lines.forEach((l, i) => ctx.fillText(l, CANVAS_W / 2, 300 + i * 28));

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#5ad35a';
  const pulse = 0.7 + Math.sin(performance.now() / 300) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('PRESS ENTER TO START', CANVAS_W / 2, 470);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export function drawGameOverScreen(ctx, game) {
  ctx.fillStyle = 'rgba(8,8,12,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = game.won ? '#5ad35a' : '#e14b3f';
  ctx.font = 'bold 54px monospace';
  ctx.fillText(game.won ? 'RIVAL DEFEATED' : 'YOU DIED', CANVAS_W / 2, 250);

  ctx.fillStyle = '#e9e6da';
  ctx.font = '20px monospace';
  ctx.fillText(`Waves survived: ${game.wave}`, CANVAS_W / 2, 310);
  ctx.fillText(`Max combo: ${game.maxCombo}`, CANVAS_W / 2, 340);
  ctx.fillText(`Score: ${game.score}`, CANVAS_W / 2, 370);

  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#ffd23f';
  const pulse = 0.7 + Math.sin(performance.now() / 300) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillText('PRESS ENTER TO RESTART', CANVAS_W / 2, 440);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
