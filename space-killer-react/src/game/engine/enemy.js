import { BOARD_COLS, BOARD_ROWS, CELL_TYPES } from '../constants.js';
import { clearCell, collectCellsOfType, drawEnemyBullet, getCell, moveCell } from './grid.js';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rollDice = () => randomInt(1, 6);

export const killEnemy = (draft, row, col) => {
  const cell = getCell(draft.board, row, col);
  if (!cell || cell.type !== CELL_TYPES.ENEMY) {
    return;
  }
  clearCell(draft.board, row, col);
  draft.enemies = Math.max(0, draft.enemies - 1);
  draft.metrics.currentScore += 100;
  draft.ammo.remainingShots += 1;
  draft.events.push('enemy-explosion');
};

export const moveEnemies = (draft) => {
  const coords = collectCellsOfType(draft.board, CELL_TYPES.ENEMY);
  coords.forEach(({ row, col }) => {
    const cell = getCell(draft.board, row, col);
    if (!cell || cell.type !== CELL_TYPES.ENEMY) {
      return;
    }

    const choice = rollDice();
    if (choice === 6) {
      if (row < BOARD_ROWS - 2) {
        const belowCell = getCell(draft.board, row + 1, col);
        if (belowCell && belowCell.type === CELL_TYPES.EMPTY) {
          drawEnemyBullet(draft.board, row + 1, col);
        }
      }
      return;
    }

    if (choice >= 3) {
      if (col > 1) {
        const leftCell = getCell(draft.board, row, col - 1);
        if (leftCell && leftCell.type === CELL_TYPES.EMPTY) {
          moveCell(draft.board, row, col, row, col - 1);
          return;
        }
        if (row < BOARD_ROWS - 4) {
          const belowCell = getCell(draft.board, row + 1, col);
          if (belowCell && belowCell.type === CELL_TYPES.EMPTY) {
            moveCell(draft.board, row, col, row + 1, col);
            return;
          }
        } else if (row > 2) {
          const aboveCell = getCell(draft.board, row - 1, col);
          if (aboveCell && aboveCell.type === CELL_TYPES.EMPTY) {
            moveCell(draft.board, row, col, row - 1, col);
            return;
          }
        }
      }
    } else {
      if (col < BOARD_COLS - 1) {
        const rightCell = getCell(draft.board, row, col + 1);
        if (rightCell && rightCell.type === CELL_TYPES.EMPTY) {
          moveCell(draft.board, row, col, row, col + 1);
          return;
        }
        if (row < BOARD_ROWS - 4) {
          const belowCell = getCell(draft.board, row + 1, col);
          if (belowCell && belowCell.type === CELL_TYPES.EMPTY) {
            moveCell(draft.board, row, col, row + 1, col);
            return;
          }
        } else if (row > 2) {
          const aboveCell = getCell(draft.board, row - 1, col);
          if (aboveCell && aboveCell.type === CELL_TYPES.EMPTY) {
            moveCell(draft.board, row, col, row - 1, col);
            return;
          }
        }
      } else if (row > 2) {
        const aboveCell = getCell(draft.board, row - 1, col);
        if (aboveCell && aboveCell.type === CELL_TYPES.EMPTY) {
          moveCell(draft.board, row, col, row - 1, col);
        }
      }
    }
  });
};
