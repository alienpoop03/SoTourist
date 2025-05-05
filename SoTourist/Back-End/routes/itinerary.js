const express = require('express');
const router = express.Router();
const { getItinerary } = require('../controllers/itineraryController');

// Nuova route: supporta la query ?city=...&totalDays=...
router.get('/', getItinerary);

module.exports = router;
