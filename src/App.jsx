import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "./components/SplashScreen";
import Home from "./pages/Home";

function App() {
  const [showApp, setShowApp] = useState(false);

  // NEW: Toggle body overflow for splash lock
  useEffect(() => {
    if (!showApp) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll'); // Cleanup
  }, [showApp]);

  return (
    <>
      <AnimatePresence mode="wait">
        {!showApp && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <SplashScreen onFinish={() => setShowApp(true)} />
          </motion.div>
        )}
      </AnimatePresence>
      {showApp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
        >
          <Home />
        </motion.div>
      )}
    </>
  );
}

export default App;