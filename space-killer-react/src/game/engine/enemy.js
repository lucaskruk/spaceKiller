import {
  BOARD_COLS,
  BOARD_ROWS,
  CELL_TYPES,
  BOSS_HIT_SCORE,
  ENEMY_DESTROY_SCORE,
  ENEMY_STREAK_BONUS_STEP,
  ENEMY_STREAK_BONUS_CAP,
  ACCURACY_BONUS_THRESHOLDS,
} from '../constants.js';
import { clearCell, collectCellsOfType, drawEnemyBullet, getCell, moveCell } from './grid.js';

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rollDice = () => randomInt(1, 6);

const applySkillBonuses = (draft, baseScore) => {
  if (!draft?.metrics) {
    return baseScore;
  }
  const metrics = draft.metrics;
  metrics.totalShotsHit = (metrics.totalShotsHit ?? 0) + 1;
  const currentStreak = (metrics.killStreak ?? 0) + 1;
  metrics.killStreak = currentStreak;
  metrics.bestKillStreak = Math.max(metrics.bestKillStreak ?? 0, currentStreak);
  metrics.levelBestKillStreak = Math.max(metrics.levelBestKillStreak ?? 0, currentStreak);
  const streakBonus = Math.min(Math.max(0, currentStreak - 1) * ENEMY_STREAK_BONUS_STEP, ENEMY_STREAK_BONUS_CAP);
  const totalShotsFired = metrics.totalShotsFired ?? 0;
  const accuracy = totalShotsFired > 0 ? Math.min(1, (metrics.totalShotsHit ?? 0) / totalShotsFired) : 0;
  let accuracyBonus = 0;
  for (const { threshold, bonus } of ACCURACY_BONUS_THRESHOLDS) {
    if (accuracy >= threshold) {
      accuracyBonus = bonus;
      break;
    }
  }
  const totalBonus = baseScore + streakBonus + accuracyBonus;
  metrics.currentScore += totalBonus;
  return totalBonus;
};

export const killEnemy = (draft, row, col) => {
  const cell = getCell(draft.board, row, col);
  if (!cell || (cell.type !== CELL_TYPES.ENEMY && cell.type !== CELL_TYPES.BOSS)) {
    return;
  }

  if (cell.type === CELL_TYPES.BOSS) {
    if (!draft.boss) {
      return;
    }
    draft.boss.lives = Math.max(0, (draft.boss.lives ?? 0) - 1);
    applySkillBonuses(draft, BOSS_HIT_SCORE);
    draft.events.push('boss-hit');
    if (draft.boss.lives <= 0) {
      clearCell(draft.board, row, col);
      draft.enemies = Math.max(0, draft.enemies - 1);
      draft.boss = null;
      draft.events.push('boss-defeated');
    }
    return;
  }

  clearCell(draft.board, row, col);
  draft.enemies = Math.max(0, draft.enemies - 1);
  applySkillBonuses(draft, ENEMY_DESTROY_SCORE);
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
