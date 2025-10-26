// controllers/inventoryController.js
const { Types } = require("mongoose");
const Inventory = require("../models/Inventory");

const isObjectId = (v) => Types.ObjectId.isValid(v);

/* ------------------------------ Add inventory ----------------------------- */
exports.addInventory = async (req, res) => {
  try {
    const { item_id, item_name, category, quantity, price } = req.body;

    // Basic validation
    if (!item_id || !item_name || !category) {
      return res.status(400).json({ status: "item_id, item_name, category are required" });
    }
    if (quantity !== undefined && !Number.isFinite(Number(quantity))) {
      return res.status(400).json({ status: "quantity must be a number" });
    }
    if (price !== undefined && !Number.isFinite(Number(price))) {
      return res.status(400).json({ status: "price must be a number" });
    }

    const doc = new Inventory({
      item_id,
      item_name,
      category,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      price: price !== undefined ? Number(price) : undefined,
    });

    await doc.save();
    return res.status(201).json({ status: "Data is saved to the database", id: doc._id });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ status: "Validation failed", error: error.message });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ status: `Invalid value for "${error.path}"` });
    }
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ status: "Duplicate value for unique field(s)", fields: Object.keys(error.keyPattern || {}) });
    }

    return res.status(500).json({ status: "Error saving data!", error: error.message });
  }
};

/* ------------------------------ Get all ----------------------------------- */
exports.getAllInventory = async (_req, res) => {
  try {
    const items = await Inventory.find();
    return res.json(items);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Error retrieving data!", error: error.message });
  }
};

/* ------------------------------ Update by id ------------------------------ */
exports.updateInventoryById = async (req, res) => {
  try {
    const inventoryID = req.params.id;
    if (!isObjectId(inventoryID)) {
      return res.status(400).json({ status: "Invalid inventory id" });
    }

    const { item_id, item_name, category, quantity, price } = req.body;

    const updateInventory = {};
    if (item_id !== undefined) updateInventory.item_id = item_id;
    if (item_name !== undefined) updateInventory.item_name = item_name;
    if (category !== undefined) updateInventory.category = category;

    if (quantity !== undefined) {
      if (!Number.isFinite(Number(quantity))) {
        return res.status(400).json({ status: "quantity must be a number" });
      }
      updateInventory.quantity = Number(quantity);
    }

    if (price !== undefined) {
      if (!Number.isFinite(Number(price))) {
        return res.status(400).json({ status: "price must be a number" });
      }
      updateInventory.price = Number(price);
    }

    const updated = await Inventory.findByIdAndUpdate(inventoryID, updateInventory);
    if (!updated) return res.status(404).json({ status: "Inventory not found" });

    return res.status(200).json({ status: "Inventory updated" });
  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ status: "Validation failed", error: error.message });
    }
    if (error.name === "CastError") {
      return res.status(400).json({ status: `Invalid value for "${error.path}"` });
    }
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ status: "Duplicate value for unique field(s)", fields: Object.keys(error.keyPattern || {}) });
    }

    return res.status(500).json({ status: "Error updating data!", error: error.message });
  }
};

/* ------------------------------ Delete by id ------------------------------ */
exports.deleteInventoryById = async (req, res) => {
  try {
    const inventoryID = req.params.id;
    if (!isObjectId(inventoryID)) {
      return res.status(400).json({ status: "Invalid inventory id" });
    }

    const deleted = await Inventory.findByIdAndDelete(inventoryID);
    if (!deleted) return res.status(404).json({ status: "Inventory not found" });

    return res.status(200).json({ status: "Inventory deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ status: "Error deleting data!", error: error.message });
  }
};

/* ------------------------------ Get by id --------------------------------- */
exports.getInventoryById = async (req, res) => {
  try {
    const inventoryID = req.params.id;
    if (!isObjectId(inventoryID)) {
      return res.status(400).json({ status: "Invalid inventory id" });
    }

    const item = await Inventory.findById(inventoryID);
    if (!item) return res.status(404).json({ status: "Inventory not found" });

    return res.status(200).json({ status: "Inventory fetched", item });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ status: "Error fetching data!", error: error.message });
  }
};
