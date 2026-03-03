# Course Management Implementation Plan

## Repository Analysis

Based on the codebase, here's what exists:

**Backend Structure:**
- Auth via Supabase + Prisma (PostgreSQL)
- `verifyUser` — validates JWT, attaches `req.user` (with `role`)
- `verifyUserType(role)` — role-based guard middleware
- `adminController.js` + `adminRoutes.js` — reference implementation
- `schema.prisma` — has `courses`, `enrollments`, `announcements`, `assessments` models

**Schema Observations:**
- `courses` has `teacher_id` (FK → users), `title`, `description`
- `enrollments` links `course_id` ↔ `student_id` (unique pair)
- `announcements` belongs to a `course`
- No `course_code` or `attendance` model exists yet — **schema changes needed**

---

## Step-by-Step Implementation Plan

### Step 1 — Schema Changes (Prisma Migration)

Two additions are needed:

**1a. Add `code` to `courses`:**
```prisma
model courses {
  // ...existing fields...
  code        String   @unique  // e.g. "CS101-A", used for student enrollment
  // ...existing fields...
}
```

**1b. Add `AttendanceStatus` model:**
```prisma
enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE

  @@schema("public")
}
```

**1b. Add `code` field to `courses`:**
```prisma
model courses {
  // ...existing fields...
  code        String   @unique  // e.g. "ABC123", auto-generated for student enrollment
  // ...existing fields...
}
```

**1c. Add `attendance` back-relation to `enrollments` and add the `attendance` model:**

Attendance belongs to an **enrollment** (not directly to `course + student`). Since `enrollments` already enforces the unique `course_id + student_id` pair, attaching attendance to it gives:
- A single FK instead of two
- Automatic cascade deletion when a student unenrolls
- A cleaner `@@unique([enrollment_id, date])` constraint (one record per student per course per day)

```prisma
model enrollments {
  // ...existing fields...

  // back-relation to attendance
  attendance  attendance[] @relation("EnrollmentAttendance")

  // ...existing constraints...
}
```

**1d. Add the `attendance` model:**
```prisma
model attendance {
  id            String           @id @db.Uuid @default(uuid())
  date          DateTime         @db.Date     // date only, no time component
  status        AttendanceStatus @default(ABSENT)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt @default(now())

  enrollment_id String @db.Uuid
  enrollment    enrollments @relation("EnrollmentAttendance", fields: [enrollment_id], references: [id], onDelete: Cascade)

  @@unique([enrollment_id, date])  // one record per student per course per day
  @@map("attendance")
  @@schema("public")
}
```

**After editing schema, run:**
```sh
npx prisma migrate dev --name add_course_code_and_attendance
npx prisma generate
```

---

### Step 2 — Create `courseController.js`

File: `backend/src/controllers/courseController.js`

#### Teacher Actions

| Function | Description |
|---|---|
| `createCourse` | Creates a course, auto-generates unique `code`, sets `teacher_id = req.user.id` |
| `getTeacherCourses` | Returns all courses owned by the logged-in teacher |
| `addAnnouncement` | Adds an announcement to a course (verifies teacher owns the course) |
| `markAttendance` | Creates/updates attendance records for a list of students for a given date |
| `getCourseAttendance` | Returns all attendance records for a course (teacher view) |

#### Student Actions

| Function | Description |
|---|---|
| `enrollInCourse` | Looks up course by `code`, creates enrollment record |
| `getEnrolledCourses` | Returns all courses the logged-in student is enrolled in |
| `getStudentAttendance` | Returns attendance records for the student in a specific course |
| `getCourseAnnouncements` | Returns announcements for a course the student is enrolled in |

---

### Step 3 — Create `courseRoutes.js`

File: `backend/src/routes/courseRoutes.js`

```
POST   /api/courses/                          → TEACHER: createCourse
GET    /api/courses/my-courses                → TEACHER: getTeacherCourses
POST   /api/courses/:courseId/announcements   → TEACHER: addAnnouncement
POST   /api/courses/:courseId/attendance      → TEACHER: markAttendance
GET    /api/courses/:courseId/attendance      → TEACHER: getCourseAttendance

POST   /api/courses/enroll                    → STUDENT: enrollInCourse (body: { code })
GET    /api/courses/enrolled                  → STUDENT: getEnrolledCourses
GET    /api/courses/:courseId/my-attendance   → STUDENT: getStudentAttendance
GET    /api/courses/:courseId/announcements   → STUDENT/TEACHER: getCourseAnnouncements
```

All routes protected by `verifyUser`. Teacher routes additionally use `verifyUserType("TEACHER")`, student routes use `verifyUserType("STUDENT")`.

---

### Step 4 — Register Routes in `server.js`

```js
// ...existing code...
import courseRoutes from "./routes/courseRoutes.js";

app.use("/api/courses", courseRoutes);
// ...existing code...
```

---

### Step 5 — Implementation Detail per Function

#### `createCourse`
```
1. Read { title, description } from req.body
2. Generate a unique course code (random 6-char alphanumeric string)
3. prisma.courses.create({ data: { title, description, code, teacher_id: req.user.id } })
4. Return created course with the generated code
```

#### `getTeacherCourses`
```
1. prisma.courses.findMany({ where: { teacher_id: req.user.id }, include: { students: true, announcements: true } })
2. Return list of courses
```

#### `addAnnouncement`
```
1. Verify req.user owns the course via verifyCourseOwner helper
2. Read { title, description } from req.body
3. prisma.announcements.create({ data: { title, description, course_id: courseId } })
4. Return created announcement
```

#### `markAttendance`
```
1. Verify req.user owns the course via verifyCourseOwner helper
2. Read { date, records: [{ student_id, status }] } from req.body
3. For each record:
   a. Look up the enrollment via prisma.enrollments.findUnique({ where: { course_id_student_id: { course_id, student_id } } })
   b. prisma.attendance.upsert({ where: { enrollment_id_date: { enrollment_id, date } }, ... })
4. Return all upserted records
```

#### `getCourseAttendance`
```
1. Verify req.user owns the course via verifyCourseOwner helper
2. prisma.attendance.findMany({
     where: { enrollment: { course_id } },
     include: { enrollment: { include: { student: true } } }
   })
3. Return records (optionally grouped by date on the frontend)
```

#### `enrollInCourse`
```
1. Read { code } from req.body
2. prisma.courses.findUnique({ where: { code } }) → 404 if not found
3. Check if enrollment already exists → 409 if duplicate
4. prisma.enrollments.create({ data: { course_id, student_id: req.user.id } })
5. Return enrollment record
```

#### `getEnrolledCourses`
```
1. prisma.enrollments.findMany({ where: { student_id: req.user.id }, include: { course: true } })
2. Return list of enrolled courses
```

#### `getStudentAttendance`
```
1. Verify student is enrolled in the course via verifyStudentEnrolled helper → 403 if not
2. Look up enrollment via prisma.enrollments.findUnique({ where: { course_id_student_id: { course_id, student_id } } })
3. prisma.attendance.findMany({ where: { enrollment_id: enrollment.id }, orderBy: { date: "asc" } })
4. Return attendance records
```

#### `getCourseAnnouncements`
```
1. Verify requester is teacher (owns course) OR student (enrolled in course)
2. prisma.announcements.findMany({ where: { course_id }, include: { assessments: true } })
3. Return list of announcements
```

---

### Step 6 — Ownership Guard Helper

To avoid repeating ownership checks, add a helper inside the controller:

```js
// inside courseController.js
const verifyCourseOwner = async (courseId, teacherId) => {
    const course = await prisma.courses.findUnique({ where: { id: courseId } });
    if (!course) throw { status: 404, message: "Course not found" };
    if (course.teacher_id !== teacherId) throw { status: 403, message: "Forbidden" };
    return course;
};
```

Similarly for student enrollment verification:

```js
const verifyStudentEnrolled = async (courseId, studentId) => {
    const enrollment = await prisma.enrollments.findUnique({
        where: { course_id_student_id: { course_id: courseId, student_id: studentId } }
    });
    if (!enrollment) throw { status: 403, message: "Not enrolled in this course" };
    return enrollment;
};
```

---

### Summary of Files to Create/Modify

| File | Action |
|---|---|
| `prisma/schema.prisma` | Add `code` to `courses`, add `AttendanceStatus` enum, add `attendance` model, add `attendance` back-relation to `enrollments` |
| `backend/src/controllers/courseController.js` | **Create** — all course logic (teacher + student) |
| `backend/src/routes/courseRoutes.js` | **Create** — route definitions with middleware guards |
| `backend/src/server.js` | **Modify** — register `courseRoutes` under `/api/courses` |