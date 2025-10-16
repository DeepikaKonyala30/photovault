import express from "express";
import { upload, uploadImage, listImages } from "../controllers/imageController.js";

const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);
router.get("/", listImages);

export default router;
