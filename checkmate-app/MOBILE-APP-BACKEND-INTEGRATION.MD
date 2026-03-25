<!-- filepath: c:\Users\Administrator\Desktop\FYP\checkmate-fyp\MOBILE-APP-BACKEND-INTEGRATION.MD -->

# Mobile App ↔ Backend Integration (Plan)

## 0) Current state (what’s true in this repo)

### Backend (`backend/`)
- Express + Prisma (Postgres) + Supabase Auth.
- **Auth model:** client authenticates with Supabase; Node backend only **verifies Supabase JWT** via `Authorization: Bearer <token>`.
- Primary teacher surface area is under `GET/POST /api/courses/*`.
- File uploads are handled server-side via `multer` and stored in **private** Supabase Storage buckets with **signed URLs** returned to clients.

### Web app (`frontend/`) as the “source of truth” client implementation
- Uses `supabase.auth.signInWithPassword()` for login.
- Uses an axios interceptor that attaches the **Supabase access token** on every request.
- Uses backend routes exactly as implemented under `backend/src/routes/*`.

### Mobile app (`checkmate-app/`)
- Currently contains an API layer and types that match a different backend (Mongo/JWT + refresh tokens).
- Several screens call non-existent services or endpoints.

---

## 1) Backend routes & contracts the mobile app must align to

This section summarizes the *actual* backend interfaces (inputs/outputs) that the mobile app should target.

### 1.1 Auth

**Backend endpoint:** `GET /api/auth/me`
- Requires: `Authorization: Bearer <Supabase JWT>`
- Response:
  - `200 { user: <dbUser> }`

> Notes
> - There is **no** `/api/auth/login`, `/register`, `/refresh`, `/logout` in the current backend.
> - Login/logout must be done **directly via Supabase** in the mobile app.

### 1.2 Courses

Implemented in `backend/src/routes/courseRoutes.js` and detailed in `backend/docs/COURSE-API-REFERENCE.md`.

**Teacher**
- `POST /api/courses` body: `{ title, description? }` → `201 { message, course }`
- `GET /api/courses/my-courses` → `200 { message, courses }`
  - includes `students[]` (enrollments with `student`) and `announcements[]`
- `DELETE /api/courses/:id` → `200 { message }`

**Student**
- `POST /api/courses/enroll` body: `{ code }` → `201 { message, enrollment }`
- `GET /api/courses/enrolled` → `200 { message, courses }`
- `DELETE /api/courses/unenroll/:courseId` → `200 { message }`

### 1.3 Announcements

**Shared access, internal role checks**
- `GET /api/courses/:courseId/announcements` → `200 { message, announcements }`
  - announcements include `comments[]`, `resources[]` (with `signed_url`), and `assessments[]` (with `source_materials[]`)

**Teacher**
- `POST /api/courses/:courseId/announcements` multipart (`uploadMultiple`) with:
  - fields: `title`, `description`
  - files: `files[]` optional
  - response: `201 { message, announcement }`
- `POST /api/courses/:courseId/announcements/:announcementId/comments` body `{ content }` → `201 { message, comment }`
- `DELETE /api/courses/:courseId/announcements/:announcementId/comments/:commentId` → `200 { message }`

### 1.4 Attendance

**Teacher**
- `POST /api/courses/:courseId/attendance` body:
  - `{ sessionId?, date, title?, records: [{ student_id, status }] }`
  - response: `200 { message, sessionId, results }`
- `GET /api/courses/:courseId/attendance` → `200 { message, sessions }`
- `DELETE /api/courses/:courseId/attendance/:sessionId` → `200 { message }`

**Student**
- `GET /api/courses/:courseId/my-attendance` → `200 { message, records }`

### 1.5 Assessments + submissions

**Teacher: create assessment**
- `POST /api/courses/:courseId/announcements/:announcementId/assessments` multipart:
  - fields: `title*`, `type*` (enum: `QUIZ|ASSIGNMENT|EXAM`), `instructions?`, `due_date? (ISO)`
  - files: `files[]` optional (source materials)
  - response: `201 { message, assessment, source_materials }`

**Role-aware assessment details**
- `GET /api/courses/:courseId/assessments/:assessmentId`
  - Teacher response: `{ message, assessment, submitted, late, not_submitted }`
  - Student response: `{ message, assessment, submission }`
  - Signed URLs are generated for materials/attachments.

**Student submission lifecycle**
- `POST /api/courses/:courseId/assessments/:assessmentId/submit` multipart `files[]` (required)
- `PATCH /api/courses/:courseId/assessments/:assessmentId/submit` multipart `files[]` (append files)
- `DELETE /api/courses/:courseId/assessments/:assessmentId/submit`
- `DELETE /api/courses/:courseId/assessments/:assessmentId/attachments/:attachmentId`

**Teacher grading + detail**
- `GET /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId`
- `PATCH /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade`

---

## 2) checkmate-app API interfaces/types to change (inputs/outputs)

The mobile app’s existing types/services must shift from the “old” Mongo/JWT model to the backend contracts above.

### 2.1 Global protocol changes

#### A) Remove/stop using refresh-token auth
- **Remove concepts from mobile API layer:**
  - `token`, `refreshToken` storage
  - `/api/auth/login|register|refresh|logout` calls
- Replace with:
  - Supabase client auth on device
  - axios interceptor attaching `supabase.auth.getSession().data.session.access_token`

#### B) Replace `ApiResponse<T>` wrapper usage
Backend responses are not wrapped as `{ success, data }`.
- Typical pattern is `{ message, <payloadKey> }` (e.g. `{ message, courses }`).

So `checkmate-app/services/api/types.ts` should be replaced or split into:
- **Backend DTOs** matching backend responses
- **UI models** (optional) mapped from DTOs for display

### 2.2 Concrete mismatches to fix (most important)

#### Auth / user
Mobile currently:
- `UserRole = 'professor'|'student'|'admin'`
Backend uses:
- `role = 'TEACHER'|'STUDENT'|'ADMIN'`

Mobile currently expects `GetCurrentUserResponse` fields:
- `firstName/lastName/fullName/profileImage`
Backend DB user uses:
- `users` table: `id,email,name,role,profile_picture...` (see middleware auto-sync in `backend/src/middleware/authMiddleware.js`).

**Action:** update mobile user model to backend shape: `id, email, name, role, profile_picture`.

#### Courses
Mobile types currently include:
- `Course._id`, `section`, `semester`, `year`, `credits`, `maxStudents`, etc.
Backend course model is simpler (per `createCourse` & docs):
- `courses: { id, title, description?, code, teacher_id, createdAt, updatedAt }`
- plus nested enrollments and announcements.

**Action:**
- Replace `_id` with `id`.
- Remove fields not present in backend (or treat as future features).
- Use backend list endpoints (`/my-courses`, `/enrolled`).

#### Announcements
Mobile currently uses `{ title, content, priority }`.
Backend uses `{ title, description }` and supports attachments as `resources[]`.

**Action:**
- Replace `content` → `description`.
- If mobile wants priority, it must be UI-only or added to backend later.

#### Assessments
Mobile currently uses a completely different model (status/upcoming/graded etc.).
Backend assessment shape uses:
- `title`, `type` (QUIZ|ASSIGNMENT|EXAM), `instructions?`, `due_date?`, `source_materials[]`.

**Action:**
- Update `AssessmentType` to match backend enum.
- Remove computed “status” fields from API types unless computed client-side.
- Assessment list should be derived from announcements: `GET /api/courses/:courseId/announcements` then flatten `ann.assessments` (like web).

#### Submissions (teacher scanning vs backend)
Backend submission creation is currently **student-only** via `/submit` endpoints.
Mobile teacher UI currently tries to create a submission on behalf of a student using JSON + local file URIs.

**Action:**
- Update mobile to use multipart upload against backend endpoints.
- Decide whether teacher-scanned submissions become:
  1) “Teacher created submission” (requires new backend endpoints), or
  2) “Upload scan as source material / grading artifact” (new feature design).

---

## 3) Missing teacher screens in checkmate-app (using frontend as reference)

Teacher course experience in web (`frontend/src/pages/teacher/courses/CoursePage/*`) includes tabs that the mobile app either lacks entirely or only partially covers.

### 3.1 Missing high-priority screens

1) **Course Announcements List + Comments UI**
- Web: Announcements tab shows announcements + resources + comments.
- Mobile: `ViewCourseScreen.tsx` renders announcements but does not show comments CRUD and resources UX consistently.

2) **Attendance feature (fully missing)**
- Web: `AttendanceTab.jsx` supports:
  - mark attendance with `title + date + records[]`
  - edit existing session
  - history list
  - delete session
- Mobile: no attendance screens/components.

3) **Teacher Assessment Portal / Submission management**
- Web: assessment detail page shows submitted / late / not_submitted lists and lets teacher open a submission and grade.
- Mobile: has an assessment detail screen, but it is wired to non-backend endpoints and lacks a proper submission list + grading screens.

4) **Student roster**
- Web: Students tab is driven by `course.students[].student`.
- Mobile: has a global “Students” tab but it is not backed by working services and does not map to backend teacher data.

### 3.2 Additional screens to consider
- **Course settings / delete course** (exists on web; mobile has delete route available but no clear UI flow).
- **View signed resources and attachments** (PDF/images) using signed URLs.

---

## 4) Backend gaps relative to *mobile teacher* needs (especially scanning submissions)

### 4.1 What exists already for teacher (no new endpoints needed)
- Teacher can get:
  - courses via `/api/courses/my-courses`
  - announcements (and embedded assessments) via `/api/courses/:courseId/announcements`
  - assessment portal (submitted/late/not_submitted) via `/api/courses/:courseId/assessments/:assessmentId`
  - submission detail and grading via nested submission routes
  - attendance routes

### 4.2 What is missing for the current mobile “scanner creates submission for student” UX

To keep the existing mobile UX (teacher selects student → scans → creates submission), the backend would need *teacher-scoped submission creation* endpoints (because current submit endpoints are STUDENT-only):

**Missing endpoints (proposed):**
1) `POST /api/courses/:courseId/assessments/:assessmentId/submissions` (TEACHER)
- multipart: `files[]` + `student_id` + optional `notes`
- creates `submissions` row for that student, uploads attachments.

2) Optional: `POST /api/courses/:courseId/assessments/:assessmentId/submissions/bulk` (TEACHER)
- for scanning a pile of papers quickly.

> Alternative approach
> - Instead of creating a “submission” immediately, create a **Scan Job** entity and later attach OCR results to a submission.

### 4.3 OCR pipeline readiness (future service integration)

Given the context “scan PDF → OCR → structured question/answer JSON → grading pipeline”, the backend will likely need a durable job/artifact model.

**Missing (proposed) scan/OCR endpoints:**
- `POST /api/courses/:courseId/assessments/:assessmentId/scan-jobs` (TEACHER)
  - multipart: `file` (pdf) + `student_id` + metadata (pages, capture device, etc.)
  - response: `{ scan_job }` with status `QUEUED`
- `GET /api/scan-jobs/:scanJobId` (TEACHER)
  - response: `{ scan_job, status, error?, structured_json?, raw_text? }`
- `POST /api/scan-jobs/:scanJobId/retry` (TEACHER)

This can be implemented initially as “store PDF + mark status”, then later wire to the OCR service in the monorepo.

---

## 5) Phase-by-phase integration plan (backend ↔ checkmate-app)

### Phase 1 — Auth + HTTP foundation (unblock everything)
**Goal:** mobile can authenticate the same way as web and call backend reliably.

1. Add Supabase client to `checkmate-app/` (env config via Expo)
2. Replace `authService.login/register/refresh/logout` usage:
   - Login screen uses `supabase.auth.signInWithPassword`
   - Logout uses `supabase.auth.signOut`
3. Replace axios interceptor token source:
   - attach Supabase access token every request
4. Update `/api/auth/me` client parsing to backend response `{ user }`
5. Remove refresh-token storage paths / logic (or leave storage but stop using refresh)

**Exit criteria:**
- Login works
- `GET /api/auth/me` works from mobile
- Any simple backend call works with JWT

### Phase 2 — Courses parity (teacher)
**Goal:** teacher can list courses and open course details using backend shapes.

1. Update mobile course types to backend: `id,title,description,code,teacher_id,...`
2. Replace `courseService.getCourses()` with:
   - `GET /api/courses/my-courses` for teacher
3. Update `ViewCoursesScreen` to render backend response
4. Update `ViewCourseScreen` to consume `course` object from `/my-courses` (includes students + announcements)

**Exit criteria:**
- Teacher sees course list and course detail without endpoint mismatches.

### Phase 3 — Announcements + assessment list via announcements
**Goal:** mirror web pattern: assessments are derived from announcements.

1. Make `GET /api/courses/:courseId/announcements` the single source for:
   - announcement feed
   - comments
   - assessment cards (flatten assessments from announcements)
2. Update announcement create to send multipart with `{ title, description, files[] }`
3. Add comments UI (add/delete) as needed

**Exit criteria:**
- Teacher can post announcements, attach resources, see signed URLs.
- Teacher can see assessments list (flattened) like web.

### Phase 4 — Assessment detail + grading (teacher portal)
**Goal:** implement the teacher assessment portal on mobile.

1. Replace mobile assessment detail calls with:
   - `GET /api/courses/:courseId/assessments/:assessmentId`
2. Build screens to show:
   - submitted
   - late
   - not_submitted
3. Add submission detail screen:
   - `GET /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId`
4. Add grading screen:
   - `PATCH /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade`

**Exit criteria:**
- Teacher can inspect and grade submissions from mobile.

### Phase 5 — Attendance (teacher)
**Goal:** add full attendance parity with web.

1. Create attendance screens:
   - Mark attendance session (title+date)
   - History list
   - Edit session
2. Wire to:
   - `POST /api/courses/:courseId/attendance`
   - `GET /api/courses/:courseId/attendance`
   - `DELETE /api/courses/:courseId/attendance/:sessionId`

**Exit criteria:**
- Teacher can create/edit/delete attendance sessions and view history.

### Phase 6 — Teacher scan pipeline (bridge to future OCR)
**Goal:** support teacher scanning workflow without compromising backend model.

Decision point (choose one):

**Option A (closest to current mobile UX):** Teacher-created submissions
- Implement new backend endpoint:
  - `POST /api/courses/:courseId/assessments/:assessmentId/submissions` (TEACHER)
- Mobile uploads scanned PDF as submission attachments for a specific `student_id`.

**Option B (better OCR-first design):** Scan Jobs (artifact + async processing)
- Add backend tables + endpoints for scan jobs.
- Mobile uploads scan PDF → gets `scanJobId`.
- OCR service later processes and writes structured JSON.
- Submission/grading pipeline consumes that JSON.

**Exit criteria:**
- Teacher can scan and upload a PDF and see it tracked server-side.
- The system has a clear integration point for the OCR microservice.

---

## 6) Immediate implementation checklist (what to change first in checkmate-app)

- Replace `checkmate-app/services/api/types.ts` with backend-aligned DTOs:
  - `CourseDTO`, `AnnouncementDTO`, `AssessmentDTO`, `AttendanceSessionDTO`, etc.
- Update `courseService.ts` to call:
  - `/api/courses/my-courses`
  - `/api/courses/:courseId/announcements`
- Remove `assessmentService.getAssessmentsByCourse()` and instead derive assessments from announcements.
- Update `assessmentService.getAssessmentById()` to require `(courseId, assessmentId)` and call nested endpoint.
- Replace any JSON file upload logic with multipart `FormData` uploads.

---

## 7) Known broken/invalid parts in the current mobile app (must be addressed during phases)

- `studentService` lacks `getAllStudents()` and `getStudentById()` but screens call them.
- `apiTestUtils.testConnection()` calls `/` but backend health is `GET /api`.
- Mobile assumes mongo-style `_id` and different field names (`content`, `priority`, `dueDate` vs `due_date`).
- Mobile auth assumes refresh tokens and non-existent auth endpoints.
