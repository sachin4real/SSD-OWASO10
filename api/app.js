// app.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const pinoHttp = require("pino-http");

const logger = require("./lib/logger");                 // ⬅️ NEW
const requestContext = require("./middleware/requestContext"); // ⬅️ NEW
const { connectToDatabase } = require("./Configurations/DB_Connection.js");

dotenv.config();

const app = express();

/* ---------- A05: SECURITY MISCONFIGURATION HARDENING ---------- */
app.disable("x-powered-by");
app.set("trust proxy", 0);

const FRONTENDS = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  helmet({
    hsts:
      process.env.ENABLE_HSTS === "true"
        ? { maxAge: 31536000, includeSubDomains: true, preload: false }
        : false,
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-site" },
  })
);
app.use(helmet.frameguard({ action: "deny" }));
app.use(helmet.noSniff());

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", ...FRONTENDS],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  })
);

/* ---------- A09: LOGGING & MONITORING ---------- */
// per-request context + structured access logs
app.use(requestContext);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customProps: (req, res) => ({
      reqId: req.id,
      ip: req.ip,
    }),
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.originalUrl };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// log security-significant responses
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const took = Date.now() - start;
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.warn({ reqId: req.id, path: req.originalUrl, status: res.statusCode, took }, "auth failure");
    } else if (res.statusCode >= 500) {
      logger.error({ reqId: req.id, path: req.originalUrl, status: res.statusCode, took }, "server error");
    }
  });
  next();
});
/* ---------- END A09 block ---------- */

const corsCredentials = String(process.env.CORS_CREDENTIALS || "").toLowerCase() === "true";
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || FRONTENDS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: Origin not allowed"));
    },
    credentials: corsCredentials,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    maxAge: 600,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// rate-limit + log when exceeded
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ reqId: req.id, ip: req.ip, path: req.originalUrl }, "rate limit exceeded");
    res.status(429).json({ error: "Too many requests" });
  },
});
app.use(["/admin/login", "/doctor/login", "/patient/login"], authLimiter);

// safe static uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    dotfiles: "deny",
    etag: true,
    index: false,
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html") || filePath.endsWith(".htm")) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
      }
      res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    },
  })
);

/* ------------------- DB connection ------------------- */
connectToDatabase()
  .then(() => logger.info("Database connection successful"))
  .catch((err) => logger.error({ err }, "Database connection error"));

/* ------------------- ROUTES ------------------- */
app.use("/patient", require("./routes/route.patient.js"));
app.use("/admin", require("./routes/routes.admin.js"));
app.use("/doctor", require("./routes/route.doctors.js"));
app.use("/channel", require("./routes/route.channels.js"));
app.use("/appointment", require("./routes/route.appointment.js"));
app.use("/prescription", require("./routes/route.prescription.js"));
app.use("/report", require("./routes/reports"));
app.use("/test", require("./routes/route.tests.js"));
app.use("/record", require("./routes/records"));
app.use("/Inventory", require("./routes/route.inventory.js"));
app.use("/Order", require("./routes/order.js"));
app.use("/PharmacyIn", require("./routes/pharmacyin"));
app.use("/card", require("./routes/CardRoutes.js"));
app.use("/insurance", require("./routes/insuranceRoutes"));

// no-cache for sensitive checks
app.use((req, res, next) => {
  if (req.path.startsWith("/admin/check") || req.path.startsWith("/patient/check")) {
    res.setHeader("Cache-Control", "no-store");
  }
  next();
});

/* ------------------- Global error handler ------------------- */
app.use((err, req, res, next) => {
  logger.error({ err, reqId: req.id }, "[unhandled error]");
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

module.exports = app;
