import { describe, expect, it } from 'vitest';
import { createInitialState, gameReducer, ACTIONS } from './state.js';
import { CELL_TYPES } from './constants.js';

const hasCellOfType = (board, type) =>
  board.some((row) => row.some((cell) => cell.type === type));

describe('advanceGame queued inputs', () => {
  it('moves the player left when a left move is queued', () => {
    const initial = createInitialState();
    const startRow = initial.player.row;
    const startCol = initial.player.col;

    const queued = gameReducer(initial, { type: ACTIONS.QUEUE_MOVE_LEFT });
    const advanced = gameReducer(queued, { type: ACTIONS.TICK });

    expect(advanced.player.row).toBe(startRow);
    expect(advanced.player.col).toBe(startCol - 1);
    expect(advanced.board[startRow][startCol - 1].type).toBe(CELL_TYPES.PLAYER);
    expect(advanced.board[startRow][startCol].type).toBe(CELL_TYPES.EMPTY);
    expect(advanced.queuedInput.move).toBeNull();
  });

  it('ignores queued movement while the game is paused', () => {
    const initial = createInitialState();
    const paused = gameReducer(initial, { type: ACTIONS.PAUSE_TOGGLE });
    const queuedWhilePaused = gameReducer(paused, { type: ACTIONS.QUEUE_MOVE_LEFT });
    const advanced = gameReducer(queuedWhilePaused, { type: ACTIONS.TICK });

    expect(advanced.player.col).toBe(paused.player.col);
    expect(advanced).toBe(queuedWhilePaused);
  });

  it('spawns a player bullet and consumes ammo when firing', () => {
    const initial = createInitialState();
    const queued = gameReducer(initial, { type: ACTIONS.QUEUE_SHOT });
    const advanced = gameReducer(queued, { type: ACTIONS.TICK });

    expect(advanced.ammo.remainingShots).toBe(initial.ammo.remainingShots - 1);
    expect(hasCellOfType(advanced.board, CELL_TYPES.PLAYER_BULLET)).toBe(true);
    expect(advanced.queuedInput.fire).toBe(false);
  });
});
