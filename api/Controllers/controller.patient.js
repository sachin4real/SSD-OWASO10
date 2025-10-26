// Controllers/controller.patient.js
const Patient = require("../models/Patient");
const jwt = require("jsonwebtoken");
const { isObjectId } = require("../utils/ids"); // tiny helper we created earlier

// Use env in prod; fallback keeps local dev working
const JWT_SECRET = process.env.JWT_SECRET || "hey";

/* ------------------------------ add patient ------------------------------- */
exports.addPatient = async (req, res) => {
  try {
    const {
      email,
      password,          // TODO: hash with bcrypt in production
      firstName,
      lastName,
      gender,
      dob,
      civilStatus,
      phone,
      emergencyPhone,
      gaurdianNIC,
      gaurdianName,
      gaurdianPhone,
      height,
      weight,
      bloodGroup,
      allergies,
      medicalStatus,
      insuranceNo,
      insuranceCompany,
    } = req.body;

    const newPatient = new Patient({
      email,
      firstName,
      lastName,
      dob,
      gender,
      password,
      civilStatus,
      phoneNo: phone,
      emergencyPhone,
      gaurdianName,
      gaurdianNIC,
      gaurdianPhone,
      height,
      weight,
      bloodGroup,
      allergies,
      medicalStatus,
      insuranceCompany,
      insuranceNo,
    });

    await newPatient.save();
    return res.json("Patient Added");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add patient" });
  }
};

/* ---------------------------------- login --------------------------------- */
exports.loginPatient = async (req, res) => {
  const { email, password } = req.body;
  try {
    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(401).send({ rst: "invalid user" });

    // plaintext compare for now to match your DB
    if (password !== patient.password) {
      return res.status(401).send({ rst: "incorrect password" });
    }

    const token = jwt.sign(
      { id: patient._id, role: "patient", email: patient.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).send({ rst: "success", data: patient, tok: token });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Login failed" });
  }
};

/* ------------------------------- check token ------------------------------ */
exports.checkToken = async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).send({ rst: "no token", error: "Missing Bearer token" });
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("JWT verify failed:", err.message);
      return res.status(403).send({ rst: "invalid token", error: "Invalid or expired token" });
    }

    const patient = await Patient.findOne({ email: payload.email });
    if (!patient) return res.status(404).send({ rst: "not found" });

    return res.status(200).send({ rst: "checked", patient });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Token check failed" });
  }
};

/* ------------------------------- get by id -------------------------------- */
exports.getPatientById = async (req, res) => {
  try {
    const pid = req.params.id;
    if (!isObjectId(pid)) {
      return res.status(400).send({ status: "Invalid patient id" });
    }

    const patient = await Patient.findById(pid);
    if (!patient) return res.status(404).send({ status: "Patient not found" });

    return res.status(200).send({ status: "Patient fetched", patient });
  } catch (err) {
    return res.status(500).send({
      status: "Error in getting patient details",
      error: err.message,
    });
  }
};

/* --------------------------------- update --------------------------------- */
exports.updatePatient = async (req, res) => {
  try {
    const pid = req.params.id;
    if (!isObjectId(pid)) {
      return res.status(400).send({ status: "Invalid patient id" });
    }

    const updatePatient = req.body;
    const updated = await Patient.findByIdAndUpdate(pid, updatePatient);
    if (!updated) return res.status(404).send({ status: "Patient not found" });

    return res.status(200).send({ status: "Patient updated" });
  } catch (err) {
    return res.status(500).send({
      status: "Error with updating information",
      error: err.message,
    });
  }
};

/* --------------------------------- delete --------------------------------- */
exports.deletePatient = async (req, res) => {
  try {
    const pid = req.params.id;
    if (!isObjectId(pid)) {
      return res.status(400).send({ status: "Invalid patient id" });
    }

    const deleted = await Patient.findByIdAndDelete(pid);
    if (!deleted) return res.status(404).send({ status: "Patient not found" });

    return res.status(200).send({ status: "Patient deleted" });
  } catch (err) {
    return res.status(500).send({
      status: "Error with deleting the Patient",
      error: err.message,
    });
  }
};

/* ------------------------------ get all patients -------------------------- */
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find();
    return res.json(patients);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch patients" });
  }
};
