import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import {
  BackendAnnouncement as ApiAnnouncement,
  BackendAnnouncementResource,
  Course,
  courseService,
} from "@/services/api";
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
  TouchableOpacity,
  View,
} from "react-native";
import * as WebBrowser from 'expo-web-browser';
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

  const initialCourse = route.params?.course;

  const [course, setCourse] = useState<Course | null>(initialCourse ?? null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [announcements, setAnnouncements] = useState<ApiAnnouncement[]>(initialCourse?.announcements ?? []);

  const courseId = initialCourse?.id || "";

  const fetchCourseDetails = async (isRefresh: boolean = false) => {
    if (!courseId) {
      Alert.alert('Error', 'Course ID is missing');
      navigation.goBack();
      return;
    }

    try {
      console.log('📖 Fetching course details (my-courses):', courseId);

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const courseData = await courseService.getMyCourseById(courseId);
      setCourse(courseData);

      // Phase 3: announcements are sourced from /api/courses/:courseId/announcements
      const anns = await courseService.getCourseAnnouncements(courseId);
      setAnnouncements(anns);

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
      courseId: course.id,
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
      courseId: course.id,
      courseCode: course.code,
      courseTitle: course.title,
    });
  };

  const handleAddAssessment = () => {
    if (!course) return;
    navigation.navigate("AddAssessment", {
      courseId: course.id,
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

  const sortedAnnouncements = useMemo(() => {
    const list = announcements ? [...announcements] : [];
    return list.sort((a: any, b: any) => {
      const at = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const bt = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return bt - at;
    });
  }, [announcements]);

  const timeAgo = (iso?: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const openResource = async (resource: BackendAnnouncementResource) => {
    const url = resource.signed_url;
    const mime = resource.mime_type ?? '';

    try {
      // Simple video UX: use in-app video player
      if (mime.startsWith('video/')) {
        navigation.navigate('VideoPlayer', { uri: url });
        return;
      }

      // Everything else: open system preview/browser (works well for PDFs/images)
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.error('❌ Failed to open resource:', e);
      Alert.alert('Error', 'Unable to open attachment.');
    }
  };

  const renderResourceRow = (r: BackendAnnouncementResource) => {
    const label = r.file_name || 'Attachment';
    return (
      <TouchableOpacity
        key={r.id}
        style={styles.resourceRow}
        onPress={() => openResource(r)}
        activeOpacity={0.7}
      >
        <Ionicons name="attach" size={16} color={theme.colors.primary} />
        <Text style={styles.resourceName} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="open-outline" size={16} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderAnnouncementItem = (item: ApiAnnouncement) => (
    <TouchableOpacity
      key={item.id}
      style={styles.announcementCard}
      activeOpacity={0.85}
      onPress={() => {
        if (!course) return;
        navigation.navigate('ViewAnnouncement', {
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          announcement: item,
        });
      }}
    >
      <View style={styles.announcementContent}>
        <View style={styles.announcementHeaderRow}>
          <View style={styles.announcementHeaderLeft}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={14} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.announcementHeaderText}>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementMeta}>
                {course?.title ? `${course.title} • ` : ''}{timeAgo((item as any).createdAt)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.announcementDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {(item.resources?.length ?? 0) > 0 && (
          <View style={styles.resourcesBlock}>
            <Text style={styles.resourcesTitle}>Attachments</Text>
            <View
              style={styles.resourcesList}
              onStartShouldSetResponderCapture={() => true}
            >
              {item.resources?.map(renderResourceRow)}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
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
            <Text style={styles.courseCode}>{course.code}</Text>
            <Text style={styles.courseTitle}>{course.title}</Text>
          </View>
        </View>

        {/* Course Description */}
        {course.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>About this course</Text>
            <Text style={styles.descriptionText}>{course.description}</Text>
          </View>
        )}

        {/* Action Items */}
        <View style={styles.actionItems}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => console.log('Navigate to enrolled students')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Students</Text>
              <Text style={styles.actionSubtitle}>
                {(course.students?.length ?? 0)} enrolled
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleAssessments}>
            <View style={styles.actionIcon}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Assessments</Text>
              <Text style={styles.actionSubtitle}>Open assessments</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={handleCourseMaterials}>
            <View style={styles.actionIcon}>
              <Ionicons name="folder-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Materials</Text>
              <Text style={styles.actionSubtitle}>Coming soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Announcements Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Announcements</Text>
          <TouchableOpacity onPress={handleAddAnnouncement} style={styles.addSectionButton}>
            <Ionicons name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {sortedAnnouncements.length > 0 ? (
          <View style={styles.announcementsList}>
            {sortedAnnouncements.map(renderAnnouncementItem)}
          </View>
        ) : (
          <View style={styles.emptyAnnouncements}>
            <Text style={styles.emptyAnnouncementsText}>No announcements yet</Text>
          </View>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      <AddOptionsDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onAddAnnouncement={() => {
          setDrawerVisible(false);
          handleAddAnnouncement();
        }}
        onAddAssessment={() => {
          setDrawerVisible(false);
          handleAddAssessment();
        }}
        onAddCourseMaterial={() => {
          setDrawerVisible(false);
          handleAddCourseMaterial();
        }}
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
  actionIcon: {
    marginRight: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  addSectionButton: {
    padding: theme.spacing.sm,
  },
  announcementsList: {
    marginHorizontal: theme.spacing.md,
  },
  emptyAnnouncements: {
    alignItems: "center",
    marginTop: theme.spacing.lg,
  },
  emptyAnnouncementsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  announcementCard: {
    flexDirection: "row",
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
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
  announcementHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  announcementHeaderText: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  announcementMeta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  announcementDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
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
  resourcesBlock: {
    marginTop: theme.spacing.sm,
  },
  resourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  resourcesList: {
    gap: 8,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resourceName: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
});
