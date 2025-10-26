const Card = require('../models/Card');

// Controller for adding a new card
exports.addCard = async (req, res) => {
  try {
    const newCard = new Card(req.body);
    await newCard.save();
    return res.status(201).json({ message: 'Card details saved successfully', id: newCard._id });
  } catch (error) {
    console.error('Error saving card details:', error);

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const details = Object.entries(error.errors || {}).map(([field, err]) => ({
        field,
        message: err?.message || 'Invalid value',
      }));
      return res.status(400).json({ message: 'Validation failed', errors: details });
    }

    // Invalid ObjectId / cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({ message: `Invalid value for field "${error.path}"` });
    }

    // Duplicate key error (unique index)
    if (error.code === 11000) {
      const fields = Object.keys(error.keyPattern || {});
      return res.status(409).json({ message: 'Duplicate value for unique field(s)', fields });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};
