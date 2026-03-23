# Authentication Screens

This directory contains the authentication-related screens for the CheckMate app.

## Screens

### 1. GetStartedScreen
**File**: `GetStartedScreen.tsx`

The initial landing screen that welcomes teachers to the app.

**Features**:
- CheckMate logo and branding
- Welcome message: "Welcome, Teacher!"
- Description: "Your digital classroom assistant awaits."
- "Get Started" button that navigates to Sign Up screen

**Navigation**: Navigates to `SignUp` screen

---

### 2. SignUpScreen
**File**: `SignUpScreen.tsx`

Registration screen for new teachers.

**Features**:
- Full Name input field (with person icon)
- Email input field (with mail icon)
- Password input field (with lock icon)
- Confirm Password input field (with lock icon)
- "Sign Up" button
- Link to Login screen ("Already have an account? Log In")

**Navigation**: 
- Navigates to `Login` screen via link

**Form Fields**:
- Full Name (text input)
- Email (email keyboard type, lowercase)
- Password (secure text entry)
- Confirm Password (secure text entry)

---

### 3. LoginScreen
**File**: `LoginScreen.tsx`

Login screen for existing teachers.

**Features**:
- Email input field (with mail icon)
- Password input field (with lock icon)
- "Login" button
- "Forgot Password?" link

**Navigation**: 
- After successful login, will navigate to main app screens

**Form Fields**:
- Email (email keyboard type, lowercase)
- Password (secure text entry)

---

## Design Elements

All authentication screens follow the CheckMate design system:

### Colors
- Background: White (#FFFFFF)
- Primary Button: Teal (#13B2A9)
- Text Primary: Dark (#2C3E50)
- Text Secondary: Gray (#7F8C8D)
- Input Background: Light Gray (#F7F7F7)

### Components
- **Logo**: CheckMate branded logo (100-120px)
- **Title**: "CHECKMATE" in bold
- **Subtitle**: "Teacher Login" or "Teacher Sign up"
- **Input Fields**: Gray background with icons, rounded corners (8px)
- **Buttons**: Teal primary color, white text, rounded corners (8px)
- **Links**: Teal color, medium weight

### Layout
- Centered content
- Consistent spacing using theme values
- ScrollView for Sign Up screen to handle keyboard
- Fixed layout for Get Started and Login screens

## Navigation Flow

```
GetStarted → SignUp ⇄ Login
                ↓
         [Main App Screens]
```

1. App starts at **GetStarted** screen
2. "Get Started" button → **SignUp** screen
3. "Already have an account? Log In" → **Login** screen
4. "Forgot Password?" → [To be implemented]
5. After login → Navigate to main app screens

## Usage

Import and use in navigation:

```typescript
import GetStartedScreen from '@/components/auth/GetStartedScreen';
import LoginScreen from '@/components/auth/LoginScreen';
import SignUpScreen from '@/components/auth/SignUpScreen';
```

## TODO

- [ ] Implement actual authentication logic
- [ ] Add form validation
- [ ] Implement "Forgot Password" functionality
- [ ] Add password visibility toggle
- [ ] Connect to backend API
- [ ] Add loading states
- [ ] Add error handling and display
- [ ] Implement proper authentication state management
- [ ] Add biometric authentication option
- [ ] Implement "Remember Me" functionality
