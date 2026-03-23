export type RootStackParamList = {
  GetStarted: undefined;
  Login: undefined;
  SignUp: undefined;
  MainTabs: undefined;
  AddCourse: undefined;
  ViewCourse: {
    id: string;
    title: string;
    code: string;
    professor: string;
    enrolledStudents: number;
    assessments: number;
  };
  ViewAssessments: {
    courseId: string;
    courseCode: string;
    courseTitle: string;
  };
  ViewAssessmentDetail: {
    assessmentId: string;
    assessmentTitle: string;
    courseCode: string;
  };
  AddAnnouncement: {
    courseId: string;
    courseCode: string;
    courseTitle: string;
  };  AddAssessment: {
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
};
