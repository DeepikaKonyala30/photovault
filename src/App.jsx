import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "./components/SplashScreen";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import "./App.css";

function App() {
  const [showApp, setShowApp] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [showSplashAfterAuth, setShowSplashAfterAuth] = useState(false);

  // Verify token on load
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.get("http://localhost:5000/api/auth/verify", {
            headers: { Authorization: `Bearer ${token}` },
          });
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          setIsAuth(true);
        } catch (err) {
          console.log("Invalid token, clearing...");
          localStorage.removeItem("token");
        }
      }
      setShowApp(true);
    };
    verifyToken();
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (!showApp) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }
    return () => document.body.classList.remove("no-scroll");
  }, [showApp]);

  // Post-auth splash
  useEffect(() => {
    if (showSplashAfterAuth) {
      setShowApp(false);
      const timer = setTimeout(() => {
        setShowApp(true);
        setShowSplashAfterAuth(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSplashAfterAuth]);

  // Protected route
  const ProtectedRoute = ({ children }) => {
    if (!isAuth) {
      return <Navigate to="/landing" replace />;
    }
    return children;
  };

  return (
    <Router>
      <AnimatePresence mode="wait">
        {!showApp && (
          <motion.div key="splash" exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            <SplashScreen onFinish={() => setShowApp(true)} />
          </motion.div>
        )}
      </AnimatePresence>

      {showApp && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
          <Routes>
            {/* Public */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/" element={<Navigate to="/landing" replace />} />

            {/* Auth */}
            <Route
              path="/login"
              element={<Login setIsAuth={setIsAuth} setShowSplashAfterAuth={setShowSplashAfterAuth} />}
            />
            <Route
              path="/signup"
              element={<Signup setIsAuth={setIsAuth} setShowSplashAfterAuth={setShowSplashAfterAuth} />}
            />

            {/* Protected – this is the key fix */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to={isAuth ? "/home" : "/landing"} replace />} />
          </Routes>
        </motion.div>
      )}
    </Router>
  );
}

export default App;