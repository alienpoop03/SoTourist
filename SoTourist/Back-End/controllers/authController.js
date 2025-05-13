const fs = require('fs');
const path = require('path');
const generateId = require('../utils/idGenerator');
const bcrypt = require('bcryptjs');
const DB_PATH = path.join(__dirname, '../db.json');
const { downgradeIfExpired } = require('../utils/subscriptionChecker');

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
    type: 'standard',
    subscriptionEndDate: null,
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

  const { downgradeIfExpired } = require('../utils/subscriptionChecker');

  const updatedUser = downgradeIfExpired(user);

  // se è stato downgradato, salviamo
  if (updatedUser.type === 'standard' && user.type !== 'standard') {
    const index = db.findIndex(u => u.userId === updatedUser.userId);
    db[index] = updatedUser;
    writeDB(db);
  }

  res.status(200).json({
    message: 'Login riuscito',
    userId: user.userId,
    username: user.username,
    type: updatedUser.type
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
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { username, email, password } = req.body;

  const db = readDB();
  const user = db.find(u => u.userId === userId);

  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  if (username) user.username = username;
  if (email) user.email = email;

  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
  }

  // ❌ Blocchiamo modifiche a tipo e abbonamento da qui
  // if (type) user.type = type;
  // if (subscriptionEndDate) user.subscriptionEndDate = subscriptionEndDate;

  writeDB(db);
  res.status(200).json(user);
};


exports.upgradeToPremium = (req, res) => {
  const { userId } = req.params;
  const { plan } = req.body; // es. "premium" o "gold"

  const validPlans = { // per quanti giorni vale l'abbonamento
    premium: 30, // 30 giorni
    gold: 30     // 30 giorni
  };

  if (!validPlans[plan]) {
    return res.status(400).json({ error: 'Piano non valido' });
  }

  const db = readDB();
  const user = db.find(u => u.userId === userId);
  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const now = new Date();
  const end = new Date();
  end.setDate(now.getDate() + validPlans[plan]);

  user.type = plan;
  user.subscriptionEndDate = end.toISOString();

  writeDB(db);
  res.json({
    message: `Upgrade a ${plan} completato`,
    type: user.type,
    subscriptionEndDate: user.subscriptionEndDate
  });
};

exports.cancelPremium = (req, res) => {
  const { userId } = req.params;

  const db = readDB();
  const user = db.find(u => u.userId === userId);

  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  // Se è già standard, non serve fare nulla
  if (user.type === 'standard') {
    return res.status(400).json({ error: 'L\'utente è già standard' });
  }

  user.type = 'standard';
  user.subscriptionEndDate = null;

  writeDB(db);
  res.json({
    message: 'Abbonamento annullato',
    type: user.type
  });
};


exports.getUserType = (req, res) => {
  const { userId } = req.params;
  const db = readDB();
  const user = db.find(u => u.userId === userId);

  if (!user) return res.status(404).json({ error: 'Utente non trovato' });

  const updatedUser = downgradeIfExpired(user);

  if (updatedUser.type === 'standard' && user.type !== 'standard') {
    const index = db.findIndex(u => u.userId === userId);
    db[index] = updatedUser;
    writeDB(db);
  }

  res.json({
    userId: updatedUser.userId,
    type: updatedUser.type,
    subscriptionEndDate: updatedUser.subscriptionEndDate || null
  });
};