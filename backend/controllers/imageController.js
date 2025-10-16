import bucket from "../config/cloudStorage.js";
import multer from "multer";
import Image from "../models/Image.js"; // <-- MongoDB model

const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { originalname, buffer } = req.file;
    const timestamp = Date.now();
    const blob = bucket.file(`${timestamp}-${originalname}`);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype,
    });

    blobStream.on("error", (err) => {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Upload failed", error: err });
    });

    blobStream.on("finish", async () => {
      const [signedUrl] = await blob.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days signed URL for testing
      });

      // Save metadata to MongoDB
      const newImage = await Image.create({
        url: signedUrl,
        description: req.body.description || "",
        date: new Date(),
      });

      res.json(newImage); // send to frontend
    });

    blobStream.end(buffer);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// List all images
export const listImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ date: -1 }); // latest first
    res.json(images);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch images", error });
  }
};
