import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import GetStartedScreen from "../components/auth/GetStartedScreen";
import LoginScreen from "../components/auth/LoginScreen";
import SignUpScreen from "../components/auth/SignUpScreen";
import CapturesScreen from "../components/CapturesScreen";
import AddAnnouncementScreen from "../components/courses/AddAnnouncementScreen";
import AddAssessmentScreen from "../components/courses/AddAssessmentScreen";
import AddCourseScreen from "../components/courses/AddCourseScreen";
import AddSubmissionScreen from "../components/courses/AddSubmissionScreen";
import ViewAssessmentDetailScreen from "../components/courses/ViewAssessmentDetailScreen";
import ViewAssessmentsScreen from "../components/courses/ViewAssessmentsScreen";
import ViewCourseScreen from "../components/courses/ViewCourseScreen";
import RecordScreen from "../components/RecorderScreen";
import ProfileDetailScreen from "../components/settings/ProfileDetailScreen";
import StudentDetailScreen from "../components/students/StudentDetailScreen";
import VideoPlayerScreen from "../components/VideoPlayerScreen";
import { theme } from "../constants/theme";
import { authService } from "../services/api";
import MainTabNavigator from "./MainTabNavigator";

import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "MainTabs" : "GetStarted"}
      screenOptions={{
        headerShown: false,
      }}
    >      
    <Stack.Screen name="GetStarted" component={GetStartedScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />      
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="AddCourse" component={AddCourseScreen} />
      <Stack.Screen name="ViewCourse" component={ViewCourseScreen} />
      <Stack.Screen name="ViewAssessments" component={ViewAssessmentsScreen} />
      <Stack.Screen
        name="ViewAssessmentDetail"
        component={ViewAssessmentDetailScreen}
      />
      <Stack.Screen name="AddAnnouncement" component={AddAnnouncementScreen} />
      <Stack.Screen name="AddAssessment" component={AddAssessmentScreen} />
      <Stack.Screen name="AddSubmission" component={AddSubmissionScreen} />
      <Stack.Screen name="StudentDetail" component={StudentDetailScreen} />
      <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
      <Stack.Screen name="RecordScreen" component={RecordScreen} />
      <Stack.Screen name="CapturesScreen" component={CapturesScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
    </Stack.Navigator>
  );
}
