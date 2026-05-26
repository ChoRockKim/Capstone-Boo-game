/**
 * @description  친구 방 책상에서 방명록을 작성하고 등록 완료 상태를 표시합니다.
 * @depends      assets/icons/cross.svg, components/Inputs/InputField.tsx, components/MainButton/MainButton.tsx, constants/colors.ts, constants/fonts.ts, utils/soundEffects.ts
 * @used-by      app/room/[friendId].tsx
 * @side-effects Keyboard dismiss, basicClick SFX 재생, onSubmit/onClose 콜백 호출
 */
import CrossIcon from "@/assets/icons/cross.svg";
import InputField from "@/components/Inputs/InputField";
import MainButton from "@/components/MainButton/MainButton";
import { colors } from "@/constants/colors";
import { fonts } from "@/constants/fonts";
import { playSoundEffect } from "@/utils/soundEffects";
import { useEffect, useMemo, useState } from "react";
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

type GuestbookModalStep = "input" | "success";

interface GuestbookModalProps {
  onClose: () => void;
  onSubmit: (message: string) => void;
}

const BASE_HEIGHT_BY_STEP: Record<GuestbookModalStep, number> = {
  input: 240,
  success: 220,
};
const GUESTBOOK_MESSAGE_MAX_LENGTH = 15;
const KEYBOARD_SHOW_EVENT =
  Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const KEYBOARD_HIDE_EVENT =
  Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

const GuestbookModal = ({ onClose, onSubmit }: GuestbookModalProps) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [guestbookStep, setGuestbookStep] =
    useState<GuestbookModalStep>("input");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [message, setMessage] = useState("");
  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const currentBaseHeight = BASE_HEIGHT_BY_STEP[guestbookStep];

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

  const closeModal = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleCloseButtonPress = () => {
    playSoundEffect("basicClick");
    closeModal();
  };

  const handleSubmit = () => {
    if (!trimmedMessage) {
      setErrorMessage("방명록 내용을 입력해주세요");
      return;
    }

    Keyboard.dismiss();
    onSubmit(trimmedMessage);
    setGuestbookStep("success");
  };

  const renderContent = () => {
    if (guestbookStep === "success") {
      return (
        <>
          <Text style={styles.messageText}>방명록이 등록되었습니다</Text>
          <View style={styles.buttonWrapper}>
            <MainButton
              color="blue"
              height={64}
              label="확인"
              onPress={closeModal}
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
          error={errorMessage || undefined}
          maxLength={GUESTBOOK_MESSAGE_MAX_LENGTH}
          onChangeText={(text) => {
            setMessage(text);
            if (errorMessage) {
              setErrorMessage("");
            }
          }}
          placeholder="공백포함 15자까지"
          value={message}
        />
        <View style={styles.buttonWrapper}>
          <MainButton
            color="blue"
            height={64}
            label="작성완료"
            onPress={handleSubmit}
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
            <Text style={styles.headerText}>방명록 작성</Text>
            <Pressable
              onPress={handleCloseButtonPress}
              style={styles.headerButton}
            >
              <CrossIcon width={24} height={24} fill={colors.BLACK_NORMAL} />
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
  messageText: {
    fontFamily: fonts.BASIC,
    fontSize: 20,
    lineHeight: 28,
    color: colors.BLACK_NORMAL,
    includeFontPadding: false,
  },
  buttonWrapper: {
    alignItems: "center",
    marginTop: 20,
  },
});

export default GuestbookModal;
