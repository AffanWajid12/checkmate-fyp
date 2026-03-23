# Submission Management API Documentation

## Overview
The Submission Management API allows professors to create, update, grade, and manage student submissions for assessments. The system supports both single and bulk submission creation, with files stored locally on the mobile device.

**Base URLs:**
- `/api/assessments/:assessmentId/submissions` - For assessment-specific submission operations
- `/api/submissions/:submissionId` - For individual submission operations

**Authentication:** All endpoints require a valid JWT token in the Authorization header.

---

## Endpoints

### 1. Get All Submissions for an Assessment

Retrieve all submissions for a specific assessment with statistics.

**Endpoint:** `GET /api/assessments/:assessmentId/submissions`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Access:** Professor only (course owner)

**Query Parameters:**

| Parameter | Type   | Default      | Description                                    |
|-----------|--------|--------------|------------------------------------------------|
| status    | string | -            | Filter by status: not-graded, graded, pending  |
| sortBy    | string | submittedAt  | Sort field: submittedAt, grade, status         |
| order     | string | desc         | Sort order: asc or desc                        |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "_id": "sub001",
        "assessment": "assess001",
        "student": {
          "_id": "student001",
          "firstName": "Jane",
          "lastName": "Doe",
          "email": "jane.doe@university.edu",
          "studentNumber": "STU001",
          "profileImage": "https://..."
        },
        "submittedAt": "2025-12-10T14:30:00.000Z",
        "status": "graded",
        "grade": 85,
        "feedback": "Great work! Consider reviewing chapter 3.",
        "files": [
          {
            "_id": "file001",
            "originalName": "assignment_answers.pdf",
            "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/sub001/assignment_answers.pdf",
            "fileType": "application/pdf",
            "fileSize": 2457600,
            "uploadedAt": "2025-12-10T14:30:00.000Z"
          }
        ],
        "isLate": false,
        "penaltyApplied": 0,
        "gradedAt": "2025-12-11T09:15:00.000Z",
        "gradedBy": {
          "_id": "prof001",
          "firstName": "Sarah",
          "lastName": "Johnson"
        },
        "notes": "Uploaded via scanner",
        "createdAt": "2025-12-10T14:30:00.000Z",
        "updatedAt": "2025-12-11T09:15:00.000Z"
      }
    ],
    "stats": {
      "total": 45,
      "graded": 30,
      "notGraded": 12,
      "pending": 3,
      "lateSubmissions": 5
    }
  }
}
```

**Error Responses:**
- **404 Not Found:** Assessment not found
- **403 Forbidden:** User is not the course owner
- **401 Unauthorized:** Invalid or missing token

---

### 2. Get Submission by ID

Retrieve a specific submission by its ID.

**Endpoint:** `GET /api/submissions/:submissionId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Access:** Professor (course owner) or Student (submission owner)

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Submission retrieved successfully",
  "data": {
    "_id": "sub001",
    "assessment": {
      "_id": "assess001",
      "title": "Midterm Examination",
      "type": "exam",
      "totalPoints": 100,
      "dueDate": "2025-12-15T23:59:00.000Z",
      "course": "course001"
    },
    "student": {
      "_id": "student001",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@university.edu",
      "studentNumber": "STU001",
      "profileImage": null
    },
    "submittedAt": "2025-12-10T14:30:00.000Z",
    "status": "graded",
    "grade": 85,
    "feedback": "Great work! Consider reviewing chapter 3.",
    "files": [
      {
        "_id": "file001",
        "originalName": "assignment_answers.pdf",
        "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/sub001/assignment_answers.pdf",
        "fileType": "application/pdf",
        "fileSize": 2457600,
        "uploadedAt": "2025-12-10T14:30:00.000Z"
      }
    ],
    "isLate": false,
    "penaltyApplied": 0,
    "gradedAt": "2025-12-11T09:15:00.000Z",
    "gradedBy": {
      "_id": "prof001",
      "firstName": "Sarah",
      "lastName": "Johnson"
    },
    "notes": "Uploaded via scanner"
  }
}
```

**Error Responses:**
- **404 Not Found:** Submission not found
- **403 Forbidden:** User doesn't have permission to view this submission
- **401 Unauthorized:** Invalid or missing token

---

### 3. Create Submission for a Student

Create a submission for a specific student (Professor uploads on behalf of student).

**Endpoint:** `POST /api/assessments/:assessmentId/submissions`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Access:** Professor only (course owner)

**Request Body:**
```json
{
  "studentId": "student001",
  "files": [
    {
      "originalName": "scanned_exam_page1.pdf",
      "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/scanned_exam_page1.pdf",
      "fileType": "application/pdf",
      "fileSize": 1048576
    },
    {
      "originalName": "scanned_exam_page2.pdf",
      "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/scanned_exam_page2.pdf",
      "fileType": "application/pdf",
      "fileSize": 987654
    }
  ],
  "notes": "Scanned from paper submission"
}
```

**Validation Rules:**
- `studentId`: Required, must be a valid MongoDB ObjectId
- `files`: Required, array with at least one file
  - `originalName`: 1-255 characters (required)
  - `fileUrl`: 1-500 characters, local file path (required)
  - `fileType`: 1-100 characters (required)
  - `fileSize`: Positive integer in bytes (required)
- `notes`: Optional, max 1000 characters

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Submission created successfully",
  "data": {
    "_id": "sub001",
    "assessment": "assess001",
    "student": {
      "_id": "student001",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@university.edu",
      "studentNumber": "STU001"
    },
    "files": [
      {
        "_id": "file001",
        "originalName": "scanned_exam_page1.pdf",
        "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/scanned_exam_page1.pdf",
        "fileType": "application/pdf",
        "fileSize": 1048576,
        "uploadedAt": "2025-12-11T10:30:00.000Z"
      },
      {
        "_id": "file002",
        "originalName": "scanned_exam_page2.pdf",
        "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/scanned_exam_page2.pdf",
        "fileType": "application/pdf",
        "fileSize": 987654,
        "uploadedAt": "2025-12-11T10:30:00.000Z"
      }
    ],
    "notes": "Scanned from paper submission",
    "submittedAt": "2025-12-11T10:30:00.000Z",
    "status": "not-graded",
    "isLate": false
  }
}
```

**Error Responses:**
- **404 Not Found:** Assessment or student not found
- **403 Forbidden:** User is not the course owner
- **400 Bad Request:**
  - Student is not enrolled in the course
  - Submission already exists for this student
  - Invalid student role
  - Validation errors
- **401 Unauthorized:** Invalid or missing token

---

### 4. Bulk Create Submissions

Create multiple submissions at once (useful for scanner feature).

**Endpoint:** `POST /api/assessments/:assessmentId/submissions/bulk`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Access:** Professor only (course owner)

**Request Body:**
```json
{
  "submissions": [
    {
      "studentId": "student001",
      "files": [
        {
          "originalName": "exam_student1_pages1-3.pdf",
          "fileUrl": "file:///storage/emulated/0/CheckMate/scanned/exam_student1.pdf",
          "fileType": "application/pdf",
          "fileSize": 2457600
        }
      ],
      "notes": "Pages 1-3 from scanner"
    },
    {
      "studentId": "student002",
      "files": [
        {
          "originalName": "exam_student2_pages4-6.pdf",
          "fileUrl": "file:///storage/emulated/0/CheckMate/scanned/exam_student2.pdf",
          "fileType": "application/pdf",
          "fileSize": 2198456
        }
      ],
      "notes": "Pages 4-6 from scanner"
    }
  ]
}
```

**Validation Rules:**
- `submissions`: Required, array with 1-100 items
- Each submission must have:
  - `studentId`: Valid MongoDB ObjectId (required)
  - `files`: Array with at least one file (required)
  - `notes`: Optional, max 1000 characters

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "2 submission(s) created successfully",
  "data": {
    "successCount": 2,
    "skippedCount": 0,
    "created": [
      {
        "_id": "sub001",
        "assessment": "assess001",
        "student": "student001",
        "files": [...],
        "submittedAt": "2025-12-11T10:30:00.000Z"
      },
      {
        "_id": "sub002",
        "assessment": "assess001",
        "student": "student002",
        "files": [...],
        "submittedAt": "2025-12-11T10:30:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- **404 Not Found:** Assessment not found
- **403 Forbidden:** User is not the course owner
- **400 Bad Request:**
  - Invalid student IDs
  - Students not enrolled
  - All students already have submissions
  - Validation errors
- **401 Unauthorized:** Invalid or missing token

---

### 5. Update Submission Files

Update files for an existing submission.

**Endpoint:** `PATCH /api/submissions/:submissionId`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Access:** Professor only (course owner)

**Request Body:**
```json
{
  "files": [
    {
      "originalName": "updated_exam.pdf",
      "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/updated_exam.pdf",
      "fileType": "application/pdf",
      "fileSize": 3145728
    }
  ],
  "notes": "Updated with better scans"
}
```

**Note:** When updating files, the entire files array is replaced.

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Submission updated successfully",
  "data": {
    "_id": "sub001",
    "files": [...],
    "notes": "Updated with better scans",
    "updatedAt": "2025-12-11T11:00:00.000Z"
  }
}
```

**Error Responses:**
- **404 Not Found:** Submission not found
- **403 Forbidden:** User is not the course owner
- **401 Unauthorized:** Invalid or missing token

---

### 6. Grade Submission

Grade a student's submission.

**Endpoint:** `POST /api/submissions/:submissionId/grade`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Access:** Professor only (course owner)

**Request Body:**
```json
{
  "grade": 85,
  "feedback": "Excellent work! You demonstrated a strong understanding of the concepts. Consider reviewing chapter 3 for additional depth."
}
```

**Validation Rules:**
- `grade`: Required, must be a positive number not exceeding assessment's totalPoints
- `feedback`: Optional, max 5000 characters

**Late Penalty Application:**
- If the submission is late (`isLate: true`) and `penaltyApplied > 0`:
  - Final grade = original grade - (original grade × penalty percentage / 100)
  - Example: Grade 85 with 10% penalty = 85 - 8.5 = 76.5

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Submission graded successfully",
  "data": {
    "_id": "sub001",
    "grade": 85,
    "feedback": "Excellent work! You demonstrated a strong understanding...",
    "status": "graded",
    "gradedAt": "2025-12-11T11:30:00.000Z",
    "gradedBy": {
      "_id": "prof001",
      "firstName": "Sarah",
      "lastName": "Johnson"
    },
    "isLate": false,
    "penaltyApplied": 0
  }
}
```

**Error Responses:**
- **404 Not Found:** Submission not found
- **403 Forbidden:** User is not the course owner
- **400 Bad Request:** Grade exceeds total points
- **401 Unauthorized:** Invalid or missing token

---

### 7. Delete Submission

Delete a submission (hard delete).

**Endpoint:** `DELETE /api/submissions/:submissionId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Access:** Professor only (course owner)

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Submission deleted successfully",
  "data": null
}
```

**Error Responses:**
- **404 Not Found:** Submission not found
- **403 Forbidden:** User is not the course owner
- **401 Unauthorized:** Invalid or missing token

---

## Submission Status Types

| Status | Description |
|--------|-------------|
| `not-graded` | Submission has been uploaded but not yet graded |
| `graded` | Submission has been graded with a final grade |
| `pending` | Submission is under review |

---

## File Storage Notes

**Local Storage on Mobile:**
- All files are stored locally on the mobile device
- The backend only stores file metadata (URLs, names, sizes)
- File URLs use the format: `file:///storage/emulated/0/CheckMate/...`
- Files can be organized by:
  - `/CheckMate/submissions/` - Student submission files
  - `/CheckMate/scanned/` - Scanned documents
  - `/CheckMate/assessments/` - Assessment attachment files

**Recommended File Organization:**
```
/storage/emulated/0/CheckMate/
├── submissions/
│   ├── sub001/
│   │   ├── page1.pdf
│   │   └── page2.pdf
│   └── sub002/
│       └── assignment.pdf
├── scanned/
│   ├── exam_batch1.pdf
│   └── exam_batch2.pdf
└── assessments/
    ├── midterm_paper.pdf
    └── formula_sheet.pdf
```

---

## Example Usage

### JavaScript (Fetch API)

```javascript
// Create a single submission
const createSubmission = async (assessmentId, studentId, files, notes) => {
  const response = await fetch(
    `http://localhost:5000/api/assessments/${assessmentId}/submissions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId,
        files,
        notes
      })
    }
  );
  return await response.json();
};

// Bulk create submissions (scanner feature)
const bulkCreateSubmissions = async (assessmentId, submissions) => {
  const response = await fetch(
    `http://localhost:5000/api/assessments/${assessmentId}/submissions/bulk`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ submissions })
    }
  );
  return await response.json();
};

// Grade a submission
const gradeSubmission = async (submissionId, grade, feedback) => {
  const response = await fetch(
    `http://localhost:5000/api/submissions/${submissionId}/grade`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ grade, feedback })
    }
  );
  return await response.json();
};

// Get all submissions for an assessment
const getSubmissions = async (assessmentId, status = null) => {
  const queryParams = status ? `?status=${status}` : '';
  const response = await fetch(
    `http://localhost:5000/api/assessments/${assessmentId}/submissions${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );
  return await response.json();
};
```

### cURL Examples

**Create Single Submission:**
```bash
curl -X POST "http://localhost:5000/api/assessments/assess001/submissions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student001",
    "files": [
      {
        "originalName": "exam.pdf",
        "fileUrl": "file:///storage/emulated/0/CheckMate/submissions/exam.pdf",
        "fileType": "application/pdf",
        "fileSize": 2457600
      }
    ],
    "notes": "Scanned submission"
  }'
```

**Bulk Create Submissions:**
```bash
curl -X POST "http://localhost:5000/api/assessments/assess001/submissions/bulk" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "submissions": [
      {
        "studentId": "student001",
        "files": [{...}]
      },
      {
        "studentId": "student002",
        "files": [{...}]
      }
    ]
  }'
```

**Grade Submission:**
```bash
curl -X POST "http://localhost:5000/api/submissions/sub001/grade" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": 85,
    "feedback": "Great work!"
  }'
```

**Get All Submissions:**
```bash
curl -X GET "http://localhost:5000/api/assessments/assess001/submissions?status=not-graded" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Related Documentation

- [Authentication API](./AUTH_API.md)
- [Course Management API](./COURSE_API.md)
- [Assessment Management API](./ASSESSMENT_API.md)
- [Student Enrollment API](./ENROLLMENT_API.md)
