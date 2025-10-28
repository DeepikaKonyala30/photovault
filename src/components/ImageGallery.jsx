import React, { useState, Component, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "react-modal";
import InfiniteScroll from "react-infinite-scroll-component";
import { Blurhash } from 'react-blurhash';
import { Share2, Link2 } from "lucide-react";

Modal.setAppElement("#root");

// ------------------------------------------------
// SHARE + COPY helpers (both fixed & working)
// ------------------------------------------------
const shareImage = async (url, title) => {
  let shortUrl = url;

  // Shorten with Bitly (if token exists)
  const bitlyToken = import.meta.env.VITE_BITLY_TOKEN;
  if (bitlyToken) {
    try {
      const res = await fetch("https://api-ssl.bitly.com/v4/shorten", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bitlyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ long_url: url }),
      });
      const data = await res.json();
      if (data.link) shortUrl = data.link;
    } catch (err) {
      console.warn("Bitly failed, using original URL");
    }
  }

  // Try native share
  if (navigator.share) {
    try {
      await navigator.share({ title, url: shortUrl });
      return;
    } catch (_) { /* ignore */ }
  }

  // Fallback: copy short URL
  navigator.clipboard.writeText(shortUrl).then(() => {
    alert(`Short link copied!\n${shortUrl}`);
  }).catch(() => {
    prompt("Copy this short link:", shortUrl);
  });
};

// ------------------------------------------------
// COPY LINK – now copies SHORT URL (same as Share)
// ------------------------------------------------
const copyLink = async (url) => {
  let shortUrl = url;

  // Reuse Bitly logic (same as share)
  const bitlyToken = import.meta.env.VITE_BITLY_TOKEN;
  if (bitlyToken) {
    try {
      const res = await fetch("https://api-ssl.bitly.com/v4/shorten", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bitlyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ long_url: url }),
      });
      const data = await res.json();
      if (data.link) shortUrl = data.link;
    } catch (err) {
      console.warn("Bitly failed for copy, using original URL");
    }
  }

  // Copy the short URL
  navigator.clipboard.writeText(shortUrl).then(() => {
    alert(`Short link copied!\n${shortUrl}`);
  }).catch(() => {
    prompt("Copy this short link:", shortUrl);
  });
};
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) {
    console.error("Gallery Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', color: '#f87171', padding: '2rem' }}
        >
          <h3>Oops! Gallery Glitched</h3>
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
  const galleryRef = useRef(null);

  const safeImages = React.useMemo(() => {
    return (images || []).filter(img => img && img._id && img.url);
  }, [images]);

  const openModal = (img) => {
    if (!img) return;
    setSelectedImg(img);
    setModalIsOpen(true);
  };

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
          const img = safeImages[currentIndex];
          if (img) openModal(img);
        }
      } else if (e.key === 'ArrowDown' && galleryRef.current) {
        galleryRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeImages, modalIsOpen]);

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
      handleScroll();
    }
    return () => {
      if (scrollContainer) scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore]);

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
        dataLength={safeImages.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        scrollableTarget="gallery-container"
        style={{ overflow: "visible" }}
      >
        <motion.div
          ref={galleryRef}
          className="gallery-grid"
          role="grid"
          aria-label="Image gallery"
        >
          <AnimatePresence>
            {loading && !safeImages.length
              ? Array.from({ length: 12 }).map((_, index) => (
                  <SkeletonCard key={`skeleton-${index}`} />
                ))
              : safeImages.map((img, index) => (
                  <motion.div
                    key={`${img._id || img.id}-${index}`}
                    className="image-card"
                    role="gridcell"
                    aria-label={`Image with tags: ${(img?.tags || []).join(', ') || 'No tags'}`}
                    tabIndex={0}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    whileHover={{ scale: 1.03 }}
                    style={{ willChange: 'transform, opacity', position: 'relative' }}
                    onClick={() => openModal(img)}
                  >
                    {/* NEW! Badge */}
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
                        New!
                      </motion.span>
                    )}

                    {/* ACTION BUTTONS: Share + Copy Link */}
                    <div className="action-btns">
                      <button
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); shareImage(img.url, (img?.tags || []).join(', ') || 'Glimmr Image'); }}
                        aria-label="Share"
                      >
                        <Share2 size={18} />
                      </button>

                      <button
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); copyLink(img.url); }}
                        aria-label="Copy link"
                      >
                        <Link2 size={18} />
                      </button>
                    </div>

                    <Blurhash
                      hash={img.blurhash || 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'}
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
                      alt={(img?.tags || []).join(", ") || "Image"}
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
                      {(img?.tags || []).join(", ") || "No tags"}
                    </div>
                  </motion.div>
                ))
            }
          </AnimatePresence>

          {showScrollIndicator && (
            <motion.div
              className="scroll-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Scroll Down
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
        </motion.div>
      </InfiniteScroll>
    </ErrorBoundary>
  );
}