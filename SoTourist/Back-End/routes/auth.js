const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registrazione e login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Gestione utente
router.delete('/users/:userId', authController.deleteUser);
router.put('/users/:userId', authController.updateUser);
router.put('/users/:userId/password', authController.updatePassword);
router.put('/users/:userId/profile-image', authController.updateProfileImage);
router.get('/users/:userId/profile-image', authController.getProfileImage);
router.get('/users/:userId/registration-date', authController.getRegistrationDate);


// Abbonamento premium/gold
router.post('/users/:userId/upgrade', authController.upgradeToPremium);
router.post('/users/:userId/cancel', authController.cancelPremium);
router.get('/users/:userId/type', authController.getUserType);


module.exports = router;