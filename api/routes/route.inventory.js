// routes/inventoryRoutes.js
const express = require("express");
const router = express.Router();
const inventoryController = require("../Controllers/controller.inventory");

// Optional: protect with auth middleware
// const auth = require("../middleware/auth");

// Create
// router.post("/add", auth(), inventoryController.addInventory);
router.post("/add", inventoryController.addInventory);

// Read all
// router.get("/", auth(), inventoryController.getAllInventory);
router.get("/", inventoryController.getAllInventory);

// Update by id
// router.put("/update/:id", auth(), inventoryController.updateInventoryById);
router.put("/update/:id", inventoryController.updateInventoryById);

// Delete by id
// router.delete("/delete/:id", auth(), inventoryController.deleteInventoryById);
router.delete("/delete/:id", inventoryController.deleteInventoryById);

// Read one by id
// router.get("/get/:id", auth(), inventoryController.getInventoryById);
router.get("/get/:id", inventoryController.getInventoryById);

module.exports = router;
