import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Dropzone from "react-dropzone";
import Modal from "react-modal";

Modal.setAppElement("#root");

const TAG_OPTIONS = [
  "Nature", "People", "Animals", "Technology", "Travel", "Architecture",
  "Food", "Art", "Sports", "Fashion", "Vehicles", "Abstract",
  "Ocean", "Mountains", "Cityscape",
];

// New: Low-Code Linear Progress Bar (Motion div—~4 lines, no deps)
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

export default function ImageUpload({ onUploadSuccess, disabled }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [customTags, setCustomTags] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [aiTags, setAITags] = useState([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // Concise: Preview gen with optional compress/resize
  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = (e) => {
        const img = new Image();
        img.onload = () => {
          if (file.size > 1024 * 1024 || img.width > 512 || img.height > 512) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxDim = 512;
            let { width, height } = img;
            if (width > height) {
              if (width > maxDim) height = (height * maxDim) / width, width = maxDim;
            } else {
              if (height > maxDim) width = (width * maxDim) / height, height = maxDim;
            }
            canvas.width = width; canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            setPreview(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            setPreview(e.target.result);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null); setAITags([]);
    }
  }, [file]);

  const handleDrop = async (acceptedFiles) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
      const formData = new FormData();
      formData.append('image', acceptedFiles[0]);
      try {
        const { data: { tags } } = await axios.post('http://localhost:5000/api/images/preview-tags', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setAITags(tags.slice(0, 3));
      } catch (err) {
        console.warn('AI preview failed:', err);
        setAITags([]);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (disabled || !file) {
      if (!file) { setMessage("❌ Please select an image!"); setModalIsOpen(true); }
      return;
    }

    const manualTags = customTags.split(",").map(t => t.trim()).filter(Boolean);
    const allTags = [...new Set([...selectedTags, ...manualTags])];

    const formData = new FormData();
    formData.append("image", file);
    formData.append("tags", allTags.join(","));

    setIsUploading(true); setMessage(""); setProgress(0);

    try {
      const res = await axios.post("http://localhost:5000/api/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => event.total && setProgress(Math.round((event.loaded * 100) / event.total)),
      });

      setMessage("✅ Upload successful!");
      setFile(null); setPreview(null); setCustomTags(""); setSelectedTags([]); setAITags([]);
      onUploadSuccess(res.data.image);
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || err.message || "Upload failed!"}`);
      setModalIsOpen(true);
    } finally {
      setIsUploading(false); setProgress(0);
    }
  };

  const formStyle = {
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%'
  };

  const dropStyle = {
    height: '200px', width: '100%', border: '2px dashed #d1d5db', borderRadius: '0.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb',
    cursor: disabled ? 'not-allowed' : 'pointer', overflow: 'hidden'
  };

  const imgStyle = { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.25rem' };

  return (
    <motion.form onSubmit={handleUpload} className="flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} style={formStyle}>
      {disabled && <p style={{ textAlign: 'center', color: '#f87171', marginBottom: '1rem' }}>Upload disabled while filters are applied. Clear filters to enable.</p>}

      <Dropzone onDrop={handleDrop} disabled={disabled}>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} className="dropzone" style={dropStyle}>
            <input {...getInputProps()} />
            {preview ? <img src={preview} alt="Preview" style={imgStyle} /> : <p style={{ textAlign: 'center', color: '#6b7280' }}>Drag & drop or click to select an image</p>}
          </div>
        )}
      </Dropzone>

      {aiTags.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: '0.875rem', color: '#22c55e', textAlign: 'center' }}>
          🤖 AI Suggests: {aiTags.join(', ')}
        </motion.div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'flex-start' }}>
        {TAG_OPTIONS.map(tag => {
          const selected = selectedTags.includes(tag);
          return (
            <motion.button
              key={tag}
              type="button"
              onClick={() => handleTagToggle(tag)}
              animate={{ backgroundColor: selected ? "#2563eb" : "#f3f4f6", color: selected ? "#fff" : "#111827" }}
              transition={{ duration: 0.1 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="tag-btn"
              disabled={disabled}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
          {selectedTags.map(tag => (
            <motion.span
              key={tag}
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}
              style={{ backgroundColor: '#dbeafe', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}
            >
              {tag}
              <button type="button" onClick={() => handleTagToggle(tag)} style={{ fontSize: '0.75rem', marginLeft: '0.25rem' }}>×</button>
            </motion.span>
          ))}
        </div>
      </AnimatePresence>

      <input
        type="text"
        placeholder="Enter custom tags (comma-separated)"
        value={customTags}
        onChange={e => setCustomTags(e.target.value)}
        disabled={disabled}
        style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
      />

      <button
        type="submit"
        disabled={isUploading || disabled}
        className="btn btn-primary"
        style={{ padding: '0.75rem', fontSize: '1rem' }}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>

      {progress > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop: '0.5rem' }}>
          <ProgressBar progress={progress} />
        </motion.div>
      )}

      <Modal isOpen={modalIsOpen} onRequestClose={() => setModalIsOpen(false)} className="modal-content" overlayClassName="modal-overlay">
        <p>{message}</p>
        <button onClick={() => setModalIsOpen(false)} className="btn btn-secondary">Close</button>
      </Modal>
    </motion.form>
  );
}