import { produce } from 'immer';
import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_TYPES,
  LAST_LEVEL,
  MAX_CONCURRENT_SHOTS,
} from './constants.js';
import { buildLevelLayout } from './board.js';

const MIN_WAIT_TIME = 120;
const SPEED_MULTIPLIER = 0.95;
const LEVEL_BONUS_PER_LEVEL = 250;
const LEVEL_BONUS_PER_LIFE = 125;

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rollDice = () => randomInt(1, 6);

const isPlayable = (state) =>
  !state.status.gameOver &&
  !state.status.paused &&
  !state.status.levelCleared &&
  !state.status.playerDied;

const getCell = (board, row, col) => {
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
  return cell;
};

const clearCell = (board, row, col) => {
  const cell = getCell(board, row, col);
  if (!cell || cell.type === CELL_TYPES.BORDER) {
    return;
  }
  cell.type = CELL_TYPES.EMPTY;
  cell.blocked = false;
  cell.occupantId = null;
};

const drawEnemyBullet = (board, row, col) => {
  const cell = setCellType(board, row, col, CELL_TYPES.ENEMY_BULLET);
  if (cell) {
    cell.blocked = false;
  }
};

const drawPlayerBullet = (board, row, col) => {
  const cell = setCellType(board, row, col, CELL_TYPES.PLAYER_BULLET);
  if (cell) {
    cell.blocked = false;
  }
};

const drawBothBullets = (board, row, col) => {
  const cell = setCellType(board, row, col, CELL_TYPES.BOTH_BULLETS);
  if (cell) {
    cell.blocked = true;
  }
};

const moveCell = (board, fromRow, fromCol, toRow, toCol) => {
  const origin = getCell(board, fromRow, fromCol);
  const target = getCell(board, toRow, toCol);
  if (!origin || !target) {
    return;
  }
  target.type = origin.type;
  target.blocked = origin.blocked;
  target.occupantId = origin.occupantId;
  clearCell(board, fromRow, fromCol);
};

const collectCellsOfType = (board, type) => {
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

const killEnemy = (draft, row, col) => {
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

const hitPlayer = (draft, row, col) => {
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

const queuePlayerMove = (draft) => {
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

const queuePlayerFire = (draft) => {
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

const moveEnemyBullets = (draft) => {
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

const movePlayerBullets = (draft) => {
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

const moveBothBullets = (draft) => {
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

const accelerateGame = (draft) => {
  draft.metrics.waitTime = Math.max(
    MIN_WAIT_TIME,
    Math.round(draft.metrics.waitTime * SPEED_MULTIPLIER),
  );
};

const calculateLevelBonus = (level, lives) =>
  (level * LEVEL_BONUS_PER_LEVEL) + (Math.max(0, lives) * LEVEL_BONUS_PER_LIFE);

const resetTransition = (draft) => {
  if (!draft.transition) {
    draft.transition = { mode: 'idle', progress: 0 };
    return;
  }
  draft.transition.mode = 'idle';
  draft.transition.progress = 0;
};

const applyLevelLayout = (draft) => {
  const { board, enemies, player } = buildLevelLayout();
  draft.board = board;
  draft.enemies = enemies;
  draft.player = player;
  draft.status.playerDied = false;
  draft.status.levelCleared = false;
  draft.ammo.remainingShots = MAX_CONCURRENT_SHOTS;
  draft.queuedInput.move = null;
  draft.queuedInput.fire = false;
  resetTransition(draft);
};

const fillRowWithFiller = (board, row) => {
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

const advanceToNextLevel = (draft, { awardBonus } = {}) => {
  const completedLevel = draft.metrics.level;
  if (awardBonus) {
    const bonus = calculateLevelBonus(completedLevel, draft.metrics.lives);
    draft.metrics.currentScore += bonus;
    draft.events.push('level-bonus');
  }

  accelerateGame(draft);
  draft.queuedInput.move = null;
  draft.queuedInput.fire = false;

  if (completedLevel >= LAST_LEVEL) {
    draft.status.gameOver = true;
    draft.status.levelCleared = false;
    resetTransition(draft);
    draft.events.push('campaign-complete');
    return;
  }

  draft.metrics.level += 1;
  applyLevelLayout(draft);
  draft.events.push('level-start');
};

const runLevelClearTransition = (draft) => {
  if (!draft.transition || draft.transition.mode === 'idle') {
    return;
  }

  if (draft.transition.mode === 'level-clear-rise') {
    if (draft.player) {
      const { row, col } = draft.player;
      if (row > 1) {
        moveCell(draft.board, row, col, row - 1, col);
        draft.player.row -= 1;
      } else {
        clearCell(draft.board, row, col);
        draft.player = null;
      }
    }

    if (!draft.player) {
      draft.transition.mode = 'level-clear-fill';
      draft.transition.progress = 1;
    }
    return;
  }

  if (draft.transition.mode === 'level-clear-fill') {
    const nextRow = draft.transition.progress ?? 1;
    if (nextRow < BOARD_ROWS - 1) {
      fillRowWithFiller(draft.board, nextRow);
      draft.transition.progress = nextRow + 1;
      return;
    }

    advanceToNextLevel(draft, { awardBonus: true });
  }
};

const startLevelClearTransition = (draft) => {
  if (!draft.transition) {
    draft.transition = { mode: 'level-clear-rise', progress: 0 };
  } else {
    draft.transition.mode = 'level-clear-rise';
    draft.transition.progress = 0;
  }
  draft.queuedInput.move = null;
  draft.queuedInput.fire = false;
};
const moveEnemies = (draft) => {
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

const restartCurrentLevel = (draft) => {
  applyLevelLayout(draft);
  draft.events.push('player-respawn');
  draft.events.push('level-restart');
};

const triggerGameOver = (draft) => {
  if (draft.status.gameOver) {
    return;
  }
  draft.status.gameOver = true;
  draft.status.playerDied = false;
  draft.queuedInput.move = null;
  draft.queuedInput.fire = false;
  resetTransition(draft);
  draft.events.push('game-over');
};

const checkGameMilestones = (draft) => {
  if (draft.status.gameOver) {
    return;
  }

  if (draft.status.playerDied) {
    if (draft.metrics.lives > 0) {
      restartCurrentLevel(draft);
    } else {
      triggerGameOver(draft);
    }
    return;
  }

  if (!draft.status.levelCleared && draft.enemies <= 0) {
    draft.status.levelCleared = true;
    startLevelClearTransition(draft);
    draft.events.push('level-cleared');
    return;
  }

  if (draft.metrics.lives <= 0) {
    triggerGameOver(draft);
  }
};

export const advanceGame = (state) => {
  if (state.transition && state.transition.mode !== 'idle') {
    return produce(state, (draft) => {
      draft.events = [];
      runLevelClearTransition(draft);
    });
  }

  if (!isPlayable(state)) {
    return state;
  }

  return produce(state, (draft) => {
    draft.events = [];
    queuePlayerMove(draft);
    queuePlayerFire(draft);
    moveEnemyBullets(draft);
    movePlayerBullets(draft);
    moveBothBullets(draft);
    moveEnemies(draft);
    checkGameMilestones(draft);
    draft.queuedInput.move = null;
    draft.queuedInput.fire = false;
  });
};

export const prepareNextLevel = (state) => produce(state, (draft) => {
  draft.events = [];
  draft.status.levelCleared = false;
  advanceToNextLevel(draft, { awardBonus: true });
});

export const respawnPlayer = (state) => produce(state, (draft) => {
  draft.events = [];
  applyLevelLayout(draft);
  draft.events.push('player-respawn');
});



