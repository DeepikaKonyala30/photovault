import bucket from "../config/cloudStorage.js";
import multer from "multer";
import Image from "../models/Image.js";
import client from "../config/visionClient.js";
import sharp from "sharp";
const { encode } = await import("blurhash");

// Multer memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Preview Tags
export const previewTags = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file", tags: [] });

    const { buffer } = req.file;
    let visionTags = [];
    try {
      const [result] = await client.labelDetection({
        image: { content: buffer.toString("base64") },
      });
      visionTags = result.labelAnnotations?.map((l) => l.description) || [];
    } catch (visionError) {
      console.warn("Vision preview failed:", visionError.message);
      visionTags = [];
    }

    res.json({ tags: visionTags });
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).json({ message: "Preview failed", tags: [] });
  }
};

// Get Unique Tags
export const getTags = async (req, res) => {
  try {
    const tags = await Image.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, tag: "$_id" } }
    ]);

    const tagList = tags.map(({ tag }) => tag).filter(Boolean);
    res.json({ tags: tagList });
  } catch (error) {
    console.error("Tags fetch error:", error);
    res.status(500).json({ message: "Failed to fetch images", tags: [] });
  }
};

// Upload Image (Unchanged)
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
      return res.status(500).json({ message: "Upload failed", error: err });
    });

    blobStream.on("finish", async () => {
      try {
        const [signedUrl] = await blob.getSignedUrl({
          action: "read",
          expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        });

        const userTags = req.body.tags
          ? req.body.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];

        let visionTags = [];
        try {
          const [result] = await client.labelDetection(signedUrl);
          visionTags = result.labelAnnotations.map((l) => l.description);
        } catch (visionError) {
          console.warn("Vision API failed:", visionError.message);
        }

        const finalTags = Array.from(new Set([...userTags, ...visionTags]));
        if (finalTags.length === 0) finalTags.push("Untagged");

        let blurhash = null;
        try {
          const { data: pixels, info } = await sharp(buffer)
            .raw()
            .ensureAlpha()
            .resize(128, 128, { fit: "inside" })
            .toBuffer({ resolveWithObject: true });

          const pixelArray = new Uint8ClampedArray(pixels);
          blurhash = encode(pixelArray, info.width, info.height, 4, 3);
        } catch (blurError) {
          console.warn("Blurhash computation failed:", blurError.message);
          blurhash = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
        }

        const newImage = await Image.create({
          url: signedUrl,
          blurhash,
          tags: finalTags,
          date: new Date(),
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

// List all images (Enhanced: Pagination + Wrap)
export const listImages = async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = "desc" } = req.query;
    const skip = (page - 1) * limit;
    const sortObj = { date: sort === "desc" ? -1 : 1 };

    const images = await Image.find()
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Image.countDocuments();

    res.json({ images, total, hasMore: skip + images.length < total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch images", images: [] });
  }
};

// Search images (Enhanced: Pagination + Wrap + Use params)
export const searchImages = async (req, res) => {
  try {
    const { q, startDate, endDate, page = 1, limit = 20, sort = "desc" } = req.query;
    const skip = (page - 1) * limit;
    const sortObj = { date: sort === "desc" ? -1 : 1 };

    let query = {};
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