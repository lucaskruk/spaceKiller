import { GLOWING_ENEMY_SHIELD_DURATION, GLOWING_ENEMY_SHIELD_HITS } from '../constants.js';

const createShieldState = () => ({
  active: false,
  ticksRemaining: 0,
  hitsRemaining: 0,
});

const ensureShieldState = (draft) => {
  if (!draft.shield || typeof draft.shield !== 'object') {
    draft.shield = createShieldState();
  }
  return draft.shield;
};

export const resetShield = (draft) => {
  const shield = ensureShieldState(draft);
  shield.active = false;
  shield.ticksRemaining = 0;
  shield.hitsRemaining = 0;
};

export const grantShieldPowerUp = (draft, {
  duration = GLOWING_ENEMY_SHIELD_DURATION,
  hits = GLOWING_ENEMY_SHIELD_HITS,
} = {}) => {
  const shield = ensureShieldState(draft);
  shield.active = true;
  shield.ticksRemaining = Math.max(0, duration);
  shield.hitsRemaining = Math.max(0, hits);
  draft.events?.push?.('shield-activated');
  return shield;
};

export const consumeShieldHit = (draft) => {
  const shield = ensureShieldState(draft);
  if (!shield.active || shield.hitsRemaining <= 0) {
    return false;
  }
  shield.hitsRemaining = Math.max(0, shield.hitsRemaining - 1);
  if (shield.hitsRemaining <= 0) {
    resetShield(draft);
  }
  draft.events?.push?.('shield-blocked-hit');
  return true;
};

export const tickShield = (draft) => {
  const shield = ensureShieldState(draft);
  if (!shield.active) {
    shield.ticksRemaining = 0;
    shield.hitsRemaining = Math.max(0, shield.hitsRemaining ?? 0);
    return;
  }

  if (!draft.player) {
    resetShield(draft);
    return;
  }

  if (shield.ticksRemaining > 0) {
    shield.ticksRemaining -= 1;
  }

  if (shield.ticksRemaining <= 0 || shield.hitsRemaining <= 0) {
    resetShield(draft);
  }
};
