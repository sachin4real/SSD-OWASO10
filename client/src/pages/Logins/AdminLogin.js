import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const API_BASE =
  (import.meta?.env?.VITE_API_BASE || process.env.REACT_APP_API_BASE) ??
  "http://localhost:8070";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // If already logged in as admin, go to dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type");
    if (token && type === "admin") {
      window.location.replace("/adminDashboard");
    }
  }, []);

  const canSubmit = useMemo(
    () => email.trim() && password.length >= 1 && !submitting,
    [email, password, submitting]
  );

  const login = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (!/\S+@\S+\.\S+/.test(email)) {
      setMsg("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      const { data } = await axios.post(`${API_BASE}/admin/login`, {
        email: email.trim(),
        password,
      });

      // { rst: "success" | "incorrect password" | "invalid admin", tok?: string }
      if (data?.rst === "success" && data?.tok) {
        localStorage.setItem("type", "admin");
        localStorage.setItem("token", data.tok);
        setMsg("Login successful. Redirecting…");
        window.location.replace("/adminDashboard");
        return;
      }

      if (data?.rst === "incorrect password") {
        setMsg("Incorrect password. Please try again.");
        return;
      }

      if (data?.rst === "invalid admin") {
        setMsg("No admin found for that email.");
        return;
      }

      setMsg("Login failed. Please try again.");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) setMsg("Too many attempts. Please wait and try again.");
      else setMsg("An error occurred during login. Please try again.");
      console.error("Admin login error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 to-blue-300 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-sm w-full flex flex-col items-center">
        <img className="w-24 mb-6" src="/images/Hospital-logo-W.png" alt="Hospital Logo" />
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h1>

        {msg ? (
          <div
            className={`w-full mb-4 text-sm rounded-md p-3 ${
              msg.toLowerCase().includes("success")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {msg}
          </div>
        ) : null}

        <form className="w-full" onSubmit={login}>
          <div className="mb-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-8">
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-full text-gray-700 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-blue-500 text-white py-3 rounded-full font-semibold hover:bg-blue-600 transition-all duration-200 shadow-md transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? "Signing in…" : "Login"}
          </button>
          <p className="mt-6 text-gray-600 text-sm text-center">
            Don’t have an account?{" "}
            <a href="/" className="text-blue-500 hover:underline">
              Go Back
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
