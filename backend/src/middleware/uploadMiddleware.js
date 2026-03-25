import multer from "multer";

// Keep file in memory as Buffer — passed directly to Supabase Storage.
// No temp files are ever written to disk.
const storage = multer.memoryStorage();

// ALLOWED_TYPES constraint removed to permit all file types (e.g., .py, .txt, .docx, .zip)
// The 20MB size constraint is still strictly enforced.

// uploadSingle — accepts one file under the field name "file"
// Used when only one file is expected in a request.
export const uploadSingle = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single("file");

// uploadMultiple — accepts up to 10 files under the field name "files"
// Used for assessment source material uploads and student submission uploads.
export const uploadMultiple = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
}).array("files", 10);
