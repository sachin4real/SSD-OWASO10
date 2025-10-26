// routes/order.js  (or whatever filename you use)
const router = require("express").Router();
const { Types } = require("mongoose");
const OrderI = require("../models/Order");

// helpers
const isObjectId = (v) => Types.ObjectId.isValid(v);

// CREATE
router.post("/add", async (req, res) => {
  try {
    const { order_id, supplier, date, destination, quantity } = req.body;

    // minimal validation
    if (!order_id || !supplier || !destination) {
      return res.status(400).json({ error: "order_id, supplier, destination are required" });
    }
    if (quantity !== undefined && isNaN(Number(quantity))) {
      return res.status(400).json({ error: "quantity must be a number" });
    }

    const doc = new OrderI({
      order_id,
      supplier,
      date: date ? new Date(date) : undefined, // let Mongoose handle if schema defaults
      destination,
      quantity: quantity !== undefined ? Number(quantity) : undefined,
    });

    await doc.save();
    return res.status(201).json({ status: "created", id: doc._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

// READ (all)
router.get("/", async (_req, res) => {
  try {
    const list = await OrderI.find();
    return res.json(list);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// READ (one)
router.get("/get/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!isObjectId(id)) return res.status(400).json({ status: "Invalid order id" });

    const doc = await OrderI.findById(id);
    if (!doc) return res.status(404).json({ status: "Order not found" });

    return res.status(200).json({ status: "Order fetched", order: doc });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ status: "Error getting order", error: error.message });
  }
});

// UPDATE
router.put("/update/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!isObjectId(id)) return res.status(400).json({ status: "Invalid order id" });

    const { order_id, supplier, date, destination, quantity } = req.body;

    // build only provided fields
    const update = {};
    if (order_id !== undefined) update.order_id = order_id;
    if (supplier !== undefined) update.supplier = supplier;
    if (destination !== undefined) update.destination = destination;
    if (date !== undefined) update.date = date ? new Date(date) : null;
    if (quantity !== undefined) {
      if (isNaN(Number(quantity))) {
        return res.status(400).json({ error: "quantity must be a number" });
      }
      update.quantity = Number(quantity);
    }

    const updated = await OrderI.findByIdAndUpdate(id, update);
    if (!updated) return res.status(404).json({ status: "Order not found" });

    return res.status(200).json({ status: "Order updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Error updating order", error: error.message });
  }
});

// DELETE
router.delete("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!isObjectId(id)) return res.status(400).json({ status: "Invalid order id" });

    const deleted = await OrderI.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ status: "Order not found" });

    return res.status(200).json({ status: "Order deleted" });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ status: "Error deleting order", error: error.message });
  }
});

module.exports = router;
