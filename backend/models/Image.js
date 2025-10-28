import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  blurhash: { type: String },
  tags: { type: [String], default: [] },
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // NEW: Scope to user
});

export default mongoose.model("Image", imageSchema);