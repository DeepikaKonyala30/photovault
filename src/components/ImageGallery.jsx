import React, { useState, Component, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "react-modal";
import InfiniteScroll from "react-infinite-scroll-component";
import { Blurhash } from 'react-blurhash';

Modal.setAppElement("#root");

// Error Boundary (Enhanced: Logs for Dev)
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Gallery Error:", error, errorInfo); // Dev-friendly logging
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#f87171', padding: '2rem' }}
        >
          <h3>Oops! Gallery Glitched 😅</h3>
          <p>Error loading images. Try refreshing.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Reload
          </button>
        </motion.div>
      );
    }
    return this.props.children;
  }
}

export default function ImageGallery({ images = [], fetchMore, hasMore, loading, isFiltered, galleryKey }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(hasMore);
  const scrollRef = useRef(null);
  const galleryRef = useRef(null); // For keyboard nav

  // Safe Images – Filter Out Undefined/Null (Fixes tags Crash)
  const safeImages = React.useMemo(() => {
    return (images || []).filter(img => img && img._id && img.url); // Core safeguards
  }, [images]);

  const openModal = (img) => {
    if (!img) return; // Guard against null
    setSelectedImg(img);
    setModalIsOpen(true);
  };

  // Keyboard Navigation (Unchanged, but uses safeImages)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modalIsOpen) return;
      const focused = document.activeElement;
      if (focused.closest('[role="gridcell"]')) {
        const cards = galleryRef.current?.querySelectorAll('[role="gridcell"]');
        const currentIndex = Array.from(cards).indexOf(focused);
        if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
          cards[currentIndex + 1].focus();
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          cards[currentIndex - 1].focus();
        } else if (e.key === 'Enter') {
          const img = safeImages[currentIndex]; // Safe index
          if (img) openModal(img);
        }
      } else if (e.key === 'ArrowDown' && galleryRef.current) {
        galleryRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeImages, modalIsOpen]);

  // Handle scroll indicator visibility (Unchanged)
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = scrollRef.current;
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        setShowScrollIndicator(hasMore && scrollTop < scrollHeight - clientHeight - 50);
      }
    };

    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      handleScroll(); // Initial check
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [hasMore]);

  // Skeleton loader component (Unchanged)
  const SkeletonCard = () => (
    <motion.div
      className="image-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="skeleton-img" />
      <div className="skeleton-tags" />
    </motion.div>
  );

  // Empty State (Fallback if No Safe Images)
  if (!loading && safeImages.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(255,255,255,0.6)' }}
      >
        {isFiltered ? "No cosmic captures match your filters. Adjust & explore! 🌌" : "Launch your first upload to fill the galaxy. ✨"}
      </motion.div>
    );
  }

  return (
    <ErrorBoundary>
      <InfiniteScroll
        dataLength={safeImages.length} // Use safe length
        next={fetchMore}
        hasMore={hasMore && safeImages.length > 0} // Guard hasMore
        loader={
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center' }}
          >
            <div className="spinner" style={{ margin: '0 auto' }} />
            Loading more stars...
          </motion.p>
        }
        scrollThreshold={0.9}
        scrollableTarget="gallery-container"
      >
        <AnimatePresence mode="wait">
          {/* ARIA Grid – Key from Home for Upload Refresh */}
          <motion.div
            ref={galleryRef}
            key={`${safeImages.length}-${isFiltered}-${galleryKey}`} // Include galleryKey for re-mount
            className="gallery-grid"
            role="grid"
            aria-label="Image Gallery"
            tabIndex={0}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, staggerChildren: 0.08 }}
          >
            {loading && images.length === 0 ? (
              Array.from({ length: 8 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))
            ) : (
              safeImages.map((img, index) => ( // Map safeImages
                <motion.div
                  key={`${img._id || img.id}-${index}`}
                  className="image-card"
                  role="gridcell"
                  aria-label={`Image with tags: ${(img?.tags || []).join(', ') || 'No tags'}`} // Safe tags
                  tabIndex={0}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ scale: 1.03 }}
                  style={{ willChange: 'transform, opacity', position: 'relative' }}
                  onClick={() => openModal(img)}
                >
                  {/* "New!" Badge for Fresh Uploads (Gallery-Only) */}
                  {img.isNew && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                        zIndex: 1
                      }}
                    >
                      New! ✨
                    </motion.span>
                  )}
                  {/* Blurhash Placeholder */}
                  <Blurhash
                    hash={img.blurhash || 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'} // Fallback
                    width="100%"
                    height={192}
                    resolutionX={32}
                    resolutionY={32}
                    punch={1}
                    className="placeholder-blur"
                  />
                  <img
                    loading="lazy"
                    src={img.url}
                    alt={(img?.tags || []).join(", ") || "Image"} // Safe alt
                    style={{ 
                      height: '12rem', 
                      width: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    }}
                    onLoad={(e) => e.target.style.opacity = 1}
                  />
                  <div className="tags-overlay">
                    {(img?.tags || []).join(", ") || "No tags"} {/* Safe join – Fixes Error */}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {showScrollIndicator && (
          <motion.div
            className="scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            ↓ Scroll Down
          </motion.div>
        )}

        <Modal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
          className="modal-content"
          overlayClassName="modal-overlay"
          style={{
            overlay: { transition: 'opacity 0.3s ease' },
            content: { transition: 'transform 0.3s ease' }
          }}
        >
          {selectedImg && selectedImg.url && (
            <img src={selectedImg.url} alt={(selectedImg?.tags || []).join(", ") || "Image"} className="modal-img" />
          )}
        </Modal>
      </InfiniteScroll>
    </ErrorBoundary>
  );
}