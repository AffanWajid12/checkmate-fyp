 Document Scanner Implementation Guide

## Overview

The document scanner feature allows teachers to scan student papers directly from their mobile device, automatically organize scans by student, and export all submissions as a single PDF file.

## Features Implemented

✅ **Full-Screen Scanner Experience**
- Native document scanner integration
- Auto-scan on screen mount
- Real-time image preview

✅ **Student Management**
- Pre-loaded student list for the assessment
- Progress tracking (Student X of Y)
- Visual progress bar
- Student avatar and name display

✅ **Scan Management**
- Scan one paper per student
- Preview last scanned image
- Track total scans vs total students
- Next Student button with validation
- Auto-advance workflow

✅ **PDF Generation & Sharing**
- Combine all scans into single PDF
- Automatic file naming with assessment title and timestamp
- Native share dialog for exporting PDF
- Success/error handling

✅ **Mock Mode for Development**
- Works in Expo Go without native modules
- Generates placeholder scanned images
- Full UI testing without building native app

## Architecture

### Files Created/Modified

1. **`components/scanner/DocumentScannerScreen.tsx`** (NEW)
   - Full-screen scanner component
   - Student selection and progress tracking
   - PDF generation and sharing

2. **`navigation/types.ts`** (MODIFIED)
   - Added `DocumentScanner` route with params

3. **`navigation/RootNavigator.tsx`** (MODIFIED)
   - Registered DocumentScanner screen

4. **`components/courses/ViewAssessmentDetailScreen.tsx`** (MODIFIED)
   - Added navigation to scanner
   - Sample student data

## Dependencies

```json
{
  "react-native-document-scanner-plugin": "^0.6.0",
  "react-native-blob-util": "^0.19.11",
  "react-native-images-to-pdf": "^1.0.1",
  "expo-sharing": "~12.0.1"
}
```

## Usage Flow

### 1. Teacher opens Assessment Detail screen
```
ViewAssessmentDetailScreen → Taps "Scan Papers" button
```

### 2. Scanner Screen Opens
```
DocumentScannerScreen loads with:
- Student list from assessment
- First student auto-selected
- Scanner opens automatically
```

### 3. Scanning Workflow
```
For each student:
1. Scanner opens (native camera)
2. Teacher captures paper
3. System saves scan for current student
4. Teacher taps "Next Student"
5. System advances to next student
6. Repeat until all students scanned
```

### 4. Complete & Export
```
Teacher taps "Done" → 
Alert confirms scan count →
PDF generated from all scans →
Share dialog opens →
Teacher can save/share PDF
```

## Code Examples

### Navigate to Scanner

```typescript
const students = [
  { id: "1", name: "Jane Doe", avatar: require("../../assets/images/icon.png") },
  { id: "2", name: "John Smith", avatar: require("../../assets/images/icon.png") },
  // ...more students
];

navigation.navigate("DocumentScanner", {
  students,
  assessmentTitle: "Midterm Exam",
  assessmentId: "123",
});
```

### Scanner Component Structure

```typescript
<SafeAreaView>
  {/* Header with Back, Title, Done buttons */}
  <View style={styles.header}>
    <BackButton />
    <HeaderTitle />
    <DoneButton />
  </View>

  {/* Student Info Card */}
  <View style={styles.studentInfo}>
    <Avatar + Name />
    <ProgressBar />
    <ScannedCount />
  </View>

  {/* Image Preview */}
  <View style={styles.previewContainer}>
    <Image source={lastScannedImage} />
  </View>

  {/* Action Buttons */}
  <View style={styles.actions}>
    <ScanButton />
    <NextStudentButton />
  </View>
</SafeAreaView>
```

## Mock Mode (Expo Go)

The scanner automatically detects if native modules are available:

```typescript
let ScannerModule: any = null;
try {
  if (Platform.OS !== 'web') {
    ScannerModule = require('react-native-document-scanner-plugin').default;
  }
} catch (error) {
  console.log('Document scanner not available - will use mock mode');
}
```

When running in Expo Go:
- ✅ Full UI is functional
- ✅ Mock images are generated with placeholder URLs
- ✅ All workflows can be tested
- ❌ No real camera scanning
- ❌ No PDF generation

## Production Build

To use the real scanner, you need a native build:

### Option 1: EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview
```

### Option 2: Local Development Build

```bash
# Generate native folders
npx expo prebuild

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

### Required Permissions

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
```
✅ Already configured in your project

**iOS** (`ios/checkmate/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to scan student papers</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access to save scanned documents</string>
```

## Testing Guide

### Test in Expo Go (Mock Mode)

1. Start the dev server:
```bash
npx expo start
```

2. Scan QR code with Expo Go app

3. Navigate: Courses → Course Detail → Assessments → Assessment Detail

4. Tap "Scan Papers"

5. Scanner screen opens with mock mode alert

6. Tap OK to generate mock scan

7. Tap "Next Student" to advance

8. Tap "Done" when finished

9. Alert shows mock PDF message

### Test in Production Build

1. Build the app using EAS or local build

2. Install on physical device

3. Follow same navigation flow

4. Real camera scanner opens

5. Scan actual papers

6. PDF is generated and can be shared

## UI/UX Features

### Visual Design
- **Colors**: Teal primary (#13B2A9), Dark text (#2C3E50)
- **Border Radius**: 12px for cards
- **Shadows**: Elevation for important buttons
- **Typography**: Clear hierarchy with proper weights

### Progress Tracking
- Progress bar shows completion percentage
- Counter displays "Scanned: X/Y"
- Student info shows "Student X of Y"

### User Feedback
- Alerts for scan completion
- Disabled button states
- Loading indicator during PDF creation
- Success/error messages

### Validation
- Can't skip student without scanning
- Confirm before creating PDF
- Minimum 1 scan required to finish
- Clear error messages

## API Integration (Future)

To connect to a real backend:

```typescript
// Fetch students from API
const fetchStudents = async (assessmentId: string) => {
  const response = await fetch(`/api/assessments/${assessmentId}/students`);
  return response.json();
};

// Upload scan to server
const uploadScan = async (studentId: string, imageUri: string) => {
  const formData = new FormData();
  formData.append('scan', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'scan.jpg',
  });
  
  await fetch(`/api/submissions/${studentId}/upload`, {
    method: 'POST',
    body: formData,
  });
};

// Save PDF to server
const savePdfToServer = async (pdfUri: string, assessmentId: string) => {
  const formData = new FormData();
  formData.append('pdf', {
    uri: pdfUri,
    type: 'application/pdf',
    name: `assessment-${assessmentId}.pdf`,
  });
  
  await fetch(`/api/assessments/${assessmentId}/submissions`, {
    method: 'POST',
    body: formData,
  });
};
```

## Troubleshooting

### Issue: Scanner doesn't open in Expo Go
**Solution**: This is expected. Use mock mode for testing or build with EAS.

### Issue: PDF creation fails
**Solution**: Ensure `react-native-blob-util` and `react-native-images-to-pdf` are properly installed. Requires native build.

### Issue: Camera permission denied
**Solution**: Check AndroidManifest.xml and Info.plist have proper permissions. Reinstall app after adding permissions.

### Issue: Scanned image is low quality
**Solution**: Adjust scanner quality in options:
```typescript
await ScannerModule.scanDocument({
  croppedImageQuality: 100, // Increase quality (0-100)
  letUserAdjustCrop: true,
});
```

### Issue: Progress bar not updating
**Solution**: Check `scannedImages.length` is being updated correctly after each scan.

## Future Enhancements

- [ ] Bulk edit: Re-scan individual students
- [ ] Preview all scans before PDF generation
- [ ] Add student manually if missing from list
- [ ] Compress images before PDF creation
- [ ] Cloud storage integration (AWS S3, Google Drive)
- [ ] Offline mode with sync when online
- [ ] OCR text extraction from scans
- [ ] Auto-grading integration
- [ ] Batch upload multiple PDFs

## Related Documentation

- [ASSESSMENTS_IMPLEMENTATION.md](./ASSESSMENTS_IMPLEMENTATION.md)
- [ASSESSMENT_DETAIL_IMPLEMENTATION.md](./ASSESSMENT_DETAIL_IMPLEMENTATION.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review related documentation files
3. Check Expo documentation for native modules
4. Review react-native-document-scanner-plugin docs

---

**Last Updated**: December 10, 2025
**Status**: ✅ Fully Implemented & Tested
