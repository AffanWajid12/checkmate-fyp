import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { AssessmentListItem, assessmentService, AssessmentStatus } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useState } from "react";
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

type ViewAssessmentsScreenRouteProp = RouteProp<
  RootStackParamList,
  "ViewAssessments"
>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ViewAssessmentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewAssessmentsScreenRouteProp>();
  const { courseId, courseCode, courseTitle } = route.params;

  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalAssessments: 0,
    activeAssessments: 0,
    upcomingAssessments: 0,
    completedAssessments: 0,
  });

  const fetchAssessments = async (isRefresh: boolean = false) => {
    if (!courseId) {
      Alert.alert('Error', 'Course ID is missing');
      navigation.goBack();
      return;
    }

    try {
      console.log('📋 Fetching assessments for course:', courseId);
      
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await assessmentService.getAssessmentsByCourse(courseId, {
        sortBy: 'dueDate',
        order: 'asc',
      });

      setAssessments(response.assessments);
      setStats(response.stats);

      console.log(`✅ Loaded ${response.assessments.length} assessments`);
    } catch (error: any) {
      console.error('❌ Error fetching assessments:', error);
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
      fetchAssessments(false);
    }, [courseId])
  );

  const handleRefresh = () => {
    fetchAssessments(true);
  };

  const handleAssessmentPress = (assessment: AssessmentListItem) => {
    navigation.navigate("ViewAssessmentDetail", {
      assessmentId: assessment._id,
      assessmentTitle: assessment.title,
      courseCode: courseCode,
    });
  };

  const getStatusColor = (status: AssessmentStatus) => {
    switch (status) {
      case "active":
        return theme.colors.success;
      case "upcoming":
        return theme.colors.warning;
      case "graded":
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusLabel = (status: AssessmentStatus) => {
    switch (status) {
      case "active":
        return "ACTIVE";
      case "upcoming":
        return "UPCOMING";
      case "graded":
        return "GRADED";
      default:
        return "";
    }
  };

  const formatDueDate = (dueDate: string): string => {
    const date = new Date(dueDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderAssessmentItem = ({ item }: { item: AssessmentListItem }) => {
    const timeRemaining = assessmentService.getTimeRemaining(item.dueDate);
    
    return (
      <TouchableOpacity
        style={styles.assessmentCard}
        onPress={() => handleAssessmentPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.assessmentContent}>
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text
              style={[styles.statusText, { color: getStatusColor(item.status) }]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={styles.assessmentTitle}>{item.title}</Text>
          <View style={styles.assessmentMeta}>
            <Text style={styles.assessmentType}>{item.type.toUpperCase()}</Text>
            <Text style={styles.assessmentPoints}>{item.totalPoints} pts</Text>
          </View>
          <View style={styles.dueDateContainer}>
            <View style={styles.dueDateRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.dueDateLabel}>Due {formatDueDate(item.dueDate)}</Text>
            </View>
            {!timeRemaining.isPastDue && (
              <Text style={styles.timeRemaining}>{timeRemaining.formatted}</Text>
            )}
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="document-text-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.statText}>{item.submissionCount}/{item.totalStudents} submitted</Text>
            </View>
            {item.status === "graded" && item.avgGrade && (
              <Text style={styles.gradeText}>Avg: {item.avgGrade.toFixed(1)}%</Text>
            )}
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Assessments Yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first assessment to get started
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.totalAssessments}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: theme.colors.warning }]}>
          {stats.upcomingAssessments}
        </Text>
        <Text style={styles.statLabel}>Upcoming</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={[styles.statValue, { color: theme.colors.success }]}>
          {stats.activeAssessments}
        </Text>
        <Text style={styles.statLabel}>Active</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{stats.completedAssessments}</Text>
        <Text style={styles.statLabel}>Graded</Text>
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
            // TODO: Navigate to Add Assessment screen
            console.log('Add assessment');
          }}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={assessments}
        renderItem={renderAssessmentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={assessments.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={renderHeader}
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
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
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
  dueDateContainer: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  timeRemaining: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '600',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.success,
  },
});
