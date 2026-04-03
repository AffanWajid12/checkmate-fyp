import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import {
  Student,
  studentService,
  SubmissionFile,
  teacherSubmissionService,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import DocumentScanner from "react-native-document-scanner-plugin";
import { SafeAreaView } from "react-native-safe-area-context";
import { createPdf } from "react-native-images-to-pdf";
import RNBlobUtil from "react-native-blob-util";
import { compressImagesForPdf } from "@/utils/scanToCompressedPdf";
import { createPdfFromJpegs } from "@/utils/pdfLibImagesToPdf";

type AddSubmissionScreenRouteProp = RouteProp<
  RootStackParamList,
  "AddSubmission"
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddSubmissionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AddSubmissionScreenRouteProp>();
  const { assessmentId, assessmentTitle, courseId } = route.params;
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [files, setFiles] = useState<
    Omit<SubmissionFile, "_id" | "uploadedAt">[]
  >([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEnrolledStudents();
  }, [courseId]);
  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true);
      console.log("📚 Fetching enrolled students for course:", courseId);

      // Fetch first page to get total count
      const firstPage = await studentService.getEnrolledStudents({
        courseId,
        page: 1,
        limit: 100, // Maximum allowed by backend
      });

      console.log(
        "📦 First page response:",
        JSON.stringify(firstPage, null, 2),
      );

      let allStudents = firstPage.students || [];
      const totalPages = firstPage.pagination?.totalPages || 1;

      // Fetch remaining pages if needed
      if (totalPages > 1) {
        console.log(`📄 Fetching ${totalPages - 1} more page(s)...`);
        const pagePromises = [];
        for (let page = 2; page <= totalPages; page++) {
          pagePromises.push(
            studentService.getEnrolledStudents({
              courseId,
              page,
              limit: 100,
            }),
          );
        }
        const remainingPages = await Promise.all(pagePromises);
        remainingPages.forEach((pageData) => {
          allStudents = [...allStudents, ...(pageData.students || [])];
        });
      }

      setStudents(allStudents);
      console.log(`✅ Loaded ${allStudents.length} students`);
    } catch (error: any) {
      console.error("❌ Error fetching students:", error);
      Alert.alert("Error", error.message || "Failed to load students", [
        {
          text: "Go Back",
          onPress: () => navigation.goBack(),
        },
        {
          text: "Retry",
          onPress: fetchEnrolledStudents,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        const newFile: Omit<SubmissionFile, "_id" | "uploadedAt"> = {
          originalName: file.name,
          fileUrl: file.uri,
          fileType: file.mimeType || "application/octet-stream",
          fileSize: file.size || 0,
        };

        setFiles((prev) => [...prev, newFile]);
        console.log("📎 File attached:", newFile.originalName);
      }
    } catch (error) {
      console.error("❌ Error picking document:", error);
      Alert.alert("Error", "Failed to attach file");
    }
  };

  const handleCaptureFile = async () => {
    try {
      console.log("📸 Opening document scanner...");

      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 10,
        croppedImageQuality: 75,
      });

      if (scannedImages && scannedImages.length > 0) {
        console.log(`✅ Scanned ${scannedImages.length} page(s)`);
        console.log("🧾 scannedImages:", scannedImages);

        const normalizeToFileUri = (p: string) =>
          p.startsWith("file://") ? p : `file://${p}`;
        const normalizedImages = scannedImages.map(normalizeToFileUri);

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

        const pages = compressedImages.map((p) => ({ imagePath: p }));

        // Create a single multi-page PDF from the scanned images
        const timestamp = Date.now();
        const outputPath = `file://${RNBlobUtil.fs.dirs.DocumentDir}/scanned_document_${timestamp}.pdf`;

        console.log("🧾 PDF outputPath:", outputPath);

        let pdfUri: string;
        try {
          pdfUri = await createPdfFromJpegs({
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

          const created: any = await createPdf({
            pages,
            outputPath,
          });

          pdfUri =
            typeof created === "string"
              ? created
              : created?.filePath ||
                created?.path ||
                created?.pdfPath ||
                outputPath;
        }
        const normalizedPdfUri = pdfUri.startsWith("file://")
          ? pdfUri
          : `file://${pdfUri}`;

        let fileSize = 0;
        try {
          const filePath = normalizedPdfUri.replace(/^file:\/\//, "");
          const stat = await RNBlobUtil.fs.stat(filePath);
          fileSize = Number(stat?.size) || 0;
        } catch (e: any) {
          console.log("⚠️ Could not stat created PDF", {
            uri: normalizedPdfUri,
            message: e?.message,
          });
        }

        console.log("✅ PDF created at:", normalizedPdfUri, "size:", fileSize);

        const newFile: Omit<SubmissionFile, "_id" | "uploadedAt"> = {
          originalName: `scanned_document_${timestamp}.pdf`,
          fileUrl: normalizedPdfUri,
          fileType: "application/pdf",
          fileSize,
        };

        setFiles((prev) => [...prev, newFile]);

        Alert.alert("Success", "PDF created from scanned pages successfully");
      }
    } catch (error: any) {
      console.error("❌ Document scanner error:", error);

      if (error.message && error.message.includes("User cancelled")) {
        console.log("ℹ️ User cancelled scanning");
        return;
      }

      Alert.alert(
        "Scanner Error",
        "Failed to scan and generate PDF. Please ensure camera permissions are granted.",
      );
    }
  };

  const handleRemoveFile = (index: number) => {
    Alert.alert("Remove File", "Are you sure you want to remove this file?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setFiles((prev) => prev.filter((_, i) => i !== index));
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedStudentId) {
      Alert.alert("Validation Error", "Please select a student");
      return;
    }

    if (files.length === 0) {
      Alert.alert("Validation Error", "Please attach at least one file");
      return;
    }

    try {
      setSubmitting(true);
      console.log("📤 Creating submission (teacher endpoint)...");

      await teacherSubmissionService.createSubmissionForStudent(
        courseId,
        assessmentId,
        selectedStudentId,
        files.map((f) => ({
          uri: f.fileUrl,
          name: f.originalName,
          type: f.fileType,
        })),
      );

      Alert.alert("Success", "Submission created successfully", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error("❌ Error creating submission:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error.message ||
          "Failed to create submission",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "document-text";
    if (fileType.includes("image")) return "image";
    if (fileType.includes("video")) return "videocam";
    return "document-attach";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
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
          <Text style={styles.headerTitle}>Add Submission</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Add Submission</Text>
          <Text style={styles.headerSubtitle}>{assessmentTitle}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>{" "}
      <ScrollView style={styles.content}>
        {/* Student Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Select Student
            <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowStudentPicker(true)}
            disabled={submitting}
          >
            <Text
              style={[
                styles.dropdownButtonText,
                !selectedStudentId && styles.dropdownPlaceholder,
              ]}
            >
              {selectedStudentId
                ? (() => {
                    const student = students.find(
                      (s) => s.id === selectedStudentId,
                    );
                    return student
                      ? `${student.firstName} ${student.lastName} (${student.studentNumber})`
                      : "-- Select a student --";
                  })()
                : "-- Select a student --"}
            </Text>
            <Ionicons
              name="chevron-down"
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Student Picker Modal */}
        <Modal
          visible={showStudentPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStudentPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Student</Text>
                <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.studentItem,
                      selectedStudentId === item.id &&
                        styles.studentItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedStudentId(item.id);
                      setShowStudentPicker(false);
                    }}
                  >
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>
                        {item.firstName[0]}
                        {item.lastName[0]}
                      </Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <Text style={styles.studentNumber}>
                        {item.studentNumber}
                      </Text>
                    </View>
                    {selectedStudentId === item.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>
                      No students enrolled in this course
                    </Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* File Actions */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Files <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.fileActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAttachFile}
              disabled={submitting}
            >
              <Ionicons
                name="attach-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.actionButtonText}>Attach File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCaptureFile}
              disabled={submitting}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.actionButtonText}>Scan Document</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Files List */}
        {files.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Attached Files ({files.length})</Text>
            {files.map((file, index) => (
              <View key={index} style={styles.fileItem}>
                <View style={styles.fileIcon}>
                  <Ionicons
                    name={getFileIcon(file.fileType)}
                    size={24}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.originalName}
                  </Text>
                  <Text style={styles.fileSize}>
                    {formatFileSize(file.fileSize)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveFile(index)}
                  disabled={submitting}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color={theme.colors.error}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about this submission..."
            placeholderTextColor={theme.colors.placeholder}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            maxLength={1000}
            editable={!submitting}
          />
          <Text style={styles.charCount}>{notes.length}/1000</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || !selectedStudentId || files.length === 0) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !selectedStudentId || files.length === 0}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  required: {
    color: theme.colors.error,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    height: 50,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: theme.colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  studentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  studentItemSelected: {
    backgroundColor: theme.colors.primary + "15",
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  studentAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  studentNumber: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyList: {
    padding: theme.spacing.xl,
    alignItems: "center",
  },
  emptyListText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  pickerContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  fileActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.xs,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  notesInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textPrimary,
    textAlignVertical: "top",
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "right",
    marginTop: theme.spacing.xs,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: 8,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
