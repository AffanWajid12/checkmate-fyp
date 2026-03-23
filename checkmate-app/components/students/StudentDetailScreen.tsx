import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { StudentDetailResponse, studentService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StudentDetailScreenRouteProp = RouteProp<RootStackParamList, "StudentDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function StudentDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<StudentDetailScreenRouteProp>();
  const { studentId, studentName } = route.params;

  const [student, setStudent] = useState<StudentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudentDetails = async (isRefresh: boolean = false) => {
    try {
      console.log("📖 Fetching student details:", studentId);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await studentService.getStudentById(studentId);
      setStudent(data);

      console.log("✅ Student details loaded");
    } catch (error: any) {
      console.error("❌ Error fetching student:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to load student details",
        [
          {
            text: "Go Back",
            onPress: () => navigation.goBack(),
          },
          {
            text: "Retry",
            onPress: () => fetchStudentDetails(false),
          },
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStudentDetails(false);
    }, [studentId])
  );

  const handleRefresh = () => {
    fetchStudentDetails(true);
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading student...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateText}>Student not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Student Profile
        </Text>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Student Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {student.avatar ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(student.firstName, student.lastName)}
                </Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(student.firstName, student.lastName)}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.studentName}>
            {student.firstName} {student.lastName}
          </Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
          <View style={styles.studentMetaContainer}>
            <View style={styles.studentMetaItem}>
              <Ionicons name="school-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.studentMetaText}>{student.studentNumber}</Text>
            </View>
            {student.department && (
              <View style={styles.studentMetaItem}>
                <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.studentMetaText}>{student.department}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Overall Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Overall Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{student.overallStats.totalCourses}</Text>
              <Text style={styles.statLabel}>Courses</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="document-text-outline" size={24} color="#10B981" />
              <Text style={styles.statValue}>
                {student.overallStats.totalSubmissions}/{student.overallStats.totalAssessments}
              </Text>
              <Text style={styles.statLabel}>Submissions</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>
                {student.overallStats.overallAverage !== null
                  ? `${student.overallStats.overallAverage.toFixed(1)}%`
                  : "N/A"}
              </Text>
              <Text style={styles.statLabel}>Overall Avg</Text>
            </View>
          </View>
        </View>

        {/* Enrolled Courses */}
        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>Enrolled Courses ({student.enrolledCourses.length})</Text>
          {student.enrolledCourses.length > 0 ? (
            student.enrolledCourses.map((course) => (
              <View key={course._id} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseIconContainer}>
                    <Ionicons name="book" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseCode}>{course.code}</Text>
                    <Text style={styles.courseTitle} numberOfLines={1}>
                      {course.title}
                    </Text>
                    <Text style={styles.courseMeta}>
                      {course.semester} {course.year} • Section {course.section}
                    </Text>
                  </View>
                </View>

                {/* Course Stats */}
                <View style={styles.courseStats}>
                  <View style={styles.courseStatItem}>
                    <Text style={styles.courseStatLabel}>Submissions</Text>
                    <Text style={styles.courseStatValue}>
                      {course.submissionStats.submitted}/{course.submissionStats.total}
                    </Text>
                  </View>
                  <View style={styles.courseStatDivider} />
                  <View style={styles.courseStatItem}>
                    <Text style={styles.courseStatLabel}>Average Grade</Text>
                    <Text
                      style={[
                        styles.courseStatValue,
                        { color: course.submissionStats.avgGrade ? "#10B981" : theme.colors.textSecondary },
                      ]}
                    >
                      {course.submissionStats.avgGrade !== null
                        ? `${course.submissionStats.avgGrade.toFixed(1)}%`
                        : "N/A"}
                    </Text>
                  </View>
                </View>

                {/* Enrolled Date */}
                <Text style={styles.enrolledDate}>
                  Enrolled: {new Date(course.enrolledAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCoursesState}>
              <Ionicons name="book-outline" size={48} color={theme.colors.textTertiary} />
              <Text style={styles.emptyCoursesText}>No enrolled courses</Text>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  profileCard: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    ...theme.shadows.md,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  studentName: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  studentMetaContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  studentMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  studentMetaText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  coursesSection: {
    marginHorizontal: theme.spacing.md,
  },
  courseCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  courseHeader: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
  },
  courseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  courseMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  courseStats: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  courseStatItem: {
    flex: 1,
    alignItems: "center",
  },
  courseStatDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  courseStatLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  courseStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  enrolledDate: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: "center",
  },
  emptyCoursesState: {
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyCoursesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
});
