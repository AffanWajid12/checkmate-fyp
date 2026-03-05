# Assessment Portal & Submission Implementation Plan

## Repository Analysis

**What already exists (from prior implementation):**

| File | Relevance |
|---|---|
| `prisma/schema.prisma` | Has `assessments`, `source_materials`, `submissions`, `attachments` models |
| `src/controllers/courseController.js` | Teacher + student course logic; `getCourseAnnouncements` includes `assessments` |
| `src/routes/courseRoutes.js` | Fully registered course routes |
| `src/config/supabaseClient.js` | `createClient(SUPABASE_URL, SUPABASE_SERVER_KEY)` — service-role client, bypasses RLS |
| `src/middleware/authMiddleware.js` | `verifyUser` (attaches `req.user`) + `verifyUserType(role)` guards |

**Schema gap analysis:**

| Model | Gap |
|---|---|
| `assessments` | No `title`, no `instructions`, no `due_date` — impossible to render an assessment portal without these |
| `source_materials` | Has `announcement_id` FK — but materials for an assessment belong to the assessment itself, not the announcement |
| `submissions` | No `status` (on-time / late), no `submitted_at`, no `grade`, no `feedback` |
| `SubmissionStatus` | Enum does not exist yet |

**Supabase Storage findings (from research):**

- The backend `supabaseClient.js` uses the **service role key** (`SUPABASE_SERVER_KEY`), which fully bypasses RLS — all Storage operations run from the backend are trusted.
- Files are uploaded via `supabase.storage.from(bucket).upload(path, fileBuffer, { contentType })`.
- Buckets must be **private** — files are never accessible via a public URL.
- To serve a file, the backend generates a **signed URL** via `supabase.storage.from(bucket).createSignedUrl(path, expirySeconds)` and returns it to the client. The URL is time-limited (recommended: 3600 seconds / 1 hour).
- The `upload()` call returns `{ data: { path } }` — this `path` is what must be persisted in the database as `bucket_path`.
- `multer` (with `memoryStorage`) is the standard approach for receiving multipart file uploads in Express and passing the buffer to Supabase.

---

## Supabase Storage Bucket Design

Two private buckets must be created in the Supabase Dashboard before running this implementation:

| Bucket Name | Purpose | Who Uploads |
|---|---|---|
| `source-materials` | Assessment statement documents uploaded by teachers | Backend (service role) |
| `submission-files` | Student work files uploaded per submission | Backend (service role) |

**Path conventions (stored in `bucket_path` column):**

```
source-materials/
  └── {assessmentId}/{uuid}-{originalFilename}
        e.g. source-materials/abc-123/f9d2-assignment1.pdf

submission-files/
  └── {assessmentId}/{userId}/{uuid}-{originalFilename}
        e.g. submission-files/abc-123/usr-456/8a3b-report.docx
```

Using the `assessmentId` as the top-level folder makes it trivial to delete all files for an assessment if it is removed.

---

## Step 1 — Schema Changes (Prisma Migration)

### 1a. Add `SubmissionStatus` enum

```prisma
enum SubmissionStatus {
  SUBMITTED
  LATE
  GRADED

  @@schema("public")
}
```

**Rationale:** Needed to bucket students on the teacher's assessment portal into submitted on-time, submitted late (after `due_date`), and graded.

---

### 1b. Extend the `assessments` model

```prisma
model assessments {
  id              String         @id @db.Uuid @default(uuid())
  title           String                            // human-readable name, e.g. "Assignment 1"
  instructions    String?                           // optional rich-text brief for students
  type            AssessmentType @default(QUIZ)
  due_date        DateTime?                         // nullable — null means no deadline
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  announcement_id  String        @db.Uuid
  announcement     announcements @relation("AnnouncementAssessments", fields: [announcement_id], references: [id], onDelete: Cascade)

  submissions      submissions[]    @relation("AssessmentSubmissions")
  source_materials source_materials[] @relation("AssessmentSourceMaterials")

  @@map("assessments")
  @@schema("public")
}
```

**New fields:**
- `title` — required; displayed in the assessment card and portal heading.
- `instructions` — optional body text rendered as the assignment brief.
- `due_date` — optional `DateTime`; `null` means no deadline. Used by the backend to auto-compute `SUBMITTED` vs `LATE` status at the point of student submission.

---

### 1c. Update `source_materials` — move FK from `announcements` to `assessments`

```prisma
model source_materials {
  id              String      @id @db.Uuid @default(uuid())
  bucket_path     String      // path inside the "source-materials" Supabase bucket
  file_name       String      // original filename shown in the UI
  file_size       Int         // bytes
  mime_type       String      // e.g. "application/pdf", "image/png"
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt @default(now())

  assessment_id   String      @db.Uuid
  assessment      assessments @relation("AssessmentSourceMaterials", fields: [assessment_id], references: [id], onDelete: Cascade)

  @@map("source_materials")
  @@schema("public")
}
```

**Rationale:** Source materials (PDFs, rubrics, problem statements) are documents belonging to a specific **assessment**, not to the parent announcement. Moving the FK here makes retrieval clean — a single `include: { source_materials: true }` on `assessments` fetches all teacher-uploaded documents. The old `announcement_id` FK on `source_materials` is removed, and the `sourceMaterials` relation on `announcements` is also removed.

> ⚠️ **Migration note:** The existing `source_materials` table currently has `announcement_id` as a NOT NULL FK. The migration must `DROP CONSTRAINT`, `DROP COLUMN announcement_id`, and `ADD COLUMN assessment_id UUID NOT NULL`. If there is existing data, a data migration step is required.

---

### 1d. Extend the `submissions` model

```prisma
model submissions {
  id            String           @id @db.Uuid @default(uuid())
  status        SubmissionStatus @default(SUBMITTED)  // computed at submit time vs due_date
  submitted_at  DateTime         @default(now())       // explicit timestamp for lateness checks
  grade         Float?                                 // optional numeric grade (0–100)
  feedback      String?                                // optional teacher comment
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt @default(now())

  user_id       String @db.Uuid
  user          users  @relation("UserSubmissions", fields: [user_id], references: [id], onDelete: Cascade)

  assessment_id String @db.Uuid
  assessment    assessments @relation("AssessmentSubmissions", fields: [assessment_id], references: [id], onDelete: Cascade)

  attachments   attachments[] @relation("SubmissionAttachments")

  @@unique([user_id, assessment_id])
  @@map("submissions")
  @@schema("public")
}
```

**New fields:**
- `status` — set by the backend at submission time by comparing `submitted_at` against `assessment.due_date`. If `due_date` is null or `submitted_at <= due_date`, status is `SUBMITTED`; otherwise `LATE`.
- `submitted_at` — dedicated timestamp separate from `createdAt` for reliable lateness computation.
- `grade` — set by the teacher when reviewing a submission. Nullable until graded.
- `feedback` — free-text teacher feedback. Nullable.

---

### 1e. Remove `sourceMaterials` relation from `announcements`

```prisma
model announcements {
  // ...existing fields unchanged...

  assessments     assessments[]    @relation("AnnouncementAssessments")
  // sourceMaterials source_materials[] @relation("AnnouncementSourceMaterials")  ← REMOVED

  @@map("announcements")
  @@schema("public")
}
```

---

### After schema changes, run:

```powershell
npx prisma migrate dev --name add_assessment_portal_and_submission_fields
npx prisma generate
```

---

## Step 2 — Install `multer` (file upload middleware)

`multer` receives `multipart/form-data` from the client and makes the file buffer available at `req.file` or `req.files`. Using `memoryStorage()` keeps the file in-memory as a `Buffer` ready to pass directly to Supabase Storage — no temp files on disk.

```powershell
npm install multer
```

**Create `src/middleware/uploadMiddleware.js`:**

```js
import multer from "multer";

// Keep file in memory as Buffer — passed directly to Supabase Storage
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type"), false);
    }
};

// Single file upload — used for one file at a time
export const uploadSingle = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
}).single("file");

// Multiple file upload — used when posting an assessment with multiple attachments
export const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
}).array("files", 10); // max 10 files at once
```

---

## Step 3 — New and Modified Controller Functions

Add the following to `src/controllers/courseController.js`. The existing helper functions (`verifyCourseOwner`, `verifyStudentEnrolled`, `handleError`) are reused without modification.

Also add this import at the top of `courseController.js`:

```js
import supabase from "../config/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
```

> **Note:** `uuid` is available via `@supabase/supabase-js` transitive dependency; alternatively install with `npm install uuid`.

---

### New Helper — `generateSignedUrl`

Used internally by any function that needs to serve a private file.

```js
// Returns a signed URL valid for 1 hour for a file in a private bucket.
// Throws on Supabase error so the caller's handleError catches it.
const generateSignedUrl = async (bucket, path) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 3600 seconds = 1 hour
    if (error) throw { status: 500, message: `Storage error: ${error.message}` };
    return data.signedUrl;
};
```

---

### 3A. `addAssessment` — TEACHER

**Route:** `POST /api/courses/:courseId/announcements/:announcementId/assessments`

**Purpose:** Creates an assessment linked to an announcement. Accepts optional file uploads (assessment source materials — PDFs, docs, images) and stores them in the `source-materials` private bucket.

**Receives:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | Assessment name |
| `type` | `QUIZ` \| `ASSIGNMENT` \| `EXAM` | ✅ | Assessment type |
| `instructions` | string | ❌ | Assignment brief / body text |
| `due_date` | string (ISO 8601) | ❌ | e.g. `"2026-04-01T23:59:00.000Z"` |
| `files` | file[] | ❌ | Up to 10 files, max 20MB each |

**Implementation detail:**

```
1. Verify req.user owns the course via verifyCourseOwner(courseId, req.user.id)
2. Find the announcement: prisma.announcements.findUnique({ where: { id: announcementId } })
   → 404 if not found
   → 403 if announcement.course_id !== courseId (belongs to a different course)
3. Validate required fields: title and type must be present → 400
4. prisma.assessments.create({
     data: {
       title,
       instructions: instructions ?? null,
       type,
       due_date: due_date ? new Date(due_date) : null,
       announcement_id: announcementId,
     }
   }) → save as `assessment`

5. If req.files exists and req.files.length > 0:
   For each file in req.files:
     a. Build storage path:
          path = `${assessment.id}/${uuidv4()}-${file.originalname}`
     b. Upload to Supabase Storage:
          supabase.storage
            .from("source-materials")
            .upload(path, file.buffer, { contentType: file.mimetype })
        → if upload error: log and skip (do not abort the whole request)
     c. prisma.source_materials.create({
          data: {
            bucket_path: path,
            file_name: file.originalname,
            file_size: file.size,
            mime_type: file.mimetype,
            assessment_id: assessment.id,
          }
        })

6. Fetch the created assessment with source_materials included:
     prisma.assessments.findUnique({
       where: { id: assessment.id },
       include: { source_materials: true }
     })

7. Return 201 { message: "Assessment created successfully", assessment }
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | `"title and type are required"` |
| `403` | `"Forbidden"` — teacher does not own course |
| `403` | `"Announcement does not belong to this course"` |
| `404` | `"Announcement not found"` |
| `415` | `"Unsupported file type"` — caught from multer fileFilter |

---

### 3B. `getAssessmentDetails` — TEACHER + STUDENT (shared)

**Route:** `GET /api/courses/:courseId/assessments/:assessmentId`

**Purpose:**
- **Teacher view:** Returns assessment + all source materials (with signed URLs) + full submission list (submitted students, not-submitted students, late students).
- **Student view:** Returns assessment + source materials (with signed URLs) + the calling student's own submission (if any).

**Implementation detail:**

```
1. Fetch the assessment:
     prisma.assessments.findUnique({
       where: { id: assessmentId },
       include: {
         announcement: true,
         source_materials: true,
         submissions: {
           include: { user: true, attachments: true }
         }
       }
     })
   → 404 if not found

2. Verify the assessment belongs to the given course:
     assessment.announcement.course_id === courseId → 403 if mismatch

3. Role-based access check:
   - TEACHER: verifyCourseOwner(courseId, req.user.id)
   - STUDENT: verifyStudentEnrolled(courseId, req.user.id)

4. Generate signed URLs for each source_material:
     For each sm in assessment.source_materials:
       sm.signed_url = await generateSignedUrl("source-materials", sm.bucket_path)

5. If req.user.role === "TEACHER":
   a. Collect all enrolled students for the course:
        prisma.enrollments.findMany({
          where: { course_id: courseId },
          include: { student: true }
        })
   b. Build three lists:
        - submitted:     students whose user_id appears in submissions with status SUBMITTED
        - late:          students whose user_id appears in submissions with status LATE
        - not_submitted: enrolled students with no submission record at all
   c. For each submission in submitted + late:
        Generate signed URLs for each attachment:
          attachment.signed_url = await generateSignedUrl("submission-files", attachment.bucket_path)
   d. Return 200 {
        message: "Assessment retrieved successfully",
        assessment: { ...assessment fields, source_materials (with signed_url), due_date },
        submitted,
        late,
        not_submitted
      }

6. If req.user.role === "STUDENT":
   a. Find only this student's submission:
        const mySubmission = assessment.submissions.find(s => s.user_id === req.user.id) ?? null
   b. If mySubmission exists: generate signed URLs for each attachment
   c. Return 200 {
        message: "Assessment retrieved successfully",
        assessment: { ...assessment fields, source_materials (with signed_url), due_date },
        my_submission: mySubmission  // null if not yet submitted
      }
```

**Error Responses:**

| Status | Message |
|---|---|
| `403` | `"Forbidden"` — teacher does not own course |
| `403` | `"Not enrolled in this course"` — student |
| `403` | `"Assessment does not belong to this course"` |
| `404` | `"Assessment not found"` |

---

### 3C. `submitAssessment` — STUDENT

**Route:** `POST /api/courses/:courseId/assessments/:assessmentId/submit`

**Purpose:** Student submits work for an assessment. Accepts file uploads (stored in the `submission-files` private bucket). A student may also submit with no files (mark as done). The backend computes `SUBMITTED` vs `LATE` status automatically by comparing the current timestamp against `assessment.due_date`.

**Receives:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `files` | file[] | ❌ | 0–10 files; absence means "mark as done" |

**Implementation detail:**

```
1. verifyStudentEnrolled(courseId, req.user.id) → 403 if not enrolled

2. Fetch the assessment:
     prisma.assessments.findUnique({ where: { id: assessmentId }, include: { announcement: true } })
   → 404 if not found
   → 403 if assessment.announcement.course_id !== courseId

3. Check for an existing submission (@@unique [user_id, assessment_id]):
     prisma.submissions.findUnique({
       where: { user_id_assessment_id: { user_id: req.user.id, assessment_id: assessmentId } }
     })
   → 409 "Already submitted" if found
   (re-submission / update is handled by a separate PATCH route — see 3D)

4. Compute submission status:
     const now = new Date()
     const status = (!assessment.due_date || now <= assessment.due_date) ? "SUBMITTED" : "LATE"

5. Create the submission record:
     const submission = await prisma.submissions.create({
       data: {
         user_id: req.user.id,
         assessment_id: assessmentId,
         status,
         submitted_at: now,
       }
     })

6. If req.files exists and req.files.length > 0:
   For each file in req.files:
     a. Build storage path:
          path = `${assessmentId}/${req.user.id}/${uuidv4()}-${file.originalname}`
     b. Upload to Supabase Storage:
          supabase.storage
            .from("submission-files")
            .upload(path, file.buffer, { contentType: file.mimetype })
        → if upload error: log and continue (skip failed file; do not abort)
     c. prisma.attachments.create({
          data: {
            bucket_path: path,
            file_name: file.originalname,
            file_size: file.size,
            mime_type: file.mimetype,
            submission_id: submission.id,
          }
        })

7. Fetch the complete submission with attachments:
     prisma.submissions.findUnique({
       where: { id: submission.id },
       include: { attachments: true }
     })

8. Return 201 { message: "Submitted successfully", submission }
```

**Error Responses:**

| Status | Message |
|---|---|
| `403` | `"Not enrolled in this course"` |
| `403` | `"Assessment does not belong to this course"` |
| `404` | `"Assessment not found"` |
| `409` | `"Already submitted"` — use PATCH to update |
| `415` | `"Unsupported file type"` |

---

### 3D. `updateSubmission` — STUDENT

**Route:** `PATCH /api/courses/:courseId/assessments/:assessmentId/submit`

**Purpose:** Allows a student to add more files to an existing submission before the deadline. Cannot re-open a submission after grading.

**Receives:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `files` | file[] | ✅ | At least one new file |

**Implementation detail:**

```
1. verifyStudentEnrolled(courseId, req.user.id)

2. Fetch assessment (same checks as 3C steps 2)

3. Find the existing submission:
     prisma.submissions.findUnique({
       where: { user_id_assessment_id: { user_id: req.user.id, assessment_id: assessmentId } }
     })
   → 404 "No submission found" if does not exist (student must POST first)
   → 403 "Submission already graded" if submission.status === "GRADED"

4. For each file in req.files:
   a. Build storage path:
        path = `${assessmentId}/${req.user.id}/${uuidv4()}-${file.originalname}`
   b. Upload to Supabase:
        supabase.storage.from("submission-files").upload(path, file.buffer, { contentType: file.mimetype })
   c. prisma.attachments.create({ data: { bucket_path: path, file_name, file_size, mime_type, submission_id: submission.id } })

5. Update submission.updatedAt:
     prisma.submissions.update({ where: { id: submission.id }, data: {} })
     (touching updatedAt is sufficient; Prisma @updatedAt handles the timestamp)

6. Return 200 { message: "Submission updated successfully", submission (with attachments) }
```

---

### 3E. `gradeSubmission` — TEACHER

**Route:** `PATCH /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade`

**Purpose:** Teacher sets a numeric grade and optional feedback on a student's submission. Also transitions `status` to `GRADED`.

**Receives:** `application/json`

| Field | Type | Required | Notes |
|---|---|---|---|
| `grade` | number (0–100) | ✅ | Numeric score |
| `feedback` | string | ❌ | Optional free-text comment |

**Implementation detail:**

```
1. verifyCourseOwner(courseId, req.user.id) → 403 if not owner

2. Validate: grade must be a number between 0 and 100 → 400

3. Fetch the submission:
     prisma.submissions.findUnique({ where: { id: submissionId }, include: { assessment: { include: { announcement: true } } } })
   → 404 if not found
   → 403 if submission.assessment.announcement.course_id !== courseId

4. Update:
     prisma.submissions.update({
       where: { id: submissionId },
       data: { grade, feedback: feedback ?? null, status: "GRADED" }
     })

5. Return 200 { message: "Submission graded successfully", submission }
```

**Error Responses:**

| Status | Message |
|---|---|
| `400` | `"grade is required and must be between 0 and 100"` |
| `403` | `"Forbidden"` — not course owner |
| `403` | `"Submission does not belong to this course"` |
| `404` | `"Submission not found"` |

---

### 3F. `getSubmissionDetails` — TEACHER

**Route:** `GET /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId`

**Purpose:** Teacher clicks on a specific student's submission to see all uploaded files and metadata. Returns attachment records with signed URLs.

**Implementation detail:**

```
1. verifyCourseOwner(courseId, req.user.id)

2. Fetch submission with user and attachments:
     prisma.submissions.findUnique({
       where: { id: submissionId },
       include: {
         user: true,
         attachments: true,
         assessment: { include: { announcement: true } }
       }
     })
   → 404 if not found
   → 403 if submission.assessment.announcement.course_id !== courseId

3. For each attachment:
     attachment.signed_url = await generateSignedUrl("submission-files", attachment.bucket_path)

4. Return 200 { message: "Submission retrieved successfully", submission }
```

---

### 3G. `deleteSourceMaterial` — TEACHER

**Route:** `DELETE /api/courses/:courseId/assessments/:assessmentId/source-materials/:materialId`

**Purpose:** Teacher removes an uploaded source material file from both Supabase Storage and the database.

**Implementation detail:**

```
1. verifyCourseOwner(courseId, req.user.id)

2. Fetch source material:
     prisma.source_materials.findUnique({ where: { id: materialId }, include: { assessment: { include: { announcement: true } } } })
   → 404 if not found
   → 403 if assessment.announcement.course_id !== courseId
   → 403 if source_material.assessment_id !== assessmentId

3. Delete from Supabase Storage:
     supabase.storage.from("source-materials").remove([source_material.bucket_path])
   → log error but continue if storage deletion fails (DB record must still be removed)

4. prisma.source_materials.delete({ where: { id: materialId } })

5. Return 200 { message: "Source material deleted successfully" }
```

---

### 3H. Modify `getCourseAnnouncements` — TEACHER + STUDENT (existing function)

**Current behaviour:** Includes `assessments` array on each announcement.

**Required change:** Also include `source_materials` nested inside each assessment, so the client can display material counts and types without a separate request.

```
Change the Prisma include from:
  include: { assessments: true }

To:
  include: {
    assessments: {
      include: { source_materials: true }
    }
  }
```

> **Note:** Do not generate signed URLs here — signed URL generation is done lazily in `getAssessmentDetails` when the user actually opens an assessment. Generating them for every announcement on page load would be expensive.

---

## Step 4 — Route Changes in `courseRoutes.js`

```
─── New imports ─────────────────────────────────────────────────────────────
import { uploadMultiple, uploadSingle } from "../middleware/uploadMiddleware.js";
import {
    // ...existing imports...
    addAssessment,
    getAssessmentDetails,
    submitAssessment,
    updateSubmission,
    gradeSubmission,
    getSubmissionDetails,
    deleteSourceMaterial,
} from "../controllers/courseController.js";

─── New Teacher Routes ───────────────────────────────────────────────────────

POST   /api/courses/:courseId/announcements/:announcementId/assessments
       → verifyUser, verifyUserType("TEACHER"), uploadMultiple, addAssessment

GET    /api/courses/:courseId/assessments/:assessmentId
       → verifyUser, getAssessmentDetails              ← role checked internally

PATCH  /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade
       → verifyUser, verifyUserType("TEACHER"), gradeSubmission

GET    /api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId
       → verifyUser, verifyUserType("TEACHER"), getSubmissionDetails

DELETE /api/courses/:courseId/assessments/:assessmentId/source-materials/:materialId
       → verifyUser, verifyUserType("TEACHER"), deleteSourceMaterial

─── New Student Routes ───────────────────────────────────────────────────────

POST   /api/courses/:courseId/assessments/:assessmentId/submit
       → verifyUser, verifyUserType("STUDENT"), uploadMultiple, submitAssessment

PATCH  /api/courses/:courseId/assessments/:assessmentId/submit
       → verifyUser, verifyUserType("STUDENT"), uploadMultiple, updateSubmission
```

**Full updated route table:**

| Method | Route | Role | Handler |
|---|---|---|---|
| `POST` | `/api/courses` | 🎓 TEACHER | `createCourse` |
| `GET` | `/api/courses/my-courses` | 🎓 TEACHER | `getTeacherCourses` |
| `POST` | `/api/courses/:courseId/announcements` | 🎓 TEACHER | `addAnnouncement` |
| `POST` | `/api/courses/:courseId/announcements/:announcementId/assessments` | 🎓 TEACHER | `addAssessment` |
| `GET` | `/api/courses/:courseId/assessments/:assessmentId` | 🔓 BOTH | `getAssessmentDetails` |
| `DELETE` | `/api/courses/:courseId/assessments/:assessmentId/source-materials/:materialId` | 🎓 TEACHER | `deleteSourceMaterial` |
| `PATCH` | `/api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId/grade` | 🎓 TEACHER | `gradeSubmission` |
| `GET` | `/api/courses/:courseId/assessments/:assessmentId/submissions/:submissionId` | 🎓 TEACHER | `getSubmissionDetails` |
| `POST` | `/api/courses/:courseId/attendance` | 🎓 TEACHER | `markAttendance` |
| `GET` | `/api/courses/:courseId/attendance` | 🎓 TEACHER | `getCourseAttendance` |
| `POST` | `/api/courses/enroll` | 🧑‍🎓 STUDENT | `enrollInCourse` |
| `GET` | `/api/courses/enrolled` | 🧑‍🎓 STUDENT | `getEnrolledCourses` |
| `GET` | `/api/courses/:courseId/my-attendance` | 🧑‍🎓 STUDENT | `getStudentAttendance` |
| `POST` | `/api/courses/:courseId/assessments/:assessmentId/submit` | 🧑‍🎓 STUDENT | `submitAssessment` |
| `PATCH` | `/api/courses/:courseId/assessments/:assessmentId/submit` | 🧑‍🎓 STUDENT | `updateSubmission` |
| `GET` | `/api/courses/:courseId/announcements` | 🔓 BOTH | `getCourseAnnouncements` |

---

## Step 5 — Private Storage Logic Reference

This section documents the exact Supabase Storage calls used across the controller, for consistency.

### Uploading a file (used in `addAssessment`, `submitAssessment`, `updateSubmission`)

```js
const path = `${assessmentId}/${uuidv4()}-${file.originalname}`;

const { data, error } = await supabase.storage
    .from("source-materials")          // or "submission-files"
    .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,                 // never silently overwrite; paths include uuid
    });

if (error) {
    console.error("Storage upload failed:", error.message);
    // skip this file — do not abort the request
}
// persist: data.path (same as `path` above) → bucket_path column
```

### Generating a signed URL for serving (used in `getAssessmentDetails`, `getSubmissionDetails`)

```js
const { data, error } = await supabase.storage
    .from("source-materials")          // or "submission-files"
    .createSignedUrl(bucket_path, 3600); // 1 hour

if (error) throw { status: 500, message: `Storage error: ${error.message}` };

// Return data.signedUrl to the client — it is temporary and must not be cached
```

### Deleting a file (used in `deleteSourceMaterial`)

```js
const { error } = await supabase.storage
    .from("source-materials")
    .remove([bucket_path]);            // array of paths

if (error) console.error("Storage delete failed:", error.message);
// proceed to delete DB record regardless
```

### Why the service-role key is sufficient for all Storage operations

`supabaseClient.js` initialises the client with `SUPABASE_SERVER_KEY` (the service role key), which operates outside RLS policies entirely. All uploads, downloads, and deletions run from within Express routes — no file ever touches the client directly. The frontend never receives raw bucket paths; it only receives time-limited signed URLs generated server-side.

---

## Step 6 — Summary of Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `prisma/schema.prisma` | **Modify** | Add `SubmissionStatus` enum; extend `assessments` (title, instructions, due_date, source_materials relation); move `source_materials` FK to `assessment_id`; extend `submissions` (status, submitted_at, grade, feedback); remove `sourceMaterials` relation from `announcements` |
| `prisma/migrations/...` | **Auto-generated** | `npx prisma migrate dev --name add_assessment_portal_and_submission_fields` |
| `src/middleware/uploadMiddleware.js` | **Create** | `multer` memory-storage middleware; `uploadSingle` and `uploadMultiple` exports |
| `src/controllers/courseController.js` | **Modify** | Add `supabase` + `uuid` imports; add `generateSignedUrl` helper; add `addAssessment`, `getAssessmentDetails`, `submitAssessment`, `updateSubmission`, `gradeSubmission`, `getSubmissionDetails`, `deleteSourceMaterial`; update `getCourseAnnouncements` include |
| `src/routes/courseRoutes.js` | **Modify** | Import `uploadMiddleware`; register all 7 new routes |
