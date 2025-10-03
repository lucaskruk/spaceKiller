
import { CELL_TYPES, MAX_CONCURRENT_SHOTS } from '../constants.js';
import { clearCell, drawBothBullets, drawPlayerBullet, getCell, moveCell } from './grid.js';
import { killEnemy } from './enemy.js';
import { isPlayable } from './status.js';

export const hitPlayer = (draft, row, col) => {
  const cell = getCell(draft.board, row, col);
  if (!cell || cell.type !== CELL_TYPES.PLAYER) {
    return;
  }
  clearCell(draft.board, row, col);
  draft.metrics.lives -= 1;
  draft.metrics.currentScore -= 200;
  draft.status.playerDied = true;
  draft.ammo.remainingShots = MAX_CONCURRENT_SHOTS;
  draft.player = null;
  draft.events.push('player-hit');
};

const applyPlayerMove = (draft, direction) => {
  if (!direction || !isPlayable(draft) || !draft.player) {
    return false;
  }

  const { row, col } = draft.player;
  if (direction === 'left') {
    const target = getCell(draft.board, row, col - 1);
    if (target && target.type === CELL_TYPES.EMPTY) {
      moveCell(draft.board, row, col, row, col - 1);
      draft.player.col -= 1;
      return true;
    }
  } else if (direction === 'right') {
    const target = getCell(draft.board, row, col + 1);
    if (target && target.type === CELL_TYPES.EMPTY) {
      moveCell(draft.board, row, col, row, col + 1);
      draft.player.col += 1;
      return true;
    }
  }

  return false;
};

export const performPlayerMove = (draft, direction) => applyPlayerMove(draft, direction);

const applyPlayerFire = (draft) => {
  if (!isPlayable(draft) || !draft.player) {
    return false;
  }
  if (draft.ammo.remainingShots <= 0) {
    return false;
  }

  const { row, col } = draft.player;
  const aboveCell = getCell(draft.board, row - 1, col);
  if (!aboveCell) {
    return false;
  }

  if (aboveCell.type === CELL_TYPES.EMPTY) {
    draft.events = [];
    drawPlayerBullet(draft.board, row - 1, col);
    draft.ammo.remainingShots = Math.max(0, draft.ammo.remainingShots - 1);
    draft.events.push('player-fired');
    return true;
  }

  if (aboveCell.type === CELL_TYPES.ENEMY_BULLET) {
    draft.events = [];
    drawBothBullets(draft.board, row - 1, col);
    draft.ammo.remainingShots = Math.max(0, draft.ammo.remainingShots - 1);
    draft.events.push('player-fired');
    return true;
  }

  if (aboveCell.type === CELL_TYPES.ENEMY) {
    draft.events = [];
    killEnemy(draft, row - 1, col);
    return true;
  }

  return false;
};

export const performPlayerFire = (draft) => applyPlayerFire(draft);

export const queuePlayerMove = (draft) => {
  const direction = draft.queuedInput.move;
  draft.queuedInput.move = null;
  applyPlayerMove(draft, direction);
};

export const queuePlayerFire = (draft) => {
  const shouldFire = draft.queuedInput.fire;
  draft.queuedInput.fire = false;
  if (!shouldFire) {
    return;
  }
  applyPlayerFire(draft);
};
