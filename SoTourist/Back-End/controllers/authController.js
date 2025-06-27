const generateId = require('../utils/idGenerator');
const bcrypt = require('bcryptjs');
const { downgradeIfExpired } = require('../utils/subscriptionChecker');
const db = require('../db/connection');

// Registrazione nuovo utente
exports.register = async (req, res) => {
  const { username, email, password, type } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, existingUser) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (existingUser) return res.status(400).json({ error: 'Email già registrata' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId('user_');

    let subscriptionEndDate = null;
    if (type === 'premium' || type === 'gold') {
      const now = new Date();
      const end = new Date();
      end.setDate(now.getDate() + 30);
      subscriptionEndDate = end.toISOString().split('T')[0];
    }

    const registrationDate = new Date().toISOString().split('T')[0];

    db.run(
      `INSERT INTO users (userId, username, email, password, type, subscriptionEnd, registrationDate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, email, hashedPassword, type || 'standard', subscriptionEndDate, registrationDate],
      function (err) {
        if (err) return res.status(500).json({ error: 'Errore nella creazione utente' });

        res.status(201).json({ message: 'Utente registrato con successo' });
      }
    );
  });
};

// Modifica password
exports.updatePassword = async (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Password attuale e nuova obbligatorie' });
  }

  db.get(`SELECT password FROM users WHERE userId = ?`, [userId], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Password attuale errata' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    db.run(
      `UPDATE users SET password = ? WHERE userId = ?`,
      [hashedNewPassword, userId],
      (err) => {
        if (err) return res.status(500).json({ error: 'Errore aggiornamento password' });

        res.status(200).json({ message: 'Password aggiornata con successo' });
      }
    );
  });
};

// Login utente
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(401).json({ error: 'Credenziali non valide' });

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Downgrade automatico se abbonamento scaduto
    const updatedUser = downgradeIfExpired(user);

    if (updatedUser.type === 'standard' && user.type !== 'standard') {
      db.run(
        `UPDATE users SET type = ?, subscriptionEnd = NULL WHERE userId = ?`,
        [updatedUser.type, updatedUser.userId],
        (updateErr) => {
          if (updateErr) console.error('Errore durante il downgrade:', updateErr);
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

// Elimina utente e scollega itinerari
exports.deleteUser = (req, res) => {
  const { userId } = req.params;

  db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    db.run(`UPDATE itineraries SET userId = NULL WHERE userId = ?`, [userId], (err1) => {
      if (err1) return res.status(500).json({ error: 'Errore scollegamento itinerari' });

      db.run(`DELETE FROM users WHERE userId = ?`, [userId], function (err2) {
        if (err2) return res.status(500).json({ error: 'Errore eliminazione utente' });

        res.status(204).end();
      });
    });
  });
};

// Modifica username/email utente
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { username, email } = req.body;

  db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, user) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!user) return res.status(404).json({ error: 'Utente non trovato' });

    const updatedUsername = username || user.username;
    const updatedEmail = email || user.email;

    db.run(
      `UPDATE users SET username = ?, email = ? WHERE userId = ?`,
      [updatedUsername, updatedEmail, userId],
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

// Aggiorna tipo abbonamento (premium/gold)
exports.upgradeToPremium = (req, res) => {
  const { userId } = req.params;
  const { plan } = req.body;

  const validPlans = { premium: 30, gold: 30 };
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

// Annulla abbonamento
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

// Ottiene tipo abbonamento e fa downgrade se scaduto
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

// Salva o elimina immagine profilo utente (base64)
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

// Recupera immagine profilo base64
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

// Data di registrazione utente
exports.getRegistrationDate = (req, res) => {
  const { userId } = req.params;

  if (!userId) return res.status(400).json({ error: 'userId mancante' });

  db.get(`SELECT userId, registrationDate FROM users WHERE userId = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Errore database' });
    if (!row) return res.status(404).json({ error: 'Utente non trovato' });

    res.json(row);
  });
};