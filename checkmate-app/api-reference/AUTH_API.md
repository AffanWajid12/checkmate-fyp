# Authentication API Documentation

## Overview
Complete authentication system with JWT tokens, role-based access control, and comprehensive test coverage.

## Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "professor@university.edu",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "professor",
  "department": "Computer Science"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "professor@university.edu",
      "firstName": "John",
      "lastName": "Doe",
      "role": "professor",
      "department": "Computer Science"
    },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 2. Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "professor@university.edu",
  "password": "Password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. Refresh Token
**POST** `/api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "expiresIn": 3600
  }
}
```

### 4. Get Current User
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "professor@university.edu",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "role": "professor"
  }
}
```

### 5. Logout
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Testing

Run all authentication tests:
```bash
npm test
```

Run specific test file:
```bash
npm test -- auth.test.js
```

Run with coverage:
```bash
npm run test:coverage
```

## Test Coverage
- ✅ User registration (professor, student, validation)
- ✅ User login (success, failure, inactive accounts)
- ✅ Token refresh (valid, invalid, expired)
- ✅ Get current user
- ✅ Logout
- ✅ Auth middleware (valid/invalid tokens)
- ✅ Role middleware (professor, student, admin)
- ✅ Password hashing
- ✅ Duplicate email/student number prevention

## Security Features
- Bcrypt password hashing (12 rounds)
- JWT access tokens (1 hour expiry)
- JWT refresh tokens (7 days expiry)
- Role-based access control
- Account deactivation support
- Token validation middleware
