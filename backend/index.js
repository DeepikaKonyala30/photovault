import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import imageRoutes from "./routes/imageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";

dotenv.config(); // Load env early
console.log("🔑 JWT_SECRET loaded (length):", process.env.JWT_SECRET ? process.env.JWT_SECRET.length : "UNDEFINED! Check .env"); // NEW: Debug log
console.log("Loaded JWT_SECRET:", process.env.JWT_SECRET);

connectDB(); // Connect MongoDB
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/images", imageRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));