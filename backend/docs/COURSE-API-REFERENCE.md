# Course API Reference

> **Base URL:** `/api/courses`
> **Last updated:** 2026-03-05

All endpoints require a valid Supabase JWT passed in the `Authorization` header.

```
Authorization: Bearer <token>
```

---

## Role Legend

| Symbol | Role |
|--------|------|
| 🎓 | `TEACHER` only |
| 🧑‍🎓 | `STUDENT` only |
| 🔓 | `TEACHER` **or** `STUDENT` (role checked internally) |

---

## Endpoints

### 1. Create a Course
> 🎓 **TEACHER only**

```
POST /api/courses
```

Creates a new course. A unique 6-character alphanumeric code (e.g. `A3BX9Z`) is auto-generated and returned — share this code with students so they can enroll.

**Request Body**
```json
{
  "title": "Introduction to Computer Science",
  "description": "A beginner-friendly course covering core CS concepts."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | Course title |
| `description` | string | ❌ | Optional course description |

**Response `201`**
```json
{
  "message": "Course created successfully",
  "course": {
    "id": "d1e2f3a4-0000-0000-0000-000000000001",
    "title": "Introduction to Computer Science",
    "description": "A beginner-friendly course covering core CS concepts.",
    "code": "A3BX9Z",
    "teacher_id": "a1b2c3d4-0000-0000-0000-000000000001",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "updatedAt": "2026-03-03T10:00:00.000Z"
  }
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `400` | `"Title is required"` |
| `403` | `"Forbidden"` — not a TEACHER |

---

### 2. Get Teacher's Courses
> 🎓 **TEACHER only**

```
GET /api/courses/my-courses
```

Returns all courses owned by the authenticated teacher, with the full list of enrolled students and announcements for each course.

**Request Body** — none

**Response `200`**
```json
{
  "message": "Courses retrieved successfully",
  "courses": [
    {
      "id": "d1e2f3a4-0000-0000-0000-000000000001",
      "title": "Introduction to Computer Science",
      "description": "A beginner-friendly course covering core CS concepts.",
      "code": "A3BX9Z",
      "teacher_id": "a1b2c3d4-0000-0000-0000-000000000001",
      "createdAt": "2026-03-03T10:00:00.000Z",
      "updatedAt": "2026-03-03T10:00:00.000Z",
      "students": [
        {
          "id": "e1f2a3b4-0000-0000-0000-000000000002",
          "course_id": "d1e2f3a4-0000-0000-0000-000000000001",
          "student_id": "b2c3d4e5-0000-0000-0000-000000000002",
          "student": {
            "id": "b2c3d4e5-0000-0000-0000-000000000002",
            "name": "Alice Johnson",
            "email": "alice@example.com",
            "role": "STUDENT"
          }
        }
      ],
      "announcements": [
        {
          "id": "f1a2b3c4-0000-0000-0000-000000000003",
          "title": "Welcome to the course!",
          "description": "Please read the syllabus.",
          "course_id": "d1e2f3a4-0000-0000-0000-000000000001",
          "createdAt": "2026-03-03T11:00:00.000Z",
          "updatedAt": "2026-03-03T11:00:00.000Z"
        }
      ]
    }
  ]
}
```

---

### 3. Add Announcement to a Course
> 🎓 **TEACHER only** — must own the course

```
POST /api/courses/:courseId/announcements
```

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |

**Request Body**
```json
{
  "title": "Midterm Exam Notice",
  "description": "The midterm exam will be held on March 15th at 10:00 AM in Hall B."
}
```

| Field | Type | Required |
|-------|------|----------|
| `title` | string | ✅ |
| `description` | string | ✅ |

**Response `201`**
```json
{
  "message": "Announcement created successfully",
  "announcement": {
    "id": "f1a2b3c4-0000-0000-0000-000000000003",
    "title": "Midterm Exam Notice",
    "description": "The midterm exam will be held on March 15th at 10:00 AM in Hall B.",
    "course_id": "d1e2f3a4-0000-0000-0000-000000000001",
    "createdAt": "2026-03-03T12:00:00.000Z",
    "updatedAt": "2026-03-03T12:00:00.000Z"
  }
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `400` | `"Title and description are required"` |
| `403` | `"Forbidden"` — teacher does not own this course |
| `404` | `"Course not found"` |

---

### 4. Mark Attendance
> 🎓 **TEACHER only** — must own the course

```
POST /api/courses/:courseId/attendance
```

Submits attendance for a list of students for a given date. Uses **upsert** — calling this again for the same date will update existing records.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |

**Request Body**
```json
{
  "date": "2026-03-03",
  "records": [
    { "student_id": "b2c3d4e5-0000-0000-0000-000000000002", "status": "PRESENT" },
    { "student_id": "c3d4e5f6-0000-0000-0000-000000000003", "status": "ABSENT" },
    { "student_id": "d4e5f6a7-0000-0000-0000-000000000004", "status": "LATE" }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `date` | string (`YYYY-MM-DD`) | ✅ | Date of attendance session |
| `records` | array | ✅ | At least one record required |
| `records[].student_id` | string (UUID) | ✅ | Must be enrolled in the course |
| `records[].status` | `PRESENT` \| `ABSENT` \| `LATE` | ✅ | |

**Response `200`**
```json
{
  "message": "Attendance marked successfully",
  "results": [
    {
      "id": "a1a1a1a1-0000-0000-0000-000000000010",
      "enrollment_id": "e1f2a3b4-0000-0000-0000-000000000002",
      "date": "2026-03-03T00:00:00.000Z",
      "status": "PRESENT",
      "createdAt": "2026-03-03T09:00:00.000Z",
      "updatedAt": "2026-03-03T09:00:00.000Z"
    },
    {
      "student_id": "d4e5f6a7-0000-0000-0000-000000000099",
      "error": "Not enrolled in course"
    }
  ]
}
```

> ⚠️ **Note:** If a `student_id` in the records array is not enrolled in the course, that entry will return `{ student_id, error: "Not enrolled in course" }` instead of an attendance record. Other records are still processed.

**Error Responses**
| Status | Message |
|--------|---------|
| `400` | `"date and records[] are required"` |
| `403` | `"Forbidden"` — teacher does not own this course |
| `404` | `"Course not found"` |

---

### 5. Get Course Attendance (All Students)
> 🎓 **TEACHER only** — must own the course

```
GET /api/courses/:courseId/attendance
```

Returns all attendance records for the course across all dates and students, ordered by date ascending.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |

**Request Body** — none

**Response `200`**
```json
{
  "message": "Attendance retrieved successfully",
  "records": [
    {
      "id": "a1a1a1a1-0000-0000-0000-000000000010",
      "date": "2026-03-03T00:00:00.000Z",
      "status": "PRESENT",
      "enrollment_id": "e1f2a3b4-0000-0000-0000-000000000002",
      "createdAt": "2026-03-03T09:00:00.000Z",
      "updatedAt": "2026-03-03T09:00:00.000Z",
      "enrollment": {
        "id": "e1f2a3b4-0000-0000-0000-000000000002",
        "course_id": "d1e2f3a4-0000-0000-0000-000000000001",
        "student_id": "b2c3d4e5-0000-0000-0000-000000000002",
        "student": {
          "id": "b2c3d4e5-0000-0000-0000-000000000002",
          "name": "Alice Johnson",
          "email": "alice@example.com",
          "role": "STUDENT"
        }
      }
    }
  ]
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `403` | `"Forbidden"` — teacher does not own this course |
| `404` | `"Course not found"` |

---

### 6. Enroll in a Course
> 🧑‍🎓 **STUDENT only**

```
POST /api/courses/enroll
```

Enrolls the authenticated student into a course using its unique course code.

**Request Body**
```json
{
  "code": "A3BX9Z"
}
```

| Field | Type | Required |
|-------|------|----------|
| `code` | string | ✅ | The 6-character course code shared by the teacher |

**Response `201`**
```json
{
  "message": "Enrolled successfully",
  "enrollment": {
    "id": "e1f2a3b4-0000-0000-0000-000000000002",
    "course_id": "d1e2f3a4-0000-0000-0000-000000000001",
    "student_id": "b2c3d4e5-0000-0000-0000-000000000002",
    "createdAt": "2026-03-03T10:30:00.000Z",
    "updatedAt": "2026-03-03T10:30:00.000Z",
    "course": {
      "id": "d1e2f3a4-0000-0000-0000-000000000001",
      "title": "Introduction to Computer Science",
      "description": "A beginner-friendly course covering core CS concepts.",
      "code": "A3BX9Z",
      "teacher_id": "a1b2c3d4-0000-0000-0000-000000000001",
      "createdAt": "2026-03-03T10:00:00.000Z",
      "updatedAt": "2026-03-03T10:00:00.000Z"
    }
  }
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `400` | `"Course code is required"` |
| `404` | `"Course not found"` — invalid code |
| `409` | `"Already enrolled in this course"` |

---

### 7. Get Enrolled Courses
> 🧑‍🎓 **STUDENT only**

```
GET /api/courses/enrolled
```

Returns all courses the authenticated student is currently enrolled in, with teacher details included.

**Request Body** — none

**Response `200`**
```json
{
  "message": "Enrolled courses retrieved successfully",
  "courses": [
    {
      "id": "d1e2f3a4-0000-0000-0000-000000000001",
      "title": "Introduction to Computer Science",
      "description": "A beginner-friendly course covering core CS concepts.",
      "code": "A3BX9Z",
      "teacher_id": "a1b2c3d4-0000-0000-0000-000000000001",
      "createdAt": "2026-03-03T10:00:00.000Z",
      "updatedAt": "2026-03-03T10:00:00.000Z",
      "teacher": {
        "id": "a1b2c3d4-0000-0000-0000-000000000001",
        "name": "Dr. John Smith",
        "email": "john.smith@example.com",
        "role": "TEACHER"
      }
    }
  ]
}
```

---

### 8. Get My Attendance (Student View)
> 🧑‍🎓 **STUDENT only** — must be enrolled in the course

```
GET /api/courses/:courseId/my-attendance
```

Returns the authenticated student's own attendance records for a specific course, ordered by date ascending.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |

**Request Body** — none

**Response `200`**
```json
{
  "message": "Attendance retrieved successfully",
  "records": [
    {
      "id": "a1a1a1a1-0000-0000-0000-000000000010",
      "date": "2026-03-03T00:00:00.000Z",
      "status": "PRESENT",
      "enrollment_id": "e1f2a3b4-0000-0000-0000-000000000002",
      "createdAt": "2026-03-03T09:00:00.000Z",
      "updatedAt": "2026-03-03T09:00:00.000Z"
    },
    {
      "id": "b2b2b2b2-0000-0000-0000-000000000011",
      "date": "2026-03-05T00:00:00.000Z",
      "status": "LATE",
      "enrollment_id": "e1f2a3b4-0000-0000-0000-000000000002",
      "createdAt": "2026-03-05T09:00:00.000Z",
      "updatedAt": "2026-03-05T09:00:00.000Z"
    }
  ]
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `403` | `"Not enrolled in this course"` |

---

### 9. Get Course Announcements
> 🔓 **TEACHER** (must own course) **or STUDENT** (must be enrolled)

```
GET /api/courses/:courseId/announcements
```

Returns all announcements for a course with their linked assessments, ordered newest first.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |

**Request Body** — none

**Response `200`**
```json
{
  "message": "Announcements retrieved successfully",
  "announcements": [
    {
      "id": "f1a2b3c4-0000-0000-0000-000000000003",
      "title": "Midterm Exam Notice",
      "description": "The midterm exam will be held on March 15th at 10:00 AM in Hall B.",
      "course_id": "d1e2f3a4-0000-0000-0000-000000000001",
      "createdAt": "2026-03-03T12:00:00.000Z",
      "updatedAt": "2026-03-03T12:00:00.000Z",
      "assessments": [
        {
          "id": "c3c3c3c3-0000-0000-0000-000000000020",
          "title": "Midterm Exam",
          "instructions": "Answer all questions. Show your working.",
          "type": "EXAM",
          "due_date": "2026-03-15T10:00:00.000Z",
          "announcement_id": "f1a2b3c4-0000-0000-0000-000000000003",
          "createdAt": "2026-03-03T12:05:00.000Z",
          "updatedAt": "2026-03-03T12:05:00.000Z",
          "source_materials": [
            {
              "id": "m1m1m1m1-0000-0000-0000-000000000030",
              "file_name": "exam-rubric.pdf",
              "file_size": 204800,
              "mime_type": "application/pdf",
              "bucket_path": "courseId/assessmentId/uuid.pdf",
              "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
              "createdAt": "2026-03-03T12:06:00.000Z",
              "updatedAt": "2026-03-03T12:06:00.000Z"
            }
          ]
        }
      ]
    },
    {
      "id": "g2b3c4d5-0000-0000-0000-000000000004",
      "title": "Welcome to the course!",
      "description": "Please read the syllabus attached below.",
      "course_id": "d1e2f3a4-0000-0000-0000-000000000001",
      "createdAt": "2026-03-01T09:00:00.000Z",
      "updatedAt": "2026-03-01T09:00:00.000Z",
      "assessments": []
    }
  ]
}
```

> 💡 **Frontend hint:** If `assessments.length > 0`, render the announcement tile as a clickable **assessment card** showing the assessment `title`, `type`, and `due_date`. If `assessments` is empty, render it as a plain announcement (title + description only).

**Error Responses**
| Status | Message |
|--------|---------|
| `403` | `"Forbidden"` — teacher does not own course |
| `403` | `"Not enrolled in this course"` — student not enrolled |
| `404` | `"Course not found"` |

---

### 10. Add Assessment to an Announcement
> 🎓 **TEACHER only** — must own the course

```
POST /api/courses/:courseId/announcements/:announcementId/assessments
```

Creates an assessment linked to an existing announcement. Optionally uploads source material files (PDFs, images) to private Supabase Storage. Accepts `multipart/form-data`.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |
| `announcementId` | UUID of the announcement this assessment is attached to |

**Request Body** (`multipart/form-data`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | ✅ | Assessment name displayed in the portal |
| `type` | `QUIZ` \| `ASSIGNMENT` \| `EXAM` | ✅ | Assessment category |
| `instructions` | string | ❌ | Rich-text body rendered as the assignment brief |
| `due_date` | string (ISO 8601) | ❌ | e.g. `"2026-03-20T23:59:00.000Z"`. `null` means no deadline. Used to auto-compute `SUBMITTED` vs `LATE` at submission time |
| `files` | file[] | ❌ | Up to 10 files, max 20 MB each. Allowed types: `application/pdf`, `image/*` |

**Response `201`**
```json
{
  "message": "Assessment created successfully",
  "assessment": {
    "id": "c3c3c3c3-0000-0000-0000-000000000020",
    "title": "Midterm Exam",
    "instructions": "Answer all questions. Show your working.",
    "type": "EXAM",
    "due_date": "2026-03-15T10:00:00.000Z",
    "announcement_id": "f1a2b3c4-0000-0000-0000-000000000003",
    "createdAt": "2026-03-05T10:00:00.000Z",
    "updatedAt": "2026-03-05T10:00:00.000Z"
  },
  "source_materials": [
    {
      "id": "m1m1m1m1-0000-0000-0000-000000000030",
      "file_name": "exam-rubric.pdf",
      "file_size": 204800,
      "mime_type": "application/pdf",
      "bucket_path": "courseId/assessmentId/uuid.pdf",
      "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
      "createdAt": "2026-03-05T10:00:00.000Z",
      "updatedAt": "2026-03-05T10:00:00.000Z"
    }
  ]
}
```

> ℹ️ `source_materials` is an empty array `[]` if no files were uploaded.

**Error Responses**
| Status | Message |
|--------|---------|
| `400` | `"title and type are required"` |
| `403` | `"Forbidden"` — teacher does not own this course |
| `404` | `"Course not found"` |
| `404` | `"Announcement not found in this course"` |
| `500` | `"File upload failed: <reason>"` |

---

### 11. Get Assessment Details
> 🔓 **TEACHER** (must own course) **or STUDENT** (must be enrolled)

```
GET /api/courses/:courseId/assessments/:assessmentId
```

Returns full assessment details including source materials (with 1-hour signed download URLs). The response shape differs by role:

- **Teacher** — receives student submission lists bucketed into `submitted`, `late`, and `not_submitted`.
- **Student** — receives their own submission (if any) with signed attachment URLs.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |
| `assessmentId` | UUID of the assessment |

**Request Body** — none

**Teacher Response `200`**
```json
{
  "message": "Assessment details retrieved successfully",
  "assessment": {
    "id": "c3c3c3c3-0000-0000-0000-000000000020",
    "title": "Midterm Exam",
    "instructions": "Answer all questions. Show your working.",
    "type": "EXAM",
    "due_date": "2026-03-15T10:00:00.000Z",
    "announcement_id": "f1a2b3c4-0000-0000-0000-000000000003",
    "createdAt": "2026-03-05T10:00:00.000Z",
    "updatedAt": "2026-03-05T10:00:00.000Z",
    "source_materials": [
      {
        "id": "m1m1m1m1-0000-0000-0000-000000000030",
        "file_name": "exam-rubric.pdf",
        "file_size": 204800,
        "mime_type": "application/pdf",
        "bucket_path": "courseId/assessmentId/uuid.pdf",
        "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
        "createdAt": "2026-03-05T10:00:00.000Z",
        "updatedAt": "2026-03-05T10:00:00.000Z",
        "signed_url": "https://supabase.co/storage/v1/object/sign/source-materials/..."
      }
    ]
  },
  "submitted": [
    {
      "id": "s1s1s1s1-0000-0000-0000-000000000040",
      "status": "SUBMITTED",
      "submitted_at": "2026-03-14T22:30:00.000Z",
      "grade": null,
      "feedback": null,
      "user_id": "b2c3d4e5-0000-0000-0000-000000000002",
      "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
      "createdAt": "2026-03-14T22:30:00.000Z",
      "updatedAt": "2026-03-14T22:30:00.000Z",
      "user": {
        "id": "b2c3d4e5-0000-0000-0000-000000000002",
        "name": "Alice Johnson",
        "email": "alice@example.com"
      }
    }
  ],
  "late": [
    {
      "id": "s2s2s2s2-0000-0000-0000-000000000041",
      "status": "LATE",
      "submitted_at": "2026-03-16T08:00:00.000Z",
      "grade": null,
      "feedback": null,
      "user_id": "c3d4e5f6-0000-0000-0000-000000000003",
      "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
      "createdAt": "2026-03-16T08:00:00.000Z",
      "updatedAt": "2026-03-16T08:00:00.000Z",
      "user": {
        "id": "c3d4e5f6-0000-0000-0000-000000000003",
        "name": "Bob Lee",
        "email": "bob@example.com"
      }
    }
  ],
  "not_submitted": [
    {
      "id": "d4e5f6a7-0000-0000-0000-000000000004",
      "name": "Carol White",
      "email": "carol@example.com"
    }
  ]
}
```

> 💡 **Frontend hint (teacher submissions tab):** Render three sections — **Submitted** (green badge), **Late** (amber badge), **Not submitted** (grey). Each submission row shows student name, `submitted_at` time, and a "View" button linking to the submission details page.

**Student Response `200`**
```json
{
  "message": "Assessment details retrieved successfully",
  "assessment": {
    "id": "c3c3c3c3-0000-0000-0000-000000000020",
    "title": "Midterm Exam",
    "instructions": "Answer all questions. Show your working.",
    "type": "EXAM",
    "due_date": "2026-03-15T10:00:00.000Z",
    "announcement_id": "f1a2b3c4-0000-0000-0000-000000000003",
    "createdAt": "2026-03-05T10:00:00.000Z",
    "updatedAt": "2026-03-05T10:00:00.000Z",
    "source_materials": [
      {
        "id": "m1m1m1m1-0000-0000-0000-000000000030",
        "file_name": "exam-rubric.pdf",
        "file_size": 204800,
        "mime_type": "application/pdf",
        "bucket_path": "courseId/assessmentId/uuid.pdf",
        "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
        "createdAt": "2026-03-05T10:00:00.000Z",
        "updatedAt": "2026-03-05T10:00:00.000Z",
        "signed_url": "https://supabase.co/storage/v1/object/sign/source-materials/..."
      }
    ]
  },
  "submission": {
    "id": "s1s1s1s1-0000-0000-0000-000000000040",
    "status": "SUBMITTED",
    "submitted_at": "2026-03-14T22:30:00.000Z",
    "grade": null,
    "feedback": null,
    "user_id": "b2c3d4e5-0000-0000-0000-000000000002",
    "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
    "createdAt": "2026-03-14T22:30:00.000Z",
    "updatedAt": "2026-03-14T22:30:00.000Z",
    "attachments": [
      {
        "id": "a1a2a3a4-0000-0000-0000-000000000050",
        "file_name": "my-answers.pdf",
        "file_size": 512000,
        "mime_type": "application/pdf",
        "bucket_path": "courseId/assessmentId/submissionId/uuid.pdf",
        "submission_id": "s1s1s1s1-0000-0000-0000-000000000040",
        "createdAt": "2026-03-14T22:30:00.000Z",
        "updatedAt": "2026-03-14T22:30:00.000Z",
        "signed_url": "https://supabase.co/storage/v1/object/sign/submission-files/..."
      }
    ]
  }
}
```

> 💡 **Frontend hint (student assessment page):** Render the left panel with `assessment.title`, `assessment.instructions`, and clickable `source_materials` tiles (use `signed_url` to open/download). Render a **Submission Portal** box on the right showing `due_date`, the current submission `status` badge, and uploaded attachment tiles. If `submission` is `null`, show **Add Work** + **Turn In** buttons. If `submission.status === "GRADED"`, show grade and feedback and disable further uploads.

**Error Responses**
| Status | Message |
|--------|---------|
| `403` | `"Forbidden"` — teacher does not own this course |
| `403` | `"Not enrolled in this course"` — student not enrolled |
| `403` | `"Assessment does not belong to this course"` |
| `404` | `"Assessment not found"` |

---

### 12. Submit an Assessment
> 🧑‍🎓 **STUDENT only** — must be enrolled in the course

```
POST /api/courses/:courseId/assessments/:assessmentId/submit
```

Creates a new submission for the student and uploads their files to private Supabase Storage. The `status` is set automatically: `SUBMITTED` if on time, `LATE` if the current time is past `due_date`. Accepts `multipart/form-data`.

> ⚠️ Each student may only submit once per assessment. To add more files after submitting, use `PATCH` (endpoint 13).

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |
| `assessmentId` | UUID of the assessment |

**Request Body** (`multipart/form-data`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `files` | file[] | ✅ | At least one file. Max 10 files, 20 MB each. |

**Response `201`**
```json
{
  "message": "Assessment submitted successfully",
  "submission": {
    "id": "s1s1s1s1-0000-0000-0000-000000000040",
    "status": "SUBMITTED",
    "submitted_at": "2026-03-14T22:30:00.000Z",
    "grade": null,
    "feedback": null,
    "user_id": "b2c3d4e5-0000-0000-0000-000000000002",
    "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
    "createdAt": "2026-03-14T22:30:00.000Z",
    "updatedAt": "2026-03-14T22:30:00.000Z"
  },
  "attachments": [
    {
      "id": "a1a2a3a4-0000-0000-0000-000000000050",
      "file_name": "my-answers.pdf",
      "file_size": 512000,
      "mime_type": "application/pdf",
      "bucket_path": "courseId/assessmentId/submissionId/uuid.pdf",
      "submission_id": "s1s1s1s1-0000-0000-0000-000000000040",
      "createdAt": "2026-03-14T22:30:00.000Z",
      "updatedAt": "2026-03-14T22:30:00.000Z"
    }
  ]
}
```

> ℹ️ If submitted after `due_date`, `message` will be `"Assessment submitted successfully (late)"` and `submission.status` will be `"LATE"`.

**Error Responses**
| Status | Message |
|--------|---------|
| `400` | `"At least one file is required"` |
| `403` | `"Not enrolled in this course"` |
| `403` | `"Assessment does not belong to this course"` |
| `404` | `"Assessment not found"` |
| `409` | `"Already submitted. Use PATCH to update."` |
| `500` | `"File upload failed: <reason>"` |

---

### 13. Update a Submission (Add More Files)
> 🧑‍🎓 **STUDENT only** — must be enrolled in the course

```
PATCH /api/courses/:courseId/assessments/:assessmentId/submit
```

Appends additional files to an existing submission. Blocked if the submission has already been graded (`status === "GRADED"`). Accepts `multipart/form-data`.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |
| `assessmentId` | UUID of the assessment |

**Request Body** (`multipart/form-data`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `files` | file[] | ✅ | At least one file. Max 10 files, 20 MB each. |

**Response `200`**
```json
{
  "message": "Submission updated successfully",
  "submission": {
    "id": "s1s1s1s1-0000-0000-0000-000000000040",
    "status": "SUBMITTED",
    "submitted_at": "2026-03-14T22:30:00.000Z",
    "grade": null,
    "feedback": null,
    "user_id": "b2c3d4e5-0000-0000-0000-000000000002",
    "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
    "createdAt": "2026-03-14T22:30:00.000Z",
    "updatedAt": "2026-03-14T23:10:00.000Z"
  },
  "new_attachments": [
    {
      "id": "a2b3c4d5-0000-0000-0000-000000000051",
      "file_name": "supplementary-notes.pdf",
      "file_size": 102400,
      "mime_type": "application/pdf",
      "bucket_path": "courseId/assessmentId/submissionId/uuid.pdf",
      "submission_id": "s1s1s1s1-0000-0000-0000-000000000040",
      "createdAt": "2026-03-14T23:10:00.000Z",
      "updatedAt": "2026-03-14T23:10:00.000Z"
    }
  ]
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `400` | `"At least one file is required"` |
| `403` | `"Not enrolled in this course"` |
| `403` | `"Submission has been graded and cannot be modified."` |
| `404` | `"No submission found. Use POST to submit first."` |
| `500` | `"File upload failed: <reason>"` |

---

### 14. Get Submission Details (Teacher View)
> 🎓 **TEACHER only** — must own the course

```
GET /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId
```

Returns a student's full submission including all uploaded files with 1-hour signed download URLs. Used to render the **View Submission** page where the teacher reviews work and assigns a grade.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |
| `assessmentId` | UUID of the assessment |
| `submissionId` | UUID of the submission |

**Request Body** — none

**Response `200`**
```json
{
  "message": "Submission details retrieved successfully",
  "submission": {
    "id": "s1s1s1s1-0000-0000-0000-000000000040",
    "status": "SUBMITTED",
    "submitted_at": "2026-03-14T22:30:00.000Z",
    "grade": null,
    "feedback": null,
    "user_id": "b2c3d4e5-0000-0000-0000-000000000002",
    "assessment_id": "c3c3c3c3-0000-0000-0000-000000000020",
    "createdAt": "2026-03-14T22:30:00.000Z",
    "updatedAt": "2026-03-14T22:30:00.000Z",
    "user": {
      "id": "b2c3d4e5-0000-0000-0000-000000000002",
      "name": "Alice Johnson",
      "email": "alice@example.com"
    },
    "attachments": [
      {
        "id": "a1a2a3a4-0000-0000-0000-000000000050",
        "file_name": "my-answers.pdf",
        "file_size": 512000,
        "mime_type": "application/pdf",
        "bucket_path": "courseId/assessmentId/submissionId/uuid.pdf",
        "submission_id": "s1s1s1s1-0000-0000-0000-000000000040",
        "createdAt": "2026-03-14T22:30:00.000Z",
        "updatedAt": "2026-03-14T22:30:00.000Z",
        "signed_url": "https://supabase.co/storage/v1/object/sign/submission-files/..."
      }
    ]
  }
}
```

> 💡 **Frontend hint:** Use `signed_url` on each attachment to render a clickable file tile. Show the student's name, `submitted_at` timestamp, `status` badge, and (if graded) `grade` and `feedback`. Provide a grade input and feedback textarea that call endpoint 15.

**Error Responses**
| Status | Message |
|--------|---------|
| `403` | `"Forbidden"` — teacher does not own this course |
| `404` | `"Assessment not found"` |
| `404` | `"Submission not found"` |

---

### 15. Grade a Submission *(stub — not yet implemented)*
> 🎓 **TEACHER only** — must own the course

```
PATCH /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade
```

Sets a numeric grade and optional feedback on a student's submission. Returns `501` until implemented.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |
| `assessmentId` | UUID of the assessment |
| `submissionId` | UUID of the submission |

**Request Body**
```json
{
  "grade": 87.5,
  "feedback": "Great work! Watch your edge cases on question 3."
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `grade` | number | ✅ | Numeric score |
| `feedback` | string | ❌ | Free-text teacher feedback |

**Response** — `501 Not Implemented` until this endpoint is built.

---

### 16. Delete a Source Material
> 🎓 **TEACHER only** — must own the course

```
DELETE /api/courses/:courseId/assessments/:assessmentId/source-materials/:materialId
```

Removes a source material file from both Supabase Storage and the database.

**URL Params**
| Param | Description |
|-------|-------------|
| `courseId` | UUID of the course |
| `assessmentId` | UUID of the assessment |
| `materialId` | UUID of the source material record |

**Request Body** — none

**Response `200`**
```json
{
  "message": "Source material deleted successfully"
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `403` | `"Forbidden"` — teacher does not own this course |
| `404` | `"Assessment not found"` |
| `404` | `"Source material not found"` |
| `500` | `"Storage deletion failed: <reason>"` |

---

## Quick Reference Table

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/courses` | 🎓 TEACHER | Create a course |
| `GET` | `/api/courses/my-courses` | 🎓 TEACHER | Get all owned courses |
| `POST` | `/api/courses/:courseId/announcements` | 🎓 TEACHER | Add an announcement |
| `POST` | `/api/courses/:courseId/attendance` | 🎓 TEACHER | Mark attendance for a session |
| `GET` | `/api/courses/:courseId/attendance` | 🎓 TEACHER | Get full attendance for a course |
| `POST` | `/api/courses/:courseId/announcements/:announcementId/assessments` | 🎓 TEACHER | Create an assessment with optional file uploads |
| `GET` | `/api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId` | 🎓 TEACHER | View a student's full submission |
| `PATCH` | `/api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade` | 🎓 TEACHER | Grade a submission *(stub)* |
| `DELETE` | `/api/courses/:courseId/assessments/:assessmentId/source-materials/:materialId` | 🎓 TEACHER | Delete a source material file |
| `POST` | `/api/courses/enroll` | 🧑‍🎓 STUDENT | Enroll via course code |
| `GET` | `/api/courses/enrolled` | 🧑‍🎓 STUDENT | Get all enrolled courses |
| `GET` | `/api/courses/:courseId/my-attendance` | 🧑‍🎓 STUDENT | Get own attendance for a course |
| `POST` | `/api/courses/:courseId/assessments/:assessmentId/submit` | 🧑‍🎓 STUDENT | Submit an assessment (first submission) |
| `PATCH` | `/api/courses/:courseId/assessments/:assessmentId/submit` | 🧑‍🎓 STUDENT | Add more files to an existing submission |
| `GET` | `/api/courses/:courseId/announcements` | 🔓 BOTH | Get course announcements (with assessments) |
| `GET` | `/api/courses/:courseId/assessments/:assessmentId` | 🔓 BOTH | Get assessment details (role-aware response) |

---

## Submission Status Values

| Value | Meaning | Set by |
|-------|---------|--------|
| `SUBMITTED` | Submitted on time (before `due_date`) | Backend at submit time |
| `LATE` | Submitted after `due_date` | Backend at submit time |
| `GRADED` | Teacher has assigned a grade | Backend when grade is saved |

---

## Assessment Type Values

| Value | Meaning |
|-------|---------|
| `QUIZ` | Short in-class quiz |
| `ASSIGNMENT` | Take-home assignment |
| `EXAM` | Formal examination |

---

## Signed URL Notes

All file URLs in responses (`signed_url`) are **time-limited private links** generated by Supabase Storage. They expire after **1 hour**. The frontend should not cache these URLs — always re-fetch the assessment or submission details to get fresh links before rendering file tiles.

| Bucket | Used for |
|--------|----------|
| `source-materials` | Teacher-uploaded assessment documents (rubrics, problem sets) |
| `submission-files` | Student-uploaded submission files |

---

## Attendance Status Values

| Value | Meaning |
|-------|---------|
| `PRESENT` | Student was present |
| `ABSENT` | Student was absent |
| `LATE` | Student arrived late |

---

## Common Error Responses

| Status | Cause |
|--------|-------|
| `401` | Missing or invalid `Authorization` header / expired token |
| `403` | Correct role but insufficient ownership or enrollment |
| `404` | Resource (course, enrollment, assessment, submission) not found |
| `409` | Duplicate resource (e.g. already enrolled, already submitted) |
| `500` | Internal server error |
| `501` | Endpoint not yet implemented |
