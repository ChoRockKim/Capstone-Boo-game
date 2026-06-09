/**
 * @description  서버의 현재 유저/경제 수치를 Zustand 게임 상태에 반영합니다.
 * @depends      stores/useGameStore.ts, utils/serverApi.ts
 * @used-by      app/index.tsx, components/Login/Login.tsx, useHook/useSyncServerUserStatsOnFocus.ts
 * @side-effects HTTP 요청, Zustand 상태 변경
 */
import { useGameStore } from "@/stores/useGameStore";
import { getCurrentMiniGameHeartStatus } from "@/utils/miniGameHeart";
import {
  applyMyCharacterMealPenalty,
  getAppBootstrap,
  getCurrentUserPreferences,
  getCurrentUser,
  getEconomyStatus,
  getMyCharacterMealHealth,
  listMyAchievementProgress,
} from "@/utils/serverApi";
import { mapServerRoomAndShopItemsToLocalRoomState } from "@/utils/serverRoomAdapter";
import { syncServerCharacter } from "@/utils/syncServerCharacter";
import { syncServerRoomState } from "@/utils/syncServerRoomState";

const FALLBACK_MAX_HEART = 5;

export const syncServerUserStats = async (accessToken?: string) => {
  const currentState = useGameStore.getState();
  const currentBooName = currentState.booName;
  const appBootstrap = accessToken
    ? await getAppBootstrap(accessToken).catch((error) => {
        console.warn("서버 앱 부트스트랩 동기화 실패", error);

        return null;
      })
    : null;
  const [
    currentUser,
    economyStatus,
    userPreferences,
    characterMealHealth,
    serverAchievementProgress,
  ] = await Promise.all([
    appBootstrap
      ? Promise.resolve(appBootstrap.user)
      : getCurrentUser(accessToken),
    appBootstrap
      ? Promise.resolve(appBootstrap.economy)
      : getEconomyStatus(accessToken).catch(() => null),
    getCurrentUserPreferences(accessToken).catch((error) => {
      console.warn("서버 사용자 설정 동기화 실패", error);

      return null;
    }),
    getMyCharacterMealHealth(accessToken).catch((error) => {
      console.warn("서버 캐릭터 끼니 상태 동기화 실패", error);

      return null;
    }),
    listMyAchievementProgress(accessToken).catch((error) => {
      console.warn("서버 업적 진행도 동기화 실패", error);

      return null;
    }),
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
  const serverHeartUpdatedAt =
    economyStatus?.heart_updated_at ?? currentUser.heart_updated_at;
  const serverHeartUpdatedAtMs = serverHeartUpdatedAt
    ? new Date(serverHeartUpdatedAt).getTime()
    : 0;
  const shouldPreserveLocalHeartSpend =
    currentHeartStatus.heart < serverHeart &&
    currentHeartUpdatedAtMs > serverHeartUpdatedAtMs;
  const characterMealPenaltyResult =
    characterMealHealth?.hungry_state === true
      ? await applyMyCharacterMealPenalty(accessToken).catch((error) => {
          console.warn("서버 캐릭터 끼니 패널티 적용 실패", error);

          return null;
        })
      : null;
  const serverTotalXp =
    characterMealPenaltyResult?.xp_point ?? currentUser.xp_point;

  useGameStore.getState().setGameState(
    {
      ...(characterMealHealth
        ? {
            appliedSkippedMealPenaltyCount:
              characterMealHealth.applied_penalty_count,
            characterState: characterMealHealth.hungry_state
              ? ("hungry" as const)
              : currentState.characterState === "hungry"
                ? ("basic1" as const)
                : currentState.characterState,
            skippedMealCount: characterMealHealth.skipped_meal_count,
          }
        : {}),
      coin: economyStatus?.coin ?? currentUser.coin,
      heart: shouldPreserveLocalHeartSpend
        ? currentState.heart
        : serverHeart,
      heartUpdatedAt: shouldPreserveLocalHeartSpend
        ? currentState.heartUpdatedAt
        : serverHeartUpdatedAt ?? null,
      maxHeart,
      ...(typeof userPreferences?.bgm_volume === "number"
        ? { bgmVolume: userPreferences.bgm_volume }
        : {}),
      ...(typeof userPreferences?.has_seen_game_tutorial === "boolean"
        ? { hasSeenGameTutorial: userPreferences.has_seen_game_tutorial }
        : typeof appBootstrap?.tutorial_flags.has_seen_game_tutorial ===
            "boolean"
          ? {
              hasSeenGameTutorial:
                appBootstrap.tutorial_flags.has_seen_game_tutorial,
            }
        : {}),
      ...(typeof userPreferences?.has_seen_minigame_tutorial === "boolean"
        ? {
            hasSeenMiniGameTutorial:
              userPreferences.has_seen_minigame_tutorial,
          }
        : typeof appBootstrap?.tutorial_flags
              .has_seen_minigame_tutorial === "boolean"
          ? {
              hasSeenMiniGameTutorial:
                appBootstrap.tutorial_flags.has_seen_minigame_tutorial,
            }
        : {}),
      ...(typeof userPreferences?.master_volume === "number"
        ? { masterVolume: userPreferences.master_volume }
        : {}),
      ...(userPreferences?.meal_day_mode === "auto" ||
      userPreferences?.meal_day_mode === "weekday" ||
      userPreferences?.meal_day_mode === "weekend"
        ? { mealDayMode: userPreferences.meal_day_mode }
        : {}),
      ...(typeof userPreferences?.meal_restriction_enabled === "boolean"
        ? { mealRestrictionEnabled: userPreferences.meal_restriction_enabled }
        : {}),
      ...(typeof userPreferences?.quiz_daily_limit_enabled === "boolean"
        ? { quizDailyLimitEnabled: userPreferences.quiz_daily_limit_enabled }
        : {}),
      ...(typeof userPreferences?.sfx_volume === "number"
        ? { sfxVolume: userPreferences.sfx_volume }
        : {}),
      studentId: currentUser.student_id,
      totalXp: serverTotalXp,
      userCreatedAt: currentUser.created_at ?? currentState.userCreatedAt,
      userEmail: currentUser.email,
      userEmailVerified: currentUser.email_verified,
      userId: currentUser.user_id,
      userImage: currentUser.image ?? null,
      userName: currentUser.name,
      userNickname: currentUser.nickname,
    },
    { resolveAchievements: false },
  );
  useGameStore
    .getState()
    .syncServerAchievementProgress(serverAchievementProgress);
  useGameStore.getState().applyServerUnlockedAchievements(
    characterMealPenaltyResult?.unlocked_achievements,
    characterMealPenaltyResult
      ? {
          totalXp: characterMealPenaltyResult.xp_point,
        }
      : undefined,
  );

  const syncedRoomStatePromise =
    appBootstrap?.room || appBootstrap?.shop_items
      ? Promise.resolve(
          mapServerRoomAndShopItemsToLocalRoomState({
            roomView: appBootstrap.room,
            shopItems: appBootstrap.shop_items,
          }),
        ).then((syncedRoomState) => {
          useGameStore.getState().setGameState(syncedRoomState);

          return syncedRoomState;
        })
      : syncServerRoomState(accessToken).catch((error) => {
          console.warn("서버 마이룸 상태 동기화 실패", error);

          return null;
        });

  const [syncedCharacter, syncedRoomState] = await Promise.all([
    syncServerCharacter({
      accessToken,
      fallbackName: currentBooName || currentUser.nickname,
      totalXp: serverTotalXp,
      userId: currentUser.user_id,
    }).catch((error) => {
      console.warn("서버 캐릭터 동기화 실패", error);

      return null;
    }),
    syncedRoomStatePromise,
  ]);

  return {
    currentUser,
    economyStatus,
    syncedCharacter,
    syncedRoomState,
  };
};
