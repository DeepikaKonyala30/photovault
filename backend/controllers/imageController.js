import bucket from "../config/cloudStorage.js";
import multer from "multer";
import Image from "../models/Image.js";
import client from "../config/visionClient.js";
import sharp from "sharp";
const { encode } = await import("blurhash");

// Multer memory storage
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Get Unique Tags
export const getTags = async (req, res) => {
  try {
    const tags = await Image.aggregate([
      { $match: { user: req.user._id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, tag: "$_id" } }
    ]);

    const tagList = tags.map(({ tag }) => tag).filter(Boolean);
    res.json({ tags: tagList });
  } catch (error) {
    console.error("Tags fetch error:", error);
    res.status(500).json({ message: "Failed to fetch tags", tags: [] });
  }
};

// Upload Image (UPDATED: Include custom tags)
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { originalname, buffer, mimetype } = req.file;
    const timestamp = Date.now();
    const blob = bucket.file(`${timestamp}-${originalname}`);

    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: mimetype,
    });

    blobStream.on("error", (err) => {
      console.error("Upload error:", err);
      return res.status(500).json({ message: "Upload failed" });
    });

    blobStream.on("finish", async () => {
      try {
        // Generate signed URL
        const [signedUrl] = await blob.getSignedUrl({
          action: "read",
          expires: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days
        });

        // Generate blurhash
        const resizedBuffer = await sharp(buffer)
          .resize(32, 32, { fit: "inside" })
          .raw()
          .toBuffer({ resolveWithObject: true });
        const { data, info } = resizedBuffer;
        const blurhash = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);

        // Vision API tags
        let visionTags = [];
        try {
          const [result] = await client.labelDetection({
            image: { content: buffer.toString("base64") },
          });
          visionTags = result.labelAnnotations?.slice(0, 5).map(l => l.description) || [];
        } catch (visionError) {
          console.warn("Vision API failed:", visionError.message);
        }

        // Parse custom tags from req.body.tags (comma-separated string)
        const customTags = req.body.tags
          ? req.body.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        // Combine and dedupe tags (custom + vision)
        const finalTags = [...new Set([...visionTags, ...customTags])];

        // Save to DB
        const newImage = await Image.create({
          url: signedUrl,
          blurhash,
          tags: finalTags,
          date: new Date(),
          user: req.user._id,
        });

        return res.json({ message: "Image uploaded successfully", image: newImage });
      } catch (err) {
        console.error("Error finalizing upload:", err);
        return res.status(500).json({ message: "Server error during upload", error: err });
      }
    });

    blobStream.end(buffer);
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// List all images
export const listImages = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "desc" } = req.query;
    const skip = (page - 1) * limit;
    const sortObj = { date: sort === "desc" ? -1 : 1 };

    let query = { user: req.user._id };

    const images = await Image.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Image.countDocuments(query);

    res.json({ images, total, hasMore: skip + images.length < total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch images", images: [] });
  }
};

// Search images
export const searchImages = async (req, res) => {
  try {
    const { q, startDate, endDate, page = 1, limit = 20, sort = "desc" } = req.query;
    const skip = (page - 1) * limit;
    const sortObj = { date: sort === "desc" ? -1 : 1 };

    let query = { user: req.user._id };
    if (q) query.tags = { $regex: q, $options: "i" };
    if (startDate || endDate) query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);

    const images = await Image.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Image.countDocuments(query);

    res.json({ images, total, hasMore: skip + images.length < total });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Failed to search images", images: [] });
  }
};