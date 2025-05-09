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

// ✅ REGISTRAZIONE con hash già pronto dal frontend
exports.register = (req, res) => {
  const { username, email, passwordHash, type } = req.body;
  const db = readDB();

  if (db.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email già registrata' });
  }

  const newUser = {
    userId: generateId('user_'),
    username,
    email,
    password: passwordHash, // direttamente l'hash
    type: type || 'standard',
    itineraries: []
  };

  db.push(newUser);
  writeDB(db);

  res.status(201).json({ message: 'Utente registrato con successo' });
};

// 🔐 LOGIN: riceve email e hash già calcolato
exports.login = (req, res) => {
  const { email, passwordHash } = req.body;
  const db = readDB();

  const user = db.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  if (user.password !== passwordHash) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  res.status(200).json({
    message: 'Login riuscito',
    userId: user.userId,
    username: user.username,
    type: user.type
  });
};
