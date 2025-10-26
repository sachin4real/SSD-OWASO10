// routes/pharmacyin.js
const router = require("express").Router();
const { Types } = require("mongoose");
const Pharmcy = require("../models/PharmacyIn");

// helpers
const isObjectId = (v) => Types.ObjectId.isValid(v);
const toDate = (v) => (v ? new Date(v) : undefined);

// escape regex & cap length
function escapeRegex(text = "") {
  return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
function toRegex(text = "", flags = "i") {
  const t = String(text).trim();
  if (!t) return null;
  if (t.length > 64) throw new Error("Query too long");
  return new RegExp(escapeRegex(t), flags);
}

/* ------------------------------- CREATE ----------------------------------- */
// POST /PharmacyIn/add
router.post("/add", async (req, res) => {
  try {
    const {
      ProductName,
      GenericName,
      ReferenceNo,
      Category,
      Type,
      MfgDate,
      ExpDate,
      Description,
      Quantity,
      Image,
    } = req.body;

    // minimal validation
    if (!ProductName || !Category || !Type) {
      return res.status(400).json({ error: "ProductName, Category, and Type are required" });
    }
    if (ReferenceNo !== undefined && isNaN(Number(ReferenceNo))) {
      return res.status(400).json({ error: "ReferenceNo must be a number" });
    }
    if (Quantity !== undefined && isNaN(Number(Quantity))) {
      return res.status(400).json({ error: "Quantity must be a number" });
    }

    const doc = new Pharmcy({
      ProductName,
      GenericName,
      ReferenceNo: ReferenceNo !== undefined ? Number(ReferenceNo) : undefined,
      Category,
      Type,
      MfgDate: toDate(MfgDate),
      ExpDate: toDate(ExpDate),
      Description,
      Quantity: Quantity !== undefined ? Number(Quantity) : undefined,
      Image,
    });

    await doc.save();
    return res.status(201).json({ status: "Item added", id: doc._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to add item" });
  }
});

/* -------------------------------- READ ALL -------------------------------- */
// GET /PharmacyIn/
router.get("/", async (_req, res) => {
  try {
    const items = await Pharmcy.find();
    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch items" });
  }
});

/* -------------------------------- UPDATE ---------------------------------- */
// PUT /PharmacyIn/update/:id
router.put("/update/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    if (!isObjectId(itemId)) {
      return res.status(400).json({ status: "Invalid item id" });
    }

    const {
      ProductName,
      GenericName,
      ReferenceNo,
      Category,
      Type,
      MfgDate,
      ExpDate,
      Description,
      Quantity,
      Image,
    } = req.body;

    // build update only with provided fields
    const updateItem = {};
    if (ProductName !== undefined) updateItem.ProductName = ProductName;
    if (GenericName !== undefined) updateItem.GenericName = GenericName;
    if (Category !== undefined) updateItem.Category = Category;
    if (Type !== undefined) updateItem.Type = Type;
    if (Description !== undefined) updateItem.Description = Description;
    if (Image !== undefined) updateItem.Image = Image;

    if (ReferenceNo !== undefined) {
      if (isNaN(Number(ReferenceNo))) {
        return res.status(400).json({ error: "ReferenceNo must be a number" });
      }
      updateItem.ReferenceNo = Number(ReferenceNo);
    }
    if (Quantity !== undefined) {
      if (isNaN(Number(Quantity))) {
        return res.status(400).json({ error: "Quantity must be a number" });
      }
      updateItem.Quantity = Number(Quantity);
    }
    if (MfgDate !== undefined) updateItem.MfgDate = MfgDate ? new Date(MfgDate) : null;
    if (ExpDate !== undefined) updateItem.ExpDate = ExpDate ? new Date(ExpDate) : null;

    const updated = await Pharmcy.findByIdAndUpdate(itemId, updateItem);
    if (!updated) return res.status(404).json({ status: "Item not found" });

    return res.status(200).json({ status: "Updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "Update error", error: error.message });
  }
});

/* -------------------------------- DELETE ---------------------------------- */
// DELETE /PharmacyIn/delete/:id
router.delete("/delete/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    if (!isObjectId(itemId)) {
      return res.status(400).json({ status: "Invalid item id" });
    }

    const deleted = await Pharmcy.findByIdAndDelete(itemId);
    if (!deleted) return res.status(404).json({ status: "Item not found" });

    return res.status(200).json({ status: "Deleted successfully" });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ status: "Error deleting item", error: err.message });
  }
});

/* ------------------------------ GET BY NAME -------------------------------- */
// GET /PharmacyIn/getByName/:name
router.get("/getByName/:name", async (req, res) => {
  try {
    const productName = req.params.name;
    const stock = await Pharmcy.findOne({ ProductName: productName });
    if (!stock) return res.status(404).json({ status: "Item not found" });
    return res.status(200).json({ status: "Item fetched", stock });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ status: "Error getting item" });
  }
});

/* -------------------------------- SEARCH ---------------------------------- */
// GET /PharmacyIn/search?q=...
router.get("/search", async (req, res) => {
  try {
    const rx = toRegex(req.query.q || "");
    const filter = rx
      ? {
          $or: [{ ProductName: rx }, { Category: rx }],
        }
      : {};

    const items = await Pharmcy.find(filter);
    return res.status(200).json({ status: "Items found", items });
  } catch (error) {
    console.error(error);
    const msg = error && error.message === "Query too long" ? "Query too long" : "Error searching items";
    return res.status(400).json({ status: msg });
  }
});

module.exports = router;
