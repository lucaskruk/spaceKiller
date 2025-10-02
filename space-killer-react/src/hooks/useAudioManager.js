import { useCallback, useEffect, useMemo, useState } from 'react';
import { Howl } from 'howler';

const SOUND_SOURCES = {
  music: {
    src: ['/audio/main_song.mp3'],
    options: { loop: true, volume: 0.25 },
  },
  playerShot: {
    src: ['/audio/playershot.wav'],
    options: { volume: 0.6 },
  },
  playerExplode: {
    src: ['/audio/player_explode.wav'],
    options: { volume: 0.7 },
  },
  enemyExplode: {
    src: ['/audio/enemy_explode.wav'],
    options: { volume: 0.65 },
  },
  winLevel: {
    src: ['/audio/win_level.ogg'],
    options: { volume: 0.8 },
  },
  lose: {
    src: ['/audio/lose.mp3'],
    options: { volume: 0.8 },
  },
};

const EVENT_SOUND_KEY = {
  'player-fired': 'playerShot',
  'enemy-explosion': 'enemyExplode',
  'player-hit': 'playerExplode',
  'level-cleared': 'winLevel',
  'campaign-complete': 'winLevel',
  'game-over': 'lose',
};

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
