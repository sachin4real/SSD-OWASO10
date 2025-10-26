// utils/ids.js
const { Types } = require("mongoose");
exports.isObjectId = (v) => Types.ObjectId.isValid(v);
