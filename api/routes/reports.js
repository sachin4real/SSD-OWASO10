const router = require("express").Router();
const { Types } = require("mongoose");
const Report = require("../models/Report");
const Test = require("../models/Test");
const Patient = require("../models/Patient");
const { sendMail } = require("../lib/mailer"); // safe mail wrapper (no crash if creds missing)

/* ------------------------------ helpers ----------------------------------- */
const isObjectId = (v) => Types.ObjectId.isValid(v);
const toObjectId = (v) => new Types.ObjectId(v);

// Escape user input before using it in $regex
function escapeRegex(text = "") {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
function toRegex(text = "", flags = "i") {
  const trimmed = String(text).trim();
  if (!trimmed) return null;
  if (trimmed.length > 64) throw new Error("Query too long");
  return new RegExp(escapeRegex(trimmed), flags);
}

/* --------------------------------- add ------------------------------------ */
router.post("/add", async (req, res) => {
  try {
    const { details, pid: patient, result, tid: test } = req.body;

    // Validate required IDs
    if (!isObjectId(patient)) {
      return res.status(400).json({ error: "Invalid patient id" });
    }
    if (!isObjectId(test)) {
      return res.status(400).json({ error: "Invalid test id" });
    }

    const newReport = new Report({
      details,
      result,
      patient, // store as ObjectId string; Mongoose will cast
      test,
    });

    await newReport.save();

    // Update test status (best-effort)
    await Test.findByIdAndUpdate(test, { status: "Report Created" });

    // Notify patient by email (best-effort; will log [mail] skipped if no creds)
    const p = await Patient.findById(patient).lean();
    if (p && p.email) {
      await sendMail({
        from: process.env.SMTP_USER || "helasuwa@zohomail.com",
        to: p.email,
        subject: "Report Updated",
        text: `Hello,
Your report results have been updated. Please check your profile.

Thank you.`,
      });
    }

    return res.json({ status: "Report Added", reportId: newReport._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add report" });
  }
});

/* ------------------------------ get by test ------------------------------- */


router.get("/getByTest/:id", async (req, res) => {
  try {
    const tid = req.params.id;

    if (!Types.ObjectId.isValid(tid)) {
      return res.status(400).json({ status: "Invalid test id" });
    }

    const report = await Report.findOne({ test: tid });
    if (!report) {
      return res.status(404).json({ status: "Report not found for this test id" });
    }

    return res.status(200).json({ status: "Report fetched", report });
  } catch (err) {
    console.error(err.message);
    return res
      .status(500)
      .json({ status: "Error in getting report details", error: err.message });
  }
});


/* ------------------------------- get by id -------------------------------- */
router.get("/get/:id", async (req, res) => {
  try {
    const rid = req.params.id;
    if (!isObjectId(rid)) {
      return res.status(400).json({ status: "Invalid report id" });
    }

    const report = await Report.findById(rid);
    if (!report) return res.status(404).json({ status: "Report not found" });

    return res.status(200).json({ status: "Report fetched", report });
  } catch (err) {
    console.log(err.message);
    return res
      .status(500)
      .json({ status: "Error in getting report details", error: err.message });
  }
});

/* -------------------------------- update ---------------------------------- */
router.put("/update/:id", async (req, res) => {
  try {
    const rid = req.params.id;
    if (!isObjectId(rid)) {
      return res.status(400).json({ status: "Invalid report id" });
    }

    const { details, pid: patient, result, tid: test } = req.body;

    // Optional IDs: validate only if provided
    if (patient && !isObjectId(patient)) {
      return res.status(400).json({ status: "Invalid patient id" });
    }
    if (test && !isObjectId(test)) {
      return res.status(400).json({ status: "Invalid test id" });
    }

    const updateReport = {
      ...(details !== undefined && { details }),
      ...(patient !== undefined && { patient }),
      ...(result !== undefined && { result }),
      ...(test !== undefined && { test }),
      date: new Date(), // correct way; mongoose.now() is not a function
    };

    const updated = await Report.findByIdAndUpdate(rid, updateReport);
    if (!updated) return res.status(404).json({ status: "Report not found" });

    return res.status(200).json({ status: "Report updated" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ status: "Error with updating information", error: err.message });
  }
});

/* --------------------------- search by patient ---------------------------- */
router.get("/patient/search/:id", async (req, res) => {
  try {
    const pid = req.params.id;
    if (!isObjectId(pid)) {
      return res.status(400).json({ error: "Invalid patient id" });
    }

    const rx = toRegex(req.query.query || "");
    const filter = {
      patient: pid,
      ...(rx ? { details: rx } : {}),
    };

    const results = await Report.find(filter);
    return res.json(results);
  } catch (error) {
    console.error(error);
    const msg = error && error.message === "Query too long" ? "Query too long" : "Server error";
    return res.status(400).json({ error: msg });
  }
});

module.exports = router;
