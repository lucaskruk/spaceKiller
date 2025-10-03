import React, { useEffect, useRef, useCallback } from 'react';
import { useGameActions, useGameState } from '../context/GameContext.jsx';

const HOLD_INTERVAL = 130;
const MOVE_LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const MOVE_RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const FIRE_KEYS = new Set([' ', 'Space', 'Spacebar', 'w', 'W', 'ArrowUp']);

function canAcceptInput(status) {
  return !status.paused && !status.gameOver && !status.levelCleared && !status.playerDied;
}

export function KeyboardControls() {
  const { queueMoveLeft, queueMoveRight, queueShot, togglePause, reset, advanceLevel } = useGameActions();
  const { status } = useGameState();
  const inputEnabled = canAcceptInput(status);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;

      if (MOVE_LEFT_KEYS.has(key)) {
        if (inputEnabled) {
          queueMoveLeft();
        }
        event.preventDefault();
        return;
      }

      if (MOVE_RIGHT_KEYS.has(key)) {
        if (inputEnabled) {
          queueMoveRight();
        }
        event.preventDefault();
        return;
      }

      if (FIRE_KEYS.has(key)) {
        if (inputEnabled) {
          queueShot();
        }
        event.preventDefault();
        return;
      }

      if (key === 'p' || key === 'P') {
        togglePause();
        event.preventDefault();
        return;
      }

      if (key === 'r' || key === 'R') {
        reset();
        event.preventDefault();
        return;
      }

      if (key === 'k' || key === 'K') {
        advanceLevel();
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputEnabled, queueMoveLeft, queueMoveRight, queueShot, togglePause, reset, advanceLevel]);

  return null;
}

export function OnScreenControls() {
  const repeatTimer = useRef(null);
  const { queueMoveLeft, queueMoveRight, queueShot, togglePause, reset } = useGameActions();
  const state = useGameState();
  const inputEnabled = canAcceptInput(state.status);

  const clearRepeat = useCallback(() => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  useEffect(() => clearRepeat, [clearRepeat]);

  useEffect(() => {
    if (!inputEnabled) {
      clearRepeat();
    }
  }, [inputEnabled, clearRepeat]);

  const startRepeating = useCallback((action, repeat = true) => (event) => {
    if (!inputEnabled) {
      return;
    }
    event.preventDefault();
    action();
    if (!repeat) {
      return;
    }
    clearRepeat();
    repeatTimer.current = setInterval(action, HOLD_INTERVAL);
  }, [clearRepeat, inputEnabled]);

  const disabled = !inputEnabled;

  return (
    <div className="control-panel">
      <div className="primary-controls">
        <button
          type="button"
          className="control-button control-button--action"
          onClick={togglePause}
        >
          {state.status.paused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          className="control-button control-button--secondary"
          onClick={reset}
        >
          Reset
        </button>
      </div>
      <div className="movement-controls">
        <div className="movement-controls__left">
          <button
            type="button"
            className="control-button"
            disabled={disabled}
            aria-label="Move left"
            onPointerDown={startRepeating(queueMoveLeft)}
            onPointerUp={clearRepeat}
            onPointerLeave={clearRepeat}
            onPointerCancel={clearRepeat}
          >
            ←
          </button>
          <button
            type="button"
            className="control-button"
            disabled={disabled}
            aria-label="Move right"
            onPointerDown={startRepeating(queueMoveRight)}
            onPointerUp={clearRepeat}
            onPointerLeave={clearRepeat}
            onPointerCancel={clearRepeat}
          >
            →
          </button>
        </div>
        <div className="movement-controls__fire">
          <button
            type="button"
            className="control-button control-button--fire"
            disabled={disabled}
            aria-label="Fire"
            onPointerDown={startRepeating(queueShot, false)}
            onPointerUp={clearRepeat}
            onPointerLeave={clearRepeat}
            onPointerCancel={clearRepeat}
          >
            ✨
          </button>
        </div>
      </div>
    </div>
  );
}
