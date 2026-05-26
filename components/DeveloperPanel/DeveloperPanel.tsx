/**
 * @description  개발/시연용으로 XP, 코인, 식사, 퀴즈, 튜토리얼, 캐릭터 상태를 조작하는 패널입니다.
 * @depends      stores/useGameStore.ts, components/MainButton/MainButton.tsx, components/MealPanel/MealMenuData.ts, constants/character.ts, utils/xpProgress.ts
 * @used-by      app/game/index.tsx
 * @side-effects 다수의 Zustand 디버그 액션 호출, 입력 validation 상태 관리
 */
import CrossIcon from "@/assets/icons/cross.svg";
import MainButton from "@/components/MainButton/MainButton";
import { MealDayMode } from "@/components/MealPanel/MealMenuData";
import {
  CHARACTER_STATE_LABELS,
  CharacterGrade,
  CharacterState,
} from "@/constants/character";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { useGameStore } from "@/stores/useGameStore";
import { getXpProgressInfo } from "@/utils/xpProgress";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface DeveloperPanelProps {
  onActionFeedback: (title: string, message?: string) => void;
  onMealStateChanged?: () => void;
  setIsDeveloperPanelOpen: (value: boolean) => void;
}

type DeveloperInputField = "booName" | "studentId" | "userName";

const GRADE_OPTIONS: CharacterGrade[] = [1, 2, 3, 4];
const CHARACTER_STATE_OPTIONS: CharacterState[] = [
  "basic1",
  "basic2",
  "happy1",
  "happy2",
  "hungry",
  "eating",
  "talking",
];
const COIN_DELTAS = [-1000, -100, 100, 1000];
const XP_DELTAS = [-200, -50, 50, 200];
const MEAL_DAY_MODE_OPTIONS: { label: string; value: MealDayMode }[] = [
  { label: "자동", value: "auto" },
  { label: "평일", value: "weekday" },
  { label: "주말", value: "weekend" },
];
const HANGUL_JAMO_REGEX = /[ㄱ-ㅎㅏ-ㅣ]/;

type DeveloperChipButtonProps = {
  active?: boolean;
  label: string;
  onPress: () => void;
};

const DeveloperChipButton = ({
  active = false,
  label,
  onPress,
}: DeveloperChipButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chipButton,
      active && styles.chipButtonActive,
      pressed && (active ? styles.chipButtonActivePressed : styles.chipButtonPressed),
    ]}
  >
    <Text
      style={[
        styles.chipButtonText,
        active && styles.chipButtonTextActive,
      ]}
    >
      {label}
    </Text>
  </Pressable>
);

type DeveloperInputRowProps = {
  error?: string;
  inputMode?: "decimal" | "email" | "none" | "numeric" | "search" | "tel" | "text" | "url";
  label: string;
  maxLength?: number;
  onApply: () => void;
  onChangeText: (text: string) => void;
  value: string;
};

const DeveloperInputRow = ({
  error,
  inputMode,
  label,
  maxLength,
  onApply,
  onChangeText,
  value,
}: DeveloperInputRowProps) => (
  <View style={styles.inputRow}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputActionRow}>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.SILVER_NORMAL}
        inputMode={inputMode}
        maxLength={maxLength}
      />
      <Pressable
        onPress={onApply}
        style={({ pressed }) => [
          styles.applyButton,
          pressed && styles.applyButtonPressed,
        ]}
      >
        {({ pressed }) => (
          <Text
            style={[
              styles.applyButtonText,
              pressed && styles.applyButtonTextPressed,
            ]}
          >
            적용
          </Text>
        )}
      </Pressable>
    </View>
    {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
  </View>
);

const DeveloperPanel = ({
  onActionFeedback,
  onMealStateChanged,
  setIsDeveloperPanelOpen,
}: DeveloperPanelProps) => {
  const addSkippedMealForTest = useGameStore(
    (state) => state.addSkippedMealForTest,
  );
  const adjustCoin = useGameStore((state) => state.adjustCoin);
  const adjustXp = useGameStore((state) => state.adjustXp);
  const booName = useGameStore((state) => state.booName);
  const characterState = useGameStore((state) => state.characterState);
  const clearMealHistory = useGameStore((state) => state.clearMealHistory);
  const clearQuizHistory = useGameStore((state) => state.clearQuizHistory);
  const coin = useGameStore((state) => state.coin);
  const developerModeEnabled = useGameStore(
    (state) => state.developerModeEnabled,
  );
  const mealDayMode = useGameStore((state) => state.mealDayMode);
  const mealRestrictionEnabled = useGameStore(
    (state) => state.mealRestrictionEnabled,
  );
  const quizDailyLimitEnabled = useGameStore(
    (state) => state.quizDailyLimitEnabled,
  );
  const resetGameState = useGameStore((state) => state.resetGameState);
  const setBooName = useGameStore((state) => state.setBooName);
  const setCharacterState = useGameStore((state) => state.setCharacterState);
  const setGrade = useGameStore((state) => state.setGrade);
  const setHasSeenGameTutorial = useGameStore(
    (state) => state.setHasSeenGameTutorial,
  );
  const setMealDayMode = useGameStore((state) => state.setMealDayMode);
  const setStudentId = useGameStore((state) => state.setStudentId);
  const setTotalXp = useGameStore((state) => state.setTotalXp);
  const setUserName = useGameStore((state) => state.setUserName);
  const skippedMealCount = useGameStore((state) => state.skippedMealCount);
  const studentId = useGameStore((state) => state.studentId);
  const syncMealStatus = useGameStore((state) => state.syncMealStatus);
  const totalXp = useGameStore((state) => state.totalXp);
  const toggleMealRestrictionEnabled = useGameStore(
    (state) => state.toggleMealRestrictionEnabled,
  );
  const toggleQuizDailyLimitEnabled = useGameStore(
    (state) => state.toggleQuizDailyLimitEnabled,
  );
  const userName = useGameStore((state) => state.userName);
  const [booNameInput, setBooNameInput] = useState(booName);
  const [studentIdInput, setStudentIdInput] = useState(studentId);
  const [userNameInput, setUserNameInput] = useState(userName);
  const [inputErrors, setInputErrors] = useState<
    Partial<Record<DeveloperInputField, string>>
  >({});
  const xpProgress = useMemo(() => getXpProgressInfo(totalXp), [totalXp]);

  useEffect(() => {
    setBooNameInput(booName);
  }, [booName]);

  useEffect(() => {
    setUserNameInput(userName);
  }, [userName]);

  useEffect(() => {
    setStudentIdInput(studentId);
  }, [studentId]);

  useEffect(() => {
    if (!developerModeEnabled) {
      setIsDeveloperPanelOpen(false);
    }
  }, [developerModeEnabled, setIsDeveloperPanelOpen]);

  const handleClose = () => {
    setIsDeveloperPanelOpen(false);
  };

  const showFeedback = (title: string, message?: string) => {
    onActionFeedback(title, message);
  };

  const setInputError = (
    field: DeveloperInputField,
    errorMessage?: string,
  ) => {
    setInputErrors((prev) => {
      if (!errorMessage) {
        const { [field]: _removed, ...rest } = prev;

        return rest;
      }

      return {
        ...prev,
        [field]: errorMessage,
      };
    });
  };

  const validateBooName = (value: string) => {
    const nextBooName = value.trim();

    if (nextBooName.length < 1) {
      return "부 이름은 1자 이상 입력해주세요";
    }

    if (HANGUL_JAMO_REGEX.test(nextBooName)) {
      return "자음이나 모음만 입력할 수 없어요";
    }

    return null;
  };

  const validateUserName = (value: string) => {
    const nextUserName = value.trim();

    if (nextUserName.length < 2) {
      return "이름은 2자 이상 입력해주세요";
    }

    if (HANGUL_JAMO_REGEX.test(nextUserName)) {
      return "자음이나 모음만 입력할 수 없어요";
    }

    return null;
  };

  const validateStudentId = (value: string) => {
    const nextStudentId = value.trim();

    if (!/^\d{9}$/.test(nextStudentId)) {
      return "학번은 숫자 9자리여야 해요";
    }

    return null;
  };

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerText}>개발자 모드</Text>
            <Text style={styles.helperText}>베타 테스트용 빠른 상태 편집</Text>
          </View>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.headerButtonPressed,
            ]}
          >
            <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
          </Pressable>
        </View>
        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>자원</Text>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>코인</Text>
              <Text style={styles.metricValue}>$ {coin}</Text>
            </View>
            <View style={styles.chipRow}>
              {COIN_DELTAS.map((delta) => (
                <DeveloperChipButton
                  key={`coin-${delta}`}
                  label={`${delta > 0 ? "+" : ""}${delta}`}
                  onPress={() => {
                    adjustCoin(delta);
                    showFeedback("코인을 변경했어요", `${delta > 0 ? "+" : ""}${delta}`);
                  }}
                />
              ))}
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>누적 XP</Text>
              <Text style={styles.metricValue}>
                {totalXp}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {XP_DELTAS.map((delta) => (
                <DeveloperChipButton
                  key={`xp-${delta}`}
                  label={`${delta > 0 ? "+" : ""}${delta}`}
                  onPress={() => {
                    adjustXp(delta);
                    showFeedback("XP를 변경했어요", `${delta > 0 ? "+" : ""}${delta} XP`);
                  }}
                />
              ))}
              <DeveloperChipButton
                label="가득"
                onPress={() => {
                  adjustXp(
                    xpProgress.progressMaxXp - xpProgress.currentXpInGrade,
                  );
                  showFeedback("현재 학년 XP를 가득 채웠어요");
                }}
              />
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>현재 진행도</Text>
              <Text style={styles.metricValue}>
                {xpProgress.currentXpInGrade} / {xpProgress.progressMaxXp}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>이름 / 계정</Text>
            <DeveloperInputRow
              label="부 이름"
              value={booNameInput}
              error={inputErrors.booName}
              maxLength={8}
              onChangeText={(text) => {
                setBooNameInput(text);
                setInputError("booName");
              }}
              onApply={() => {
                const errorMessage = validateBooName(booNameInput);

                if (errorMessage) {
                  setInputError("booName", errorMessage);
                  showFeedback("부 이름을 바꾸지 못했어요", errorMessage);
                  return;
                }

                const nextBooName = booNameInput.trim() || booName;
                setBooName(nextBooName);
                setInputError("booName");
                showFeedback("부 이름을 변경했어요", nextBooName);
              }}
            />
            <DeveloperInputRow
              label="유저 이름"
              value={userNameInput}
              error={inputErrors.userName}
              onChangeText={(text) => {
                setUserNameInput(text);
                setInputError("userName");
              }}
              onApply={() => {
                const errorMessage = validateUserName(userNameInput);

                if (errorMessage) {
                  setInputError("userName", errorMessage);
                  showFeedback("유저 이름을 바꾸지 못했어요", errorMessage);
                  return;
                }

                const nextUserName = userNameInput.trim() || userName;
                setUserName(nextUserName);
                setInputError("userName");
                showFeedback("유저 이름을 변경했어요", nextUserName);
              }}
            />
            <DeveloperInputRow
              label="학번"
              value={studentIdInput}
              error={inputErrors.studentId}
              inputMode="numeric"
              maxLength={9}
              onChangeText={(text) => {
                setStudentIdInput(text.replace(/[^0-9]/g, ""));
                setInputError("studentId");
              }}
              onApply={() => {
                const errorMessage = validateStudentId(studentIdInput);

                if (errorMessage) {
                  setInputError("studentId", errorMessage);
                  showFeedback("학번을 바꾸지 못했어요", errorMessage);
                  return;
                }

                const nextStudentId = studentIdInput.trim() || studentId;
                setStudentId(nextStudentId);
                setInputError("studentId");
                showFeedback("학번을 변경했어요", nextStudentId);
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>학년</Text>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>현재 학년</Text>
              <Text style={styles.metricValue}>{xpProgress.grade}학년</Text>
            </View>
            <View style={styles.chipRow}>
              {GRADE_OPTIONS.map((gradeOption) => (
                <DeveloperChipButton
                  key={`grade-${gradeOption}`}
                  label={`${gradeOption}학년`}
                  active={xpProgress.grade === gradeOption}
                  onPress={() => {
                    setGrade(gradeOption);
                    showFeedback("학년을 변경했어요", `${gradeOption}학년`);
                  }}
                />
              ))}
              <DeveloperChipButton
                label="졸업 직전"
                active={totalXp === 8999}
                onPress={() => {
                  setTotalXp(8999);
                  showFeedback("졸업 직전 XP로 이동했어요");
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>부 상태</Text>
            <View style={styles.chipRow}>
              {CHARACTER_STATE_OPTIONS.map((stateOption) => (
                <DeveloperChipButton
                  key={stateOption}
                  label={CHARACTER_STATE_LABELS[stateOption]}
                  active={characterState === stateOption}
                  onPress={() => {
                    setCharacterState(stateOption);
                    showFeedback(
                      "부 상태를 변경했어요",
                      CHARACTER_STATE_LABELS[stateOption],
                    );
                  }}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>식사 / 제한</Text>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>학식 모드</Text>
              <Text style={styles.metricValue}>
                {mealDayMode === "auto"
                  ? "자동"
                  : mealDayMode === "weekday"
                    ? "평일"
                    : "주말"}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {MEAL_DAY_MODE_OPTIONS.map((option) => (
                <DeveloperChipButton
                  key={option.value}
                  label={option.label}
                  active={mealDayMode === option.value}
                  onPress={() => {
                    setMealDayMode(option.value);
                    showFeedback("학식 모드를 변경했어요", option.label);
                  }}
                />
              ))}
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>시간 제한</Text>
              <Text style={styles.metricValue}>
                {mealRestrictionEnabled ? "ON" : "OFF"}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>연속 결식</Text>
              <Text style={styles.metricValue}>{skippedMealCount}끼니</Text>
            </View>
            <View style={styles.chipRow}>
              <DeveloperChipButton
                label={`시간 제한 ${mealRestrictionEnabled ? "끄기" : "켜기"}`}
                onPress={() => {
                  toggleMealRestrictionEnabled();
                  showFeedback(
                    "식사 시간 제한을 변경했어요",
                    mealRestrictionEnabled ? "OFF" : "ON",
                  );
                }}
              />
              <DeveloperChipButton
                label="식사 기록 초기화"
                onPress={() => {
                  clearMealHistory();
                  syncMealStatus(false);
                  onMealStateChanged?.();
                  showFeedback("식사 기록을 초기화했어요");
                }}
              />
              <DeveloperChipButton
                label="거른 끼니 +1"
                onPress={() => {
                  addSkippedMealForTest();
                  onMealStateChanged?.();
                  showFeedback(
                    "거른 끼니를 추가했어요",
                    `${useGameStore.getState().skippedMealCount}끼니`,
                  );
                }}
              />
              <DeveloperChipButton
                label="결식 상태 동기화"
                onPress={() => {
                  syncMealStatus(false);
                  onMealStateChanged?.();
                  showFeedback("결식 상태를 다시 계산했어요");
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>퀴즈</Text>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>문제 수 제한</Text>
              <Text style={styles.metricValue}>
                {quizDailyLimitEnabled ? "ON" : "OFF"}
              </Text>
            </View>
            <Text style={styles.sectionDescription}>
              오늘의 퀴즈 완료 상태와 문제별 쿨타임을 초기화합니다.
            </Text>
            <View style={styles.chipRow}>
              <DeveloperChipButton
                label={`문제 수 제한 ${quizDailyLimitEnabled ? "끄기" : "켜기"}`}
                onPress={() => {
                  toggleQuizDailyLimitEnabled();
                  showFeedback(
                    "퀴즈 문제 수 제한을 변경했어요",
                    quizDailyLimitEnabled ? "OFF" : "ON",
                  );
                }}
              />
              <DeveloperChipButton
                label="퀴즈 기록 초기화"
                onPress={() => {
                  clearQuizHistory();
                  showFeedback("퀴즈 기록을 초기화했어요");
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>튜토리얼</Text>
            <Text style={styles.sectionDescription}>
              다음 메인 게임 화면 진입 때 튜토리얼 안내를 다시 띄웁니다.
            </Text>
            <View style={styles.chipRow}>
              <DeveloperChipButton
                label="튜토리얼 조회 초기화"
                onPress={() => {
                  setHasSeenGameTutorial(false);
                  showFeedback("튜토리얼 조회 기록을 초기화했어요");
                }}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>전체 초기화</Text>
            <Text style={styles.sectionDescription}>
              코인, XP, 친구 목록, 식사 기록을 처음 상태로 되돌립니다.
            </Text>
            <View style={styles.resetButtonWrapper}>
              <MainButton
                color="gray"
                size="S"
                label="게임 상태 초기화"
                onPress={() => {
                  resetGameState();
                  showFeedback("게임 상태를 초기화했어요");
                }}
                width={284}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 999,
    elevation: 999,
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: "82%",
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 30,
    backgroundColor: colors.WHITE_NORMAL,
    borderTopWidth: 2,
    borderTopColor: colors.BLACK_NORMAL,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    gap: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerText: {
    fontFamily: fonts.BASIC,
    fontSize: 24,
    lineHeight: 32,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  helperText: {
    marginTop: 4,
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 18,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  headerButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonPressed: {
    backgroundColor: colors.SILVER_LIGHT_ACTIVE,
  },
  section: {
    padding: 14,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.BASIC,
    fontSize: 18,
    lineHeight: 24,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  sectionDescription: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 18,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.WHITE_NORMAL,
    borderWidth: 1,
    borderColor: colors.GRAY_NORMAL_ACTIVE,
  },
  metricLabel: {
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  metricValue: {
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    color: colors.GREEN_NORMAL,
    includeFontPadding: false,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipButton: {
    minHeight: 32,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
    justifyContent: "center",
    alignItems: "center",
  },
  chipButtonActive: {
    backgroundColor: colors.GREEN_NORMAL,
    borderColor: colors.BLACK_NORMAL,
  },
  chipButtonPressed: {
    backgroundColor: colors.GOLD_LIGHT_ACTIVE,
    transform: [{ translateY: 1 }],
  },
  chipButtonActivePressed: {
    backgroundColor: colors.GREEN_NORMAL_ACTIVE,
    transform: [{ translateY: 1 }],
  },
  chipButtonText: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 16,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  chipButtonTextActive: {
    color: colors.WHITE_NORMAL,
  },
  inputRow: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 16,
    color: colors.SILVER_NORMAL_ACTIVE,
    includeFontPadding: false,
  },
  inputActionRow: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.GRAY_NORMAL_ACTIVE,
    backgroundColor: colors.WHITE_NORMAL,
    fontFamily: fonts.BASIC,
    fontSize: 14,
    lineHeight: 18,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  inputError: {
    borderColor: colors.DANGER,
  },
  inputErrorText: {
    fontFamily: fonts.BASIC,
    fontSize: 11,
    lineHeight: 16,
    color: colors.DANGER,
    includeFontPadding: false,
  },
  applyButton: {
    minWidth: 56,
    minHeight: 38,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.GREEN_LIGHT_ACTIVE,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonPressed: {
    backgroundColor: colors.GREEN_NORMAL_ACTIVE,
    transform: [{ translateY: 1 }],
  },
  applyButtonText: {
    fontFamily: fonts.BASIC,
    fontSize: 12,
    lineHeight: 16,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  applyButtonTextPressed: {
    color: colors.WHITE_NORMAL,
  },
  resetButtonWrapper: {
    alignItems: "center",
    marginTop: 4,
  },
});

export default DeveloperPanel;
