const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// Get all products
router.get('/', productController.getAllProducts);

// Get products by category - must come before ID route
router.get('/category/:category', productController.getProductsByCategory);

// Get product by ID
router.get('/:id', productController.getProductById);

// Create initial products (for demo purposes)
router.post('/init', productController.createInitialProducts);

module.exports = router; 