import { PLATE_IMAGE_ASSETS } from "@/components/MealPanel/MealMenuData";
import { CHARACTER_IMAGES } from "@/constants/character";
import { useGameStore } from "@/stores/useGameStore";
import {
  preloadBackgroundMusicTracks,
  setBackgroundMusicVolume,
} from "@/utils/backgroundMusic";
import {
  preloadSoundEffects,
  setSoundEffectsVolume,
} from "@/utils/soundEffects";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Image as ExpoImage } from "expo-image";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

const APP_IMAGE_ASSETS = [
  require("../assets/images/main-building.png"),
  require("../assets/images/main-title.png"),
  require("../assets/images/inGameMain.png"),
  require("../assets/images/big-smoke.png"),
  ...Object.values(CHARACTER_IMAGES.grades).flatMap((gradeImages) =>
    Object.values(gradeImages),
  ),
  CHARACTER_IMAGES.graduate,
  ...PLATE_IMAGE_ASSETS,
];

type ExpoNavigationBarModule = {
  setBehaviorAsync: (behavior: "overlay-swipe") => Promise<void>;
  setVisibilityAsync: (visibility: "hidden") => Promise<void>;
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
      try {
        await Promise.all(
          APP_IMAGE_ASSETS.map((source) => ExpoImage.loadAsync(source)),
        );
      } finally {
        if (isMounted) {
          setAssetsLoaded(true);
        }
      }
    };

    void preloadAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const configureAndroidNavigationBar = async () => {
      const navigationBarModule =
        requireOptionalNativeModule<ExpoNavigationBarModule>(
          "ExpoNavigationBar",
        );

      if (!navigationBarModule) {
        console.warn(
          "ExpoNavigationBar is unavailable in this Android build. Rebuild the app to enable hidden navigation mode.",
        );
        return;
      }

      try {
        await navigationBarModule.setVisibilityAsync("hidden");
        await navigationBarModule.setBehaviorAsync("overlay-swipe");
      } catch (error) {
        console.warn("Failed to configure the Android navigation bar.", error);
      }
    };

    void configureAndroidNavigationBar();
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
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="game/index" />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
