# Backend Test Results

Below are the detailed execution results for the backend testing suites categorized by feature, presented in the requested format.

### 4.2.1 Authentication Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| AUTH-01 | GET `/api/auth/me` (No token) - Verify that requests without auth headers are rejected. | Empty Headers | Returns 401 Unauthorized with "Authorization header missing" | Match Expected | PASS |
| AUTH-02 | GET `/api/auth/me` (Invalid token) - Verify that requests with invalid/expired tokens are rejected. | `Bearer invalid-token` | Returns 401 Unauthorized with "Invalid or expired token" | Match Expected | PASS |
| AUTH-03 | GET `/api/auth/me` (Valid token) - Verify that a valid token returns the user profile and syncs user to DB. | `Bearer mock-token-STUDENT` | Returns 200 OK with correct user profile data (`role: STUDENT`) | Match Expected | PASS |

### 4.2.2 User Profile Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| PROF-01 | PATCH `/api/users/profile` - Verify user can update their name. | `name: 'New Name'` | Returns 200 OK, database reflects updated name | Match Expected | PASS |
| PROF-02 | PATCH `/api/users/change-password` - Verify missing password returns an error. | Empty Body | Returns 400 Bad Request with "Password is required" | Match Expected | PASS |
| PROF-03 | POST `/api/users/profile-picture` - Verify user can upload and update profile picture URL. | Dummy Image File (`profile.jpg`) | Returns 200 OK, returns signed URL, DB stores `profile-pictures/` path | Match Expected | PASS |

### 4.2.3 Admin Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ADM-01 | GET `/api/admin/users` (Non-admin) - Verify non-admin users cannot fetch all users. | Student Auth Token | Returns 403 Forbidden | Match Expected | PASS |
| ADM-02 | GET `/api/admin/users` (Admin) - Verify admin can fetch all users. | Admin Auth Token | Returns 200 OK with list of users | Match Expected | PASS |
| ADM-03 | PATCH `/api/admin/users/:id/role` - Verify admin can update a user's role. | `role: 'TEACHER'` | Returns 200 OK, database reflects new role | Match Expected | PASS |
| ADM-04 | DELETE `/api/admin/users/:id` - Verify admin can delete a user from the system. | Target User ID | Returns 200 OK, target user removed from database | Match Expected | PASS |

### 4.2.4 Course Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| CRS-01 | POST `/api/courses` (Teacher) - Verify a teacher can create a new course. | `title: 'Math 101'`, `desc: 'Basic Math'` | Returns 201 Created with generated course code | Match Expected | PASS |
| CRS-02 | POST `/api/courses` (Student) - Verify a student cannot create a course. | `title: 'Math 101'` | Returns 403 Forbidden | Match Expected | PASS |
| CRS-03 | GET `/api/courses/my-courses` - Verify a teacher can retrieve their own courses. | Teacher Auth Token | Returns 200 OK with list containing 'History' course | Match Expected | PASS |
| CRS-04 | DELETE `/api/courses/:id` - Verify a teacher can delete their own course. | Target Course ID | Returns 200 OK, course removed from database | Match Expected | PASS |

### 4.2.5 Enrollment Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ENR-01 | POST `/api/courses/enroll` (Valid) - Verify student can enroll in a course. | `code: 'SCI101'` | Returns 201 Created, enrollment record added to DB | Match Expected | PASS |
| ENR-02 | POST `/api/courses/enroll` (Invalid) - Verify invalid course codes are rejected. | `code: 'INVALID'` | Returns 404 Not Found | Match Expected | PASS |
| ENR-03 | POST `/api/courses/enroll` (Duplicate) - Verify double enrollment is blocked. | `code: 'SCI101'` (already enrolled) | Returns 409 Conflict | Match Expected | PASS |
| ENR-04 | GET `/api/courses/enrolled` - Verify student can view their enrolled courses. | Student Auth Token | Returns 200 OK with list containing 'Science' | Match Expected | PASS |
| ENR-05 | DELETE `/api/courses/unenroll/:courseId` - Verify student can unenroll from a course. | Target Course ID | Returns 200 OK, enrollment record deleted | Match Expected | PASS |

### 4.2.6 Announcement Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ANN-01 | POST `/api/courses/:id/announcements` - Verify teacher can post an announcement with files. | `title: 'Welcome'`, `desc: 'Hello'`, Dummy File | Returns 201 Created, DB saves announcement and resources | Match Expected | PASS |
| ANN-02 | GET `/api/courses/:id/announcements` - Verify users can fetch course announcements. | Course ID | Returns 200 OK with list containing 'Exam next week' | Match Expected | PASS |
| ANN-03 | DELETE `/api/courses/:id/announcements/:id` - Verify teacher can delete an announcement. | Announcement ID | Returns 200 OK, announcement removed from database | Match Expected | PASS |

### 4.2.7 Comment Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| CMT-01 | POST `.../announcements/:id/comments` - Verify enrolled student can add a comment. | `content: 'Thanks!'` | Returns 201 Created, comment added to database | Match Expected | PASS |
| CMT-02 | DELETE `.../announcements/:id/comments/:id` - Verify student can delete their own comment. | Target Comment ID | Returns 200 OK, comment removed from database | Match Expected | PASS |

### 4.2.8 Assessment Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ASM-01 | POST `.../announcements/:id/assessments` - Verify teacher can create an assessment. | `title: 'Midterm'`, `type: 'EXAM'`, `total_marks: 100` | Returns 201 Created, assessment added to database | Match Expected | PASS |
| ASM-02 | GET `.../assessments/:id` - Verify users can fetch assessment details. | Assessment ID | Returns 200 OK with assessment data ('Quiz 1') | Match Expected | PASS |
| ASM-03 | DELETE `.../assessments/:id` - Verify teacher can delete an assessment. | Target Assessment ID | Returns 200 OK, assessment removed from database | Match Expected | PASS |

### 4.2.9 Submission Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| SUB-01 | POST `.../assessments/:id/submit` - Verify student can submit an assessment with files. | Dummy PDF File | Returns 201 Created, status is 'SUBMITTED' in DB | Match Expected | PASS |
| SUB-02 | DELETE `.../assessments/:id/submit` - Verify student can unsubmit their assessment. | Target Assessment ID | Returns 200 OK, submission record deleted | Match Expected | PASS |

### 4.2.10 Attendance Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| ATD-01 | POST `/api/courses/:id/attendance` - Verify teacher can mark attendance for a session. | `date: '2026-05-07'`, `status: 'PRESENT'` | Returns 200 OK, attendance session and records saved | Match Expected | PASS |
| ATD-02 | GET `/api/courses/:id/attendance` - Verify teacher can retrieve all attendance sessions. | Course ID | Returns 200 OK with list of created sessions | Match Expected | PASS |
| ATD-03 | DELETE `/api/courses/:id/attendance/:id` - Verify teacher can delete an attendance session. | Session ID | Returns 200 OK, session and associated records cascade deleted | Match Expected | PASS |

### 4.2.11 Reference Materials Test Backend
| ID | Test Case & Objective | Test Data | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|
| REF-01 | POST `/api/reference-materials` - Verify teacher can upload global reference materials. | Dummy PDF File | Returns 201 Created, file info saved to DB | Match Expected | PASS |
| REF-02 | GET `/api/reference-materials` - Verify teacher can fetch their uploaded materials. | Teacher Auth Token | Returns 200 OK with list of materials | Match Expected | PASS |
| REF-03 | DELETE `/api/reference-materials/:id` - Verify teacher can delete their reference material. | Target Material ID | Returns 200 OK, material removed from database | Match Expected | PASS |
