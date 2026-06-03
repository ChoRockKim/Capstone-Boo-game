/**
 * @description  업적 정의, 조건 타입, 보상 표시 문구를 관리합니다.
 * @depends      없음
 * @used-by      stores/useGameStore.ts, app/_layout.tsx
 * @side-effects 없음
 */

export type AchievementConditionType =
  | "achievement_completed_count"
  | "campus_first_visit"
  | "feed_count"
  | "first_login"
  | "friend_count"
  | "minigame_play_count"
  | "quiz_correct_count"
  | "room_first_enter"
  | "room_item_equip_count"
  | "total_xp";

export type AchievementSkinKey = "skin_creation" | "skin_peace" | "skin_truth";

export type AchievementReward = {
  coin?: number;
  skinKey?: AchievementSkinKey;
  xp?: number;
};

export type AchievementDefinition = {
  conditionType: AchievementConditionType;
  key: string;
  reward: AchievementReward;
  sortOrder: number;
  targetValue: number;
  title: string;
};

export type UnlockedAchievement = {
  key: string;
  reward: AchievementReward;
  title: string;
  unlockedAt: string;
};

export const ACHIEVEMENT_DEFINITIONS = [
  {
    conditionType: "first_login",
    key: "first_login",
    reward: { coin: 50 },
    sortOrder: 1,
    targetValue: 1,
    title: "최초 로그인",
  },
  {
    conditionType: "feed_count",
    key: "feed_1",
    reward: { coin: 100 },
    sortOrder: 2,
    targetValue: 1,
    title: "학식 1회 먹이기",
  },
  {
    conditionType: "quiz_correct_count",
    key: "quiz_correct_1",
    reward: { coin: 100 },
    sortOrder: 3,
    targetValue: 1,
    title: "퀴즈 1회 정답",
  },
  {
    conditionType: "room_first_enter",
    key: "room_first_enter",
    reward: { xp: 10 },
    sortOrder: 4,
    targetValue: 1,
    title: "마이룸 최초 진입",
  },
  {
    conditionType: "campus_first_visit",
    key: "campus_first_visit",
    reward: { coin: 150 },
    sortOrder: 5,
    targetValue: 1,
    title: "캠퍼스 최초 방문",
  },
  {
    conditionType: "friend_count",
    key: "friend_1",
    reward: { coin: 150 },
    sortOrder: 6,
    targetValue: 1,
    title: "친구 1명 추가",
  },
  {
    conditionType: "quiz_correct_count",
    key: "quiz_correct_5",
    reward: { coin: 200 },
    sortOrder: 7,
    targetValue: 5,
    title: "퀴즈 누적 5회 정답",
  },
  {
    conditionType: "feed_count",
    key: "feed_5",
    reward: { coin: 200 },
    sortOrder: 8,
    targetValue: 5,
    title: "학식 누적 5회 먹이기",
  },
  {
    conditionType: "achievement_completed_count",
    key: "achievement_10",
    reward: { xp: 20 },
    sortOrder: 9,
    targetValue: 10,
    title: "업적 10회 달성",
  },
  {
    conditionType: "quiz_correct_count",
    key: "quiz_correct_15",
    reward: { skinKey: "skin_truth" },
    sortOrder: 10,
    targetValue: 15,
    title: "퀴즈 누적 15회 정답",
  },
  {
    conditionType: "feed_count",
    key: "feed_15",
    reward: { coin: 300 },
    sortOrder: 11,
    targetValue: 15,
    title: "학식 누적 15회 먹이기",
  },
  {
    conditionType: "friend_count",
    key: "friend_5",
    reward: { coin: 300 },
    sortOrder: 12,
    targetValue: 5,
    title: "친구 5명 추가",
  },
  {
    conditionType: "minigame_play_count",
    key: "minigame_10",
    reward: { xp: 20 },
    sortOrder: 13,
    targetValue: 10,
    title: "미니게임 누적 10회",
  },
  {
    conditionType: "total_xp",
    key: "total_xp_1500",
    reward: { coin: 400 },
    sortOrder: 14,
    targetValue: 1500,
    title: "누적 1,500XP 달성",
  },
  {
    conditionType: "room_item_equip_count",
    key: "room_item_equip_5",
    reward: { coin: 500 },
    sortOrder: 15,
    targetValue: 5,
    title: "마이룸 내 아이템 5회 교체",
  },
  {
    conditionType: "quiz_correct_count",
    key: "quiz_correct_30",
    reward: { coin: 500 },
    sortOrder: 16,
    targetValue: 30,
    title: "퀴즈 누적 30회 정답",
  },
  {
    conditionType: "feed_count",
    key: "feed_30",
    reward: { coin: 600 },
    sortOrder: 17,
    targetValue: 30,
    title: "학식 누적 30회 먹이기",
  },
  {
    conditionType: "friend_count",
    key: "friend_15",
    reward: { coin: 600 },
    sortOrder: 18,
    targetValue: 15,
    title: "친구 15명 추가",
  },
  {
    conditionType: "achievement_completed_count",
    key: "achievement_20",
    reward: { xp: 30 },
    sortOrder: 19,
    targetValue: 20,
    title: "업적 20회 달성",
  },
  {
    conditionType: "total_xp",
    key: "total_xp_2500_skin",
    reward: { skinKey: "skin_peace" },
    sortOrder: 20,
    targetValue: 2500,
    title: "누적 2,500XP 달성",
  },
  {
    conditionType: "quiz_correct_count",
    key: "quiz_correct_50_coin_800",
    reward: { coin: 800 },
    sortOrder: 21,
    targetValue: 50,
    title: "퀴즈 누적 50회 정답",
  },
  {
    conditionType: "feed_count",
    key: "feed_50_coin_1000",
    reward: { coin: 1000 },
    sortOrder: 22,
    targetValue: 50,
    title: "학식 누적 50회 먹이기",
  },
  {
    conditionType: "minigame_play_count",
    key: "minigame_50_coin_1000",
    reward: { coin: 1000 },
    sortOrder: 23,
    targetValue: 50,
    title: "미니게임 누적 50회",
  },
  {
    conditionType: "total_xp",
    key: "total_xp_2500_xp_50",
    reward: { xp: 50 },
    sortOrder: 24,
    targetValue: 2500,
    title: "누적 2,500XP 달성",
  },
  {
    conditionType: "quiz_correct_count",
    key: "quiz_correct_50_coin_1500",
    reward: { coin: 1500 },
    sortOrder: 25,
    targetValue: 50,
    title: "퀴즈 누적 50회 정답",
  },
  {
    conditionType: "feed_count",
    key: "feed_50_coin_2000",
    reward: { coin: 2000 },
    sortOrder: 26,
    targetValue: 50,
    title: "학식 누적 50회 먹이기",
  },
  {
    conditionType: "minigame_play_count",
    key: "minigame_50_coin_2000",
    reward: { coin: 2000 },
    sortOrder: 27,
    targetValue: 50,
    title: "미니게임 누적 50회",
  },
  {
    conditionType: "quiz_correct_count",
    key: "quiz_correct_80",
    reward: { xp: 100 },
    sortOrder: 28,
    targetValue: 80,
    title: "퀴즈 누적 80회 정답",
  },
  {
    conditionType: "feed_count",
    key: "feed_80",
    reward: { skinKey: "skin_creation" },
    sortOrder: 29,
    targetValue: 80,
    title: "학식 누적 80회 먹이기",
  },
  {
    conditionType: "minigame_play_count",
    key: "minigame_80",
    reward: { coin: 5000 },
    sortOrder: 30,
    targetValue: 80,
    title: "미니게임 누적 80회",
  },
] as const satisfies readonly AchievementDefinition[];

const SKIN_REWARD_LABELS: Record<AchievementSkinKey, string> = {
  skin_creation: "창조 외형",
  skin_peace: "평화 외형",
  skin_truth: "진리 외형",
};

export const getAchievementRewardLabel = (reward: AchievementReward) => {
  const rewardLabels: string[] = [];

  if (reward.coin) {
    rewardLabels.push(`${reward.coin.toLocaleString()}코인`);
  }

  if (reward.xp) {
    rewardLabels.push(`${reward.xp.toLocaleString()}XP`);
  }

  if (reward.skinKey) {
    rewardLabels.push(`${SKIN_REWARD_LABELS[reward.skinKey]} 획득`);
  }

  return rewardLabels.join(" + ");
};

export const getAchievementRewardTotals = (achievementKeys: string[]) => {
  const achievementKeySet = new Set(achievementKeys);

  return ACHIEVEMENT_DEFINITIONS.reduce(
    (totals, achievement) => {
      if (!achievementKeySet.has(achievement.key)) {
        return totals;
      }
      const reward = achievement.reward as AchievementReward;

      return {
        coin: totals.coin + (reward.coin ?? 0),
        skinKeys:
          reward.skinKey &&
          !totals.skinKeys.includes(reward.skinKey)
            ? [...totals.skinKeys, reward.skinKey]
            : totals.skinKeys,
        xp: totals.xp + (reward.xp ?? 0),
      };
    },
    {
      coin: 0,
      skinKeys: [] as AchievementSkinKey[],
      xp: 0,
    },
  );
};
