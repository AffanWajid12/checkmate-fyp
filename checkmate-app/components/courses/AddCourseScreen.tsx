import React, { useMemo, useState } from "react";
import { theme } from "@/constants/theme";
import { courseService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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

type CreatedCourse = {
  id: string;
  title: string;
  code: string;
  description?: string | null;
};

export default function AddCourseScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createdCourse, setCreatedCourse] = useState<CreatedCourse | null>(null);

  const canSubmit = useMemo(() => title.trim().length > 0 && !loading, [title, loading]);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Course title is required");
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert("Validation Error", "Course title must be at least 3 characters");
      return false;
    }
    return true;
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setCreatedCourse(null);
    navigation.goBack();
  };

  const handleCreateCourse = async () => {
    if (!validateForm()) return;

    console.log("➕ Creating course...");
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
      };

      const res: any = await courseService.createCourse(payload as any);

      // Backend contract in MOBILE-APP-BACKEND-INTEGRATION.MD says: { message, course }
      const courseFromBackend: any = res?.course ?? res;

      if (!courseFromBackend?.id || !courseFromBackend?.title || !courseFromBackend?.code) {
        Alert.alert(
          "Created, but couldn’t show code",
          "The course was created, but the app couldn’t read the returned course code from the response."
        );
        handleClose();
        return;
      }

      setCreatedCourse({
        id: String(courseFromBackend.id),
        title: String(courseFromBackend.title),
        code: String(courseFromBackend.code),
        description: courseFromBackend.description ?? null,
      });
    } catch (error: any) {
      console.error("❌ Error creating course:", error);

      let errorMessage = "Failed to create course. Please try again.";

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

  // Step 2: success view showing the generated code (no clipboard functionality)
  if (createdCourse) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.successWrapper}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons
                name="checkmark"
                size={28}
                color={theme.colors.success ?? theme.colors.primary}
              />
            </View>

            <Text style={styles.successTitle}>Course Created!</Text>
            <Text style={styles.successSubtitle}>
              Share the code below with your students so they can enroll.
            </Text>

            <View style={styles.courseInfoBox}>
              <Text style={styles.mutedLabel}>Course title</Text>
              <Text style={styles.courseInfoTitle}>{createdCourse.title}</Text>
            </View>

            <View style={styles.codeBox}>
              <Text style={styles.mutedLabel}>Course Code</Text>
              <Text style={styles.codeValue}>{createdCourse.code}</Text>
            </View>

            <TouchableOpacity onPress={handleClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>Create a Course</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.helperText}>
              A unique enrollment code will be generated automatically.
            </Text>

            <Text style={styles.label}>Course Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Introduction to Computer Science"
              placeholderTextColor={theme.colors.placeholder}
              value={title}
              onChangeText={setTitle}
              editable={!loading}
              autoFocus
            />

            <Text style={styles.label}>
              Description <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of what students will learn…"
              placeholderTextColor={theme.colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            <View style={styles.actionsRow}>
              {/* Cancel button removed (user request) */}

              <TouchableOpacity
                style={[
                  styles.createButton,
                  styles.createButtonFullWidth,
                  (!canSubmit || loading) && styles.createButtonDisabled,
                ]}
                onPress={handleCreateCourse}
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                    <Text style={styles.createButtonText}>Creating…</Text>
                  </View>
                ) : (
                  <Text style={styles.createButtonText}>Create Course</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
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
  form: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  helperText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  optional: {
    fontWeight: "400",
    color: theme.colors.textSecondary,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  actionsRow: {
    marginTop: theme.spacing.xl,
  },
  createButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonFullWidth: {
    width: '100%',
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  createButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Success view
  successWrapper: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
  },
  successCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  successIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: "center",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  courseInfoBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  mutedLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  courseInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  codeBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
  },
  codeValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
    color: theme.colors.primary,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
  },
  doneButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
});
