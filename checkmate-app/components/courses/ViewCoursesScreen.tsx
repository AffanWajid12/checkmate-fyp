import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import { CourseListItem, courseService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ViewCoursesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCourses = async (pageNum: number = 1, isRefresh: boolean = false) => {
    try {
      console.log('📚 Fetching courses, page:', pageNum);
      
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      const response = await courseService.getCourses({
        page: pageNum,
        limit: 20,
        sortBy: 'createdAt',
        order: 'desc',
      });

      if (isRefresh || pageNum === 1) {
        setCourses(response.courses);
      } else {
        setCourses(prev => [...prev, ...response.courses]);
      }

      setHasMore(response.pagination.hasNextPage);
      setPage(pageNum);

      console.log(`✅ Loaded ${response.courses.length} courses`);
    } catch (error: any) {
      console.error('❌ Error fetching courses:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load courses. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch courses when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCourses(1, false);
    }, [])
  );

  const handleRefresh = () => {
    fetchCourses(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchCourses(page + 1, false);
    }
  };

  const handleCoursePress = (course: CourseListItem) => {
    navigation.navigate("ViewCourse", {
      id: course._id,
      title: course.title,
      code: course.code,
      professor: `${course.professor.firstName} ${course.professor.lastName}`,
      enrolledStudents: course.enrolledStudents,
      assessments: course.assessmentCount,
    });
  };
  const renderCourseItem = ({ item }: { item: CourseListItem }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleCoursePress(item)}
    >
      <View style={styles.courseContent}>
        <Text style={styles.courseTitle}>{item.title}</Text>
        <Text style={styles.courseCode}>
          {item.code} - Section {item.section}
        </Text>
        <Text style={styles.courseSemester}>
          {item.semester} {item.year}
        </Text>
        <View style={styles.courseStats}>
          <View style={styles.statItem}>
            <Ionicons
              name="people-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.statText}>{item.enrolledStudents} Students</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.statText}>{item.assessmentCount} Assessments</Text>
          </View>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Courses Yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first course to get started
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Courses</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddCourse")}
          >
            <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Courses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("AddCourse")}
        >
          <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={courses.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
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
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  courseCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  courseContent: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  courseCode: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  courseSemester: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  courseStats: {
    flexDirection: "row",
    marginTop: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
});
