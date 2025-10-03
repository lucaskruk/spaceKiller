import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_TYPES,
  BOSS_FIRE_COOLDOWN,
  BOSS_MOVE_COOLDOWN,
  BOSS_TELEPORT_COOLDOWN,
  BOSS_TELEPORT_CHANCE,
  PLAYER_START,
} from '../constants.js';
import {
  drawBossDiagonalBullet,
  drawEnemyBullet,
  getCell,
  moveCell,
} from './grid.js';
import { hitPlayer } from './player.js';

const withinHorizontalBounds = (col) => col > 0 && col < BOARD_COLS - 1;
const withinVerticalBounds = (row) => row > 0 && row < PLAYER_START.row;

const tryMoveBossHorizontal = (draft, direction) => {
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

const tryMoveBossVertical = (draft, direction) => {
  const boss = draft.boss;
  if (!boss) {
    return false;
  }
  const delta = direction === 'up' ? -1 : 1;
  const nextRow = boss.row + delta;
  if (!withinVerticalBounds(nextRow)) {
    return false;
  }
  const target = getCell(draft.board, nextRow, boss.col);
  if (!target || target.type !== CELL_TYPES.EMPTY) {
    return false;
  }
  moveCell(draft.board, boss.row, boss.col, nextRow, boss.col);
  boss.row = nextRow;
  boss.verticalDirection = direction;
  return true;
};

const moveBoss = (draft) => {
  const boss = draft.boss;
  if (!boss) {
    return false;
  }
  const preferVertical = Math.random() < 0.4;
  if (preferVertical && tryMoveBossVertical(draft, boss.verticalDirection ?? 'down')) {
    return true;
  }
  if (tryMoveBossHorizontal(draft, boss.horizontalDirection ?? 'right')) {
    return true;
  }
  if (!preferVertical && tryMoveBossVertical(draft, boss.verticalDirection ?? 'down')) {
    return true;
  }
  const fallbackHorizontal = (boss.horizontalDirection ?? 'right') === 'right' ? 'left' : 'right';
  if (tryMoveBossHorizontal(draft, fallbackHorizontal)) {
    return true;
  }
  const fallbackVertical = (boss.verticalDirection ?? 'down') === 'down' ? 'up' : 'down';
  return tryMoveBossVertical(draft, fallbackVertical);
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

const teleportBoss = (draft) => {
  const boss = draft.boss;
  if (!boss) {
    return false;
  }
  const maxRow = PLAYER_START.row - 1;
  for (let attempts = 0; attempts < 6; attempts += 1) {
    const targetRow = Math.floor(Math.random() * maxRow) + 1;
    const targetCol = Math.floor(Math.random() * (BOARD_COLS - 2)) + 1;
    if (!withinVerticalBounds(targetRow) || !withinHorizontalBounds(targetCol)) {
      continue;
    }
    if (targetRow === boss.row && targetCol === boss.col) {
      continue;
    }
    const targetCell = getCell(draft.board, targetRow, targetCol);
    if (!targetCell || targetCell.type !== CELL_TYPES.EMPTY) {
      continue;
    }
    const previousRow = boss.row;
    const previousCol = boss.col;
    moveCell(draft.board, boss.row, boss.col, targetRow, targetCol);
    boss.row = targetRow;
    boss.col = targetCol;
    if (targetCol > previousCol) {
      boss.horizontalDirection = 'right';
    } else if (targetCol < previousCol) {
      boss.horizontalDirection = 'left';
    }
    if (targetRow > previousRow) {
      boss.verticalDirection = 'down';
    } else if (targetRow < previousRow) {
      boss.verticalDirection = 'up';
    }
    return true;
  }
  return false;
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

  if (draft.boss.teleportCooldown > 0) {
    draft.boss.teleportCooldown -= 1;
  } else if (Math.random() < BOSS_TELEPORT_CHANCE) {
    if (teleportBoss(draft)) {
      draft.boss.teleportCooldown = BOSS_TELEPORT_COOLDOWN;
    }
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
