# Course Management — Frontend Implementation Plan

## Codebase Context

**Stack:** React + Vite, TailwindCSS, React Router v6, TanStack Query, Axios, react-hot-toast

**Theme:** Black primary (`#000000`), Teal accent (`#2dd4bf`), White background — follow `THEME.md` for all class names

**Existing patterns to follow:**
- `apiClient.js` — Axios instance with `VITE_API_BASE_URL` base URL (must attach JWT via interceptor)
- `StudentDashboard.jsx` — tab-based layout with sidebar; content rendered inside a content area
- `CoursesPage.jsx` — existing static card grid (will be replaced with live data)
- `JoinCourseDialog.jsx` — existing dialog UI shell (will be wired up)
- `@tanstack/react-query` — already installed; use `useQuery` / `useMutation` for all API calls
- `react-hot-toast` — already installed; use `toast.success` / `toast.error` for feedback

---

## Architecture Overview

```
src/
├── utils/
│   └── apiClient.js              ← Add JWT interceptor here
├── hooks/
│   └── useCourses.js             ← All TanStack Query hooks for course API
├── pages/
│   ├── student/
│   │   ├── StudentDashboard.jsx  ← Wire Attendance tab to AttendancePage
│   │   ├── courses/
│   │   │   ├── CoursesPage.jsx   ← Replace mock data with live API
│   │   │   ├── CoursePage.jsx    ← NEW: individual course view (student)
│   │   │   └── JoinCourseDialog.jsx ← Wire up enroll mutation
│   │   └── attendance/
│   │       └── AttendancePage.jsx ← NEW: student attendance overview
│   └── teacher/
│       ├── TeacherDashboard.jsx  ← NEW: mirrors StudentDashboard for teachers
│       ├── courses/
│       │   ├── CoursesPage.jsx   ← NEW: teacher course list + create course
│       │   ├── CoursePage.jsx    ← NEW: individual course view (teacher)
│       │   └── CreateCourseDialog.jsx ← NEW: dialog to create a course
│       └── attendance/
│           └── AttendancePage.jsx ← NEW: teacher mark-attendance interface
└── App.jsx                       ← Register all new routes
```

---

## Step-by-Step Implementation

---

### Step 1 — Wire JWT into `apiClient.js`

**File:** `src/utils/apiClient.js`

Every request to the backend must include `Authorization: Bearer <token>`. Add a request interceptor that reads the Supabase session token before each call.

```
1. Import supabase client
2. Add axios request interceptor:
   - Call supabase.auth.getSession()
   - If session exists, set headers.Authorization = `Bearer ${session.access_token}`
3. Export the configured apiClient
```

**Why first:** Every hook and page below depends on authenticated requests.

---

### Step 2 — Create `useCourses.js` (shared API hooks)

**File:** `src/hooks/useCourses.js`

Centralise all course-related API calls in one file. Both teacher and student pages will import from here.

#### Hooks to implement:

| Hook | Method + Endpoint | Role | TanStack type |
|------|-------------------|------|---------------|
| `useEnrolledCourses()` | `GET /api/courses/enrolled` | Student | `useQuery` |
| `useEnrollInCourse()` | `POST /api/courses/enroll` | Student | `useMutation` |
| `useStudentAttendance(courseId)` | `GET /api/courses/:courseId/my-attendance` | Student | `useQuery` |
| `useCourseAnnouncements(courseId)` | `GET /api/courses/:courseId/announcements` | Both | `useQuery` |
| `useTeacherCourses()` | `GET /api/courses/my-courses` | Teacher | `useQuery` |
| `useCreateCourse()` | `POST /api/courses` | Teacher | `useMutation` |
| `useAddAnnouncement(courseId)` | `POST /api/courses/:courseId/announcements` | Teacher | `useMutation` |
| `useMarkAttendance(courseId)` | `POST /api/courses/:courseId/attendance` | Teacher | `useMutation` |
| `useCourseAttendance(courseId)` | `GET /api/courses/:courseId/attendance` | Teacher | `useQuery` |

**Query key conventions:**
```js
["courses", "enrolled"]                        // student enrolled list
["courses", courseId, "announcements"]         // announcements per course
["courses", courseId, "attendance", "mine"]    // student own attendance
["courses", "teacher"]                         // teacher owned courses
["courses", courseId, "attendance"]            // teacher full attendance
```

**Mutation side effects:** On success, call `queryClient.invalidateQueries` on the relevant key to keep the UI in sync automatically.

---

### Step 3 — Student: `CoursesPage.jsx` (replace mock with live data)

**File:** `src/pages/student/courses/CoursesPage.jsx`

**What changes:**
- Remove `mockCourses` array
- Call `useEnrolledCourses()` to fetch real data
- Show a loading skeleton (3 ghost cards) while fetching
- Show an empty state with a "Join your first course" prompt when the list is empty
- Each `CourseCard` navigates to `/student/courses/:courseId` on click
- The `+` FAB opens `JoinCourseDialog`

**CourseCard data mapping from API:**
```
course.title        → card title
course.code         → displayed as badge
course.teacher.name → instructor line
course.id           → used for navigation
color               → pick from CARD_COLORS using index % CARD_COLORS.length
```

---

### Step 4 — Student: `JoinCourseDialog.jsx` (wire enroll mutation)

**File:** `src/pages/student/courses/JoinCourseDialog.jsx`

**What changes:**
- Import `useEnrollInCourse()` mutation
- On form submit: call `mutate({ code: courseCode })`
- While pending: disable button, show loading spinner inside it
- On success: `toast.success("Enrolled successfully!")`, close dialog
- On error:
  - `404` → `toast.error("Course not found. Check the code and try again.")`
  - `409` → `toast.error("You are already enrolled in this course.")`
  - other → `toast.error("Something went wrong. Please try again.")`

---

### Step 5 — Student: `CoursePage.jsx` (individual course view)

**File:** `src/pages/student/courses/CoursePage.jsx`

**Route:** `/student/courses/:courseId`

**Layout — two sections:**

```
┌─────────────────────────────────────────────┐
│  ← Back    Course Title          [Attendance]│  ← header bar
├─────────────────────────────────────────────┤
│                                             │
│  Announcements stream (scrollable)          │
│  ┌─────────────────────────────────────┐   │
│  │ 📢 Announcement title               │   │
│  │    description text                 │   │
│  │    date · assessments badge         │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 📢 ...                              │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Implementation detail:**
```
1. Read courseId from useParams()
2. Call useCourseAnnouncements(courseId)
3. Render a scrollable list of announcement cards ordered newest → oldest
   - Each card shows: title, description, createdAt (formatted), 
     and assessment type badges if assessments.length > 0
4. "Attendance" button in header → navigate(`/student/attendance/${courseId}`)
5. Loading: show skeleton cards
6. Empty: "No announcements yet" empty state
```

---

### Step 6 — Student: `AttendancePage.jsx`

**File:** `src/pages/student/attendance/AttendancePage.jsx`

**Route:** `/student/attendance/:courseId`

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Back to Course          Attendance Record │
│  Course: [Course Title]                      │
├──────────────────────────────────────────────┤
│  Summary row:                                │
│  ✅ Present: 12   ❌ Absent: 3   ⏰ Late: 1  │
├──────────────────────────────────────────────┤
│  Date          Status                        │
│  ─────────     ──────                        │
│  Mar 03, 2026  🟢 Present                    │
│  Mar 05, 2026  🔴 Absent                     │
│  Mar 07, 2026  🟡 Late                       │
└──────────────────────────────────────────────┘
```

**Implementation detail:**
```
1. Read courseId from useParams()
2. Call useStudentAttendance(courseId)
3. Compute summary counts from records array
4. Render a table/list of records:
   - date (formatted with toLocaleDateString)
   - status badge: PRESENT = green pill, ABSENT = red pill, LATE = amber pill
5. View-only — no edit controls
6. "← Back" button → navigate(-1)
```

---

### Step 7 — Teacher: `TeacherDashboard.jsx`

**File:** `src/pages/teacher/TeacherDashboard.jsx`

**Route:** `/teacher/dashboard`

Mirror `StudentDashboard.jsx` structure exactly, with these differences:

| Item | Student | Teacher |
|------|---------|---------|
| Nav: Courses | → `TeacherCoursesPage` | → `TeacherCoursesPage` |
| Nav: Attendance | → `StudentAttendancePage` | → `TeacherAttendancePage` |
| Sidebar label | student name | teacher name |

Read user from Supabase session (`supabase.auth.getSession()`) to populate the name in the sidebar.

---

### Step 8 — Teacher: `CoursesPage.jsx` (teacher course list)

**File:** `src/pages/teacher/courses/CoursesPage.jsx`

Almost identical to the student version, with two differences:

1. **Data source:** calls `useTeacherCourses()` instead of `useEnrolledCourses()`
2. **`+` FAB:** opens `CreateCourseDialog` instead of `JoinCourseDialog`
3. **CourseCard extra info:** show student count (`course.students.length`) in the card footer
4. **Card click:** navigates to `/teacher/courses/:courseId`

---

### Step 9 — Teacher: `CreateCourseDialog.jsx`

**File:** `src/pages/teacher/courses/CreateCourseDialog.jsx`

```
Fields:
  - Title (required, text input)
  - Description (optional, textarea)

On submit:
  1. Call useCreateCourse() mutation with { title, description }
  2. Pending: disable button + show spinner
  3. Success:
     - toast.success("Course created! Code: <course.code>")
     - Display the generated code in a highlighted box so teacher can copy it
     - Close dialog after teacher dismisses the code
  4. Error: toast.error(error.response.data.message)
```

> **UX note:** The generated course code (`course.code`) must be shown prominently after creation (e.g. large monospaced text with a copy button) — teachers need to share this with students.

---

### Step 10 — Teacher: `CoursePage.jsx` (individual course view)

**File:** `src/pages/teacher/courses/CoursePage.jsx`

**Route:** `/teacher/courses/:courseId`

Same announcement stream as the student view, plus teacher-only controls:

```
┌──────────────────────────────────────────────┐
│  ← Back    Course Title    [+ Announcement]  │
│                            [Attendance]       │
├──────────────────────────────────────────────┤
│  Announcements stream (scrollable)           │
└──────────────────────────────────────────────┘
```

**"+ Announcement" button:**
- Opens an inline form or modal with `title` + `description` fields
- Calls `useAddAnnouncement(courseId)` mutation on submit
- On success: `toast.success("Announcement posted")`, invalidates announcements query
- On error: `toast.error(...)`

**"Attendance" button:** navigates to `/teacher/attendance/:courseId`

---

### Step 11 — Teacher: `AttendancePage.jsx`

**File:** `src/pages/teacher/attendance/AttendancePage.jsx`

**Route:** `/teacher/attendance/:courseId`

**Layout:**
```
┌──────────────────────────────────────────────┐
│  ← Back         Mark Attendance             │
│  Course: [Title]   Date: [date picker]       │
├──────────────────────────────────────────────┤
│  Student Name        Status                  │
│  ──────────────      ──────────────────────  │
│  Alice Johnson       [Present] [Absent] [Late]│
│  Bob Smith           [Present] [Absent] [Late]│
│  ...                                         │
├──────────────────────────────────────────────┤
│                    [Save Attendance]         │
└──────────────────────────────────────────────┘
```

**Implementation detail:**
```
1. Read courseId from useParams()
2. Call useCourseAttendance(courseId) to get existing records
3. Call useTeacherCourses() to get course.students list for the roster
4. Local state: Map<student_id, status> — initialised to "PRESENT" for all
5. Date picker: defaults to today (new Date().toISOString().split("T")[0])
6. On page load / date change: pre-fill statuses from existing records for that date
7. On "Save Attendance":
   a. Build records array: course.students.map(e => ({ student_id: e.student_id, status: localState[e.student_id] }))
   b. Call useMarkAttendance(courseId).mutate({ date, records })
   c. Success: toast.success("Attendance saved")
   d. Error: toast.error(...)
8. Status toggle buttons: styled pill buttons per status value
   PRESENT = green, ABSENT = red, LATE = amber
```

---

### Step 12 — Register all new routes in `App.jsx`

**File:** `src/App.jsx`

```
Student routes (under /student):
  /student/dashboard              → StudentDashboard
  /student/courses/:courseId      → student/courses/CoursePage
  /student/attendance/:courseId   → student/attendance/AttendancePage

Teacher routes (under /teacher):
  /teacher/dashboard              → TeacherDashboard
  /teacher/courses/:courseId      → teacher/courses/CoursePage
  /teacher/attendance/:courseId   → teacher/attendance/AttendancePage
```

> **Note:** Route protection (redirecting unauthenticated users) should be added as a `<ProtectedRoute>` wrapper component that checks Supabase session on mount.

---

## Summary of Files

### New files to create

| File | Purpose |
|------|---------|
| `src/hooks/useCourses.js` | All TanStack Query hooks for course API |
| `src/pages/teacher/TeacherDashboard.jsx` | Teacher dashboard shell with sidebar |
| `src/pages/teacher/courses/CoursesPage.jsx` | Teacher course list |
| `src/pages/teacher/courses/CoursePage.jsx` | Teacher individual course + announcements |
| `src/pages/teacher/courses/CreateCourseDialog.jsx` | Create course modal |
| `src/pages/teacher/attendance/AttendancePage.jsx` | Teacher mark attendance interface |
| `src/pages/student/courses/CoursePage.jsx` | Student individual course + announcements |
| `src/pages/student/attendance/AttendancePage.jsx` | Student view-only attendance |

### Existing files to modify

| File | Change |
|------|--------|
| `src/utils/apiClient.js` | Add JWT interceptor |
| `src/pages/student/courses/CoursesPage.jsx` | Replace mock data with `useEnrolledCourses()` |
| `src/pages/student/courses/JoinCourseDialog.jsx` | Wire `useEnrollInCourse()` mutation |
| `src/pages/student/StudentDashboard.jsx` | Wire Attendance tab to `AttendancePage` |
| `src/App.jsx` | Register all new routes |

---

## Implementation Order

```
1  → apiClient.js (JWT interceptor)          — unblocks everything
2  → useCourses.js (all hooks)               — unblocks all pages
3  → Student CoursesPage (live data)         — quick visible win
4  → JoinCourseDialog (enroll mutation)      — completes student enroll flow
5  → Student CoursePage (announcements)      — individual course view
6  → Student AttendancePage (view only)      — completes student attendance flow
7  → TeacherDashboard                        — teacher shell
8  → Teacher CoursesPage + CreateCourseDialog
9  → Teacher CoursePage + AddAnnouncement
10 → Teacher AttendancePage (mark + view)
11 → App.jsx route registration              — wire everything together
```
