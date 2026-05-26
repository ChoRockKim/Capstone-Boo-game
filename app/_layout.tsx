/**
 * @description  앱 공통 초기화, Provider, Splash 제어, 폰트/이미지/사운드 preload를 담당합니다.
 * @depends      stores/useGameStore.ts, utils/backgroundMusic.ts, utils/soundEffects.ts
 * @used-by      expo-router/entry
 * @side-effects SplashScreen 제어, 이미지/폰트/오디오 preload, Android navigation bar 설정
 */
import { preloadLoadingOverlayAssets } from "@/components/LoadingOverlay/LoadingOverlayAssets";
import { useGameStore } from "@/stores/useGameStore";
import {
  preloadBackgroundMusicTracks,
  setBackgroundMusicVolume,
} from "@/utils/backgroundMusic";
import { preloadImageAssets } from "@/utils/preloadImageAssets";
import {
  preloadSoundEffects,
  setSoundEffectsVolume,
} from "@/utils/soundEffects";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { NavigationBar } from "expo-navigation-bar";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const LOGIN_IMAGE_ASSETS = [
  require("../assets/images/main-building.png"),
  require("../assets/images/main-title.png"),
];

const preloadRequiredImageAssets = async () => {
  await Promise.all([
    preloadImageAssets(LOGIN_IMAGE_ASSETS),
    preloadLoadingOverlayAssets(),
  ]);
};


export default function RootLayout() {
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const masterVolume = useGameStore((state) => state.masterVolume);
  const bgmVolume = useGameStore((state) => state.bgmVolume);
  const sfxVolume = useGameStore((state) => state.sfxVolume);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 1000 * 60 * 10,
          },
        },
      }),
  );
  const [loaded] = useFonts({
    NeoDunggeunmo: require("../assets/fonts/NeoDunggeunmo.ttf"),
  });

  useEffect(() => {
    let isMounted = true;

    const preloadAssets = async () => {
      await preloadRequiredImageAssets();

      if (isMounted) {
        setAssetsLoaded(true);
      }
    };

    void preloadAssets();

    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    if (loaded && assetsLoaded) {
      preloadBackgroundMusicTracks();
      preloadSoundEffects();
      SplashScreen.hideAsync();
    }
  }, [assetsLoaded, loaded]);

  useEffect(() => {
    setBackgroundMusicVolume(masterVolume * bgmVolume);
  }, [bgmVolume, masterVolume]);

  useEffect(() => {
    setSoundEffectsVolume(masterVolume * sfxVolume);
  }, [masterVolume, sfxVolume]);

  if (!loaded || !assetsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationBar hidden />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="game/index" />
          <Stack.Screen name="room/index" />
          <Stack.Screen name="room/[friendId]" />
          <Stack.Screen name="miniGame/index" />
          <Stack.Screen name="miniGame/catchTheMajor" />
          <Stack.Screen
            name="miniGame/catchTheMajorPlay"
            options={{ gestureEnabled: false }}
          />
          <Stack.Screen name="miniGame/catchBoo" />
          <Stack.Screen name="miniGame/freeThrow" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
