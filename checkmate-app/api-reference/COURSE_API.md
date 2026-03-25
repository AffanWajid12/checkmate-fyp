# Course Management API Documentation

## Base URL
```
http://localhost:5000/api/courses
```

## Authentication
All endpoints require authentication. Include JWT token in header:
```
Authorization: Bearer <your_access_token>
```

---

## Endpoints

### 1. Get All Courses
**GET** `/api/courses`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `semester` (optional) - Filter by semester (e.g., "Fall 2024")
- `year` (optional) - Filter by year (e.g., 2024)
- `search` (optional) - Search by title or code
- `sortBy` (optional) - Sort field (default: "createdAt")
- `order` (optional) - Sort order: "asc" or "desc" (default: "desc")

**Response:**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "courses": [
      {
        "_id": "64a1b2c3...",
        "title": "Introduction to Psychology",
        "code": "PSY101",
        "section": "A",
        "semester": "Fall 2024",
        "year": 2024,
        "professor": {
          "_id": "64a1b2c3...",
          "firstName": "Sarah",
          "lastName": "Johnson",
          "email": "sarah.johnson@university.edu"
        },
        "enrolledStudents": 84,
        "assessmentCount": 8,
        "schedule": {
          "days": ["Monday", "Wednesday", "Friday"],
          "time": "10:00 AM - 11:30 AM",
          "location": "Room 204"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCourses": 45,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

**Access:**
- **Professor:** Returns only their own courses
- **Student:** Returns only enrolled courses
- **Admin:** Returns all courses

---

### 2. Get Course by ID
**GET** `/api/courses/:courseId`

**Response:**
```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "_id": "64a1b2c3...",
    "title": "Introduction to Psychology",
    "code": "PSY101",
    "section": "A",
    "semester": "Fall 2024",
    "year": 2024,
    "description": "An introductory course covering fundamental concepts in psychology",
    "credits": 3,
    "professor": {
      "_id": "64a1b2c3...",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah.johnson@university.edu",
      "department": "Psychology"
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
        "_id": "ann001",
        "title": "Quiz 3 Postponed",
        "content": "Quiz 3 has been moved to next Friday",
        "postedBy": "64a1b2c3...",
        "postedAt": "2025-12-09T14:30:00.000Z",
        "priority": "high"
      }
    ],
    "createdAt": "2025-09-01T08:00:00.000Z",
    "updatedAt": "2025-12-10T10:30:00.000Z"
  }
}
```

**Access:**
- **Professor:** Must be course owner
- **Student:** Must be enrolled
- **Admin:** Full access

---

### 3. Create Course
**POST** `/api/courses`

**Access:** Professor only

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

**Validation Rules:**
- `title`: 3-200 characters (required)
- `code`: 3-20 characters, uppercase letters and numbers only (required)
- `section`: 1-10 characters (required)
- `semester`: 1-50 characters (required)
- `year`: 2020-2100 (required)
- `description`: max 2000 characters (optional)
- `credits`: 1-6 (optional, default: 3)
- `maxStudents`: 1-500 (optional, default: 100)

**Response:**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "64a1b2c3...",
    "title": "Introduction to Psychology",
    "code": "PSY101",
    "professor": {
      "_id": "64a1b2c3...",
      "firstName": "Sarah",
      "lastName": "Johnson"
    },
    "createdAt": "2025-12-10T10:30:00.000Z"
  }
}
```

---

### 4. Update Course
**PATCH** `/api/courses/:courseId`

**Access:** Professor only (course owner)

**Request Body (all fields optional):**
```json
{
  "title": "Advanced Psychology",
  "description": "Updated course description",
  "credits": 4,
  "schedule": {
    "days": ["Tuesday", "Thursday"],
    "time": "2:00 PM - 3:30 PM",
    "location": "Room 305"
  },
  "maxStudents": 120,
  "isActive": true
}
```

**Note:** Cannot update `code`, `section`, `semester`, `year`, or `professor`

**Response:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "64a1b2c3...",
    "title": "Advanced Psychology",
    "updatedAt": "2025-12-10T10:35:00.000Z"
  }
}
```

---

### 5. Delete Course
**DELETE** `/api/courses/:courseId`

**Access:** Professor only (course owner)

**Response:**
```json
{
  "success": true,
  "message": "Course deleted successfully",
  "data": null
}
```

**Note:** This is a soft delete (sets `isActive: false`). The course data is preserved.

---

### 6. Add Announcement
**POST** `/api/courses/:courseId/announcements`

**Access:** Professor only (course owner)

**Request Body:**
```json
{
  "title": "Quiz 3 Postponed",
  "content": "Quiz 3 has been moved to next Friday due to schedule conflicts",
  "priority": "high"
}
```

**Validation:**
- `title`: max 200 characters (required)
- `content`: max 2000 characters (required)
- `priority`: "low" | "medium" | "high" (optional, default: "medium")

**Response:**
```json
{
  "success": true,
  "message": "Announcement added successfully",
  "data": {
    "_id": "ann001",
    "title": "Quiz 3 Postponed",
    "content": "Quiz 3 has been moved to next Friday",
    "priority": "high",
    "postedBy": "64a1b2c3...",
    "postedAt": "2025-12-10T14:30:00.000Z"
  }
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
      "field": "code",
      "message": "Course code must contain only uppercase letters and numbers"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You can only update your own courses"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "A course with this code and section already exists for this semester"
}
```

---

## Testing with cURL

### 1. Login first
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah.johnson@university.edu","password":"Password123"}'
```

### 2. Create a course
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Introduction to Psychology",
    "code": "PSY101",
    "section": "A",
    "semester": "Fall 2024",
    "year": 2024,
    "description": "Introductory psychology course",
    "credits": 3
  }'
```

### 3. Get all courses
```bash
curl -X GET "http://localhost:5000/api/courses?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Update a course
```bash
curl -X PATCH http://localhost:5000/api/courses/COURSE_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"Advanced Psychology","credits":4}'
```
