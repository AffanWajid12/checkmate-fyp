# Courses Management

This directory contains the courses-related screens for the CheckMate app.

## Screens

### ViewCoursesScreen
**File**: `ViewCoursesScreen.tsx`

The main courses management screen that displays a list of all courses.

**Features**:
- Header with "Manage Courses" title
- Add button (floating action button style) in the top right
- List of courses with:
  - Course title
  - Course code and semester
  - Student count with icon
  - Chevron for navigation
- Card-based layout with subtle shadows
- Responsive touch feedback
- Navigates to AddCourseScreen when add button is pressed

**Sample Data**:
Currently displays 4 sample courses:
1. Introduction to Psychology (PSY101)
2. Modern Art History (ARH205)
3. Calculus II (MATH201)
4. Fundamentals of Biology (BIO110)

**Design**:
- White background
- Primary color (#13B2A9) for the add button
- Card-based layout with rounded corners
- Consistent spacing and typography
- Icons from Ionicons

---

### AddCourseScreen
**File**: `AddCourseScreen.tsx`

Screen for adding a new course to the system.

**Features**:
- Back button to return to courses list
- "Add Course" header title
- Three input fields:
  - Course Name (e.g., "Introduction to Psychology")
  - Course Code (e.g., "PSY101")
  - Section (e.g., "A", "B", "01")
- "Create Course" button at the bottom
- Keyboard-aware scrolling
- Safe area support

**Design**:
- Clean, minimal design
- Rounded input fields (12px border radius)
- Labels above each input field
- Input fields with light gray background (#F7F7F7)
- Primary button at the bottom with shadow
- Back button with chevron icon

**Navigation**:
- Accessible from ViewCoursesScreen via the add button
- Returns to courses list after creation

## Navigation

The courses screen is accessible through:
1. Main tab navigation (Courses tab)
2. After successful login from LoginScreen

## TODO

- [ ] Implement course detail screen
- [x] Implement add course screen UI
- [ ] Connect add course to backend API
- [ ] Add form validation for add course
- [ ] Connect to backend API for course data
- [ ] Add pull-to-refresh functionality
- [ ] Add empty state when no courses
- [ ] Add search/filter functionality
- [ ] Implement course editing
- [ ] Add course deletion with confirmation
- [ ] Add loading states
- [ ] Implement pagination for large course lists
