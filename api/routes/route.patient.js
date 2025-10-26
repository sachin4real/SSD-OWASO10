// routes/route.patient.js
const express = require("express");
const router = express.Router();

const {
  addPatient,
  loginPatient,
  checkToken,
  getPatientById,
  updatePatient,
  deletePatient,
  getAllPatients,
} = require("../Controllers/controller.patient");

const auth = require("../middleware/auth");

// Public
router.post("/login", loginPatient);
router.get("/check", checkToken);
router.post("/add", addPatient); // keep public if this is self-registration; otherwise protect with auth()

// Protected (require any logged-in user; tighten to roles later if needed)
router.get("/get/:id", auth(), getPatientById);
router.put("/update/:id", auth(), updatePatient);
router.delete("/delete/:id", auth(), deletePatient);
router.get("/", auth(), getAllPatients);

module.exports = router;
