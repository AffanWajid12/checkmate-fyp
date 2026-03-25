export type RootStackParamList = {
  GetStarted: undefined;
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  AddCourse: undefined;
  ViewCourse: {
    course: import('@/services/api').Course;
  };
  ViewAssessments: {
    courseId: string;
    courseCode: string;
    courseTitle: string;
  };
  ViewAssessmentDetail: {
    courseId: string;
    assessmentId: string;
    courseCode: string;
    assessmentTitle?: string;
  };
  ViewSubmissionDetail: {
    courseId: string;
    assessmentId: string;
    submissionId: string;
    courseCode: string;
  };
  AddAnnouncement: {
    courseId: string;
    courseCode: string;
    courseTitle: string;
  };
  AddAssessment: {
    courseId: string;
    courseCode: string;
    courseTitle: string;
  };
  AddSubmission: {
    assessmentId: string;
    assessmentTitle: string;
    courseId: string;
  };
  StudentDetail: {
    studentId: string;
    studentName: string;
  };
  ProfileDetail: undefined;
  RecordScreen: undefined;
  CapturesScreen: undefined;
  VideoPlayer: { uri: string };
  ViewAnnouncement: {
    courseId: string;
    courseCode: string;
    courseTitle: string;
    announcement: import('@/services/api').BackendAnnouncement;
  };
  Attendance: {
    courseId: string;
    courseCode: string;
    courseTitle: string;
    students: Array<{
      id: string;
      name: string;
      email: string;
      profile_picture?: string;
    }>;
  };
};
