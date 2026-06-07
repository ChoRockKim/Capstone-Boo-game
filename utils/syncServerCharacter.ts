/**
 * @description  서버 캐릭터 정보를 로컬 부 이름/서버 캐릭터 ID와 동기화합니다.
 * @depends      stores/useGameStore.ts, utils/serverApi.ts, utils/xpProgress.ts
 * @used-by      utils/syncServerUserStats.ts
 * @side-effects HTTP 요청, Zustand 상태 변경
 */
import type { CharacterState } from "@/constants/character";
import { useGameStore } from "@/stores/useGameStore";
import {
  BooCharacter,
  CharacterMeOut,
  createCharacter,
  getCharacter,
  getMyCharacter,
  listCharacters,
  updateCharacter,
  updateMyCharacter,
} from "@/utils/serverApi";
import { getXpProgressInfo } from "@/utils/xpProgress";

const DEFAULT_CHARACTER_NAME = "부";
const SERVER_CHARACTER_STATES = new Set<CharacterState>([
  "basic1",
  "basic2",
  "happy1",
  "happy2",
  "hungry",
  "eating",
  "talking",
]);

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

const mapMyCharacterToLegacyCharacter = (
  character: CharacterMeOut,
  userId: number,
): BooCharacter => ({
  character_id: character.character_id,
  character_name: character.character_name,
  stage: character.stage,
  state: character.state,
  user_id: userId,
});

const normalizeServerCharacterState = (state: string | null | undefined) =>
  SERVER_CHARACTER_STATES.has(state as CharacterState)
    ? (state as CharacterState)
    : null;

const syncMyCharacterToLocalState = (myCharacter: CharacterMeOut) => {
  const normalizedName = normalizeCharacterName(myCharacter.character_name);
  const normalizedState = normalizeServerCharacterState(myCharacter.state);
  const currentState = useGameStore.getState();

  currentState.setGameState(
    {
      booName: normalizedName,
      serverCharacterId: myCharacter.character_id,
      ...(normalizedState && currentState.characterState !== "hungry"
        ? { characterState: normalizedState }
        : {}),
      ...(Number.isFinite(myCharacter.xp_point)
        ? { totalXp: Math.max(myCharacter.xp_point, 0) }
        : {}),
    },
    { resolveAchievements: false },
  );

  return normalizedName;
};

type SyncServerCharacterParams = {
  accessToken?: string;
  fallbackName: string;
  totalXp: number;
  userId: number;
};

export const syncServerCharacter = async ({
  accessToken,
  fallbackName,
  totalXp,
  userId,
}: SyncServerCharacterParams) => {
  const stage = getXpProgressInfo(totalXp).grade;
  const serverCharacterId = useGameStore.getState().serverCharacterId;

  if (accessToken) {
    const myCharacter = await getMyCharacter(accessToken).catch((error) => {
      console.warn("서버 내 캐릭터 조회 실패", error);

      return null;
    });

    if (myCharacter) {
      const normalizedName = syncMyCharacterToLocalState(myCharacter);

      if (normalizedName !== myCharacter.character_name) {
        void updateMyCharacter(
          { character_name: normalizedName },
          accessToken,
        ).catch((error) => {
          console.warn("서버 캐릭터 이름 정규화 실패", error);
        });
      }

      return mapMyCharacterToLegacyCharacter(myCharacter, userId);
    }
  }

  let character =
    serverCharacterId !== null
      ? await getCharacter(serverCharacterId).catch(() => null)
      : null;

  if (character?.user_id !== userId) {
    const characters = await listCharacters();
    character =
      findSyncedCharacter(characters, userId, serverCharacterId) ?? null;
  }

  if (!character) {
    character = await createCharacter({
      character_name: normalizeCharacterName(fallbackName),
      stage,
      user_id: userId,
    });
  }

  let syncedCharacter = character;

  if (syncedCharacter.stage !== stage) {
    syncedCharacter = await updateCharacter(syncedCharacter.character_id, {
      stage,
    }).catch((error) => {
      console.warn("서버 캐릭터 성장 단계 동기화 실패", error);

      return syncedCharacter;
    });
  }

  const syncedCharacterState = normalizeServerCharacterState(
    syncedCharacter.state,
  );
  const currentState = useGameStore.getState();

  useGameStore.getState().setGameState(
    {
      booName: normalizeCharacterName(syncedCharacter.character_name),
      serverCharacterId: syncedCharacter.character_id,
      ...(syncedCharacterState && currentState.characterState !== "hungry"
        ? {
            characterState: syncedCharacterState,
          }
        : {}),
    },
    { resolveAchievements: false },
  );

  return syncedCharacter;
};
