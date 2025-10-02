import { describe, expect, it } from 'vitest';
import { produce } from 'immer';
import {
  ACTIONS,
  createInitialState,
  gameReducer,
} from './state.js';
import {
  CELL_TYPES,
  INITIAL_WAIT_TIME,
  MAX_CONCURRENT_SHOTS,
} from './constants.js';

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

  it('spawns a player bullet, consumes ammo, and dispatches a fire event', () => {
    const initial = createInitialState();
    const queued = gameReducer(initial, { type: ACTIONS.QUEUE_SHOT });
    const advanced = gameReducer(queued, { type: ACTIONS.TICK });

    expect(advanced.ammo.remainingShots).toBe(initial.ammo.remainingShots - 1);
    expect(hasCellOfType(advanced.board, CELL_TYPES.PLAYER_BULLET)).toBe(true);
    expect(advanced.queuedInput.fire).toBe(false);
    expect(advanced.events).toContain('player-fired');
  });
});

describe('player bullets vs enemy bullets', () => {
  it('creates a combined projectile when firing into an enemy bullet', () => {
    const initial = produce(createInitialState(), (draft) => {
      const { row, col } = draft.player;
      draft.board[row - 1][col].type = CELL_TYPES.ENEMY_BULLET;
    });

    const queued = gameReducer(initial, { type: ACTIONS.QUEUE_SHOT });
    const advanced = gameReducer(queued, { type: ACTIONS.TICK });

    expect(advanced.board[advanced.player.row - 1][advanced.player.col].type)
      .toBe(CELL_TYPES.BOTH_BULLETS);
    expect(hasCellOfType(advanced.board, CELL_TYPES.BOTH_BULLETS)).toBe(true);
    expect(advanced.ammo.remainingShots).toBe(initial.ammo.remainingShots - 1);
  });

  it('preserves ammo and state when mid-air bullets collide', () => {
    let state = createInitialState();
    state = gameReducer(state, { type: ACTIONS.QUEUE_SHOT });
    state = gameReducer(state, { type: ACTIONS.TICK });

    state = produce(state, (draft) => {
      const { col } = draft.player;
      const bulletRow = draft.player.row - 2;
      draft.board[bulletRow - 1][col].type = CELL_TYPES.ENEMY_BULLET;
    });

    const beforeShots = state.ammo.remainingShots;
    state = gameReducer(state, { type: ACTIONS.TICK });

    const combinedExists = hasCellOfType(state.board, CELL_TYPES.BOTH_BULLETS);
    const playerBulletExists = hasCellOfType(state.board, CELL_TYPES.PLAYER_BULLET);
    expect(combinedExists || playerBulletExists).toBe(true);
    expect(state.ammo.remainingShots).toBe(beforeShots);
  });
});

describe('level completion flow', () => {
  it('animates the clear sequence, awards bonus, and prepares the next level', () => {
    let state = produce(createInitialState(), (draft) => {
      draft.board.forEach((row) => {
        row.forEach((cell) => {
          if (cell.type === CELL_TYPES.ENEMY) {
            cell.type = CELL_TYPES.EMPTY;
          }
        });
      });
      draft.enemies = 0;
    });

    state = gameReducer(state, { type: ACTIONS.TICK });

    expect(state.status.levelCleared).toBe(true);
    expect(state.transition.mode).toBe('level-clear-rise');
    expect(state.events).toContain('level-cleared');

    let guard = 0;
    while (state.transition.mode !== 'idle' && guard < 100) {
      state = gameReducer(state, { type: ACTIONS.TICK });
      guard += 1;
    }

    expect(guard).toBeLessThan(100);
    expect(state.transition.mode).toBe('idle');
    expect(state.status.levelCleared).toBe(false);
    expect(state.metrics.level).toBe(2);
    expect(state.metrics.currentScore).toBe(875);
    expect(state.metrics.waitTime).toBe(Math.round(INITIAL_WAIT_TIME * 0.95));
    expect(state.player).not.toBeNull();
    expect(state.ammo.remainingShots).toBe(MAX_CONCURRENT_SHOTS);
    expect(state.events).toContain('level-start');
  });
});
