import React, { useState, useEffect } from "react";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";
import axios from "axios";

export default function Home() {
  const [images, setImages] = useState([]);

  const fetchImages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/images");
      const data = res.data;
      if (Array.isArray(data)) {
        setImages(data);
      } else {
        console.warn("Unexpected response format:", data);
        setImages([]);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
      setImages([]);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUploadSuccess = (newImage) => {
  if (newImage && newImage.url) {
    setImages((prev) => [newImage, ...prev]);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold tracking-tight">📸 My Image Gallery</h1>
        <p className="text-gray-600 mt-1">Upload and view your favorite moments</p>
      </header>

      <section aria-labelledby="upload-section">
        <h2 id="upload-section" className="sr-only">Image Upload Section</h2>
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
      </section>

      <section aria-labelledby="gallery-section">
        <h2 id="gallery-section" className="sr-only">Uploaded Images Section</h2>
        <ImageGallery images={images} />
      </section>
    </div>
  );
}




/* Home.jsx 
import React, { useState, useEffect } from "react";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";
import axios from "axios";

export default function Home() {
  const [images, setImages] = useState([]);

  const fetchImages = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/images");
      const data = res.data;
      if (Array.isArray(data)) {
        setImages(data);
      } else {
        console.warn("Unexpected response format:", data);
        setImages([]);
      }
    } catch (err) {
      console.error("Failed to fetch images:", err);
      setImages([]);
    }
  };

  // ✅ Add this back
  const handleUploadSuccess = (newImage) => {
    setImages((prev) => [newImage, ...prev]);
  };

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="text-center py-6">
        <h1 className="text-4xl font-bold tracking-tight">📸 My Image Gallery</h1>
        <p className="text-gray-600 mt-1">Upload and view your favorite moments</p>
      </header>

      <section aria-labelledby="upload-section">
        <h2 id="upload-section" className="sr-only">
          Image Upload Section
        </h2>
        <ImageUpload onUploadSuccess={handleUploadSuccess} />
      </section>

      <section aria-labelledby="gallery-section">
        <h2 id="gallery-section" className="sr-only">
          Uploaded Images Section
        </h2>
        <ImageGallery images={images} />
      </section>
    </div>
  );
}*/
