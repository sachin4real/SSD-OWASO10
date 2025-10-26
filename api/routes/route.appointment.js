// api/Routes/route.appointment.js
const router = require("express").Router();
const {
  getChannelAppointments,
  getPatientAppointments,
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  updateAppointment,
  markConsulted,
} = require("../Controllers/controller.appointment");

// Optional auth middleware (recommended)
// const auth = require("../middleware/auth");

// Keep paths the same; controllers now validate IDs & handle errors consistently.

// Get appointments by channel
// router.get("/channelAppointments/:id", auth(), getChannelAppointments);
router.get("/channelAppointments/:id", getChannelAppointments);

// Get appointments by patient
// router.get("/patientAppointments/:id", auth(), getPatientAppointments);
router.get("/patientAppointments/:id", getPatientAppointments);

// Create a new appointment
// router.post("/makeapt", auth(), createAppointment);
router.post("/makeapt", createAppointment);

// Delete an appointment by ID
// router.delete("/delete/:id", auth(), deleteAppointment);
router.delete("/delete/:id", deleteAppointment);

// Fetch a specific appointment by ID
// router.get("/get/:id", auth(), getAppointmentById);
router.get("/get/:id", getAppointmentById);

// Update an appointment's notes
// router.put("/update/:id", auth(), updateAppointment);
router.put("/update/:id", updateAppointment);

// Mark an appointment as consulted
// router.put("/markConsulted/:id", auth(), markConsulted);
router.put("/markConsulted/:id", markConsulted);

module.exports = router;
