// api/routes/route.prescription.js
const express = require("express");
const router = express.Router();

const {
  addPrescription,
  getPrescriptionsByAppointmentId,
  getPrescriptionsByPatientId,
  searchPrescriptionsByPatientId,
} = require("../Controllers/controller.prescription");

// Optional (recommended): protect endpoints
// const auth = require("../middleware/auth");

// Add a new prescription
// router.post("/add", auth(), addPrescription);
router.post("/add", addPrescription);

// Get prescriptions by appointment ID
// router.get("/appointmentPrescriptions/:id", auth(), getPrescriptionsByAppointmentId);
router.get("/appointmentPrescriptions/:id", getPrescriptionsByAppointmentId);

// Get prescriptions by patient ID
// router.get("/patientPrescriptions/:id", auth(), getPrescriptionsByPatientId);
router.get("/patientPrescriptions/:id", getPrescriptionsByPatientId);

// Search prescriptions by patient ID and query (?query=...)
/**
 * Controller already validates:
 *  - patient ObjectId
 *  - query length + escapes regex
 */
 // router.get("/patient/search/:id", auth(), searchPrescriptionsByPatientId);
router.get("/patient/search/:id", searchPrescriptionsByPatientId);

module.exports = router;
