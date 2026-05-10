import { createAudioPlayer, type AudioPlayer } from "expo-audio";

const SOUND_EFFECT_SOURCES = {
  basicClick: require("@/assets/musics/sfx/basic-click.mp3"),
  booTouch: require("@/assets/musics/sfx/boo-touch.mp3"),
  congratulation: require("@/assets/musics/sfx/congratulation.mp3"),
  eating: require("@/assets/musics/sfx/eating.mp3"),
  evolution: require("@/assets/musics/sfx/evolution.mp3"),
  quizO: require("@/assets/musics/sfx/quiz-o.mp3"),
  quizX: require("@/assets/musics/sfx/quiz-x.mp3"),
} as const;

export type SoundEffectName = keyof typeof SOUND_EFFECT_SOURCES;

const soundEffectPlayers: Partial<Record<SoundEffectName, AudioPlayer>> = {};

let soundEffectsVolume = 1;

const clampVolume = (volume: number) => Math.max(0, Math.min(volume, 1));

const getSoundEffectPlayer = (soundEffectName: SoundEffectName) => {
  const existingPlayer = soundEffectPlayers[soundEffectName];
  if (existingPlayer) {
    return existingPlayer;
  }

  const player = createAudioPlayer(SOUND_EFFECT_SOURCES[soundEffectName], {
    keepAudioSessionActive: true,
  });

  player.volume = soundEffectsVolume;
  soundEffectPlayers[soundEffectName] = player;

  return player;
};

export const setSoundEffectsVolume = (volume: number) => {
  soundEffectsVolume = clampVolume(volume);

  Object.values(soundEffectPlayers).forEach((player) => {
    if (!player) {
      return;
    }

    player.volume = soundEffectsVolume;
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
  try {
    const player = getSoundEffectPlayer(soundEffectName);
    player.volume = soundEffectsVolume;

    void player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => player.play());
  } catch (error) {
    console.warn(`Failed to play the "${soundEffectName}" sound effect.`, error);
  }
};
