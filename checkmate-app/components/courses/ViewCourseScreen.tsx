import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { Announcement as ApiAnnouncement, Course, courseService } from "@/services/api";
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
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import AddOptionsDrawer from "./AddOptionsDrawer";

type ViewCourseScreenRouteProp = RouteProp<RootStackParamList, "ViewCourse">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ViewCourseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewCourseScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Get course ID from route params
  const courseId = route.params?.id || "";

  const fetchCourseDetails = async (isRefresh: boolean = false) => {
    if (!courseId) {
      Alert.alert('Error', 'Course ID is missing');
      navigation.goBack();
      return;
    }

    try {
      console.log('📖 Fetching course details:', courseId);
      
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);
      
      console.log('✅ Course details loaded');
    } catch (error: any) {
      console.error('❌ Error fetching course:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load course details',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Retry',
            onPress: () => fetchCourseDetails(false),
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
      fetchCourseDetails(false);
    }, [courseId])
  );

  const handleRefresh = () => {
    fetchCourseDetails(true);
  };

  const handleAssessments = () => {
    if (!course) return;
    navigation.navigate("ViewAssessments", {
      courseId: course._id,
      courseCode: course.code,
      courseTitle: course.title,
    });
  };

  const handleCourseMaterials = () => {
    console.log("Navigate to course materials");
  };

  const handleAddAnnouncement = () => {
    if (!course) return;
    navigation.navigate("AddAnnouncement", {
      courseId: course._id,
      courseCode: course.code,
      courseTitle: course.title,
    });
  };

  const handleAddAssessment = () => {
    if (!course) return;
    navigation.navigate("AddAssessment", {
      courseId: course._id,
      courseCode: course.code,
      courseTitle: course.title,
    });
  };

  const handleAddCourseMaterial = () => {
    console.log("Course materials feature coming soon");
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error || '#EF4444';
      case 'medium':
        return theme.colors.warning || '#F59E0B';
      case 'low':
        return theme.colors.success || '#10B981';
      default:
        return theme.colors.primary;
    }
  };

  const renderAnnouncementItem = (item: ApiAnnouncement) => (
    <View key={item._id} style={styles.announcementCard}>
      <View style={[
        styles.announcementIcon,
        { backgroundColor: `${getPriorityColor(item.priority)}15` }
      ]}>
        <Ionicons
          name="megaphone-outline"
          size={20}
          color={getPriorityColor(item.priority)}
        />
      </View>
      <View style={styles.announcementContent}>
        <View style={styles.announcementHeaderRow}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          {item.priority === 'high' && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>HIGH</Text>
            </View>
          )}
        </View>
        <Text style={styles.announcementDescription}>{item.content}</Text>
        <Text style={styles.announcementTime}>{formatTimeAgo(item.postedAt)}</Text>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Course Details</Text>
          <View style={styles.moreButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading course...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
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
          <Text style={styles.headerTitle}>Course Details</Text>
          <View style={styles.moreButton} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateText}>Course not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Course Details</Text>
        <TouchableOpacity style={styles.moreButton}>
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
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Course Info Card */}
        <View style={styles.courseInfoCard}>
          <View style={styles.courseIconContainer}>
            <Ionicons
              name="book-outline"
              size={32}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.courseInfo}>
            <Text style={styles.courseCode}>{course.code} - Section {course.section}</Text>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseProfessor}>
              {course.professor.firstName} {course.professor.lastName}
            </Text>
            <Text style={styles.courseSemester}>
              {course.semester} {course.year} • {course.credits} Credits
            </Text>
          </View>
        </View>

        {/* Course Description */}
        {course.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>About this course</Text>
            <Text style={styles.descriptionText}>{course.description}</Text>
          </View>
        )}

        {/* Schedule */}
        {course.schedule && (
          <View style={styles.scheduleCard}>
            <Text style={styles.scheduleTitle}>Schedule</Text>
            <View style={styles.scheduleRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.scheduleText}>
                {course.schedule.days.join(', ')}
              </Text>
            </View>
            <View style={styles.scheduleRow}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.scheduleText}>{course.schedule.time}</Text>
            </View>
            <View style={styles.scheduleRow}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.scheduleText}>{course.schedule.location}</Text>
            </View>
          </View>
        )}

        {/* Action Items */}
        <View style={styles.actionItems}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => console.log('Navigate to enrolled students')}
          >
            <View style={styles.actionItemLeft}>
              <Ionicons
                name="people-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.actionItemText}>Enrolled Students</Text>
            </View>
            <View style={styles.actionItemRight}>
              <Text style={styles.actionItemCount}>
                {course.enrolledStudents} / {course.maxStudents}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleAssessments}
          >
            <View style={styles.actionItemLeft}>
              <Ionicons
                name="clipboard-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.actionItemText}>Assessments</Text>
            </View>
            <View style={styles.actionItemRight}>
              <Text style={styles.actionItemCount}>
                {course.assessmentCount}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, styles.actionItemLast]}
            onPress={handleCourseMaterials}
          >
            <View style={styles.actionItemLeft}>
              <Ionicons
                name="folder-outline"
                size={20}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.actionItemText}>Course Materials</Text>
            </View>
            <View style={styles.actionItemRight}>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Announcements Section */}
        <View style={styles.streamSection}>
          <Text style={styles.streamTitle}>Announcements</Text>
          {course.announcements.length > 0 ? (
            course.announcements.map(renderAnnouncementItem)
          ) : (
            <View style={styles.noAnnouncementsCard}>
              <Ionicons name="megaphone-outline" size={40} color={theme.colors.textSecondary} />
              <Text style={styles.noAnnouncementsText}>No announcements yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: 20 + insets.bottom + 60 }, // 60 is tab bar height
        ]}
        onPress={() => setDrawerVisible(true)}
      >
        <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
      </TouchableOpacity>

      {/* Add Options Drawer */}
      <AddOptionsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onAddAnnouncement={handleAddAnnouncement}
        onAddAssessment={handleAddAssessment}
        onAddCourseMaterial={handleAddCourseMaterial}
      />
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
  },
  moreButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  courseInfoCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  courseIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  courseInfo: {
    flex: 1,
    justifyContent: "center",
  },
  courseCode: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  courseProfessor: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  courseSemester: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  descriptionCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  scheduleCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  scheduleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  actionItems: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  actionItemLast: {
    borderBottomWidth: 0,
  },
  actionItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionItemText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
    fontWeight: "500",
  },
  actionItemRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionItemCount: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
    fontWeight: "600",
  },
  streamSection: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100, // Account for FAB + tab bar
  },
  streamTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  announcementCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.sm,
  },
  announcementContent: {
    flex: 1,
  },
  announcementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  priorityBadge: {
    backgroundColor: '#EF444415',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  announcementDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  announcementTime: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  noAnnouncementsCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  noAnnouncementsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
});
