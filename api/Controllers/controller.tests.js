// Controllers/controller.tests.js   <-- save with this exact path/name to match your routes
const { Types } = require("mongoose");
const Test = require("../models/Test");

const isObjectId = (v) => Types.ObjectId.isValid(v);
const escapeRegex = (text = "") =>
  String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
const toRegex = (text = "", flags = "i") => {
  const t = String(text).trim();
  if (!t) return null;
  if (t.length > 64) throw new Error("Query too long");
  return new RegExp(escapeRegex(t), flags);
};

// Add a new test
exports.addTest = async (req, res) => {
  try {
    const { pid: patient, name, age, type } = req.body;

    if (!patient || !isObjectId(patient)) {
      return res.status(400).json({ error: "Invalid patient id" });
    }
    if (!name || !type) {
      return res.status(400).json({ error: "name and type are required" });
    }
    if (age !== undefined && !Number.isFinite(Number(age))) {
      return res.status(400).json({ error: "age must be a number" });
    }

    const doc = new Test({
      patient,
      name,
      age: age !== undefined ? Number(age) : undefined,
      type,
    });

    await doc.save();
    return res.status(201).json({ status: "Test Added", id: doc._id });
  } catch (err) {
    console.error(err);
    if (err.name === "ValidationError") {
      const details = Object.entries(err.errors || {}).map(([field, e]) => ({
        field,
        message: e?.message || "Invalid value",
      }));
      return res.status(400).json({ error: "Validation failed", errors: details });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ error: `Invalid value for "${err.path}"` });
    }
    if (err.code === 11000) {
      return res.status(409).json({ error: "Duplicate value", fields: Object.keys(err.keyPattern || {}) });
    }
    return res.status(500).json({ error: "Error adding test", message: err.message });
  }
};

// Get all tests
exports.getAllTests = async (_req, res) => {
  try {
    const tests = await Test.find();
    return res.json(tests);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error retrieving tests", message: err.message });
  }
};

// Get a test by ID
exports.getTestById = async (req, res) => {
  try {
    const tid = req.params.id;
    if (!isObjectId(tid)) {
      return res.status(400).json({ status: "Invalid test id" });
    }
    const test = await Test.findById(tid);
    if (!test) return res.status(404).json({ status: "Test not found" });
    return res.status(200).json({ status: "Test fetched", test });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ status: "Error fetching test details", error: err.message });
  }
};

// Search tests by query
exports.searchTests = async (req, res) => {
  try {
    const rx = toRegex(req.query.query || "");
    const filter = rx
      ? { $or: [{ type: rx }, { name: rx }, { status: rx }] }
      : {}; // no query => return all (keep behavior simple)

    const results = await Test.find(filter);
    return res.json(results);
  } catch (error) {
    console.error(error);
    const msg = error && error.message === "Query too long" ? "Query too long" : "Server error";
    return res.status(400).json({ error: msg, message: error.message });
  }
};

// Delete a test by ID
exports.deleteTestById = async (req, res) => {
  try {
    const tid = req.params.id;
    if (!isObjectId(tid)) {
      return res.status(400).json({ status: "Invalid test id" });
    }
    const deleted = await Test.findByIdAndDelete(tid);
    if (!deleted) return res.status(404).json({ status: "Test not found" });
    return res.status(200).json({ status: "Test deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "Error deleting test", error: err.message });
  }
};
