# DateTimePicker Setup & Usage Guide

## ✅ Package Installed
```json
"@react-native-community/datetimepicker": "8.4.4"
```

## 🔧 If You're Getting Native Module Error

### **Solution 1: Rebuild Native Modules (Recommended)**
```bash
# Stop the running app (Ctrl+C in terminal)
npx expo prebuild --clean
npx expo run:android  # or npx expo run:ios
```

### **Solution 2: Reinstall & Rebuild**
```bash
npm uninstall @react-native-community/datetimepicker
npx expo install @react-native-community/datetimepicker
npx expo prebuild --clean
npx expo run:android  # or npx expo run:ios
```

### **Solution 3: Clear All Caches**
```bash
# Stop app
npx expo start -c  # Clear metro cache
# Then in a new terminal:
cd android
./gradlew clean  # Clean Android build
cd ..
npx expo run:android
```

---

## 📱 DateTimePicker Props & Options

### **Basic Usage**
```tsx
import DateTimePicker from '@react-native-community/datetimepicker';

<DateTimePicker
  value={dueDate}
  mode="datetime"
  display="default"
  onChange={handleDateChange}
  minimumDate={new Date()}
/>
```

### **All Available Props**

#### **Required Props:**
| Prop | Type | Description |
|------|------|-------------|
| `value` | `Date` | The currently selected date |
| `onChange` | `(event, date?) => void` | Callback when date changes |

#### **Optional Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'date' \| 'time' \| 'datetime' \| 'countdown'` | `'date'` | Type of picker |
| `display` | See below | `'default'` | How picker is displayed |
| `minimumDate` | `Date` | - | Minimum selectable date |
| `maximumDate` | `Date` | - | Maximum selectable date |
| `locale` | `string` | Device locale | Locale for formatting (e.g., 'en-US') |
| `timeZoneOffsetInMinutes` | `number` | Device timezone | Timezone offset |
| `minuteInterval` | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 10 \| 12 \| 15 \| 20 \| 30` | `1` | Minute interval (iOS) |
| `is24Hour` | `boolean` | Device setting | 24-hour format (Android) |
| `textColor` | `string` | System | Text color (iOS) |
| `accentColor` | `string` | System | Accent color (Android 13+) |
| `themeVariant` | `'light' \| 'dark'` | System | Theme variant |

---

## 🎨 Display Modes (Platform-Specific)

### **iOS Display Options:**
```tsx
display="default"   // Native iOS picker (recommended)
display="spinner"   // Classic wheel picker
display="compact"   // Compact button picker (iOS 14+)
display="inline"    // Inline calendar (iOS 14+)
```

### **Android Display Options:**
```tsx
display="default"   // Material Design dialog (recommended)
display="spinner"   // Old-style spinner (Android < 5.0)
display="calendar"  // Calendar view for dates
display="clock"     // Clock view for time
```

---

## 💡 Implementation Examples

### **Example 1: Date Only (Simple)**
```tsx
const [date, setDate] = useState(new Date());
const [show, setShow] = useState(false);

const onChange = (event: any, selectedDate?: Date) => {
  setShow(false);
  if (selectedDate) {
    setDate(selectedDate);
  }
};

return (
  <>
    <TouchableOpacity onPress={() => setShow(true)}>
      <Text>{date.toDateString()}</Text>
    </TouchableOpacity>
    
    {show && (
      <DateTimePicker
        value={date}
        mode="date"
        display="default"
        onChange={onChange}
      />
    )}
  </>
);
```

### **Example 2: Date + Time (Combined)**
```tsx
const [datetime, setDatetime] = useState(new Date());
const [show, setShow] = useState(false);

const onChange = (event: any, selectedDate?: Date) => {
  if (Platform.OS === 'android') {
    setShow(false);
  }
  if (event.type === 'set' && selectedDate) {
    setDatetime(selectedDate);
    if (Platform.OS === 'ios') {
      setShow(false);
    }
  }
};

return (
  <>
    <TouchableOpacity onPress={() => setShow(true)}>
      <Text>
        {datetime.toLocaleDateString()} at {datetime.toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
    
    {show && (
      <DateTimePicker
        value={datetime}
        mode="datetime"
        display="default"
        onChange={onChange}
        minimumDate={new Date()}
      />
    )}
  </>
);
```

### **Example 3: Separate Date & Time Pickers**
```tsx
const [date, setDate] = useState(new Date());
const [showDate, setShowDate] = useState(false);
const [showTime, setShowTime] = useState(false);

return (
  <>
    {/* Date Picker */}
    <TouchableOpacity onPress={() => setShowDate(true)}>
      <Text>Date: {date.toLocaleDateString()}</Text>
    </TouchableOpacity>
    {showDate && (
      <DateTimePicker
        value={date}
        mode="date"
        display="calendar"
        onChange={(e, d) => {
          setShowDate(false);
          if (d) setDate(d);
        }}
      />
    )}
    
    {/* Time Picker */}
    <TouchableOpacity onPress={() => setShowTime(true)}>
      <Text>Time: {date.toLocaleTimeString()}</Text>
    </TouchableOpacity>
    {showTime && (
      <DateTimePicker
        value={date}
        mode="time"
        display="clock"
        onChange={(e, d) => {
          setShowTime(false);
          if (d) setDate(d);
        }}
      />
    )}
  </>
);
```

### **Example 4: With Validation (Your Use Case)**
```tsx
const [dueDate, setDueDate] = useState(new Date());
const [showPicker, setShowPicker] = useState(false);

const handleDateChange = (event: any, selectedDate?: Date) => {
  // Hide picker on Android after selection
  if (Platform.OS === 'android') {
    setShowPicker(false);
  }
  
  // Handle date selection
  if (event.type === 'set' && selectedDate) {
    // Validate: must be in future
    if (selectedDate > new Date()) {
      setDueDate(selectedDate);
    } else {
      Alert.alert('Error', 'Due date must be in the future');
    }
    
    // Hide picker on iOS after selection
    if (Platform.OS === 'ios') {
      setShowPicker(false);
    }
  } else if (event.type === 'dismissed') {
    // User cancelled
    setShowPicker(false);
  }
};

return (
  <TouchableOpacity onPress={() => setShowPicker(true)}>
    <Text>{dueDate.toLocaleString()}</Text>
  </TouchableOpacity>
  
  {showPicker && (
    <DateTimePicker
      value={dueDate}
      mode="datetime"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={handleDateChange}
      minimumDate={new Date()}
      minuteInterval={15}
      locale="en-US"
    />
  )}
);
```

---

## 📱 Platform Differences

### **iOS:**
- Picker shows inline or as a modal bottom sheet
- `spinner` mode shows the classic iOS wheel
- `onChange` fires continuously as user scrolls
- Must manually hide the picker on iOS

### **Android:**
- Picker shows as a Material Design dialog
- Dialog auto-dismisses when user confirms/cancels
- `onChange` only fires when user confirms (event.type === 'set')
- No need to manually hide on Android (auto-hides)

---

## 🎯 Best Practices

### **1. Always Check Event Type**
```tsx
const onChange = (event: any, date?: Date) => {
  if (event.type === 'set' && date) {
    // User confirmed selection
    setDate(date);
  } else if (event.type === 'dismissed') {
    // User cancelled (Android)
  }
  setShow(false);
};
```

### **2. Platform-Specific Display**
```tsx
<DateTimePicker
  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
  // iOS gets spinner, Android gets default dialog
/>
```

### **3. Validation**
```tsx
minimumDate={new Date()}  // Can't select past dates
maximumDate={new Date(2030, 11, 31)}  // Max date limit
```

### **4. Formatting**
```tsx
const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: "TurboModuleRegistry.getEnforcing(...): 'RNCDatePicker' could not be found"**

**Solution:**
```bash
# Stop app
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### **Issue 2: Picker not showing on Android**

**Reason:** Android auto-dismisses the picker
**Solution:** Check `event.type` in onChange:
```tsx
if (event.type === 'set') {
  // Handle confirmed date
}
```

### **Issue 3: Date validation not working**

**Solution:** Add validation in onChange:
```tsx
if (selectedDate && selectedDate > new Date()) {
  setDate(selectedDate);
} else {
  Alert.alert('Error', 'Invalid date');
}
```

### **Issue 4: Time not updating properly**

**Solution:** Use `datetime` mode instead of separate pickers:
```tsx
mode="datetime"  // Instead of mode="time"
```

---

## 🚀 Your Current Implementation (AddAssessmentScreen)

Your current setup in `AddAssessmentScreen.tsx`:

```tsx
// State
const [dueDate, setDueDate] = useState(new Date());
const [showDatePicker, setShowDatePicker] = useState(false);

// Handler (Now Fixed ✅)
const handleDateChange = (event: any, selectedDate?: Date) => {
  if (Platform.OS === "android") {
    setShowDatePicker(false);
  }
  
  if (event.type === "set" && selectedDate) {
    setDueDate(selectedDate);
    if (Platform.OS === "ios") {
      setShowDatePicker(false);
    }
  } else if (event.type === "dismissed") {
    setShowDatePicker(false);
  }
};

// UI
<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <Text>{formatDate(dueDate)}</Text>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={dueDate}
    mode="datetime"
    display={Platform.OS === "ios" ? "spinner" : "default"}
    onChange={handleDateChange}
    minimumDate={new Date()}
  />
)}
```

**✅ This is now properly configured!**

---

## 📋 Quick Troubleshooting Checklist

- [ ] Package installed? `npm list @react-native-community/datetimepicker`
- [ ] Native modules linked? `npx expo prebuild --clean`
- [ ] App restarted after prebuild? `npx expo run:android`
- [ ] Using development build (not Expo Go)?
- [ ] Check platform-specific handling in `onChange`
- [ ] Picker visibility state managed correctly?

---

## 📚 Official Documentation

- **GitHub:** https://github.com/react-native-datetimepicker/datetimepicker
- **Expo Docs:** https://docs.expo.dev/versions/latest/sdk/date-time-picker/

---

**Your implementation is now complete and follows best practices! 🎉**
