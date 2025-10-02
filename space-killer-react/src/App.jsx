import React from 'react';
import { GameProvider, useGameState } from './context/GameContext.jsx';
import { useGameLoop } from './hooks/useGameLoop.js';
import { useAudioManager } from './hooks/useAudioManager.js';
import { GameBoard } from './components/GameBoard.jsx';
import { KeyboardControls, OnScreenControls } from './components/GameControls.jsx';

function StatusBanner({ status }) {
  if (status.gameOver) {
    return <p className="status-banner status-banner--danger">Game Over</p>;
  }
  if (status.levelCleared) {
    return <p className="status-banner status-banner--success">Level Cleared</p>;
  }
  if (status.playerDied) {
    return <p className="status-banner status-banner--warning">Ship Destroyed</p>;
  }
  if (status.paused) {
    return <p className="status-banner">Paused</p>;
  }
  return null;
}

function GameShell() {
  const { metrics, ammo, status, enemies, events, transition } = useGameState();
  const { musicEnabled, toggleMusic } = useAudioManager(events);
  const isTransitioning = Boolean(transition && transition.mode !== 'idle');
  const isRunning = !status.paused && !status.gameOver && !status.playerDied && (!status.levelCleared || isTransitioning);

  useGameLoop(metrics.waitTime, isRunning);

  return (
    <div className="app-shell">
      <KeyboardControls />
      <header className="app-header">
        <h1>Space Killer React</h1>
        <p>A modern React port of the Pascal classic.</p>
        <div className="header-controls">
          <StatusBanner status={status} />
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
        <p>Lives: {metrics.lives}</p>
        <p>Score: {metrics.currentScore}</p>
        <p>Enemies remaining: {enemies}</p>
        <p>Shots remaining: {ammo.remainingShots}</p>
        <p>Tick speed: {metrics.waitTime}ms</p>
      </section>
      <main className="app-main">
        <GameBoard />
        <OnScreenControls />
      </main>
      <section className="app-debug">
        <h2>Recent events</h2>
        <p>{events.length ? events.join(', ') : 'None'}</p>
      </section>
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
