// Controllers/controller.admin.js
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../lib/mailer");
const { isObjectId } = require("../utils/ids");

// Use env var in prod; fallback prevents local dev from breaking
const JWT_SECRET = process.env.JWT_SECRET || "hey";
const FROM_EMAIL = process.env.SMTP_USER || "helasuwa@zohomail.com";

/* ------------------------------- util: regex ------------------------------- */
function escapeRegex(text = "") {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
function toRegex(text = "", flags = "i") {
  const trimmed = String(text).trim();
  if (!trimmed) return null;
  if (trimmed.length > 64) throw new Error("Query too long");
  return new RegExp(escapeRegex(trimmed), flags);
}

/* -------------------------------- add admin ------------------------------- */
exports.addAdmin = async (req, res) => {
  try {
    const { email, name, phone, roleName, allocatedWork, password } = req.body;

    const newAdmin = new Admin({
      email,
      name,
      password, // TODO: bcrypt hash in production
      phone,
      roleName,
      allocatedWork,
    });

    await newAdmin.save();

    // fire-and-forget (won't crash dev if creds absent)
    await sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Staff Profile Created",
      text: `Hello,
Your Staff Account has been created.

Email: ${email}
Password: ${password}

Thank you.`,
    });

    return res.json("Admin Added");
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add admin" });
  }
};

/* ------------------------------ delete admin ------------------------------ */
exports.deleteAdmin = async (req, res) => {
  try {
    const aid = req.params.id;
    if (!isObjectId(aid)) return res.status(400).send({ status: "Invalid admin id" });

    const deleted = await Admin.findByIdAndDelete(aid);
    if (!deleted) return res.status(404).send({ status: "Staff not found" });

    return res.status(200).send({ status: "Staff deleted" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ status: "Error with deleting the admin", error: err.message });
  }
};

/* ---------------------------------- login --------------------------------- */
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).send({ rst: "invalid admin" });

    // plaintext compare to match your current DB; switch to bcrypt later
    if (password !== admin.password) return res.status(401).send({ rst: "incorrect password" });

    const token = jwt.sign(
      { id: admin._id, role: admin.roleName, email: admin.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    return res.status(200).send({ rst: "success", data: admin, tok: token });
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

    const admin = await Admin.findOne({ email: payload.email });
    if (!admin) return res.status(404).send({ rst: "not found" });

    return res.status(200).send({ rst: "checked", admin });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Token check failed" });
  }
};

/* ------------------------------ list admins ------------------------------- */
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    return res.json(admins);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to fetch admins" });
  }
};

/* ------------------------------- get by id -------------------------------- */
exports.getAdminById = async (req, res) => {
  try {
    const aid = req.params.id;
    if (!isObjectId(aid)) return res.status(400).send({ status: "Invalid admin id" });

    const staff = await Admin.findById(aid);
    if (!staff) return res.status(404).send({ status: "Staff not found" });

    return res.status(200).send({ status: "Staff fetched", staff });
  } catch (err) {
    console.log(err.message);
    return res.status(500).send({
      status: "Error in getting staff details",
      error: err.message,
    });
  }
};

/* ------------------------------ search admins ----------------------------- */
exports.searchAdmins = async (req, res) => {
  try {
    const query = req.query.query || "";
    const rx = toRegex(query);

    const filter = rx
      ? { $or: [{ email: rx }, { name: rx }, { roleName: rx }, { allocatedWork: rx }] }
      : {};

    const results = await Admin.find(filter);
    return res.json(results);
  } catch (error) {
    console.error(error);
    const msg = error && error.message === "Query too long" ? "Query too long" : "Server error";
    return res.status(400).json({ error: msg });
  }
};

/* ------------------------------- update admin ----------------------------- */
exports.updateAdmin = async (req, res) => {
  try {
    const sid = req.params.id;
    if (!isObjectId(sid)) return res.status(400).send({ status: "Invalid admin id" });

    const { name, email, phone, roleName, allocatedWork } = req.body;
    const updateStaff = { name, email, phone, roleName, allocatedWork };

    const updated = await Admin.findByIdAndUpdate(sid, updateStaff, { new: true });
    if (!updated) return res.status(404).send({ status: "Staff not found" });

    await sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Staff Profile Updated",
      text: `Hello ${name},
Your Staff Account has been updated.

Email: ${email}
New Role: ${roleName}
Allocated Work: ${allocatedWork}
Phone: ${phone}

Thank you.`,
    });

    return res.status(200).send({ status: "Staff updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      status: "Error with updating information",
      error: err.message,
    });
  }
};

/* ----------------------- update admin (with password) --------------------- */
exports.updateAdminWithPassword = async (req, res) => {
  try {
    const sid = req.params.id;
    if (!isObjectId(sid)) return res.status(400).send({ status: "Invalid admin id" });

    const { name, email, phone, roleName, allocatedWork, password } = req.body;
    const updateStaff = { name, email, phone, roleName, allocatedWork, password }; // TODO: hash

    const updated = await Admin.findByIdAndUpdate(sid, updateStaff);
    if (!updated) return res.status(404).send({ status: "Staff not found" });

    return res.status(200).send({ status: "Staff updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      status: "Error with updating information",
      error: err.message,
    });
  }
};
