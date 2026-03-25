# Authentication API Integration Documentation

## Overview
This document describes the implementation of authentication API integration in the CheckMate mobile app.

## Files Created

### 1. API Configuration (`services/api/config.ts`)
- **Purpose**: Central axios instance with request/response interceptors
- **Features**:
  - Automatic token injection in request headers
  - Token refresh on 401 errors
  - Base URL configuration (dev/prod)
  - 30-second timeout
  - Error handling

### 2. Type Definitions (`services/api/types.ts`)
- **Purpose**: TypeScript interfaces for type safety
- **Includes**:
  - `ApiResponse<T>` - Standard API response wrapper
  - `ApiError` - Error response structure
  - `User`, `UserRole` - User data types
  - `RegisterRequest`, `RegisterResponse`
  - `LoginRequest`, `LoginResponse`
  - `RefreshTokenRequest`, `RefreshTokenResponse`
  - `GetCurrentUserResponse`

### 3. Storage Service (`services/storage/index.ts`)
- **Purpose**: Secure local storage for auth data
- **Uses**: `@react-native-async-storage/async-storage`
- **Methods**:
  - `setToken()`, `getToken()`, `removeToken()`
  - `setRefreshToken()`, `getRefreshToken()`, `removeRefreshToken()`
  - `setUser()`, `getUser()`, `removeUser()`
  - `clearAuth()` - Clear all auth data
  - `isAuthenticated()` - Check auth status

### 4. Authentication Service (`services/api/authService.ts`)
- **Purpose**: Handles all authentication API calls
- **Methods**:
  - `register()` - User registration
  - `login()` - User login
  - `refreshToken()` - Refresh access token
  - `getCurrentUser()` - Get current user data
  - `logout()` - Logout and clear data
  - `isAuthenticated()` - Check if user is authenticated
  - `getStoredUser()` - Get stored user data

## API Endpoints Implemented

### 1. Register User
**Endpoint**: `POST /api/auth/register`

**Request**:
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'professor' | 'student' | 'admin';
  department?: string;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    user: User;
    token: string;
    refreshToken: string;
  }
}
```

**Usage**:
```typescript
const response = await authService.register({
  email: 'professor@university.edu',
  password: 'Password123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'professor',
  department: 'Computer Science'
});
```

---

### 2. Login User
**Endpoint**: `POST /api/auth/login`

**Request**:
```typescript
{
  email: string;
  password: string;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    user: User;
    token: string;
    refreshToken: string;
  }
}
```

**Usage**:
```typescript
const response = await authService.login({
  email: 'professor@university.edu',
  password: 'Password123'
});
```

---

### 3. Refresh Token
**Endpoint**: `POST /api/auth/refresh`

**Request**:
```typescript
{
  refreshToken: string;
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    token: string;
    expiresIn: number;
  }
}
```

**Note**: Automatically called by axios interceptor on 401 errors

---

### 4. Get Current User
**Endpoint**: `GET /api/auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
  }
}
```

**Usage**:
```typescript
const user = await authService.getCurrentUser();
```

---

### 5. Logout
**Endpoint**: `POST /api/auth/logout`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```typescript
{
  success: true,
  message: "Logged out successfully"
}
```

**Usage**:
```typescript
await authService.logout();
```

---

## Screen Integration

### LoginScreen (`components/auth/LoginScreen.tsx`)

**Features Implemented**:
- ✅ Email and password input validation
- ✅ API call to login endpoint
- ✅ Loading state with spinner
- ✅ Error handling with alerts
- ✅ Token and user data storage
- ✅ Navigation to MainTabs on success
- ✅ Disabled inputs during loading

**Validation Rules**:
- Both fields required
- Valid email format
- Minimum password length

**Code Example**:
```typescript
const handleLogin = async () => {
  try {
    const response = await authService.login({
      email: email.trim().toLowerCase(),
      password: password,
    });
    navigation.replace('MainTabs');
  } catch (error) {
    Alert.alert('Login Failed', error.message);
  }
};
```

---

### SignUpScreen (`components/auth/SignUpScreen.tsx`)

**Features Implemented**:
- ✅ First name, last name, email, password, department inputs
- ✅ Password confirmation validation
- ✅ API call to register endpoint
- ✅ Loading state with spinner
- ✅ Error handling with alerts
- ✅ Token and user data storage
- ✅ Navigation to MainTabs on success
- ✅ Disabled inputs during loading

**Validation Rules**:
- All required fields must be filled
- Valid email format
- Password minimum 8 characters
- Passwords must match
- Department is optional

**Code Example**:
```typescript
const handleSignUp = async () => {
  try {
    const response = await authService.register({
      email: email.trim().toLowerCase(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role: 'professor',
      department: department.trim() || undefined,
    });
    Alert.alert('Success', 'Account created successfully!');
    navigation.replace('MainTabs');
  } catch (error) {
    Alert.alert('Registration Failed', error.message);
  }
};
```

---

## Error Handling

### Error Types Handled

| Status Code | Error Message | Action |
|-------------|---------------|--------|
| 400 | Invalid input | Show validation error |
| 401 | Invalid credentials | Show login error or auto-refresh token |
| 409 | Email already exists | Show duplicate email error |
| 500+ | Server error | Show generic error |
| Network Error | Network error | Show connection error |
| Timeout | Request timeout | Show timeout error |

### Error Handling Pattern

```typescript
private handleError(error: unknown): Error {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiError;
    
    if (apiError?.message) {
      return new Error(apiError.message);
    }

    // Handle specific status codes
    if (error.response?.status === 401) {
      return new Error('Invalid credentials');
    }
    
    // Handle network errors
    if (error.code === 'ERR_NETWORK') {
      return new Error('Network error. Check your connection.');
    }
  }
  
  return new Error('An unexpected error occurred');
}
```

---

## Token Management

### Token Storage
- **Access Token**: Stored in AsyncStorage as `@checkmate:token`
- **Refresh Token**: Stored in AsyncStorage as `@checkmate:refreshToken`
- **User Data**: Stored in AsyncStorage as `@checkmate:user`

### Token Lifecycle

1. **Login/Register**: 
   - Receive access token and refresh token
   - Store both tokens + user data
   - Navigate to app

2. **API Requests**:
   - Axios interceptor adds `Authorization: Bearer <token>` header
   - Automatic token injection

3. **Token Expiry (401)**:
   - Axios interceptor catches 401 error
   - Automatically calls refresh token endpoint
   - Retries original request with new token
   - If refresh fails, clears auth and redirects to login

4. **Logout**:
   - Call logout API endpoint
   - Clear all tokens and user data
   - Redirect to login screen

---

## Configuration

### Environment Setup

Update `services/api/config.ts` with your backend URL:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:5000' // Development (your local backend)
  : 'https://api.checkmate.edu'; // Production
```

**For Android Emulator**:
```typescript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000' // Android emulator
  : 'https://api.checkmate.edu';
```

**For Physical Device**:
```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.x:5000' // Your computer's IP
  : 'https://api.checkmate.edu';
```

---

## Testing

### Manual Testing Checklist

**Login Screen**:
- [ ] Valid credentials login successfully
- [ ] Invalid credentials show error
- [ ] Empty fields show validation error
- [ ] Invalid email format shows error
- [ ] Loading spinner shows during request
- [ ] Navigate to MainTabs on success
- [ ] Network error handling

**SignUp Screen**:
- [ ] Valid registration succeeds
- [ ] Duplicate email shows error
- [ ] Password mismatch shows error
- [ ] Short password shows error
- [ ] Empty required fields show error
- [ ] Loading spinner shows during request
- [ ] Navigate to MainTabs on success
- [ ] Department field is optional

**Token Management**:
- [ ] Tokens stored after login/register
- [ ] Token auto-injected in requests
- [ ] Token refresh on 401 errors
- [ ] Logout clears all tokens
- [ ] User data persists across app restarts

---

## Usage Examples

### Check Authentication Status

```typescript
import { authService } from '@/services/api';

// Check if user is authenticated
const isAuth = await authService.isAuthenticated();
if (isAuth) {
  // User is logged in
}
```

### Get Stored User Data

```typescript
const user = await authService.getStoredUser();
if (user) {
  console.log('Welcome', user.firstName);
}
```

### Manual Logout

```typescript
await authService.logout();
navigation.navigate('Login');
```

### Get Current User from Server

```typescript
try {
  const user = await authService.getCurrentUser();
  console.log('Current user:', user);
} catch (error) {
  // Token invalid or expired
}
```

---

## Dependencies

```json
{
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.21.0"
}
```

Install with:
```bash
npm install axios @react-native-async-storage/async-storage
```

---

## Next Steps

1. **Profile Management**: Update user profile, change password
2. **Password Reset**: Forgot password flow
3. **Email Verification**: Verify email after registration
4. **Biometric Auth**: Face ID / Touch ID integration
5. **Session Management**: Handle multiple device sessions
6. **OAuth Integration**: Google, Microsoft login

---

## Troubleshooting

### Common Issues

**1. Network Error on Emulator**
- **Android**: Use `10.0.2.2` instead of `localhost`
- **iOS**: Use `localhost` or your machine's IP

**2. CORS Errors**
- Ensure backend CORS is configured for mobile app
- Check `Access-Control-Allow-Origin` header

**3. Token Refresh Loop**
- Check refresh token expiry
- Ensure refresh endpoint returns valid token
- Clear app storage and re-login

**4. AsyncStorage Not Working**
- Check permissions in AndroidManifest.xml
- Verify AsyncStorage is properly installed

---

## Security Best Practices

✅ **Implemented**:
- Passwords never logged
- Tokens stored securely in AsyncStorage
- HTTPS in production
- Token expiry handling
- Automatic token refresh

🔜 **Recommended**:
- Implement certificate pinning
- Use encrypted storage (react-native-keychain)
- Implement biometric authentication
- Add rate limiting on backend
- Implement account lockout after failed attempts

---

**Status**: ✅ Authentication API Integration Complete

**Last Updated**: December 10, 2025
