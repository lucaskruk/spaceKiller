import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_TYPES,
  ENEMY_COL_END,
  ENEMY_COL_START,
  ENEMY_ROW,
  PLAYER_START,
} from './constants.js';

export const createCell = (type = CELL_TYPES.EMPTY, overrides = {}) => ({
  type,
  blocked: false,
  occupantId: null,
  ...overrides,
});

export const createBaseBoard = () => {
  const rows = [];
  for (let r = 0; r < BOARD_ROWS; r += 1) {
    const cols = [];
    for (let c = 0; c < BOARD_COLS; c += 1) {
      const isBorder = r === 0 || r === BOARD_ROWS - 1 || c === 0 || c === BOARD_COLS - 1;
      cols.push(createCell(isBorder ? CELL_TYPES.BORDER : CELL_TYPES.EMPTY));
    }
    rows.push(cols);
  }
  return rows;
};

export const seedEnemies = (board) => {
  let enemyCount = 0;
  for (let col = ENEMY_COL_START; col <= ENEMY_COL_END; col += 1) {
    board[ENEMY_ROW][col] = createCell(CELL_TYPES.ENEMY);
    enemyCount += 1;
  }
  return enemyCount;
};

export const placePlayer = (board) => {
  const { row, col } = PLAYER_START;
  board[row][col] = createCell(CELL_TYPES.PLAYER);
  return { row, col };
};

export const buildLevelLayout = () => {
  const board = createBaseBoard();
  const enemies = seedEnemies(board);
  const player = placePlayer(board);
  return { board, enemies, player };
};

export const cloneBoard = (board) => board.map((row) => row.map((cell) => ({ ...cell })));
