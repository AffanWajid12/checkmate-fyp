import { theme } from "@/constants/theme";
import { courseService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
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

export default function AddCourseScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  
  // Required fields
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [section, setSection] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  
  // Optional fields
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("3");
  const [maxStudents, setMaxStudents] = useState("100");

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Course title is required');
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert('Validation Error', 'Course title must be at least 3 characters');
      return false;
    }
    if (!code.trim()) {
      Alert.alert('Validation Error', 'Course code is required');
      return false;
    }
    if (!/^[A-Z0-9]+$/i.test(code.trim())) {
      Alert.alert('Validation Error', 'Course code must contain only letters and numbers');
      return false;
    }
    if (!section.trim()) {
      Alert.alert('Validation Error', 'Section is required');
      return false;
    }
    if (!semester.trim()) {
      Alert.alert('Validation Error', 'Semester is required (e.g., Fall 2024)');
      return false;
    }
    if (!year.trim()) {
      Alert.alert('Validation Error', 'Year is required');
      return false;
    }
    
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2100) {
      Alert.alert('Validation Error', 'Please enter a valid year (2020-2100)');
      return false;
    }

    return true;
  };

  const handleCreateCourse = async () => {
    if (!validateForm()) {
      return;
    }

    console.log('➕ Creating course...');
    setLoading(true);

    try {
      const courseData = {
        title: title.trim(),
        code: code.trim().toUpperCase(),
        section: section.trim(),
        semester: semester.trim(),
        year: parseInt(year),
        description: description.trim() || undefined,
        credits: parseInt(credits) || 3,
        maxStudents: parseInt(maxStudents) || 100,
      };

      await courseService.createCourse(courseData);
      
      Alert.alert(
        'Success',
        'Course created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Error creating course:', error);
      
      let errorMessage = 'Failed to create course. Please try again.';
      
      if (error.response?.status === 409) {
        errorMessage = 'A course with this code and section already exists for this semester';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={styles.headerTitle}>Add Course</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Required Information</Text>
            
            <Text style={styles.label}>Course Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Introduction to Psychology"
              placeholderTextColor={theme.colors.placeholder}
              value={title}
              onChangeText={setTitle}
              editable={!loading}
            />

            <Text style={styles.label}>Course Code *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PSY101"
              placeholderTextColor={theme.colors.placeholder}
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              autoCapitalize="characters"
              editable={!loading}
            />

            <Text style={styles.label}>Section *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. A, B, 01"
              placeholderTextColor={theme.colors.placeholder}
              value={section}
              onChangeText={setSection}
              editable={!loading}
            />

            <Text style={styles.label}>Semester *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fall 2024, Spring 2025"
              placeholderTextColor={theme.colors.placeholder}
              value={semester}
              onChangeText={setSemester}
              editable={!loading}
            />

            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2024"
              placeholderTextColor={theme.colors.placeholder}
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text style={styles.sectionTitle}>Optional Information</Text>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief course description..."
              placeholderTextColor={theme.colors.placeholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />

            <Text style={styles.label}>Credits</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              placeholderTextColor={theme.colors.placeholder}
              value={credits}
              onChangeText={setCredits}
              keyboardType="number-pad"
              editable={!loading}
            />

            <Text style={styles.label}>Max Students</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              placeholderTextColor={theme.colors.placeholder}
              value={maxStudents}
              onChangeText={setMaxStudents}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateCourse}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.createButtonText}>Create Course</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
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
  placeholder: {
    width: 40,
  },
  form: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  buttonContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
