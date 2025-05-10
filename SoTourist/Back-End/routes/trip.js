const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');

// 📄 GET tutti gli itinerari per un utente
router.get('/users/:userId/itineraries', tripController.getItineraries);

// ➕ POST un nuovo itinerario
router.post('/users/:userId/itineraries', tripController.addItinerary);

// 🗑 DELETE un itinerario specifico
router.delete('/users/:userId/itineraries/:itineraryId', tripController.deleteItinerary);


// 📄 GET itinerari per città (tra i vari utenti)
router.get('/itineraries', tripController.getItinerariesByCity);

// GET itinerario singolo per ID
router.get('/itineraries/:itineraryId', tripController.getItineraryById);


module.exports = router;
