// services/prescriptionMailServices.js
const nodemailer = require("nodemailer");

// Env-driven config to avoid EAUTH when creds are missing
const SMTP_HOST = process.env.SMTP_HOST || "smtp.zoho.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true;
const SMTP_USER = process.env.SMTP_USER || "helasuwa@zohomail.com";
const SMTP_PASS = process.env.EmailPass;

// Build transporter only if creds exist
let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    pool: true,
    maxConnections: 3,
    connectionTimeout: 15_000,
  });

  // Non-fatal verification
  transporter.verify().then(
    () => console.log("[mail] SMTP verified"),
    (err) => console.warn("[mail] SMTP verify failed:", err?.message || err)
  );
} else {
  console.warn("[mail] SMTP creds missing; prescription emails will be skipped");
}

const looksLikeEmail = (s) => typeof s === "string" && /\S+@\S+\.\S+/.test(s);

// Best-effort: never throw (so controllers won't 500 on mail issues)
const sendEmailToPatient = async (patientEmail) => {
  try {
    if (!looksLikeEmail(patientEmail)) {
      console.warn("[mail] Invalid or missing recipient email; skipping");
      return;
    }
    if (!transporter) {
      console.warn("[mail] Transporter not initialized; skipping email to", patientEmail);
      return;
    }

    await transporter.sendMail({
      from: SMTP_USER,
      to: patientEmail,
      subject: "Prescription Sent",
      text: "Your prescription has been sent.",
      replyTo: SMTP_USER,
    });

    console.log("[mail] Prescription email sent to", patientEmail);
  } catch (error) {
    console.warn("[mail] Error sending prescription email:", error?.message || error);
  }
};

module.exports = { sendEmailToPatient };
