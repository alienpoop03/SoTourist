const express = require('express');
const router  = express.Router();
const { getItinerary, getSinglePlace } = require('../controllers/itineraryController');

// Nuovo itinerario da payload JSON
router.post('/', getItinerary);

// (Opzionale) Itinerario da query-string (vecchio)
router.get('/', getItinerary);

// Dettaglio singolo luogo
router.get('/single-place', getSinglePlace);

module.exports = router;