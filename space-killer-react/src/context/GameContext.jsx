import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  ACTIONS,
  createInitialState,
  gameReducer,
  HIGH_SCORE_STORAGE_KEY,
} from '../game/state.js';

const GameStateContext = createContext(null);
const GameDispatchContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const contextValue = useMemo(() => state, [state]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('localStorage' in window)) {
      return;
    }

    try {
      const payload = JSON.stringify(state.highScores ?? []);
      window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, payload);
    } catch (error) {
      // Persist errors can be safely ignored.
    }
  }, [state.highScores]);

  return (
    <GameStateContext.Provider value={contextValue}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === null) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}

export function useGameDispatch() {
  const context = useContext(GameDispatchContext);
  if (context === null) {
    throw new Error('useGameDispatch must be used within a GameProvider');
  }
  return context;
}

export function useGameActions() {
  const dispatch = useGameDispatch();

  return useMemo(() => ({
    reset: () => dispatch({ type: ACTIONS.RESET }),
    togglePause: () => dispatch({ type: ACTIONS.PAUSE_TOGGLE }),
    queueMoveLeft: () => dispatch({ type: ACTIONS.QUEUE_MOVE_LEFT }),
    queueMoveRight: () => dispatch({ type: ACTIONS.QUEUE_MOVE_RIGHT }),
    queueShot: () => dispatch({ type: ACTIONS.QUEUE_SHOT }),
    tick: () => dispatch({ type: ACTIONS.TICK }),
    advanceLevel: () => dispatch({ type: ACTIONS.ADVANCE_LEVEL }),
    respawnPlayer: () => dispatch({ type: ACTIONS.PLAYER_RESPAWNED }),
  }), [dispatch]);
}
