import { createAudioPlayer } from "expo-audio";

const BACKGROUND_MUSIC_SOURCES = {
  main: require("@/assets/musics/main-background.mp3"),
} as const;

export type BackgroundMusicTrack = keyof typeof BACKGROUND_MUSIC_SOURCES;

let currentBackgroundMusicTrack: BackgroundMusicTrack = "main";

const backgroundMusicPlayer = createAudioPlayer(
  BACKGROUND_MUSIC_SOURCES[currentBackgroundMusicTrack],
  {
    keepAudioSessionActive: true,
  },
);

backgroundMusicPlayer.volume = 0.2;
backgroundMusicPlayer.loop = true;

const clampVolume = (volume: number) => Math.min(1, Math.max(0, volume));

// 현재 배경음악이 재생 중이 아닐 때만 재생합니다.
export const playBackgroundMusic = () => {
  if (!backgroundMusicPlayer.playing) {
    backgroundMusicPlayer.play();
  }
};

// 현재 재생 위치를 유지한 채 배경음악을 일시정지합니다.
export const pauseBackgroundMusic = () => {
  backgroundMusicPlayer.pause();
};

// 현재 재생 위치를 유지하면서 재생/일시정지를 전환합니다.
export const toggleBackgroundMusic = () => {
  if (backgroundMusicPlayer.playing) {
    backgroundMusicPlayer.pause();
    return;
  }

  backgroundMusicPlayer.play();
};

// 현재 트랙을 처음으로 되감고 다시 재생합니다.
export const restartBackgroundMusic = () => {
  void backgroundMusicPlayer
    .seekTo(0)
    .then(() => backgroundMusicPlayer.play())
    .catch(() => backgroundMusicPlayer.play());
};

// 현재 트랙을 일시정지하고 처음 위치로 되돌립니다.
export const stopBackgroundMusic = () => {
  void backgroundMusicPlayer
    .seekTo(0)
    .then(() => backgroundMusicPlayer.pause())
    .catch(() => backgroundMusicPlayer.pause());
};

// 배경음악 트랙을 교체합니다. 기존에 재생 중이었다면 새 트랙도 바로 재생합니다.
export const changeBackgroundMusic = (track: BackgroundMusicTrack) => {
  if (currentBackgroundMusicTrack === track) return;

  const shouldPlayAfterChange = backgroundMusicPlayer.playing;

  currentBackgroundMusicTrack = track;
  backgroundMusicPlayer.replace(BACKGROUND_MUSIC_SOURCES[track]);
  backgroundMusicPlayer.loop = true;

  if (shouldPlayAfterChange) {
    backgroundMusicPlayer.play();
  }
};

// 배경음악 볼륨을 변경합니다. 0보다 작거나 1보다 큰 값은 자동으로 보정됩니다.
export const setBackgroundMusicVolume = (volume: number) => {
  backgroundMusicPlayer.volume = clampVolume(volume);
};

// 현재 배경음악 볼륨을 반환합니다.
export const getBackgroundMusicVolume = () => {
  return backgroundMusicPlayer.volume;
};

// 현재 선택된 배경음악 트랙 키를 반환합니다.
export const getBackgroundMusicTrack = () => {
  return currentBackgroundMusicTrack;
};

// 배경음악이 현재 재생 중인지 반환합니다.
export const isBackgroundMusicPlaying = () => {
  return backgroundMusicPlayer.playing;
};
