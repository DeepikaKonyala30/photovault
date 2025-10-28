// Login.jsx (Updated)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import "../App.css";

function Login({ setIsAuth, setShowSplashAfterAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      setIsAuth(true); // Update auth state
      setShowSplashAfterAuth(true); // Trigger splash screen
      setMessage("Login successful!");
      setTimeout(() => navigate("/home"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed.");
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
        Login to Glimmr
      </motion.h2>
      <form onSubmit={handleLogin}>
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
          {isLoading ? "Logging in..." : "Login"}
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
        Don't have an account?{" "}
        <a href="/signup" style={{ color: "#2563eb" }}>
          Sign up
        </a>
      </motion.p>
    </motion.div>
  );
}

export default Login;