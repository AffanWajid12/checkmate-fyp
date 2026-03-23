import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { Assessment, assessmentService } from "@/services/api";
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

type ViewAssessmentDetailScreenRouteProp = RouteProp<RootStackParamList, "ViewAssessmentDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ViewAssessmentDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ViewAssessmentDetailScreenRouteProp>();
  const { assessmentId, assessmentTitle, courseCode } = route.params;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAssessmentDetails = async (isRefresh: boolean = false) => {
    if (!assessmentId) {
      Alert.alert('Error', 'Assessment ID is missing');
      navigation.goBack();
      return;
    }

    try {
      console.log('📖 Fetching assessment details:', assessmentId);
      
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await assessmentService.getAssessmentById(assessmentId);
      setAssessment(data);
      
      console.log('✅ Assessment details loaded');
    } catch (error: any) {
      console.error('❌ Error fetching assessment:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load assessment details',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Retry',
            onPress: () => fetchAssessmentDetails(false),
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
      fetchAssessmentDetails(false);
    }, [assessmentId])
  );

  const handleRefresh = () => {
    fetchAssessmentDetails(true);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeRemaining = (dueDate: string): string => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return 'Past due';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Due soon';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#F59E0B';
      case 'active':
        return '#10B981';
      case 'graded':
        return '#6B7280';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'time-outline';
      case 'active':
        return 'checkmark-circle-outline';
      case 'graded':
        return 'checkmark-done-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return 'document-text';
      case 'quiz':
        return 'help-circle';
      case 'homework':
        return 'pencil';
      case 'project':
        return 'briefcase';
      case 'assignment':
        return 'clipboard';
      default:
        return 'document';
    }
  };  const handleAddSubmission = () => {
    if (!assessment?.course) {
      Alert.alert('Error', 'Course information is missing');
      return;
    }

    navigation.navigate('AddSubmission', {
      assessmentId: assessment._id,
      assessmentTitle: assessment.title,
      courseId: typeof assessment.course === 'string' ? assessment.course : assessment.course._id,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assessment Details</Text>
          <View style={styles.placeholder} />
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
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assessment Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateText}>Assessment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const submissionStats = assessment.submissionStats || {
    submitted: 0,
    notSubmitted: 0,
    graded: 0,
    notGraded: 0,
    totalStudents: 0,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {courseCode}
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
        {/* Assessment Header Card */}
        <View style={styles.assessmentHeaderCard}>
          <View style={styles.typeIconContainer}>
            <Ionicons
              name={getTypeIcon(assessment.type) as any}
              size={28}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.assessmentHeaderInfo}>
            <Text style={styles.assessmentTitle}>{assessment.title}</Text>
            <View style={styles.assessmentMeta}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assessment.status) + '20' }]}>
                <Ionicons
                  name={getStatusIcon(assessment.status) as any}
                  size={14}
                  color={getStatusColor(assessment.status)}
                />
                <Text style={[styles.statusText, { color: getStatusColor(assessment.status) }]}>
                  {assessment.status.toUpperCase()}
                </Text>
              </View>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{assessment.type.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatCard}>
            <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
            <Text style={styles.quickStatValue}>{assessment.totalPoints}</Text>
            <Text style={styles.quickStatLabel}>Points</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="time-outline" size={24} color="#10B981" />
            <Text style={styles.quickStatValue} numberOfLines={1}>
              {getTimeRemaining(assessment.dueDate)}
            </Text>
            <Text style={styles.quickStatLabel}>Remaining</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Ionicons name="people-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickStatValue}>
              {submissionStats.submitted}/{submissionStats.totalStudents}
            </Text>
            <Text style={styles.quickStatLabel}>Submitted</Text>
          </View>
        </View>

        {/* Due Date Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.infoCardTitle}>Due Date</Text>
          </View>
          <Text style={styles.infoCardContent}>{formatDate(assessment.dueDate)}</Text>
          {assessment.allowLateSubmissions && (
            <View style={styles.lateSubmissionNotice}>
              <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
              <Text style={styles.lateSubmissionText}>
                Late submissions allowed ({assessment.latePenalty}% penalty per day)
              </Text>
            </View>
          )}
        </View>

        {/* Description Card */}
        {assessment.description && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoCardTitle}>Description</Text>
            </View>
            <Text style={styles.infoCardContent}>{assessment.description}</Text>
          </View>
        )}

        {/* Instructions Card */}
        {assessment.instructions && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoCardTitle}>Instructions</Text>
            </View>
            <Text style={styles.infoCardContent}>{assessment.instructions}</Text>
          </View>
        )}

        {/* Submission Statistics Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="stats-chart-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.infoCardTitle}>Submission Statistics</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{submissionStats.submitted}</Text>
              <Text style={styles.statLabel}>Submitted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{submissionStats.notSubmitted}</Text>
              <Text style={styles.statLabel}>Not Submitted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{submissionStats.graded}</Text>
              <Text style={styles.statLabel}>Graded</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{submissionStats.notGraded}</Text>
              <Text style={styles.statLabel}>Pending Review</Text>
            </View>
          </View>
        </View>

        {/* Recent Submissions */}
        {assessment.recentSubmissions && assessment.recentSubmissions.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="document-attach-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoCardTitle}>Recent Submissions</Text>
            </View>
            {assessment.recentSubmissions.map((submission) => (
              <View key={submission.id} style={styles.submissionItem}>
                <View style={styles.submissionLeft}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>
                      {submission.studentName.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.submissionInfo}>
                    <Text style={styles.submissionStudentName}>{submission.studentName}</Text>
                    <Text style={styles.submissionDate}>
                      {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.submissionRight}>
                  {submission.grade !== null ? (
                    <View style={styles.gradeContainer}>
                      <Text style={styles.gradeText}>{submission.grade}/{assessment.totalPoints}</Text>
                      <Text style={styles.percentageText}>({submission.percentage}%)</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Creator Info */}
        <View style={styles.creatorCard}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorAvatarText}>
              {assessment.createdBy.firstName[0]}{assessment.createdBy.lastName[0]}
            </Text>
          </View>
          <View style={styles.creatorInfo}>
            <Text style={styles.creatorLabel}>Created by</Text>
            <Text style={styles.creatorName}>
              {assessment.createdBy.firstName} {assessment.createdBy.lastName}
            </Text>
            <Text style={styles.creatorDate}>
              {new Date(assessment.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>      {/* Floating Action Button - Add Submission */}
      {assessment.status !== 'graded' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddSubmission}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={theme.colors.onPrimary} />
          <Text style={styles.fabText}>Add Submission</Text>
        </TouchableOpacity>
      )}
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
  assessmentHeaderCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  assessmentHeaderInfo: {
    flex: 1,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  assessmentMeta: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  quickStatLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  infoCardContent: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  lateSubmissionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B' + '15',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  lateSubmissionText: {
    fontSize: 12,
    color: '#F59E0B',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  submissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  submissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionStudentName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  submissionDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  submissionRight: {
    alignItems: 'flex-end',
  },
  gradeContainer: {
    alignItems: 'flex-end',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  percentageText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  pendingBadge: {
    backgroundColor: '#F59E0B' + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  creatorCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  creatorAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  creatorDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimary,
  },
});
