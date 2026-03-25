import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { apiClient } from "@/services/api/config";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewSubmissionDetailRouteProp = RouteProp<RootStackParamList, "ViewSubmissionDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type BackendAttachment = {
  id: string;
  signed_url: string;
  file_name: string;
  mime_type?: string;
  file_size?: number;
};

type BackendSubmission = {
  id: string;
  status?: "SUBMITTED" | "LATE" | "GRADED";
  submitted_at?: string;
  grade?: number | null;
  feedback?: string | null;
  user?: {
    id: string;
    name?: string;
    email?: string;
    profile_picture?: string;
  };
  attachments?: BackendAttachment[];
};

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  SUBMITTED: { label: "Submitted", bg: "#DCFCE7", color: "#16A34A" },
  LATE: { label: "Late", bg: "#FEF3C7", color: "#D97706" },
  GRADED: { label: "Graded", bg: "#DBEAFE", color: "#2563EB" },
};

export default function ViewSubmissionDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewSubmissionDetailRouteProp>();
  const { courseId, assessmentId, submissionId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submission, setSubmission] = useState<BackendSubmission | null>(null);

  const [grade, setGrade] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  const isGraded = submission?.status === "GRADED";

  const statusMeta = useMemo(() => {
    const key = submission?.status ?? "SUBMITTED";
    return STATUS_META[key] ?? STATUS_META.SUBMITTED;
  }, [submission?.status]);

  const fetchSubmission = async () => {
    if (!courseId || !assessmentId || !submissionId) {
      Alert.alert("Error", "Missing route params.");
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.get(
        `/api/courses/${courseId}/assessments/${assessmentId}/submissions/${submissionId}`
      );
      const sub = (data?.submission ?? null) as BackendSubmission | null;
      setSubmission(sub);
      if (sub) {
        setGrade(sub.grade === null || sub.grade === undefined ? "" : String(sub.grade));
        setFeedback(sub.feedback ?? "");
      }
    } catch (e: any) {
      console.error("❌ Error fetching submission details:", e);
      Alert.alert("Error", e?.response?.data?.error ?? "Failed to load submission details");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSubmission();
    }, [courseId, assessmentId, submissionId])
  );

  const handleOpenUrl = async (url?: string) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Can't open link", "No handler available for this URL.");
      return;
    }
    await Linking.openURL(url);
  };

  const handleSaveGrade = async () => {
    const parsed = Number(grade);
    if (Number.isNaN(parsed)) {
      Alert.alert("Invalid grade", "Please enter a valid numeric grade.");
      return;
    }

    try {
      setSaving(true);
      await apiClient.patch(
        `/api/courses/${courseId}/assessments/${assessmentId}/submissions/${submissionId}/grade`,
        {
          grade: parsed,
          feedback: feedback.trim() || undefined,
        }
      );
      Alert.alert("Saved", "Grade saved.");
      await fetchSubmission();
    } catch (e: any) {
      console.error("❌ Error saving grade:", e);
      const status = e?.response?.status;
      if (status === 501) {
        Alert.alert("Not implemented", "Grading is not yet implemented on the server.");
      } else {
        Alert.alert("Error", e?.response?.data?.error ?? "Failed to save grade");
      }
    } finally {
      setSaving(false);
    }
  };

  const studentName = submission?.user?.name ?? "Unknown Student";
  const studentEmail = submission?.user?.email ?? "";
  const initial = (studentName[0] ?? "?").toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submission</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading submission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!submission) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submission</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Failed to load submission</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubmission}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submission</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Student header */}
          <View style={styles.card}>
            <View style={styles.studentHeaderRow}>
              <View style={styles.studentCluster}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {studentName}
                  </Text>
                  {studentEmail ? <Text style={styles.studentEmail}>{studentEmail}</Text> : null}
                </View>
              </View>

              <View style={styles.statusCluster}>
                <View style={[styles.statusChip, { backgroundColor: statusMeta.bg }]}>
                  <Text style={[styles.statusChipText, { color: statusMeta.color }]}>
                    {statusMeta.label}
                  </Text>
                </View>
                <Text style={styles.submittedAt}>
                  Submitted {formatDateTime(submission.submitted_at)}
                </Text>
              </View>
            </View>

            {isGraded ? (
              <View style={styles.gradedRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gradedLabel}>Grade</Text>
                  <Text style={styles.gradedValue}>{submission.grade ?? "—"}</Text>
                </View>
                {submission.feedback ? (
                  <View style={{ flex: 2 }}>
                    <Text style={styles.gradedLabel}>Feedback</Text>
                    <Text style={styles.gradedFeedback}>{submission.feedback}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Attachments */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Submitted Files
              <Text style={styles.sectionCount}>
                {` (${submission.attachments?.length ?? 0})`}
              </Text>
            </Text>

            {submission.attachments && submission.attachments.length > 0 ? (
              <View style={{ gap: 10 }}>
                {submission.attachments.map((att) => (
                  <TouchableOpacity
                    key={att.id}
                    onPress={() => handleOpenUrl(att.signed_url)}
                    style={styles.attachmentRow}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {att.file_name}
                      </Text>
                      <Text style={styles.attachmentMeta}>
                        {(att.mime_type ?? "").toUpperCase()}
                        {att.file_size ? ` • ${formatBytes(att.file_size)}` : ""}
                      </Text>
                    </View>
                    <Ionicons name="open-outline" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.muted}>No files attached to this submission.</Text>
            )}
          </View>

          {/* Grade form */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Grade this Submission</Text>

            <Text style={styles.fieldLabel}>Score *</Text>
            <TextInput
              value={grade}
              onChangeText={setGrade}
              placeholder="e.g. 87.5"
              keyboardType="numeric"
              editable={!isGraded && !saving}
              style={[styles.input, isGraded ? styles.inputDisabled : null]}
            />

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Feedback (optional)</Text>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Write feedback for the student…"
              multiline
              numberOfLines={4}
              editable={!isGraded && !saving}
              style={[styles.textarea, isGraded ? styles.inputDisabled : null]}
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 14 }}>
              <TouchableOpacity
                onPress={handleSaveGrade}
                style={[styles.saveButton, isGraded || saving || !grade ? styles.saveButtonDisabled : null]}
                disabled={isGraded || saving || !grade}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>{isGraded ? "Already Graded" : "Save Grade"}</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightPlaceholder: {
    width: 44,
    height: 44,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  studentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  studentCluster: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "800",
    color: "#2563EB",
  },
  studentName: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  studentEmail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusCluster: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  submittedAt: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  gradedRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: "row",
    gap: 14,
  },
  gradedLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  gradedValue: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.colors.textPrimary,
  },
  gradedFeedback: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  attachmentMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  muted: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
  },
  textarea: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 100,
    textAlignVertical: "top",
    color: theme.colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});
