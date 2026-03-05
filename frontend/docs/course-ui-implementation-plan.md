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

### ✅ Already implemented

| File | Status |
|------|--------|
| `src/utils/apiClient.js` | ✅ Done — Axios instance with JWT interceptor |
| `src/hooks/useCourses.js` | ✅ Done — all course + attendance hooks |
| `src/pages/student/courses/CoursesPage.jsx` | ✅ Done — live API, skeleton, empty state |
| `src/pages/student/courses/JoinCourseDialog.jsx` | ✅ Done — wired to `useEnrollInCourse` |
| `src/pages/student/courses/CoursePage.jsx` | ✅ Done — announcements stream with assessment badge chips |
| `src/pages/student/attendance/AttendancePage.jsx` | ✅ Done — view-only attendance with summary |
| `src/pages/teacher/TeacherDashboard.jsx` | ✅ Done — sidebar shell |
| `src/pages/teacher/courses/CoursesPage.jsx` | ✅ Done — teacher course grid + create dialog |
| `src/pages/teacher/courses/CoursePage.jsx` | ✅ Done — announcement stream + inline post form |
| `src/pages/teacher/courses/CreateCourseDialog.jsx` | ✅ Done — create course with code reveal |
| `src/pages/teacher/attendance/AttendancePage.jsx` | ✅ Done — mark attendance with upsert |
| `src/App.jsx` | ✅ Done — all course + attendance routes registered |

### 🔲 Still to implement — Assessment pages

| File | Purpose |
|------|---------|
| `src/hooks/useCourses.js` | **Extend** — add 6 new assessment hooks |
| `src/pages/teacher/courses/CoursePage.jsx` | **Modify** — replace "Mark Attendance" button with `+` FAB drawer |
| `src/pages/teacher/courses/AddAssessmentPage.jsx` | **NEW** — teacher creates assessment + uploads source materials |
| `src/pages/teacher/courses/AssessmentPage.jsx` | **NEW** — assessment details tab + submissions tab |
| `src/pages/teacher/courses/ViewSubmissionPage.jsx` | **NEW** — teacher reviews student work, assigns grade |
| `src/pages/student/courses/CoursePage.jsx` | **Modify** — make announcement cards clickable, add assessment tile |
| `src/pages/student/courses/AssessmentPage.jsx` | **NEW** — student reads brief, views files, submits work |
| `src/App.jsx` | **Extend** — register 5 new routes |

---

## Implementation Order

```
Phase 1 (already done):
1  → apiClient.js (JWT interceptor)
2  → useCourses.js (course + attendance hooks)
3  → Student CoursesPage / JoinCourseDialog
4  → Student CoursePage / AttendancePage
5  → Teacher TeacherDashboard / CoursesPage / CreateCourseDialog
6  → Teacher CoursePage / AttendancePage
7  → App.jsx route registration

Phase 2 (assessment upload & submission):
8  → useCourses.js — add assessment hooks
9  → Teacher CoursePage — replace button with FAB drawer
10 → Teacher AddAssessmentPage
11 → Teacher AssessmentPage (details + submissions tab)
12 → Teacher ViewSubmissionPage
13 → Student CoursePage — clickable announcements + assessment tiles
14 → Student AssessmentPage
15 → App.jsx — register new assessment routes
```

---

---

# Phase 2 — Assessment Upload & Submission Pages

---

## Step 13 — Extend `useCourses.js` with Assessment Hooks

**File:** `src/hooks/useCourses.js`

Add the following new query keys and hooks **to the existing file**. All existing hooks remain unchanged.

### New query keys to add to `courseKeys`:

```js
assessmentDetails: (courseId, assessmentId) =>
    ["courses", courseId, "assessments", assessmentId],
submissionDetails: (courseId, assessmentId, submissionId) =>
    ["courses", courseId, "assessments", assessmentId, "submissions", submissionId],
```

### New hooks:

| Hook | Method + Endpoint | Role | TanStack type |
|------|-------------------|------|---------------|
| `useAddAssessment(courseId, announcementId)` | `POST /:courseId/announcements/:announcementId/assessments` | Teacher | `useMutation` |
| `useAssessmentDetails(courseId, assessmentId)` | `GET /:courseId/assessments/:assessmentId` | Both | `useQuery` |
| `useSubmitAssessment(courseId, assessmentId)` | `POST /:courseId/assessments/:assessmentId/submit` | Student | `useMutation` |
| `useUpdateSubmission(courseId, assessmentId)` | `PATCH /:courseId/assessments/:assessmentId/submit` | Student | `useMutation` |
| `useGetSubmissionDetails(courseId, assessmentId, submissionId)` | `GET /:courseId/assessments/:assessmentId/submissions/:submissionId` | Teacher | `useQuery` |
| `useDeleteSourceMaterial(courseId, assessmentId)` | `DELETE /:courseId/assessments/:assessmentId/source-materials/:materialId` | Teacher | `useMutation` |

### Implementation notes:

**`useAddAssessment`** — sends `multipart/form-data`. Use `FormData`:
```
mutationFn: async ({ title, type, instructions, due_date, files }) => {
    const form = new FormData();
    form.append("title", title);
    form.append("type", type);
    if (instructions) form.append("instructions", instructions);
    if (due_date) form.append("due_date", due_date);
    files.forEach(f => form.append("files", f));
    const { data } = await apiClient.post(
        `/api/courses/${courseId}/announcements/${announcementId}/assessments`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
}
onSuccess: () => {
    // Invalidate announcements so the new assessment badge appears
    queryClient.invalidateQueries({ queryKey: courseKeys.announcements(courseId) });
}
```

**`useSubmitAssessment` / `useUpdateSubmission`** — same `FormData` pattern:
```
files.forEach(f => form.append("files", f));
onSuccess: () => {
    queryClient.invalidateQueries({
        queryKey: courseKeys.assessmentDetails(courseId, assessmentId)
    });
}
```

**`useAssessmentDetails`** — returns a role-aware response. The hook just returns
`data.assessment`, `data.submission` (student) or `data.submitted`, `data.late`,
`data.not_submitted` (teacher). The consuming page decides which fields to read.

---

## Step 14 — Teacher `CoursePage.jsx` — Replace button with FAB Drawer

**File:** `src/pages/teacher/courses/CoursePage.jsx`

**What changes:**
Replace the "Mark Attendance" button in the top-right header with a `+` floating action button (FAB). Clicking it slides open a bottom drawer (or a small popover panel) containing three action buttons:

```
┌──────────────────────────────┐
│  ✏️  Add Announcement         │  → opens the existing inline form (scroll to it)
│  📋  Add Assessment           │  → navigate(`/teacher/courses/${courseId}/add-assessment?announcement=<id>`)
│  📅  Mark Attendance          │  → navigate(`/teacher/courses/${courseId}/attendance`)
└──────────────────────────────┘
```

**Drawer behaviour:**
- Rendered as a fixed-position panel anchored to the bottom-right (mobile-friendly) or as a dropdown near the `+` button on desktop.
- `isDrawerOpen` boolean in local state; toggled by the `+` FAB.
- Clicking outside the drawer closes it (use a backdrop `div` with `onClick`).
- The `+` icon rotates 45° to become an `×` when open (`transition-transform rotate-45`).

**Announcement card changes:**
- Each `AnnouncementCard` now shows an `assessments` section if `announcement.assessments.length > 0`.
- Assessment chips inside the card become clickable → navigate to the assessment page.
- Non-assessment announcements remain plain text cards (no changes).

**"Add Assessment" flow:**
Because assessment creation requires an `announcementId`, the teacher must pick an announcement first. Two acceptable UX patterns (pick one):
1. The "Add Assessment" drawer item opens a **modal** listing the course's announcements, the teacher picks one, then navigates to `AddAssessmentPage` with that ID.
2. Each `AnnouncementCard` gets an inline `+ Add Assessment` link at the bottom — clicking it navigates directly to `AddAssessmentPage` with the correct `announcementId` pre-filled.

**Recommended:** option 2 — it is simpler and keeps the announcement context visible.

**Updated `AnnouncementCard` for teacher:**
```
┌──────────────────────────────────────────────┐
│ Title                             [time ago] │
│ Description body text                        │
│                                              │
│ [📋 Assessment Title — QUIZ · Due Mar 15] ◀─── clickable chip → AssessmentPage
│                                              │
│ ──────────────────────────────────────       │
│ + Add Assessment                             │  ◀── link at bottom, only if no assessment yet
└──────────────────────────────────────────────┘
```

**Styling pattern (matches existing cards):**
```jsx
// FAB button
<button className="fixed bottom-6 right-6 z-40 bg-primary text-text-inverse
  w-14 h-14 rounded-full shadow-lg hover:shadow-xl hover:bg-primary-hover
  transition-all flex items-center justify-center">
  <PlusIcon className="w-7 h-7 transition-transform" />
</button>

// Drawer panel
<div className="fixed bottom-24 right-6 z-50 bg-background rounded-2xl
  border border-neutral-200 shadow-xl p-2 w-56 flex flex-col gap-1">
  {/* action rows */}
</div>

// Each action row
<button className="flex items-center gap-3 px-4 py-3 rounded-xl
  text-sm font-medium text-text-primary hover:bg-neutral-100 w-full text-left
  transition-colors">
```

---

## Step 15 — Teacher: `AddAssessmentPage.jsx`

**File:** `src/pages/teacher/courses/AddAssessmentPage.jsx`

**Route:** `/teacher/courses/:courseId/add-assessment`

**Query param:** `?announcementId=<uuid>` — read with `useSearchParams()`

**Purpose:** Teacher fills in assessment details and optionally uploads source material files (PDFs, images). On submit, calls `POST /:courseId/announcements/:announcementId/assessments`.

### Layout:

```
← Back to Course

Add Assessment
─────────────────────────────────────────────
  Title *              [________________________]
  Type *               [Quiz ▼] [Assignment ▼] [Exam ▼]   (segmented toggle)
  Due Date             [date-time picker        ]  (optional)
  Instructions         [textarea — rich text body]  (optional)

  Reference Materials  (optional)
  ┌────────────────────────────────────────────┐
  │  📎 Drag and drop files here, or           │
  │     [Browse files]                         │
  │  PDF, images up to 20 MB · max 10 files   │
  └────────────────────────────────────────────┘
  Uploaded:
  ┌──────────┐  ┌──────────┐
  │ 📄 rubric│  │ 📄 brief │  ← file chip with × remove button
  └──────────┘  └──────────┘

  [Cancel]   [Create Assessment →]
```

### Implementation detail:

```
1. Read courseId from useParams(), announcementId from useSearchParams()
2. Local state:
   - title: string
   - type: "QUIZ" | "ASSIGNMENT" | "EXAM"  (default "ASSIGNMENT")
   - dueDate: string (ISO, optional)
   - instructions: string (optional)
   - files: File[]  (accumulated from file input)
3. File drop zone:
   - <input type="file" multiple accept=".pdf,image/*" hidden ref={fileInputRef} />
   - Drag-over: add dashed border highlight using onDragOver / onDrop handlers
   - onDrop / onChange: append new files to files[] (filter duplicates by name+size)
   - Each picked file shown as a removable chip
4. On submit:
   a. Validate: title and type are required
   b. Build FormData (see Step 13 note)
   c. Call useAddAssessment(courseId, announcementId).mutate(...)
   d. isPending: disable button, show spinner
   e. onSuccess:
      - toast.success("Assessment created!")
      - navigate back to `/teacher/courses/${courseId}`)
   f. onError:
      - toast.error(error.response?.data?.message ?? "Failed to create assessment")
```

### Styling notes (follow existing patterns):

```
- Page wrapper: max-w-2xl mx-auto
- Section cards: bg-background rounded-2xl border border-neutral-200 shadow-sm p-6
- Input fields: same class as CoursePage textarea:
    px-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-text-primary
    text-sm focus:outline-none focus:ring-2 focus:ring-accent-400
- Type segmented toggle: three buttons in a row, selected = bg-primary text-text-inverse,
    unselected = bg-neutral-100 text-text-secondary hover:bg-neutral-200
    rounded-xl px-4 py-2 text-sm font-medium transition-colors
- Drop zone idle: border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center
- Drop zone drag-over: border-accent-400 bg-accent-50
- File chip:
    inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-xl text-sm
    border border-neutral-200
- Submit button: bg-primary text-text-inverse px-6 py-2.5 rounded-xl font-semibold
    hover:bg-primary-hover disabled:opacity-40 flex items-center gap-2
```

---

## Step 16 — Teacher: `AssessmentPage.jsx`

**File:** `src/pages/teacher/courses/AssessmentPage.jsx`

**Route:** `/teacher/courses/:courseId/assessments/:assessmentId`

**Purpose:** Displays the full assessment card (details tab) and a submissions tab listing all students bucketed by submission status.

### Layout (tabbed — reference: screenshot 2):

```
← Back to Course

┌──────────────────────────────────────────────────────────┐
│  📋 [type badge]  Assessment Title       [Due date]      │
│  Created Oct 15 · Course Name                            │
├──────────────────────────────────────────────────────────┤
│  [Assessment Details]  [Submissions  26]                 │ ← tabs
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TAB 1 — Assessment Details:                             │
│  ┌──────────────────────────────────┐  ┌─────────────┐  │
│  │ Instructions                     │  │  Settings   │  │
│  │  body text                       │  │  Due Date:  │  │
│  │                                  │  │  Type:      │  │
│  │ Reference Materials              │  └─────────────┘  │
│  │  [📄 file] [📄 file]             │                    │
│  └──────────────────────────────────┘                    │
│                                                          │
│  TAB 2 — Submissions:                                    │
│  [Filter students…]              [Filter ▼] [Export ↓]  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  STUDENT NAME   STATUS      SUBMISSION TIME  GRADE│  │
│  │  Alice J.  ●   Turned In   Oct 27, 10:45 AM  92/100 [Review] │
│  │  Bob L.    ●   LATE        Oct 29, 08:15 AM  --/100 [Grade]  │
│  │  Carol W.  ●   Pending     —                 N/A             │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Implementation detail:

```
1. Read courseId, assessmentId from useParams()
2. Call useAssessmentDetails(courseId, assessmentId)
3. Tab state: "details" | "submissions" (default "details")

TAB 1 — Assessment Details:
  Left panel:
  - assessment.instructions (if null: "No instructions provided")
  - Reference Materials: grid of file chips
    - Each chip: file icon + file_name + file_size formatted
    - onClick: window.open(material.signed_url, "_blank") to download/preview
  Right panel (settings card):
  - Due Date: format assessment.due_date (or "No deadline")
  - Type: assessment.type badge (QUIZ = teal, ASSIGNMENT = blue, EXAM = amber)

TAB 2 — Submissions:
  API response buckets: submitted[], late[], not_submitted[]
  Merge into a single flat list with a derived displayStatus:
    submitted  → "TURNED_IN"  (green pill "Turned in")
    late       → "LATE"       (red pill "LATE")
    not_submitted → "PENDING" (grey pill "Pending")

  Table columns: Student Name | Status | Submission Time | Grade | Action
  - "Grade" action button → navigate to ViewSubmissionPage
    /teacher/courses/:courseId/assessments/:assessmentId/submissions/:submissionId
  - Search input filters by student name (client-side)
  - No-submissions empty state: "No submissions yet"
```

### Styling notes:

```
- Tab bar: flex border-b border-neutral-200, active tab has border-b-2 border-primary
    text-text-primary font-semibold, inactive tab text-text-secondary
- Status pills (reuse attendance pattern):
    TURNED_IN → bg-success-light text-success border-green-200
    LATE      → bg-error-light text-error border-red-200
    PENDING   → bg-neutral-100 text-text-muted border-neutral-200
- File chip (source material):
    flex items-center gap-2 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200
    hover:bg-neutral-100 cursor-pointer text-sm text-text-primary
- Type badge:
    QUIZ       → bg-accent-50 text-accent-500 border-accent-100
    ASSIGNMENT → bg-blue-50 text-blue-600 border-blue-200
    EXAM       → bg-amber-50 text-amber-600 border-amber-200
- Action button "Grade"/"Review":
    text-accent-500 font-semibold text-sm hover:underline
```

---

## Step 17 — Teacher: `ViewSubmissionPage.jsx`

**File:** `src/pages/teacher/courses/ViewSubmissionPage.jsx`

**Route:** `/teacher/courses/:courseId/assessments/:assessmentId/submissions/:submissionId`

**Purpose:** Teacher reviews a single student's submission — sees their uploaded files via signed URLs, reads the student's name, submission time, and current status, then assigns a grade and feedback.

### Layout (reference: screenshot 3):

```
← Back to Assessment

┌─────────────────────────────────────────────┐
│  Student Name · Submitted Oct 27, 10:45 AM  │
│  Assessment: [Assessment Title]  Status: ●  │
├─────────────────────────────────────────────┤
│                                             │
│  Submitted Files                            │
│  ┌────────────┐  ┌────────────┐            │
│  │ 📄 file1  │  │ 📄 file2  │            │  ← clickable chips, open signed_url
│  └────────────┘  └────────────┘            │
│                                             │
│  Grade                                      │
│  ┌──────────────────────────────────────┐  │
│  │  Score:  [_____] / 100               │  │
│  │  Feedback: [textarea]                │  │
│  │                  [Submit Grade →]    │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  (if already graded: show grade + feedback  │
│   in read-only card with "Edit" toggle)     │
└─────────────────────────────────────────────┘
```

### Implementation detail:

```
1. Read courseId, assessmentId, submissionId from useParams()
2. Call useGetSubmissionDetails(courseId, assessmentId, submissionId)
3. Destructure: submission.user, submission.attachments, submission.status,
   submission.submitted_at, submission.grade, submission.feedback
4. Files grid:
   - Each attachment chip opens window.open(attachment.signed_url, "_blank")
   - Show file_name, file_size (formatted: "1.2 MB"), mime_type icon
5. Grading form (local state: grade, feedback):
   - grade: number input (0–100)
   - feedback: textarea
   - Submit: calls gradeSubmission mutation
     PATCH /:courseId/assessments/:assessmentId/submissions/:submissionId/grade
     Body: { grade, feedback }
   - isPending → disabled + spinner
   - onSuccess: toast.success("Grade submitted!"), invalidate submissionDetails query
   - onError: toast.error(...)
   - Note: endpoint returns 501 until implemented — show toast.error with friendly message
6. If submission.grade !== null: show existing grade in a read-only card,
   provide "Edit Grade" toggle to re-open the form
```

### Styling notes:

```
- Layout: max-w-2xl mx-auto, space-y-6
- File chip:
    flex items-center gap-3 px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200
    hover:bg-neutral-100 cursor-pointer group
    File icon: w-9 h-9 rounded-lg bg-accent-50 border border-accent-100 flex items-center justify-center
- Grade card: same card pattern as CreateCourseDialog success panel
    bg-background rounded-2xl border border-neutral-200 shadow-sm p-6
- Grade input: text-center text-3xl font-bold text-text-primary w-24
    border-b-2 border-neutral-300 focus:border-accent-400 outline-none bg-transparent
- Submit grade button: bg-primary text-text-inverse px-6 py-2.5 rounded-xl font-semibold
    hover:bg-primary-hover disabled:opacity-40 float-right
```

---

## Step 18 — Student `CoursePage.jsx` — Clickable Announcements + Assessment Tiles

**File:** `src/pages/student/courses/CoursePage.jsx`

**What changes (two targeted modifications to existing file):**

### 1. `AnnouncementCard` becomes a router-aware component

Each card must now respond to click:
- If `announcement.assessments.length > 0`: navigate to the assessment page
  `navigate(`/student/courses/${courseId}/assessments/${announcement.assessments[0].id}`)`
- If no assessments: the card is still rendered but is **not** clickable (or shows plain text on click — teacher-only feature)

**Redesign `AnnouncementCard` for the two variants:**

**Plain announcement (no assessment):**
```
┌────────────────────────────────────────────┐
│  📢 Announcement Title          [time ago] │
│     Description body text                  │
└────────────────────────────────────────────┘
```

**Assessment announcement tile (has assessment):**
```
┌────────────────────────────────────────────┐
│  📋 [QUIZ]  Assessment Title   [time ago]  │  ← teal accent icon + type badge
│     Due: March 15, 2026                    │  ← due date shown
│     Turn in your work                      │  ← CTA sub-line
│                              [Open →]      │
└────────────────────────────────────────────┘
```

**Styling for assessment tile:**
```jsx
// Clickable wrapper
<div
  onClick={() => navigate(`/student/courses/${courseId}/assessments/${a.id}`)}
  className="bg-background rounded-2xl border border-accent-100 shadow-sm
    hover:shadow-md hover:border-accent-300 cursor-pointer p-5
    transition-all group"
>
  {/* type badge */}
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
    bg-accent-50 border border-accent-100 text-xs font-semibold text-accent-500 mb-2">
    📋 {assessment.type}
  </span>
  <h3 className="text-sm font-bold text-text-primary">{assessment.title}</h3>
  {assessment.due_date && (
    <p className="text-xs text-text-muted mt-1">
      Due {formatDate(assessment.due_date)}
    </p>
  )}
  <div className="flex justify-end mt-3">
    <span className="text-xs font-semibold text-accent-500
      group-hover:underline">
      Open →
    </span>
  </div>
</div>
```

### 2. Remove the "My Attendance" button from the top-right

The attendance shortcut button is redundant (available via the dashboard sidebar). Remove it to keep the header clean.

---

## Step 19 — Student: `AssessmentPage.jsx`

**File:** `src/pages/student/courses/AssessmentPage.jsx`

**Route:** `/student/courses/:courseId/assessments/:assessmentId`

**Purpose:** Student reads the assignment brief, downloads source materials, and submits their work. Mirrors Google Classroom / reference screenshot 1.

### Layout (two-column on ≥ md, stacked on mobile):

```
← Back to Course

┌───────────────────────────────────────────┬─────────────────────┐
│                                           │  Your Work          │
│  📋 QUIZ  Assessment Title                │  ─────────────────  │
│  Due: March 15, 2026                      │  Status: Assigned   │
│                                           │                     │
│  Instructions                             │  [📄 my-file.pdf] × │  ← if submitted
│  ─────────────────────────────            │                     │
│  Body text from assessment.instructions   │  [+ Add Work]       │
│                                           │  [Turn In]          │
│  Reference Materials                      │                     │
│  ─────────────────────────────            │  Due: Mar 15, 2026  │
│  [📄 rubric.pdf] [📄 guide.docx]          │  ─────────────────  │
│   (clickable → signed_url)                │  (if graded:        │
│                                           │   Grade: 87/100     │
│                                           │   Feedback: "..."   │
└───────────────────────────────────────────┴─────────────────────┘
```

### Implementation detail:

```
1. Read courseId, assessmentId from useParams()
2. Call useAssessmentDetails(courseId, assessmentId)  — student role response:
   - assessment (with source_materials + signed_url)
   - submission (null if not yet submitted, else { status, attachments[] })

Left panel:
3. assessment.title + type badge + due_date
4. assessment.instructions (if null: "No instructions provided.")
5. Reference Materials grid:
   - Each material chip: file_name, file_size, mime_type icon
   - onClick: window.open(material.signed_url, "_blank")
   - Empty: "No reference materials uploaded."

Right panel — Submission Portal:
6. Header: "Your Work" + status badge (Assigned / Submitted / Late / Graded)
7. If submission !== null:
   - List attached files (attachment chips with signed_url links)
   - "Add More Work" button (opens file picker → calls useUpdateSubmission)
   - Disabled if status === "GRADED"
8. If submission === null:
   - File drop zone (same drag-and-drop UX as AddAssessmentPage)
   - "Add Work" button opens file picker and accumulates files into pendingFiles[]
   - "Turn In" button:
       a. Validates: pendingFiles.length > 0
       b. Calls useSubmitAssessment(courseId, assessmentId).mutate({ files: pendingFiles })
       c. isPending: spinner + disabled
       d. onSuccess: toast.success("Submitted!"), invalidate assessmentDetails query
       e. onError: toast.error(...)
9. Due date display:
   - "Due {formatted date}" in muted text
   - If past due_date: show red "Overdue" badge
   - If no due_date: "No deadline"
10. If submission.grade !== null (status === "GRADED"):
    - Show grade in an accent-colored box: "87 / 100"
    - Show submission.feedback below
```

### File drop zone (reusable pattern — same as `AddAssessmentPage`):

```jsx
// Compact version for submission portal
<div
  onDragOver={e => { e.preventDefault(); setDragging(true); }}
  onDragLeave={() => setDragging(false)}
  onDrop={handleDrop}
  onClick={() => fileInputRef.current.click()}
  className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer
    transition-colors
    ${dragging
      ? "border-accent-400 bg-accent-50"
      : "border-neutral-200 hover:border-accent-300 hover:bg-neutral-50"
    }`}
>
  <p className="text-sm text-text-muted">Drag files here or <span className="text-accent-500 font-semibold">browse</span></p>
  <input ref={fileInputRef} type="file" multiple hidden
    accept=".pdf,image/*" onChange={handleFileChange} />
</div>
```

### Styling notes:

```
- Page wrapper: max-w-5xl mx-auto, grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6
- Left panel card: bg-background rounded-2xl border border-neutral-200 shadow-sm p-6
- Right panel card (submission portal): bg-background rounded-2xl border border-neutral-200
    shadow-sm p-5 md:sticky md:top-6  (sticky on desktop so it scrolls with left panel)
- Status badge:
    Assigned → bg-neutral-100 text-text-muted border-neutral-200
    Submitted → bg-success-light text-success border-green-200
    Late     → bg-error-light text-error border-red-200
    Graded   → bg-accent-50 text-accent-500 border-accent-100
- "Turn In" button: bg-primary text-text-inverse w-full py-3 rounded-xl font-semibold
    hover:bg-primary-hover disabled:opacity-40 transition-colors
- "Add Work" button: border border-neutral-200 text-text-primary w-full py-2.5 rounded-xl
    text-sm font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2
- Grade display:
    bg-accent-50 rounded-xl border border-accent-100 p-4 text-center
    <span className="text-3xl font-bold text-accent-500">{grade}</span>
    <span className="text-lg text-text-secondary"> / 100</span>
```

---

## Step 20 — Extend `App.jsx` with Assessment Routes

**File:** `src/App.jsx`

Add the following imports and routes:

```jsx
// New imports
import AddAssessmentPage from "./pages/teacher/courses/AddAssessmentPage.jsx";
import TeacherAssessmentPage from "./pages/teacher/courses/AssessmentPage.jsx";
import ViewSubmissionPage from "./pages/teacher/courses/ViewSubmissionPage.jsx";
import StudentAssessmentPage from "./pages/student/courses/AssessmentPage.jsx";
```

```jsx
// Inside <Routes> — add after existing teacher/student routes:

{/* Teacher — assessment routes */}
<Route
  path="/teacher/courses/:courseId/add-assessment"
  element={<AddAssessmentPage />}
/>
<Route
  path="/teacher/courses/:courseId/assessments/:assessmentId"
  element={<TeacherAssessmentPage />}
/>
<Route
  path="/teacher/courses/:courseId/assessments/:assessmentId/submissions/:submissionId"
  element={<ViewSubmissionPage />}
/>

{/* Student — assessment routes */}
<Route
  path="/student/courses/:courseId/assessments/:assessmentId"
  element={<StudentAssessmentPage />}
/>
```

---

## Updated File Status Table

| File | Status | Notes |
|------|--------|-------|
| `src/utils/apiClient.js` | ✅ Done | |
| `src/hooks/useCourses.js` | 🔲 Extend | Add 6 assessment hooks (Step 13) |
| `src/pages/student/courses/CoursesPage.jsx` | ✅ Done | |
| `src/pages/student/courses/JoinCourseDialog.jsx` | ✅ Done | |
| `src/pages/student/courses/CoursePage.jsx` | 🔲 Modify | Clickable tiles + assessment variant (Step 18) |
| `src/pages/student/courses/AssessmentPage.jsx` | 🔲 New | Student submit/view page (Step 19) |
| `src/pages/student/attendance/AttendancePage.jsx` | ✅ Done | |
| `src/pages/teacher/TeacherDashboard.jsx` | ✅ Done | |
| `src/pages/teacher/courses/CoursesPage.jsx` | ✅ Done | |
| `src/pages/teacher/courses/CoursePage.jsx` | 🔲 Modify | FAB drawer + assessment chips (Step 14) |
| `src/pages/teacher/courses/AddAssessmentPage.jsx` | 🔲 New | Create assessment + file upload (Step 15) |
| `src/pages/teacher/courses/AssessmentPage.jsx` | 🔲 New | Details tab + submissions tab (Step 16) |
| `src/pages/teacher/courses/ViewSubmissionPage.jsx` | 🔲 New | Review + grade student work (Step 17) |
| `src/pages/teacher/courses/CreateCourseDialog.jsx` | ✅ Done | |
| `src/pages/teacher/attendance/AttendancePage.jsx` | ✅ Done | |
| `src/App.jsx` | 🔲 Extend | Add 4 new assessment routes (Step 20) |
