/**
 * @description  도서관 미니게임 전공책 받기 시작 화면 라우트입니다.
 * @depends      components/MiniGame/MiniGameStartScreen.tsx
 * @used-by      expo-router/entry, app/miniGame/index.tsx
 * @side-effects MiniGameStartScreen에서 BGM/TopAlert/랭킹 상태를 처리
 */
import MiniGameStartScreen from "@/components/MiniGame/MiniGameStartScreen";

export default function CatchTheMajorScreen() {
  return <MiniGameStartScreen miniGameId="catchTheMajor" />;
}
