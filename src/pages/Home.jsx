import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ImageUpload from "../components/ImageUpload";
import ImageGallery from "../components/ImageGallery";
import { motion } from "framer-motion";
import { debounce } from "lodash";

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
  const preloadedImages = useRef(new Set());
  const preloadLinks = useRef([]);

  const isFiltered = filterTag || startDate || endDate;

  const fetchImages = async (params = {}, append = false) => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:5000/api/images/search", {
        params: { ...params, page, limit: 20, sort }
      });
      const newImages = data.images || [];
      setImages(append ? prev => [...prev, ...newImages.filter(img => !preloadedImages.current.has(img._id))] : newImages);
      setHasMore(data.hasMore || false);
    } catch (err) {
      console.error(err);
      setImages([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const preloadNextPage = async (params) => {
    try {
      preloadLinks.current.forEach(link => link.remove());
      preloadLinks.current = [];
      preloadedImages.current.clear();
      const { data: { images } } = await axios.get("http://localhost:5000/api/images/search", {
        params: { ...params, page: page + 1, limit: 20, sort }
      });
      images?.forEach(img => {
        if (!preloadedImages.current.has(img._id)) {
          preloadedImages.current.add(img._id);
          const link = document.createElement("link");
          link.rel = "preload"; link.as = "image"; link.href = img.url;
          document.head.appendChild(link);
          preloadLinks.current.push(link);
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTags = async () => {
    try {
      setTagsError(null);
      const { data } = await axios.get("http://localhost:5000/api/images/tags");
      const tagsArray = Array.isArray(data?.tags) ? data.tags : [];
      setUniqueTags(tagsArray);
    } catch (err) {
      console.error(err);
      setUniqueTags([]);
      setTagsError("Failed to load tags for autocomplete. Please try again.");
    }
  };

  useEffect(() => {
    setPage(1); setImages([]);
    fetchImages();
    fetchTags();
  }, []);

  useEffect(() => {
    if (images.length > 0) setIsInitialLoad(false);
  }, [images.length]);

  const debouncedFilter = debounce(() => {
    const params = Object.fromEntries(Object.entries({ q: filterTag, startDate, endDate }).filter(([, v]) => v));
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) return alert("Start date cannot be after end date.");
    setPage(1); setImages([]);
    preloadedImages.current.clear();
    preloadLinks.current.forEach(link => link.remove()); preloadLinks.current = [];
    fetchImages(params);
  }, 300);

  useEffect(() => debouncedFilter(), [filterTag, startDate, endDate, sort]);

  const fetchMore = debounce((scrollPosition) => {
    setPage(p => p + 1);
    fetchImages({ q: filterTag, startDate, endDate }, true);
    if (scrollPosition > 0.8) preloadNextPage({ q: filterTag, startDate, endDate });
  }, 500);

  const handleUploadSuccess = newImage => !isFiltered && setImages(prev => [newImage, ...prev]);

  const handleClearFilter = () => {
    setFilterTag(""); setStartDate(""); setEndDate(""); setSort("desc");
    setIsInitialLoad(false);
    debouncedFilter();
  };

  // Staggered pull-up animation for tagline
  const tagline = "Glimmr: Capture, Tag & Explore";
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const charVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", color: "#fff", overflowX: "hidden", padding: "1rem", maxWidth: "100vw" }}>
      {/* Enhanced Tagline with Staggered Pull-Up */}
      <motion.div
        className="glow"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: "2.25rem",
          fontWeight: 800,
          textAlign: "center",
          color: "#fff",
          margin: "1.5rem 0 2rem",
          letterSpacing: "0.05em"
        }}
      >
        {tagline.split('').map((char, i) => (
          <motion.span
            key={i}
            variants={charVariants}
            style={{ display: 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.div>

      {tagsError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "1rem" }}
        >
          <p style={{ color: "#f87171", fontSize: "1rem" }}>{tagsError}</p>
          <button
            onClick={fetchTags}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.75rem", backgroundColor: "#2563eb", color: "#fff", border: "none", cursor: "pointer", marginTop: "0.5rem" }}
          >
            Retry
          </button>
        </motion.div>
      )}

      <div className="container">
        <div className="panel-container">
          {/* Taller Upload Panel: Min-height + padding for space */}
          <motion.div 
            className="upload-panel" 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.4 }}
            style={{ 
              minHeight: '28rem', // +30% taller, keeps width
              padding: '1.5rem', // Breathing room
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <ImageUpload onUploadSuccess={handleUploadSuccess} disabled={isFiltered} />
          </motion.div>
          {/* Taller Filter Panel: Min-height + vertical flex */}
          <motion.div 
            className="filter-panel flex-col gap-4" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.4 }}
            style={{ 
              minHeight: '32rem', // +30% taller, room for inputs
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.75rem", textAlign: "center" }}>Filter Images</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flex: 1 }}>
              <input type="text" placeholder="Search by tag" value={filterTag} onChange={e => setFilterTag(e.target.value)} list="tag-suggestions" />
              <datalist id="tag-suggestions">
                {Array.isArray(uniqueTags) ? uniqueTags.map(tag => <option key={tag} value={tag} />) : null}
              </datalist>
              <label style={{ fontSize: "0.875rem" }}>Start Date:</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              <label style={{ fontSize: "0.875rem" }}>End Date:</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button onClick={debouncedFilter} className="btn btn-primary">Apply Filter</button>
              <button onClick={handleClearFilter} className="btn btn-secondary">Clear Filter</button>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div className="container gallery-container" id="gallery-container" style={{ marginTop: "2rem", minHeight: "50vh" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {loading && !images.length && isInitialLoad && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", fontSize: "1.125rem", marginBottom: "1rem" }} transition={{ duration: 0.3 }}>
            <div className="spinner" /> Loading...
          </motion.div>
        )}
        <ImageGallery images={images} fetchMore={fetchMore} hasMore={hasMore} loading={loading} isFiltered={isFiltered} />
      </motion.div>
    </div>
  );
}