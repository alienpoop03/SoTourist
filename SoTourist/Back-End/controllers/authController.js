//const fs = require('fs');
//const path = require('path');
const generateId = require('../utils/idGenerator');
const bcrypt = require('bcryptjs');
//const DB_PATH = path.join(__dirname, '../db.json');
const { downgradeIfExpired } = require('../utils/subscriptionChecker');
const db = require('../db/connection');

/*function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}*/

// ✅ REGISTRAZIONE con hash già pronto dal frontend
exports.register = async (req, res) => {
  const { username, email, password, type } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  // Verifica se l'email è già registrata
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, existingUser) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (existingUser) return res.status(400).json({ error: 'Email già registrata' });

    const bcrypt = require('bcryptjs');
    const generateId = require('../utils/idGenerator');
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId('user_');

    let subscriptionEndDate = null;

    if (type === 'premium' || type === 'gold') {
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + 30); // esempio: abbonamento di 30 giorni
      subscriptionEndDate = end.toISOString().split('T')[0];
    }

    // Inserimento nel database
    db.run(
      `INSERT INTO users (userId, username, email, password, type, subscriptionEnd) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, email, hashedPassword, type || 'standard', subscriptionEndDate],
      function (err) {
        if (err) return res.status(500).json({ error: 'Errore nella creazione utente' });

        res.status(201).json({ message: 'Utente registrato con successo' });
      }
    );
  });
};

// 🔐 LOGIN: riceve email e hash già calcolato
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(401).json({ error: 'Credenziali non valide' });

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Verifica e downgrade automatico se l'abbonamento è scaduto
    const updatedUser = downgradeIfExpired(user);

    // Se c'è stato un downgrade, aggiorna nel DB
    if (updatedUser.type === 'standard' && user.type !== 'standard') {
      db.run(
        `UPDATE users SET type = ?, subscriptionEnd = NULL WHERE userId = ?`,
        [updatedUser.type, updatedUser.userId],
        (updateErr) => {
          if (updateErr) console.error('⚠️ Errore durante il downgrade:', updateErr);
        }
      );
    }

    res.status(200).json({
      message: 'Login riuscito',
      userId: user.userId,
      username: user.username,
      type: updatedUser.type
    });
  });
};

// 🗑 Elimina un utente
exports.deleteUser = (req, res) => {
  const { userId } = req.params;

  db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    // 1. Scollega gli itinerari
    db.run(`UPDATE itineraries SET userId = NULL WHERE userId = ?`, [userId], (err1) => {
      if (err1) return res.status(500).json({ error: 'Errore scollegamento itinerari' });

      // 2. Elimina l'utente
      db.run(`DELETE FROM users WHERE userId = ?`, [userId], function (err2) {
        if (err2) return res.status(500).json({ error: 'Errore eliminazione utente' });

        res.status(204).end(); // eliminazione completata
      });
    });
  });
};

// ✏️ Modifica un utente (username, email, password, tipo)
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { username, email, password } = req.body;

  db.get(`SELECT * FROM users WHERE userId = ?`, [userId], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    // Prepara i campi da aggiornare
    const updatedUsername = username || user.username;
    const updatedEmail = email || user.email;
    const updatedPassword = password
      ? await bcrypt.hash(password, 10)
      : user.password;

    db.run(
      `UPDATE users SET username = ?, email = ?, password = ? WHERE userId = ?`,
      [updatedUsername, updatedEmail, updatedPassword, userId],
      (err) => {
        if (err) return res.status(500).json({ error: 'Errore aggiornamento utente' });

        res.status(200).json({
          userId,
          username: updatedUsername,
          email: updatedEmail
        });
      }
    );
  });
};

// ➕Modifica il tipo di abbonamento
exports.upgradeToPremium = (req, res) => {
  const { userId } = req.params;
  const { plan } = req.body;

  const validPlans = {
    premium: 30,
    gold: 30
  };

  if (!validPlans[plan]) {
    return res.status(400).json({ error: 'Piano non valido' });
  }

  const now = new Date();
  const end = new Date();
  end.setDate(now.getDate() + validPlans[plan]);
  const subscriptionEnd = end.toISOString().split('T')[0];

  db.run(
    `UPDATE users SET type = ?, subscriptionEnd = ? WHERE userId = ?`,
    [plan, subscriptionEnd, userId],
    function (err) {
      if (err) {
        console.error("ERRORE DB:", err);
        return res.status(500).json({ error: 'Errore aggiornamento abbonamento' });
      }
      res.json({
        message: `Upgrade a ${plan} completato`,
        type: plan,
        subscriptionEndDate: subscriptionEnd
      });
    }
  );
};

// ❌ Annulla abbonamento
exports.cancelPremium = (req, res) => {
  const { userId } = req.params;

  db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    if (user.type === 'standard') {
      return res.status(400).json({ error: 'L\'utente è già standard' });
    }

    db.run(
      `UPDATE users SET type = 'standard', subscriptionEnd = NULL WHERE userId = ?`,
      [userId],
      (err) => {
        if (err) return res.status(500).json({ error: 'Errore durante la cancellazione abbonamento' });

        res.json({
          message: 'Abbonamento annullato',
          type: 'standard'
        });
      }
    );
  });
};


exports.getUserType = (req, res) => {
  const { userId } = req.params;

  db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const updatedUser = downgradeIfExpired(user);

    if (updatedUser.type === 'standard' && user.type !== 'standard') {
      db.run(
        `UPDATE users SET type = 'standard', subscriptionEnd = NULL WHERE userId = ?`,
        [userId],
        (err) => {
          if (err) console.error('Errore durante downgrade automatico');
        }
      );
    }

    res.json({
      userId: updatedUser.userId,
      type: updatedUser.type,
      subscriptionEndDate: updatedUser.subscriptionEnd || null
    });
  });
};

exports.updateProfileImage = (req, res) => {
  const { userId } = req.params;
  const { base64 } = req.body;

  if (base64 === "") {
    db.run(
      `UPDATE users SET profileImage = NULL WHERE userId = ?`,
      [userId],
      function (err) {
        if (err) {
          console.error('Errore eliminazione foto:', err.message);
          return res.status(500).json({ error: 'Errore interno del server.' });
        }
        console.log('Foto eliminata per', userId, 'Rows:', this.changes);
        res.json({ message: 'Foto profilo eliminata.' });
      }
    );
    return;
  }

  if (!base64) {
    return res.status(400).json({ error: 'Base64 image is required.' });
  }

  const query = `UPDATE users SET profileImage = ? WHERE userId = ?`;

  db.run(query, [base64, userId], function (err) {
    if (err) {
      console.error('Errore nel salvataggio immagine:', err.message);
      return res.status(500).json({ error: 'Errore interno del server.' });
    }

    res.json({ message: 'Immagine del profilo aggiornata con successo.' });
  });
};

exports.getProfileImage = (req, res) => {
  const { userId } = req.params;

  const query = `SELECT profileImage FROM users WHERE userId = ?`;

  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Errore nel recupero immagine profilo:', err.message);
      return res.status(500).json({ error: 'Errore interno del server.' });
    }

    if (!row || !row.profileImage) {
      return res.json({ base64: null });
    }

    res.json({ base64: row.profileImage });
  });
};
