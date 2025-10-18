import express from "express";
import { upload, uploadImage, listImages, searchImages, previewTags, getTags } from "../controllers/imageController.js"; // Added getTags

const router = express.Router();

// Preview route
router.post("/preview-tags", upload.single("image"), previewTags);

// Upload route
router.post("/upload", upload.single("image"), uploadImage);

// New: Tags route
router.get("/tags", getTags);

// List all images
router.get("/", listImages);

// Search images
router.get("/search", searchImages);

export default router;