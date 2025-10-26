// routes/CardRoutes.js
const express = require('express');
const router = express.Router();
const cardController = require('../Controllers/controller.card');

// Optional: protect or throttle if needed
// const auth = require('../middleware/auth');
// const rateLimit = require('express-rate-limit');
// const createLimiter = rateLimit({ windowMs: 60_000, max: 10 });

// POST add a new card
// router.post('/', auth(), createLimiter, cardController.addCard);
router.post('/', cardController.addCard);

module.exports = router;
