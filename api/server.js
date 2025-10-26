// server.js
const app = require("./app");
const logger = require("./lib/logger");

process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "unhandledRejection");
  process.exitCode = 1;
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "uncaughtException");
  process.exit(1);
});

// simple health endpoint
app.get("/__health", (_req, res) => res.status(200).json({ ok: true, time: new Date().toISOString() }));

const port = process.env.PORT || 8070;
app.listen(port, () => {
  logger.info({ port }, `Hospital app listening on port ${port}!`);
});
