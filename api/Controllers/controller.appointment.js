// api/Controllers/controller.appointment.js
const { Types } = require("mongoose");
const Appointment = require("../models/Appointment");
const Channel = require("../models/Channel");
const Patient = require("../models/Patient");
const { sendMail } = require("../lib/mailer"); // safe mail wrapper

const isObjectId = (v) => Types.ObjectId.isValid(v);
const FROM_EMAIL = process.env.SMTP_USER || "helasuwa@zohomail.com";

/* -------------------------- Get by channel id ----------------------------- */
exports.getChannelAppointments = async (req, res) => {
  try {
    const cid = req.params.id;
    if (!isObjectId(cid)) {
      return res.status(400).json({ status: "Invalid channel id" });
    }

    const appointments = await Appointment.find({ channel: cid });
    return res.status(200).json({ data: appointments });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      status: "Error in getting appointment details",
      error: err.message,
    });
  }
};

/* -------------------------- Get by patient id ----------------------------- */
exports.getPatientAppointments = async (req, res) => {
  try {
    const pid = req.params.id;
    if (!isObjectId(pid)) {
      return res.status(400).json({ status: "Invalid patient id" });
    }

    const appointments = await Appointment.find({ patient: pid });
    return res.status(200).json({ data: appointments });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      status: "Error in getting appointment details",
      error: err.message,
    });
  }
};

/* ------------------------------ Create new --------------------------------
Expected request body:
{
  "patient": "<ObjectId|string>",
  "notes": "optional string",
  // Either provide a channelId OR the full channel doc; we'll accept both:
  "channelId": "<ObjectId|string>"  // preferred
  // OR
  "channel": { "_id": "...", "doctor": "...", ... }  // legacy clients
  "name": "...",
  "age": 30,
  "gender": "M",
  "contact": "07..."
}
--------------------------------------------------------------------------- */
exports.createAppointment = async (req, res) => {
  try {
    const { patient, notes, name, age, gender, contact } = req.body;

    // accept either channelId or legacy channel object
    const channelId =
      req.body.channelId ||
      (req.body.channel && (req.body.channel._id || req.body.channel));

    if (!isObjectId(patient)) {
      return res.status(400).json({ status: "Invalid patient id" });
    }
    if (!channelId || !isObjectId(channelId)) {
      return res.status(400).json({ status: "Invalid channel id" });
    }

    // Fetch channel
    const ch = await Channel.findById(channelId).lean();
    if (!ch) return res.status(404).json({ status: "Channel not found" });

    if (ch.completed) {
      return res.status(409).json({ status: "Channel has been completed/closed" });
    }

    // Atomically increment patients with guard against overbooking
    // Only increment if patients < maxPatients
    const incResult = await Channel.findOneAndUpdate(
      { _id: channelId, patients: { $lt: ch.maxPatients } },
      { $inc: { patients: 1 } },
      { new: true }
    ).lean();

    if (!incResult) {
      // Either channel not found or already full
      return res.status(409).json({ status: "Channel capacity reached" });
    }

    const appointmentNo = incResult.patients; // after increment
    const startDateTime = new Date(ch.startDateTime);
    const arrivalTime = new Date(startDateTime.getTime() + 15 * 60000 * (appointmentNo - 1));

    const newAppointment = new Appointment({
      channel: channelId,
      patient,
      appointmentNo,
      notes,
      arrivalTime,
      name,
      age,
      gender,
      contact,
    });

    await newAppointment.save();

    // If now full, mark channel completed=true
    if (incResult.patients >= ch.maxPatients && !incResult.completed) {
      await Channel.findByIdAndUpdate(channelId, { completed: true });
    }

    // Email patient (best-effort; will skip if no SMTP creds)
    const pt = await Patient.findById(patient).lean();
    if (pt && pt.email) {
      const drName = ch.drName || "your doctor";
      await sendMail({
        from: FROM_EMAIL,
        to: pt.email,
        subject: "Appointment Confirmation",
        text: `Hello,
Your appointment has been scheduled with Dr. ${drName}.
Appointment No: ${appointmentNo}
Date & Time: ${startDateTime.toString()}
Please arrive around ${arrivalTime.toLocaleString()} to minimize waiting.

Thank you.`,
      });
    }

    return res.json({ status: "Appointment created", appointmentId: newAppointment._id });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      status: "Error in creating appointment",
      error: err.message,
    });
  }
};

/* ------------------------------ Delete by id ------------------------------ */
exports.deleteAppointment = async (req, res) => {
  try {
    const aid = req.params.id;
    if (!isObjectId(aid)) {
      return res.status(400).json({ status: "Invalid appointment id" });
    }

    const apt = await Appointment.findById(aid);
    if (!apt) return res.status(404).json({ status: "Appointment not found" });

    const cid = apt.channel;
    if (isObjectId(cid)) {
      // Decrement patient count atomically, but never below 0
      await Channel.findByIdAndUpdate(cid, {
        $inc: { patients: -1 },
        $setOnInsert: { patients: 0 },
      });
    }

    await Appointment.findByIdAndDelete(aid);
    return res.status(200).json({ status: "Appointment deleted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      status: "Error in deleting appointment",
      error: err.message,
    });
  }
};

/* ------------------------------ Get by id --------------------------------- */
exports.getAppointmentById = async (req, res) => {
  try {
    const aid = req.params.id;
    if (!isObjectId(aid)) {
      return res.status(400).json({ status: "Invalid appointment id" });
    }

    const apt = await Appointment.findById(aid);
    if (!apt) return res.status(404).json({ status: "Appointment not found" });

    return res.status(200).json({ status: "Appointment fetched", apt });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      status: "Error in getting appointment details",
      error: err.message,
    });
  }
};

/* ------------------------------ Update notes ------------------------------ */
exports.updateAppointment = async (req, res) => {
  try {
    const aid = req.params.id;
    if (!isObjectId(aid)) {
      return res.status(400).json({ status: "Invalid appointment id" });
    }

    const { notes } = req.body;
    const updated = await Appointment.findByIdAndUpdate(aid, { notes });
    if (!updated) return res.status(404).json({ status: "Appointment not found" });

    return res.status(200).json({ status: "Appointment updated" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      status: "Error in updating appointment",
      error: err.message,
    });
  }
};

/* ------------------------------ Mark consulted ---------------------------- */
exports.markConsulted = async (req, res) => {
  try {
    const aid = req.params.id;
    if (!isObjectId(aid)) {
      return res.status(400).json({ status: "Invalid appointment id" });
    }

    const updated = await Appointment.findByIdAndUpdate(aid, { consulted: true });
    if (!updated) return res.status(404).json({ status: "Appointment not found" });

    return res.status(200).json({ status: "Appointment marked as consulted" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      status: "Error in marking appointment",
      error: err.message,
    });
  }
};
