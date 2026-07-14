// Core tunables for the whole game. Keep gameplay numbers in one place.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const GROUND_Y = 560;
export const ARENA_LEFT = 60;
export const ARENA_RIGHT = CANVAS_W - 60;

export const GRAVITY = 2600;
export const JUMP_VELOCITY = -980;
export const JUMP_CUT_MULT = 0.45; // releasing jump early shortens the arc
export const MOVE_SPEED = 340;
export const CROUCH_SPEED_MULT = 0.0; // crouch is stationary, like SF/Tekken
export const DASH_SPEED = 760;
export const DASH_TIME = 0.16;
export const DOUBLE_TAP_WINDOW = 0.28;

export const KEYS = {
  left: 'a',
  right: 'd',
  jump: 'w',
  crouch: 's',
  light: 'l',
  heavy: 'k',
  special: 'j',
};

// Buffer window (seconds) during which pressing an attack right after a jump
// press counts as an aerial special (uppercut / rush) instead of a normal jump.
export const JUMP_ATTACK_BUFFER = 0.22;
// Generic input buffer so a button press slightly before it becomes valid still registers.
export const INPUT_BUFFER = 0.14;
// Combo chain window: time allowed between hits to keep chaining.
export const CHAIN_WINDOW = 0.55;

export const HITSTOP_LIGHT = 0.03;
export const HITSTOP_HEAVY = 0.07;
export const HITSTOP_SPECIAL = 0.12;

export const PLAYER_MAX_HP = 100;

export const COMBO_DAMAGE_SCALE = 0.88; // each subsequent combo hit does less damage
export const COMBO_DROP_TIME = 0.9; // no hits landed for this long => combo ends

export const PALETTE = {
  player: {
    skin: '#e8b98a',
    hair: '#2b2320',
    jacket: '#c23b3b',
    jacketShade: '#8f2a2a',
    pants: '#2c2c34',
    boots: '#141418',
    trim: '#f2d43d',
  },
  swordMob: {
    skin: '#9db28c',
    hair: '#333',
    jacket: '#4a5568',
    jacketShade: '#333c48',
    pants: '#23262e',
    boots: '#111',
    trim: '#9aa5b1',
    weapon: '#c7ccd1',
  },
  scytheMob: {
    skin: '#7b6f9e',
    hair: '#1b1330',
    jacket: '#3c2b52',
    jacketShade: '#26193a',
    pants: '#1a1226',
    boots: '#0c0810',
    trim: '#8a5cff',
    weapon: '#2b2b2b',
  },
  gunnerMob: {
    skin: '#d7b18a',
    hair: '#4a3320',
    jacket: '#6b3f2a',
    jacketShade: '#4a2b1c',
    pants: '#33241a',
    boots: '#161010',
    trim: '#e0a83e',
    weapon: '#444',
  },
  boss: {
    skin: '#c98a8a',
    hair: '#100a0a',
    jacket: '#7a1020',
    jacketShade: '#4a0a14',
    pants: '#1a1010',
    boots: '#0a0505',
    trim: '#ffcf4a',
    weapon: '#d43b3b',
  },
};
