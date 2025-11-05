// Signup.jsx (Updated)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import "../App.css";

function Signup({ setIsAuth, setShowSplashAfterAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", { email, password });
      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      setIsAuth(true); // Update auth state
      setShowSplashAfterAuth(true); // Trigger splash screen
      setMessage("Signup successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // Rest of the component remains the same (UI code from previous step)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="container"
      style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}
    >
      <motion.h2
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="glow"
        style={{ textAlign: "center", marginBottom: "1.5rem" }}
      >
        Join Glimmr
      </motion.h2>
      <form onSubmit={handleSignup}>
        <motion.input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        />
        <motion.input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
        <motion.button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ width: "100%", marginTop: "1rem" }}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </motion.button>
        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              marginTop: "1rem",
              textAlign: "center",
              color: message.includes("successful") ? "#10b981" : "#f87171",
            }}
          >
            {message}
          </motion.div>
        )}
      </form>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ textAlign: "center", marginTop: "1rem" }}
      >
        Already have an account?{" "}
        <a href="/login" style={{ color: "#2563eb" }}>
          Log in
        </a>
      </motion.p>
    </motion.div>
  );
}

export default Signup;