import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { assessmentService } from "@/services/api";
// Backend expects: QUIZ | ASSIGNMENT | EXAM
type BackendAssessmentType = "QUIZ" | "ASSIGNMENT" | "EXAM";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AttachmentFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

type AddAssessmentScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddAssessment"
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ASSESSMENT_TYPES: Array<{
  value: BackendAssessmentType;
  label: string;
  icon: string;
}> = [
  { value: "EXAM", label: "Exam", icon: "document-text" },
  { value: "QUIZ", label: "Quiz", icon: "help-circle" },
  { value: "ASSIGNMENT", label: "Assignment", icon: "clipboard" },
];

export default function AddAssessmentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddAssessmentScreenRouteProp>();
  const { courseId, courseCode, courseTitle } = route.params;

  const [loading, setLoading] = useState(false);

  // Required fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState<BackendAssessmentType>("ASSIGNMENT");
  const [totalPoints, setTotalPoints] = useState("100");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  // Optional fields
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [allowLateSubmissions, setAllowLateSubmissions] = useState(true);
  const [latePenalty, setLatePenalty] = useState("10");
  const [visibleToStudents, setVisibleToStudents] = useState(true);

  // File attachments
  const [attachmentFiles, setAttachmentFiles] = useState<AttachmentFile[]>([]);

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Assessment title is required");
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert("Validation Error", "Title must be at least 3 characters");
      return false;
    }

    const points = parseInt(totalPoints);
    if (isNaN(points) || points <= 0 || points > 1000) {
      Alert.alert(
        "Validation Error",
        "Total points must be between 1 and 1000",
      );
      return false;
    }

    if (!dueDate.trim()) {
      Alert.alert(
        "Validation Error",
        "Due date is required (e.g., 2024-12-25)",
      );
      return false;
    }

    if (!dueTime.trim()) {
      Alert.alert("Validation Error", "Due time is required (e.g., 14:30)");
      return false;
    }

    // Basic date format validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dueDate)) {
      Alert.alert(
        "Validation Error",
        "Due date must be in format YYYY-MM-DD (e.g., 2024-12-25)",
      );
      return false;
    }

    // Basic time format validation (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(dueTime)) {
      Alert.alert(
        "Validation Error",
        "Due time must be in format HH:MM (e.g., 14:30)",
      );
      return false;
    }

    // Check if date is in the future
    const dueDateTimeString = `${dueDate}T${dueTime}:00`;
    const dueDateTime = new Date(dueDateTimeString);
    if (dueDateTime <= new Date()) {
      Alert.alert(
        "Validation Error",
        "Due date and time must be in the future",
      );
      return false;
    }

    if (allowLateSubmissions) {
      const penalty = parseInt(latePenalty);
      if (isNaN(penalty) || penalty < 0 || penalty > 100) {
        Alert.alert(
          "Validation Error",
          "Late penalty must be between 0 and 100",
        );
        return false;
      }
    }
    return true;
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types
        multiple: true, // Allow multiple file selection
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newFiles: AttachmentFile[] = result.assets.map((asset) => ({
          fileName: asset.name,
          fileUrl: asset.uri,
          fileSize: asset.size || 0,
          mimeType: asset.mimeType || "application/octet-stream",
        }));

        setAttachmentFiles((prev) => [...prev, ...newFiles]);
        Alert.alert("Success", `${newFiles.length} file(s) added`);
      }
    } catch (error) {
      console.error("❌ Error picking document:", error);
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const handleRemoveFile = (index: number) => {
    Alert.alert("Remove File", "Are you sure you want to remove this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleCreateAssessment = async () => {
    if (!validateForm()) {
      return;
    }

    console.log("📝 Creating assessment...");
    setLoading(true);

    try {
      const dueDateTimeString = `${dueDate}T${dueTime}:00`;

      const res = await assessmentService.createAssessment(courseId, {
        title: title.trim(),
        type,
        // always send a string so backend announcement includes Instructions block
        instructions: (instructions ?? "").toString(),
        visibleToStudents,
        due_date: new Date(dueDateTimeString).toISOString(),
        files:
          attachmentFiles.length > 0
            ? attachmentFiles.map((f) => ({
                fileName: f.fileName,
                fileUrl: f.fileUrl,
                mimeType: f.mimeType,
              }))
            : undefined,
      });

      // Backend may return upload_errors for partial failures.
      const uploadErrors = (res as any)?.upload_errors;
      const successMsg = uploadErrors?.length
        ? "Assessment created (some files failed to upload)."
        : "Assessment created successfully!";

      Alert.alert("Success", successMsg, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error("❌ Error creating assessment:", error);

      let errorMessage = "Failed to create assessment. Please try again.";

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
            <Text style={styles.headerTitle}>Add Assessment</Text>
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
                placeholder="Enter assessment title"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>
            {/* Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Type <Text style={styles.required}>*</Text>
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeContainer}
              >
                {ASSESSMENT_TYPES.map((assessmentType) => (
                  <TouchableOpacity
                    key={assessmentType.value}
                    style={[
                      styles.typeOption,
                      type === assessmentType.value &&
                        styles.typeOptionSelected,
                    ]}
                    onPress={() => setType(assessmentType.value)}
                  >
                    <Ionicons
                      name={assessmentType.icon as any}
                      size={20}
                      color={
                        type === assessmentType.value
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.typeText,
                        type === assessmentType.value &&
                          styles.typeTextSelected,
                      ]}
                    >
                      {assessmentType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* Total Points Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Total Points <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                placeholderTextColor={theme.colors.textTertiary}
                value={totalPoints}
                onChangeText={setTotalPoints}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            {/* Due Date Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Due Date <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (e.g., 2024-12-25)"
                placeholderTextColor={theme.colors.textTertiary}
                value={dueDate}
                onChangeText={setDueDate}
                maxLength={10}
              />
              <Text style={styles.helperText}>
                Format: YYYY-MM-DD (e.g., 2024-12-25)
              </Text>
            </View>
            {/* Due Time Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Due Time <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM (e.g., 14:30)"
                placeholderTextColor={theme.colors.textTertiary}
                value={dueTime}
                onChangeText={setDueTime}
                maxLength={5}
              />
              <Text style={styles.helperText}>
                Format: HH:MM in 24-hour format (e.g., 14:30 for 2:30 PM)
              </Text>
            </View>
            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description of the assessment..."
                placeholderTextColor={theme.colors.textTertiary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
            </View>
            {/* Instructions Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Detailed instructions for students..."
                placeholderTextColor={theme.colors.textTertiary}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>
            {/* Allow Late Submissions Toggle */}
            <View style={styles.toggleGroup}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleLabel}>Allow Late Submissions</Text>
                <Text style={styles.toggleDescription}>
                  Students can submit after due date
                </Text>
              </View>
              <Switch
                value={allowLateSubmissions}
                onValueChange={setAllowLateSubmissions}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.onPrimary}
              />
            </View>
            {/* Late Penalty Input (conditional) */}
            {allowLateSubmissions && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Late Penalty (%)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor={theme.colors.textTertiary}
                  value={latePenalty}
                  onChangeText={setLatePenalty}
                  keyboardType="number-pad"
                  maxLength={3}
                />
                <Text style={styles.helperText}>
                  Penalty percentage per day late
                </Text>
              </View>
            )}{" "}
            {/* Visible to Students Toggle */}
            <View style={styles.toggleGroup}>
              <View style={styles.toggleLeft}>
                <Text style={styles.toggleLabel}>Visible to Students</Text>
                <Text style={styles.toggleDescription}>
                  Make assessment visible immediately
                </Text>
              </View>
              <Switch
                value={visibleToStudents}
                onValueChange={setVisibleToStudents}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.onPrimary}
              />
            </View>
            {/* File Attachments Section */}
            <View style={styles.sectionDivider} />
            <View style={styles.inputGroup}>
              <View style={styles.fileHeaderContainer}>
                <Text style={styles.label}>Attachments (Optional)</Text>
                <TouchableOpacity
                  style={styles.addFileButton}
                  onPress={handlePickDocument}
                >
                  <Ionicons
                    name="add-circle"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.addFileButtonText}>Add Files</Text>
                </TouchableOpacity>
              </View>

              {attachmentFiles.length > 0 && (
                <View style={styles.filesContainer}>
                  {attachmentFiles.map((file, index) => (
                    <View key={index} style={styles.fileItem}>
                      <View style={styles.fileIconContainer}>
                        <Ionicons
                          name="document-attach"
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.fileInfo}>
                        <Text style={styles.fileName} numberOfLines={1}>
                          {file.fileName}
                        </Text>
                        <Text style={styles.fileSize}>
                          {formatFileSize(file.fileSize)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeFileButton}
                        onPress={() => handleRemoveFile(index)}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {attachmentFiles.length === 0 && (
                <View style={styles.emptyFilesContainer}>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={40}
                    color={theme.colors.textTertiary}
                  />
                  <Text style={styles.emptyFilesText}>
                    No files attached yet
                  </Text>
                  <Text style={styles.emptyFilesSubtext}>
                    Add PDFs, images, or other files for students
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleCreateAssessment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={theme.colors.onPrimary}
                />
                <Text style={styles.submitButtonText}>Create Assessment</Text>
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
    minHeight: 100,
    paddingTop: theme.spacing.md,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: 6,
  },
  typeOptionSelected: {
    backgroundColor: theme.colors.primary + "10",
    borderColor: theme.colors.primary,
  },
  typeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  typeTextSelected: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  toggleGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  toggleLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  fileHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  addFileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addFileButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  filesContainer: {
    gap: theme.spacing.sm,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
  },
  fileInfo: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },
  fileSize: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  removeFileButton: {
    padding: 4,
  },
  emptyFilesContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: "dashed",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  emptyFilesText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  emptyFilesSubtext: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    textAlign: "center",
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
