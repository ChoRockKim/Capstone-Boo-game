/**
 * @description  로그인 또는 게스트 세션이 필요한 화면의 직접 진입을 제어합니다.
 * @depends      stores/useGameStore.ts, expo-router
 * @used-by      app/game/index.tsx, app/miniGame/*, app/room/*
 * @side-effects 세션이 없으면 루트 화면으로 이동
 */
import { useGameStore } from "@/stores/useGameStore";
import { getCurrentMiniGameHeartStatus } from "@/utils/miniGameHeart";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

type UseRequirePlayableSessionOptions = {
  insufficientHeartRoute?: Parameters<typeof router.replace>[0];
  requireHeart?: boolean;
};

export const useRequirePlayableSession = (
  options: UseRequirePlayableSessionOptions = {},
) => {
  const [hasHydratedStore, setHasHydratedStore] = useState(() =>
    useGameStore.persist.hasHydrated(),
  );
  const accessToken = useGameStore((state) => state.accessToken);
  const heart = useGameStore((state) => state.heart);
  const heartUpdatedAt = useGameStore((state) => state.heartUpdatedAt);
  const isGuestMode = useGameStore((state) => state.isGuestMode);
  const maxHeart = useGameStore((state) => state.maxHeart);
  const hasPlayableSession = hasHydratedStore && (!!accessToken || isGuestMode);
  const heartStatus = getCurrentMiniGameHeartStatus({
    heart,
    heartUpdatedAt,
    maxHeart,
  });
  const hasPlayableHeart = !options.requireHeart || heartStatus.heart >= 1;

  useEffect(() => {
    if (hasHydratedStore) {
      return undefined;
    }

    const unsubscribe = useGameStore.persist.onFinishHydration(() => {
      setHasHydratedStore(true);
    });

    return unsubscribe;
  }, [hasHydratedStore]);

  useFocusEffect(
    useCallback(() => {
      if (!hasHydratedStore) {
        return undefined;
      }

      if (!accessToken && !isGuestMode) {
        router.replace("/");
        return undefined;
      }

      if (options.requireHeart && heartStatus.heart < 1) {
        router.replace(options.insufficientHeartRoute ?? "/miniGame");
      }

      return undefined;
    }, [
      accessToken,
      hasHydratedStore,
      heartStatus.heart,
      isGuestMode,
      options.insufficientHeartRoute,
      options.requireHeart,
    ]),
  );

  return hasPlayableSession && hasPlayableHeart;
};
