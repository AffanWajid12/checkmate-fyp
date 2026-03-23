# Bottom Drawer + Add Announcement/Assessment Implementation

## 📋 Overview
This document covers the implementation of a bottom drawer component triggered by the FAB (Floating Action Button) in ViewCourseScreen, along with two new screens for adding announcements and assessments.

## ✅ Completed Features

### 1. **AddOptionsDrawer Component** 
**File:** `components/courses/AddOptionsDrawer.tsx`

A reusable bottom sheet drawer with three options:
- ✅ **Add Announcement** - Fully functional
- ✅ **Add Assessment** - Fully functional  
- 🔒 **Add Course Material** - Disabled (Coming Soon)

**Features:**
- Modal overlay with semi-transparent background
- Smooth fade animation
- Handle bar at the top for visual affordance
- Three option cards with icons and descriptions
- Color-coded icons (primary, green, gray)
- Cancel button at the bottom
- Touch-outside-to-dismiss functionality
- Small delay on option selection for smooth transitions

**Design:**
- Modern card-based UI
- Icon containers with 20% opacity backgrounds
- Chevron indicators for enabled options
- Lock icon for disabled option
- Responsive to 70% max screen height

---

### 2. **AddAnnouncementScreen**
**File:** `components/courses/AddAnnouncementScreen.tsx`

A screen for creating course announcements with the following features:

#### **Form Fields:**
- **Title*** (required, 3-100 chars)
- **Content*** (required, 10-1000 chars)
- **Priority** (optional: low/medium/high)

#### **UI Features:**
- Course info card showing courseCode and courseTitle
- Character counters for title (x/100) and content (x/1000)
- Priority selector with 3 buttons:
  - 🟢 Low (green)
  - 🟠 Medium (orange/amber)
  - 🔴 High (red)
- Info card explaining visibility to students
- Fixed footer with submit button
- Loading state with spinner
- Form validation with error alerts

#### **Validation Rules:**
- Title: minimum 3 characters, maximum 100
- Content: minimum 10 characters, maximum 1000
- All whitespace trimmed before submission

#### **API Integration:**
- Uses `courseService.addAnnouncement(courseId, data)`
- Success: Alert + navigate back to ViewCourseScreen
- Error: Alert with specific error message
- Handles 400, 401, 403, 404, network errors

---

### 3. **AddAssessmentScreen**
**File:** `components/courses/AddAssessmentScreen.tsx`

A comprehensive screen for creating assessments with extensive form fields.

#### **Required Fields:**
- **Title*** (3-100 chars)
- **Type*** (exam, quiz, homework, project, assignment)
- **Total Points*** (1-1000)
- **Due Date*** (must be in future)

#### **Optional Fields:**
- **Description** (0-500 chars)
- **Instructions** (0-1000 chars)
- **Allow Late Submissions** (toggle, default: ON)
- **Late Penalty %** (0-100, conditional on late submissions)
- **Visible to Students** (toggle, default: ON)

#### **UI Features:**
- Course info card at top
- Horizontal scrollable type selector with 5 options:
  - 📄 Exam
  - ❓ Quiz
  - ✏️ Homework
  - 💼 Project
  - 📋 Assignment
- Native DateTimePicker for due date/time selection
- Two text areas for description and instructions
- Toggle switches with labels and descriptions
- Conditional late penalty field
- Fixed footer with submit button
- Loading state with spinner

#### **Validation Rules:**
- Title: minimum 3 characters
- Total points: 1-1000 range
- Due date: must be in the future
- Late penalty: 0-100 range (if late submissions enabled)

#### **API Integration:**
- Uses `assessmentService.createAssessment(courseId, data)`
- Success: Alert + navigate back to ViewAssessmentsScreen
- Error: Alert with specific error message
- Handles all API error responses

---

### 4. **ViewCourseScreen Integration**
**File:** `components/courses/ViewCourseScreen.tsx`

Updated to integrate the bottom drawer:

#### **New State:**
```typescript
const [drawerVisible, setDrawerVisible] = useState(false);
```

#### **New Handler Functions:**
```typescript
handleAddAnnouncement() // Navigates to AddAnnouncement screen
handleAddAssessment()   // Navigates to AddAssessment screen
handleAddCourseMaterial() // Logs "Coming soon" message
```

#### **FAB Integration:**
- FAB button now triggers drawer: `onPress={() => setDrawerVisible(true)}`
- Positioned above tab bar with proper safe area insets
- Opens AddOptionsDrawer on tap

#### **Drawer Integration:**
```tsx
<AddOptionsDrawer
  visible={drawerVisible}
  onClose={() => setDrawerVisible(false)}
  onAddAnnouncement={handleAddAnnouncement}
  onAddAssessment={handleAddAssessment}
  onAddCourseMaterial={handleAddCourseMaterial}
/>
```

---

### 5. **Navigation Updates**

#### **types.ts** - Added new routes:
```typescript
AddAnnouncement: {
  courseId: string;
  courseCode: string;
  courseTitle: string;
};
AddAssessment: {
  courseId: string;
  courseCode: string;
  courseTitle: string;
};
```

#### **RootNavigator.tsx** - Added new screens:
```typescript
import AddAnnouncementScreen from "../components/courses/AddAnnouncementScreen";
import AddAssessmentScreen from "../components/courses/AddAssessmentScreen";

<Stack.Screen name="AddAnnouncement" component={AddAnnouncementScreen} />
<Stack.Screen name="AddAssessment" component={AddAssessmentScreen} />
```

---

## 🎨 Design System

All screens follow the established design patterns:

### **Common UI Elements:**
1. **Header**
   - Back button (left)
   - Title (center)
   - Placeholder (right)
   - Bottom border

2. **Course Info Card**
   - Primary color background (10% opacity)
   - Book icon + course code and title
   - Rounded corners

3. **Form Inputs**
   - Card background with border
   - Consistent padding and border radius
   - Placeholder text in tertiary color
   - Character counters where applicable

4. **Submit Button**
   - Fixed footer position
   - Primary color background
   - Icon + text layout
   - Loading spinner on submission
   - Shadow elevation

### **Color Scheme:**
- **Primary Actions:** `theme.colors.primary`
- **Success/Low Priority:** `#10B981` (green)
- **Warning/Medium Priority:** `#F59E0B` (amber)
- **Error/High Priority:** `#EF4444` (red)
- **Disabled:** `theme.colors.textTertiary`

---

## 📦 Dependencies

### **New Package Installed:**
```bash
npx expo install @react-native-community/datetimepicker
```

**Used in:** `AddAssessmentScreen.tsx` for date/time selection

---

## 🔄 User Flow

### **Adding an Announcement:**
1. User is on ViewCourseScreen
2. Taps FAB (+) button
3. Bottom drawer slides up with 3 options
4. Taps "Add Announcement"
5. AddAnnouncementScreen opens
6. Fills title, content, selects priority
7. Taps "Post Announcement"
8. Success alert appears
9. Navigates back to ViewCourseScreen
10. New announcement appears in the list

### **Adding an Assessment:**
1. User is on ViewCourseScreen
2. Taps FAB (+) button
3. Bottom drawer slides up
4. Taps "Add Assessment"
5. AddAssessmentScreen opens
6. Fills required fields (title, type, points, due date)
7. Optionally fills description, instructions
8. Configures late submission settings
9. Taps "Create Assessment"
10. Success alert appears
11. Navigates back to ViewCourseScreen (or ViewAssessmentsScreen)

---

## 🔌 API Integration

### **Add Announcement:**
```typescript
courseService.addAnnouncement(courseId, {
  title: string,
  content: string,
  priority: 'low' | 'medium' | 'high'
})
```

**Endpoint:** `POST /api/courses/:courseId/announcements`

### **Add Assessment:**
```typescript
assessmentService.createAssessment(courseId, {
  title: string,
  type: AssessmentType,
  totalPoints: number,
  dueDate: string (ISO),
  description?: string,
  instructions?: string,
  allowLateSubmissions: boolean,
  latePenalty?: number,
  visibleToStudents: boolean
})
```

**Endpoint:** `POST /api/courses/:courseId/assessments`

---

## ✅ Validation Summary

### **AddAnnouncementScreen:**
| Field | Rules |
|-------|-------|
| Title | Required, min 3 chars, max 100 chars |
| Content | Required, min 10 chars, max 1000 chars |
| Priority | Optional, default: 'medium' |

### **AddAssessmentScreen:**
| Field | Rules |
|-------|-------|
| Title | Required, min 3 chars |
| Type | Required, one of 5 types |
| Total Points | Required, 1-1000 |
| Due Date | Required, must be future date |
| Description | Optional, max 500 chars |
| Instructions | Optional, max 1000 chars |
| Late Penalty | Conditional, 0-100 if late submissions enabled |

---

## 🎯 Error Handling

Both screens implement comprehensive error handling:

1. **Client-side validation** with Alert dialogs
2. **API error responses** with specific messages
3. **Network errors** with generic fallback message
4. **Loading states** to prevent double submission
5. **Empty field checks** before API calls

---

## 📱 Screen States

### **AddAnnouncementScreen States:**
- ✅ Initial/Empty form
- ✅ Filled form (valid)
- ✅ Loading (submitting)
- ✅ Error (validation or API)
- ✅ Success (with navigation)

### **AddAssessmentScreen States:**
- ✅ Initial/Empty form
- ✅ Filled form (valid)
- ✅ Date picker open
- ✅ Loading (submitting)
- ✅ Error (validation or API)
- ✅ Success (with navigation)
- ✅ Late penalty field (conditional)

### **AddOptionsDrawer States:**
- ✅ Closed (hidden)
- ✅ Open (visible)
- ✅ Dismissing (tap outside or cancel)

---

## 🚀 Next Steps

### **Pending Features:**
1. **Add Course Material Screen** 🔜
   - File upload functionality
   - PDF, images, documents support
   - Material categorization
   - Visibility controls

2. **Edit Announcement** 🔜
   - Update existing announcements
   - Delete announcements
   - Edit priority

3. **Edit Assessment** 🔜
   - Update existing assessments
   - Delete assessments
   - Change visibility

4. **Enhanced Date Picker** 🔜
   - Recurring assessments
   - Time zone support
   - Quick date presets (Tomorrow, Next Week, etc.)

---

## 📊 Implementation Stats

| Item | Count |
|------|-------|
| **New Files Created** | 3 |
| **Files Modified** | 3 |
| **Lines of Code** | ~1,200 |
| **New Screens** | 2 |
| **New Components** | 1 |
| **New Routes** | 2 |
| **Dependencies Added** | 1 |
| **API Methods Used** | 2 |

---

## 🏁 Summary

The bottom drawer and add screens implementation is **100% complete** with:

✅ Fully functional bottom drawer component  
✅ Complete AddAnnouncementScreen with API integration  
✅ Complete AddAssessmentScreen with API integration  
✅ Navigation properly configured  
✅ All validation rules implemented  
✅ Error handling in place  
✅ Uniform UI design across all screens  
✅ No TypeScript errors  
✅ Ready for testing  

The implementation follows React Native best practices, maintains consistency with the existing design system, and provides a smooth user experience for adding course content.
