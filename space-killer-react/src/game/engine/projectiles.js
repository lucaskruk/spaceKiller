import { BOARD_ROWS, CELL_TYPES } from '../constants.js';
import {
  clearCell,
  collectCellsOfType,
  drawBothBullets,
  drawEnemyBullet,
  drawPlayerBullet,
  getCell,
} from './grid.js';
import { hitPlayer } from './player.js';
import { killEnemy } from './enemy.js';

export const moveEnemyBullets = (draft) => {
  const coords = collectCellsOfType(draft.board, CELL_TYPES.ENEMY_BULLET);
  coords.forEach(({ row, col }) => {
    const cell = getCell(draft.board, row, col);
    if (!cell || cell.type !== CELL_TYPES.ENEMY_BULLET) {
      return;
    }
    if (cell.blocked) {
      cell.blocked = false;
      return;
    }

    clearCell(draft.board, row, col);

    if (row < BOARD_ROWS - 2) {
      const belowCell = getCell(draft.board, row + 1, col);
      if (!belowCell) {
        return;
      }

      if (belowCell.type === CELL_TYPES.PLAYER_BULLET) {
        drawBothBullets(draft.board, row + 1, col);
      } else if (belowCell.type === CELL_TYPES.PLAYER) {
        hitPlayer(draft, row + 1, col);
      } else if (belowCell.type === CELL_TYPES.EMPTY) {
        drawEnemyBullet(draft.board, row + 1, col);
      }
    }
  });
};

export const movePlayerBullets = (draft) => {
  const coords = collectCellsOfType(draft.board, CELL_TYPES.PLAYER_BULLET);
  coords.forEach(({ row, col }) => {
    const cell = getCell(draft.board, row, col);
    if (!cell || cell.type !== CELL_TYPES.PLAYER_BULLET) {
      return;
    }
    if (cell.blocked) {
      cell.blocked = false;
      return;
    }

    clearCell(draft.board, row, col);

    if (row > 1) {
      const aboveCell = getCell(draft.board, row - 1, col);
      if (!aboveCell) {
        draft.ammo.remainingShots += 1;
        return;
      }

      if (aboveCell.type === CELL_TYPES.ENEMY_BULLET) {
        drawBothBullets(draft.board, row - 1, col);
      } else if (aboveCell.type === CELL_TYPES.ENEMY) {
        killEnemy(draft, row - 1, col);
      } else if (aboveCell.type === CELL_TYPES.EMPTY) {
        drawPlayerBullet(draft.board, row - 1, col);
      } else {
        draft.ammo.remainingShots += 1;
      }
    } else {
      draft.ammo.remainingShots += 1;
    }
  });
};

export const moveBothBullets = (draft) => {
  const coords = collectCellsOfType(draft.board, CELL_TYPES.BOTH_BULLETS);
  coords.forEach(({ row, col }) => {
    const cell = getCell(draft.board, row, col);
    if (!cell || cell.type !== CELL_TYPES.BOTH_BULLETS) {
      return;
    }
    if (cell.blocked) {
      cell.blocked = false;
      return;
    }

    clearCell(draft.board, row, col);

    if (row > 1) {
      const aboveCell = getCell(draft.board, row - 1, col);
      if (!aboveCell) {
        draft.ammo.remainingShots += 1;
      } else if (aboveCell.type === CELL_TYPES.ENEMY_BULLET) {
        drawBothBullets(draft.board, row - 1, col);
      } else if (aboveCell.type === CELL_TYPES.ENEMY) {
        killEnemy(draft, row - 1, col);
      } else if (aboveCell.type === CELL_TYPES.EMPTY) {
        drawPlayerBullet(draft.board, row - 1, col);
      } else {
        draft.ammo.remainingShots += 1;
      }
    } else {
      draft.ammo.remainingShots += 1;
    }

    if (row < BOARD_ROWS - 2) {
      const belowCell = getCell(draft.board, row + 1, col);
      if (belowCell) {
        if (belowCell.type === CELL_TYPES.PLAYER_BULLET) {
          drawBothBullets(draft.board, row + 1, col);
        } else if (belowCell.type === CELL_TYPES.PLAYER) {
          hitPlayer(draft, row + 1, col);
        } else if (belowCell.type === CELL_TYPES.EMPTY) {
          drawEnemyBullet(draft.board, row + 1, col);
        }
      }
    }
  });
};
