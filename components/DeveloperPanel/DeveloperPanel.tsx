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
  setIsDeveloperPanelOpen: (value: boolean) => void;
}

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
  label: string;
  onApply: () => void;
  onChangeText: (text: string) => void;
  value: string;
};

const DeveloperInputRow = ({
  label,
  onApply,
  onChangeText,
  value,
}: DeveloperInputRowProps) => (
  <View style={styles.inputRow}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputActionRow}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.SILVER_NORMAL}
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
  </View>
);

const DeveloperPanel = ({ setIsDeveloperPanelOpen }: DeveloperPanelProps) => {
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
                  onPress={() => adjustCoin(delta)}
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
                  onPress={() => adjustXp(delta)}
                />
              ))}
              <DeveloperChipButton
                label="가득"
                onPress={() =>
                  adjustXp(
                    xpProgress.progressMaxXp - xpProgress.currentXpInGrade,
                  )
                }
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
              onChangeText={setBooNameInput}
              onApply={() => setBooName(booNameInput.trim() || booName)}
            />
            <DeveloperInputRow
              label="유저 이름"
              value={userNameInput}
              onChangeText={setUserNameInput}
              onApply={() => setUserName(userNameInput.trim() || userName)}
            />
            <DeveloperInputRow
              label="학번"
              value={studentIdInput}
              onChangeText={setStudentIdInput}
              onApply={() => setStudentId(studentIdInput.trim() || studentId)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>학년</Text>
            <View style={styles.chipRow}>
              {GRADE_OPTIONS.map((gradeOption) => (
                <DeveloperChipButton
                  key={`grade-${gradeOption}`}
                  label={`${gradeOption}학년`}
                  active={xpProgress.grade === gradeOption}
                  onPress={() => setGrade(gradeOption)}
                />
              ))}
              <DeveloperChipButton
                label="졸업 직전"
                active={totalXp === 8999}
                onPress={() => setTotalXp(8999)}
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
                  onPress={() => setCharacterState(stateOption)}
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
                  onPress={() => setMealDayMode(option.value)}
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
                onPress={toggleMealRestrictionEnabled}
              />
              <DeveloperChipButton
                label="식사 기록 초기화"
                onPress={clearMealHistory}
              />
              <DeveloperChipButton
                label="결식 상태 동기화"
                onPress={() => syncMealStatus(false)}
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
                onPress={toggleQuizDailyLimitEnabled}
              />
              <DeveloperChipButton
                label="퀴즈 기록 초기화"
                onPress={clearQuizHistory}
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
                onPress={resetGameState}
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
    ...StyleSheet.absoluteFillObject,
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
