export const BOARD_ROWS = 18;
export const BOARD_COLS = 18;
export const BORDER_SYMBOL = '###';
export const EMPTY_SYMBOL = '   ';
export const PLAYER_SPRITE = "<img src='/img/ship.png' alt='Player ship' />";
export const ENEMY_SPRITE = "<img src='/img/enemy.png' alt='Enemy ship' />";
export const PLAYER_BULLET_SYMBOL = ' * ';
export const ENEMY_BULLET_SYMBOL = ' + ';
export const BOTH_BULLETS_SYMBOL = '* +';
export const FILLER_SYMBOL = '@@';
export const BOSS_SYMBOL = ' B ';
export const BOSS_DIAGONAL_BULLET_SYMBOL = ' @ ';
export const BOSS_COMBINED_BULLET_SYMBOL = ' + @';

export const INITIAL_LIVES = 5;
export const INITIAL_WAIT_TIME = 400;
export const LAST_LEVEL = 10;
export const BOSS_LEVEL = 10;
export const BOSS_INITIAL_LIVES = 5;
export const BOSS_HIT_SCORE = 250;
export const BOSS_FIRE_COOLDOWN = 4;
export const BOSS_MOVE_COOLDOWN = 2;
export const BOSS_TELEPORT_COOLDOWN = 6;
export const BOSS_TELEPORT_CHANCE = 0.12;
export const LEVEL_CLEAR_TICK_MS = 200;
export const MAX_CONCURRENT_SHOTS = 7;
export const HIGH_SCORE_LIMIT = 10;

export const CELL_TYPES = {
  BORDER: 'border',
  EMPTY: 'empty',
  PLAYER: 'player',
  ENEMY: 'enemy',
  BOSS: 'boss',
  PLAYER_BULLET: 'player-bullet',
  ENEMY_BULLET: 'enemy-bullet',
  BOSS_DIAGONAL_BULLET: 'boss-diagonal-bullet',
  BOSS_COMBINED_BULLET: 'boss-combined-bullet',
  BOTH_BULLETS: 'both-bullets',
  FILLER: 'filler',
};

export const PLAYER_START = {
  row: BOARD_ROWS - 2,
  col: Math.round(BOARD_COLS / 2),
};

export const ENEMY_ROW = 1;
export const ENEMY_COL_START = 3;
export const ENEMY_COL_END = BOARD_COLS - 3;

export const MUSIC_VOLUME = 0.2;
