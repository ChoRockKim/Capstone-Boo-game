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

export const MINI_GAME_TUTORIAL_IMAGE_ASSETS = [
  require("@/assets/miniGame/tutorial/campus-tutorial-2.png"),
  require("@/assets/miniGame/tutorial/campus-tutorial-3.png"),
  require("@/assets/miniGame/tutorial/campus-tutorial-4.png"),
  require("@/assets/miniGame/tutorial/campus-tutorial-5.png"),
  require("@/assets/miniGame/tutorial/campus-tutorial-6.png"),
  require("@/assets/miniGame/tutorial/campus-tutorial-7.png"),
] as PreloadableImageAsset[];

let hasPreloadedTutorialImageAssets = false;
let tutorialImageAssetsPreloadPromise: Promise<void> | null = null;
let hasPreloadedMiniGameTutorialImageAssets = false;
let miniGameTutorialImageAssetsPreloadPromise: Promise<void> | null = null;

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

export const preloadMiniGameTutorialImageAssets = () => {
  if (hasPreloadedMiniGameTutorialImageAssets) {
    return Promise.resolve();
  }

  if (!miniGameTutorialImageAssetsPreloadPromise) {
    miniGameTutorialImageAssetsPreloadPromise = preloadImageAssets(
      MINI_GAME_TUTORIAL_IMAGE_ASSETS,
    )
      .then(() => {
        hasPreloadedMiniGameTutorialImageAssets = true;
      })
      .catch((error) => {
        miniGameTutorialImageAssetsPreloadPromise = null;
        throw error;
      });
  }

  return miniGameTutorialImageAssetsPreloadPromise;
};
