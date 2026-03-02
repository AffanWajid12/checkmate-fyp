import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import adminRoutes from "./routes/adminRoutes.js"

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//routes folders
app.use("/api/admin", adminRoutes);

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