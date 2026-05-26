/**
 * @description  LoadingOverlay가 사용하는 이미지 source와 preload 함수를 한곳에서 관리합니다.
 * @depends      assets/images/egg-closed.png, assets/images/egg-opened.png, assets/images/inGameMain.png, utils/preloadImageAssets.ts
 * @used-by      app/_layout.tsx, app/game/index.tsx, components/LoadingOverlay/LoadingOverlay.tsx
 * @side-effects preloadLoadingOverlayAssets 호출 시 로딩 오버레이 이미지 캐시 preload
 */
import {
  preloadImageAssets,
  type PreloadableImageAsset,
} from "@/utils/preloadImageAssets";

export const LOADING_OVERLAY_BACKGROUND_IMAGE = require("@/assets/images/inGameMain.png");
export const LOADING_OVERLAY_EGG_CLOSED_IMAGE = require("@/assets/images/egg-closed.png");
export const LOADING_OVERLAY_EGG_OPENED_IMAGE = require("@/assets/images/egg-opened.png");

export const LOADING_OVERLAY_IMAGE_ASSETS = [
  LOADING_OVERLAY_BACKGROUND_IMAGE,
  LOADING_OVERLAY_EGG_CLOSED_IMAGE,
  LOADING_OVERLAY_EGG_OPENED_IMAGE,
] as PreloadableImageAsset[];

let hasPreloadedLoadingOverlayAssets = false;
let loadingOverlayAssetsPreloadPromise: Promise<void> | null = null;

export const preloadLoadingOverlayAssets = () => {
  if (hasPreloadedLoadingOverlayAssets) {
    return Promise.resolve();
  }

  if (!loadingOverlayAssetsPreloadPromise) {
    loadingOverlayAssetsPreloadPromise = preloadImageAssets(
      LOADING_OVERLAY_IMAGE_ASSETS,
    )
      .then(() => {
        hasPreloadedLoadingOverlayAssets = true;
      })
      .catch((error) => {
        loadingOverlayAssetsPreloadPromise = null;
        throw error;
      });
  }

  return loadingOverlayAssetsPreloadPromise;
};
