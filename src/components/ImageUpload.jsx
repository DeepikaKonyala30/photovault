// ImageUpload.jsx (Fixed: Preview now displays as background inside dropzone; no separate img element; size unchanged)
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Modal from "react-modal";

Modal.setAppElement("#root");

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"; // Fallback

const TAG_OPTIONS = [
  "Nature", "People", "Animals", "Technology", "Travel", "Architecture",
  "Food", "Art", "Sports", "Fashion", "Vehicles", "Abstract",
  "Ocean", "Mountains", "Cityscape",
];

const ProgressBar = ({ progress = 0 }) => (
  <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      style={{ height: '100%', background: '#10b981', borderRadius: '4px' }}
      transition={{ duration: 0.3 }}
    />
  </div>
);

export default function ImageUpload({ onUploadSuccess, disabled = false }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [customTags, setCustomTags] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: acceptedFiles => setFile(acceptedFiles[0]),
    accept: { 'image/*': [] },
    disabled: disabled || isUploading,
    multiple: false
  });

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Optional: Resize logic for large images
      if (file.size > 5 * 1024 * 1024) { // >5MB
        console.warn('Large file detected—consider compressing on backend.');
      }
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select an image.");
      setModalIsOpen(true);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    const allTags = [...selectedTags, ...(customTags ? customTags.split(',').map(t => t.trim()).filter(Boolean) : [])];
    if (allTags.length) formData.append('tags', allTags.join(','));

    try {
      setIsUploading(true);
      setProgress(0);
      const response = await axios.post(`${API_BASE}/api/images/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });
      const newImage = response.data.image; // Extract full image object
      setMessage(`Upload success! AI tags: ${newImage.tags?.join(', ') || 'None'}`);
      onUploadSuccess(newImage); // Pass the image object!
      // Reset form
      setFile(null);
      setPreview(null);
      setSelectedTags([]);
      setCustomTags("");
    } catch (err) {
      console.error(err);
      setMessage(`Upload failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUploading(false);
      setProgress(0);
      setModalIsOpen(true);
    }
  };

  // Conditional styles for dropzone with preview (Fixed: Expanded background shorthand to avoid conflicts)
  const dropzoneStyle = {
    border: '2px dashed rgba(255,255,255,0.3)', 
    borderRadius: '0.5rem', 
    padding: '2rem', 
    textAlign: 'center', 
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative'
  };

  if (preview) {
    Object.assign(dropzoneStyle, {
      backgroundImage: `url(${preview})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundColor: 'transparent'
    });
  } else {
    Object.assign(dropzoneStyle, {
      backgroundColor: 'rgba(255,255,255,0.05)'
    });
  }

  if (disabled || isUploading) {
    dropzoneStyle.opacity = 0.5;
    dropzoneStyle.cursor = 'not-allowed';
  }

  return (
    <motion.form onSubmit={handleSubmit} className="upload-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Dropzone with integrated preview */}
      <div {...getRootProps()} style={dropzoneStyle}>
        <input {...getInputProps()} />
        <p style={{ 
          margin: 0, 
          color: preview ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.7)',
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: preview ? 'rgba(0,0,0,0.5)' : 'transparent',
          padding: preview ? '0.5rem 1rem' : 0,
          borderRadius: preview ? '0.25rem' : 0
        }}>
          {isUploading ? 'Uploading...' : disabled ? 'Filters active—clear to upload' : preview ? 'Image selected – ready to upload' : 'Drag & drop or click to select an image'}
        </p>
        {/* Optional overlay for better text visibility if needed */}
        {preview && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            pointerEvents: 'none'
          }} />
        )}
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Suggested Tags:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {TAG_OPTIONS.map(tag => (
            <motion.button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              whileHover={{ scale: 0.95 }}
              className="tag-btn"
              disabled={disabled || isUploading}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              {tag}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {selectedTags.map(tag => (
              <motion.span
                key={tag}
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                exit={{ scale: 0 }} 
                transition={{ duration: 0.2 }}
                style={{ 
                  backgroundColor: '#dbeafe', 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  color: '#1e40af'
                }}
              >
                {tag}
                <button 
                  type="button" 
                  onClick={() => handleTagToggle(tag)} 
                  style={{ 
                    fontSize: '0.75rem', 
                    marginLeft: '0.25rem', 
                    background: 'none', 
                    border: 'none', 
                    color: 'inherit',
                    cursor: 'pointer'
                  }}
                >
                  ×
                </button>
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      <input
        type="text"
        placeholder="Enter custom tags (comma-separated)"
        value={customTags}
        onChange={e => setCustomTags(e.target.value)}
        disabled={disabled || isUploading}
        style={{ 
          padding: '0.75rem', 
          borderRadius: '0.5rem', 
          border: '1px solid rgba(255,255,255,0.2)', 
          marginTop: '1rem', 
          width: '100%',
          background: 'rgba(255,255,255,0.05)',
          color: '#fff'
        }}
      />

      <button
        type="submit"
        disabled={isUploading || disabled || !file}
        className="btn btn-primary"
        style={{ padding: '0.75rem', fontSize: '1rem', width: '100%', marginTop: '1rem' }}
      >
        {isUploading ? "Uploading..." : "Upload Image"}
      </button>

      {progress > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          style={{ marginTop: '0.5rem' }}
        >
          <ProgressBar progress={progress} />
        </motion.div>
      )}

      <Modal 
        isOpen={modalIsOpen} 
        onRequestClose={() => setModalIsOpen(false)} 
        className="modal-content" 
        overlayClassName="modal-overlay"
        style={{
          overlay: { zIndex: 1000 },
          content: { zIndex: 1001 }
        }}
      >
        <p style={{ marginBottom: '1rem' }}>{message}</p>
        <button onClick={() => setModalIsOpen(false)} className="btn btn-secondary">Close</button>
      </Modal>
    </motion.form>
  );
}