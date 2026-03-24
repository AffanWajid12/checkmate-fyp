import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import {
  BackendAssessment,
  BackendAnnouncement,
  courseService,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ViewAssessmentsScreenRouteProp = RouteProp<RootStackParamList, "ViewAssessments">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type FlattenedAssessment = BackendAssessment & {
  announcementId: string;
  announcementTitle?: string;
};

export default function ViewAssessmentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewAssessmentsScreenRouteProp>();
  const { courseId, courseCode, courseTitle } = route.params;

  const [announcements, setAnnouncements] = useState<BackendAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const assessments = useMemo<FlattenedAssessment[]>(() => {
    const list: FlattenedAssessment[] = [];
    for (const ann of announcements) {
      for (const a of ann.assessments ?? []) {
        list.push({
          ...a,
          announcementId: ann.id,
          announcementTitle: ann.title,
        });
      }
    }

    // Sort by due_date if present, otherwise keep stable-ish order
    return list.sort((a, b) => {
      const ad = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
  }, [announcements]);

  const fetchAnnouncements = async (isRefresh: boolean = false) => {
    if (!courseId) {
      Alert.alert('Error', 'Course ID is missing');
      navigation.goBack();
      return;
    }

    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      console.log('📣 Fetching announcements for assessments list:', courseId);
      const anns = await courseService.getCourseAnnouncements(courseId);
      setAnnouncements(anns);
    } catch (error: any) {
      console.error('❌ Error fetching announcements:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load assessments. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements(false);
    }, [courseId])
  );

  const handleRefresh = () => fetchAnnouncements(true);

  const handleAssessmentPress = (assessment: FlattenedAssessment) => {
    navigation.navigate("ViewAssessmentDetail", {
      courseId,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      courseCode,
    });
  };

  const formatDue = (due?: string) => {
    if (!due) return 'No due date';
    const date = new Date(due);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderAssessmentItem = ({ item }: { item: FlattenedAssessment }) => (
    <TouchableOpacity
      style={styles.assessmentCard}
      onPress={() => handleAssessmentPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.assessmentContent}>
        <Text style={styles.assessmentTitle}>{item.title}</Text>
        <View style={styles.assessmentMeta}>
          <Text style={styles.assessmentType}>{item.type}</Text>
          <Text style={styles.assessmentPoints}>Due {formatDue(item.due_date)}</Text>
        </View>
        {item.announcementTitle ? (
          <Text style={styles.announcementHint} numberOfLines={1}>
            From: {item.announcementTitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Assessments Yet</Text>
      <Text style={styles.emptyStateText}>
        Assessments are created from announcements.
      </Text>
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
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Assessments</Text>
            <Text style={styles.headerSubtitle}>{courseCode}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading assessments...</Text>
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
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Assessments</Text>
          <Text style={styles.headerSubtitle}>{courseCode}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButtonHeader}
          onPress={() => {
            console.log('Add assessment');
          }}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={assessments}
        keyExtractor={(item) => item.id}
        renderItem={renderAssessmentItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={assessments.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={renderEmptyState}
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
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  addButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  placeholder: {
    width: 40,
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
  listContent: {
    padding: theme.spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl * 2,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  assessmentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  assessmentContent: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  assessmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  assessmentType: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  assessmentPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  announcementHint: {
    marginTop: 6,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
