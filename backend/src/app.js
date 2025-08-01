const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const cartRoutes = require('./routes/cart.routes');
const productRoutes = require('./routes/product.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));  // Increased limit for profile pictures

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profile', profileRoutes);

module.exports = app; 