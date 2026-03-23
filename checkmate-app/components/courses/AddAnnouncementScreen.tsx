import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { courseService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AddAnnouncementScreenRouteProp = RouteProp<RootStackParamList, "AddAnnouncement">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddAnnouncementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddAnnouncementScreenRouteProp>();
  const { courseId, courseCode, courseTitle } = route.params;

  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Announcement title is required");
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert("Validation Error", "Title must be at least 3 characters");
      return false;
    }
    if (!content.trim()) {
      Alert.alert("Validation Error", "Announcement content is required");
      return false;
    }
    if (content.trim().length < 10) {
      Alert.alert("Validation Error", "Content must be at least 10 characters");
      return false;
    }
    return true;
  };

  const handleCreateAnnouncement = async () => {
    if (!validateForm()) {
      return;
    }

    console.log("📢 Creating announcement...");
    setLoading(true);

    try {
      const announcementData = {
        title: title.trim(),
        content: content.trim(),
        priority,
      };

      await courseService.addAnnouncement(courseId, announcementData);

      Alert.alert("Success", "Announcement posted successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error("❌ Error creating announcement:", error);

      let errorMessage = "Failed to post announcement. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priorityValue: "low" | "medium" | "high") => {
    switch (priorityValue) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
    }
  };

  const getPriorityLabel = (priorityValue: "low" | "medium" | "high") => {
    return priorityValue.charAt(0).toUpperCase() + priorityValue.slice(1);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Announcement</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Course Info */}
          <View style={styles.courseInfo}>
            <Ionicons
              name="book-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.courseText}>
              {courseCode} • {courseTitle}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter announcement title"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.helperText}>{title.length}/100</Text>
            </View>

            {/* Content Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Content <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your announcement..."
                placeholderTextColor={theme.colors.textTertiary}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.helperText}>{content.length}/1000</Text>
            </View>

            {/* Priority Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityContainer}>
                {(["low", "medium", "high"] as const).map((priorityValue) => (
                  <TouchableOpacity
                    key={priorityValue}
                    style={[
                      styles.priorityOption,
                      priority === priorityValue && {
                        backgroundColor: getPriorityColor(priorityValue) + "20",
                        borderColor: getPriorityColor(priorityValue),
                      },
                    ]}
                    onPress={() => setPriority(priorityValue)}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        {
                          backgroundColor: getPriorityColor(priorityValue),
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.priorityText,
                        priority === priorityValue && {
                          color: getPriorityColor(priorityValue),
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {getPriorityLabel(priorityValue)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons
                name="information-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.infoText}>
                This announcement will be visible to all students enrolled in
                this course.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleCreateAnnouncement}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <Ionicons
                  name="megaphone"
                  size={20}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.submitButtonText}>Post Announcement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  courseInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary + "10",
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  courseText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    flex: 1,
  },
  form: {
    padding: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  textArea: {
    minHeight: 150,
    paddingTop: theme.spacing.md,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 4,
    textAlign: "right",
  },
  priorityContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  priorityOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: 6,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.primary + "10",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: 8,
    ...theme.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onPrimary,
  },
});
