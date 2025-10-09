import { produce } from 'immer';
import {
  INITIAL_LIVES,
  INITIAL_WAIT_TIME,
  MAX_CONCURRENT_SHOTS,
  HIGH_SCORE_LIMIT,
  HIGH_SCORE_STORAGE_KEY,
  HIGH_SCORE_NAME_MAX_LENGTH,
  ACTIONS,
  GLOWING_ENEMY_MIN_PER_CAMPAIGN,
  GLOWING_ENEMY_MAX_PER_CAMPAIGN,
} from './constants.js';
import { buildLevelLayout } from './board.js';
import { advanceGame, prepareNextLevel, respawnPlayer } from './engine/index.js';
import { performPlayerFire, performPlayerMove } from './engine/player.js';

const canUseStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch (error) {
    return false;
  }
};

const generateScoreId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `hs-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};

const sanitizeHighScoreName = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.slice(0, HIGH_SCORE_NAME_MAX_LENGTH);
};

const normaliseHighScores = (scores) => {
  if (!Array.isArray(scores)) {
    return [];
  }

  return scores
    .filter((entry) => entry && typeof entry.score === 'number')
    .map((entry) => ({
      id: entry.id ?? generateScoreId(),
      name: sanitizeHighScoreName(entry.name ?? ''),
      score: entry.score,
      level: typeof entry.level === 'number' ? entry.level : 1,
      timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now(),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.level !== a.level) {
        return b.level - a.level;
      }
      return a.timestamp - b.timestamp;
    })
    .slice(0, HIGH_SCORE_LIMIT);
};

const loadHighScores = () => {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return normaliseHighScores(parsed);
  } catch (error) {
    return [];
  }
};

const cloneHighScores = (scores) => normaliseHighScores(scores);
const recordHighScore = (state) => produce(state, (draft) => {
  const entry = {
    id: generateScoreId(),
    name: '',
    score: draft.metrics.currentScore,
    level: draft.metrics.level,
    timestamp: Date.now(),
  };
  const updatedList = normaliseHighScores([...(draft.highScores ?? []), entry]);
  draft.highScores = updatedList;
  draft.lastScoreId = updatedList.some((item) => item.id === entry.id) ? entry.id : null;
});


export const createInitialState = () => {
  const { board, enemies, player, boss } = buildLevelLayout(1);
  const glowingCount = Math.floor(Math.random() * (GLOWING_ENEMY_MAX_PER_CAMPAIGN - GLOWING_ENEMY_MIN_PER_CAMPAIGN + 1)) + GLOWING_ENEMY_MIN_PER_CAMPAIGN;
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
      killStreak: 0,
      bestKillStreak: 0,
      levelBestKillStreak: 0,
      totalShotsFired: 0,
      totalShotsHit: 0,
      levelStartShotsFired: 0,
      levelStartShotsHit: 0,
    },
    ammo: {
      remainingShots: MAX_CONCURRENT_SHOTS,
      cooldownTicks: 0,
    },
    queuedInput: {
      move: null,
      fire: false,
    },
    transition: {
      mode: 'idle',
      progress: 0,
    },
    boss,
    events: [],
    glowingEnemiesRemaining: glowingCount,
    glowingEnemiesDefeated: 0,
    activeGlowingEnemyLevel: null,
    highScores: loadHighScores(),
    lastScoreId: null,
  };
};

export const gameReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.RESET: {
      const baseState = createInitialState();
      baseState.highScores = cloneHighScores(state?.highScores ?? []);
      baseState.lastScoreId = null;
      return baseState;
    }
    case ACTIONS.PAUSE_TOGGLE:
      return produce(state, (draft) => {
        draft.status.paused = !draft.status.paused;
      });
    case ACTIONS.QUEUE_MOVE_LEFT:
      return produce(state, (draft) => {
        performPlayerMove(draft, 'left');
        draft.queuedInput.move = null;
      });
    case ACTIONS.QUEUE_MOVE_RIGHT:
      return produce(state, (draft) => {
        performPlayerMove(draft, 'right');
        draft.queuedInput.move = null;
      });
    case ACTIONS.QUEUE_SHOT:
      return produce(state, (draft) => {
        performPlayerFire(draft);
        draft.queuedInput.fire = false;
      });
    case ACTIONS.TICK: {
      const nextState = advanceGame(state);
      if (nextState.status.gameOver && !state.status.gameOver) {
        return recordHighScore(nextState);
      }
      return nextState;
    }
    case ACTIONS.ADVANCE_LEVEL:
      return prepareNextLevel(state);
    case ACTIONS.PLAYER_RESPAWNED:
      return respawnPlayer(state);
    case ACTIONS.SET_HIGH_SCORE_NAME:
      return produce(state, (draft) => {
        const payload = action.payload ?? {};
        const { id, name } = payload;
        if (!id || typeof name !== 'string') {
          return;
        }
        const entry = draft.highScores?.find((item) => item.id === id);
        if (!entry) {
          return;
        }
        const sanitized = sanitizeHighScoreName(name);
        if (!sanitized) {
          return;
        }
        entry.name = sanitized;
      });
    default:
      return state;
  }
};
