export const isPlayable = (state) =>
  !state.status.gameOver &&
  !state.status.paused &&
  !state.status.levelCleared &&
  !state.status.playerDied;
