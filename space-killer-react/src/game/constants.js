export const BOARD_ROWS = 18;
export const BOARD_COLS = 18;
export const BORDER_SYMBOL = '###';
export const EMPTY_SYMBOL = '   ';
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
export const ENEMY_DESTROY_SCORE = 100;
export const ENEMY_EVADE_COOLDOWN = 10;
export const ENEMY_EVADE_RANGE = 2;
export const ENEMY_STREAK_BONUS_STEP = 20;
export const ENEMY_STREAK_BONUS_CAP = 200;
export const ACCURACY_BONUS_THRESHOLDS = Object.freeze([
  { threshold: 0.9, bonus: 75 },
  { threshold: 0.75, bonus: 35 },
]);
export const LEVEL_ACCURACY_BONUS_THRESHOLDS = Object.freeze([
  { threshold: 0.9, bonus: 300 },
  { threshold: 0.75, bonus: 150 },
]);
export const LEVEL_STREAK_BONUS_VALUE = 50;
export const BOSS_FIRE_COOLDOWN = 4;
export const BOSS_MOVE_COOLDOWN = 2;
export const BOSS_TELEPORT_COOLDOWN = 10;
export const BOSS_TELEPORT_CHANCE = 0.10;
export const BOSS_REVENGE_BURST_SHOTS = 4;
export const BOSS_REVENGE_BURST_INTERVAL = 1;
export const LEVEL_CLEAR_TICK_MS = 100;
export const MAX_CONCURRENT_SHOTS = 7;
export const PLAYER_RELOAD_TICKS = 3;
export const HIGH_SCORE_LIMIT = 10;
export const HIGH_SCORE_NAME_MAX_LENGTH = 12;

export const SOUND_SOURCES = {
  music: {
    src: ['/audio/main_song.mp3'],
    options: { loop: true, volume: 0.15 },
  },
  playerShot: {
    src: ['/audio/playershot.wav'],
    options: { volume: 0.7 },
  },
  playerExplode: {
    src: ['/audio/player_explode.wav'],
    options: { volume: 0.7 },
  },
  enemyExplode: {
    src: ['/audio/enemy_explode.wav'],
    options: { volume: 0.55 },
  },
  winLevel: {
    src: ['/audio/win_level.ogg'],
    options: { volume: 0.9 },
  },
  lose: {
    src: ['/audio/lose.mp3'],
    options: { volume: 0.8 },
  },
};

export const EVENT_SOUND_KEY = {
  'player-fired': 'playerShot',
  'enemy-explosion': 'enemyExplode',
  'player-hit': 'playerExplode',
  'boss-hit': 'enemyExplode',
  'boss-defeated': 'winLevel',
  'level-cleared': 'winLevel',
  'campaign-complete': 'winLevel',
  'game-over': 'lose',
};

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

export const TEXT_SYMBOLS = {
  [CELL_TYPES.BORDER]: BORDER_SYMBOL,
  [CELL_TYPES.EMPTY]: EMPTY_SYMBOL,
  [CELL_TYPES.PLAYER_BULLET]: PLAYER_BULLET_SYMBOL,
  [CELL_TYPES.ENEMY_BULLET]: ENEMY_BULLET_SYMBOL,
  [CELL_TYPES.BOTH_BULLETS]: BOTH_BULLETS_SYMBOL,
  [CELL_TYPES.FILLER]: FILLER_SYMBOL,
  [CELL_TYPES.BOSS]: BOSS_SYMBOL,
  [CELL_TYPES.BOSS_DIAGONAL_BULLET]: BOSS_DIAGONAL_BULLET_SYMBOL,
  [CELL_TYPES.BOSS_COMBINED_BULLET]: BOSS_COMBINED_BULLET_SYMBOL,
};

export const PLAYER_START = {
  row: BOARD_ROWS - 2,
  col: Math.round(BOARD_COLS / 2),
};

export const ENEMY_ROW = 1;
export const ENEMY_COL_START = 3;
export const ENEMY_COL_END = BOARD_COLS - 3;

export const HOLD_INTERVAL = 130;
export const MOVE_LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
export const MOVE_RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
export const FIRE_KEYS = new Set([' ', 'Space', 'Spacebar', 'w', 'W', 'ArrowUp']);

export const HIGH_SCORE_STORAGE_KEY = 'space-killer-highscores';

export const ACTIONS = {
  RESET: 'reset',
  QUEUE_MOVE_LEFT: 'queue-move-left',
  QUEUE_MOVE_RIGHT: 'queue-move-right',
  QUEUE_SHOT: 'queue-shot',
  TICK: 'tick',
  PAUSE_TOGGLE: 'pause-toggle',
  ADVANCE_LEVEL: 'advance-level',
  PLAYER_RESPAWNED: 'player-respawned',
  SET_HIGH_SCORE_NAME: 'set-high-score-name',
};

export const MIN_WAIT_TIME = 120;
export const SPEED_MULTIPLIER = 0.95;
export const LEVEL_BONUS_PER_LEVEL = 250;
export const LEVEL_BONUS_PER_LIFE = 125;
