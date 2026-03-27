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

// Health Check Route
app.get('/api', (req, res) => {
    res.send('API is healthy');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});