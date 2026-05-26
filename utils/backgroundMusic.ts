/**
 * @description  화면별 BGM player 생성, preload, 세션 전환, pause/resume, 볼륨을 관리합니다.
 * @depends      assets/musics/bgm/*
 * @used-by      app/_layout.tsx, app/index.tsx, app/game/index.tsx, app/room/index.tsx, app/miniGame/index.tsx
 * @side-effects expo-audio player 생성/재생/정지, retry timer 관리
 */
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

const BACKGROUND_MUSIC_SOURCES = {
  main: require("@/assets/musics/bgm/main-ui.mp3"),
  miniGameMain: require("@/assets/musics/bgm/minigame-main.mp3"),
  miniGameIngame: require("@/assets/musics/bgm/minigame-ingame.mp3"),
  myRoom: require("@/assets/musics/bgm/my-room.mp3"),
  titleLogin: require("@/assets/musics/bgm/title-login.mp3"),
} as const;

export type BackgroundMusicTrack = keyof typeof BACKGROUND_MUSIC_SOURCES;

const BACKGROUND_MUSIC_RETRY_DELAY_MS = 500;
const DEFAULT_BACKGROUND_MUSIC_VOLUME = 0.14;
const BACKGROUND_MUSIC_VOLUME_SCALE: Record<BackgroundMusicTrack, number> = {
  main: 1,
  miniGameMain: 1,
  miniGameIngame: 1,
  myRoom: 1.6,
  titleLogin: 1,
};

let backgroundMusicRetryTimer: ReturnType<typeof setTimeout> | null = null;
let currentBackgroundMusicTrack: BackgroundMusicTrack = "main";
let backgroundMusicVolume = 1;
let isBackgroundMusicRequested = false;
let shouldResumeBackgroundMusicAfterPause = false;
let activeBackgroundMusicSessionId: number | null = null;
let nextBackgroundMusicSessionId = 0;

const backgroundMusicPlayers: Partial<
  Record<BackgroundMusicTrack, AudioPlayer>
> = {};

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

const getBackgroundMusicPlayerVolume = (track: BackgroundMusicTrack) => {
  return (
    DEFAULT_BACKGROUND_MUSIC_VOLUME *
    BACKGROUND_MUSIC_VOLUME_SCALE[track] *
    backgroundMusicVolume
  );
};

const getAllBackgroundMusicTracks = () => {
  return Object.keys(BACKGROUND_MUSIC_SOURCES) as BackgroundMusicTrack[];
};

const clearRetryTimer = () => {
  if (!backgroundMusicRetryTimer) {
    return;
  }

  clearTimeout(backgroundMusicRetryTimer);
  backgroundMusicRetryTimer = null;
};

const getExistingBackgroundMusicPlayer = (
  track: BackgroundMusicTrack = currentBackgroundMusicTrack,
) => {
  return backgroundMusicPlayers[track] ?? null;
};

const pauseBackgroundMusicTrack = (track: BackgroundMusicTrack) => {
  const player = getExistingBackgroundMusicPlayer(track);
  if (!player || !player.playing) {
    return;
  }

  try {
    player.pause();
  } catch (error) {
    console.warn(`Failed to pause the "${track}" background music.`, error);
  }
};

const pauseOtherBackgroundMusicTracks = (activeTrack: BackgroundMusicTrack) => {
  getAllBackgroundMusicTracks().forEach((track) => {
    if (track === activeTrack) {
      return;
    }

    pauseBackgroundMusicTrack(track);
  });
};

const releaseBackgroundMusicPlayer = (
  track: BackgroundMusicTrack = currentBackgroundMusicTrack,
) => {
  const player = getExistingBackgroundMusicPlayer(track);
  if (!player) {
    return;
  }

  pauseBackgroundMusicTrack(track);

  try {
    player.remove();
  } catch {
    // 앱 초기화 시점과 겹치면 native player 정리가 실패할 수 있습니다.
  } finally {
    delete backgroundMusicPlayers[track];
  }
};

const getBackgroundMusicPlayer = (
  track: BackgroundMusicTrack = currentBackgroundMusicTrack,
) => {
  const existingPlayer = getExistingBackgroundMusicPlayer(track);
  if (existingPlayer) {
    return existingPlayer;
  }

  const player = createAudioPlayer(BACKGROUND_MUSIC_SOURCES[track], {
    keepAudioSessionActive: true,
  });

  player.loop = true;
  player.volume = getBackgroundMusicPlayerVolume(track);
  backgroundMusicPlayers[track] = player;

  return player;
};

const withExistingBackgroundMusicPlayer = <T>(
  callback: (player: AudioPlayer) => T,
  track: BackgroundMusicTrack = currentBackgroundMusicTrack,
): T | null => {
  const player = getExistingBackgroundMusicPlayer(track);
  if (!player) {
    return null;
  }

  try {
    return callback(player);
  } catch (error) {
    console.warn(
      `Failed to access the "${track}" background music player.`,
      error,
    );
    releaseBackgroundMusicPlayer(track);
    return null;
  }
};

const withBackgroundMusicPlayer = <T>(
  callback: (player: AudioPlayer) => T,
  track: BackgroundMusicTrack = currentBackgroundMusicTrack,
): T | null => {
  try {
    const player = getBackgroundMusicPlayer(track);
    return callback(player);
  } catch (error) {
    console.warn(
      `The "${track}" background music player is not ready yet. The app will retry shortly.`,
      error,
    );
    releaseBackgroundMusicPlayer(track);
    return null;
  }
};

const scheduleBackgroundMusicRetry = () => {
  if (backgroundMusicRetryTimer || !isBackgroundMusicRequested) {
    return;
  }

  backgroundMusicRetryTimer = setTimeout(() => {
    backgroundMusicRetryTimer = null;
    playBackgroundMusic();
  }, BACKGROUND_MUSIC_RETRY_DELAY_MS);
};

export const preloadBackgroundMusicTracks = (
  tracks: BackgroundMusicTrack[] = getAllBackgroundMusicTracks(),
) => {
  tracks.forEach((track) => {
    withBackgroundMusicPlayer(() => true, track);
  });
};

export const playBackgroundMusic = () => {
  isBackgroundMusicRequested = true;

  const didPlay = withBackgroundMusicPlayer((player) => {
    pauseOtherBackgroundMusicTracks(currentBackgroundMusicTrack);

    if (!player.playing) {
      player.play();
    }

    return true;
  });

  if (didPlay) {
    clearRetryTimer();
    return;
  }

  scheduleBackgroundMusicRetry();
};

export const pauseBackgroundMusic = () => {
  isBackgroundMusicRequested = false;
  clearRetryTimer();
  pauseBackgroundMusicTrack(currentBackgroundMusicTrack);
};

export const toggleBackgroundMusic = () => {
  if (isBackgroundMusicRequested || isBackgroundMusicPlaying()) {
    pauseBackgroundMusic();
    return;
  }

  playBackgroundMusic();
};

export const restartBackgroundMusic = () => {
  isBackgroundMusicRequested = true;

  const player = withExistingBackgroundMusicPlayer(
    (activePlayer) => activePlayer,
  );
  if (!player) {
    playBackgroundMusic();
    return;
  }

  pauseOtherBackgroundMusicTracks(currentBackgroundMusicTrack);

  void player
    .seekTo(0)
    .then(() => {
      try {
        player.play();
      } catch (error) {
        console.warn("Failed to restart background music.", error);
        releaseBackgroundMusicPlayer(currentBackgroundMusicTrack);
        scheduleBackgroundMusicRetry();
      }
    })
    .catch(() => {
      try {
        player.play();
      } catch (error) {
        console.warn("Failed to restart background music.", error);
        releaseBackgroundMusicPlayer(currentBackgroundMusicTrack);
        scheduleBackgroundMusicRetry();
      }
    });
};

const playBackgroundMusicFromStart = () => {
  isBackgroundMusicRequested = true;

  const player = withExistingBackgroundMusicPlayer(
    (activePlayer) => activePlayer,
  );

  if (!player) {
    playBackgroundMusic();
    return;
  }

  pauseOtherBackgroundMusicTracks(currentBackgroundMusicTrack);

  void player
    .seekTo(0)
    .then(() => {
      try {
        player.play();
        clearRetryTimer();
      } catch (error) {
        console.warn(
          "Failed to play background music from the beginning.",
          error,
        );
        releaseBackgroundMusicPlayer(currentBackgroundMusicTrack);
        scheduleBackgroundMusicRetry();
      }
    })
    .catch(() => {
      try {
        player.play();
        clearRetryTimer();
      } catch (error) {
        console.warn(
          "Failed to play background music from the beginning.",
          error,
        );
        releaseBackgroundMusicPlayer(currentBackgroundMusicTrack);
        scheduleBackgroundMusicRetry();
      }
    });
};

export const stopBackgroundMusic = () => {
  isBackgroundMusicRequested = false;
  shouldResumeBackgroundMusicAfterPause = false;
  clearRetryTimer();
  pauseBackgroundMusicTrack(currentBackgroundMusicTrack);
};

export const changeBackgroundMusic = (track: BackgroundMusicTrack) => {
  if (currentBackgroundMusicTrack === track) {
    return;
  }

  const shouldResumePlayback =
    isBackgroundMusicRequested ||
    Boolean(
      getExistingBackgroundMusicPlayer(currentBackgroundMusicTrack)?.playing,
    );

  pauseBackgroundMusicTrack(currentBackgroundMusicTrack);
  currentBackgroundMusicTrack = track;

  if (shouldResumePlayback) {
    playBackgroundMusic();
  }
};

export const setBackgroundMusicVolume = (volume: number) => {
  backgroundMusicVolume = clampVolume(volume);

  getAllBackgroundMusicTracks().forEach((track) => {
    withExistingBackgroundMusicPlayer((player) => {
      player.volume = getBackgroundMusicPlayerVolume(track);
    }, track);
  });
};

export const getBackgroundMusicVolume = () => {
  return backgroundMusicVolume;
};

export const getBackgroundMusicTrack = () => {
  return currentBackgroundMusicTrack;
};

export const isBackgroundMusicPlaying = () => {
  const isPlaying = withExistingBackgroundMusicPlayer(
    (player) => player.playing,
  );
  return isPlaying ?? false;
};

export const startBackgroundMusicSession = (track: BackgroundMusicTrack) => {
  const sessionId = ++nextBackgroundMusicSessionId;
  activeBackgroundMusicSessionId = sessionId;

  clearRetryTimer();
  changeBackgroundMusic(track);
  playBackgroundMusicFromStart();

  return () => {
    if (activeBackgroundMusicSessionId !== sessionId) {
      return;
    }

    activeBackgroundMusicSessionId = null;
    stopBackgroundMusic();
  };
};

export const pauseBackgroundMusicForOverlay = () => {
  clearRetryTimer();
  shouldResumeBackgroundMusicAfterPause =
    isBackgroundMusicRequested || isBackgroundMusicPlaying();
  pauseBackgroundMusicTrack(currentBackgroundMusicTrack);
};

export const resumeBackgroundMusicAfterOverlay = () => {
  if (!shouldResumeBackgroundMusicAfterPause) {
    return;
  }

  shouldResumeBackgroundMusicAfterPause = false;

  const didResume = withExistingBackgroundMusicPlayer((player) => {
    if (!player.playing) {
      player.play();
    }

    return true;
  });

  if (didResume) {
    clearRetryTimer();
    return;
  }

  playBackgroundMusic();
};
