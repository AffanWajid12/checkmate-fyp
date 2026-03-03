# Course API Reference

> **Base URL:** `/api/courses`
> **Last updated:** 2026-03-03

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
          "type": "EXAM",
          "announcement_id": "f1a2b3c4-0000-0000-0000-000000000003",
          "createdAt": "2026-03-03T12:05:00.000Z",
          "updatedAt": "2026-03-03T12:05:00.000Z"
        }
      ]
    }
  ]
}
```

**Error Responses**
| Status | Message |
|--------|---------|
| `403` | `"Forbidden"` — teacher does not own course |
| `403` | `"Not enrolled in this course"` — student not enrolled |
| `404` | `"Course not found"` |

---

## Quick Reference Table

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| `POST` | `/api/courses` | 🎓 TEACHER | Create a course |
| `GET` | `/api/courses/my-courses` | 🎓 TEACHER | Get all owned courses |
| `POST` | `/api/courses/:courseId/announcements` | 🎓 TEACHER | Add an announcement |
| `POST` | `/api/courses/:courseId/attendance` | 🎓 TEACHER | Mark attendance for a session |
| `GET` | `/api/courses/:courseId/attendance` | 🎓 TEACHER | Get full attendance for a course |
| `POST` | `/api/courses/enroll` | 🧑‍🎓 STUDENT | Enroll via course code |
| `GET` | `/api/courses/enrolled` | 🧑‍🎓 STUDENT | Get all enrolled courses |
| `GET` | `/api/courses/:courseId/my-attendance` | 🧑‍🎓 STUDENT | Get own attendance for a course |
| `GET` | `/api/courses/:courseId/announcements` | 🔓 BOTH | Get course announcements |

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
| `404` | Resource (course, enrollment) not found |
| `409` | Duplicate resource (e.g. already enrolled) |
| `500` | Internal server error |
