/**
 * @description  서버의 현재 유저/경제 수치를 Zustand 게임 상태에 반영합니다.
 * @depends      stores/useGameStore.ts, utils/serverApi.ts
 * @used-by      app/index.tsx, components/Login/Login.tsx, useHook/useSyncServerUserStatsOnFocus.ts
 * @side-effects HTTP 요청, Zustand 상태 변경
 */
import { useGameStore } from "@/stores/useGameStore";
import { getCurrentUser, getEconomyStatus } from "@/utils/serverApi";
import { syncServerCharacter } from "@/utils/syncServerCharacter";

const FALLBACK_MAX_HEART = 5;

export const syncServerUserStats = async (accessToken?: string) => {
  const currentBooName = useGameStore.getState().booName;
  const [currentUser, economyStatus] = await Promise.all([
    getCurrentUser(accessToken),
    getEconomyStatus(accessToken).catch(() => null),
  ]);

  const heart = economyStatus?.heart ?? currentUser.heart;
  const maxHeart = Math.max(
    economyStatus?.max_heart ?? FALLBACK_MAX_HEART,
    heart,
  );

  useGameStore.getState().setGameState({
    coin: economyStatus?.coin ?? currentUser.coin,
    heart,
    heartUpdatedAt: currentUser.heart_updated_at ?? null,
    maxHeart,
    studentId: currentUser.student_id,
    totalXp: currentUser.xp_point,
    userEmail: currentUser.email,
    userEmailVerified: currentUser.email_verified,
    userId: currentUser.user_id,
    userImage: currentUser.image ?? null,
    userName: currentUser.name,
    userNickname: currentUser.nickname,
  });

  const syncedCharacter = await syncServerCharacter({
    fallbackName: currentBooName || currentUser.nickname,
    totalXp: currentUser.xp_point,
    userId: currentUser.user_id,
  }).catch((error) => {
    console.warn("서버 캐릭터 동기화 실패", error);

    return null;
  });

  return {
    currentUser,
    economyStatus,
    syncedCharacter,
  };
};
