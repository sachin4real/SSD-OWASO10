// api/lib/audit.js
const logger = require("./logger");

exports.audit = (action, meta = {}) => {
  logger.info({ type: "audit", action, ...meta }, "audit");
};
