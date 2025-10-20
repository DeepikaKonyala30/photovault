import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000"; // Fallback for dev

// Simple Error Boundary (Low-Code: Handles ImageGallery Crashes)
class GalleryErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Gallery Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", padding: "2rem", color: "#f87171" }}
        >
          <h3>Oops! Gallery Glitched 😅</h3>
          <p>Try refreshing or uploading again. (Details in console)</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Reload
          </button>
        </motion.div>
      );
    }
    return this.props.children;
  }
}

export default function Home() {
  const [images, setImages] = useState([]);
  const [filterTag, setFilterTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [uniqueTags, setUniqueTags] = useState([]);
  const [sort, setSort] = useState("desc");
  const [tagsError, setTagsError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [galleryKey, setGalleryKey] = useState(0); // Force gallery re-render on upload
  const preloadedImages = useRef(new Set());
  const preloadLinks = useRef([]);

  const isFiltered = filterTag || startDate || endDate;

  const fetchImages = useCallback(async (params = {}, append = false) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/images/search`, {
        params: { ...params, page, limit: 20, sort }
      });
      let newImages = Array.isArray(data.images) ? data.images : []; // Safeguard: Ensure array
      newImages = newImages.filter(img => img && img._id); // Filter out undefined/null/invalid
      setImages(append ? prev => [...prev, ...newImages.filter(img => !preloadedImages.current.has(img._id))] : newImages);
      setHasMore(data.hasMore || newImages.length < 20);
      // Safe tags extraction
      const allTags = newImages.flatMap(img => img?.tags || []);
      setUniqueTags(prev => Array.from(new Set([...prev, ...allTags])));
      setTagsError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      setImages([]);
      setHasMore(false);
      setTagsError(err.message || "Failed to fetch images. Check connection.");
    } finally {
      setLoading(false);
    }
  }, [page, sort]);

  const debouncedFilter = useCallback(
    debounce(async () => {
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        alert("Start date cannot be after end date.");
        return;
      }
      setPage(1);
      setIsInitialLoad(true);
      preloadedImages.current.clear();
      preloadLinks.current.forEach(link => link.remove()); 
      preloadLinks.current = [];
      await fetchImages({ q: filterTag, startDate, endDate }, false);
    }, 300),
    [filterTag, startDate, endDate, sort, fetchImages]
  );

  const handleClearFilter = useCallback(() => {
    setFilterTag("");
    setStartDate("");
    setEndDate("");
    setSort("desc");
    setPage(1);
    setIsInitialLoad(true);
    preloadedImages.current.clear();
    preloadLinks.current.forEach(link => link.remove()); 
    preloadLinks.current = [];
    fetchImages({}, false);
  }, [fetchImages]);

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setPage(prev => prev + 1);
    await fetchImages({ q: filterTag, startDate, endDate }, true);
  }, [loading, hasMore, filterTag, startDate, endDate, fetchImages]);

  // Enhanced Upload Success – Prepend Live + Trigger Gallery Refresh
  const handleUploadSuccess = useCallback((newImage) => {
    if (!newImage || !newImage._id || !newImage.url) {
      console.warn("Invalid new image skipped:", newImage);
      debouncedFilter(); // Fallback: Refetch anyway
      return;
    }
    if (!isFiltered) {
      // Prepend to state for instant display
      setImages(prev => {
        const updated = [newImage, ...prev.filter(img => img?._id !== newImage._id)];
        preloadedImages.current.add(newImage._id); // Preload new one
        return updated;
      });
      setUniqueTags(prev => Array.from(new Set([...prev, ...(newImage.tags || [])])));
      setGalleryKey(prev => prev + 1); // Force gallery re-mount for animation
    } else {
      // Filtered: Refetch to include new image
      debouncedFilter();
    }
  }, [isFiltered, debouncedFilter]);

  // Initial load
  useEffect(() => {
    fetchImages({}, false);
  }, [fetchImages]);

  // Filter changes
  useEffect(() => {
    debouncedFilter();
  }, [debouncedFilter]);

  // Initial load flag
  useEffect(() => {
    if (images.length > 0) setIsInitialLoad(false);
  }, [images.length]);

  // Preload next page
  useEffect(() => {
    const preloadNextPage = async (params) => {
      try {
        preloadLinks.current.forEach(link => link.remove());
        preloadLinks.current = [];
        preloadedImages.current.clear();
        const { data: { images: nextImages } } = await axios.get(`${API_BASE}/api/images/search`, {
          params: { ...params, page: page + 1, limit: 20, sort }
        });
        const validNext = Array.isArray(nextImages) ? nextImages.filter(img => img && img._id) : [];
        validNext.forEach(img => {
          if (!preloadedImages.current.has(img._id)) {
            preloadedImages.current.add(img._id);
            const link = document.createElement("link");
            link.rel = "preload";
            link.href = img.url;
            link.as = "image";
            document.head.appendChild(link);
            preloadLinks.current.push(link);
          }
        });
      } catch (err) {
        console.warn("Preload failed:", err);
      }
    };

    if (!loading && hasMore && images.length > 0) {
      preloadNextPage({ q: filterTag, startDate, endDate });
    }
  }, [images.length, loading, hasMore, filterTag, startDate, endDate, page, sort]);

  // Tagline animations (FIXED: Simplified hover—no vanish)
  const tagline = "Glimmr: Capture, Tag & Explore";
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
  };
  const charVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } } // Smooth scale only—no rotation
  };

  return (
    <div className="min-h-screen relative" style={{ color: "#fff" }}>
      {/* Hero Tagline */}
      <motion.div
        className="glow"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
          fontWeight: 800,
          textAlign: "center",
          margin: "1.5rem auto 1rem",
          letterSpacing: "0.05em",
          maxWidth: "1200px",
          padding: "0 1rem",
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text" // Fallback
        }}
      >
        {tagline.split("").map((char, i) => (
          <motion.span
            key={i}
            variants={charVariants}
            whileHover="hover" // FIXED: Stable hover
            style={{ display: "inline-block" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </motion.div>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          textAlign: "center",
          fontSize: "1rem",
          color: "rgba(255, 255, 255, 0.8)",
          margin: "0 auto 2rem",
          maxWidth: "1200px",
          padding: "0 1rem"
        }}
      >
        Upload your moments, auto-tag with AI, and rediscover with ease.
      </motion.p>

      {tagsError && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "1rem" }}>
          <p style={{ color: "#f87171", fontSize: "1rem" }}>{tagsError}</p>
          <button onClick={() => fetchImages({ q: filterTag, startDate, endDate }, false)} className="btn btn-primary" style={{ marginTop: "0.5rem" }}>
            Retry
          </button>
        </motion.div>
      )}

      {/* Header Container */}
      <div className="header-container" style={{ margin: "0 auto 2rem", maxWidth: "1200px", padding: "0 1rem", display: "flex", gap: "1rem", justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Upload Panel */}
        <motion.div className="upload-panel" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} style={{ flex: 1, minWidth: "300px" }}>
          <ImageUpload onUploadSuccess={handleUploadSuccess} disabled={isFiltered} />
        </motion.div>

        {/* Filter Panel – ALWAYS VISIBLE (No Toggle) */}
        <motion.div 
          className="filter-panel" 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ duration: 0.6, delay: 0.2 }} // Slide-in on load
          style={{ flex: 1, minWidth: "300px" }}
        >
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem", textAlign: "center" }}>🔍 Filter Images</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
            <input
              type="text"
              placeholder="Search by tag"
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              list="tag-suggestions"
              className="btn"
              style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
            />
            <datalist id="tag-suggestions">
              {uniqueTags.map(tag => <option key={tag} value={tag} />)}
            </datalist>
            <label style={{ fontSize: "0.875rem" }}>Start Date:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="btn" style={{ padding: "0.5rem" }} />
            <label style={{ fontSize: "0.875rem" }}>End Date:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="btn" style={{ padding: "0.5rem" }} />
            <select value={sort} onChange={e => setSort(e.target.value)} className="btn" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
            <button onClick={debouncedFilter} className="btn btn-primary">Apply Filter</button>
            <button onClick={handleClearFilter} className="btn btn-secondary">Clear Filter</button>
          </div>
        </motion.div>
      </div>

      {/* Gallery with Error Boundary + Key for Re-Render */}
      <motion.div
        className="container gallery-container"
        id="gallery-container"
        style={{ margin: "0 auto", minHeight: "50vh", maxWidth: "1200px", padding: "0 1rem" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {loading && !images.length && isInitialLoad && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", fontSize: "1.125rem", margin: "2rem 0" }} transition={{ duration: 0.3 }}>
            <div className="spinner" /> Loading your cosmic captures...
          </motion.div>
        )}
        <GalleryErrorBoundary>
          <ImageGallery 
            key={galleryKey} // Re-mount on upload for fresh animation
            images={images.filter(img => img && img._id)} 
            fetchMore={fetchMore} 
            hasMore={hasMore} 
            loading={loading} 
            isFiltered={isFiltered} 
          />
        </GalleryErrorBoundary>
      </motion.div>
    </div>
  );
}