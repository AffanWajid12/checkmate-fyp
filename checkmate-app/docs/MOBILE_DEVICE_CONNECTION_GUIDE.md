# Mobile Device to Laptop Server Connection Guide

## 🎯 The Problem

Your mobile device and laptop are two separate devices on the same network. The mobile device cannot use `localhost` or `127.0.0.1` because that refers to the device itself, not your laptop.

## ✅ The Solution

Use your laptop's **local network IP address** instead.

---

## Step 1: Find Your Laptop's IP Address

### On Windows (PowerShell or CMD):
```powershell
ipconfig
```

**Look for**: "Wireless LAN adapter Wi-Fi" or "Ethernet adapter"
**Find**: "IPv4 Address"

**Example Output**:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100  ← This is your IP!
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
```

### Quick PowerShell Command (Copy-Paste Ready):
```powershell
(Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi").IPAddress
```

### Alternative - Using GUI:
1. Open **Settings** → **Network & Internet**
2. Click **Properties** under your Wi-Fi network
3. Scroll down to find **IPv4 address**

---

## Step 2: Update Your Mobile App Configuration

Edit: `services/api/config.ts`

**BEFORE** (Won't work on physical device):
```typescript
const API_BASE_URL = __DEV__
  ? 'http://localhost:5000'
  : 'https://api.checkmate.edu';
```

**AFTER** (Replace with your laptop's IP):
```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000'  // ← Replace with YOUR laptop's IP
  : 'https://api.checkmate.edu';
```

---

## Step 3: Configure Your Backend Server

Your Node.js server must listen on `0.0.0.0` (all network interfaces), not just `localhost`.

### Express.js Example:

**BEFORE** (Only works locally):
```javascript
app.listen(5000, 'localhost', () => {
  console.log('Server running on localhost:5000');
});
```

**AFTER** (Works on network):
```javascript
app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on http://0.0.0.0:5000');
  console.log('Access from network: http://YOUR_IP:5000');
});
```

Or simply:
```javascript
app.listen(5000, () => {
  console.log('Server running on port 5000');
});
```

---

## Step 4: Configure Windows Firewall

Windows Firewall may block incoming connections on port 5000.

### Option A: Allow Node.js through Firewall (Recommended)

1. Open **Windows Defender Firewall**
2. Click **Allow an app or feature through Windows Defender Firewall**
3. Click **Change settings** → **Allow another app**
4. Browse to: `C:\Program Files\nodejs\node.exe`
5. Click **Add** → Check both **Private** and **Public**
6. Click **OK**

### Option B: Allow Port 5000 (Alternative)

**PowerShell (Run as Administrator)**:
```powershell
New-NetFirewallRule -DisplayName "Node.js Server Port 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

### Option C: Temporarily Disable Firewall (Testing Only)
1. Open **Windows Security** → **Firewall & network protection**
2. Click on your active network
3. Turn off **Windows Defender Firewall**
4. **⚠️ Remember to turn it back on after testing!**

---

## Step 5: Ensure Both Devices on Same Network

**Critical**: Your laptop and mobile device MUST be on the same Wi-Fi network.

### Check on Mobile Device:
- Settings → Wi-Fi
- Verify connected to same network as laptop

### Check on Laptop:
- Settings → Network & Internet → Wi-Fi
- Verify network name matches mobile device

**⚠️ Won't Work If**:
- Mobile on cellular data
- Mobile on different Wi-Fi network
- Mobile on guest Wi-Fi (guest networks are isolated)
- Using VPN on either device

---

## Step 6: Test the Connection

### Test 1: Ping from Mobile Device

**iOS**: Use an app like "Network Ping Lite"
**Android**: Use built-in Network Utilities or "PingTools"

Ping: `192.168.1.100` (your laptop's IP)

**Expected**: Reply from laptop

### Test 2: Test from Mobile Browser

Open mobile browser and navigate to:
```
http://192.168.1.100:5000
```

**Expected**: Your backend should respond (might be an error page if no root route, but connection works)

### Test 3: Use the Test Button in App

1. Open your CheckMate app
2. Go to Login screen
3. Tap **"Test API Connection"**
4. Should show: ✅ "API server is reachable"

---

## Step 7: Update and Restart Everything

### 1. Update config in mobile app:
```typescript
// services/api/config.ts
const API_BASE_URL = 'http://YOUR_LAPTOP_IP:5000';
```

### 2. Restart Expo (Clear Cache):
```powershell
# Stop Expo (Ctrl+C)
npx expo start --clear
```

### 3. Restart Backend Server:
```powershell
# Stop server (Ctrl+C)
# Start again
npm start
```

### 4. Reload App on Device:
- Shake device → Reload
- Or close and reopen Expo Go app

---

## 🧪 Complete Test Procedure

### 1. Check Backend is Running:
```powershell
# On laptop, you should see:
Server running on port 5000
MongoDB connected
```

### 2. Check Backend from Laptop Browser:
```
http://localhost:5000/api/auth/health
```
Should work.

### 3. Check Backend from Mobile Browser:
```
http://192.168.1.100:5000/api/auth/health
```
Should also work. If not, firewall issue.

### 4. Check from Mobile App:
- Open app
- Tap "Test API Connection"
- Check logs in Metro bundler

### 5. Watch Metro Logs:
```
🚀 API Request: POST http://192.168.1.100:5000/api/auth/login
✅ API Response: 200 { success: true }
```

---

## 🔍 Troubleshooting

### Issue 1: "Network Error" - Cannot Connect

**Possible Causes**:
1. Wrong IP address
2. Firewall blocking port 5000
3. Backend not listening on 0.0.0.0
4. Different networks
5. Backend not running

**Solutions**:
```powershell
# 1. Verify IP address
ipconfig

# 2. Check if port 5000 is open
netstat -an | findstr :5000

# 3. Test with curl from another device
curl http://192.168.1.100:5000

# 4. Temporarily disable firewall to test
# Windows Security → Firewall → Turn off (temporarily)

# 5. Restart backend with verbose logging
npm start
```

### Issue 2: IP Address Keeps Changing

**Cause**: Router assigns dynamic IPs

**Solution**: Set Static IP in router or use hostname

**Quick Fix**: Just update the IP in `config.ts` when it changes

### Issue 3: Works on Laptop Browser but Not Mobile

**Cause**: Firewall is blocking external connections

**Solution**:
1. Allow Node.js through Windows Firewall (see Step 4)
2. Or disable firewall temporarily for testing

### Issue 4: "Connection Refused"

**Cause**: Backend not listening on all interfaces

**Solution**: Change backend to listen on `0.0.0.0`:
```javascript
app.listen(5000, '0.0.0.0', () => {
  console.log('Server on 0.0.0.0:5000');
});
```

---

## 📝 Quick Setup Checklist

- [ ] Find laptop IP with `ipconfig`
- [ ] Update `services/api/config.ts` with laptop IP
- [ ] Backend listens on `0.0.0.0` or all interfaces
- [ ] Allow Node.js through Windows Firewall
- [ ] Both devices on same Wi-Fi network
- [ ] Restart Expo with `--clear` flag
- [ ] Restart backend server
- [ ] Test connection button in app works
- [ ] Check logs in Metro bundler terminal

---

## 🎯 Expected Configuration

### Mobile App (`services/api/config.ts`):
```typescript
const API_BASE_URL = __DEV__
  ? 'http://192.168.1.100:5000'  // Your laptop's IP
  : 'https://api.checkmate.edu';
```

### Backend Server:
```javascript
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from network: http://192.168.1.100:${PORT}`);
});
```

### Windows Firewall:
- Node.js allowed for inbound connections
- Port 5000 allowed (TCP)

---

## 💡 Pro Tips

### Tip 1: Use Environment Variable

Create `.env` file in mobile app:
```env
API_URL=http://192.168.1.100:5000
```

Then use:
```typescript
import Constants from 'expo-constants';

const API_BASE_URL = __DEV__
  ? (Constants.expoConfig?.extra?.apiUrl || 'http://192.168.1.100:5000')
  : 'https://api.checkmate.edu';
```

### Tip 2: Backend Shows Network Address

Add this to your backend startup:
```javascript
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(5000, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log(`Local:   http://localhost:5000`);
  console.log(`Network: http://${ip}:5000`);
});
```

### Tip 3: Test with Postman First

Before testing in app:
1. Open Postman on mobile device
2. POST to `http://YOUR_IP:5000/api/auth/login`
3. If works in Postman, should work in app

---

## 🚀 Final Test

After setup, you should see this flow:

### 1. Start Backend:
```powershell
cd path/to/backend
npm start
# Should show: Server running on 0.0.0.0:5000
```

### 2. Start Mobile App:
```powershell
npx expo start --clear
```

### 3. Open on Physical Device:
- Scan QR code with Expo Go

### 4. Tap "Test API Connection":
```
✅ Connection Success
API server is reachable
Base URL: http://192.168.1.100:5000
```

### 5. Try Login:
```
Metro Logs:
🚀 API Request: POST http://192.168.1.100:5000/api/auth/login
✅ API Response: 200 { success: true }
✅ Login successful!
```

---

## 📚 Summary

**The Key Point**: Physical devices cannot use `localhost`. They need your laptop's network IP address.

**Required Changes**:
1. ✅ Use laptop's IP in mobile app config
2. ✅ Backend listens on `0.0.0.0`
3. ✅ Allow through Windows Firewall
4. ✅ Same Wi-Fi network

**Test Command**:
```powershell
# From mobile browser, should work:
http://YOUR_LAPTOP_IP:5000
```

---

**Need Your Laptop's IP?** Run this in PowerShell:
```powershell
ipconfig | Select-String -Pattern "IPv4"
```

Look for the address like `192.168.1.100` or `192.168.0.X` or `10.0.0.X`
