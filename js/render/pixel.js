// Low-level drawing helpers shared by every sprite in the game.
// Everything renders as flat-shaded, hard-edged shapes (no gradients/AA blur)
// so the game reads as crisp retro-2D at any zoom level.

export function setupCrispCanvas(ctx) {
  ctx.imageSmoothingEnabled = false;
}

export function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function rectOutline(ctx, x, y, w, h, color, lw = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
}

// Draws a rotated rectangle "bone" from an origin point along `angle`
// (radians, 0 = pointing down) with the given length/thickness.
// Returns the end point so limbs can be chained (shoulder -> elbow -> hand).
export function bone(ctx, ox, oy, angle, length, thickness, color) {
  const ex = ox + Math.sin(angle) * length;
  const ey = oy - Math.cos(angle) * length;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(-thickness / 2), 0, Math.round(thickness), Math.round(length));
  ctx.restore();
  return { x: ex, y: ey };
}

export function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function polygon(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}
