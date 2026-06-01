import {
  preloadImageAssets,
  type PreloadableImageAsset,
} from "@/utils/preloadImageAssets";

export const TUTORIAL_IMAGE_ASSETS = [
  require("@/assets/tutorials/tutorial2.png"),
  require("@/assets/tutorials/tutorial3.png"),
  require("@/assets/tutorials/tutorial4.png"),
  require("@/assets/tutorials/tutorial5.png"),
  require("@/assets/tutorials/tutorial6.png"),
  require("@/assets/tutorials/tutorial7.png"),
  require("@/assets/tutorials/tutorial8.png"),
] as PreloadableImageAsset[];

let hasPreloadedTutorialImageAssets = false;
let tutorialImageAssetsPreloadPromise: Promise<void> | null = null;

export const preloadTutorialImageAssets = () => {
  if (hasPreloadedTutorialImageAssets) {
    return Promise.resolve();
  }

  if (!tutorialImageAssetsPreloadPromise) {
    tutorialImageAssetsPreloadPromise = preloadImageAssets(
      TUTORIAL_IMAGE_ASSETS,
    )
      .then(() => {
        hasPreloadedTutorialImageAssets = true;
      })
      .catch((error) => {
        tutorialImageAssetsPreloadPromise = null;
        throw error;
      });
  }

  return tutorialImageAssetsPreloadPromise;
};
