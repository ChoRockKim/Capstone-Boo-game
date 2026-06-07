import ArrowReturn from "@/assets/icons/arrow-back-return.svg";
import UserCircleIcon from "@/assets/icons/User-circle.svg";
import MainButton from "@/components/MainButton/MainButton";
import InputField from "@/components/Inputs/InputField";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import {
  FriendListItem,
  getFriendByStudentId,
} from "@/components/FriendList/FriendListDummyData";
import { useGameStore } from "@/stores/useGameStore";
import {
  createFriendRequest,
  getServerApiErrorMessage,
  searchFriendByStudentId,
} from "@/utils/serverApi";
import {
  mapFriendUserToFriendListItem,
} from "@/utils/serverFriendAdapter";
import { playSoundEffect } from "@/utils/soundEffects";
import React, { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type FriendAddModalStep = "input" | "result" | "success";

interface FriendAddModalProps {
  onClose: () => void;
  onFriendChanged?: () => void;
}

const BASE_HEIGHT_BY_STEP: Record<FriendAddModalStep, number> = {
  input: 224,
  result: 280,
  success: 208,
};
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

const FriendAddModal = ({ onClose, onFriendChanged }: FriendAddModalProps) => {
  const accessToken = useGameStore((state) => state.accessToken);
  const addFriend = useGameStore((state) => state.addFriend);
  const friendList = useGameStore((state) => state.friendList);
  const myStudentId = useGameStore((state) => state.studentId);
  const [errorMessage, setErrorMessage] = useState("");
  const [friendAddStep, setFriendAddStep] = useState<FriendAddModalStep>("input");
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [lookupResult, setLookupResult] = useState<FriendListItem | null>(null);
  const [successMessage, setSuccessMessage] = useState("추가되었습니다!");
  const [studentIdInput, setStudentIdInput] = useState("");

  const trimmedStudentId = useMemo(
    () => studentIdInput.trim(),
    [studentIdInput],
  );
  const currentBaseHeight = BASE_HEIGHT_BY_STEP[friendAddStep];

  useEffect(() => {
    const show = Keyboard.addListener(KEYBOARD_SHOW_EVENT, (event) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(KEYBOARD_HIDE_EVENT, () => {
      setKeyboardHeight(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const handleClose = () => {
    Keyboard.dismiss();
    playSoundEffect("basicClick");
    onClose();
  };

  const validateStudentIdInput = () => {
    if (!trimmedStudentId) {
      setErrorMessage("학번을 입력해주세요");
      return false;
    }

    if (trimmedStudentId === myStudentId) {
      setErrorMessage("본인은 친구로 추가할 수 없어요.");
      return false;
    }

    return true;
  };

  const handleLookup = async () => {
    if (!validateStudentIdInput()) {
      return;
    }

    if (accessToken) {
      setIsLookingUp(true);

      try {
        const foundFriend = mapFriendUserToFriendListItem(
          await searchFriendByStudentId(trimmedStudentId, accessToken),
        );

        if (
          friendList.some(
            (friend) => friend.studentId === foundFriend.studentId,
          )
        ) {
          setErrorMessage("이미 친구로 등록되어 있어요.");
          return;
        }

        Keyboard.dismiss();
        setErrorMessage("");
        setLookupResult(foundFriend);
        setFriendAddStep("result");
      } catch (error) {
        setErrorMessage(
          getServerApiErrorMessage(error, "해당 학번의 친구를 찾을 수 없어요."),
        );
      } finally {
        setIsLookingUp(false);
      }

      return;
    }

    const foundFriend = getFriendByStudentId(trimmedStudentId);

    if (!foundFriend) {
      setErrorMessage("해당 학번의 친구를 찾을 수 없어요.");
      return;
    }

    if (friendList.some((friend) => friend.studentId === foundFriend.studentId)) {
      setErrorMessage("이미 친구로 등록되어 있어요.");
      return;
    }

    Keyboard.dismiss();
    setErrorMessage("");
    setLookupResult(foundFriend);
    setFriendAddStep("result");
  };

  const handleAddFriend = async () => {
    if (!lookupResult) {
      return;
    }

    playSoundEffect("basicClick");

    if (accessToken) {
      setIsAddingFriend(true);

      try {
        await createFriendRequest(
          lookupResult.studentId,
          accessToken,
        );

        onFriendChanged?.();
        setSuccessMessage("친구 요청을 보냈어요!");
        setFriendAddStep("success");
      } catch (error) {
        setErrorMessage(
          getServerApiErrorMessage(error, "친구 요청에 실패했어요."),
        );
      } finally {
        setIsAddingFriend(false);
      }

      return;
    }

    addFriend(lookupResult);
    setSuccessMessage("추가되었습니다!");
    setFriendAddStep("success");
  };

  const renderResultCard = (friend: FriendListItem) => (
    <View style={styles.resultCard}>
      <View style={styles.resultIconBox}>
        <UserCircleIcon
          width={20}
          height={20}
          color={colors.SILVER_NORMAL_ACTIVE}
        />
      </View>
      <Text style={styles.resultNameText}>{friend.name}</Text>
      <Text style={styles.resultStudentIdText}>{friend.studentId}</Text>
    </View>
  );

  const renderContent = () => {
    if (friendAddStep === "success") {
      return (
        <>
          <Text style={styles.messageText}>{successMessage}</Text>
          <View style={styles.buttonWrapper}>
            <MainButton
              color="blue"
              height={64}
              label="확인"
              onPress={handleClose}
              size="S"
              width={280}
            />
          </View>
        </>
      );
    }

    if (friendAddStep === "result" && lookupResult) {
      return (
        <>
          <View style={styles.readonlyStudentIdBox}>
            <Text style={styles.readonlyStudentIdText}>{trimmedStudentId}</Text>
          </View>
          {renderResultCard(lookupResult)}
          <View style={styles.buttonWrapper}>
            <MainButton
              color="blue"
              height={64}
              label={isAddingFriend ? "추가 중" : "친구 추가"}
              onPress={handleAddFriend}
              size="S"
              width={280}
            />
          </View>
        </>
      );
    }

    return (
      <>
        <InputField
          placeholder="학번을 입력해주세요"
          value={studentIdInput}
          inputMode="numeric"
          maxLength={9}
          onChangeText={(text) => {
            setStudentIdInput(text.replace(/[^0-9]/g, ""));
            if (errorMessage) {
              setErrorMessage("");
            }
          }}
          error={errorMessage || undefined}
        />
        <View style={styles.buttonWrapper}>
          <MainButton
            color="blue"
            height={64}
            label={isLookingUp ? "조회 중" : "친구 조회"}
            onPress={handleLookup}
            size="S"
            width={280}
          />
        </View>
      </>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            { height: currentBaseHeight + keyboardHeight },
          ]}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.headerText}>친구 추가</Text>
            <Pressable onPress={handleClose} style={styles.headerButton}>
              <ArrowReturn width={24} height={24} color={colors.BLACK_NORMAL} />
            </Pressable>
          </View>
          {renderContent()}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    backgroundColor: "rgba(18, 18, 49, 0.28)",
    zIndex: 1000,
    elevation: 1000,
  },
  modalCard: {
    width: "100%",
    paddingVertical: 28,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: colors.BLACK_NORMAL,
    backgroundColor: colors.WHITE_NORMAL,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 24,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  headerButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
  readonlyStudentIdBox: {
    minHeight: 40,
    borderWidth: 1.5,
    borderRadius: 16,
    borderColor: colors.GOLD_NORMAL,
    borderStyle: "dotted",
    backgroundColor: colors.WHITE_NORMAL,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  readonlyStudentIdText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  resultCard: {
    width: "100%",
    minHeight: 40,
    borderWidth: 1.5,
    borderRadius: 16,
    borderColor: colors.GOLD_NORMAL,
    borderStyle: "dotted",
    backgroundColor: colors.WHITE_NORMAL,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  resultIconBox: {
    width: 28,
    height: 28,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.SILVER_LIGHT_HOVER,
    borderWidth: 1,
    borderColor: colors.SILVER_NORMAL,
  },
  resultNameText: {
    flex: 1,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  resultStudentIdText: {
    marginLeft: 12,
    fontFamily: fonts.BASIC,
    fontSize: 20,
    color: colors.GREEN_NORMAL,
    includeFontPadding: false,
  },
  messageText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    lineHeight: 28,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
});

export default FriendAddModal;
