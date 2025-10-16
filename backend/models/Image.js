import mongoose from "mongoose";

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  description: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});

export default mongoose.model("Image", ImageSchema);
