import multer from "multer";

// Keep file in memory as Buffer — passed directly to Supabase Storage.
// No temp files are ever written to disk.
const storage = multer.memoryStorage();

// Allowed MIME types: PDF, Word (.doc / .docx), and common image formats
const ALLOWED_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type"), false);
    }
};

// uploadSingle — accepts one file under the field name "file"
// Used when only one file is expected in a request.
export const uploadSingle = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
}).single("file");

// uploadMultiple — accepts up to 10 files under the field name "files"
// Used for assessment source material uploads and student submission uploads.
export const uploadMultiple = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB per file
}).array("files", 10);
