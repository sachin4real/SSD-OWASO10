// lib/mailer.js
const nodemailer = require("nodemailer");

const haveCreds = !!(process.env.EmailPass && (process.env.SMTP_USER || "helasuwa@zohomail.com"));

let transporter = null;
if (haveCreds) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || "helasuwa@zohomail.com",
      pass: process.env.EmailPass,
    },
  });
}

async function sendMail(options) {
  if (!haveCreds) {
    console.warn("[mail] skipped (no SMTP creds). Set SMTP_USER/EmailPass to enable.");
    return { skipped: true };
  }
  return transporter.sendMail(options);
}

module.exports = { sendMail };
