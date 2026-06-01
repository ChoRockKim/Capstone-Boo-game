/**
 * @description  인증된 화면이 포커스될 때 서버 유저 수치를 최신화합니다.
 * @depends      stores/useGameStore.ts, utils/syncServerUserStats.ts
 * @used-by      app/game/index.tsx, app/miniGame/index.tsx, app/room/index.tsx, components/MiniGame/MiniGameStartScreen.tsx
 * @side-effects HTTP 요청, Zustand 상태 변경
 */
import { useGameStore } from "@/stores/useGameStore";
import { syncServerUserStats } from "@/utils/syncServerUserStats";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

export const useSyncServerUserStatsOnFocus = () => {
  const accessToken = useGameStore((state) => state.accessToken);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) {
        return undefined;
      }

      void syncServerUserStats(accessToken).catch((error) => {
        console.warn("서버 유저 수치 동기화 실패", error);
      });

      return undefined;
    }, [accessToken]),
  );
};
