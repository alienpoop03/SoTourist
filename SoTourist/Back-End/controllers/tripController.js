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

    case 'future':
      result = user.itineraries.filter(it => it.startDate > today);
      break;

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