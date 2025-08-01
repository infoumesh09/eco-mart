const { Cart, CartItem, Product } = require('../models');

// Get user's cart
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      where: { userId: req.user.id },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image']
        }]
      }]
    });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id
      });
    }

    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({
      message: 'Error fetching cart',
      error: err.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;
    
    console.log('Add to cart request:', { productId, quantity, price });
    console.log('User:', req.user);

    // Validate input
    if (!productId) {
      return res.status(400).json({
        message: 'Product ID is required'
      });
    }
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        message: 'Valid quantity is required'
      });
    }
    
    if (!price) {
      return res.status(400).json({
        message: 'Price is required'
      });
    }

    // Try to find product first
    let product;
    try {
      // First try to find by exact ID
      product = await Product.findByPk(productId);
      
      // If not found, create a placeholder product
      if (!product) {
        console.log('Product not found in database, creating temporary product data');
        
        // For frontend-provided products, create a temporary representation
        product = {
          id: productId, // Use the provided ID
          name: req.body.name || 'Unknown Product',
          price: price,
          image: req.body.image || null
        };
        
        // Try to create the actual product record for future use
        try {
          await Product.create({
            id: productId,
            name: req.body.name || 'Unknown Product',
            price: price,
            image: req.body.image || null,
            description: 'Automatically created from cart addition',
            category: 'Other'
          });
          console.log('Created new product record for', productId);
        } catch (createErr) {
          // This is non-critical, we can proceed even if product creation fails
          console.error('Error creating product record:', createErr.message);
        }
      }
    } catch (err) {
      console.error('Error finding product:', err);
      
      // Handle case where productId is not a valid UUID format
      console.log('Invalid product ID format, creating temporary product data');
      product = {
        id: productId,
        name: req.body.name || 'Unknown Product',
        price: price,
        image: req.body.image || null
      };
    }

    // Find or create user's cart
    let cart = await Cart.findOne({
      where: { userId: req.user.id }
    });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user.id
      });
    }

    // Check if item already exists in cart
    let cartItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId
      }
    });

    if (cartItem) {
      // Update quantity if item exists
      cartItem.quantity += quantity;
      cartItem.price = product.price; // Use price from product
      cartItem.subtotal = parseFloat(cartItem.price) * cartItem.quantity; // Manually calculate subtotal
      await cartItem.save();
    } else {
      // Create new cart item if it doesn't exist
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
        price: product.price, // Use price from product
        subtotal: parseFloat(product.price) * quantity // Explicitly set the subtotal
      });
    }

    // Update cart total
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id }
    });

    cart.total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    await cart.save();

    // Return updated cart with items
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image']
        }]
      }]
    });

    res.json({
      message: 'Item added to cart successfully',
      cart: updatedCart
    });
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).json({
      message: 'Error adding item to cart',
      error: err.message
    });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const cartItem = await CartItem.findByPk(itemId);
    if (!cartItem) {
      return res.status(404).json({
        message: 'Cart item not found'
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    // Update cart total
    const cart = await Cart.findByPk(cartItem.cartId);
    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id }
    });

    cart.total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    await cart.save();

    // Return updated cart with items
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image']
        }]
      }]
    });

    res.json({
      message: 'Cart item updated successfully',
      cart: updatedCart
    });
  } catch (err) {
    console.error('Error updating cart item:', err);
    res.status(500).json({
      message: 'Error updating cart item',
      error: err.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cartItem = await CartItem.findByPk(itemId);
    if (!cartItem) {
      return res.status(404).json({
        message: 'Cart item not found'
      });
    }

    const cartId = cartItem.cartId;
    await cartItem.destroy();

    // Update cart total
    const cart = await Cart.findByPk(cartId);
    const cartItems = await CartItem.findAll({
      where: { cartId }
    });

    cart.total = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    await cart.save();

    // Return updated cart with items
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image']
        }]
      }]
    });

    res.json({
      message: 'Item removed from cart successfully',
      cart: updatedCart
    });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({
      message: 'Error removing item from cart',
      error: err.message
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id }
    });

    if (cart) {
      await CartItem.destroy({
        where: { cartId: cart.id }
      });

      cart.total = 0;
      await cart.save();
    }

    // Return updated empty cart
    const updatedCart = await Cart.findOne({
      where: { id: cart.id },
      include: [{
        model: CartItem,
        as: 'items',
        include: [{
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image']
        }]
      }]
    });

    res.json({
      message: 'Cart cleared successfully',
      cart: updatedCart
    });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(500).json({
      message: 'Error clearing cart',
      error: err.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
}; 