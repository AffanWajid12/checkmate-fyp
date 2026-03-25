# API Testing Implementation - Summary

## ✅ What Was Added

### 1. Enhanced Logging in API Client (`services/api/config.ts`)
- ✅ Request interceptor logs all outgoing API calls
- ✅ Response interceptor logs all responses and errors
- ✅ Emoji-prefixed logs for easy identification
- ✅ Detailed request/response information

**Log Format**:
```
🚀 API Request: POST http://localhost:5000/api/auth/login
✅ API Response: 200 { success: true, data: {...} }
❌ API Error: Network Error
```

---

### 2. API Test Utilities (`services/api/testUtils.ts`)
New utility functions for testing:

- ✅ `testConnection()` - Check if API server is reachable
- ✅ `testLogin()` - Test login endpoint directly  
- ✅ `testRegister()` - Test register endpoint directly
- ✅ `logConfig()` - Log current API configuration

**Usage**:
```typescript
import { apiTestUtils } from '@/services/api';

// Test connection
await apiTestUtils.testConnection();

// Log config
apiTestUtils.logConfig();
```

---

### 3. Test Button in Login Screen
- ✅ "Test API Connection" button added to LoginScreen
- ✅ Shows alert with connection status
- ✅ Displays Base URL and error details
- ✅ Icon indicator (WiFi symbol)

**What It Tests**:
- Can reach the backend server
- Correct API URL configuration
- Network connectivity
- Firewall issues

---

### 4. Enhanced Login Logging
Added detailed logs throughout login flow:
```typescript
🔐 Starting login process...
📧 Email: test@example.com
🚀 API Request: POST /api/auth/login
✅ API Response: 200
✅ Login successful!
👤 User: test@example.com John
```

---

### 5. Comprehensive Testing Guide (`API_TESTING_GUIDE.md`)
Complete 13-section guide covering:
- Configuration setup
- Testing methods
- Common issues & solutions
- Platform-specific fixes
- Debugging checklist
- Log interpretation

---

## 🚀 How to Test

### Step 1: Update API URL

Edit `services/api/config.ts`:

```typescript
const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:5000'  // Android Emulator
  : 'https://api.checkmate.edu';
```

**Platform-specific URLs**:
- **Android Emulator**: `http://10.0.2.2:5000`
- **iOS Simulator**: `http://localhost:5000`
- **Physical Device**: `http://YOUR_IP:5000` (use `ipconfig` to find IP)

---

### Step 2: Start Backend Server

```bash
cd path/to/backend
npm start
```

Verify it's running:
```
Server is running on http://localhost:5000
MongoDB connected successfully
```

---

### Step 3: Start Mobile App

```bash
npx expo start
```

---

### Step 4: Test Connection

**Option A - Use Test Button**:
1. Open app
2. Go to Login screen
3. Tap "Test API Connection"
4. Check alert message

**Option B - Check Logs**:
1. Open Metro bundler terminal
2. Try to login
3. Watch for logs:
   ```
   🚀 API Request: POST ...
   ✅ API Response: 200
   ```

---

## 📊 What Logs to Look For

### ✅ Success - Everything Working:
```
⚙️ API Configuration: http://10.0.2.2:5000
🔐 Starting login process...
🚀 API Request: POST /api/auth/login
✅ API Response: 200 { success: true }
✅ Login successful!
```

### ❌ Network Error - Cannot Reach API:
```
🚀 API Request: POST /api/auth/login
❌ API Error: Network Error (ERR_NETWORK)
```

**Fix**: 
- Check API URL (use `10.0.2.2` for Android)
- Ensure backend is running
- Check firewall

### ❌ Timeout Error:
```
🚀 API Request: POST /api/auth/login
❌ API Error: Request timeout (ECONNABORTED)
```

**Fix**:
- Backend is slow or not responding
- Check backend logs for errors

### ❌ 401 Unauthorized:
```
🚀 API Request: POST /api/auth/login
❌ API Error: 401 Invalid credentials
```

**Fix**:
- Check email/password
- Verify user exists in database

---

## 🐛 Common Issues

### Issue 1: "Cannot connect" on Android Emulator
**Solution**: Use `http://10.0.2.2:5000` not `localhost`

### Issue 2: "Network Error" on Physical Device
**Solutions**:
- Use computer's IP: `http://192.168.1.X:5000`
- Ensure same WiFi network
- Check firewall settings

### Issue 3: No logs appearing
**Solution**:
- Check Metro bundler terminal (not Expo Go app)
- Logs appear where you ran `npx expo start`

---

## 🧪 Test Commands

### From App (React Native Debugger Console):
```javascript
import { apiTestUtils } from '@/services/api';

// Test connection
await apiTestUtils.testConnection();

// View config
apiTestUtils.logConfig();
```

### From Terminal (cURL):
```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📋 Testing Checklist

Before reporting an issue, verify:

- [ ] Backend server is running
- [ ] Correct API_BASE_URL in config.ts
- [ ] Using `10.0.2.2` for Android Emulator
- [ ] Using computer's IP for physical device
- [ ] Firewall allows port 5000
- [ ] Metro bundler is running
- [ ] Checked logs in Metro terminal
- [ ] Tried "Test API Connection" button

---

## 📁 Files Modified

1. ✅ `services/api/config.ts` - Enhanced logging
2. ✅ `services/api/testUtils.ts` - New test utilities
3. ✅ `services/api/index.ts` - Export test utils
4. ✅ `components/auth/LoginScreen.tsx` - Test button & logs
5. ✅ `API_TESTING_GUIDE.md` - Complete testing guide

---

## 🎯 Next Steps

1. **Update API URL** in `services/api/config.ts`
2. **Start backend** server
3. **Run app** with `npx expo start`
4. **Tap "Test API Connection"** button
5. **Check logs** in Metro terminal
6. **Try login** with real credentials

---

## 💡 Pro Tips

### Enable Remote Debugging:
1. Shake device
2. Select "Debug" → Opens Chrome DevTools
3. View console logs there

### Clear Cache if Issues:
```bash
npx expo start --clear
```

### View Network in Chrome:
1. Enable remote debugging
2. Go to Chrome DevTools → Network tab
3. See all API requests

---

**Status**: ✅ API Testing Tools Ready!

Use the "Test API Connection" button to verify your backend is reachable. All requests are logged with emojis in Metro terminal for easy debugging.

**Current API URL**: Check `services/api/config.ts`

**Need to change it?** Update the `API_BASE_URL` constant.
