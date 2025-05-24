// routes/itinerary.js
const express = require('express');
const router  = express.Router();
const { getItinerary } = require('../controllers/itineraryController');

/* ───── nuove rotte ───── */
// POST  → per il nuovo payload JSON (mustSee, mustEat, avoid, …)
router.post('/', getItinerary);

// GET   → facoltativo: la tieni se ti serve ancora la vecchia query-string
router.get('/', getItinerary);

module.exports = router;
