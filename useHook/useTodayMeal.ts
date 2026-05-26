/**
 * @description  오늘 학식 데이터를 TanStack Query로 가져오는 커스텀 훅입니다.
 * @depends      utils/getTodayMeal.ts
 * @used-by      app/game/index.tsx
 * @side-effects React Query cache 갱신, getTodayMeal 네트워크 요청 실행
 */
import { useQuery } from "@tanstack/react-query";
import { getTodayMeal, TodayMealSection } from "@/utils/getTodayMeal";

const TODAY_MEAL_QUERY_KEY = ["todayMeal"] as const;

interface UseTodayMealResult {
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  todayMealSections: TodayMealSection[];
}

export const useTodayMeal = (): UseTodayMealResult => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: TODAY_MEAL_QUERY_KEY,
    queryFn: getTodayMeal,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 1,
  });

  const todayMealSections = data ?? [];
  const errorMessage = error ? "오늘 학식 메뉴를 불러오지 못했어요." : null;

  return {
    error: errorMessage,
    isLoading,
    refetch: async () => {
      await refetch();
    },
    todayMealSections,
  };
};
