import { KEYS } from './constants.js';

// Tracks key state plus timestamps so we can detect buffered / combo inputs
// (double-tap dash, jump-then-attack specials, chain windows) without
// coupling the raw DOM events to gameplay logic.
export class InputState {
  constructor() {
    this.down = new Set();
    this.pressedThisFrame = new Set();
    this.releasedThisFrame = new Set();
    this.lastDownTime = new Map(); // key -> time.now() at press
    this.lastTapTime = new Map(); // key -> time of previous tap (for double-tap)
    this.time = 0;
    this.enabled = true;

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (!this.enabled) return;
      if (Object.values(KEYS).includes(k) || k === 'enter' || k === ' ') e.preventDefault();
      if (this.down.has(k)) return; // ignore OS key-repeat
      this.down.add(k);
      this.pressedThisFrame.add(k);
      this.lastTapTime.set(k, this.lastDownTime.get(k) ?? -999);
      this.lastDownTime.set(k, this.time);
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.down.delete(k);
      this.releasedThisFrame.add(k);
    });
  }

  update(dt) {
    this.time += dt;
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }

  isDown(k) {
    return this.down.has(k);
  }
  pressed(k) {
    return this.pressedThisFrame.has(k);
  }
  released(k) {
    return this.releasedThisFrame.has(k);
  }
  timeSincePress(k) {
    const t = this.lastDownTime.get(k);
    return t === undefined ? Infinity : this.time - t;
  }
  wasDoubleTapped(k, window) {
    const last = this.lastDownTime.get(k);
    const prev = this.lastTapTime.get(k);
    if (last === undefined || prev === undefined) return false;
    return this.pressedThisFrame.has(k) && last - prev <= window;
  }
}
