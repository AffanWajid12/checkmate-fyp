# Course API Integration - Complete Guide

## ✅ What Was Implemented

### 1. **Course Service API** (`services/api/courseService.ts`)
Complete TypeScript service for all course operations:

#### Available Methods:
- ✅ `getCourses(params?)` - Get all courses with pagination and filters
- ✅ `getCourseById(courseId)` - Get detailed course information
- ✅ `createCourse(data)` - Create a new course
- ✅ `updateCourse(courseId, data)` - Update course details
- ✅ `deleteCourse(courseId)` - Soft delete a course
- ✅ `addAnnouncement(courseId, data)` - Add announcement to course
- ✅ `searchCourses(query)` - Search courses by title or code
- ✅ `getCoursesBySemester(semester, year)` - Filter by semester

**Features:**
- 📊 Comprehensive logging with emojis
- 🔒 Automatic token management
- ⚡ Full TypeScript type safety
- 🎯 Error handling built-in

---

### 2. **TypeScript Types** (`services/api/types.ts`)

#### Core Types Added:
```typescript
interface Course {
  _id: string;
  title: string;
  code: string;
  section: string;
  semester: string;
  year: number;
  description?: string;
  credits: number;
  professor: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
  schedule?: Schedule;
  maxStudents: number;
  enrolledStudents: number;  // Virtual field
  assessmentCount: number;    // Virtual field
  announcements: Announcement[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Schedule {
  days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'>;
  time: string;
  location: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  postedBy: string;
  postedAt: string;
}
```

---

### 3. **ViewCoursesScreen Integration** ✅

**Features Implemented:**
- ✅ Fetches courses from API on screen focus
- ✅ Pagination support (loads 20 courses per page)
- ✅ Pull-to-refresh functionality
- ✅ Infinite scroll (load more on scroll)
- ✅ Empty state when no courses
- ✅ Loading indicators
- ✅ Error handling with retry option
- ✅ Course cards show:
  - Course title, code, section
  - Semester and year
  - Enrolled students count
  - Assessment count

**UI Enhancements:**
```tsx
// Shows loading state
<ActivityIndicator /> + "Loading courses..."

// Empty state
<Ionicons name="book-outline" /> + "No Courses Yet"

// Course card with stats
{title} - PSY101 - Section A
Fall 2024 2024
👥 84 Students  📋 8 Assessments
```

---

### 4. **AddCourseScreen Integration** ✅

**Form Fields:**

**Required:**
- ✅ Course Title (3-200 chars)
- ✅ Course Code (3-20 chars, uppercase, alphanumeric)
- ✅ Section (1-10 chars)
- ✅ Semester (e.g., "Fall 2024")
- ✅ Year (2020-2100)

**Optional:**
- ✅ Description (max 2000 chars, multiline textarea)
- ✅ Credits (1-6, default: 3)
- ✅ Max Students (1-500, default: 100)

**Features:**
- ✅ Client-side validation before API call
- ✅ Loading state during creation
- ✅ Success message with navigation back
- ✅ Error handling (duplicate detection, validation errors)
- ✅ Disabled inputs during loading
- ✅ Auto-uppercase for course codes

**Validation Rules:**
```typescript
✓ Title: min 3 chars, required
✓ Code: uppercase letters/numbers only
✓ Section: required
✓ Semester: required
✓ Year: 2020-2100 range
✓ Credits: 1-6
✓ Max Students: 1-500
```

---

### 5. **ViewCourseScreen Integration** ✅

**Features Implemented:**
- ✅ Fetches course details by ID from API
- ✅ Pull-to-refresh functionality
- ✅ Loading state with spinner
- ✅ Error handling with retry/go back options
- ✅ Real-time course information display

**UI Sections:**

**Course Info Card:**
```
📚 PSY101 - Section A
Introduction to Psychology
Prof. Sarah Johnson
Fall 2024 2024 • 3 Credits
```

**Description Section** (if available):
```
About this course
[Course description text...]
```

**Schedule Section** (if available):
```
Schedule
📅 Monday, Wednesday, Friday
🕐 10:00 AM - 11:30 AM
📍 Room 204
```

**Action Items:**
```
👥 Enrolled Students: 84 / 100
📋 Assessments: 8
📁 Course Materials
```

**Announcements:**
- Priority badges (HIGH/MEDIUM/LOW)
- Color-coded by priority
- Time ago formatting (2h ago, 3d ago)
- Empty state when no announcements

---

## 📋 API Endpoint Mapping

### Backend → Frontend

| Backend Endpoint | Frontend Method | Screen Usage |
|-----------------|----------------|--------------|
| `GET /api/courses` | `courseService.getCourses()` | ViewCoursesScreen |
| `GET /api/courses/:id` | `courseService.getCourseById()` | ViewCourseScreen |
| `POST /api/courses` | `courseService.createCourse()` | AddCourseScreen |
| `PATCH /api/courses/:id` | `courseService.updateCourse()` | (Not yet implemented) |
| `DELETE /api/courses/:id` | `courseService.deleteCourse()` | (Not yet implemented) |
| `POST /api/courses/:id/announcements` | `courseService.addAnnouncement()` | (Not yet implemented) |

---

## 🎯 Usage Examples

### Fetch All Courses
```typescript
import { courseService } from '@/services/api';

// Simple fetch
const response = await courseService.getCourses();
console.log(response.courses); // Array of courses
console.log(response.pagination); // Pagination info

// With filters
const filtered = await courseService.getCourses({
  page: 1,
  limit: 20,
  semester: 'Fall 2024',
  year: 2024,
  search: 'psychology',
  sortBy: 'title',
  order: 'asc',
});
```

### Create a Course
```typescript
import { courseService } from '@/services/api';

const newCourse = await courseService.createCourse({
  title: 'Introduction to Psychology',
  code: 'PSY101',
  section: 'A',
  semester: 'Fall 2024',
  year: 2024,
  description: 'An introductory course...',
  credits: 3,
  maxStudents: 100,
  schedule: {
    days: ['Monday', 'Wednesday', 'Friday'],
    time: '10:00 AM - 11:30 AM',
    location: 'Room 204',
  },
});
```

### Get Course Details
```typescript
const course = await courseService.getCourseById('courseId123');

// Access course data
console.log(course.title);
console.log(course.professor.firstName);
console.log(course.enrolledStudents); // Virtual field
console.log(course.announcements);    // Array
```

### Add Announcement
```typescript
const announcement = await courseService.addAnnouncement(
  'courseId123',
  {
    title: 'Quiz 3 Postponed',
    content: 'Quiz 3 has been moved to next Friday',
    priority: 'high',
  }
);
```

### Search Courses
```typescript
const results = await courseService.searchCourses('calculus');
```

---

## 🔍 Console Logs

All course operations log to console for debugging:

```
📚 Fetching courses with params: { page: 1, limit: 20 }
✅ Retrieved 12 courses

➕ Creating course: Introduction to Psychology PSY101
✅ Course created successfully: 64a1b2c3d4e5f6g7h8i9j0k1

📖 Fetching course: 64a1b2c3...
✅ Course retrieved: Introduction to Psychology

📝 Updating course: 64a1b2c3...
✅ Course updated successfully

🗑️ Deleting course: 64a1b2c3...
✅ Course deleted successfully

📢 Adding announcement to course: 64a1b2c3...
✅ Announcement added successfully

🔍 Searching courses: psychology
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
      "field": "code",
      "message": "Course code must contain only uppercase letters and numbers"
    }
  ]
}
```

**403 Forbidden:**
```typescript
// User trying to update/delete course they don't own
Alert.alert('Error', 'You can only modify your own courses');
```

**404 Not Found:**
```typescript
// Course doesn't exist
Alert.alert('Error', 'Course not found');
```

**409 Conflict:**
```typescript
// Duplicate course (same code + section + semester + year)
Alert.alert(
  'Error',
  'A course with this code and section already exists for this semester'
);
```

**Network Error:**
```typescript
// Backend not reachable
Alert.alert('Error', 'Failed to connect to server. Check your connection.');
```

---

## 📱 Screen Flow

```
MainTabs (Professor View)
  └── Courses Tab
      └── ViewCoursesScreen
          ├── [Pull to refresh]
          ├── [Tap course] → ViewCourseScreen
          │   ├── View details, schedule, announcements
          │   ├── [Enrolled Students] → (Future)
          │   ├── [Assessments] → ViewAssessmentsScreen
          │   └── [Course Materials] → (Future)
          └── [+ Button] → AddCourseScreen
              ├── Fill form
              ├── [Create Course] → API call
              └── [Success] → Back to ViewCoursesScreen (refreshed)
```

---

## 🔐 Authorization

All course endpoints require authentication. The token is automatically added to requests via the API client interceptor.

**Professor Role:**
- ✅ Create courses
- ✅ View own courses
- ✅ Update own courses
- ✅ Delete own courses
- ✅ Add announcements to own courses

**Student Role:**
- ✅ View enrolled courses only
- ❌ Cannot create/update/delete courses

**Admin Role:**
- ✅ View all courses
- ✅ Full access to all operations

---

## 🎨 UI Components Used

### ViewCoursesScreen
- `FlatList` with pagination
- `RefreshControl` for pull-to-refresh
- `ActivityIndicator` for loading states
- `TouchableOpacity` for course cards
- `Ionicons` for icons

### AddCourseScreen
- `ScrollView` with keyboard avoiding
- `TextInput` for form fields
- Multiline `TextInput` for description
- `ActivityIndicator` in button during loading
- Disabled state for inputs/button

### ViewCourseScreen
- `ScrollView` with `RefreshControl`
- Expandable course info card
- Schedule display with icons
- Action items (clickable rows)
- Announcement cards with priority badges
- Empty states for no announcements

---

## 🧪 Testing

### Test the Integration

1. **Backend Running:** Ensure backend is running on `http://192.168.56.1:5000`
2. **Login:** Login as a professor
3. **Navigate:** Go to Courses tab

### Test Scenarios:

**Fetch Courses:**
```
1. Open Courses tab
2. Should see loading indicator
3. Courses list should populate
4. Pull down to refresh
```

**Create Course:**
```
1. Tap + button
2. Fill required fields (title, code, section, semester, year)
3. Optional: Add description, credits, max students
4. Tap "Create Course"
5. Should show loading indicator
6. Success: Navigates back with new course visible
7. Error: Shows alert with message
```

**View Course:**
```
1. Tap a course card
2. Should show loading state
3. Course details populate
4. View schedule (if available)
5. View announcements (if available)
6. Pull down to refresh
```

**Search (Future):**
```
Coming soon - search bar in ViewCoursesScreen
```

---

## 📊 Data Flow

```
User Action → Screen Component → API Service → API Client → Backend

Example: Creating a Course

AddCourseScreen.handleCreateCourse()
  ↓
courseService.createCourse(data)
  ↓
apiClient.post('/api/courses', data)
  ↓
Request Interceptor (adds token, logs request)
  ↓
Backend API
  ↓
Response Interceptor (logs response)
  ↓
courseService returns Course object
  ↓
AddCourseScreen shows success, navigates back
  ↓
ViewCoursesScreen refetches courses (useFocusEffect)
```

---

## 🔄 Refresh Behavior

### ViewCoursesScreen
- **On Focus:** Fetches courses automatically
- **Pull-to-Refresh:** Refetches page 1
- **After Create:** Refetches when returning from AddCourseScreen

### ViewCourseScreen
- **On Focus:** Fetches course details
- **Pull-to-Refresh:** Refetches course details

---

## 📝 Validation Summary

| Field | Validation | Error Message |
|-------|-----------|--------------|
| Title | Required, min 3 chars | "Course title is required" |
| Code | Required, alphanumeric | "Course code must contain only letters and numbers" |
| Section | Required | "Section is required" |
| Semester | Required | "Semester is required" |
| Year | Required, 2020-2100 | "Please enter a valid year (2020-2100)" |
| Description | Optional, max 2000 | - |
| Credits | Optional, 1-6 | - |
| Max Students | Optional, 1-500 | - |

---

## 🚀 Future Enhancements

### Planned Features:
- [ ] Update course functionality (Edit button)
- [ ] Delete course with confirmation
- [ ] Create announcement UI (FAB button)
- [ ] Search/filter courses by semester
- [ ] Enrolled students list
- [ ] Course materials management
- [ ] Schedule picker UI
- [ ] Bulk operations
- [ ] Export course data
- [ ] Analytics (enrollment trends)

---

## 🐛 Known Limitations

1. **Schedule Input:** Currently not in AddCourseScreen form (manual backend addition)
2. **Announcement Creation:** UI not yet implemented (FAB exists but not functional)
3. **Edit Course:** No edit UI yet
4. **Delete Course:** No delete confirmation UI
5. **Student View:** Not implemented yet
6. **Search UI:** Not implemented in ViewCoursesScreen

---

## ✅ Checklist for Adding New Course Feature

When adding a new course-related feature:

- [ ] Add TypeScript types to `services/api/types.ts`
- [ ] Add method to `services/api/courseService.ts`
- [ ] Add console logs with emoji prefix
- [ ] Handle errors with try-catch
- [ ] Update UI screen to use new method
- [ ] Add loading states
- [ ] Add error handling with Alert
- [ ] Test with backend API
- [ ] Update this documentation

---

## 📞 Support

**Issues?**
1. Check console logs for API errors
2. Verify backend is running
3. Check `services/api/config.ts` for correct IP
4. Ensure logged in as professor
5. Check backend logs for server errors

**Common Fixes:**
- **Network Error:** Check `API_BASE_URL` in config.ts
- **401 Unauthorized:** Token expired, re-login
- **403 Forbidden:** Not authorized (wrong role)
- **409 Conflict:** Duplicate course, change code/section
- **No courses showing:** Check professor account has courses

---

**Status:** ✅ Course API Fully Integrated

**Last Updated:** December 10, 2025

**Next:** Enrollment API Integration
