const express = require('express');
const router  = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { getPrediction, getAllPredictions } = require('../controllers/predictions.controller');

// GET /api/predictions/all  → admin uniquement
router.get('/all', verifyAdmin, getAllPredictions);

// GET /api/predictions/:id  → admin ou chef (son propre projet)
router.get('/:id', verifyToken, getPrediction);

module.exports = router;
