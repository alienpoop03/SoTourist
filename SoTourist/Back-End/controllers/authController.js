const fs = require('fs');
const path = require('path');
const generateId = require('../utils/idGenerator');
const bcrypt = require('bcryptjs');
const DB_PATH = path.join(__dirname, '../db.json');

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ✅ REGISTRAZIONE con hash già pronto dal frontend
exports.register = async (req, res) => {
  const { username, email, password, type } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  const db = readDB();
  if (db.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email già registrata' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    userId: generateId('user_'),
    username,
    email,
    password: hashedPassword,
    type: type || 'standard',
    itineraries: []
  };

  db.push(newUser);
  writeDB(db);

  res.status(201).json({ message: 'Utente registrato con successo' });
};

// 🔐 LOGIN: riceve email e hash già calcolato
exports.login = (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  res.status(200).json({
    message: 'Login riuscito',
    userId: user.userId,
    username: user.username,
    type: user.type
  });
};

// 🗑 Elimina un utente
exports.deleteUser = (req, res) => {
  const { userId } = req.params;
  let db = readDB();

  //console.log('🧠 Database iniziale:', db);
  const initialLength = db.length;

  db = db.filter(user => user.userId !== userId);

  if (db.length === initialLength) {
    console.log('⚠️deleteUser: Utente non trovato:', userId);
    return res.status(404).json({ error: 'Utente non trovato' });
  }

  writeDB(db);
  //console.log('✅ Utente eliminato:', userId);
  res.status(204).end();
};

// ✏️ Modifica un utente (username, email, password, tipo)
exports.updateUser = (req, res) => {
  const { userId } = req.params;
  const { username, email, password, type } = req.body;

  const db = readDB();
  const user = db.find(u => u.userId === userId);

  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  if (username) user.username = username;
  if (email) user.email = email;
  if (password) user.password = password;
  if (type) user.type = type;

  writeDB(db);
  res.status(200).json(user);
};