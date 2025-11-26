import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_TYPES,
  BOSS_FIRE_COOLDOWN,
  BOSS_MOVE_COOLDOWN,
  BOSS_TELEPORT_COOLDOWN,
  BOSS_TELEPORT_CHANCE,
  BOSS_REVENGE_BURST_INTERVAL,
  BOSS_MIN_PLAYER_VERTICAL_GAP,
  BOSS_ADDITIONAL_ENEMY_SPAWN_INTERVAL,
  BOSS_ADDITIONAL_ENEMY_SPAWN_CHANCE,
  BOSS_LEVEL,
  BOSS_GLOWING_ENEMY_SPAWN_CHANCE,
  GLOWING_ENEMY_SPAWN_CHANCE,
  ENEMY_ROW,
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
const bossMaxRow = () => Math.max(1, PLAYER_START.row - BOSS_MIN_PLAYER_VERTICAL_GAP);
const withinVerticalBounds = (row) => row > 0 && row <= bossMaxRow();

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

const resetAdditionalEnemySpawnCooldown = (boss) => {
  boss.additionalEnemySpawnCooldown = BOSS_ADDITIONAL_ENEMY_SPAWN_INTERVAL
    + Math.floor(Math.random() * 4);
};

const spawnAdditionalEnemy = (draft) => {
  const availableCols = [];
  for (let col = 1; col < BOARD_COLS - 1; col += 1) {
    const cell = getCell(draft.board, ENEMY_ROW, col);
    if (cell && cell.type === CELL_TYPES.EMPTY) {
      availableCols.push(col);
    }
  }
  if (!availableCols.length) {
    return false;
  }
  const chosenCol = availableCols[Math.floor(Math.random() * availableCols.length)];
  const cell = getCell(draft.board, ENEMY_ROW, chosenCol);
  if (!cell) {
    return false;
  }
  cell.type = CELL_TYPES.ENEMY;
  cell.blocked = false;
  cell.occupantId = null;
  const level = draft.metrics?.level ?? 1;
  const glowChance = level === BOSS_LEVEL ? BOSS_GLOWING_ENEMY_SPAWN_CHANCE : GLOWING_ENEMY_SPAWN_CHANCE;
  const shouldGlow = Math.random() < glowChance;
  cell.isGlowing = shouldGlow;
  draft.enemies = Math.max(0, (draft.enemies ?? 0) + 1);
  if (shouldGlow) {
    draft.activeGlowingEnemyLevel = level;
    draft.events?.push?.('glowing-enemy-spawned');
  }
  draft.events?.push?.('boss-summoned-enemy');
  return true;
};

const maybeSpawnAdditionalEnemy = (draft) => {
  const boss = draft.boss;
  if (!boss) {
    return;
  }
  if ((draft.metrics?.level ?? 0) !== BOSS_LEVEL) {
    return;
  }
  if (typeof boss.additionalEnemySpawnCooldown !== 'number') {
    resetAdditionalEnemySpawnCooldown(boss);
  }
  if (boss.additionalEnemySpawnCooldown > 0) {
    boss.additionalEnemySpawnCooldown -= 1;
    return;
  }
  if (Math.random() < BOSS_ADDITIONAL_ENEMY_SPAWN_CHANCE) {
    spawnAdditionalEnemy(draft);
  }
  resetAdditionalEnemySpawnCooldown(boss);
};

const teleportBoss = (draft) => {
  const boss = draft.boss;
  if (!boss) {
    return false;
  }
  const maxRow = bossMaxRow();
  const candidates = [];
  for (let row = 1; row <= maxRow; row += 1) {
    for (let col = 1; col < BOARD_COLS - 1; col += 1) {
      if (!withinVerticalBounds(row) || !withinHorizontalBounds(col)) {
        continue;
      }
      if (row === boss.row && col === boss.col) {
        continue;
      }
      const targetCell = getCell(draft.board, row, col);
      if (targetCell && targetCell.type === CELL_TYPES.EMPTY) {
        candidates.push({ row, col });
      }
    }
  }
  if (!candidates.length) {
    return false;
  }
  const choice = candidates[Math.floor(Math.random() * candidates.length)];
  const previousRow = boss.row;
  const previousCol = boss.col;
  moveCell(draft.board, boss.row, boss.col, choice.row, choice.col);
  boss.row = choice.row;
  boss.col = choice.col;
  if (choice.col > previousCol) {
    boss.horizontalDirection = 'right';
  } else if (choice.col < previousCol) {
    boss.horizontalDirection = 'left';
  }
  if (choice.row > previousRow) {
    boss.verticalDirection = 'down';
  } else if (choice.row < previousRow) {
    boss.verticalDirection = 'up';
  }
  return true;
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
  const boss = draft.boss;
  if (!boss) {
    return;
  }

  maybeSpawnAdditionalEnemy(draft);

  if (boss.pendingImmediateTeleport) {
    const teleported = teleportBoss(draft);
    boss.pendingImmediateTeleport = !teleported;
    if (teleported) {
      boss.teleportCooldown = BOSS_TELEPORT_COOLDOWN;
      boss.revengeFireDelay = 0;
    } else {
      boss.teleportCooldown = Math.max(boss.teleportCooldown ?? 0, 1);
    }
  } else if (boss.teleportCooldown > 0) {
    boss.teleportCooldown -= 1;
  } else if (Math.random() < BOSS_TELEPORT_CHANCE) {
    if (teleportBoss(draft)) {
      boss.teleportCooldown = BOSS_TELEPORT_COOLDOWN;
    }
  }

  if (boss.moveCooldown > 0) {
    boss.moveCooldown -= 1;
  } else if (moveBoss(draft)) {
    boss.moveCooldown = BOSS_MOVE_COOLDOWN;
  } else {
    boss.moveCooldown = 1;
  }

  if (typeof boss.revengeFireDelay !== 'number') {
    boss.revengeFireDelay = 0;
  }

  if (boss.revengeShotsRemaining > 0) {
    if (boss.revengeFireDelay > 0) {
      boss.revengeFireDelay -= 1;
    }
    if (boss.revengeFireDelay <= 0) {
      if (fireBossWeapons(draft)) {
        boss.revengeShotsRemaining -= 1;
        boss.revengeFireDelay = BOSS_REVENGE_BURST_INTERVAL;
      } else {
        boss.revengeShotsRemaining = 0;
      }
    }
    boss.fireCooldown = BOSS_FIRE_COOLDOWN;
    return;
  }

  if (boss.fireCooldown > 0) {
    boss.fireCooldown -= 1;
  } else if (fireBossWeapons(draft)) {
    boss.fireCooldown = BOSS_FIRE_COOLDOWN;
  }
};
