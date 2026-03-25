# Navigation Flow Summary

## Current Navigation Structure

```
GetStarted → SignUp ⇄ Login
                ↓
           MainTabs
              ↓
    ┌─────────┴─────────┐
    │                   │
Courses  Students  Exams  Settings
```

## Navigation Files

### RootNavigator.tsx
Main stack navigator containing:
- Authentication screens (GetStarted, Login, SignUp)
- MainTabs (main app navigation)
- Legacy screens (RecordScreen, CapturesScreen, VideoPlayer)

### MainTabNavigator.tsx
Bottom tab navigator with 4 tabs:
1. **Courses** - View and manage courses
2. **Students** - View and manage students  
3. **Exams** - View and manage exams
4. **Settings** - App settings

## Screens Overview

### Authentication Screens
- **GetStartedScreen** - Welcome screen with "Get Started" button
- **LoginScreen** - Login with email/password, navigates to MainTabs on success
- **SignUpScreen** - Registration form with link to login

### Main App Screens
- **ViewCoursesScreen** - List of courses with add button
- **StudentsScreen** - Placeholder (to be implemented)
- **ExamsScreen** - Placeholder (to be implemented)
- **SettingsScreen** - Placeholder (to be implemented)

## Design Features

### Bottom Tab Bar
- Height: 60px
- Active color: #13B2A9 (teal)
- Inactive color: #7F8C8D (gray)
- Icons: Ionicons outline variants
- Labels: 12px, medium weight

### Course Cards
- White background with shadow
- 12px border radius
- Includes: title, code, semester, student count
- Chevron icon for navigation
- Touch feedback on press

## Next Steps

1. Implement course detail screen
2. Build out Students, Exams, and Settings screens
3. Add backend API integration
4. Implement authentication state management
5. Add course creation/editing functionality
6. Add student management features
7. Implement exam grading features
