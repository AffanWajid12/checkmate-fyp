# API Endpoint Testing Guide

## 🧪 How to Test If API Endpoints Are Hitting

This guide will help you verify that your mobile app is successfully connecting to your backend API.

---

## 1. Check Current Configuration

### View Your API Base URL

Open `services/api/config.ts` and find:
```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:5000' // ← Check this URL
  : 'https://api.checkmate.edu';
```

### Common Configurations:

**Local Development (Same Machine)**:
```typescript
const API_BASE_URL = 'http://localhost:5000';
```

**Android Emulator**:
```typescript
const API_BASE_URL = 'http://10.0.2.2:5000'; // Special IP for Android emulator
```

**iOS Simulator**:
```typescript
const API_BASE_URL = 'http://localhost:5000';
```

**Physical Device (Same Network)**:
```typescript
const API_BASE_URL = 'http://192.168.1.X:5000'; // Replace X with your computer's IP
```

**Find Your Computer's IP Address**:
- Windows: Open CMD and type `ipconfig` → Look for "IPv4 Address"
- Mac/Linux: Open Terminal and type `ifconfig` → Look for "inet"

---

## 2. Start Your Backend Server

Before testing, ensure your backend is running:

```bash
cd path/to/backend
npm start
```

You should see something like:
```
Server is running on http://localhost:5000
MongoDB connected successfully
```

---

## 3. Test Using the Mobile App

### Option A: Use the Test Button (Easiest)

1. **Start your Expo app**:
   ```bash
   npx expo start
   ```

2. **Open the app** on your device/emulator

3. **On Login Screen**, tap the **"Test API Connection"** button

4. **Check the result**:
   - ✅ **Success**: "API server is reachable"
   - ❌ **Failed**: Shows specific error and troubleshooting tips

### Option B: Try to Login

1. Enter any email and password
2. Tap "Login"
3. Check the Metro bundler terminal for logs:

```
🔐 Starting login process...
📧 Email: test@example.com
🚀 API Request: POST http://localhost:5000/api/auth/login
✅ API Response: { success: true, data: {...} }
```

OR if it fails:

```
❌ API Error: { status: undefined, message: 'Network Error' }
```

---

## 4. Check Logs in Metro Bundler

All API requests are logged with emojis for easy debugging:

### Successful Request:
```
🚀 API Request:
  method: POST
  url: /api/auth/login
  fullURL: http://localhost:5000/api/auth/login
  data: { email: "test@example.com", password: "***" }

✅ API Response:
  status: 200
  data: { success: true, data: {...} }
```

### Failed Request:
```
🚀 API Request:
  method: POST
  url: /api/auth/login
  fullURL: http://localhost:5000/api/auth/login

❌ API Error:
  status: undefined
  message: "Network Error"
  code: "ERR_NETWORK"
```

---

## 5. Common Issues and Solutions

### ❌ Issue 1: "Network Error"

**Cause**: Cannot reach the backend server

**Solutions**:
1. **Check if backend is running**
   - Open browser: `http://localhost:5000` (should show something)
   
2. **Update API URL for your platform**:
   
   **Android Emulator**:
   ```typescript
   const API_BASE_URL = 'http://10.0.2.2:5000';
   ```
   
   **Physical Device**:
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP:5000'; // Get IP from ipconfig/ifconfig
   ```

3. **Check firewall**: Allow port 5000 through your firewall

4. **Restart Expo**:
   ```bash
   # Stop Expo (Ctrl+C)
   # Clear cache
   npx expo start --clear
   ```

---

### ❌ Issue 2: "Request Timeout"

**Cause**: Backend is slow or unreachable

**Solutions**:
1. Check backend logs for errors
2. Increase timeout in `services/api/config.ts`:
   ```typescript
   timeout: 60000, // Increase from 30000 to 60000
   ```

---

### ❌ Issue 3: "401 Unauthorized"

**Cause**: Invalid credentials or token issues

**Solutions**:
1. **Check if user exists** in your database
2. **Try registering** a new user first
3. **Clear app storage**:
   - Android: Settings → Apps → CheckMate → Clear Storage
   - iOS: Delete app and reinstall

---

### ❌ Issue 4: "CORS Error" (Web only)

**Cause**: Backend not configured for cross-origin requests

**Solution**: Add CORS to your backend:
```javascript
// Express.js example
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:19000', 'exp://localhost:8081'],
  credentials: true
}));
```

---

### ❌ Issue 5: "Cannot connect on Android Emulator"

**Cause**: `localhost` doesn't work in Android emulator

**Solution**: Use special Android emulator IP:
```typescript
const API_BASE_URL = 'http://10.0.2.2:5000';
```

---

### ❌ Issue 6: "Cannot connect on Physical Device"

**Cause**: Device and computer on different networks or IP wrong

**Solutions**:
1. **Ensure same WiFi network**
   - Computer and phone on same WiFi
   
2. **Get your computer's IP**:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   
3. **Update API URL**:
   ```typescript
   const API_BASE_URL = 'http://192.168.1.100:5000'; // Use your IP
   ```

4. **Check firewall**: Allow incoming connections on port 5000

---

## 6. Test API Endpoints Programmatically

### From React Native Debugger Console:

```javascript
import { apiTestUtils } from '@/services/api';

// Test connection
await apiTestUtils.testConnection();

// Test login endpoint
await apiTestUtils.testLogin('test@example.com', 'password123');

// Test register endpoint
await apiTestUtils.testRegister();

// Log configuration
apiTestUtils.logConfig();
```

---

## 7. Test Using cURL (Backend Verification)

Test your backend directly from terminal:

### Test Health Check:
```bash
curl http://localhost:5000/api/auth/health
```

### Test Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"Password123",
    "firstName":"Test",
    "lastName":"User",
    "role":"professor"
  }'
```

---

## 8. Test Using Postman

1. Open Postman
2. Create a new request:
   - **Method**: POST
   - **URL**: `http://localhost:5000/api/auth/login`
   - **Headers**: `Content-Type: application/json`
   - **Body** (raw JSON):
   ```json
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```
3. Click "Send"
4. Check response

---

## 9. Debugging Checklist

Use this checklist to debug connection issues:

- [ ] Backend server is running (`npm start`)
- [ ] Backend shows "Server running on port 5000"
- [ ] MongoDB/Database is connected
- [ ] Correct API URL in `services/api/config.ts`
- [ ] Using `10.0.2.2` for Android Emulator
- [ ] Using computer's IP for physical device
- [ ] Computer and device on same WiFi network
- [ ] Firewall allows port 5000
- [ ] Backend has CORS configured (if testing on web)
- [ ] Metro bundler is running
- [ ] No error in Metro bundler terminal
- [ ] Expo app is refreshed after code changes

---

## 10. Expected Log Flow for Successful Login

### 1. App Starts
```
⚙️ API Configuration:
  Base URL: http://10.0.2.2:5000
  Environment: Development
```

### 2. User Taps Login
```
🔐 Starting login process...
📧 Email: test@example.com
```

### 3. Request Sent
```
🚀 API Request:
  method: POST
  url: /api/auth/login
  fullURL: http://10.0.2.2:5000/api/auth/login
  data: { email: "test@example.com", password: "***" }
```

### 4. Response Received
```
✅ API Response:
  status: 200
  data: {
    success: true,
    data: {
      user: { id: "...", email: "test@example.com" },
      token: "eyJhbGc...",
      refreshToken: "eyJhbGc..."
    }
  }
```

### 5. Login Complete
```
✅ Login successful!
👤 User: test@example.com Test
```

---

## 11. Quick Test Script

Create a test file: `test-api.js`

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testAPI() {
  try {
    console.log('Testing API at:', API_BASE_URL);
    
    // Test login
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ API is working!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();
```

Run it:
```bash
node test-api.js
```

---

## 12. Enable Detailed Logging

All logging is already enabled in:
- `services/api/config.ts` - Request/Response interceptors
- `services/api/authService.ts` - Service methods
- `components/auth/LoginScreen.tsx` - Login flow

**To see logs**:
1. Open Metro bundler terminal (where you ran `npx expo start`)
2. Look for emoji-prefixed logs
3. All requests/responses are automatically logged

---

## 13. Summary

### ✅ API is Working When You See:
- ✅ Green checkmark in test button alert
- ✅ `API Response: { success: true }` in logs
- ✅ User navigates to MainTabs screen
- ✅ Token saved in AsyncStorage

### ❌ API is NOT Working When You See:
- ❌ "Network Error" in logs
- ❌ "Cannot reach API" in alert
- ❌ Request timeout
- ❌ No response in logs

---

## Need Help?

1. **Check logs** in Metro bundler first
2. **Test with cURL** to verify backend works
3. **Use test button** in app to diagnose
4. **Check firewall** and network settings
5. **Verify API URL** matches your setup

---

**Status**: Testing tools ready! 🚀

Use the "Test API Connection" button on the Login screen to verify your API is reachable.
