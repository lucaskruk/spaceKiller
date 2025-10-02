import { useEffect, useRef } from 'react';
import { useGameActions } from '../context/GameContext.jsx';

export function useGameLoop(delay, enabled = true) {
  const { tick } = useGameActions();
  const savedTick = useRef(tick);

  useEffect(() => {
    savedTick.current = tick;
  }, [tick]);

  useEffect(() => {
    if (!enabled || delay == null) {
      return undefined;
    }

    const id = setInterval(() => {
      savedTick.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay, enabled]);
}
