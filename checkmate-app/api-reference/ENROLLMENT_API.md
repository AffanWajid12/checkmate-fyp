# Student Enrollment API Documentation

## Overview
The Student Enrollment API provides endpoints for managing student enrollments in courses. These endpoints allow professors to enroll students, remove them from courses, and view enrollment statistics.

**Base URL:** `/api/courses/:courseId/students`

**Authentication:** All endpoints require a valid JWT token in the Authorization header.

**Authorization:** All endpoints require the `professor` role and ownership of the specified course.

---

## Endpoints

### 1. Get Enrolled Students

Retrieve a paginated list of students enrolled in a specific course with their submission statistics.

**Endpoint:** `GET /api/courses/:courseId/students`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**

| Parameter | Type   | Default    | Description                                    |
|-----------|--------|------------|------------------------------------------------|
| search    | string | -          | Search by name, email, or student number       |
| sortBy    | string | lastName   | Sort field: firstName, lastName, enrolledAt, studentNumber |
| order     | string | asc        | Sort order: asc or desc                        |
| page      | number | 1          | Page number for pagination                     |
| limit     | number | 20         | Items per page (1-100)                         |

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Students retrieved successfully",
  "data": {
    "students": [
      {
        "id": "64a1b2c3d4e5f6g7h8i9j0k1",
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
      },
      {
        "id": "64a1b2c3d4e5f6g7h8i9j0k2",
        "studentNumber": "STU002",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@university.edu",
        "avatar": null,
        "enrolledAt": "2025-09-01T08:00:00.000Z",
        "submissionStats": {
          "submitted": 7,
          "total": 8,
          "avgGrade": 92.3
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

**Error Responses:**

- **404 Not Found:** Course not found
- **403 Forbidden:** User is not the course owner
- **401 Unauthorized:** Invalid or missing token

---

### 2. Enroll Student

Enroll a single student in a course.

**Endpoint:** `POST /api/courses/:courseId/students`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Validation Rules:**
- `studentId`: Required, must be a valid MongoDB ObjectId

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "Student enrolled successfully",
  "data": {
    "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "studentId": "64a1b2c3d4e5f6g7h8i9j0k2",
    "enrolledAt": "2025-12-10T10:30:00.000Z"
  }
}
```

**Success Response (200 OK) - Re-enrollment:**
```json
{
  "statusCode": 200,
  "message": "Student re-enrolled successfully",
  "data": {
    "courseId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "studentId": "64a1b2c3d4e5f6g7h8i9j0k2",
    "enrolledAt": "2025-12-10T10:30:00.000Z"
  }
}
```

**Error Responses:**

- **404 Not Found:** Course or student not found
- **403 Forbidden:** User is not the course owner
- **400 Bad Request:** 
  - Student already enrolled
  - User does not have student role
  - Invalid student ID
- **401 Unauthorized:** Invalid or missing token

---

### 3. Bulk Enroll Students

Enroll multiple students in a course at once.

**Endpoint:** `POST /api/courses/:courseId/students/bulk`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "studentIds": [
    "64a1b2c3d4e5f6g7h8i9j0k1",
    "64a1b2c3d4e5f6g7h8i9j0k2",
    "64a1b2c3d4e5f6g7h8i9j0k3"
  ]
}
```

**Validation Rules:**
- `studentIds`: Required, array of 1-100 valid MongoDB ObjectIds

**Success Response (201 Created):**
```json
{
  "statusCode": 201,
  "message": "3 student(s) enrolled successfully",
  "data": {
    "successCount": 3,
    "failedCount": 0,
    "alreadyEnrolled": 0,
    "enrolled": [
      "64a1b2c3d4e5f6g7h8i9j0k1",
      "64a1b2c3d4e5f6g7h8i9j0k2",
      "64a1b2c3d4e5f6g7h8i9j0k3"
    ]
  }
}
```

**Error Responses:**

- **404 Not Found:** Course not found
- **403 Forbidden:** User is not the course owner
- **400 Bad Request:** 
  - One or more student IDs are invalid
  - One or more users do not have student role
  - Student IDs array is empty or exceeds 100 items
- **401 Unauthorized:** Invalid or missing token

---

### 4. Remove Student

Remove a student from a course (sets enrollment status to 'dropped').

**Endpoint:** `DELETE /api/courses/:courseId/students/:studentId`

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**

| Parameter | Type   | Description                    |
|-----------|--------|--------------------------------|
| courseId  | string | MongoDB ObjectId of the course |
| studentId | string | MongoDB ObjectId of the student|

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Student removed from course successfully",
  "data": null
}
```

**Error Responses:**

- **404 Not Found:** 
  - Course not found
  - Student enrollment not found or already removed
- **403 Forbidden:** User is not the course owner
- **401 Unauthorized:** Invalid or missing token

---

### 5. Get Student Statistics

Retrieve comprehensive statistics about student enrollments, submissions, and performance for a course.

**Endpoint:** `GET /api/courses/:courseId/students/statistics`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "statusCode": 200,
  "message": "Statistics retrieved successfully",
  "data": {
    "enrollmentStats": {
      "totalEnrolled": 84,
      "totalDropped": 5,
      "activeEnrollments": 84
    },
    "assessmentStats": {
      "totalAssessments": 8,
      "totalSubmissions": 520,
      "gradedSubmissions": 450,
      "pendingSubmissions": 70
    },
    "performanceStats": {
      "classAverage": 85.7,
      "submissionRate": 77.38
    }
  }
}
```

**Field Descriptions:**

- **enrollmentStats:**
  - `totalEnrolled`: Number of currently active enrollments
  - `totalDropped`: Number of dropped enrollments
  - `activeEnrollments`: Number of active enrollments (same as totalEnrolled)

- **assessmentStats:**
  - `totalAssessments`: Number of active assessments in the course
  - `totalSubmissions`: Total number of submissions across all assessments
  - `gradedSubmissions`: Number of graded submissions
  - `pendingSubmissions`: Number of submissions awaiting grading

- **performanceStats:**
  - `classAverage`: Average grade across all graded submissions (null if no grades)
  - `submissionRate`: Percentage of submissions received vs expected (0-100)

**Error Responses:**

- **404 Not Found:** Course not found
- **403 Forbidden:** User is not the course owner
- **401 Unauthorized:** Invalid or missing token

---

## Example Usage

### JavaScript (Fetch API)

```javascript
// Get enrolled students with search and pagination
const getEnrolledStudents = async (courseId, { search = '', page = 1, limit = 20 } = {}) => {
  const queryParams = new URLSearchParams({
    search,
    page,
    limit,
    sortBy: 'lastName',
    order: 'asc'
  });

  const response = await fetch(
    `http://localhost:5000/api/courses/${courseId}/students?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();
  return data;
};

// Enroll a single student
const enrollStudent = async (courseId, studentId) => {
  const response = await fetch(
    `http://localhost:5000/api/courses/${courseId}/students`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentId })
    }
  );

  const data = await response.json();
  return data;
};

// Bulk enroll students
const bulkEnrollStudents = async (courseId, studentIds) => {
  const response = await fetch(
    `http://localhost:5000/api/courses/${courseId}/students/bulk`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ studentIds })
    }
  );

  const data = await response.json();
  return data;
};

// Remove student
const removeStudent = async (courseId, studentId) => {
  const response = await fetch(
    `http://localhost:5000/api/courses/${courseId}/students/${studentId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();
  return data;
};

// Get statistics
const getStatistics = async (courseId) => {
  const response = await fetch(
    `http://localhost:5000/api/courses/${courseId}/students/statistics`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();
  return data;
};
```

### cURL Examples

**Get Enrolled Students:**
```bash
curl -X GET "http://localhost:5000/api/courses/64a1b2c3d4e5f6g7h8i9j0k1/students?search=john&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Enroll Single Student:**
```bash
curl -X POST "http://localhost:5000/api/courses/64a1b2c3d4e5f6g7h8i9j0k1/students" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"studentId": "64a1b2c3d4e5f6g7h8i9j0k2"}'
```

**Bulk Enroll Students:**
```bash
curl -X POST "http://localhost:5000/api/courses/64a1b2c3d4e5f6g7h8i9j0k1/students/bulk" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentIds": [
      "64a1b2c3d4e5f6g7h8i9j0k2",
      "64a1b2c3d4e5f6g7h8i9j0k3",
      "64a1b2c3d4e5f6g7h8i9j0k4"
    ]
  }'
```

**Remove Student:**
```bash
curl -X DELETE "http://localhost:5000/api/courses/64a1b2c3d4e5f6g7h8i9j0k1/students/64a1b2c3d4e5f6g7h8i9j0k2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Statistics:**
```bash
curl -X GET "http://localhost:5000/api/courses/64a1b2c3d4e5f6g7h8i9j0k1/students/statistics" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Notes

- All enrollment operations are soft deletes. When a student is removed, their enrollment status is set to 'dropped' but the record is retained.
- Re-enrolling a previously dropped student will reactivate their enrollment with a new enrollment date.
- Submission statistics are calculated in real-time based on current data.
- The `submissionRate` in statistics represents the percentage of expected submissions that have been received.
- Only professors who own the course can manage enrollments.
- Students cannot enroll themselves; enrollment must be done by the course professor.

---

## Related Documentation

- [Authentication API](./AUTH_API.md)
- [Course Management API](./COURSE_API.md)
- [Assessment Management API](./ASSESSMENT_API.md)
