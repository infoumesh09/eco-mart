const sequelize = require('./database');
const { Auth, Cart, CartItem, Product } = require('../models');

async function syncDatabase() {
  try {
    console.log('Syncing database models...');
    
    // Force true will drop tables - use with caution in production
    await sequelize.sync({ alter: true });
    
    console.log('Database synchronized successfully');
    
    // Count products to see if we need to create initial data
    const productCount = await Product.count();
    console.log(`Found ${productCount} products in the database`);
    
    if (productCount === 0) {
      console.log('Creating initial product data...');
      
      // Sample products data
      const products = [
        {
          id: 'P001',
          name: 'Bamboo Toothbrush',
          description: 'Eco-friendly bamboo toothbrush that is biodegradable and sustainable.',
          price: 149.00,
          image: 'images/brush2.jpeg',
          category: 'Bathroom'
        },
        {
          id: 'P002',
          name: 'Reusable Water Bottle',
          description: 'Stainless steel water bottle that helps reduce plastic waste.',
          price: 299.00,
          image: 'images/bottle2.jpeg',
          category: 'Kitchen'
        },
        {
          id: 'P003',
          name: 'Eco-Friendly Soap',
          description: 'Natural soap made with organic ingredients and plastic-free packaging.',
          price: 199.00,
          image: 'images/soap.webp',
          category: 'Bathroom'
        },
        {
          id: 'P004',
          name: 'Bamboo Cotton Buds',
          description: 'Sustainable alternative to plastic cotton buds with biodegradable bamboo stems.',
          price: 99.00,
          image: 'images/bamboobuds.jpeg.jpg',
          category: 'Bathroom'
        }
      ];
      
      // Create products
      await Product.bulkCreate(products);
      console.log(`Created ${products.length} initial products`);
    }
    
  } catch (error) {
    console.error('Database sync error:', error);
  }
}

// Export function to be used in server startup
module.exports = syncDatabase; 