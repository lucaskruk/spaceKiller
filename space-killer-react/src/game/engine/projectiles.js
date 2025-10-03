import { BOARD_COLS, BOARD_ROWS, CELL_TYPES } from '../constants.js';
import {
  clearCell,
  collectCellsOfType,
  drawBothBullets,
  drawEnemyBullet,
  drawPlayerBullet,
  drawBossDiagonalBullet,
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

      if (belowCell.type === CELL_TYPES.PLAYER_BULLET || belowCell.type === CELL_TYPES.BOSS_DIAGONAL_BULLET) {
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

      if (aboveCell.type === CELL_TYPES.ENEMY_BULLET || aboveCell.type === CELL_TYPES.BOSS_DIAGONAL_BULLET) {
        drawBothBullets(draft.board, row - 1, col);
      } else if (aboveCell.type === CELL_TYPES.ENEMY || aboveCell.type === CELL_TYPES.BOSS) {
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
      } else if (aboveCell.type === CELL_TYPES.ENEMY_BULLET || aboveCell.type === CELL_TYPES.BOSS_DIAGONAL_BULLET) {
        drawBothBullets(draft.board, row - 1, col);
      } else if (aboveCell.type === CELL_TYPES.ENEMY || aboveCell.type === CELL_TYPES.BOSS) {
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
        if (belowCell.type === CELL_TYPES.PLAYER_BULLET || belowCell.type === CELL_TYPES.BOSS_DIAGONAL_BULLET) {
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

export const moveBossDiagonalBullets = (draft) => {
  const coords = collectCellsOfType(draft.board, CELL_TYPES.BOSS_DIAGONAL_BULLET);
  coords.forEach(({ row, col }) => {
    const cell = getCell(draft.board, row, col);
    if (!cell || cell.type !== CELL_TYPES.BOSS_DIAGONAL_BULLET) {
      return;
    }
    if (cell.blocked) {
      cell.blocked = false;
      return;
    }

    const direction = cell.occupantId === 'left' ? 'left' : 'right';
    clearCell(draft.board, row, col);

    const nextRow = row + 1;
    if (nextRow >= BOARD_ROWS - 1) {
      return;
    }

    let nextDirection = direction;
    let nextCol = col + (direction === 'right' ? 1 : -1);

    if (nextCol <= 0 || nextCol >= BOARD_COLS - 1) {
      nextDirection = direction === 'right' ? 'left' : 'right';
      nextCol = col + (nextDirection === 'right' ? 1 : -1);
    }

    if (nextCol <= 0 || nextCol >= BOARD_COLS - 1) {
      return;
    }

    const target = getCell(draft.board, nextRow, nextCol);
    if (!target) {
      return;
    }

    if (target.type === CELL_TYPES.PLAYER_BULLET || target.type === CELL_TYPES.ENEMY_BULLET || target.type === CELL_TYPES.BOSS_DIAGONAL_BULLET || target.type === CELL_TYPES.BOTH_BULLETS) {
      drawBothBullets(draft.board, nextRow, nextCol);
      return;
    }

    if (target.type === CELL_TYPES.PLAYER) {
      hitPlayer(draft, nextRow, nextCol);
      return;
    }

    if (target.type === CELL_TYPES.EMPTY) {
      drawBossDiagonalBullet(draft.board, nextRow, nextCol, nextDirection);
    }
  });
};

