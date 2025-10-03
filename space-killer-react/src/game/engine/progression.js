import {
  LAST_LEVEL,
  MAX_CONCURRENT_SHOTS,
  BOSS_LEVEL,
  MIN_WAIT_TIME,
  SPEED_MULTIPLIER,
  LEVEL_BONUS_PER_LEVEL,
  LEVEL_BONUS_PER_LIFE,
  LEVEL_ACCURACY_BONUS_THRESHOLDS,
  LEVEL_STREAK_BONUS_VALUE,
} from '../constants.js';
import { buildLevelLayout } from '../board.js';
import { clearCell, fillRowWithFiller, moveCell } from './grid.js';

const accelerateGame = (draft) => {
  draft.metrics.waitTime = Math.max(
    MIN_WAIT_TIME,
    Math.round(draft.metrics.waitTime * SPEED_MULTIPLIER),
  );
};

const calculateLevelSkillBonus = (metrics) => {
  if (!metrics) {
    return 0;
  }
  const totalShotsFired = metrics.totalShotsFired ?? 0;
  const totalShotsHit = metrics.totalShotsHit ?? 0;
  const levelStartShotsFired = metrics.levelStartShotsFired ?? 0;
  const levelStartShotsHit = metrics.levelStartShotsHit ?? 0;
  const shotsFiredThisLevel = Math.max(0, totalShotsFired - levelStartShotsFired);
  const shotsHitThisLevel = Math.max(0, totalShotsHit - levelStartShotsHit);
  const accuracy = shotsFiredThisLevel > 0 ? Math.min(1, shotsHitThisLevel / shotsFiredThisLevel) : 0;
  let accuracyBonus = 0;
  for (const { threshold, bonus } of LEVEL_ACCURACY_BONUS_THRESHOLDS) {
    if (accuracy >= threshold) {
      accuracyBonus = bonus;
      break;
    }
  }
  const streakBonus = Math.max(0, metrics.levelBestKillStreak ?? 0) * LEVEL_STREAK_BONUS_VALUE;
  return accuracyBonus + streakBonus;
};

const calculateLevelBonus = (metrics) => {
  if (!metrics) {
    return 0;
  }
  const base = (metrics.level * LEVEL_BONUS_PER_LEVEL) + (Math.max(0, metrics.lives) * LEVEL_BONUS_PER_LIFE);
  return base + calculateLevelSkillBonus(metrics);
};

export const resetTransition = (draft) => {
  if (!draft.transition) {
    draft.transition = { mode: 'idle', progress: 0 };
    return;
  }
  draft.transition.mode = 'idle';
  draft.transition.progress = 0;
};

export const applyLevelLayout = (draft) => {
  const level = draft.metrics?.level ?? 1;
  const shouldCarryBossLives = level === BOSS_LEVEL
    && draft.status?.playerDied
    && draft.boss
    && typeof draft.boss.lives === 'number';
  const preservedBossLives = shouldCarryBossLives ? draft.boss.lives : null;
  const { board, enemies, player, boss } = buildLevelLayout(level);
  draft.board = board;
  draft.enemies = enemies;
  draft.player = player;
  draft.boss = boss;
  if (draft.metrics) {
    draft.metrics.killStreak = 0;
    draft.metrics.levelBestKillStreak = 0;
    draft.metrics.levelStartShotsFired = draft.metrics.totalShotsFired ?? 0;
    draft.metrics.levelStartShotsHit = draft.metrics.totalShotsHit ?? 0;
  }
  if (shouldCarryBossLives && draft.boss) {
    draft.boss.lives = Math.min(draft.boss.lives, preservedBossLives);
  }
  draft.status.playerDied = false;
  draft.status.levelCleared = false;
  draft.ammo.remainingShots = MAX_CONCURRENT_SHOTS;
  draft.ammo.cooldownTicks = 0;
  draft.queuedInput.move = null;
  draft.queuedInput.fire = false;
  resetTransition(draft);
};

export const advanceToNextLevel = (draft, { awardBonus } = {}) => {
  const completedLevel = draft.metrics.level;
  if (awardBonus) {
    const bonus = calculateLevelBonus(draft.metrics);
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

export const startLevelClearTransition = (draft) => {
  if (!draft.transition) {
    draft.transition = { mode: 'level-clear-rise', progress: 0 };
  } else {
    draft.transition.mode = 'level-clear-rise';
    draft.transition.progress = 0;
  }
  draft.queuedInput.move = null;
  draft.queuedInput.fire = false;
};

export const runLevelClearTransition = (draft) => {
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
    const boardRows = draft.board.length;
    if (nextRow < boardRows - 1) {
      fillRowWithFiller(draft.board, nextRow);
      draft.transition.progress = nextRow + 1;
      return;
    }

    advanceToNextLevel(draft, { awardBonus: true });
  }
};

export const restartCurrentLevel = (draft) => {
  applyLevelLayout(draft);
  draft.events.push('player-respawn');
  draft.events.push('level-restart');
};

export const triggerGameOver = (draft) => {
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

export const checkGameMilestones = (draft) => {
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
