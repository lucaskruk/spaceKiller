import React from 'react';
import { GameProvider, useGameState, useGameActions } from './context/GameContext.jsx';
import { useGameLoop } from './hooks/useGameLoop.js';
import { useAudioManager } from './hooks/useAudioManager.js';
import { GameBoard } from './components/GameBoard.jsx';
import { KeyboardControls, OnScreenControls } from './components/GameControls.jsx';
import { LEVEL_CLEAR_TICK_MS } from './game/constants.js';


function GameOverModal({ score, level, highScores = [], lastScoreId, onRestart }) {
  const entries = Array.isArray(highScores) ? highScores : [];
  const formatNumber = (value) => Number(value ?? 0).toLocaleString();

  return (
    <div className="game-over-overlay" role="presentation">
      <div
        className="game-over-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        <h2 id="game-over-title">Game Over</h2>
        <p className="game-over-modal__score">Score: {formatNumber(score)}</p>
        <p className="game-over-modal__level">Level reached: {level}</p>
        <div className="game-over-modal__leaderboard">
          <h3>High Scores</h3>
          {entries.length ? (
            <ol className="game-over-modal__list">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isLatest = entry.id === lastScoreId;
                return (
                  <li
                    key={entry.id}
                    className={`game-over-modal__item${isLatest ? ' is-current' : ''}`}
                  >
                    <span className="game-over-modal__rank">#{rank}</span>
                    <span className="game-over-modal__item-score">{formatNumber(entry.score)}</span>
                    <span className="game-over-modal__item-level">Level {entry.level}</span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="game-over-modal__empty">No scores yet. Be the first!</p>
          )}
        </div>
        <button
          type="button"
          className="control-button control-button--action game-over-modal__restart"
          onClick={onRestart}
        >
          Restart Game
        </button>
      </div>
    </div>
  );
}

function GameShell() {
  const { metrics, ammo, status, enemies, events, transition, highScores, lastScoreId, boss } = useGameState();
  const livesRemaining = Math.max(0, metrics.lives ?? 0);
  const lifeIcons = Array.from({ length: livesRemaining });
  const { reset } = useGameActions();
  const handleRestart = React.useCallback(() => {
    reset();
  }, [reset]);

  const { musicEnabled, toggleMusic } = useAudioManager(events);
  const isTransitioning = Boolean(transition && transition.mode !== 'idle');
  const isLevelClearTransition = transition?.mode === 'level-clear-rise' || transition?.mode === 'level-clear-fill';
  const loopDelay = isLevelClearTransition ? LEVEL_CLEAR_TICK_MS : metrics.waitTime;
  const isRunning = !status.paused && !status.gameOver && !status.playerDied && (!status.levelCleared || isTransitioning);

  useGameLoop(loopDelay, isRunning);

  return (
    <div className="app-shell">
      <KeyboardControls />
      {status.gameOver && (
        <GameOverModal
          score={metrics.currentScore}
          level={metrics.level}
          highScores={highScores}
          lastScoreId={lastScoreId}
          onRestart={handleRestart}
        />
      )}
      <header className="app-header">
        <h1>Space Killer React</h1>
        <div className="header-controls">
          <button
            type="button"
            className={`control-button music-toggle ${musicEnabled ? 'is-active' : ''}`}
            onClick={toggleMusic}
          >
            {musicEnabled ? 'Stop Music' : 'Play Music'}
          </button>
        </div>
      </header>
      <section className="app-stats">
        <p>Level: {metrics.level}</p>
        <p className="lives-display">
          <span className="lives-display__label">Lives:</span>
          <span className="lives-display__icons" aria-hidden="true">
            {lifeIcons.map((_, index) => (
              <img
                key={`life-${index}`}
                src="/img/player.png"
                alt=""
                className="life-icon"
                draggable={false}
              />
            ))}
          </span>
        </p>
        <p>Score: {metrics.currentScore}</p>
        {boss ? (
          <p className="lives-display lives-display--boss">
            <span className="lives-display__label">Boss:</span>
            <span className="lives-display__icons" aria-hidden="true">
              {Array.from({ length: Math.max(0, boss.lives ?? 0) }).map((_, index) => (
                <img
                  key={`boss-life-${index}`}
                  src="/img/boss.png"
                  alt=""
                  className="life-icon life-icon--boss"
                  draggable={false}
                />
              ))}
            </span>
          </p>
        ) : null}
      </section>
      <main className="app-main">
        <div className="board-stage">
          <GameBoard />
          {status.paused && !status.gameOver && !status.playerDied ? (
            <div className="board-overlay" aria-hidden="true">Paused</div>
          ) : null}
        </div>
        <OnScreenControls />
      </main>
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}

export default App;
