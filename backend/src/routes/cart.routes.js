const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const cartController = require('../controllers/cart.controller');

// Get user's cart
router.get('/', authenticateToken, cartController.getCart);

// Add item to cart
router.post('/add', authenticateToken, cartController.addToCart);

// Update cart item quantity
router.put('/item/:itemId', authenticateToken, cartController.updateCartItem);

// Remove item from cart
router.delete('/item/:itemId', authenticateToken, cartController.removeFromCart);

// Clear cart
router.delete('/clear', authenticateToken, cartController.clearCart);

module.exports = router; 