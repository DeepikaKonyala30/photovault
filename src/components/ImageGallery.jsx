/* ImageGallery.jsx */
import React from "react";

const GalleryImage = React.memo(({ img }) => (
  <article
    className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-blue-500"
    tabIndex="0"
  >
    <img
      src={img.url}
      alt={img.description || "Uploaded image"}
      loading="lazy"
      decoding="async"
      className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-300 ease-in-out"
    />
    <div className="p-3 text-sm text-gray-700">
      <p className="font-medium">{img.description || "No description"}</p>
      <p className="text-gray-500 text-xs">{new Date(img.date).toLocaleString()}</p>
    </div>
  </article>
));

export default function ImageGallery({ images }) {
  return (
    <main
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 p-4 container mx-auto"
      aria-label="Uploaded image gallery"
    >
      {images.map((img, index) => (
        <GalleryImage key={index} img={img} />
      ))}
    </main>
  );
}
