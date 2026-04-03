import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { assessmentService, teacherSubmissionService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import DocumentScanner from "react-native-document-scanner-plugin";
import { createPdf } from "react-native-images-to-pdf";
import RNBlobUtil from "react-native-blob-util";
import { compressImagesForPdf } from "@/utils/scanToCompressedPdf";
import { createPdfFromJpegs } from "@/utils/pdfLibImagesToPdf";
import SubmissionOptionsDrawer from "./SubmissionOptionsDrawer";

type ViewAssessmentDetailScreenRouteProp = RouteProp<
  RootStackParamList,
  "ViewAssessmentDetail"
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type BackendAssessmentType = "QUIZ" | "ASSIGNMENT" | "EXAM";

type BackendSourceMaterial = {
  id: string;
  signed_url: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

type BackendAssessment = {
  id: string;
  title: string;
  type: BackendAssessmentType;
  instructions?: string;
  due_date?: string;
  createdAt?: string;
  source_materials?: BackendSourceMaterial[];
};

type SubmissionLike = {
  id: string;
  name?: string;
  submitted_at?: string;
  status?: "SUBMITTED" | "LATE" | "GRADED" | string;
  user?: {
    id: string;
    name: string;
    profile_picture?: string;
  };
};

type TeacherAssessmentDetailsResponse = {
  message?: string;
  assessment: BackendAssessment;
  submitted?: SubmissionLike[];
  late?: SubmissionLike[];
  not_submitted?: SubmissionLike[];
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

const isOverdue = (due?: string) => !!due && new Date(due) < new Date();

const TYPE_META: Record<
  BackendAssessmentType,
  { label: string; pillBg: string; pillText: string }
> = {
  QUIZ: { label: "Quiz", pillBg: "#DBEAFE", pillText: "#2563EB" },
  ASSIGNMENT: { label: "Assignment", pillBg: "#EDE9FE", pillText: "#7C3AED" },
  EXAM: { label: "Exam", pillBg: "#FEF3C7", pillText: "#D97706" },
};

const STATUS_META = {
  SUBMITTED: { label: "Submitted", color: "#16A34A", bg: "#DCFCE7" },
  LATE: { label: "Late", color: "#D97706", bg: "#FEF3C7" },
  NOT_SUBMITTED: {
    label: "Not Submitted",
    color: theme.colors.textSecondary,
    bg: theme.colors.border,
  },
} as const;

export default function ViewAssessmentDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewAssessmentDetailScreenRouteProp>();
  const { courseId, assessmentId, courseCode } = route.params;

  type ProcessingStep = "compress" | "create_pdf" | "upload";
  const [processingVisible, setProcessingVisible] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(
    null,
  );
  const yieldToUi = () =>
    new Promise<void>((resolve) => setTimeout(resolve, 50));

  const [activeTab, setActiveTab] = useState<"details" | "submissions">(
    "details",
  );
  const [data, setData] = useState<TeacherAssessmentDetailsResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchDetails = async (isRefresh = false) => {
    if (!courseId || !assessmentId) {
      Alert.alert("Error", "Course ID or Assessment ID is missing");
      navigation.goBack();
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const payload: any = await assessmentService.getAssessmentById(
        courseId,
        assessmentId,
      );
      setData(payload as TeacherAssessmentDetailsResponse);
    } catch (error: any) {
      console.error("❌ Error fetching assessment details:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to load assessment details",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetails(false);
    }, [courseId, assessmentId]),
  );

  const assessment = data?.assessment;
  const submitted = data?.submitted ?? [];
  const late = data?.late ?? [];
  const notSubmitted = data?.not_submitted ?? [];

  const total = submitted.length + late.length + notSubmitted.length;
  const done = submitted.length + late.length;

  const q = search.trim().toLowerCase();
  const filterName = useCallback(
    (s: SubmissionLike) =>
      (s.user?.name ?? s.name ?? "").toLowerCase().includes(q),
    [q],
  );

  const filtered = useMemo(() => {
    return {
      submitted: submitted.filter(filterName),
      late: late.filter(filterName),
      notSubmitted: notSubmitted.filter(filterName),
    };
  }, [submitted, late, notSubmitted, filterName]);

  const handleOpenUrl = async (url?: string) => {
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert("Can't open link", "No handler available for this URL.");
      return;
    }
    await Linking.openURL(url);
  };

  const renderPill = (type?: BackendAssessmentType) => {
    const meta = type ? TYPE_META[type] : undefined;
    if (!meta) return null;

    return (
      <View style={[styles.pill, { backgroundColor: meta.pillBg }]}>
        <Text style={[styles.pillText, { color: meta.pillText }]}>
          {meta.label}
        </Text>
      </View>
    );
  };

  const renderTabButton = (key: "details" | "submissions", label: string) => (
    <TouchableOpacity
      onPress={() => setActiveTab(key)}
      style={[
        styles.tabButton,
        activeTab === key ? styles.tabButtonActive : null,
      ]}
      activeOpacity={0.85}
    >
      <Text
        style={[
          styles.tabButtonText,
          activeTab === key ? styles.tabButtonTextActive : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSubmissionRow = (
    item: SubmissionLike,
    status: keyof typeof STATUS_META,
  ) => {
    const name = item.user?.name ?? item.name ?? "Unknown";
    const initial = (name[0] ?? "?").toUpperCase();

    const isGraded = item.status === "GRADED";

    const chipLabel =
      status === "NOT_SUBMITTED"
        ? "Not Submitted"
        : isGraded
          ? "Graded"
          : "Not graded";
    const chipColor =
      status === "NOT_SUBMITTED"
        ? STATUS_META.NOT_SUBMITTED.color
        : isGraded
          ? "#16A34A"
          : "#D97706";
    const chipBg =
      status === "NOT_SUBMITTED"
        ? STATUS_META.NOT_SUBMITTED.bg
        : isGraded
          ? "#DCFCE7"
          : "#FEF3C7";

    const canReview = status !== "NOT_SUBMITTED";

    return (
      <View key={item.id} style={styles.submissionRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.submissionRowMain}>
          <Text style={styles.submissionName} numberOfLines={1}>
            {name}
          </Text>
          {item.submitted_at ? (
            <Text style={styles.submissionSubtext}>
              {formatDateTime(item.submitted_at)}
            </Text>
          ) : null}
        </View>

        <View style={[styles.statusChip, { backgroundColor: chipBg }]}>
          <Text style={[styles.statusChipText, { color: chipColor }]}>
            {chipLabel}
          </Text>
        </View>

        {canReview ? (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("ViewSubmissionDetail", {
                courseId,
                assessmentId,
                submissionId: item.id,
                courseCode,
              });
            }}
            style={styles.reviewButton}
          >
            <Text style={styles.reviewButtonText}>Review →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              const studentId = item.user?.id ?? item.id;
              if (!studentId) {
                Alert.alert(
                  "Missing student",
                  "Can't create a submission because the student id is missing.",
                );
                return;
              }
              setSelectedStudent({ id: studentId, name });
              setDrawerVisible(true);
            }}
            style={styles.reviewButton}
          >
            <Text style={styles.reviewButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const pickPdfFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf"],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return [];
    return result.assets.map((a) => ({
      uri: a.uri,
      name: a.name ?? "submission.pdf",
      type: a.mimeType ?? "application/pdf",
    }));
  };

  const scanToPdfFile = async () => {
    let result: { scannedImages?: string[] } | undefined;
    try {
      result = await DocumentScanner.scanDocument({
        maxNumDocuments: 10,
        croppedImageQuality: 75,
      });
    } catch (e: any) {
      if (e?.message && e.message.includes("User cancelled")) {
        return null;
      }
      throw e;
    }
    if (!result?.scannedImages?.length) return null;

    const normalizeToFileUri = (p: string) =>
      p.startsWith("file://") ? p : `file://${p}`;

    const normalizedImages = result.scannedImages.map(normalizeToFileUri);

    // Diagnostics: log original scan sizes and dimensions
    await Promise.all(
      normalizedImages.map(async (uri) => {
        try {
          const filePath = uri.replace(/^file:\/\//, "");
          const stat = await RNBlobUtil.fs.stat(filePath);
          const size = Number(stat?.size) || 0;

          await new Promise<void>((resolve) => {
            Image.getSize(
              uri,
              (width, height) => {
                console.log("🧾 Scan image (original):", {
                  uri,
                  size,
                  width,
                  height,
                });
                resolve();
              },
              () => {
                console.log("🧾 Scan image (original):", {
                  uri,
                  size,
                  width: null,
                  height: null,
                });
                resolve();
              },
            );
          });
        } catch (e: any) {
          console.log("⚠️ Could not stat original scan image", {
            uri,
            message: e?.message,
          });
        }
      }),
    );

    try {
      setProcessingVisible(true);
      setProcessingStep("compress");
      await yieldToUi();

      const compressedImages = await compressImagesForPdf(normalizedImages);

      // Diagnostics: log compressed image sizes and dimensions
      await Promise.all(
        compressedImages.map(async (uri) => {
          try {
            const filePath = uri.replace(/^file:\/\//, "");
            const stat = await RNBlobUtil.fs.stat(filePath);
            const size = Number(stat?.size) || 0;

            await new Promise<void>((resolve) => {
              Image.getSize(
                uri,
                (width, height) => {
                  console.log("🧾 Scan image (compressed):", {
                    uri,
                    size,
                    width,
                    height,
                  });
                  resolve();
                },
                () => {
                  console.log("🧾 Scan image (compressed):", {
                    uri,
                    size,
                    width: null,
                    height: null,
                  });
                  resolve();
                },
              );
            });
          } catch (e: any) {
            console.log("⚠️ Could not stat compressed scan image", {
              uri,
              message: e?.message,
            });
          }
        }),
      );

      setProcessingStep("create_pdf");
      await yieldToUi();

      const pages = compressedImages.map((p) => ({ imagePath: p }));

      const timestamp = Date.now();
      const outputPath = `file://${RNBlobUtil.fs.dirs.DocumentDir}/scan-${timestamp}.pdf`;

      let created: any;
      try {
        created = await createPdfFromJpegs({
          imageUris: compressedImages,
          outputPath,
        });
      } catch (e: any) {
        console.log(
          "⚠️ pdf-lib PDF generation failed; falling back to native createPdf",
          {
            message: e?.message,
          },
        );
        created = await createPdf({
          pages,
          outputPath,
        });
      }

      const pdfUri =
        typeof created === "string"
          ? created
          : created?.filePath ||
            created?.path ||
            created?.pdfPath ||
            outputPath;

      const normalizedPdfUri = pdfUri.startsWith("file://")
        ? pdfUri
        : `file://${pdfUri}`;

      try {
        const filePath = normalizedPdfUri.replace(/^file:\/\//, "");
        const stat = await RNBlobUtil.fs.stat(filePath);
        console.log("📄 Created PDF:", {
          uri: normalizedPdfUri,
          size: stat?.size,
        });
      } catch (e: any) {
        console.log("⚠️ Could not stat created PDF", {
          uri: normalizedPdfUri,
          message: e?.message,
        });
      }

      return {
        uri: normalizedPdfUri,
        name: `scan-${timestamp}.pdf`,
        type: "application/pdf",
      };
    } catch (e) {
      setProcessingVisible(false);
      setProcessingStep(null);
      throw e;
    }
  };

  const handleCreateSubmissionWithFiles = async (
    files: { uri: string; name: string; type?: string }[],
  ) => {
    if (!selectedStudent) {
      Alert.alert("Select a student", "Please choose a student first.");
      return;
    }
    if (!files.length) return;

    try {
      setDrawerVisible(false);

      setProcessingVisible(true);
      setProcessingStep("upload");
      await yieldToUi();

      const created = await teacherSubmissionService.createSubmissionForStudent(
        courseId,
        assessmentId,
        selectedStudent.id,
        files,
      );

      const submissionId = created?.submission?.id ?? created?.id;
      if (submissionId) {
        navigation.navigate("ViewSubmissionDetail", {
          courseId,
          assessmentId,
          submissionId,
          courseCode,
        });
      }

      await fetchDetails(true);
    } catch (error: any) {
      console.error("❌ Error creating submission:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to create submission",
      );
    } finally {
      setProcessingVisible(false);
      setProcessingStep(null);
      setSelectedStudent(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
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
          <Text style={styles.headerTitle}>Assessment</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading assessment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
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
          <Text style={styles.headerTitle}>Assessment</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Failed to load assessment</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchDetails(false)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typeMeta = TYPE_META[assessment.type] ?? TYPE_META.ASSIGNMENT;
  const overdue = isOverdue(assessment.due_date);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {courseCode}
        </Text>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => Alert.alert("Info", "More actions not implemented")}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={24}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDetails(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Page header (like frontend) */}
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderTopRow}>
            {renderPill(assessment.type)}
            {assessment.due_date ? (
              <Text
                style={[
                  styles.dueInline,
                  {
                    color: overdue
                      ? (theme.colors.error ?? "#EF4444")
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {overdue ? "Was due " : "Due "}
                {formatDateTime(assessment.due_date)}
              </Text>
            ) : null}
          </View>
          <Text style={styles.pageTitle}>{assessment.title}</Text>
          <Text style={styles.submissionCount}>
            {submitted.length + late.length} submission
            {submitted.length + late.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {renderTabButton("details", "Assessment Details")}
          {renderTabButton(
            "submissions",
            `Submissions (${submitted.length + late.length})`,
          )}
        </View>

        {/* Tab content */}
        {activeTab === "details" ? (
          <View style={styles.tabContent}>
            {/* Instructions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Instructions</Text>
              {assessment.instructions ? (
                <Text style={styles.cardBodyText}>
                  {assessment.instructions}
                </Text>
              ) : (
                <Text style={styles.cardBodyMuted}>
                  No instructions provided.
                </Text>
              )}
            </View>

            {/* Source materials */}
            {assessment.source_materials?.length ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Source Materials
                  <Text style={styles.cardTitleHint}>
                    {" "}
                    ({assessment.source_materials.length})
                  </Text>
                </Text>
                <View style={styles.materialsWrap}>
                  {assessment.source_materials.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.materialChip}
                      activeOpacity={0.85}
                      onPress={() => handleOpenUrl(m.signed_url)}
                    >
                      <Ionicons
                        name={
                          m.mime_type === "application/pdf"
                            ? "document-text-outline"
                            : "document-outline"
                        }
                        size={16}
                        color={
                          m.mime_type === "application/pdf"
                            ? "#EF4444"
                            : theme.colors.primary
                        }
                      />
                      <Text style={styles.materialName} numberOfLines={1}>
                        {m.file_name ?? "File"}
                      </Text>
                      <Ionicons
                        name="open-outline"
                        size={14}
                        color={theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Settings (like frontend right sidebar) */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Settings</Text>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Type</Text>
                <View
                  style={[
                    styles.settingPill,
                    { backgroundColor: typeMeta.pillBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.settingPillText,
                      { color: typeMeta.pillText },
                    ]}
                  >
                    {typeMeta.label}
                  </Text>
                </View>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Due Date</Text>
                <Text style={styles.settingValue}>
                  {assessment.due_date
                    ? formatDateTime(assessment.due_date)
                    : "No deadline"}
                </Text>
              </View>

              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Created</Text>
                <Text style={styles.settingValue}>
                  {formatDateTime(assessment.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* Summary */}
            <View style={styles.card}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTitle}>
                  {done} / {total} submitted
                </Text>
                <Text style={styles.summaryMuted}>
                  {notSubmitted.length} missing
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: total ? `${(done / total) * 100}%` : "0%" },
                  ]}
                />
              </View>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={theme.colors.textSecondary}
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by student name…"
                placeholderTextColor={theme.colors.textSecondary}
                style={styles.searchInput}
              />
            </View>

            {/* Sections */}
            {filtered.submitted.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[styles.sectionDot, { backgroundColor: "#16A34A" }]}
                  />
                  <Text style={styles.sectionTitle}>Submitted</Text>
                  <Text style={styles.sectionCount}>
                    ({filtered.submitted.length})
                  </Text>
                </View>
                <View style={styles.sectionCard}>
                  {filtered.submitted.map((s) =>
                    renderSubmissionRow(s, "SUBMITTED"),
                  )}
                </View>
              </View>
            )}

            {filtered.late.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[styles.sectionDot, { backgroundColor: "#F59E0B" }]}
                  />
                  <Text style={styles.sectionTitle}>Late</Text>
                  <Text style={styles.sectionCount}>
                    ({filtered.late.length})
                  </Text>
                </View>
                <View style={styles.sectionCard}>
                  {filtered.late.map((s) => renderSubmissionRow(s, "LATE"))}
                </View>
              </View>
            )}

            {filtered.notSubmitted.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.sectionDot,
                      { backgroundColor: theme.colors.textSecondary },
                    ]}
                  />
                  <Text style={styles.sectionTitle}>Not Submitted</Text>
                  <Text style={styles.sectionCount}>
                    ({filtered.notSubmitted.length})
                  </Text>
                </View>
                <View style={styles.sectionCard}>
                  {filtered.notSubmitted.map((s) =>
                    renderSubmissionRow(s, "NOT_SUBMITTED"),
                  )}
                </View>
              </View>
            )}

            {filtered.submitted.length === 0 &&
            filtered.late.length === 0 &&
            filtered.notSubmitted.length === 0 ? (
              <Text style={styles.noMatchesText}>
                No students match your search.
              </Text>
            ) : null}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <SubmissionOptionsDrawer
        visible={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setSelectedStudent(null);
        }}
        onAddFileSubmission={async () => {
          const files = await pickPdfFiles();
          await handleCreateSubmissionWithFiles(files);
        }}
        onCaptureSubmission={async () => {
          const f = await scanToPdfFile();
          await handleCreateSubmissionWithFiles(f ? [f] : []);
        }}
      />

      <Modal
        visible={processingVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          // Non-cancelable by design during file ops.
        }}
      >
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <Ionicons
              name={
                processingStep === "compress"
                  ? "images-outline"
                  : processingStep === "create_pdf"
                    ? "document-text-outline"
                    : processingStep === "upload"
                      ? "cloud-upload-outline"
                      : "hourglass-outline"
              }
              size={44}
              color={theme.colors.primary}
              style={styles.processingHeaderIcon}
            />
            <Text style={styles.processingTitle}>Preparing submission…</Text>

            {(
              [
                {
                  key: "compress" as const,
                  label: "Compressing images",
                  icon: "images-outline" as const,
                },
                {
                  key: "create_pdf" as const,
                  label: "Creating PDF",
                  icon: "document-text-outline" as const,
                },
                {
                  key: "upload" as const,
                  label: "Uploading submission",
                  icon: "cloud-upload-outline" as const,
                },
              ] as const
            ).map((s) => {
              const order: ProcessingStep[] = [
                "compress",
                "create_pdf",
                "upload",
              ];
              const currentIndex = processingStep
                ? order.indexOf(processingStep)
                : -1;
              const stepIndex = order.indexOf(s.key);
              const isDone = currentIndex !== -1 && stepIndex < currentIndex;
              const isActive = processingStep === s.key;

              return (
                <View key={s.key} style={styles.processingStepRow}>
                  {isDone ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={theme.colors.primary}
                    />
                  ) : isActive ? (
                    <Ionicons
                      name={s.icon}
                      size={18}
                      color={theme.colors.primary}
                    />
                  ) : (
                    <Ionicons
                      name={s.icon}
                      size={18}
                      color={theme.colors.textSecondary}
                    />
                  )}
                  <Text
                    style={[
                      styles.processingStepText,
                      isActive ? styles.processingStepTextActive : null,
                      isDone ? styles.processingStepTextDone : null,
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
    flex: 1,
    textAlign: "center",
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  headerRightPlaceholder: { width: 40 },

  scrollView: { flex: 1 },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  processingCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: "center",
    ...theme.shadows.md,
  },
  processingHeaderIcon: {
    marginBottom: theme.spacing.sm,
  },
  processingTitle: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  processingStepRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  processingStepProcessIcon: {
    marginLeft: theme.spacing.sm,
  },
  processingStepText: {
    marginLeft: theme.spacing.xs,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  processingStepTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  processingStepTextDone: {
    color: theme.colors.textPrimary,
  },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  retryButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: { color: theme.colors.onPrimary, fontWeight: "700" },

  pageHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  pageHeaderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
  },
  pageTitle: {
    marginTop: theme.spacing.sm,
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  submissionCount: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  dueInline: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },

  tabs: {
    flexDirection: "row",
    gap: 6,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.border,
    padding: 4,
    borderRadius: 14,
    alignSelf: "flex-start",
  },
  tabButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  tabButtonActive: { backgroundColor: theme.colors.card, ...theme.shadows.sm },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: { color: theme.colors.textPrimary },

  tabContent: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.md },

  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  cardTitleHint: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  cardBodyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  cardBodyMuted: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },

  materialsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  materialChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    maxWidth: "100%",
  },
  materialName: {
    flexShrink: 1,
    maxWidth: 220,
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
  },
  settingValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  settingPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  settingPillText: { fontSize: 12, fontWeight: "800" },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: "800" },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  summaryMuted: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: 8, backgroundColor: "#16A34A" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  searchInput: { flex: 1, fontSize: 13, color: theme.colors.textPrimary },

  section: { gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 999 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },

  submissionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "800", color: theme.colors.primary },
  submissionRowMain: { flex: 1, minWidth: 0 },
  submissionName: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textPrimary,
  },
  submissionSubtext: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusChipText: { fontSize: 11, fontWeight: "800" },
  reviewButton: { paddingHorizontal: 8, paddingVertical: 6 },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.primary,
  },

  noMatchesText: {
    textAlign: "center",
    paddingVertical: 18,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
