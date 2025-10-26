// client/src/components/Admin/SideNav.js
import React from "react";
import { NavLink } from "react-router-dom";
import { FaUserMd } from "react-icons/fa";

const SideNav = () => {
  return (
    <div className="bg-gradient-to-b from-gray-100 to-blue-100 text-gray-700 w-64 p-6 min-h-screen shadow-2xl">
      <h2 className="text-2xl font-semibold text-blue-700 mb-4">Admin Panel</h2>
      <p className="text-gray-600 mb-6">Welcome back, Administrator!</p>

      <nav className="space-y-3">
        <NavLink
          to="/doctor"
          end
          className={({ isActive }) =>
            `flex items-center py-3 px-4 rounded-lg shadow-md transition-colors duration-200 cursor-pointer hover:bg-blue-500 hover:text-white ${
              isActive ? "bg-blue-500 text-white" : "bg-white"
            }`
          }
        >
          <FaUserMd className="mr-3" />
          <span>Add Doctor</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default SideNav;
