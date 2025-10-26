// client/src/components/Admin/AddDoctor.js
import React, { useState } from "react";
import axios from "axios";
import AllDoctors from "./AllDoctors";
import DashboardHeader from "../DashboardHeader";
import SideNav from "./SideNav";

const API_BASE =
  (import.meta?.env?.VITE_API_BASE || process.env.REACT_APP_API_BASE) ??
  "http://localhost:8070";

const AddDoctor = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualifications, setQualifications] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // remount AllDoctors after add

  const addDoctor = async (e) => {
    e.preventDefault();
    setMsg("");

    // minimal validation
    if (!name.trim()) return setMsg("Name is required");
    if (!/\S+@\S+\.\S+/.test(email)) return setMsg("Valid email is required");
    if (password.length < 6) return setMsg("Password must be at least 6 characters");
    if (!specialization.trim()) return setMsg("Specialization is required");
    if (!qualifications.trim()) return setMsg("Qualifications are required");

    setSubmitting(true);
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(
        `${API_BASE}/doctor/add`,
        { name, email, password, specialization, qualifications },
        { headers }
      );

      setMsg("Doctor created successfully.");
      // reset form
      setName("");
      setEmail("");
      setPassword("");
      setSpecialization("");
      setQualifications("");

      // refresh doctors table
      setRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Create doctor error:", error);
      const status = error?.response?.status;
      if (status === 401) {
        setMsg("Unauthorized. Please log in again.");
        // optional redirect:
        // window.location.replace("/adminLogin");
      } else if (status === 409) {
        setMsg("A doctor with this email already exists.");
      } else if (status === 400) {
        setMsg(error?.response?.data?.error || "Bad request.");
      } else {
        setMsg("Failed to create doctor. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <DashboardHeader />

      <div className="flex flex-col md:flex-row flex-grow">
        {/* Sidebar */}
        <SideNav />

        {/* Main Content */}
        <div className="flex-grow p-6">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-center mb-6">Add Doctor</h1>

            {msg && (
              <div
                className={`mb-4 text-sm rounded-md p-3 ${
                  msg.toLowerCase().includes("success")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {msg}
              </div>
            )}

            <form onSubmit={addDoctor} className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="password"
                placeholder="Password (min 6)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
              <input
                type="text"
                placeholder="Specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Qualifications"
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add Doctor"}
              </button>
            </form>
          </div>

          {/* Doctors table */}
          <AllDoctors key={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default AddDoctor;
