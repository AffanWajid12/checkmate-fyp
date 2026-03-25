# Submission Feature - Quick Reference

## 🎯 Quick Access

**Location:** Assessment Detail Screen → "Add Submission" FAB button
**Purpose:** Create student submissions for assessments
**API:** `/api/assessments/:assessmentId/submissions`

---

## 📋 Workflow

```
Assessment Detail → Add Submission Button
   ↓
Select Student (dropdown)
   ↓
Attach File OR Scan Document
   ↓
Add Notes (optional)
   ↓
Submit → Success → Back to Assessment
```

---

## 🔧 Key Components

### SubmissionService
```typescript
import { submissionService } from '@/services/api';

// Create submission
await submissionService.createSubmission(assessmentId, {
  studentId: 'id',
  files: [...],
  notes: 'optional'
});
```

### AddSubmissionScreen
```typescript
navigation.navigate('AddSubmission', {
  assessmentId: string,
  assessmentTitle: string,
  courseId: string
});
```

---

## ✅ Validation Rules

| Field | Required | Rules |
|-------|----------|-------|
| Student | ✅ Yes | Must be enrolled in course |
| Files | ✅ Yes | At least 1 file |
| Notes | ❌ No | Max 1000 characters |

---

## 📁 File Options

**1. Attach File:**
- Opens file picker
- All file types
- Single file per action

**2. Scan Document:**
- Opens camera scanner
- Max 10 pages
- Auto-converts to PDF

---

## 🎨 UI Elements

- **Student Dropdown:** Picker with enrolled students
- **Attach File Button:** Blue outlined button with attach icon
- **Scan Document Button:** Blue outlined button with camera icon
- **File List:** Shows all attached files with remove option
- **Notes Field:** Multiline text input
- **Submit Button:** Green button (disabled if invalid)

---

## 🚨 Error Messages

| Error | Message |
|-------|---------|
| No student | "Please select a student" |
| No files | "Please attach at least one file" |
| API error | Shows actual error from server |
| Scanner error | "Failed to open document scanner..." |

---

## 📦 Dependencies

```bash
@react-native-picker/picker
expo-document-picker
react-native-document-scanner-plugin
```

---

## 🧪 Quick Test

1. Go to any assessment
2. Click "Add Submission"
3. Select a student
4. Click "Scan Document"
5. Scan 1 page
6. Click "Submit"
7. Verify success message

---

## 📝 Code Snippets

### Navigate to Add Submission
```typescript
navigation.navigate('AddSubmission', {
  assessmentId: assessment._id,
  assessmentTitle: assessment.title,
  courseId: assessment.course._id,
});
```

### Create Submission
```typescript
const submission = await submissionService.createSubmission(
  assessmentId,
  {
    studentId: selectedStudentId,
    files: attachedFiles,
    notes: notesText || undefined
  }
);
```

---

## 🔗 Related Files

- `services/api/submissionService.ts`
- `components/courses/AddSubmissionScreen.tsx`
- `components/courses/ViewAssessmentDetailScreen.tsx`
- `navigation/types.ts` (AddSubmission route)
- `api-reference/SUBMISSION_API.md`

---

## 📊 API Endpoints (All Implemented)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/assessments/:id/submissions` | Create submission |
| GET | `/api/assessments/:id/submissions` | Get all submissions |
| GET | `/api/submissions/:id` | Get one submission |
| PATCH | `/api/submissions/:id` | Update submission |
| POST | `/api/submissions/:id/grade` | Grade submission |
| DELETE | `/api/submissions/:id` | Delete submission |
| POST | `/api/assessments/:id/submissions/bulk` | Bulk create |

---

## ✨ Features

- ✅ Student selection from enrolled list
- ✅ Multiple file attachment
- ✅ Document scanning (camera)
- ✅ File preview with icons
- ✅ File removal
- ✅ Optional notes
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling
- ✅ Success feedback

---

**Last Updated:** December 11, 2025
