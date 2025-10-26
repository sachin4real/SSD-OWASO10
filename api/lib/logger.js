// api/lib/logger.js
const pino = require("pino");

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  // never print secrets
  redact: {
    paths: [
      "req.headers.authorization",
      "headers.authorization",
      "body.password",
      "password",
      "config.smtp.pass",
      "process.env.EmailPass",
    ],
    censor: "[REDACTED]",
  },
  messageKey: "msg",
  // ✅ In Pino v8+, transport belongs inside options (NOT as 2nd arg)
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      },
});

module.exports = logger;
