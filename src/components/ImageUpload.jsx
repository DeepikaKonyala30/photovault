import React, { useState } from "react";
import axios from "axios";

export default function ImageUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("❌ Please select an image!");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("description", description);

    try {
      const res = await axios.post("http://localhost:5000/api/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) =>
          setProgress(Math.round((event.loaded * 100) / event.total)),
      });

      setMessage("✅ Upload successful!");
      setFile(null);
      setDescription("");
      setProgress(0);

      // Pass the new image object returned by backend to parent
      onUploadSuccess(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed!");
    }
  };

  return (
    <form
      onSubmit={handleUpload}
      aria-label="Image upload form"
      className="p-4 border rounded-md shadow-md max-w-md mx-auto my-4 bg-white"
    >
      <label htmlFor="fileInput" className="block mb-2 font-medium">Select Image</label>
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
        className="w-full mb-3 border p-2 rounded focus-visible:ring-2 focus-visible:ring-blue-600"
      />

      <label htmlFor="desc" className="block mb-2 font-medium">Description (optional)</label>
      <input
        id="desc"
        type="text"
        placeholder="Enter image description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full mb-3 border p-2 rounded focus-visible:ring-2 focus-visible:ring-blue-600"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
      >
        Upload
      </button>

      {progress > 0 && (
        <div aria-live="polite" className="w-full bg-gray-200 mt-3 rounded">
          <div
            className="bg-green-500 text-white text-xs text-center rounded"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      {message && (
        <p aria-live="polite" className="mt-3 text-center text-sm font-medium text-gray-800">
          {message}
        </p>
      )}
    </form>
  );
}
