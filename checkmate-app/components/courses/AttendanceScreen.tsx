import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { attendanceService, type AttendanceStatus, type AttendanceSession } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AttendanceScreenRouteProp = RouteProp<RootStackParamList, "Attendance">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Student = {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
};

const STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE"];

const STATUS_META: Record<AttendanceStatus, { label: string; bg: string; color: string }> = {
  PRESENT: { label: "Present", bg: "#DCFCE7", color: "#16A34A" },
  ABSENT: { label: "Absent", bg: "#FEE2E2", color: "#EF4444" },
  LATE: { label: "Late", bg: "#FEF3C7", color: "#D97706" },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AttendanceScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AttendanceScreenRouteProp>();
  const { courseId, courseTitle, students } = route.params;

  const [activeTab, setActiveTab] = useState<"mark" | "history">("mark");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [history, setHistory] = useState<AttendanceSession[]>([]);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const markedCount = Object.keys(statuses).length;
  const allMarked = students.length > 0 && markedCount === students.length;

  const loadHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const sessions = await attendanceService.getCourseAttendance(courseId);
      setHistory(sessions);
    } catch (e: any) {
      console.error("❌ Error loading attendance history:", e);
      Alert.alert("Error", e?.response?.data?.error ?? "Failed to load attendance history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory(false);
    }, [courseId])
  );

  const resetMarkForm = () => {
    setSessionId(null);
    setTitle("");
    setDate(todayISO());
    setStatuses({});
  };

  const applySessionToForm = (s: AttendanceSession) => {
    setSessionId(s.id);
    setTitle((s.title ?? "") as string);
    setDate((s.date ?? "").slice(0, 10));

    const next: Record<string, AttendanceStatus> = {};
    (s.records ?? []).forEach((r) => {
      const studentId = r.enrollment?.student_id;
      if (studentId) next[studentId] = r.status;
    });
    setStatuses(next);
    setActiveTab("mark");
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      all[s.id] = status;
    });
    setStatuses(all);
  };

  const handleSubmit = async () => {
    const records = students.map((s) => ({
      student_id: s.id,
      status: statuses[s.id] ?? "ABSENT",
    }));

    try {
      setLoading(true);
      await attendanceService.markAttendance(courseId, {
        sessionId,
        date,
        title,
        records,
      });
      Alert.alert("Saved", sessionId ? "Attendance updated." : "Attendance saved.");
      resetMarkForm();
      await loadHistory(false);
    } catch (e: any) {
      console.error("❌ Error saving attendance:", e);
      Alert.alert("Error", e?.response?.data?.error ?? "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    Alert.alert("Delete session?", "This will remove the session and its records.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await attendanceService.deleteAttendanceSession(courseId, id);
            await loadHistory(false);
          } catch (e: any) {
            console.error("❌ Error deleting session:", e);
            Alert.alert("Error", e?.response?.data?.error ?? "Failed to delete session");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Attendance
        </Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {courseTitle}
        </Text>
      </View>
      <View style={styles.headerRightPlaceholder} />
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabRow}>
      {([
        { key: "mark", label: sessionId ? "Edit Session" : "Mark" },
        { key: "history", label: "History" },
      ] as const).map((t) => (
        <TouchableOpacity
          key={t.key}
          onPress={() => setActiveTab(t.key)}
          style={[styles.tabButton, activeTab === t.key ? styles.tabButtonActive : null]}
        >
          <Text style={[styles.tabButtonText, activeTab === t.key ? styles.tabButtonTextActive : null]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}

      {sessionId && activeTab === "mark" ? (
        <TouchableOpacity
          style={styles.newSessionButton}
          onPress={() => {
            resetMarkForm();
          }}
        >
          <Ionicons name="add" size={18} color={theme.colors.primary} />
          <Text style={styles.newSessionText}>New</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderStudentRow = (s: Student) => {
    const status = statuses[s.id];
    const initial = (s.name?.[0] ?? "?").toUpperCase();

    return (
      <View key={s.id} style={styles.studentRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.studentName} numberOfLines={1}>
            {s.name}
          </Text>
          <Text style={styles.studentEmail} numberOfLines={1}>
            {s.email}
          </Text>
        </View>

        <View style={styles.statusButtons}>
          {STATUSES.map((st) => {
            const meta = STATUS_META[st];
            const active = status === st;
            return (
              <TouchableOpacity
                key={st}
                onPress={() => setStatuses((prev) => ({ ...prev, [s.id]: st }))}
                style={[styles.statusButton, active ? { backgroundColor: meta.bg, borderColor: meta.bg } : null]}
              >
                <Text style={[styles.statusButtonText, active ? { color: meta.color } : null]}>
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const historySorted = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history]);

  if (loading && history.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading attendance…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {renderHeader()}
      {renderTabs()}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHistory(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
      >
        {activeTab === "mark" ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Session</Text>

              <Text style={styles.fieldLabel}>Lecture Title (optional)</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Lecture 1"
                style={styles.input}
              />

              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Date (YYYY-MM-DD)</Text>
              <TextInput value={date} onChangeText={setDate} placeholder={todayISO()} style={styles.input} />

              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.quickButton} onPress={() => handleMarkAll("PRESENT")}>
                  <Text style={styles.quickButtonText}>All Present</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickButtonDanger} onPress={() => handleMarkAll("ABSENT")}>
                  <Text style={styles.quickButtonDangerText}>All Absent</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.rosterHeader}>
                <Text style={styles.cardTitle}>{sessionId ? "Editing Records" : "Student Roster"}</Text>
                <Text style={styles.rosterMeta}>{markedCount}/{students.length} marked</Text>
              </View>

              {students.length === 0 ? (
                <Text style={styles.muted}>No students enrolled.</Text>
              ) : (
                <View style={{ gap: 10 }}>{students.map(renderStudentRow)}</View>
              )}

              {students.length > 0 ? (
                <View style={styles.footerActions}>
                  {sessionId ? (
                    <TouchableOpacity style={styles.cancelButton} onPress={resetMarkForm}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.saveButton, !allMarked ? styles.saveButtonDisabled : null]}
                    disabled={!allMarked}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.saveButtonText}>{sessionId ? "Update" : "Save"}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <>
            {historySorted.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.muted}>No attendance sessions yet.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {historySorted.map((s) => (
                  <View key={s.id} style={styles.historyCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {s.title || s.date.slice(0, 10)}
                      </Text>
                      <Text style={styles.historySubtitle}>{s.date.slice(0, 10)}</Text>
                    </View>

                    <TouchableOpacity style={styles.iconButton} onPress={() => applySessionToForm(s)}>
                      <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={() => handleDeleteSession(s.id)}>
                      <Ionicons name="trash-outline" size={18} color={theme.colors.error ?? "#EF4444"} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.textPrimary },
  headerSubtitle: { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary, marginTop: 2 },
  backButton: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerRightPlaceholder: { width: 44, height: 44 },

  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  tabButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabButtonText: { fontSize: 12, fontWeight: "800", color: theme.colors.textSecondary },
  tabButtonTextActive: { color: "#fff" },
  newSessionButton: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" },
  newSessionText: { fontSize: 12, fontWeight: "800", color: theme.colors.primary },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border },
  cardTitle: { fontSize: 14, fontWeight: "900", color: theme.colors.textPrimary, marginBottom: 10 },
  fieldLabel: { fontSize: 12, fontWeight: "800", color: theme.colors.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
  },
  quickActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
  quickButton: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#DCFCE7" },
  quickButtonText: { fontSize: 12, fontWeight: "900", color: "#16A34A" },
  quickButtonDanger: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: "#FEE2E2" },
  quickButtonDangerText: { fontSize: 12, fontWeight: "900", color: "#EF4444" },

  rosterHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  rosterMeta: { fontSize: 12, fontWeight: "800", color: theme.colors.textSecondary },

  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.primary + "20", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 12, fontWeight: "900", color: theme.colors.primary },
  studentName: { fontSize: 13, fontWeight: "900", color: theme.colors.textPrimary },
  studentEmail: { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary, marginTop: 2 },
  statusButtons: { flexDirection: "row", gap: 6 },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
  },
  statusButtonText: { fontSize: 11, fontWeight: "900", color: theme.colors.textSecondary },

  footerActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  cancelButtonText: { fontSize: 12, fontWeight: "900", color: theme.colors.textSecondary },
  saveButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.colors.primary },
  saveButtonText: { fontSize: 12, fontWeight: "900", color: "#fff" },
  saveButtonDisabled: { opacity: 0.5 },

  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyTitle: { fontSize: 13, fontWeight: "900", color: theme.colors.textPrimary },
  historySubtitle: { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary, marginTop: 2 },
  iconButton: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  loadingText: { color: theme.colors.textSecondary },
  muted: { fontSize: 13, color: theme.colors.textSecondary, fontStyle: "italic" },
});
