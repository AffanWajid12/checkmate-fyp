import { theme } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/types";
import {
  BackendAnnouncement,
  BackendAnnouncementComment,
  BackendAnnouncementResource,
  courseService,
} from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RouteT = RouteProp<RootStackParamList, "ViewAnnouncement">;
type NavT = NativeStackNavigationProp<RootStackParamList>;

export default function ViewAnnouncementScreen() {
  const navigation = useNavigation<NavT>();
  const route = useRoute<RouteT>();
  const { courseId, courseCode, announcement: initialAnnouncement } = route.params;

  const [announcement, setAnnouncement] = useState<BackendAnnouncement>(initialAnnouncement);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");

  const reload = async () => {
    try {
      setLoading(true);
      const anns = await courseService.getCourseAnnouncements(courseId);
      const fresh = anns.find((a) => a.id === initialAnnouncement.id);
      if (fresh) setAnnouncement(fresh);
    } catch (e: any) {
      console.error("❌ Failed to reload announcement:", e);
      Alert.alert("Error", e.response?.data?.message || "Failed to load announcement");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [courseId, initialAnnouncement.id])
  );

  const openResource = async (resource: BackendAnnouncementResource) => {
    const url = resource.signed_url;
    const mime = resource.mime_type ?? "";

    try {
      if (mime.startsWith("video/")) {
        navigation.navigate("VideoPlayer", { uri: url });
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.error("❌ Failed to open resource:", e);
      Alert.alert("Error", "Unable to open attachment.");
    }
  };

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

  const renderAvatar = (url?: string) => {
    if (url) {
      return <Image source={{ uri: url }} style={styles.avatarImg} />;
    }
    return (
      <View style={styles.avatarFallback}>
        <Ionicons name="person" size={14} color={theme.colors.textSecondary} />
      </View>
    );
  };

  const resources = announcement.resources ?? [];
  const comments = useMemo(() => announcement.comments ?? [], [announcement.comments]);

  const handleAddComment = async () => {
    const content = commentText.trim();
    if (!content) return;

    try {
      setSubmitting(true);
      const comment = await courseService.addAnnouncementComment(courseId, announcement.id, content);
      setAnnouncement((prev) => ({
        ...prev,
        comments: [comment, ...(prev.comments ?? [])],
      }));
      setCommentText("");
    } catch (e: any) {
      console.error("❌ Failed to add comment:", e);
      Alert.alert("Error", e.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (c: BackendAnnouncementComment) => {
    Alert.alert("Delete comment", "Remove this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await courseService.deleteAnnouncementComment(courseId, announcement.id, c.id);
            setAnnouncement((prev) => ({
              ...prev,
              comments: (prev.comments ?? []).filter((x) => x.id !== c.id),
            }));
          } catch (e: any) {
            console.error("❌ Failed to delete comment:", e);
            Alert.alert("Error", e.response?.data?.message || "Failed to delete comment");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Announcement</Text>
            <Text style={styles.headerSubtitle}>{courseCode}</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Announcement</Text>
          <Text style={styles.headerSubtitle}>{courseCode}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>{announcement.title}</Text>
            <Text style={styles.description}>{announcement.description}</Text>

            {resources.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attachments</Text>
                <View style={styles.resourcesList}>
                  {resources.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={styles.resourceRow}
                      onPress={() => openResource(r)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="attach" size={16} color={theme.colors.primary} />
                      <Text style={styles.resourceName} numberOfLines={1}>
                        {r.file_name || "Attachment"}
                      </Text>
                      <Ionicons name="open-outline" size={16} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Comments</Text>

            <View style={styles.commentComposer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor={theme.colors.textTertiary}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, (submitting || !commentText.trim()) && styles.sendButtonDisabled]}
                onPress={handleAddComment}
                disabled={submitting || !commentText.trim()}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Ionicons name="send" size={18} color={theme.colors.onPrimary} />
                )}
              </TouchableOpacity>
            </View>

            {comments.length === 0 ? (
              <Text style={styles.emptyText}>No comments yet.</Text>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((c) => (
                  <View key={c.id} style={styles.commentRow}>
                    {renderAvatar(c.user?.profile_picture)}
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor} numberOfLines={1}>
                          {c.user?.name ?? 'User'}
                        </Text>
                        <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentContent}>{c.content}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteComment(c)}>
                      <Ionicons name="trash-outline" size={18} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  headerTextContainer: { flex: 1, marginLeft: 4 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: theme.colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  placeholder: { width: 40 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  title: { fontSize: 16, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 8 },
  description: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  section: { marginTop: theme.spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.textPrimary, marginBottom: 10 },
  resourcesList: { gap: 8 },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  resourceName: { flex: 1, color: theme.colors.textPrimary, fontSize: 13 },
  commentComposer: { flexDirection: "row", gap: 10, alignItems: "flex-end" },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.5 },
  emptyText: { marginTop: 12, color: theme.colors.textSecondary },
  commentsList: { marginTop: 12, gap: 10 },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 12,
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  commentAuthor: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  commentTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  commentContent: { flex: 1, color: theme.colors.textPrimary, fontSize: 13 },
});
