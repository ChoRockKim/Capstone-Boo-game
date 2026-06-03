/**
 * @description  서버의 현재 유저/경제 수치를 Zustand 게임 상태에 반영합니다.
 * @depends      stores/useGameStore.ts, utils/serverApi.ts
 * @used-by      app/index.tsx, components/Login/Login.tsx, useHook/useSyncServerUserStatsOnFocus.ts
 * @side-effects HTTP 요청, Zustand 상태 변경
 */
import { getAchievementRewardTotals } from "@/constants/achievements";
import { useGameStore } from "@/stores/useGameStore";
import { getCurrentMiniGameHeartStatus } from "@/utils/miniGameHeart";
import { getCurrentUser, getEconomyStatus } from "@/utils/serverApi";
import { syncServerCharacter } from "@/utils/syncServerCharacter";
import { syncServerRoomState } from "@/utils/syncServerRoomState";

const FALLBACK_MAX_HEART = 5;

export const syncServerUserStats = async (accessToken?: string) => {
  const currentState = useGameStore.getState();
  const currentBooName = currentState.booName;
  const achievementRewardTotals = getAchievementRewardTotals(
    currentState.completedAchievementKeys,
  );
  const [currentUser, economyStatus] = await Promise.all([
    getCurrentUser(accessToken),
    getEconomyStatus(accessToken).catch(() => null),
  ]);

  const serverHeart = economyStatus?.heart ?? currentUser.heart;
  const maxHeart = Math.max(
    economyStatus?.max_heart ?? FALLBACK_MAX_HEART,
    serverHeart,
  );
  const currentHeartStatus = getCurrentMiniGameHeartStatus({
    heart: currentState.heart,
    heartUpdatedAt: currentState.heartUpdatedAt,
    maxHeart: currentState.maxHeart,
  });
  const currentHeartUpdatedAtMs = currentState.heartUpdatedAt
    ? new Date(currentState.heartUpdatedAt).getTime()
    : 0;
  const serverHeartUpdatedAtMs = currentUser.heart_updated_at
    ? new Date(currentUser.heart_updated_at).getTime()
    : 0;
  const shouldPreserveLocalHeartSpend =
    currentHeartStatus.heart < serverHeart &&
    currentHeartUpdatedAtMs > serverHeartUpdatedAtMs;

  useGameStore.getState().setGameState(
    {
      coin:
        (economyStatus?.coin ?? currentUser.coin) +
        achievementRewardTotals.coin,
      heart: shouldPreserveLocalHeartSpend
        ? currentState.heart
        : serverHeart,
      heartUpdatedAt: shouldPreserveLocalHeartSpend
        ? currentState.heartUpdatedAt
        : currentUser.heart_updated_at ?? null,
      maxHeart,
      studentId: currentUser.student_id,
      totalXp: currentUser.xp_point + achievementRewardTotals.xp,
      userEmail: currentUser.email,
      userEmailVerified: currentUser.email_verified,
      userId: currentUser.user_id,
      userImage: currentUser.image ?? null,
      userName: currentUser.name,
      userNickname: currentUser.nickname,
    },
    { resolveAchievements: false },
  );

  const [syncedCharacter, syncedRoomState] = await Promise.all([
    syncServerCharacter({
      fallbackName: currentBooName || currentUser.nickname,
      totalXp: currentUser.xp_point,
      userId: currentUser.user_id,
    }).catch((error) => {
      console.warn("서버 캐릭터 동기화 실패", error);

      return null;
    }),
    syncServerRoomState(accessToken).catch((error) => {
      console.warn("서버 마이룸 상태 동기화 실패", error);

      return null;
    }),
  ]);

  return {
    currentUser,
    economyStatus,
    syncedCharacter,
    syncedRoomState,
  };
};
