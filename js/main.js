import { CANVAS_W, CANVAS_H } from './constants.js';
import { InputState } from './input.js';
import { setupCrispCanvas } from './render/pixel.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;
const ctx = canvas.getContext('2d');
setupCrispCanvas(ctx);

const input = new InputState();
const game = new Game(ctx);
window.__game = game; // dev/QA hook, harmless in production

canvas.addEventListener('click', () => canvas.focus());

let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 30);

  game.update(dt, input);
  game.render();
  input.update(dt);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
