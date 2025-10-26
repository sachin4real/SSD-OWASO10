// client/src/pages/Admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import DashboardHeader from "../../components/DashboardHeader";
import SideNav from "../../components/Admin/SideNav";
import AllDoctors from "../../components/Admin/AllDoctors";

const API_BASE =
  (import.meta?.env?.VITE_API_BASE || process.env.REACT_APP_API_BASE) ??
  "http://localhost:8070";

const AdminDashboard = () => {
  const [doctorCount, setDoctorCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token") || "";
        const { data } = await axios.get(`${API_BASE}/doctor/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setDoctorCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <DashboardHeader />

      {/* Content */}
      <div className="flex flex-grow flex-col md:flex-row">
        {/* Sidebar (Doctor-only) */}
        <SideNav />

        {/* Main */}
        <div className="flex-grow p-6 bg-white overflow-auto">
          {/* Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-400 shadow-lg rounded-2xl p-6 text-center">
              <h2 className="text-lg font-semibold text-white mb-2">Total Doctors</h2>
              <p className="text-4xl font-bold text-white">
                {loading ? "…" : doctorCount}
              </p>
            </div>
          </div>

          {/* Doctors table */}
          <div className="bg-white shadow-lg rounded-2xl p-8 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Recent Doctors
            </h2>
            <AllDoctors />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
