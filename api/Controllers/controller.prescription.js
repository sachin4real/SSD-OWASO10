const { Types } = require("mongoose");
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const { sendEmailToPatient } = require("../services/prescriptionMailServices");

const isObjectId = (v) => Types.ObjectId.isValid(v);

// Add a new prescription
exports.addPrescription = async (req, res) => {
  try {
    const { text, apt: appointment, pid: patientId } = req.body;

    if (!patientId || !isObjectId(patientId)) {
      return res.status(400).json({ status: "Invalid patient id" });
    }
    if (appointment && !isObjectId(appointment)) {
      return res.status(400).json({ status: "Invalid appointment id" });
    }
    if (!text || !String(text).trim()) {
      return res.status(400).json({ status: "Prescription text is required" });
    }

    const newPrescription = new Prescription({
      text,
      appointment,
      patient: patientId,
    });

    await newPrescription.save();

    // best-effort email (won't crash if email missing/service fails)
    try {
      const patient = await Patient.findById(patientId).lean();
      if (patient?.email) {
        await sendEmailToPatient(patient.email);
      } else {
        console.warn("Patient email not found");
      }
    } catch (mailErr) {
      console.warn("Email notify failed:", mailErr?.message || mailErr);
    }

    return res.json("Prescription Added");
  } catch (err) {
    console.error("Error saving prescription:", err);
    // surface common mongoose errors cleanly
    if (err.name === "ValidationError") {
      return res.status(400).json({ status: "Validation failed", error: err.message });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ status: `Invalid value for "${err.path}"` });
    }
    return res.status(500).json({ status: "Error in adding prescription", error: err.message });
  }
};

// Get prescriptions by appointment ID
exports.getPrescriptionsByAppointmentId = async (req, res) => {
  try {
    const aid = req.params.id;
    if (!isObjectId(aid)) {
      return res.status(400).json({ status: "Invalid appointment id" });
    }
    const prescriptions = await Prescription.find({ appointment: aid });
    return res.status(200).json({ data: prescriptions });
  } catch (err) {
    console.error("Error fetching prescriptions:", err.message);
    return res
      .status(500)
      .json({ status: "Error in getting prescription details", error: err.message });
  }
};

// Get prescriptions by patient ID
exports.getPrescriptionsByPatientId = async (req, res) => {
  try {
    const pid = req.params.id;
    if (!isObjectId(pid)) {
      return res.status(400).json({ status: "Invalid patient id" });
    }
    const prescriptions = await Prescription.find({ patient: pid });
    return res.status(200).json({ data: prescriptions });
  } catch (err) {
    console.error("Error fetching prescriptions:", err.message);
    return res
      .status(500)
      .json({ status: "Error in getting prescription details", error: err.message });
  }
};

// Search prescriptions by patient ID and query
exports.searchPrescriptionsByPatientId = async (req, res) => {
  try {
    const pid = req.params.id;
    if (!isObjectId(pid)) {
      return res.status(400).json({ error: "Invalid patient id" });
    }

    const q = String(req.query.query || "").trim();
    if (!q) {
      // empty query => return all for that patient (keeps behavior predictable)
      const all = await Prescription.find({ patient: pid });
      return res.json(all);
    }
    if (q.length > 64) {
      return res.status(400).json({ error: "Query too long" });
    }
    const safe = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const rx = new RegExp(safe, "i");

    const results = await Prescription.find({
      patient: pid,
      text: rx,
    });
    return res.json(results);
  } catch (error) {
    console.error("Error searching prescriptions:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
