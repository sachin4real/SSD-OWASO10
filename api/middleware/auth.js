// middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function auth(requiredRole) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization || "";
      if (!header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing Bearer token" });
      }
      const token = header.slice(7);
      const secret = process.env.JWT_SECRET || "hey";
      const payload = jwt.verify(token, secret);

      req.user = payload; // { id, role, email }
      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};
