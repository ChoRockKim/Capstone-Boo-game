/**
 * @description  버튼/캐릭터/퀴즈/진화 효과음 player 생성, preload, 재생, 볼륨을 관리합니다.
 * @depends      assets/musics/sfx/*
 * @used-by      app/_layout.tsx, app/game/index.tsx, app/room/index.tsx, components/* 버튼/패널
 * @side-effects expo-audio player 생성/seek/play, SFX 볼륨 상태 변경
 */
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

const SOUND_EFFECT_SOURCES = {
  basicClick: require("@/assets/musics/sfx/basic-click.m4a"),
  booTouch: require("@/assets/musics/sfx/boo-touch.m4a"),
  congratulation: require("@/assets/musics/sfx/congratulation.m4a"),
  eating: require("@/assets/musics/sfx/eating.m4a"),
  evolution: require("@/assets/musics/sfx/evolution.m4a"),
  pointPlus: require("@/assets/musics/sfx/point-plus.m4a"),
  quizO: require("@/assets/musics/sfx/quiz-o.m4a"),
  quizX: require("@/assets/musics/sfx/quiz-x.m4a"),
} as const;

export type SoundEffectName = keyof typeof SOUND_EFFECT_SOURCES;

const soundEffectPlayers: Partial<Record<SoundEffectName, AudioPlayer>> = {};
const lastPlayedAtBySoundEffect: Partial<Record<SoundEffectName, number>> = {};

const SOUND_EFFECT_REPLAY_COOLDOWN_MS: Record<SoundEffectName, number> = {
  basicClick: 80,
  booTouch: 80,
  congratulation: 120,
  eating: 120,
  evolution: 120,
  pointPlus: 40,
  quizO: 120,
  quizX: 120,
};

const SOUND_EFFECT_VOLUME_MULTIPLIER: Record<SoundEffectName, number> = {
  basicClick: 0.3,
  booTouch: 1,
  congratulation: 0.5,
  eating: 1,
  evolution: 0.5,
  pointPlus: 1,
  quizO: 1,
  quizX: 1,
};

let soundEffectsVolume = 1;

const clampVolume = (volume: number) => Math.max(0, Math.min(volume, 1));

const getEffectiveSoundEffectVolume = (soundEffectName: SoundEffectName) =>
  clampVolume(soundEffectsVolume * SOUND_EFFECT_VOLUME_MULTIPLIER[soundEffectName]);

const getSoundEffectPlayer = (soundEffectName: SoundEffectName) => {
  const existingPlayer = soundEffectPlayers[soundEffectName];
  if (existingPlayer) {
    return existingPlayer;
  }

  const player = createAudioPlayer(SOUND_EFFECT_SOURCES[soundEffectName], {
    keepAudioSessionActive: false,
    preferredForwardBufferDuration: 0,
  });

  player.volume = getEffectiveSoundEffectVolume(soundEffectName);
  soundEffectPlayers[soundEffectName] = player;

  return player;
};

export const setSoundEffectsVolume = (volume: number) => {
  soundEffectsVolume = clampVolume(volume);

  Object.entries(soundEffectPlayers).forEach(([soundEffectName, player]) => {
    if (!player) {
      return;
    }

    player.volume = getEffectiveSoundEffectVolume(
      soundEffectName as SoundEffectName,
    );
  });
};

export const getSoundEffectsVolume = () => {
  return soundEffectsVolume;
};

export const preloadSoundEffects = () => {
  (Object.keys(SOUND_EFFECT_SOURCES) as SoundEffectName[]).forEach(
    (soundEffectName) => {
      try {
        getSoundEffectPlayer(soundEffectName);
      } catch (error) {
        console.warn(
          `Failed to preload the "${soundEffectName}" sound effect.`,
          error,
        );
      }
    },
  );
};

export const playSoundEffect = (soundEffectName: SoundEffectName) => {
  const now = Date.now();
  const lastPlayedAt = lastPlayedAtBySoundEffect[soundEffectName] ?? 0;

  if (now - lastPlayedAt < SOUND_EFFECT_REPLAY_COOLDOWN_MS[soundEffectName]) {
    return;
  }

  lastPlayedAtBySoundEffect[soundEffectName] = now;

  try {
    const player = getSoundEffectPlayer(soundEffectName);
    player.volume = getEffectiveSoundEffectVolume(soundEffectName);

    if (player.playing) {
      player.pause();
    }

    void player
      .seekTo(0, 25, 25)
      .then(() => player.play())
      .catch((error) => {
        console.warn(`Failed to seek the "${soundEffectName}" sound effect.`, error);
        player.remove();
        delete soundEffectPlayers[soundEffectName];
      });
  } catch (error) {
    console.warn(`Failed to play the "${soundEffectName}" sound effect.`, error);
  }
};
