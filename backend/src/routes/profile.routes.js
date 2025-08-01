const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get user profile
router.get('/', verifyToken, profileController.getProfile);

// Update user profile
router.put('/', verifyToken, profileController.updateProfile);

// Get basic user profile
router.get('/basic', verifyToken, profileController.getBasicProfile);

// Update basic user profile
router.put('/basic', verifyToken, profileController.updateBasicProfile);

module.exports = router; 