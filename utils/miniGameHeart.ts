/**
 * @description  미니게임 하트 회복 계산과 시작 시 하트 소비를 처리합니다.
 * @depends      없음
 * @used-by      stores/useGameStore.ts, useHook/useRequirePlayableSession.ts
 * @side-effects 없음
 */

export const MINI_GAME_HEART_RECOVERY_MS = 30 * 60 * 1000;

export type MiniGameHeartInput = {
  heart: number;
  heartUpdatedAt: string | null;
  maxHeart: number;
};

export type MiniGameHeartStatus = {
  heart: number;
  isFull: boolean;
  maxHeart: number;
  nextHeartRecoveryRemainingMs: number;
  recoveryElapsedRemainderMs: number;
};

export type MiniGameHeartConsumeResult = {
  heart: number;
  heartUpdatedAt: string | null;
  maxHeart: number;
};

const parseRecoveryStartedAtMs = (
  heartUpdatedAt: string | null,
  fallbackMs: number,
) => {
  if (!heartUpdatedAt) {
    return fallbackMs;
  }

  const parsedMs = new Date(heartUpdatedAt).getTime();

  return Number.isFinite(parsedMs) ? parsedMs : fallbackMs;
};

export const getCurrentMiniGameHeartStatus = (
  input: MiniGameHeartInput,
  nowMs = Date.now(),
): MiniGameHeartStatus => {
  const maxHeart = Math.max(0, input.maxHeart);
  const baseHeart = Math.min(Math.max(0, input.heart), maxHeart);

  if (baseHeart >= maxHeart) {
    return {
      heart: maxHeart,
      isFull: true,
      maxHeart,
      nextHeartRecoveryRemainingMs: 0,
      recoveryElapsedRemainderMs: 0,
    };
  }

  const recoveryStartedAtMs = parseRecoveryStartedAtMs(
    input.heartUpdatedAt,
    nowMs,
  );
  const elapsedMs = Math.max(0, nowMs - recoveryStartedAtMs);
  const recoveredHeart = Math.floor(elapsedMs / MINI_GAME_HEART_RECOVERY_MS);
  const heart = Math.min(maxHeart, baseHeart + recoveredHeart);
  const isFull = heart >= maxHeart;
  const recoveryElapsedRemainderMs = isFull
    ? 0
    : elapsedMs % MINI_GAME_HEART_RECOVERY_MS;

  return {
    heart,
    isFull,
    maxHeart,
    nextHeartRecoveryRemainingMs: isFull
      ? 0
      : MINI_GAME_HEART_RECOVERY_MS - recoveryElapsedRemainderMs,
    recoveryElapsedRemainderMs,
  };
};

export const consumeMiniGameHeart = (
  input: MiniGameHeartInput,
  nowMs = Date.now(),
): MiniGameHeartConsumeResult | null => {
  const status = getCurrentMiniGameHeartStatus(input, nowMs);

  if (status.heart < 1) {
    return null;
  }

  const nextHeart = status.heart - 1;
  const shouldKeepRecoveryRemainder =
    !status.isFull && status.recoveryElapsedRemainderMs > 0;
  const nextRecoveryStartedAtMs = shouldKeepRecoveryRemainder
    ? nowMs - status.recoveryElapsedRemainderMs
    : nowMs;

  return {
    heart: nextHeart,
    heartUpdatedAt:
      nextHeart >= status.maxHeart
        ? null
        : new Date(nextRecoveryStartedAtMs).toISOString(),
    maxHeart: status.maxHeart,
  };
};
