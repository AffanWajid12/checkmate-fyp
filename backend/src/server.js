import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import referenceMaterielsRoutes from "./routes/referenceMaterielsRoutes.js";
import assessmentGenerationRoutes from "./routes/assessmentGenerationRoutes.js";
import gradingRoutes from "./routes/gradingRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//routes folders
app.use("/api/admin", adminRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reference-materials", referenceMaterielsRoutes);
app.use("/api/generated-assessments", assessmentGenerationRoutes);
app.use("/api/grading", gradingRoutes);

// Health Check Route
app.get('/api', (req, res) => {
    res.send('API is healthy');
});

app.use((err, req, res, next) => {
    console.error("Global Error Handler:", err);
    
    // Handle Multer Errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ 
            message: "File too large. Maximum allowed size is 100MB per file." 
        });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
            message: "Too many files. Maximum allowed is 10 files." 
        });
    }

    const status = err.status || 500;
    const message = err.message || 'Something went wrong!';
    
    res.status(status).json({ 
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});