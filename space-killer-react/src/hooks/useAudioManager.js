import { useCallback, useEffect, useMemo, useState } from 'react';
import { Howl } from 'howler';
import { SOUND_SOURCES, EVENT_SOUND_KEY } from '../game/constants.js';

const buildHowls = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return Object.keys(SOUND_SOURCES).reduce((acc, key) => {
    const { src, options } = SOUND_SOURCES[key];
    acc[key] = new Howl({ src, ...options });
    return acc;
  }, {});
};

export function useAudioManager(events = []) {
  const howls = useMemo(buildHowls, []);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    if (!howls?.music) {
      return undefined;
    }

    if (musicEnabled) {
      if (!howls.music.playing()) {
        try {
          howls.music.play();
        } catch (error) {
          // Ignore autoplay errors; Howler will retry after user interaction.
        }
      }
    } else if (howls.music.playing()) {
      howls.music.pause();
    }

    return () => {
      if (howls.music.playing()) {
        howls.music.stop();
      }
    };
  }, [howls, musicEnabled]);

  useEffect(() => {
    if (!howls) {
      return;
    }

    events.forEach((eventName) => {
      const soundKey = EVENT_SOUND_KEY[eventName];
      if (!soundKey) {
        return;
      }
      const sound = howls[soundKey];
      if (!sound) {
        return;
      }
      try {
        sound.stop();
        sound.play();
      } catch (error) {
        // Ignore playback errors to keep the game running smoothly.
      }
    });
  }, [events, howls]);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((current) => !current);
  }, []);

  return {
    musicEnabled,
    toggleMusic,
  };
}
