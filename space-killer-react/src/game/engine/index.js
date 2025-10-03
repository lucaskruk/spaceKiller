import { produce } from 'immer';
import { moveBothBullets, moveBossDiagonalBullets, moveEnemyBullets, movePlayerBullets } from './projectiles.js';
import { checkGameMilestones, applyLevelLayout, advanceToNextLevel, runLevelClearTransition } from './progression.js';
import { moveEnemies } from './enemy.js';
import { updateBoss } from './boss.js';
import { queuePlayerFire, queuePlayerMove } from './player.js';
import { isPlayable } from './status.js';

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
    moveBossDiagonalBullets(draft);
    movePlayerBullets(draft);
    moveBothBullets(draft);
    moveEnemies(draft);
    updateBoss(draft);
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
