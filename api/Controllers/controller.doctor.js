// Controllers/doctorController.js

const Doctor = require("../models/Doctor");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../lib/mailer");     // safe mail wrapper (Step 1 from earlier)
const { isObjectId } = require("../utils/ids");    // tiny helper

// Use env in prod; fallback keeps local dev working
const JWT_SECRET = process.env.JWT_SECRET || "hey";
const FROM_EMAIL = process.env.SMTP_USER || "helasuwa@zohomail.com";

/* -------------------------------- add doctor ------------------------------- */
exports.addDoctor = async (req, res) => {
  try {
    const { email, password, name, specialization, qualifications } = req.body;

    const newDoctor = new Doctor({
      email,
      name,
      password, // TODO: hash with bcrypt in production
      specialization,
      qualifications,
    });

    await newDoctor.save();

    // fire-and-forget, won’t crash if SMTP creds are missing
    await sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Helasuwa Doctor Profile",
      text: `Thank you for joining us!

Email: ${email}
Password: ${password}
`,
    });

    return res.json("Doctor Added");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add doctor" });
  }
};

/* --------------------------------- login ---------------------------------- */
exports.loginDoctor = async (req, res) => {
  const { email, password } = req.body;
  try {
    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.status(401).send({ rst: "invalid doctor" });

    // plaintext compare for now to match your DB
    if (password !== doctor.password) {
      return res.status(401).send({ rst: "incorrect password" });
    }

    const token = jwt.sign(
      { id: doctor._id, role: "doctor", email: doctor.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).send({ rst: "success", data: doctor, tok: token });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Login failed" });
  }
};

/* ------------------------------ check doctor ------------------------------ */
exports.checkDoctor = async (req, res) => {
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

    const doctor = await Doctor.findOne({ email: payload.email });
    if (!doctor) return res.status(404).send({ rst: "not found" });

    return res.status(200).send({ rst: "checked", doctor });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Token check failed" });
  }
};

/* ------------------------------ get all doctors --------------------------- */
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    return res.json(doctors);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to fetch doctors" });
  }
};

/* ------------------------------- get doctor by id ------------------------- */
exports.getDoctorById = async (req, res) => {
  try {
    const cid = req.params.id;
    if (!isObjectId(cid)) {
      return res.status(400).send({ status: "Invalid doctor id" });
    }

    const doctor = await Doctor.findById(cid);
    if (!doctor) return res.status(404).send({ status: "Doctor not found" });

    return res.status(200).send({ status: "Doctor fetched", doctor });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({
      status: "Error in getting doctor details",
      error: err.message,
    });
  }
};

/* -------------------------------- update doctor --------------------------- */
exports.updateDoctor = async (req, res) => {
  try {
    const did = req.params.id;
    if (!isObjectId(did)) {
      return res.status(400).send({ status: "Invalid doctor id" });
    }

    const { name, email, specialization, qualifications, password } = req.body;

    const updateDoctor = {
      name,
      email,
      specialization,
      qualifications,
      password, // TODO: hash in production
    };

    const updated = await Doctor.findByIdAndUpdate(did, updateDoctor);
    if (!updated) return res.status(404).send({ status: "Doctor not found" });

    return res.status(200).send({ status: "Doctor updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      status: "Error with updating information",
      error: err.message,
    });
  }
};
