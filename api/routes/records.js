// routes/records.js
const router = require("express").Router();
const { Types } = require("mongoose");
const Record = require("../models/Record");
const Prescription = require("../models/Prescription");
const Test = require("../models/Test");
const Report = require("../models/Report");
const Appointment = require("../models/Appointment");

// helpers
const isObjectId = (v) => Types.ObjectId.isValid(v);
function escapeRegex(text = "") {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
function toRegex(text = "", flags = "i") {
  const trimmed = String(text).trim();
  if (!trimmed) return null;
  if (trimmed.length > 64) throw new Error("Query too long");
  return new RegExp(escapeRegex(trimmed), flags);
}

/* ---------------------------------- ADD ----------------------------------- */
// POST /record/add
router.post("/add", async (req, res) => {
  try {
    const { title, reason, pid: patient } = req.body;

    if (!isObjectId(patient)) {
      return res.status(400).json({ error: "Invalid patient id" });
    }

    // Parallel counts (faster, safer)
    const [prescriptions, reports, tests, appointments] = await Promise.all([
      Prescription.countDocuments({ patient }),
      Report.countDocuments({ patient }),
      Test.countDocuments({ patient }),
      Appointment.countDocuments({ patient }),
    ]);

    const newRecord = new Record({
      patient,
      title,
      reason,
      prescriptions,
      appointments,
      tests,
      reports,
    });

    await newRecord.save();
    return res.json({ status: "Record Added", recordId: newRecord._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add record" });
  }
});

/* -------------------------------- LIST ALL -------------------------------- */
// GET /record/
router.get("/", async (_req, res) => {
  try {
    const records = await Record.find();
    return res.json(records);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to fetch records" });
  }
});

/* -------------------------------- GET ONE --------------------------------- */
// GET /record/get/:id
router.get("/get/:id", async (req, res) => {
  try {
    const rid = req.params.id;
    if (!isObjectId(rid)) {
      return res.status(400).json({ status: "Invalid record id" });
    }

    const record = await Record.findById(rid);
    if (!record) return res.status(404).json({ status: "Record not found" });

    return res.status(200).json({ status: "Record fetched", record });
  } catch (err) {
    console.log(err.message);
    return res
      .status(500)
      .json({ status: "Error in getting record details", error: err.message });
  }
});

/* -------------------------------- SEARCH ---------------------------------- */
// GET /record/search?query=...
// NOTE: Your original searched the Test collection. Keeping that behavior,
// but with safe regex. If you intended to search Records instead, tell me and I’ll switch it.
router.get("/search", async (req, res) => {
  try {
    const rx = toRegex(req.query.query || "");
    const filter = rx ? { $or: [{ title: rx }, { reason: rx }] } : {};

    const results = await Test.find(filter);
    return res.json(results);
  } catch (error) {
    console.error(error);
    const msg = error && error.message === "Query too long" ? "Query too long" : "Server error";
    return res.status(400).json({ error: msg });
  }
});

/* -------------------------------- DELETE ---------------------------------- */
// DELETE /record/delete/:id
router.delete("/delete/:id", async (req, res) => {
  try {
    const rid = req.params.id;
    if (!isObjectId(rid)) {
      return res.status(400).json({ status: "Invalid record id" });
    }

    const deleted = await Record.findByIdAndDelete(rid);
    if (!deleted) return res.status(404).json({ status: "Record not found" });

    return res.status(200).json({ status: "Record deleted" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ status: "Error deleting record", error: err.message });
  }
});

/* -------------------------------- UPDATE ---------------------------------- */
// PUT /record/update/:id
router.put("/update/:id", async (req, res) => {
  try {
    const rid = req.params.id;
    if (!isObjectId(rid)) {
      return res.status(400).json({ status: "Invalid record id" });
    }

    const { title, reason } = req.body;
    const updateRecord = {};
    if (title !== undefined) updateRecord.title = title;
    if (reason !== undefined) updateRecord.reason = reason;

    const updated = await Record.findByIdAndUpdate(rid, updateRecord);
    if (!updated) return res.status(404).json({ status: "Record not found" });

    return res.status(200).json({ status: "Record updated" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ status: "Error updating record", error: err.message });
  }
});

module.exports = router;
