const Auth = require('./auth.model');
const UserProfile = require('./userProfile.model');
const UserBasicProfile = require('./userBasicProfile.model');
const Cart = require('./cart.model');
const CartItem = require('./cart-item.model');
const Product = require('./product.model');

// Auth - Cart Association
Auth.hasOne(Cart, {
  foreignKey: 'userId',
  as: 'cart'
});
Cart.belongsTo(Auth, {
  foreignKey: 'userId',
  as: 'user'
});

// Cart - CartItem Association
Cart.hasMany(CartItem, {
  foreignKey: 'cartId',
  as: 'items'
});
CartItem.belongsTo(Cart, {
  foreignKey: 'cartId',
  as: 'cart'
});

// Product - CartItem Association
Product.hasMany(CartItem, {
  foreignKey: 'productId',
  as: 'cartItems'
});
CartItem.belongsTo(Product, {
  foreignKey: 'productId',
  as: 'product'
});

module.exports = {
  Auth,
  UserProfile,
  UserBasicProfile,
  Cart,
  CartItem,
  Product
}; 