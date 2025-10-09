import React, { useEffect, useRef, useCallback } from 'react';
import { useGameActions, useGameState } from '../context/GameContext.jsx';
import {
  HOLD_INTERVAL,
  MOVE_LEFT_KEYS,
  MOVE_RIGHT_KEYS,
  FIRE_KEYS,
} from '../game/constants.js';

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
]);

function canAcceptInput(status) {
  return !status.paused && !status.gameOver && !status.levelCleared && !status.playerDied;
}

function isTypingEvent(event) {
  if (!event) {
    return false;
  }
  const target = event.target;
  if (!target || typeof target !== 'object' || target === null) {
    return false;
  }
  const element = 'nodeType' in target && target.nodeType === 1 ? target : null;
  if (!element) {
    return false;
  }
  const tagName = element.tagName ? element.tagName.toLowerCase() : '';
  if (tagName === 'textarea') {
    return true;
  }
  if (typeof element.isContentEditable === 'boolean' ? element.isContentEditable : element.getAttribute && element.getAttribute('contenteditable') === 'true') {
    return true;
  }
  if (tagName === 'input') {
    const typeAttr = element.getAttribute ? element.getAttribute('type') : null;
    const inputType = typeAttr ? typeAttr.toLowerCase() : 'text';
    return !NON_TEXT_INPUT_TYPES.has(inputType);
  }
  return false;
}



export function KeyboardControls() {
  const { queueMoveLeft, queueMoveRight, queueShot, togglePause, reset, advanceLevel } = useGameActions();
  const { status } = useGameState();
  const inputEnabled = canAcceptInput(status);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTypingEvent(event)) {
        return;
      }

      const { key } = event;

      if (MOVE_LEFT_KEYS.has(key)) {
        if (!inputEnabled) {
          return;
        }
        queueMoveLeft();
        event.preventDefault();
        return;
      }

      if (MOVE_RIGHT_KEYS.has(key)) {
        if (!inputEnabled) {
          return;
        }
        queueMoveRight();
        event.preventDefault();
        return;
      }

      if (FIRE_KEYS.has(key)) {
        if (!inputEnabled) {
          return;
        }
        queueShot();
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

export function OnScreenControls({ musicEnabled = false, toggleMusic }) {
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

  const handleToggleMusic = useCallback(() => {
    if (typeof toggleMusic === 'function') {
      toggleMusic();
    }
  }, [toggleMusic]);
  const musicDisabled = typeof toggleMusic !== 'function';
  const musicLabel = musicEnabled ? 'Stop Music' : 'Play Music';

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
        <button
          type="button"
          className={`control-button music-toggle ${musicEnabled ? 'is-active' : ''}`}
          onClick={handleToggleMusic}
          disabled={musicDisabled}
        >
          {musicLabel}
        </button>
      </div>
      <div className="movement-controls" aria-label="Movement controls">
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
