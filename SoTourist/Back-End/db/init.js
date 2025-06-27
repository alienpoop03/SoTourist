const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Tabella utenti
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      userId TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'standard',
      subscriptionEnd TEXT,
      profileImage TEXT
    )
  `);

  // Tabella itinerari (userId può essere NULL)
  db.run(`
    CREATE TABLE IF NOT EXISTS itineraries (
      itineraryId TEXT PRIMARY KEY,
      userId TEXT,
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

  // Tabella tappe (places)
  db.run(`
    CREATE TABLE IF NOT EXISTS places (
      placeId TEXT PRIMARY KEY,
      itineraryId TEXT NOT NULL,
      name TEXT NOT NULL,
      day INTEGER,
      timeSlot TEXT,
      lat REAL,
      lng REAL,
      address TEXT,
      photoUrl TEXT,
      type TEXT,
      note TEXT,
      FOREIGN KEY (itineraryId) REFERENCES itineraries(itineraryId)
    )
  `);

  console.log('Database inizializzato correttamente.');
});

db.close();
