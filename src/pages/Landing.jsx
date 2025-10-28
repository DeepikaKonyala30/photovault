import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../App.css";

export default function Landing() {
  const navigate = useNavigate();
  const [currentTagline, setCurrentTagline] = useState(0);

  const taglines = [
    "Capture Your Cosmic Moments",
    "AI-Powered Image Galaxy",
    "Share the Glimmr Magic"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-center">
      {/* Static subtle stars – no movement */}
      <div className="stars-static"></div>

      <div className="content-wrapper">
        {/* LOGO – clean, centered, no glow */}
        <motion.div
          className="logo-wrapper"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <img src="/glimmr-logo.png" alt="Glimmr" className="glimmr-logo-clean" />
        </motion.div>

        {/* Tagline */}
        <motion.h1
          key={currentTagline}
          className="neon-tagline"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          {taglines[currentTagline]}
        </motion.h1>

        {/* Description */}
        <motion.p
          className="landing-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
        Your visual universe, perfected by AI.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="cta-grid"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <motion.button
            onClick={() => navigate("/login")}
            className="neon-btn primary"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px #00d4ff" }}
            whileTap={{ scale: 0.95 }}
          >
            Enter Galaxy
          </motion.button>
          <motion.button
            onClick={() => navigate("/signup")}
            className="neon-btn secondary"
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px #ff00ff" }}
            whileTap={{ scale: 0.95 }}
          >
            Start Glimmring
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}