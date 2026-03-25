# Quick Test Guide - Course Navigation Feature

## ✅ **Status: READY TO TEST**

All errors fixed, files formatted, navigation wired up!

---

## 🚀 **How to Test**

### **1. Start the Development Server**
```bash
cd "c:\Users\Administrator\Desktop\Uni\Semester 7\FYP-1\CheckMate-Mobile-App\checkmate-app"
npm start
```

### **2. Run on Device/Emulator**
- Press `a` for Android
- Press `i` for iOS (if on Mac)
- Or scan QR code with Expo Go app

---

## 🧪 **Test Scenarios**

### **Scenario 1: View Courses List**
1. Navigate: Get Started → Login (or Sign Up)
2. You should see the Courses tab (bottom navigation)
3. Verify: List of 4 courses displays
   - Introduction to Psychology
   - Modern Art History
   - Calculus II
   - Fundamentals of Biology

**Expected:** 
- ✅ No "Text strings must be rendered" error
- ✅ Course cards display correctly
- ✅ Student counts visible

---

### **Scenario 2: Navigate to Course Detail**
1. From Courses list, tap any course card
2. Should navigate to Course Detail screen

**Expected:**
- ✅ Smooth transition to detail view
- ✅ Course title, code, and professor display
- ✅ Course icon shows
- ✅ Three action items visible:
  - Enrolled Students (with count)
  - Assessments (with count)
  - Course Materials
- ✅ Stream section with announcements
- ✅ Floating Action Button (FAB) visible
- ✅ FAB doesn't overlap bottom tab bar

---

### **Scenario 3: Back Navigation**
1. From Course Detail, tap back arrow (top-left)
2. Should return to Courses list

**Expected:**
- ✅ Returns to course list
- ✅ List state preserved

---

### **Scenario 4: Test All Courses**
Tap each course and verify:

**Introduction to Psychology**
- Code: PSY101
- Professor: Prof. Sarah Johnson
- Students: 84
- Assessments: 8

**Modern Art History**
- Code: ARH205
- Professor: Prof. David Martinez
- Students: 45
- Assessments: 6

**Calculus II**
- Code: MATH201
- Professor: Prof. Alan Turing
- Students: 112
- Assessments: 12

**Fundamentals of Biology**
- Code: BIO110
- Professor: Prof. Emily Chen
- Students: 98
- Assessments: 10

---

## 🐛 **What to Check**

### **No Errors:**
- [ ] No "Text strings must be rendered" errors
- [ ] No navigation errors
- [ ] No TypeScript compilation errors
- [ ] No blank screens

### **UI Looks Good:**
- [ ] Course cards properly formatted
- [ ] Course detail screen displays all sections
- [ ] Colors match theme (Teal #13B2A9, Dark #2C3E50)
- [ ] Spacing is consistent
- [ ] FAB positioned correctly above tab bar

### **Navigation Works:**
- [ ] Tapping course card navigates to detail
- [ ] Back button returns to list
- [ ] Bottom tabs remain visible
- [ ] Can switch between tabs and return

### **Touch Interactions:**
- [ ] Course cards respond to touch
- [ ] Back button works
- [ ] FAB is touchable (placeholder functionality)
- [ ] Action items are touchable (console logs)

---

## 📱 **Device-Specific Checks**

### **iOS:**
- [ ] Safe area insets working (notch/status bar)
- [ ] FAB not overlapping home indicator
- [ ] Smooth animations

### **Android:**
- [ ] Navigation bar spacing correct
- [ ] Status bar transparent/styled
- [ ] Back button works (hardware)

---

## 🔧 **If Issues Occur**

### **"Text strings must be rendered" Error**
```bash
# Re-format files
npx prettier --write components/courses/*.tsx navigation/*.tsx

# Restart Metro bundler
npm start -- --reset-cache
```

### **Navigation Error**
- Check `navigation/types.ts` - ViewCourse route defined?
- Check `RootNavigator.tsx` - ViewCourse screen registered?
- Restart app

### **Blank Screen**
- Check console for errors
- Verify course data in `ViewCoursesScreen.tsx`
- Check route params match type definition

---

## 📝 **Success Checklist**

After testing, confirm:
- [ ] App runs without crashes
- [ ] Can view all 4 courses
- [ ] Can navigate to course detail
- [ ] Can return to course list
- [ ] All UI elements visible
- [ ] No console errors
- [ ] Performance is smooth

---

## 🎉 **If Everything Works**

**Congratulations!** The course navigation feature is fully functional.

### **Next Development Steps:**
1. Connect to backend API
2. Implement students detail screen
3. Implement assessments list
4. Add course editing
5. Add course deletion
6. Add search/filter

---

## 📞 **Common Questions**

**Q: FAB overlaps tab bar?**
A: Check `useSafeAreaInsets` is imported and `insets.bottom` is used in FAB positioning

**Q: Course data not passing?**
A: Verify all fields match the `ViewCourse` type in `navigation/types.ts`

**Q: Whitespace error returns?**
A: Run Prettier again and check for `{" "}` or extra spaces between JSX tags

---

**Last Updated:** December 9, 2025
**Status:** ✅ All errors resolved, ready for testing
