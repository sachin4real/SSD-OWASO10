// routes/insuranceRoutes.js
const express = require('express');
const router = express.Router();
const insuranceController = require('../Controllers/controller.insurance');

// Optional: auth middleware
// const auth = require('../middleware/auth');

// Handle Multer errors (thrown before controller code runs)
function handleMulterErrors(err, _req, res, next) {
  if (!err) return next();
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Unsupported file type') {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: 'File upload error' });
}

// Validate policy number
// router.post('/validatePolicy', auth(), insuranceController.validatePolicyNumber);
router.post('/validatePolicy', insuranceController.validatePolicyNumber);

// Submit insurance claim with file upload
// router.post('/', auth(), insuranceController.upload.single('prescription'), handleMulterErrors, insuranceController.submitInsuranceClaim);
router.post('/', insuranceController.upload.single('prescription'), handleMulterErrors, insuranceController.submitInsuranceClaim);

// Get all insurance claims
// router.get('/', auth(), insuranceController.getAllClaims);
router.get('/', insuranceController.getAllClaims);

// Delete a claim by ID
// router.delete('/:id', auth('admin'), insuranceController.deleteClaimById);
router.delete('/:id', insuranceController.deleteClaimById);

// Delete all claims
// router.delete('/', auth('admin'), insuranceController.deleteAllClaims);
router.delete('/', insuranceController.deleteAllClaims);

module.exports = router;
