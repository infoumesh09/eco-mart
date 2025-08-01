const express = require('express');
const router = express.Router();
const { register, login, getProfile, logout } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validateRegistration, validateLogin } = require('../middleware/validation.middleware');

// Public routes
router.post('/register', validateRegistration, (req, res, next) => {
  register(req, res).catch(next);
});

router.post('/login', validateLogin, (req, res, next) => {
  login(req, res).catch(next);
});

// Protected routes
router.get('/profile', verifyToken, (req, res, next) => {
  getProfile(req, res).catch(next);
});

// Logout user
router.post('/logout', verifyToken, (req, res, next) => {
  logout(req, res).catch(next);
});

module.exports = router; 