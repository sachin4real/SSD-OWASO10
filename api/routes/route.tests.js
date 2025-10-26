// routes/testRoutes.js
const express = require("express");
const router = express.Router();
const testController = require("../Controllers/controller.tests"); // <-- matches controller filename above

// Optional: protect with auth()
// const auth = require("../middleware/auth");

router.post("/add", /* auth(), */ testController.addTest);
router.get("/", /* auth(), */ testController.getAllTests);
router.get("/get/:id", /* auth(), */ testController.getTestById);
router.get("/search", /* auth(), */ testController.searchTests);
router.delete("/delete/:id", /* auth(), */ testController.deleteTestById);

module.exports = router;
