/**
 * @description  누적 XP를 현재 학년, 학년 내 XP, 다음 단계 정보로 계산합니다.
 * @depends      constants/character.ts
 * @used-by      stores/useGameStore.ts, app/game/index.tsx, app/room/index.tsx, components/DeveloperPanel/DeveloperPanel.tsx
 * @side-effects 없음
 */
import { CharacterGrade, CharacterLifeStage } from "@/constants/character";

const GRADE_XP_REQUIREMENTS: Record<CharacterGrade, number> = {
  1: 1500,
  2: 2000,
  3: 2500,
  4: 3000,
};

const GRADE_TOTAL_XP_START: Record<CharacterGrade, number> = {
  1: 0,
  2: GRADE_XP_REQUIREMENTS[1],
  3: GRADE_XP_REQUIREMENTS[1] + GRADE_XP_REQUIREMENTS[2],
  4: GRADE_XP_REQUIREMENTS[1] + GRADE_XP_REQUIREMENTS[2] + GRADE_XP_REQUIREMENTS[3],
};

export const TOTAL_XP_FOR_GRADUATION =
  GRADE_XP_REQUIREMENTS[1] +
  GRADE_XP_REQUIREMENTS[2] +
  GRADE_XP_REQUIREMENTS[3] +
  GRADE_XP_REQUIREMENTS[4];

export interface XpProgressInfo {
  currentXpInGrade: number;
  grade: CharacterGrade;
  hasReachedGraduation: boolean;
  lifeStage: CharacterLifeStage;
  nextLifeStage: CharacterLifeStage | null;
  progressMaxXp: number;
  totalXp: number;
}

export const getTotalXpForGrade = (grade: CharacterGrade) =>
  GRADE_TOTAL_XP_START[grade];

export const getRequiredXpForGrade = (grade: CharacterGrade) =>
  GRADE_XP_REQUIREMENTS[grade];

export const getXpProgressInfo = (totalXp: number): XpProgressInfo => {
  const safeTotalXp = Math.max(Math.floor(totalXp), 0);

  if (safeTotalXp >= TOTAL_XP_FOR_GRADUATION) {
    return {
      totalXp: safeTotalXp,
      grade: 4,
      currentXpInGrade: GRADE_XP_REQUIREMENTS[4],
      progressMaxXp: GRADE_XP_REQUIREMENTS[4],
      hasReachedGraduation: true,
      lifeStage: "graduate",
      nextLifeStage: null,
    };
  }

  if (safeTotalXp >= GRADE_TOTAL_XP_START[4]) {
    return {
      totalXp: safeTotalXp,
      grade: 4,
      currentXpInGrade: safeTotalXp - GRADE_TOTAL_XP_START[4],
      progressMaxXp: GRADE_XP_REQUIREMENTS[4],
      hasReachedGraduation: false,
      lifeStage: 4,
      nextLifeStage: "graduate",
    };
  }

  if (safeTotalXp >= GRADE_TOTAL_XP_START[3]) {
    return {
      totalXp: safeTotalXp,
      grade: 3,
      currentXpInGrade: safeTotalXp - GRADE_TOTAL_XP_START[3],
      progressMaxXp: GRADE_XP_REQUIREMENTS[3],
      hasReachedGraduation: false,
      lifeStage: 3,
      nextLifeStage: 4,
    };
  }

  if (safeTotalXp >= GRADE_TOTAL_XP_START[2]) {
    return {
      totalXp: safeTotalXp,
      grade: 2,
      currentXpInGrade: safeTotalXp - GRADE_TOTAL_XP_START[2],
      progressMaxXp: GRADE_XP_REQUIREMENTS[2],
      hasReachedGraduation: false,
      lifeStage: 2,
      nextLifeStage: 3,
    };
  }

  return {
    totalXp: safeTotalXp,
    grade: 1,
    currentXpInGrade: safeTotalXp,
    progressMaxXp: GRADE_XP_REQUIREMENTS[1],
    hasReachedGraduation: false,
    lifeStage: 1,
    nextLifeStage: 2,
  };
};
