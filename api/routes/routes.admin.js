const express = require("express");
const router = express.Router();
const adminController = require("../Controllers/controller.admin");
const auth = require("../middleware/auth");

// Public
router.post("/login", adminController.loginAdmin);
router.get("/check", adminController.checkToken);

// Protected (require any authenticated admin)
router.post("/add", auth(), adminController.addAdmin);
router.delete("/delete/:id", auth(), adminController.deleteAdmin);
router.get("/", auth(), adminController.getAllAdmins);
router.get("/get/:id", auth(), adminController.getAdminById);
router.get("/search", auth(), adminController.searchAdmins);
router.put("/update/:id", auth(), adminController.updateAdmin);
router.put("/updateStaff/:id", auth(), adminController.updateAdminWithPassword);

module.exports = router;
