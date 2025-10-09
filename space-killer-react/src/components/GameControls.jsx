import React, { useEffect, useRef, useCallback, useState } from 'react';
import nipplejs from 'nipplejs';
import { useGameActions, useGameState } from '../context/GameContext.jsx';
import {
  HOLD_INTERVAL,
  MOVE_LEFT_KEYS,
  MOVE_RIGHT_KEYS,
  FIRE_KEYS,
  AUTO_FIRE_SHOTS_PER_TICK,
  INITIAL_WAIT_TIME,
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
  return status.started && !status.paused && !status.gameOver && !status.levelCleared && !status.playerDied;
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
        if (!status.started) {
          return;
        }
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
  }, [inputEnabled, queueMoveLeft, queueMoveRight, queueShot, togglePause, reset, advanceLevel, status.started]);

  return null;
}

export function OnScreenControls({ musicEnabled = false, toggleMusic }) {
  const repeatTimer = useRef(null);
  const joystickContainerRef = useRef(null);
  const activeDirectionRef = useRef(null);
  const autoFireTimerRef = useRef(null);
  const [autoFireEnabled, setAutoFireEnabled] = useState(false);
  const { queueMoveLeft, queueMoveRight, queueShot, togglePause, reset, start } = useGameActions();
  const state = useGameState();
  const hasStarted = Boolean(state.status?.started);
  const inputEnabled = canAcceptInput(state.status);
  const gameTickDurationMs = typeof state.metrics?.waitTime === 'number' && state.metrics.waitTime > 0
    ? state.metrics.waitTime
    : INITIAL_WAIT_TIME;

  const clearRepeat = useCallback(() => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  const clearAutoFire = useCallback(() => {
    if (autoFireTimerRef.current) {
      clearInterval(autoFireTimerRef.current);
      autoFireTimerRef.current = null;
    }
  }, []);

  const triggerAction = useCallback((action, repeat = true) => {
    if (!inputEnabled || typeof action !== 'function') {
      return;
    }
    action();
    if (!repeat) {
      return;
    }
    clearRepeat();
    repeatTimer.current = setInterval(action, HOLD_INTERVAL);
  }, [clearRepeat, inputEnabled]);

  useEffect(() => () => {
    clearRepeat();
    clearAutoFire();
  }, [clearRepeat, clearAutoFire]);

  useEffect(() => {
    if (!inputEnabled) {
      activeDirectionRef.current = null;
      clearRepeat();
      clearAutoFire();
    }
  }, [inputEnabled, clearRepeat, clearAutoFire]);

  useEffect(() => {
    if (!autoFireEnabled || !inputEnabled) {
      clearAutoFire();
      return undefined;
    }

    const intervalMs = Math.max(30, Math.round(gameTickDurationMs / AUTO_FIRE_SHOTS_PER_TICK));

    clearAutoFire();
    queueShot();
    autoFireTimerRef.current = setInterval(queueShot, intervalMs);

    return () => {
      clearAutoFire();
    };
  }, [autoFireEnabled, inputEnabled, queueShot, clearAutoFire, gameTickDurationMs]);

  const handleJoystickMove = useCallback((_, data = {}) => {
    if (!inputEnabled) {
      activeDirectionRef.current = null;
      clearRepeat();
      return;
    }

    const vector = data.vector || {};
    const vectorX = typeof vector.x === 'number' ? vector.x : 0;
    const threshold = 0.35;
    let nextDirection = null;

    if (vectorX <= -threshold) {
      nextDirection = 'left';
    } else if (vectorX >= threshold) {
      nextDirection = 'right';
    }

    if (nextDirection === activeDirectionRef.current) {
      return;
    }

    activeDirectionRef.current = nextDirection;

    if (nextDirection === 'left') {
      triggerAction(queueMoveLeft, true);
    } else if (nextDirection === 'right') {
      triggerAction(queueMoveRight, true);
    } else {
      clearRepeat();
    }
  }, [clearRepeat, inputEnabled, queueMoveLeft, queueMoveRight, triggerAction]);

  useEffect(() => {
    const container = joystickContainerRef.current;
    if (!container) {
      return undefined;
    }

    const manager = nipplejs.create({
      zone: container,
      mode: 'static',
      position: { left: '25%', top: '50%' },
      color: '#38bdf8',
      size: 120,
      restJoystick: true,
      threshold: 0.1,
      multitouch: false,
      maxNumberOfNipples: 1,
    });

    const handleEnd = () => {
      activeDirectionRef.current = null;
      clearRepeat();
    };

    manager.on('move', handleJoystickMove);
    manager.on('end', handleEnd);
    manager.on('plain:up', handleEnd);
    manager.on('plain:cancel', handleEnd);

    return () => {
      manager.off('move', handleJoystickMove);
      manager.off('end', handleEnd);
      manager.off('plain:up', handleEnd);
      manager.off('plain:cancel', handleEnd);
      manager.destroy();
    };
  }, [clearRepeat, handleJoystickMove]);

  const handleFireDown = useCallback((event) => {
    if (!inputEnabled) {
      return;
    }
    event.preventDefault();
    triggerAction(queueShot, false);
  }, [inputEnabled, triggerAction, queueShot]);

  const handlePrimaryAction = useCallback(() => {
    if (!hasStarted) {
      start();
      return;
    }
    togglePause();
  }, [hasStarted, start, togglePause]);

  const primaryLabel = hasStarted ? (state.status.paused ? 'Resume' : 'Pause') : 'Start';

  const handleAutoFireToggle = useCallback(() => {
    if (!inputEnabled) {
      return;
    }
    setAutoFireEnabled((previous) => {
      const next = !previous;
      if (previous) {
        clearAutoFire();
      }
      return next;
    });
  }, [inputEnabled, clearAutoFire]);

  const handlePointerEnd = useCallback(() => {
    clearRepeat();
  }, [clearRepeat]);

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
          onClick={handlePrimaryAction}
        >
          {primaryLabel}
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
        <div className={`movement-controls__joystick${disabled ? ' is-disabled' : ''}`}>
          <div ref={joystickContainerRef} className="virtual-stick" aria-hidden="true" />
        </div>
        <div className="movement-controls__fire">
          <button
            type="button"
            className="control-button control-button--fire"
            disabled={disabled}
            aria-label="Fire"
            onPointerDown={handleFireDown}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
          >
            Fire
          </button>
          <button
            type="button"
            className={`control-button control-button--auto ${autoFireEnabled ? 'is-active' : ''}`}
            disabled={disabled}
            onClick={handleAutoFireToggle}
            aria-pressed={autoFireEnabled}
          >
            {autoFireEnabled ? 'Auto Fire: On' : 'Auto Fire: Off'}
          </button>
        </div>
      </div>
    </div>
  );
}
