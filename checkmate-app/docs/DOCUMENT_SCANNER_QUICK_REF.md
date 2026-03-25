# Document Scanner Quick Reference

## ✅ Integration Complete

### Package
```
react-native-document-scanner-plugin v2.0.2
```

### Location
```
ViewAssessmentDetailScreen.tsx → handleCaptureSubmission()
```

---

## 🚀 How to Use

### For Students:
1. Open any assessment
2. Tap the **"Capture"** FAB button (bottom-right)
3. Camera opens with edge detection
4. Position document in frame
5. Wait for green outline or tap capture
6. Adjust crop if needed
7. Confirm or retake
8. Add more pages (up to 10 total)
9. Done! Choose action:
   - **Preview & Submit** (coming soon)
   - **Scan More** (add pages)
   - **Cancel** (discard)

---

## ⚙️ Configuration

### Current Settings:
```typescript
maxNumDocuments: 10          // Up to 10 pages
letUserAdjustCrop: true      // Manual crop adjustment
croppedImageQuality: 100     // Maximum quality
```

### Permissions (Already Configured):
- ✅ Camera access
- ✅ Storage read/write
- ✅ Configured in app.json

---

## 📱 Features

- ✅ **Edge Detection**: Automatic document boundary detection
- ✅ **Multi-Page**: Scan up to 10 pages
- ✅ **Crop Adjustment**: Fine-tune document edges
- ✅ **High Quality**: 100% quality scans
- ✅ **Error Handling**: Graceful permission/error handling
- ✅ **User Cancellation**: Silent handling (no error)

---

## 🎯 Output

### Scanned Images Array:
```typescript
scannedImages: string[] = [
  "file:///storage/.../scan_page_1.jpg",
  "file:///storage/.../scan_page_2.jpg",
  "file:///storage/.../scan_page_3.jpg"
]
```

### Image Properties:
- **Format**: JPEG
- **Quality**: 100%
- **Location**: Device cache
- **Size**: ~500KB - 2MB per page

---

## 🔧 Code Reference

### Function Call:
```typescript
const { scannedImages } = await DocumentScanner.scanDocument({
  maxNumDocuments: 10,
  letUserAdjustCrop: true,
  croppedImageQuality: 100,
});
```

### Success Handling:
```typescript
if (scannedImages && scannedImages.length > 0) {
  console.log(`✅ Scanned ${scannedImages.length} page(s)`);
  // Show options: Preview, Scan More, Cancel
}
```

### Error Handling:
```typescript
catch (error) {
  if (error.message.includes('User cancelled')) {
    return; // Silent
  }
  Alert.alert('Scanner Error', '...');
}
```

---

## 🐛 Troubleshooting

### Scanner Won't Open?
1. Restart dev server: `npx expo start --clear`
2. Rebuild app
3. Check camera permissions

### Poor Edge Detection?
1. Ensure good lighting
2. Use flat surface
3. Manual crop adjustment available

### Permission Denied?
1. Go to Settings → Apps → CheckMate
2. Enable Camera permission
3. Restart app

---

## 🔜 Next Steps

### Phase 1: Submission Preview
- Display scanned pages in grid/list
- Edit/delete individual pages
- Reorder pages
- Add more pages

### Phase 2: PDF Conversion
- Convert images to single PDF
- Optimize file size
- Add metadata

### Phase 3: Upload to Server
- Upload submission via API
- Progress indicator
- Retry on failure

---

## 📊 Status

| Feature | Status |
|---------|--------|
| Scanner Integration | ✅ Done |
| Multi-page Support | ✅ Done |
| Edge Detection | ✅ Done |
| Error Handling | ✅ Done |
| Submission Preview | 🔜 TODO |
| PDF Conversion | 🔜 TODO |
| API Upload | 🔜 TODO |

---

## 🎉 Ready to Test!

**Test Flow:**
1. Navigate to any assessment
2. Tap "Capture" FAB
3. Scan a document
4. Verify success message
5. Check console for image paths

**Expected Result:**
- Scanner opens smoothly
- Document edges detected
- High-quality scans
- Success alert with page count

---

**Last Updated**: December 10, 2025  
**Component**: ViewAssessmentDetailScreen  
**Package**: react-native-document-scanner-plugin v2.0.2
