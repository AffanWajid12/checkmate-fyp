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

interface AddOptionsDrawerProps {
  visible: boolean;
  onClose: () => void;
  onAddAnnouncement: () => void;
  onAddAssessment: () => void;
  onAddCourseMaterial: () => void;
}

export default function AddOptionsDrawer({
  visible,
  onClose,
  onAddAnnouncement,
  onAddAssessment,
  onAddCourseMaterial,
}: AddOptionsDrawerProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate drawer sliding up and overlay fading in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset position when closing
      translateY.setValue(height);
      overlayOpacity.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture swipe down gestures
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward dragging
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          // Fade overlay based on drag distance
          const opacity = Math.max(0, 1 - gestureState.dy / 300);
          overlayOpacity.setValue(opacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        const shouldClose = dy > 100 || vy > 0.5;

        if (shouldClose) {
          // Animate close
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
          });
        } else {
          // Snap back to open position
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

  const handleOptionPress = (callback: () => void) => {
    // Animate close
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
      setTimeout(callback, 100);
    });
  };

  const handleOverlayPress = () => {
    // Animate close
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
    });
  };
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleOverlayPress}
    >
      <TouchableWithoutFeedback onPress={handleOverlayPress}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.drawer,
                {
                  transform: [{ translateY }],
                },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Handle Bar - Make it more prominent for grabbing */}
              <View style={styles.handleBarContainer}>
                <View style={styles.handleBar} />
              </View>

              {/* Title */}
              <Text style={styles.title}>Add New Content</Text>

              {/* Options */}
              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress(onAddAnnouncement)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
                  <Ionicons name="megaphone" size={24} color={theme.colors.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Add Announcement</Text>
                  <Text style={styles.optionDescription}>
                    Post important updates to students
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => handleOptionPress(onAddAssessment)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: "#10B981" + "20" }]}>
                  <Ionicons name="document-text" size={24} color="#10B981" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Add Assessment</Text>
                  <Text style={styles.optionDescription}>
                    Create exam, quiz, or assignment
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.option, styles.disabledOption]}
                onPress={() => handleOptionPress(onAddCourseMaterial)}
                activeOpacity={0.5}
                disabled
              >
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.textTertiary + "20" }]}>
                  <Ionicons name="folder" size={24} color={theme.colors.textTertiary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionTitle, styles.disabledText]}>
                    Add Course Material
                  </Text>
                  <Text style={[styles.optionDescription, styles.disabledText]}>
                    Coming soon
                  </Text>
                </View>
                <Ionicons name="lock-closed" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleOverlayPress}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  drawer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    maxHeight: height * 0.7,
  },
  handleBarContainer: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  disabledOption: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  disabledText: {
    color: theme.colors.textTertiary,
  },
  cancelButton: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
});
