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

describe('player actions', () => {
  it('moves the player immediately when a left move is requested', () => {
    const initial = createInitialState();
    const startRow = initial.player.row;
    const startCol = initial.player.col;

    const moved = gameReducer(initial, { type: ACTIONS.QUEUE_MOVE_LEFT });

    expect(moved.player.row).toBe(startRow);
    expect(moved.player.col).toBe(startCol - 1);
    expect(moved.board[startRow][startCol - 1].type).toBe(CELL_TYPES.PLAYER);
    expect(moved.board[startRow][startCol].type).toBe(CELL_TYPES.EMPTY);
    expect(moved.queuedInput.move).toBeNull();

    const afterTick = gameReducer(moved, { type: ACTIONS.TICK });
    expect(afterTick.player.col).toBe(startCol - 1);
  });

  it('ignores movement input while the game is paused', () => {
    const initial = createInitialState();
    const paused = gameReducer(initial, { type: ACTIONS.PAUSE_TOGGLE });

    const attempted = gameReducer(paused, { type: ACTIONS.QUEUE_MOVE_LEFT });

    expect(attempted).toBe(paused);
  });

  it('fires immediately, consuming ammo and recording an event', () => {
    const initial = createInitialState();

    const fired = gameReducer(initial, { type: ACTIONS.QUEUE_SHOT });

    expect(fired.ammo.remainingShots).toBe(initial.ammo.remainingShots - 1);
    expect(hasCellOfType(fired.board, CELL_TYPES.PLAYER_BULLET)).toBe(true);
    expect(fired.queuedInput.fire).toBe(false);
    expect(fired.events).toEqual(['player-fired']);

    const afterTick = gameReducer(fired, { type: ACTIONS.TICK });
    expect(afterTick.events.includes('player-fired')).toBe(false);
  });
});

describe('player bullets vs enemy bullets', () => {
  it('creates a combined projectile when firing into an enemy bullet', () => {
    const initial = produce(createInitialState(), (draft) => {
      const { row, col } = draft.player;
      draft.board[row - 1][col].type = CELL_TYPES.ENEMY_BULLET;
    });

    const fired = gameReducer(initial, { type: ACTIONS.QUEUE_SHOT });

    expect(fired.board[fired.player.row - 1][fired.player.col].type)
      .toBe(CELL_TYPES.BOTH_BULLETS);
    expect(hasCellOfType(fired.board, CELL_TYPES.BOTH_BULLETS)).toBe(true);
    expect(fired.ammo.remainingShots).toBe(initial.ammo.remainingShots - 1);
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
