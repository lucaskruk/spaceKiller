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

export const queuePlayerMove = (draft) => {
  if (!isPlayable(draft) || !draft.player) {
    draft.queuedInput.move = null;
    return;
  }

  const { row, col } = draft.player;
  if (draft.queuedInput.move === 'left') {
    const target = getCell(draft.board, row, col - 1);
    if (target && target.type === CELL_TYPES.EMPTY) {
      moveCell(draft.board, row, col, row, col - 1);
      draft.player.col -= 1;
    }
  } else if (draft.queuedInput.move === 'right') {
    const target = getCell(draft.board, row, col + 1);
    if (target && target.type === CELL_TYPES.EMPTY) {
      moveCell(draft.board, row, col, row, col + 1);
      draft.player.col += 1;
    }
  }

  draft.queuedInput.move = null;
};

export const queuePlayerFire = (draft) => {
  if (!isPlayable(draft) || !draft.player) {
    draft.queuedInput.fire = false;
    return;
  }
  if (!draft.queuedInput.fire || draft.ammo.remainingShots <= 0) {
    draft.queuedInput.fire = false;
    return;
  }

  const { row, col } = draft.player;
  const aboveCell = getCell(draft.board, row - 1, col);
  if (!aboveCell) {
    draft.queuedInput.fire = false;
    return;
  }

  if (aboveCell.type === CELL_TYPES.EMPTY) {
    drawPlayerBullet(draft.board, row - 1, col);
    draft.ammo.remainingShots = Math.max(0, draft.ammo.remainingShots - 1);
    draft.events.push('player-fired');
  } else if (aboveCell.type === CELL_TYPES.ENEMY_BULLET) {
    drawBothBullets(draft.board, row - 1, col);
    draft.ammo.remainingShots = Math.max(0, draft.ammo.remainingShots - 1);
    draft.events.push('player-fired');
  } else if (aboveCell.type === CELL_TYPES.ENEMY) {
    killEnemy(draft, row - 1, col);
  }

  draft.queuedInput.fire = false;
};
