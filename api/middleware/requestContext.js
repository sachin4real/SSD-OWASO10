// api/middleware/requestContext.js
const { randomUUID } = require("crypto");

module.exports = function requestContext(req, res, next) {
  req.id = randomUUID();
  req.startTime = Date.now();
  res.setHeader("X-Request-ID", req.id);
  next();
};
