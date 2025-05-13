const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registrazione e login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Gestione utente
router.delete('/users/:userId', authController.deleteUser);
router.put('/users/:userId', authController.updateUser);

// Abbonamento premium/gold
router.post('/users/:userId/upgrade', authController.upgradeToPremium);
router.post('/users/:userId/cancel', authController.cancelPremium);
router.get('/users/:userId/type', authController.getUserType);


module.exports = router;