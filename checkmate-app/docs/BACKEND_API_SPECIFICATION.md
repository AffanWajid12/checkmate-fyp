# CheckMate Backend API Integration Specification

**Version:** 1.0  
**Date:** December 10, 2025  
**Purpose:** Complete API specification for CheckMate Mobile App frontend integration

---

## Table of Contents

1. [Authentication APIs](#1-authentication-apis)
2. [Course Management APIs](#2-course-management-apis)
3. [Assessment Management APIs](#3-assessment-management-apis)
4. [Submission Management APIs](#4-submission-management-apis)
5. [Student Management APIs](#5-student-management-apis)
6. [Document Scanner APIs](#6-document-scanner-apis)
7. [Mongoose Schemas](#7-mongoose-schemas)
8. [Error Handling](#8-error-handling)
9. [File Upload Specifications](#9-file-upload-specifications)

---

## 1. Authentication APIs

### 1.1 Register User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "professor@university.edu",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "professor",
  "department": "Computer Science"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "email": "professor@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "professor",
      "department": "Computer Science",
      "createdAt": "2025-12-10T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- Email: Valid email format, unique
- Password: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
- FirstName/LastName: Required, 2-50 characters
- Role: Enum ["professor", "student", "admin"]

---

### 1.2 Login User

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "professor@university.edu",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k1",
      "email": "professor@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "professor",
      "department": "Computer Science",
      "profileImage": "https://storage.example.com/profiles/user123.jpg"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 1.3 Refresh Token

**Endpoint:** `POST /api/auth/refresh`

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

## 2. Course Management APIs

### 2.1 Get All Courses

**Endpoint:** `GET /api/courses`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
?semester=Fall 2024&page=1&limit=20&search=psychology
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "title": "Introduction to Psychology",
        "code": "PSY101",
        "section": "A",
        "semester": "Fall 2024",
        "year": 2024,
        "studentCount": 84,
        "professor": {
          "id": "64a1b2c3d4e5f6g7h8i9j0k2",
          "firstName": "Sarah",
          "lastName": "Johnson"
        },
        "assessmentCount": 8,
        "schedule": {
          "days": ["Monday", "Wednesday", "Friday"],
          "time": "10:00 AM - 11:30 AM",
          "location": "Room 204"
        },
        "createdAt": "2025-09-01T08:00:00.000Z",
        "updatedAt": "2025-12-10T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCourses": 45,
      "limit": 20
    }
  }
}
```

---

### 2.2 Get Course by ID

**Endpoint:** `GET /api/courses/:courseId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Introduction to Psychology",
    "code": "PSY101",
    "section": "A",
    "semester": "Fall 2024",
    "year": 2024,
    "description": "An introductory course covering fundamental concepts in psychology...",
    "credits": 3,
    "professor": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah.johnson@university.edu",
      "profileImage": "https://storage.example.com/profiles/prof123.jpg"
    },
    "enrolledStudents": 84,
    "assessmentCount": 8,
    "schedule": {
      "days": ["Monday", "Wednesday", "Friday"],
      "time": "10:00 AM - 11:30 AM",
      "location": "Room 204"
    },
    "announcements": [
      {
        "id": "ann001",
        "title": "Quiz 3 Postponed",
        "content": "Quiz 3 has been moved to next Friday due to...",
        "postedBy": "Prof. Johnson",
        "postedAt": "2025-12-09T14:30:00.000Z",
        "priority": "high"
      }
    ],
    "recentActivity": [
      {
        "type": "submission",
        "message": "23 new submissions for Midterm Exam",
        "timestamp": "2025-12-10T08:15:00.000Z"
      }
    ],
    "createdAt": "2025-09-01T08:00:00.000Z",
    "updatedAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

### 2.3 Create Course

**Endpoint:** `POST /api/courses`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Introduction to Psychology",
  "code": "PSY101",
  "section": "A",
  "semester": "Fall 2024",
  "year": 2024,
  "description": "An introductory course covering fundamental concepts in psychology",
  "credits": 3,
  "schedule": {
    "days": ["Monday", "Wednesday", "Friday"],
    "time": "10:00 AM - 11:30 AM",
    "location": "Room 204"
  },
  "maxStudents": 100
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Introduction to Psychology",
    "code": "PSY101",
    "section": "A",
    "semester": "Fall 2024",
    "year": 2024,
    "professorId": "64a1b2c3d4e5f6g7h8i9j0k2",
    "createdAt": "2025-12-10T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- Title: Required, 3-200 characters
- Code: Required, 3-20 characters, unique per semester
- Section: Required, 1-10 characters
- Credits: Number, 1-6
- MaxStudents: Number, 1-500

---

### 2.4 Update Course

**Endpoint:** `PATCH /api/courses/:courseId`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body (partial update):**
```json
{
  "title": "Advanced Psychology",
  "description": "Updated course description",
  "schedule": {
    "days": ["Tuesday", "Thursday"],
    "time": "2:00 PM - 3:30 PM",
    "location": "Room 305"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Advanced Psychology",
    "updatedAt": "2025-12-10T10:35:00.000Z"
  }
}
```

---

### 2.5 Delete Course

**Endpoint:** `DELETE /api/courses/:courseId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

---

## 3. Assessment Management APIs

### 3.1 Get Assessments by Course

**Endpoint:** `GET /api/courses/:courseId/assessments`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
?status=active&sortBy=dueDate&order=asc
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": "assess001",
        "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
        "title": "Midterm Examination",
        "type": "exam",
        "description": "Covers chapters 1-5",
        "totalPoints": 100,
        "dueDate": "2025-12-13T23:59:00.000Z",
        "status": "active",
        "submissionCount": 23,
        "totalStudents": 84,
        "gradedCount": 5,
        "avgGrade": null,
        "createdAt": "2025-11-15T10:00:00.000Z",
        "updatedAt": "2025-12-10T08:30:00.000Z"
      },
      {
        "id": "assess002",
        "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
        "title": "Final Project Submission",
        "type": "project",
        "description": "Research paper on cognitive psychology",
        "totalPoints": 200,
        "dueDate": "2025-12-20T23:59:00.000Z",
        "status": "upcoming",
        "submissionCount": 0,
        "totalStudents": 84,
        "gradedCount": 0,
        "avgGrade": null,
        "createdAt": "2025-11-01T10:00:00.000Z",
        "updatedAt": "2025-11-01T10:00:00.000Z"
      },
      {
        "id": "assess003",
        "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
        "title": "Quiz 3 - Derivatives",
        "type": "quiz",
        "description": "Short quiz on derivative concepts",
        "totalPoints": 50,
        "dueDate": "2025-12-06T17:00:00.000Z",
        "status": "graded",
        "submissionCount": 78,
        "totalStudents": 84,
        "gradedCount": 78,
        "avgGrade": 87,
        "createdAt": "2025-11-20T10:00:00.000Z",
        "updatedAt": "2025-12-07T15:00:00.000Z"
      }
    ],
    "stats": {
      "totalAssessments": 8,
      "activeAssessments": 2,
      "upcomingAssessments": 3,
      "completedAssessments": 3
    }
  }
}
```

**Status Calculation Logic:**
- `active`: Current date is before dueDate AND submissionCount < totalStudents
- `upcoming`: Current date is before dueDate AND assessment hasn't started yet
- `graded`: All submissions are graded OR dueDate has passed

---

### 3.2 Get Assessment Detail

**Endpoint:** `GET /api/assessments/:assessmentId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "assess001",
    "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "courseCode": "PSY101",
    "courseTitle": "Introduction to Psychology",
    "title": "Midterm Examination",
    "type": "exam",
    "description": "Comprehensive exam covering chapters 1-5 including cognitive processes, behavioral psychology, and research methods.",
    "totalPoints": 100,
    "dueDate": "2025-12-13T23:59:00.000Z",
    "status": "active",
    "instructions": "Answer all questions. Show your work for partial credit.",
    "allowLateSubmissions": true,
    "latePenalty": 10,
    "submissionStats": {
      "submitted": 23,
      "notSubmitted": 61,
      "graded": 5,
      "notGraded": 18,
      "totalStudents": 84
    },
    "recentSubmissions": [
      {
        "id": "sub001",
        "studentId": "student001",
        "studentName": "Jane Doe",
        "studentAvatar": "https://storage.example.com/avatars/student001.jpg",
        "submittedAt": "2025-12-10T10:27:00.000Z",
        "status": "not-graded",
        "grade": null,
        "fileCount": 3
      },
      {
        "id": "sub002",
        "studentId": "student002",
        "studentName": "John Smith",
        "studentAvatar": "https://storage.example.com/avatars/student002.jpg",
        "submittedAt": "2025-12-10T09:15:00.000Z",
        "status": "graded",
        "grade": 88,
        "percentage": "88%",
        "fileCount": 5
      }
    ],
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

### 3.3 Create Assessment

**Endpoint:** `POST /api/courses/:courseId/assessments`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Midterm Examination",
  "type": "exam",
  "description": "Covers chapters 1-5",
  "instructions": "Answer all questions. Show your work.",
  "totalPoints": 100,
  "dueDate": "2025-12-13T23:59:00.000Z",
  "allowLateSubmissions": true,
  "latePenalty": 10,
  "visibleToStudents": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "id": "assess001",
    "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Midterm Examination",
    "status": "upcoming",
    "createdAt": "2025-12-10T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- Title: Required, 3-200 characters
- Type: Enum ["exam", "quiz", "homework", "project", "assignment"]
- TotalPoints: Number, 1-1000
- DueDate: Valid ISO date, must be future date

---

### 3.4 Update Assessment

**Endpoint:** `PATCH /api/assessments/:assessmentId`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Midterm Exam - Updated",
  "dueDate": "2025-12-15T23:59:00.000Z",
  "totalPoints": 120
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "data": {
    "id": "assess001",
    "updatedAt": "2025-12-10T10:35:00.000Z"
  }
}
```

---

### 3.5 Delete Assessment

**Endpoint:** `DELETE /api/assessments/:assessmentId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Assessment deleted successfully"
}
```

---

## 4. Submission Management APIs

### 4.1 Get All Submissions for Assessment

**Endpoint:** `GET /api/assessments/:assessmentId/submissions`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
?status=not-graded&sortBy=submittedAt&order=desc&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "sub001",
        "assessmentId": "assess001",
        "studentId": "student001",
        "student": {
          "id": "student001",
          "firstName": "Jane",
          "lastName": "Doe",
          "email": "jane.doe@university.edu",
          "studentNumber": "STU001",
          "avatar": "https://storage.example.com/avatars/student001.jpg"
        },
        "submittedAt": "2025-12-10T10:27:00.000Z",
        "status": "not-graded",
        "grade": null,
        "percentage": null,
        "feedback": null,
        "files": [
          {
            "id": "file001",
            "originalName": "exam_page_1.pdf",
            "fileUrl": "https://storage.example.com/submissions/sub001/file001.pdf",
            "fileType": "application/pdf",
            "fileSize": 2048576,
            "uploadedAt": "2025-12-10T10:27:00.000Z"
          }
        ],
        "isLate": false,
        "penaltyApplied": 0
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalSubmissions": 84,
      "limit": 20
    }
  }
}
```

---

### 4.2 Create Submission (Scan/Upload)

**Endpoint:** `POST /api/assessments/:assessmentId/submissions`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
studentId: student001
files: [file1.pdf, file2.pdf, file3.jpg]
notes: "Scanned via mobile app"
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "id": "sub001",
    "assessmentId": "assess001",
    "studentId": "student001",
    "submittedAt": "2025-12-10T10:30:00.000Z",
    "status": "not-graded",
    "fileCount": 3,
    "files": [
      {
        "id": "file001",
        "originalName": "file1.pdf",
        "fileUrl": "https://storage.example.com/submissions/sub001/file001.pdf",
        "fileSize": 2048576
      }
    ]
  }
}
```

---

### 4.3 Bulk Create Submissions (Scanner Flow)

**Endpoint:** `POST /api/assessments/:assessmentId/submissions/bulk`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body:**
```
submissions: [
  {
    studentId: "student001",
    fileIndex: 0
  },
  {
    studentId: "student002",
    fileIndex: 1
  }
]
files: [file1.pdf, file2.pdf]
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "5 submissions created successfully",
  "data": {
    "successCount": 5,
    "failedCount": 0,
    "submissions": [
      {
        "id": "sub001",
        "studentId": "student001",
        "status": "not-graded"
      },
      {
        "id": "sub002",
        "studentId": "student002",
        "status": "not-graded"
      }
    ]
  }
}
```

---

### 4.4 Update Submission (Grade)

**Endpoint:** `PATCH /api/submissions/:submissionId`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "grade": 88,
  "feedback": "Good work! Minor errors in question 3.",
  "status": "graded"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Submission graded successfully",
  "data": {
    "id": "sub001",
    "grade": 88,
    "percentage": "88%",
    "status": "graded",
    "gradedAt": "2025-12-10T10:35:00.000Z",
    "gradedBy": "64a1b2c3d4e5f6g7h8i9j0k2"
  }
}
```

---

### 4.5 Get Submission by ID

**Endpoint:** `GET /api/submissions/:submissionId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "sub001",
    "assessmentId": "assess001",
    "assessment": {
      "title": "Midterm Examination",
      "totalPoints": 100
    },
    "studentId": "student001",
    "student": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@university.edu",
      "studentNumber": "STU001"
    },
    "submittedAt": "2025-12-10T10:27:00.000Z",
    "status": "graded",
    "grade": 88,
    "percentage": "88%",
    "feedback": "Good work! Minor errors in question 3.",
    "files": [
      {
        "id": "file001",
        "originalName": "exam_page_1.pdf",
        "fileUrl": "https://storage.example.com/submissions/sub001/file001.pdf",
        "fileType": "application/pdf",
        "fileSize": 2048576,
        "uploadedAt": "2025-12-10T10:27:00.000Z"
      }
    ],
    "isLate": false,
    "penaltyApplied": 0,
    "gradedAt": "2025-12-10T12:15:00.000Z",
    "gradedBy": {
      "id": "64a1b2c3d4e5f6g7h8i9j0k2",
      "firstName": "Sarah",
      "lastName": "Johnson"
    }
  }
}
```

---

## 5. Student Management APIs

### 5.1 Get Enrolled Students

**Endpoint:** `GET /api/courses/:courseId/students`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
```
?search=jane&sortBy=lastName&order=asc&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "student001",
        "studentNumber": "STU001",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane.doe@university.edu",
        "avatar": "https://storage.example.com/avatars/student001.jpg",
        "enrolledAt": "2025-09-01T08:00:00.000Z",
        "submissionStats": {
          "submitted": 6,
          "total": 8,
          "avgGrade": 87.5
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalStudents": 84,
      "limit": 20
    }
  }
}
```

---

### 5.2 Enroll Student

**Endpoint:** `POST /api/courses/:courseId/students`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "student001"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "studentId": "student001",
    "enrolledAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

### 5.3 Remove Student

**Endpoint:** `DELETE /api/courses/:courseId/students/:studentId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student removed from course successfully"
}
```

---

### 5.4 Bulk Enroll Students

**Endpoint:** `POST /api/courses/:courseId/students/bulk`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentIds": ["student001", "student002", "student003"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "3 students enrolled successfully",
  "data": {
    "successCount": 3,
    "failedCount": 0,
    "enrolled": ["student001", "student002", "student003"]
  }
}
```

---

## 6. Document Scanner APIs

### 6.1 Upload Scanned PDF

**Endpoint:** `POST /api/assessments/:assessmentId/scan`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
pdfFile: scanned-documents.pdf
studentMapping: [
  { studentId: "student001", pageNumbers: [1, 2, 3] },
  { studentId: "student002", pageNumbers: [4, 5, 6] }
]
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Scanned documents processed successfully",
  "data": {
    "processedSubmissions": 2,
    "submissions": [
      {
        "id": "sub001",
        "studentId": "student001",
        "fileUrl": "https://storage.example.com/submissions/sub001/scanned.pdf"
      },
      {
        "id": "sub002",
        "studentId": "student002",
        "fileUrl": "https://storage.example.com/submissions/sub002/scanned.pdf"
      }
    ]
  }
}
```

---

## 7. Mongoose Schemas

### 7.1 User Schema

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['professor', 'student', 'admin'],
    default: 'professor',
    required: true
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
  profileImage: {
    type: String,
    default: null
  },
  studentNumber: {
    type: String,
    sparse: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ studentNumber: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
```

---

### 7.2 Course Schema

```javascript
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  days: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  time: String,
  location: String
}, { _id: false });

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true,
    maxlength: 10
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    trim: true,
    maxlength: 50
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020,
    max: 2100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  credits: {
    type: Number,
    min: 1,
    max: 6,
    default: 3
  },
  professor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: scheduleSchema,
  maxStudents: {
    type: Number,
    min: 1,
    max: 500,
    default: 100
  },
  announcements: [announcementSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound unique index (code + section + semester + year)
courseSchema.index({ code: 1, section: 1, semester: 1, year: 1 }, { unique: true });
courseSchema.index({ professor: 1 });
courseSchema.index({ semester: 1, year: 1 });

// Virtual for enrolled students count
courseSchema.virtual('enrolledStudents', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  count: true
});

// Virtual for assessment count
courseSchema.virtual('assessmentCount', {
  ref: 'Assessment',
  localField: '_id',
  foreignField: 'course',
  count: true
});

module.exports = mongoose.model('Course', courseSchema);
```

---

### 7.3 Assessment Schema

```javascript
const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  type: {
    type: String,
    enum: ['exam', 'quiz', 'homework', 'project', 'assignment'],
    required: [true, 'Assessment type is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  totalPoints: {
    type: Number,
    required: [true, 'Total points is required'],
    min: 1,
    max: 1000
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  allowLateSubmissions: {
    type: Boolean,
    default: false
  },
  latePenalty: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  visibleToStudents: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
assessmentSchema.index({ course: 1, dueDate: -1 });
assessmentSchema.index({ dueDate: 1 });
assessmentSchema.index({ type: 1 });

// Virtual for submissions
assessmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assessment'
});

// Virtual for status (computed field)
assessmentSchema.virtual('status').get(function() {
  const now = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (now > dueDate) {
    return 'graded';
  } else if (now < dueDate && this.submissionCount > 0) {
    return 'active';
  } else {
    return 'upcoming';
  }
});

module.exports = mongoose.model('Assessment', assessmentSchema);
```

---

### 7.4 Submission Schema

```javascript
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const submissionSchema = new mongoose.Schema({
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['not-graded', 'graded', 'pending'],
    default: 'not-graded'
  },
  grade: {
    type: Number,
    min: 0,
    default: null
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  files: [fileSchema],
  isLate: {
    type: Boolean,
    default: false
  },
  penaltyApplied: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  gradedAt: {
    type: Date,
    default: null
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
submissionSchema.index({ assessment: 1, student: 1 }, { unique: true });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ student: 1 });

// Virtual for percentage
submissionSchema.virtual('percentage').get(function() {
  if (this.grade === null || !this.populated('assessment')) return null;
  return `${Math.round((this.grade / this.assessment.totalPoints) * 100)}%`;
});

// Pre-save hook to check if submission is late
submissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const assessment = await mongoose.model('Assessment').findById(this.assessment);
    if (assessment && this.submittedAt > assessment.dueDate) {
      this.isLate = true;
      if (assessment.allowLateSubmissions) {
        this.penaltyApplied = assessment.latePenalty;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Submission', submissionSchema);
```

---

### 7.5 Enrollment Schema

```javascript
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'dropped', 'completed'],
    default: 'active'
  },
  finalGrade: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  }
}, {
  timestamps: true
});

// Compound unique index (one enrollment per student per course)
enrollmentSchema.index({ course: 1, student: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
```

---

## 8. Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Email is already in use"
    }
  ],
  "statusCode": 400
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Internal server error |

---

## 9. File Upload Specifications

### Supported File Types

**Documents:**
- PDF: `application/pdf`
- Images: `image/jpeg`, `image/png`, `image/jpg`

**Max File Sizes:**
- Single file: 10 MB
- Total per submission: 50 MB
- Bulk scanner upload: 100 MB

### Storage Structure

```
/uploads/
  /submissions/
    /{submissionId}/
      file001.pdf
      file002.jpg
  /profiles/
    /{userId}/
      avatar.jpg
  /courses/
    /{courseId}/
      materials/
        lecture01.pdf
```

### File Upload Headers

```
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

---

## 10. Authentication & Authorization

### JWT Token Structure

**Access Token (expires in 1 hour):**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "email": "professor@university.edu",
  "role": "professor",
  "iat": 1702210800,
  "exp": 1702214400
}
```

**Refresh Token (expires in 7 days):**
```json
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "type": "refresh",
  "iat": 1702210800,
  "exp": 1702815600
}
```

### Authorization Rules

**Professor:**
- Full CRUD on own courses
- Full CRUD on assessments in own courses
- View/grade submissions in own courses
- Manage students in own courses

**Student:**
- View enrolled courses (read-only)
- View assessments in enrolled courses
- Create/view own submissions
- View own grades

**Admin:**
- Full access to all resources

---

## 11. Pagination & Filtering

### Standard Query Parameters

```
?page=1
&limit=20
&sortBy=createdAt
&order=desc
&search=psychology
&status=active
```

### Response Format with Pagination

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 12. Real-time Features (Optional)

### WebSocket Events

**Assessment Submission Updates:**
```javascript
// Client subscribes
socket.emit('subscribe:assessment', { assessmentId: 'assess001' });

// Server broadcasts
socket.on('submission:new', {
  assessmentId: 'assess001',
  submissionId: 'sub001',
  studentName: 'Jane Doe'
});
```

---

## 13. Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/checkmate
MONGODB_URI_PROD=mongodb+srv://username:password@cluster.mongodb.net/checkmate

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
AWS_S3_BUCKET=checkmate-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@checkmate.edu
SMTP_PASSWORD=your-email-password

# Frontend
CORS_ORIGIN=http://localhost:19000,exp://localhost:8081
```

---

## 14. Testing Data Seeder

### Sample Seed Script Structure

```javascript
// seed.js
const seedUsers = async () => {
  const professor = await User.create({
    email: 'professor@university.edu',
    password: 'Password123',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'professor',
    department: 'Psychology'
  });
  return professor;
};

const seedCourses = async (professorId) => {
  const course = await Course.create({
    title: 'Introduction to Psychology',
    code: 'PSY101',
    section: 'A',
    semester: 'Fall 2024',
    year: 2024,
    professor: professorId
  });
  return course;
};

// Run: node seed.js
```

---

## 15. API Rate Limiting

**Recommended Limits:**
- Authentication endpoints: 5 requests/minute
- Standard CRUD: 100 requests/minute
- File uploads: 10 requests/minute

---

## Summary Checklist

- [ ] User authentication (register, login, refresh)
- [ ] Course CRUD operations
- [ ] Assessment CRUD operations
- [ ] Submission management (create, read, grade)
- [ ] Student enrollment management
- [ ] File upload handling (single & bulk)
- [ ] Mongoose schemas with indexes
- [ ] Error handling & validation
- [ ] JWT authentication
- [ ] Pagination & filtering
- [ ] Authorization middleware
- [ ] File storage (local/S3)
- [ ] Rate limiting
- [ ] CORS configuration
- [ ] Environment variables

---

**End of Specification**

For questions or clarifications, contact the frontend development team.
