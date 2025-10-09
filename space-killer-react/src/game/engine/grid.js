import { BOARD_COLS, BOARD_ROWS, CELL_TYPES } from '../constants.js';

export const getCell = (board, row, col) => {
  if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) {
    return null;
  }
  return board[row][col];
};

const setCellType = (board, row, col, type) => {
  const cell = getCell(board, row, col);
  if (!cell || cell.type === CELL_TYPES.BORDER) {
    return null;
  }
  cell.type = type;
  cell.blocked = type === CELL_TYPES.BOTH_BULLETS;
  cell.occupantId = null;
  if ('isGlowing' in cell) {
    cell.isGlowing = false;
  }
  return cell;
};

export const clearCell = (board, row, col) => {
  const cell = getCell(board, row, col);
  if (!cell || cell.type === CELL_TYPES.BORDER) {
    return;
  }
  cell.type = CELL_TYPES.EMPTY;
  cell.blocked = false;
  cell.occupantId = null;
  if ('isGlowing' in cell) {
    cell.isGlowing = false;
  }
};

export const drawEnemyBullet = (board, row, col) => {
  const cell = setCellType(board, row, col, CELL_TYPES.ENEMY_BULLET);
  if (cell) {
    cell.blocked = false;
  }
};

export const drawPlayerBullet = (board, row, col) => {
  const cell = setCellType(board, row, col, CELL_TYPES.PLAYER_BULLET);
  if (cell) {
    cell.blocked = false;
  }
};

export const drawBothBullets = (board, row, col) => {
  const cell = setCellType(board, row, col, CELL_TYPES.BOTH_BULLETS);
  if (cell) {
    cell.blocked = true;
  }
};

export const drawBossDiagonalBullet = (board, row, col, direction) => {
  const cell = setCellType(board, row, col, CELL_TYPES.BOSS_DIAGONAL_BULLET);
  if (cell) {
    cell.blocked = false;
    cell.occupantId = direction === 'left' ? 'left' : 'right';
  }
};

export const drawBossCombinedBullet = (board, row, col, direction) => {
  const cell = setCellType(board, row, col, CELL_TYPES.BOSS_COMBINED_BULLET);
  if (cell) {
    cell.blocked = false;
    cell.occupantId = direction === 'left' ? 'left' : 'right';
  }
};

export const moveCell = (board, fromRow, fromCol, toRow, toCol) => {
  const origin = getCell(board, fromRow, fromCol);
  const target = getCell(board, toRow, toCol);
  if (!origin || !target) {
    return;
  }
  target.type = origin.type;
  target.blocked = origin.blocked;
  target.occupantId = origin.occupantId;
  if ('isGlowing' in target) {
    target.isGlowing = Boolean(origin.isGlowing);
  }
  clearCell(board, fromRow, fromCol);
};

export const collectCellsOfType = (board, type) => {
  const coords = [];
  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLS; col += 1) {
      if (board[row][col].type === type) {
        coords.push({ row, col });
      }
    }
  }
  return coords;
};

export const fillRowWithFiller = (board, row) => {
  if (row <= 0 || row >= BOARD_ROWS - 1) {
    return;
  }
  for (let col = 1; col < BOARD_COLS - 1; col += 1) {
    const cell = board[row][col];
    cell.type = CELL_TYPES.FILLER;
    cell.blocked = true;
    cell.occupantId = null;
  }
};
