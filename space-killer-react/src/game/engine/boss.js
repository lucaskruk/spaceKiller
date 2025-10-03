import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_TYPES,
  BOSS_FIRE_COOLDOWN,
  BOSS_MOVE_COOLDOWN,
} from '../constants.js';
import {
  drawBossDiagonalBullet,
  drawEnemyBullet,
  getCell,
  moveCell,
} from './grid.js';
import { hitPlayer } from './player.js';

const withinHorizontalBounds = (col) => col > 0 && col < BOARD_COLS - 1;

const tryMoveBoss = (draft, direction) => {
  const boss = draft.boss;
  if (!boss) {
    return false;
  }
  const delta = direction === 'left' ? -1 : 1;
  const nextCol = boss.col + delta;
  if (!withinHorizontalBounds(nextCol)) {
    return false;
  }
  const target = getCell(draft.board, boss.row, nextCol);
  if (!target || target.type !== CELL_TYPES.EMPTY) {
    return false;
  }
  moveCell(draft.board, boss.row, boss.col, boss.row, nextCol);
  boss.col = nextCol;
  boss.horizontalDirection = direction;
  return true;
};

const moveBoss = (draft) => {
  const boss = draft.boss;
  if (!boss) {
    return false;
  }
  const direction = boss.horizontalDirection ?? 'right';
  if (tryMoveBoss(draft, direction)) {
    return true;
  }
  const fallbackDirection = direction === 'right' ? 'left' : 'right';
  return tryMoveBoss(draft, fallbackDirection);
};

const spawnVerticalShot = (draft) => {
  const boss = draft.boss;
  if (!boss) {
    return false;
  }
  const row = boss.row + 1;
  if (row >= BOARD_ROWS - 1) {
    return false;
  }
  const col = boss.col;
  const target = getCell(draft.board, row, col);
  if (!target) {
    return false;
  }
  if (target.type === CELL_TYPES.PLAYER) {
    hitPlayer(draft, row, col);
    return true;
  }
  if (target.type !== CELL_TYPES.EMPTY) {
    return false;
  }
  drawEnemyBullet(draft.board, row, col);
  return true;
};

const spawnDiagonalShot = (draft) => {
  const boss = draft.boss;
  if (!boss) {
    return { fired: false, direction: 'right' };
  }
  const row = boss.row + 1;
  if (row >= BOARD_ROWS - 1) {
    return { fired: false, direction: boss.diagonalDirection };
  }
  let direction = boss.diagonalDirection ?? 'right';
  let col = boss.col + (direction === 'right' ? 1 : -1);

  if (!withinHorizontalBounds(col)) {
    direction = direction === 'right' ? 'left' : 'right';
    col = boss.col + (direction === 'right' ? 1 : -1);
  }

  if (!withinHorizontalBounds(col)) {
    return { fired: false, direction };
  }

  const target = getCell(draft.board, row, col);
  if (!target) {
    return { fired: false, direction };
  }

  if (target.type === CELL_TYPES.PLAYER) {
    hitPlayer(draft, row, col);
    return { fired: true, direction };
  }

  if (target.type !== CELL_TYPES.EMPTY) {
    return { fired: false, direction };
  }

  drawBossDiagonalBullet(draft.board, row, col, direction);
  return { fired: true, direction };
};

const fireBossWeapons = (draft) => {
  const firedVertical = spawnVerticalShot(draft);
  const diagonalResult = spawnDiagonalShot(draft);
  const firedDiagonal = diagonalResult.fired;
  if (draft.boss) {
    draft.boss.diagonalDirection = diagonalResult.direction;
  }
  return firedVertical || firedDiagonal;
};

export const updateBoss = (draft) => {
  if (!draft.boss) {
    return;
  }

  if (draft.boss.moveCooldown > 0) {
    draft.boss.moveCooldown -= 1;
  } else if (moveBoss(draft)) {
    draft.boss.moveCooldown = BOSS_MOVE_COOLDOWN;
  } else {
    draft.boss.moveCooldown = 1;
  }

  if (draft.boss.fireCooldown > 0) {
    draft.boss.fireCooldown -= 1;
  } else if (fireBossWeapons(draft)) {
    draft.boss.fireCooldown = BOSS_FIRE_COOLDOWN;
  }
};
