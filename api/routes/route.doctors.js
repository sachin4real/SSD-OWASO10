// routes/route.doctors.js
const express = require("express");
const router = express.Router();

const doctorController = require("../Controllers/controller.doctor");
const auth = require("../middleware/auth");

// Public
router.post("/login", doctorController.loginDoctor);
router.get("/check", doctorController.checkDoctor);

// Protected (for now any logged-in user; later use auth("admin") where needed)
router.post("/add", auth(), doctorController.addDoctor);
router.get("/", auth(), doctorController.getAllDoctors);
router.get("/get/:id", auth(), doctorController.getDoctorById);
router.put("/update/:id", auth(), doctorController.updateDoctor);

module.exports = router;
