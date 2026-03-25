import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const { height } = Dimensions.get("window");

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddFileSubmission: () => void;
  onCaptureSubmission: () => void;
};

export default function SubmissionOptionsDrawer({
  visible,
  onClose,
  onAddFileSubmission,
  onCaptureSubmission,
}: Props) {
  const translateY = useRef(new Animated.Value(height)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(height);
      overlayOpacity.setValue(0);
    }
  }, [visible, overlayOpacity, translateY]);

  const closeAnimated = (after?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      if (after) setTimeout(after, 80);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5 && g.dy > 0,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
          overlayOpacity.setValue(Math.max(0, 1 - g.dy / 260));
        }
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.dy > 100 || g.vy > 0.5;
        if (shouldClose) closeAnimated();
        else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.timing(overlayOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeAnimated()}>
      <TouchableWithoutFeedback onPress={() => closeAnimated()}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[styles.drawer, { transform: [{ translateY }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.handleBarContainer}>
                <View style={styles.handleBar} />
              </View>

              <Text style={styles.title}>Add Submission</Text>

              <TouchableOpacity
                style={styles.option}
                onPress={() => closeAnimated(onAddFileSubmission)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
                  <Ionicons name="document-attach" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Add a file submission</Text>
                  <Text style={styles.optionDescription}>Attach a PDF from your device</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => closeAnimated(onCaptureSubmission)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#10B981" + "20" }]}>
                  <Ionicons name="scan" size={22} color="#10B981" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Capture submission</Text>
                  <Text style={styles.optionDescription}>Scan using the document scanner</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              <View style={{ height: 8 }} />
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  handleBarContainer: { alignItems: "center", paddingBottom: 14 },
  handleBar: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: "900", color: theme.colors.textPrimary },
  optionDescription: { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary, marginTop: 2 },
});
