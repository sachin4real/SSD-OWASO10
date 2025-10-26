// client/src/components/Admin/AllDoctors.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE =
  (import.meta?.env?.VITE_API_BASE || process.env.REACT_APP_API_BASE) ??
  "http://localhost:8070";

const AllDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const getDoctors = async () => {
      setLoading(true);
      setErr("");
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token") || "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE}/doctor/`, { headers });
        setDoctors(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error(error);
        const status = error?.response?.status;
        if (status === 401) {
          setErr("Unauthorized. Please log in as admin again.");
        } else {
          setErr("Failed to load doctors.");
        }
      } finally {
        setLoading(false);
      }
    };

    getDoctors();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {err && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
          {err}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-lg rounded-lg">
          <thead className="bg-blue-500 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Doctor ID</th>
              <th className="px-4 py-2 text-left">Doctor Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Specialization</th>
              <th className="px-4 py-2 text-left">Qualification</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : doctors.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                  No doctors found.
                </td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr
                  key={doctor._id}
                  className="hover:bg-gray-50 border-b border-gray-200"
                >
                  <td className="px-4 py-2">{doctor._id}</td>
                  <td className="px-4 py-2">{doctor.name}</td>
                  <td className="px-4 py-2">{doctor.email}</td>
                  <td className="px-4 py-2">{doctor.specialization}</td>
                  <td className="px-4 py-2">{doctor.qualifications}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllDoctors;
