/**
 * @description  로컬 이미지 에셋을 expo-asset과 expo-image 캐시에 함께 올리는 공통 유틸입니다.
 * @depends      expo-asset, expo-image
 * @used-by      app/_layout.tsx, components/LoadingOverlay/LoadingOverlayAssets.ts
 * @side-effects 이미지 에셋/메모리-디스크 캐시 preload
 */
import { Asset } from "expo-asset";
import { Image as ExpoImage } from "expo-image";

export type PreloadableImageAsset = number | string;

export const preloadImageAssets = async (imageAssets: PreloadableImageAsset[]) => {
  await Promise.all(imageAssets.map((source) => Asset.loadAsync(source)));
  await Promise.all(imageAssets.map((source) => ExpoImage.loadAsync(source)));
};
