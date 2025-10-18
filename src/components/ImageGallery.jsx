import React, { useState, Component, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "react-modal";
import InfiniteScroll from "react-infinite-scroll-component";
import { Blurhash } from 'react-blurhash';

Modal.setAppElement("#root");

// Error Boundary
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <p style={{ textAlign: 'center', color: '#f87171' }}>Error loading gallery. Please refresh.</p>;
    }
    return this.props.children;
  }
}

export default function ImageGallery({ images = [], fetchMore, hasMore, loading, isFiltered }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(hasMore);
  const scrollRef = useRef(null);
  const galleryRef = useRef(null); // New: For keyboard nav

  const openModal = (img) => {
    setSelectedImg(img);
    setModalIsOpen(true);
  };

  // New: Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (modalIsOpen) return; // Skip if modal open
      const focused = document.activeElement;
      if (focused.closest('[role="gridcell"]')) {
        const cards = galleryRef.current?.querySelectorAll('[role="gridcell"]');
        const currentIndex = Array.from(cards).indexOf(focused);
        if (e.key === 'ArrowRight' && currentIndex < cards.length - 1) {
          cards[currentIndex + 1].focus();
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          cards[currentIndex - 1].focus();
        } else if (e.key === 'Enter') {
          const img = images[currentIndex];
          if (img) openModal(img);
        }
      } else if (e.key === 'ArrowDown' && galleryRef.current) {
        galleryRef.current.focus(); // Enter grid
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images, modalIsOpen]);

  // Handle scroll indicator visibility
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

  // Skeleton loader component
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

  return (
    <ErrorBoundary>
      <InfiniteScroll
        dataLength={images.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center' }}
          >
            <div className="spinner" style={{ margin: '0 auto' }} />
            Loading more...
          </motion.p>
        }
        scrollThreshold={0.9}
        scrollableTarget="gallery-container"
      >
        <AnimatePresence mode="wait">
          {/* New: ARIA Grid */}
          <motion.div
            ref={galleryRef}
            key={`${images.length}-${isFiltered}`}
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
              images.map((img, index) => (
                <motion.div
                  key={`${img._id || img.id}-${index}`}
                  className="image-card"
                  role="gridcell"
                  aria-label={`Image with tags: ${img.tags?.join(', ') || 'No tags'}`}
                  tabIndex={0}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ scale: 1.03 }}
                  style={{ willChange: 'transform, opacity', position: 'relative' }} // For blur overlay
                  onClick={() => openModal(img)}
                >
                  {/* New: Blurhash Placeholder */}
                  <Blurhash
                    hash={img.blurhash || 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'} // Fallback generic blur
                    width="100%"
                    height={192} // Matches 12rem @16px
                    resolutionX={32}
                    resolutionY={32}
                    punch={1}
                    className="placeholder-blur"
                  />
                  <img
                    loading="lazy"
                    src={img.url}
                    alt={img.tags?.join(", ") || "Image"}
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
                    {img.tags?.join(", ") || "No tags"}
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
          {selectedImg && (
            <img src={selectedImg.url} alt={selectedImg.tags?.join(", ") || "Image"} className="modal-img" />
          )}
        </Modal>
      </InfiniteScroll>
    </ErrorBoundary>
  );
}