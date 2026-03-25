# Assessment API Integration - Complete Guide

## ✅ What Was Implemented

### 1. **Assessment Service API** (`services/api/assessmentService.ts`)
Complete TypeScript service for all assessment operations:

#### Available Methods:
- ✅ `getAssessmentsByCourse(courseId, params?)` - Get all assessments for a course
- ✅ `getAssessmentById(assessmentId)` - Get detailed assessment information
- ✅ `createAssessment(courseId, data)` - Create a new assessment
- ✅ `updateAssessment(assessmentId, data)` - Update assessment details
- ✅ `deleteAssessment(assessmentId)` - Soft delete an assessment
- ✅ `getAssessmentsByStatus(courseId, status)` - Filter by status
- ✅ `getAssessmentsByType(courseId, type)` - Filter by type
- ✅ `getUpcomingAssessments(courseId)` - Get upcoming assessments
- ✅ `getActiveAssessments(courseId)` - Get active assessments
- ✅ `getGradedAssessments(courseId)` - Get graded assessments

#### Helper Methods:
- ✅ `getTimeRemaining(dueDate)` - Calculate time remaining
- ✅ `formatDueDate(dueDate)` - Format date for display

**Features:**
- 📊 Comprehensive logging with emojis
- 🔒 Automatic token management
- ⚡ Full TypeScript type safety
- 🎯 Error handling built-in
- ⏰ Time calculation utilities

---

### 2. **TypeScript Types** (`services/api/types.ts`)

#### Core Types Added:
```typescript
type AssessmentType = 'exam' | 'quiz' | 'homework' | 'project' | 'assignment';
type AssessmentStatus = 'upcoming' | 'active' | 'graded';

interface AssessmentListItem {
  _id: string;
  course: string;
  title: string;
  type: AssessmentType;
  description?: string;
  totalPoints: number;
  dueDate: string; // ISO 8601
  status: AssessmentStatus;
  submissionCount: number;
  totalStudents: number;
  gradedCount: number;
  notGradedCount: number;
  avgGrade?: number;
  createdBy: { _id, firstName, lastName };
  createdAt: string;
  updatedAt: string;
}

interface Assessment {
  // Full detailed assessment with course info
  course: { _id, code, title };
  submissionStats: {
    submitted: number;
    notSubmitted: number;
    graded: number;
    notGraded: number;
    totalStudents: number;
  };
  recentSubmissions: RecentSubmission[];
  // ... plus all AssessmentListItem fields
}

interface GetAssessmentsResponse {
  assessments: AssessmentListItem[];
  stats: {
    totalAssessments: number;
    activeAssessments: number;
    upcomingAssessments: number;
    completedAssessments: number;
  };
}
```

---

### 3. **ViewAssessmentsScreen Integration** ✅

**Features Implemented:**
- ✅ Fetches assessments from API on screen focus
- ✅ Pull-to-refresh functionality
- ✅ Loading states with spinner
- ✅ Empty state when no assessments
- ✅ Stats cards showing totals
- ✅ Status indicators (upcoming/active/graded)
- ✅ Time remaining display
- ✅ Submission progress tracking
- ✅ Average grade display for graded assessments

**UI Components:**

**Stats Header:**
```
┌─────┬─────────┬────────┬────────┐
│  8  │    3    │   2    │   3    │
│Total│Upcoming │ Active │Graded  │
└─────┴─────────┴────────┴────────┘
```

**Assessment Card:**
```
🟡 ACTIVE
Midterm Examination
EXAM • 100 pts
📅 Due Dec 13, 11:59 PM
2d 14h remaining
📄 23/84 submitted • Avg: 87.5%
```

**Status Colors:**
- 🟡 **ACTIVE** - Green (has submissions, not past due)
- 🟠 **UPCOMING** - Orange (no submissions yet)
- ⚪ **GRADED** - Gray (past due date)

---

### 4. **Assessment Status Logic**

Assessment status is computed dynamically based on:

```typescript
const now = new Date();
const dueDate = new Date(assessment.dueDate);

if (now > dueDate) {
  status = 'graded';        // Past due
} else if (submissionCount > 0) {
  status = 'active';        // Has submissions
} else {
  status = 'upcoming';      // No submissions yet
}
```

**Status Flow:**
```
Create → UPCOMING → (first submission) → ACTIVE → (past due) → GRADED
```

---

## 📋 API Endpoint Mapping

### Backend → Frontend

| Backend Endpoint | Frontend Method | Screen Usage |
|-----------------|----------------|--------------|
| `GET /api/courses/:id/assessments` | `assessmentService.getAssessmentsByCourse()` | ViewAssessmentsScreen |
| `GET /api/assessments/:id` | `assessmentService.getAssessmentById()` | ViewAssessmentDetailScreen |
| `POST /api/courses/:id/assessments` | `assessmentService.createAssessment()` | (Future: AddAssessmentScreen) |
| `PATCH /api/assessments/:id` | `assessmentService.updateAssessment()` | (Future: Edit) |
| `DELETE /api/assessments/:id` | `assessmentService.deleteAssessment()` | (Future: Delete) |

---

## 🎯 Usage Examples

### Fetch All Assessments for a Course
```typescript
import { assessmentService } from '@/services/api';

// Simple fetch
const response = await assessmentService.getAssessmentsByCourse('courseId123');
console.log(response.assessments); // Array of assessments
console.log(response.stats);       // Stats object

// With filters
const filtered = await assessmentService.getAssessmentsByCourse('courseId123', {
  status: 'active',
  type: 'exam',
  sortBy: 'dueDate',
  order: 'asc',
});
```

### Get Assessment by ID
```typescript
const assessment = await assessmentService.getAssessmentById('assessId123');

// Access detailed data
console.log(assessment.title);
console.log(assessment.submissionStats);
console.log(assessment.recentSubmissions);
```

### Create an Assessment
```typescript
const newAssessment = await assessmentService.createAssessment(
  'courseId123',
  {
    title: 'Midterm Examination',
    type: 'exam',
    description: 'Comprehensive exam covering chapters 1-5',
    instructions: 'Answer all questions. Show your work.',
    totalPoints: 100,
    dueDate: '2025-12-15T23:59:00.000Z',
    allowLateSubmissions: true,
    latePenalty: 10,
    visibleToStudents: true,
  }
);
```

### Filter by Status
```typescript
// Get only upcoming assessments
const upcoming = await assessmentService.getUpcomingAssessments('courseId123');

// Get only active assessments
const active = await assessmentService.getActiveAssessments('courseId123');

// Get only graded assessments
const graded = await assessmentService.getGradedAssessments('courseId123');
```

### Calculate Time Remaining
```typescript
const timeInfo = assessmentService.getTimeRemaining('2025-12-15T23:59:00.000Z');

console.log(timeInfo.isPastDue);  // false
console.log(timeInfo.days);       // 5
console.log(timeInfo.hours);      // 13
console.log(timeInfo.minutes);    // 49
console.log(timeInfo.formatted);  // "5d 13h remaining"
```

### Format Due Date
```typescript
const formatted = assessmentService.formatDueDate('2025-12-15T23:59:00.000Z');
console.log(formatted); // "Dec 15, 2025, 11:59 PM"
```

---

## 🔍 Console Logs

All assessment operations log to console for debugging:

```
📋 Fetching assessments for course: 64a1b2c3... { sortBy: 'dueDate' }
✅ Retrieved 8 assessments
📊 Stats: { totalAssessments: 8, activeAssessments: 2, ... }

📖 Fetching assessment: assess001
✅ Assessment retrieved: Midterm Examination
📊 Submission stats: { submitted: 23, notSubmitted: 61, ... }

➕ Creating assessment: Midterm Examination exam
📅 Due date: 2025-12-15T23:59:00.000Z
✅ Assessment created successfully: assess001

📝 Updating assessment: assess001
✅ Assessment updated successfully

🗑️ Deleting assessment: assess001
✅ Assessment deleted successfully

🔍 Fetching active assessments for course: 64a1b2c3...
⚡ Fetching active assessments: 64a1b2c3...
```

---

## 🚨 Error Handling

### Common Errors

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "field": "dueDate",
      "message": "Due date must be in the future"
    }
  ]
}
```

**403 Forbidden:**
```typescript
// User trying to create assessment for course they don't own
Alert.alert('Error', 'Only the course professor can create assessments');
```

**404 Not Found:**
```typescript
// Assessment doesn't exist
Alert.alert('Error', 'Assessment not found');
```

**Network Error:**
```typescript
// Backend not reachable
Alert.alert('Error', 'Failed to connect to server. Check your connection.');
```

---

## 📱 Screen Flow

```
ViewCourseScreen
  └── [Tap "Assessments"] → ViewAssessmentsScreen
      ├── [Pull to refresh]
      ├── Stats Header (Total, Upcoming, Active, Graded)
      ├── Assessment List (sorted by due date)
      │   └── [Tap assessment] → ViewAssessmentDetailScreen
      │       ├── View details, submissions, stats
      │       ├── [Grade submission] → (Future)
      │       └── [Edit assessment] → (Future)
      └── [+ Button] → (Future: AddAssessmentScreen)
```

---

## 🎨 UI Components Used

### ViewAssessmentsScreen
- `FlatList` with data
- `RefreshControl` for pull-to-refresh
- `ActivityIndicator` for loading states
- `TouchableOpacity` for assessment cards
- `Ionicons` for icons
- Stats cards grid (4 columns)
- Status badges with dots
- Time remaining indicators

### Assessment Card Details:
```tsx
Status Badge → 🟡 ACTIVE
Title → "Midterm Examination"
Meta → EXAM • 100 pts
Due Date → 📅 Due Dec 13, 11:59 PM
Time Remaining → "2d 14h remaining"
Stats → 📄 23/84 submitted
Grade → Avg: 87.5% (if graded)
Chevron → >
```

---

## ⚠️ Validation Rules

### Create Assessment

| Field | Rule | Example |
|-------|------|---------|
| Title | 3-200 chars, required | "Midterm Examination" |
| Type | enum, required | "exam" |
| Description | Max 2000 chars | "Comprehensive exam..." |
| Instructions | Max 5000 chars | "Answer all questions..." |
| Total Points | 1-1000, required | 100 |
| Due Date | Future date, ISO 8601 | "2025-12-15T23:59:00.000Z" |
| Allow Late | Boolean | true |
| Late Penalty | 0-100 | 10 |
| Visible | Boolean | true |

---

## 🔄 Refresh Behavior

### ViewAssessmentsScreen
- **On Focus:** Fetches assessments automatically
- **Pull-to-Refresh:** Refetches all assessments
- **After Create:** Refetches when returning (Future)

---

## 📊 Data Model

### AssessmentListItem Object (List View)
```typescript
{
  _id: "assess001"
  course: "64a1b2c3..."
  title: "Midterm Examination"
  type: "exam"
  description: "Comprehensive exam..."
  totalPoints: 100
  dueDate: "2025-12-15T23:59:00.000Z"
  status: "active" // computed
  submissionCount: 23
  totalStudents: 84
  gradedCount: 5
  notGradedCount: 18
  avgGrade: 87.5
  createdBy: { _id, firstName, lastName }
  createdAt: "2025-11-15T10:00:00.000Z"
  updatedAt: "2025-12-10T08:30:00.000Z"
}
```

### Assessment Object (Detail View)
```typescript
{
  // All AssessmentListItem fields, plus:
  course: {
    _id: "64a1b2c3..."
    code: "PSY101"
    title: "Introduction to Psychology"
  }
  instructions: "Answer all questions. Show your work."
  allowLateSubmissions: true
  latePenalty: 10
  visibleToStudents: true
  isActive: true
  submissionStats: {
    submitted: 23
    notSubmitted: 61
    graded: 5
    notGraded: 18
    totalStudents: 84
  }
  recentSubmissions: [
    {
      id: "sub001"
      studentId: "student001"
      studentName: "Jane Doe"
      studentAvatar: "https://..."
      submittedAt: "2025-12-10T10:27:00.000Z"
      status: "not-graded"
      grade: null
      percentage: null
      fileCount: 3
    }
  ]
}
```

---

## 🧪 Testing

### Prerequisites:
1. ✅ Backend running on `http://192.168.56.1:5000`
2. ✅ Logged in as professor
3. ✅ Course with assessments exists

### Test Flow:
```
1. ViewCourseScreen → Tap "Assessments"
2. Should see loading indicator
3. Assessments list populates with stats header
4. Pull down → Refresh assessments
5. Tap assessment → View details (Future)
```

### Test Scenarios:

**Fetch Assessments:**
```
1. Navigate to ViewAssessmentsScreen
2. Should show stats: Total, Upcoming, Active, Graded
3. Should show assessment cards sorted by due date
4. Each card shows status, type, points, time remaining
```

**Status Display:**
```
1. Upcoming: No submissions, orange badge
2. Active: Has submissions, green badge
3. Graded: Past due, gray badge
```

**Time Remaining:**
```
1. Shows "5d 13h remaining" for future assessments
2. Shows "3h 45m remaining" for same-day assessments
3. Hidden for past due assessments
```

---

## 📞 Support

**Issues?**
1. Check console logs for API errors
2. Verify backend is running
3. Check `services/api/config.ts` for correct IP
4. Ensure logged in as professor
5. Verify course has assessments

**Common Fixes:**
- **Network Error:** Check `API_BASE_URL` in config.ts
- **401 Unauthorized:** Token expired, re-login
- **403 Forbidden:** Not authorized (wrong role or not course owner)
- **No assessments showing:** Course may not have assessments created yet
- **Wrong time remaining:** Check device date/time settings

---

## 🚀 Future Enhancements

### Planned Features:
- [ ] Create assessment UI (AddAssessmentScreen)
- [ ] Edit assessment functionality
- [ ] Delete assessment with confirmation
- [ ] Filter by type (exam/quiz/homework/project/assignment)
- [ ] Filter by status (upcoming/active/graded)
- [ ] Sort options (due date, title, points, created)
- [ ] View assessment submissions
- [ ] Grade submissions
- [ ] Analytics (submission rate, average grades)
- [ ] Due date picker
- [ ] Copy/duplicate assessment
- [ ] Bulk operations

---

## 🐛 Known Limitations

1. **Create Assessment:** UI not yet implemented
2. **Edit Assessment:** No edit UI yet
3. **Delete Assessment:** No delete confirmation UI
4. **Submissions:** Viewing submissions not implemented
5. **Grading:** Grading UI not implemented
6. **Filters:** No filter UI in ViewAssessmentsScreen
7. **Student View:** Student assessment view not implemented

---

## ✅ Integration Checklist

- [x] Assessment service created with all methods
- [x] TypeScript types defined
- [x] ViewAssessmentsScreen integrated
- [x] Loading states added
- [x] Error handling implemented
- [x] Pull-to-refresh added
- [x] Stats header implemented
- [x] Status indicators working
- [x] Time remaining calculation
- [x] Console logging added
- [x] Documentation created
- [x] No TypeScript errors

---

## 📖 Related Documentation

1. **ASSESSMENT_API_INTEGRATION.md** - This complete guide
2. **ASSESSMENT_API_INTEGRATION_SUMMARY.md** - Quick reference
3. **api-reference/ASSESSMENT_API.md** - Backend API reference
4. **COURSE_API_INTEGRATION.md** - Course API integration

---

**Status:** ✅ Assessment API Fully Integrated & Ready for Testing

**Next Steps:**
1. Test assessment fetching
2. Verify status calculations
3. Check time remaining display
4. Implement AddAssessmentScreen (Future)
5. Integrate submission management (Future)

**Test Command:**
```bash
cd "C:\Users\Administrator\Desktop\Uni\Semester 7\FYP-1\CheckMate-Mobile-App\checkmate-app"
npm start
```

**Backend Required:** `http://192.168.56.1:5000`

**Role Required:** Professor

**Next API:** Submission Management or Enrollment
