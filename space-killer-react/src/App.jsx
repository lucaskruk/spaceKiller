import React from 'react';
import { GameProvider, useGameState, useGameActions } from './context/GameContext.jsx';
import { useGameLoop } from './hooks/useGameLoop.js';
import { useAudioManager } from './hooks/useAudioManager.js';
import { GameBoard } from './components/GameBoard.jsx';
import { KeyboardControls, OnScreenControls } from './components/GameControls.jsx';
import { LEVEL_CLEAR_TICK_MS, HIGH_SCORE_NAME_MAX_LENGTH } from './game/constants.js';


function GameOverModal({ score, level, highScores = [], lastScoreId, onRestart, onSaveName }) {
  const entries = Array.isArray(highScores) ? highScores : [];
  const formatNumber = (value) => Number(value ?? 0).toLocaleString();
  const currentEntry = entries.find((entry) => entry.id === lastScoreId) ?? null;
  const [name, setName] = React.useState(currentEntry?.name ?? '');

  React.useEffect(() => {
    setName(currentEntry?.name ?? '');
  }, [currentEntry?.id, currentEntry?.name]);

  const hasPendingEntry = Boolean(currentEntry && !currentEntry.name);
  const handleSubmit = React.useCallback((event) => {
    event.preventDefault();
    if (!currentEntry || typeof onSaveName !== 'function') {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onSaveName(currentEntry.id, trimmed);
    setName(trimmed);
  }, [currentEntry, name, onSaveName]);

  const handleNameChange = React.useCallback((event) => {
    setName(event.target.value);
  }, []);

  const isSaveDisabled = !name.trim();

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
          {hasPendingEntry ? (
            <form className="game-over-modal__name-form" onSubmit={handleSubmit}>
              <label className="game-over-modal__name-label" htmlFor="high-score-name-input">
                New high score! Enter your name:
              </label>
              <div className="game-over-modal__name-fields">
                <input
                  id="high-score-name-input"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  maxLength={HIGH_SCORE_NAME_MAX_LENGTH}
                  placeholder="Your name"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="submit"
                  className="control-button control-button--action"
                  disabled={isSaveDisabled}
                >
                  Save
                </button>
              </div>
            </form>
          ) : null}
          {entries.length ? (
            <ol className="game-over-modal__list">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isLatest = entry.id === lastScoreId;
                const displayName = entry.name || 'Anonymous';
                return (
                  <li
                    key={entry.id}
                    className={`game-over-modal__item${isLatest ? ' is-current' : ''}`}
                  >
                    <span className="game-over-modal__rank">#{rank}</span>
                    <span className="game-over-modal__item-name">{displayName}</span>
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
  const bossLifeIcons = boss ? Array.from({ length: Math.max(0, boss.lives ?? 0) }) : [];
  const { reset, setHighScoreName } = useGameActions();
  const handleRestart = React.useCallback(() => {
    reset();
  }, [reset]);
  const handleSaveHighScoreName = React.useCallback((id, value) => {
    setHighScoreName(id, value);
  }, [setHighScoreName]);

  const storedHighScore = Array.isArray(highScores) && highScores.length ? highScores[0].score : 0;
  const highestScore = Math.max(Number(storedHighScore ?? 0), Number(metrics.currentScore ?? 0));

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
          onSaveName={handleSaveHighScoreName}
        />
      )}
      <header className="app-header">
        <h1>Space Killer React</h1>
      </header>
      <main className="app-main">
        <div className="playfield">
          <div className="hud-bar">
            <div className="hud-item">
              <span className="hud-label">Level</span>
              <span className="hud-value">{metrics.level}</span>
            </div>
            <div className="hud-item hud-item--lives">
              <span className="hud-label">Lives</span>
              <span className="hud-icons" aria-hidden="true">
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
            </div>
            <div className="hud-item">
              <span className="hud-label">Score</span>
              <span className="hud-value hud-value--mono">{metrics.currentScore.toLocaleString()}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">High Score</span>
              <span className="hud-value hud-value--mono">{highestScore.toLocaleString()}</span>
            </div>
            {boss ? (
              <div className="hud-item hud-item--boss">
                <span className="hud-label">Boss</span>
                <span className="hud-icons" aria-hidden="true">
                  {bossLifeIcons.map((_, index) => (
                    <img
                      key={`boss-life-${index}`}
                      src="/img/boss.png"
                      alt=""
                      className="life-icon life-icon--boss"
                      draggable={false}
                    />
                  ))}
                </span>
              </div>
            ) : null}
          </div>
          <div className="board-stage">
            <GameBoard />
            {status.paused && !status.gameOver && !status.playerDied ? (
              <div className="board-overlay" aria-hidden="true">Paused</div>
            ) : null}
          </div>
        </div>
        <OnScreenControls musicEnabled={musicEnabled} toggleMusic={toggleMusic} />
      </main>
      <footer className="app-footer">
        <p>Space Killer React is a modern reimagining of the classic arcade shooter.</p>
        <p className="app-footer__controls">Keyboard controls: Move with Left/Right arrows or A/D, Space to fire, P to pause, R to reset.</p>
        <p>Have feedback or want to contribute? visit <a href="https://github.com/lucaskruk/spaceKiller" target="_blank" rel="noreferrer">github repo</a>.</p>
      </footer>
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
