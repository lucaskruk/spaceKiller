import { produce } from 'immer';
import {
  INITIAL_LIVES,
  INITIAL_WAIT_TIME,
  MAX_CONCURRENT_SHOTS,
} from './constants.js';
import { buildLevelLayout } from './board.js';
import { advanceGame, prepareNextLevel, respawnPlayer } from './engine.js';

export const ACTIONS = {
  RESET: 'reset',
  QUEUE_MOVE_LEFT: 'queue-move-left',
  QUEUE_MOVE_RIGHT: 'queue-move-right',
  QUEUE_SHOT: 'queue-shot',
  TICK: 'tick',
  PAUSE_TOGGLE: 'pause-toggle',
  ADVANCE_LEVEL: 'advance-level',
  PLAYER_RESPAWNED: 'player-respawned',
};

export const createInitialState = () => {
  const { board, enemies, player } = buildLevelLayout();
  return {
    board,
    enemies,
    player,
    status: {
      gameOver: false,
      paused: false,
      levelCleared: false,
      playerDied: false,
    },
    metrics: {
      lives: INITIAL_LIVES,
      level: 1,
      currentScore: 0,
      waitTime: INITIAL_WAIT_TIME,
    },
    ammo: {
      remainingShots: MAX_CONCURRENT_SHOTS,
    },
    queuedInput: {
      move: null,
      fire: false,
    },
    transition: {
      mode: 'idle',
      progress: 0,
    },
    events: [],
  };
};

export const gameReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.RESET:
      return createInitialState();
    case ACTIONS.PAUSE_TOGGLE:
      return produce(state, (draft) => {
        draft.status.paused = !draft.status.paused;
      });
    case ACTIONS.QUEUE_MOVE_LEFT:
      return produce(state, (draft) => {
        draft.queuedInput.move = 'left';
      });
    case ACTIONS.QUEUE_MOVE_RIGHT:
      return produce(state, (draft) => {
        draft.queuedInput.move = 'right';
      });
    case ACTIONS.QUEUE_SHOT:
      return produce(state, (draft) => {
        draft.queuedInput.fire = true;
      });
    case ACTIONS.TICK:
      return advanceGame(state);
    case ACTIONS.ADVANCE_LEVEL:
      return prepareNextLevel(state);
    case ACTIONS.PLAYER_RESPAWNED:
      return respawnPlayer(state);
    default:
      return state;
  }
};
