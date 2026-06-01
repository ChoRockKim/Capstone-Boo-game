/**
 * @description  서버 캐릭터 정보를 로컬 부 이름/서버 캐릭터 ID와 동기화합니다.
 * @depends      stores/useGameStore.ts, utils/serverApi.ts, utils/xpProgress.ts
 * @used-by      utils/syncServerUserStats.ts
 * @side-effects HTTP 요청, Zustand 상태 변경
 */
import { useGameStore } from "@/stores/useGameStore";
import {
  BooCharacter,
  createCharacter,
  listCharacters,
  updateCharacter,
} from "@/utils/serverApi";
import { getXpProgressInfo } from "@/utils/xpProgress";

const DEFAULT_CHARACTER_NAME = "부";

const normalizeCharacterName = (name: string | null | undefined) => {
  const trimmedName = name?.trim();

  return trimmedName && trimmedName.length > 0
    ? trimmedName
    : DEFAULT_CHARACTER_NAME;
};

const findSyncedCharacter = (
  characters: BooCharacter[],
  userId: number,
  serverCharacterId: number | null,
) =>
  characters.find(
    (character) =>
      character.user_id === userId &&
      serverCharacterId !== null &&
      character.character_id === serverCharacterId,
  ) ?? characters.find((character) => character.user_id === userId);

type SyncServerCharacterParams = {
  fallbackName: string;
  totalXp: number;
  userId: number;
};

export const syncServerCharacter = async ({
  fallbackName,
  totalXp,
  userId,
}: SyncServerCharacterParams) => {
  const stage = getXpProgressInfo(totalXp).grade;
  const serverCharacterId = useGameStore.getState().serverCharacterId;
  const characters = await listCharacters();
  let character =
    findSyncedCharacter(characters, userId, serverCharacterId) ??
    (await createCharacter({
      character_name: normalizeCharacterName(fallbackName),
      stage,
      user_id: userId,
    }));

  if (character.stage !== stage) {
    character = await updateCharacter(character.character_id, {
      stage,
    }).catch((error) => {
      console.warn("서버 캐릭터 성장 단계 동기화 실패", error);

      return character;
    });
  }

  useGameStore.getState().setGameState({
    booName: normalizeCharacterName(character.character_name),
    serverCharacterId: character.character_id,
  });

  return character;
};
