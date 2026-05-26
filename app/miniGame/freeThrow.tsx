/**
 * @description  오바마홀 미니게임 자유투 넣기 시작 화면 라우트입니다.
 * @depends      components/MiniGame/MiniGameStartScreen.tsx
 * @used-by      expo-router/entry, app/miniGame/index.tsx
 * @side-effects MiniGameStartScreen에서 BGM/TopAlert/랭킹 상태를 처리
 */
import MiniGameStartScreen from "@/components/MiniGame/MiniGameStartScreen";

export default function FreeThrowScreen() {
  return <MiniGameStartScreen miniGameId="freeThrow" />;
}
