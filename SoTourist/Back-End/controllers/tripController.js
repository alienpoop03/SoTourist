const fs = require('fs');
const path = require('path');
const generateId = require('../utils/idGenerator');

const DB_PATH = path.join(__dirname, '../db.json');

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function datesOverlap(start1, end1, start2, end2) {
  return (
    new Date(start1) <= new Date(end2) &&
    new Date(end1) >= new Date(start2)
  );
}


// 📄 GET: tutti gli itinerari di un utente
exports.getItineraries = (req, res) => {
   const { userId } = req.params;
  const filter = req.query.filter || 'all';

  const db = readDB();
  const user = db.find(u => u.userId === userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const today = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD

  let result = user.itineraries;

  switch (filter) {
    case 'current':
      result = user.itineraries.filter(it =>
        it.startDate <= today && it.endDate >= today
      );
      break;

    case 'upcoming': {
      const upcoming = user.itineraries
        .filter(it => it.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      result = upcoming.length > 0 ? [upcoming[0]] : [];
      break;
    }

    case 'future': {
      // Ordina per data
      const sorted = user.itineraries
        .filter(it => it.startDate > today)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      // Rimuovi il primo (quello imminente)
      result = sorted.slice(1);
      break;
    }

    case 'past':
      result = user.itineraries.filter(it => it.endDate < today);
      break;

    case 'all':
    default:
      result = user.itineraries;
      break;
  }

  res.json(result);
};

// ➕ POST: aggiunge un itinerario
exports.addItinerary = (req, res) => {
  const { userId } = req.params;
  const newItinerary = req.body;

  const db = readDB();
  const user = db.find(u => u.userId === userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  // ✅ Validazione minima
  if (!newItinerary.city || !newItinerary.startDate || !newItinerary.endDate) {
    return res.status(400).json({ error: 'Dati insufficienti per creare un itinerario' });
  }

  // ✅ Check sovrapposizione date
  const overlap = user.itineraries.some(it =>
    new Date(newItinerary.startDate) <= new Date(it.endDate) &&
    new Date(newItinerary.endDate) >= new Date(it.startDate)
  );

  if (overlap) {
    return res.status(400).json({ error: 'Le date si sovrappongono a un altro itinerario' });
  }

  newItinerary.itineraryId = generateId('trip_');
  user.itineraries.push(newItinerary);

  writeDB(db);
  res.status(201).json(newItinerary);
};


// 🗑 DELETE: elimina un itinerario
exports.deleteItinerary = (req, res) => {
  const { userId, itineraryId } = req.params;

  const db = readDB();
  const user = db.find(u => u.userId === userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const originalLength = user.itineraries.length;
  user.itineraries = user.itineraries.filter(it => it.itineraryId !== itineraryId);

  if (user.itineraries.length === originalLength) {
    return res.status(404).json({ error: 'Itinerario non trovato' });
  }

  writeDB(db);
  res.status(204).end();
};

// 🔍 Itinerari pubblici filtrati per città
exports.getItinerariesByCity = (req, res) => {
  const city = req.query.city?.toLowerCase();
  if (!city) return res.status(400).json({ error: 'Parametro city mancante' });

  const db = readDB();

  // Cerca tra tutti gli utenti
  const itineraries = db.flatMap(user =>
    user.itineraries.filter(it => it.city.toLowerCase() === city)
  );

  res.json(itineraries);
};

// 🔍 Itinerario pubblico per ID
exports.getItineraryById = (req, res) => {
  const { itineraryId } = req.params;
  const db = readDB();

  for (const user of db) {
    const itinerary = user.itineraries.find(it => it.itineraryId === itineraryId);
    if (itinerary) {
      return res.json(itinerary);
    }
  }

  return res.status(404).json({ error: 'Itinerario non trovato' });
};

exports.updateItinerary = (req, res) => {
  const { userId, itineraryId } = req.params;
  const updatedData = req.body;

  const db = readDB();
  const user = db.find(u => u.userId === userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const itinerary = user.itineraries.find(it => it.itineraryId === itineraryId);
  if (!itinerary) return res.status(404).json({ error: 'Itinerario non trovato' });

  if (updatedData.startDate && updatedData.endDate) {
    const overlap = user.itineraries.some(it =>
      it.itineraryId !== itineraryId &&
      new Date(updatedData.startDate) <= new Date(it.endDate) &&
      new Date(updatedData.endDate) >= new Date(it.startDate)
    );

    if (overlap) {
      return res.status(400).json({ error: 'Le date si sovrappongono a un altro itinerario' });
    }
  }

  // Applica modifiche ai campi (solo quelli presenti nel body)
  Object.keys(updatedData).forEach(key => {
    if (key !== 'itineraryId') {
      itinerary[key] = updatedData[key];
    }
  });

  writeDB(db);
  res.status(200).json(itinerary);
};

// aggiunta tappe
exports.addPlacesToItinerary = (req, res) => {
  const { userId, itineraryId } = req.params;
  let places = req.body;

  // Adatta oggetto singolo a array
  if (!Array.isArray(places)) {
    if (typeof places === 'object' && places !== null) {
      places = [places];
    } else {
      return res.status(400).json({ error: 'Formato tappa non valido' });
    }
  }

  const db = readDB();
  const user = db.find(u => u.userId === userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const itinerary = user.itineraries.find(it => it.itineraryId === itineraryId);
  if (!itinerary) return res.status(404).json({ error: 'Itinerario non trovato' });

  if (!itinerary.places) itinerary.places = [];

  for (const place of places) {
    place.placeId = place.placeId || generateId('place_');
    itinerary.places.push(place);
  }

  writeDB(db);
  res.status(201).json(itinerary.places);
};