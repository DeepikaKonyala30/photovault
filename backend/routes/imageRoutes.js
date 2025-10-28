import express from "express";
import { protect } from "../middleware/auth.js";
import { upload, uploadImage, listImages, searchImages, getTags } from "../controllers/imageController.js";

const router = express.Router();

router.post("/upload", protect, upload.single("image"), uploadImage);
router.get("/tags", protect, getTags);
router.get("/", protect, listImages);
router.get("/search", protect, searchImages);

export default router;