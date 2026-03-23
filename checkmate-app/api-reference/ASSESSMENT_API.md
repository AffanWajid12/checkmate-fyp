# Assessment Management API Documentation

## Base URLs
```
http://localhost:5000/api/courses/:courseId/assessments  (for course-specific assessments)
http://localhost:5000/api/assessments                     (for individual assessment operations)
```

## Authentication
All endpoints require authentication. Include JWT token in header:
```
Authorization: Bearer <your_access_token>
```

---

## Endpoints

### 1. Get Assessments by Course
**GET** `/api/courses/:courseId/assessments`

**Query Parameters:**
- `status` (optional) - Filter by status: "active", "upcoming", "graded"
- `type` (optional) - Filter by type: "exam", "quiz", "homework", "project", "assignment"
- `sortBy` (optional) - Sort field: "dueDate", "createdAt", "title", "totalPoints" (default: "dueDate")
- `order` (optional) - Sort order: "asc" or "desc" (default: "asc")

**Response:**
```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": {
    "assessments": [
      {
        "_id": "assess001",
        "course": "64a1b2c3...",
        "title": "Midterm Examination",
        "type": "exam",
        "description": "Comprehensive exam covering chapters 1-5",
        "totalPoints": 100,
        "dueDate": "2025-12-15T23:59:00.000Z",
        "status": "active",
        "submissionCount": 23,
        "totalStudents": 84,
        "gradedCount": 5,
        "notGradedCount": 18,
        "avgGrade": 87.5,
        "createdBy": {
          "_id": "64a1b2c3...",
          "firstName": "Sarah",
          "lastName": "Johnson"
        },
        "createdAt": "2025-11-15T10:00:00.000Z",
        "updatedAt": "2025-12-10T08:30:00.000Z"
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

**Status Calculation:**
- `upcoming`: Current date < due date AND no submissions yet
- `active`: Current date < due date AND has submissions
- `graded`: Current date > due date (regardless of grading status)

**Access:**
- **Professor:** Must be course owner
- **Student:** Must be enrolled, only sees visible assessments
- **Admin:** Full access

---

### 2. Get Assessment by ID
**GET** `/api/assessments/:assessmentId`

**Response:**
```json
{
  "success": true,
  "message": "Assessment retrieved successfully",
  "data": {
    "_id": "assess001",
    "course": {
      "_id": "64a1b2c3...",
      "code": "PSY101",
      "title": "Introduction to Psychology"
    },
    "title": "Midterm Examination",
    "type": "exam",
    "description": "Comprehensive exam covering chapters 1-5",
    "instructions": "Answer all questions. Show your work for partial credit.",
    "totalPoints": 100,
    "dueDate": "2025-12-15T23:59:00.000Z",
    "allowLateSubmissions": true,
    "latePenalty": 10,
    "visibleToStudents": true,
    "status": "active",
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
        "studentAvatar": "https://...",
        "submittedAt": "2025-12-10T10:27:00.000Z",
        "status": "not-graded",
        "grade": null,
        "percentage": null,
        "fileCount": 3
      }
    ],
    "createdBy": {
      "_id": "64a1b2c3...",
      "firstName": "Sarah",
      "lastName": "Johnson"
    },
    "createdAt": "2025-11-15T10:00:00.000Z",
    "updatedAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

### 3. Create Assessment
**POST** `/api/courses/:courseId/assessments`

**Access:** Professor only (course owner)

**Request Body:**
```json
{
  "title": "Midterm Examination",
  "type": "exam",
  "description": "Comprehensive exam covering chapters 1-5",
  "instructions": "Answer all questions. Show your work for partial credit.",
  "totalPoints": 100,
  "dueDate": "2025-12-15T23:59:00.000Z",
  "allowLateSubmissions": true,
  "latePenalty": 10,
  "visibleToStudents": true,
  "attachmentFiles": [
    {
      "fileName": "exam_paper.pdf",
      "fileUrl": "file:///storage/emulated/0/CheckMate/assessments/exam_paper.pdf",
      "fileSize": 2457600,
      "mimeType": "application/pdf"
    },
    {
      "fileName": "formula_sheet.pdf",
      "fileUrl": "file:///storage/emulated/0/CheckMate/assessments/formula_sheet.pdf",
      "fileSize": 512000,
      "mimeType": "application/pdf"
    }
  ]
}
```

**Validation Rules:**
- `title`: 3-200 characters (required)
- `type`: "exam" | "quiz" | "homework" | "project" | "assignment" (required)
- `description`: max 2000 characters (optional)
- `instructions`: max 5000 characters (optional)
- `totalPoints`: 1-1000 (required)
- `dueDate`: ISO 8601 date, must be in the future (required)
- `allowLateSubmissions`: boolean (optional, default: false)
- `latePenalty`: 0-100 (optional, default: 0)
- `visibleToStudents`: boolean (optional, default: true)
- `attachmentFiles`: array of file objects (optional)
  - `fileName`: 1-255 characters (required if attachmentFiles provided)
  - `fileUrl`: 1-500 characters, local file path (required if attachmentFiles provided)
  - `fileSize`: positive integer in bytes (required if attachmentFiles provided)
  - `mimeType`: 1-100 characters (required if attachmentFiles provided)

**Response:**
```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "_id": "assess001",
    "course": "64a1b2c3...",
    "title": "Midterm Examination",
    "type": "exam",
    "totalPoints": 100,
    "dueDate": "2025-12-15T23:59:00.000Z",
    "attachmentFiles": [
      {
        "fileName": "exam_paper.pdf",
        "fileUrl": "file:///storage/emulated/0/CheckMate/assessments/exam_paper.pdf",
        "fileSize": 2457600,
        "mimeType": "application/pdf",
        "uploadedAt": "2025-12-10T10:30:00.000Z",
        "_id": "file001"
      },
      {
        "fileName": "formula_sheet.pdf",
        "fileUrl": "file:///storage/emulated/0/CheckMate/assessments/formula_sheet.pdf",
        "fileSize": 512000,
        "mimeType": "application/pdf",
        "uploadedAt": "2025-12-10T10:30:00.000Z",
        "_id": "file002"
      }
    ],
    "createdBy": {
      "_id": "64a1b2c3...",
      "firstName": "Sarah",
      "lastName": "Johnson"
    },
    "createdAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

### 4. Update Assessment
**PATCH** `/api/assessments/:assessmentId`

**Access:** Professor only (course owner)

**Request Body (all fields optional):**
```json
{
  "title": "Midterm Exam - Updated",
  "description": "Updated description",
  "totalPoints": 120,
  "dueDate": "2025-12-18T23:59:00.000Z",
  "allowLateSubmissions": false,
  "visibleToStudents": true,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "data": {
    "_id": "assess001",
    "title": "Midterm Exam - Updated",
    "updatedAt": "2025-12-10T10:35:00.000Z"
  }
}
```

---

### 5. Delete Assessment
**DELETE** `/api/assessments/:assessmentId`

**Access:** Professor only (course owner)

**Response:**
```json
{
  "success": true,
  "message": "Assessment deleted successfully",
  "data": null
}
```

**Note:** This is a soft delete (sets `isActive: false`).

---

## Assessment Types

| Type | Description | Typical Use Case |
|------|-------------|------------------|
| `exam` | Formal examination | Midterms, Finals |
| `quiz` | Short assessment | Quick knowledge checks |
| `homework` | Take-home work | Practice problems |
| `project` | Long-term project | Research papers, group work |
| `assignment` | General assignment | Essays, lab reports |

---

## Assessment Status Logic

```javascript
// Status is computed dynamically based on:
const now = new Date();
const dueDate = new Date(assessment.dueDate);

if (now > dueDate) {
  status = 'graded';  // Past due
} else if (submissionCount > 0) {
  status = 'active';  // Has submissions
} else {
  status = 'upcoming';  // No submissions yet
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "dueDate",
      "message": "Due date must be in the future"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Only the course professor can create assessments"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Assessment not found"
}
```

---

## Testing with cURL

### 1. Get all assessments for a course
```bash
curl -X GET "http://localhost:5000/api/courses/COURSE_ID/assessments?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Create an assessment
```bash
curl -X POST http://localhost:5000/api/courses/COURSE_ID/assessments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Midterm Examination",
    "type": "exam",
    "description": "Comprehensive exam",
    "totalPoints": 100,
    "dueDate": "2025-12-15T23:59:00.000Z",
    "allowLateSubmissions": true,
    "latePenalty": 10
  }'
```

### 3. Get single assessment
```bash
curl -X GET http://localhost:5000/api/assessments/ASSESSMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Update an assessment
```bash
curl -X PATCH http://localhost:5000/api/assessments/ASSESSMENT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Updated Title",
    "totalPoints": 120
  }'
```

### 5. Delete an assessment
```bash
curl -X DELETE http://localhost:5000/api/assessments/ASSESSMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Example Workflow

1. **Professor creates a course**
2. **Professor creates multiple assessments**
   - Midterm exam (100 points, due in 2 weeks)
   - Weekly quizzes (20 points each)
   - Final project (200 points, due end of semester)
3. **Students view assessments** (only visible ones)
4. **Students submit work** (Phase 6 - Submission Management)
5. **Professor grades submissions** (Phase 6)
6. **Students view grades**

---

## Integration Notes

- Assessments are always linked to a course
- Only course professors can create/modify assessments
- Students only see assessments marked as `visibleToStudents: true`
- Assessment status is computed dynamically based on due date and submissions
- Soft delete preserves data for record-keeping
