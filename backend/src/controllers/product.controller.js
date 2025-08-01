const { Product } = require('../models');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({
      message: 'Error fetching products',
      error: err.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }
    
    res.json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({
      message: 'Error fetching product',
      error: err.message
    });
  }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: {
        category: req.params.category
      }
    });
    
    res.json(products);
  } catch (err) {
    console.error('Error fetching products by category:', err);
    res.status(500).json({
      message: 'Error fetching products by category',
      error: err.message
    });
  }
};

// Create initial product data (for demo purposes)
const createInitialProducts = async (req, res) => {
  try {
    // Check if products already exist
    const productCount = await Product.count();
    if (productCount > 0) {
      return res.status(400).json({
        message: 'Products already exist'
      });
    }
    
    // Sample products data
    const products = [
      {
        name: 'Bamboo Toothbrush',
        description: 'Eco-friendly bamboo toothbrush that is biodegradable and sustainable.',
        price: 149.00,
        image: 'images/brush2.jpeg',
        category: 'Bathroom'
      },
      {
        name: 'Reusable Water Bottle',
        description: 'Stainless steel water bottle that helps reduce plastic waste.',
        price: 299.00,
        image: 'images/bottle2.jpeg',
        category: 'Kitchen'
      },
      {
        name: 'Eco-Friendly Soap',
        description: 'Natural soap made with organic ingredients and plastic-free packaging.',
        price: 199.00,
        image: 'images/soap.webp',
        category: 'Bathroom'
      },
      {
        name: 'Bamboo Cotton Buds',
        description: 'Sustainable alternative to plastic cotton buds with biodegradable bamboo stems.',
        price: 99.00,
        image: 'images/bamboobuds.jpeg.jpg',
        category: 'Bathroom'
      },
      {
        name: 'Reusable Grocery Bags',
        description: 'Durable cotton grocery bags that replace plastic shopping bags.',
        price: 249.00,
        image: 'images/bags.jpg',
        category: 'Kitchen'
      },
      {
        name: 'Stainless Steel Straws',
        description: 'Reusable metal straws that eliminate the need for plastic straws.',
        price: 199.00,
        image: 'images/straws.jpg',
        category: 'Kitchen'
      }
    ];
    
    // Create products
    await Product.bulkCreate(products);
    
    res.status(201).json({
      message: 'Initial products created successfully',
      productCount: products.length
    });
  } catch (err) {
    console.error('Error creating initial products:', err);
    res.status(500).json({
      message: 'Error creating initial products',
      error: err.message
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createInitialProducts
}; 