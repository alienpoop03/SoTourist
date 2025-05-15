const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Creazione tabella utenti
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'standard',
      subscriptionEnd TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS itineraries (
      itineraryId TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      city TEXT NOT NULL,
      accommodation TEXT,
      startDate TEXT,
      endDate TEXT,
      style TEXT,
      coverPhoto TEXT,
      deleted INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(userId)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS places (
        placeId TEXT PRIMARY KEY,
        itineraryId TEXT NOT NULL,
        name TEXT NOT NULL,
        day INTEGER NOT NULL,
        timeSlot TEXT NOT NULL,          -- 'morning' | 'afternoon' | 'evening'
        lat REAL,                        -- Latitudine
        lng REAL,                        -- Longitudine
        address TEXT,                    -- Indirizzo (opzionale)
        photoUrl TEXT,                   -- URL immagine (opzionale)
        type TEXT,                       -- Tipo (es. museo, piazza, ristorante...)
        note TEXT,                       -- Campo libero per note/modifiche utente
        FOREIGN KEY (itineraryId) REFERENCES itineraries(itineraryId)
    )
  `);

  console.log('✅ Database inizializzato correttamente.');
});

db.close();
