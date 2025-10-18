import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  blurhash: { type: String }, // New: For progressive loading placeholders
  tags: { type: [String], default: [] },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Image", imageSchema);