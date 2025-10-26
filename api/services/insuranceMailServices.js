// services/insuranceMailServices.js
const nodemailer = require("nodemailer");

// Env-driven config (prevents EAUTH "Missing credentials" when vars are absent)
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
    connectionTimeout: 15000,
  });

  // Non-fatal verify (logs if SMTP not reachable)
  transporter.verify().then(
    () => console.log("[mail] SMTP verified"),
    (err) => console.warn("[mail] SMTP verify failed:", err?.message || err)
  );
} else {
  console.warn("[mail] SMTP creds missing; email sending will be skipped");
}

// rudimentary email check to avoid obvious mistakes
const looksLikeEmail = (s) => typeof s === "string" && /\S+@\S+\.\S+/.test(s);

/** Send email to the patient after claim submission (best-effort). */
const sendClaimEmail = async (patientEmail) => {
  try {
    if (!looksLikeEmail(patientEmail)) {
      console.warn("[mail] Invalid or missing recipient email; skipping");
      return;
    }
    if (!transporter) {
      console.warn("[mail] Transporter not initialized; skipping email to", patientEmail);
      return;
    }

    const mailOptions = {
      from: SMTP_USER,
      to: patientEmail,
      subject: "Insurance Claim Request Received",
      text:
        "Hello,\n\nYour insurance claim request has been received and is being processed. " +
        "The insurance company will review your claim and inform you of further details shortly.\n\nThank you.",
      replyTo: SMTP_USER,
    };

    await transporter.sendMail(mailOptions);
    console.log("[mail] Insurance claim email sent to", patientEmail);
  } catch (error) {
    // Do not crash the request flow
    console.error("[mail] Error sending insurance claim email:", error?.message || error);
  }
};

module.exports = { sendClaimEmail };
