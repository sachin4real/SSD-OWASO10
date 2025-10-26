// controllers/insuranceController.js
const multer = require("multer");
const fs = require("fs");
const { Types } = require("mongoose");
const InsuranceClaim = require("../models/InsuranceClaim");
const Patient = require("../models/Patient");
const { sendClaimEmail } = require("../services/insuranceMailServices");

// Ensure 'uploads/' directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config (basic safety: size + type)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const fileFilter = (_req, file, cb) => {
  // allow common images and pdf
  const ok =
    /image\/(png|jpeg|jpg|gif|webp)/i.test(file.mimetype) ||
    file.mimetype === "application/pdf";
  cb(ok ? null : new Error("Unsupported file type"), ok);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Validate policy number before submission
exports.validatePolicyNumber = async (req, res) => {
  try {
    const { firstName, lastName, mobileNumber, policyNo } = req.body;

    if (!firstName || !lastName || !mobileNumber || !policyNo) {
      return res
        .status(400)
        .json({ message: "firstName, lastName, mobileNumber, policyNo are required" });
    }

    const patient = await Patient.findOne({
      firstName,
      lastName,
      phoneNo: mobileNumber,
    }).lean();

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.insuranceNo !== policyNo) {
      return res.status(400).json({
        message:
          "The provided policy number does not match the registered insurance number.",
      });
    }

    return res.status(200).json({ message: "Policy number validated successfully" });
  } catch (error) {
    console.error("Error validating policy number:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Submit insurance claim and send email notification
exports.submitInsuranceClaim = async (req, res) => {
  try {
    const { policyNo, firstName, lastName, mobileNumber } = req.body;

    if (!firstName || !lastName || !mobileNumber || !policyNo) {
      return res
        .status(400)
        .json({ message: "firstName, lastName, mobileNumber, policyNo are required" });
    }

    const patient = await Patient.findOne({
      firstName,
      lastName,
      phoneNo: mobileNumber,
    }).lean();

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.insuranceNo !== policyNo) {
      return res.status(400).json({
        message:
          "The provided policy number does not match the registered insurance number.",
      });
    }

    const newClaim = new InsuranceClaim({
      ...req.body,
      prescriptionFilePath: req.file ? req.file.path : null,
    });

    await newClaim.save();

    // Best-effort email; do not fail the request if email sending fails
    try {
      if (patient.email) {
        await sendClaimEmail(patient.email);
      }
    } catch (mailErr) {
      console.warn("sendClaimEmail failed:", mailErr?.message || mailErr);
    }

    return res.status(201).json({
      message: "Insurance claim submitted successfully",
      claimId: newClaim.claimId,
    });
  } catch (error) {
    console.error("Error submitting insurance claim:", error);

    if (error.message === "Unsupported file type") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "MulterError") {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed", details: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate value for unique field(s)",
        fields: Object.keys(error.keyPattern || {}),
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

// Fetch all insurance claims
exports.getAllClaims = async (_req, res) => {
  try {
    const claims = await InsuranceClaim.find();
    return res.json(claims);
  } catch (error) {
    console.error("Error fetching claims:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a claim by ID
exports.deleteClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid claim id" });
    }

    const deletedClaim = await InsuranceClaim.findByIdAndDelete(id);
    if (!deletedClaim) {
      return res.status(404).json({ message: "Insurance claim not found" });
    }

    return res.status(200).json({ message: "Insurance claim deleted successfully" });
  } catch (error) {
    console.error("Error deleting claim:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete all claims
exports.deleteAllClaims = async (_req, res) => {
  try {
    await InsuranceClaim.deleteMany({});
    return res.status(200).json({ message: "All insurance claims deleted successfully" });
  } catch (error) {
    console.error("Error deleting all claims:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Export the upload functionality for file handling
exports.upload = upload;
