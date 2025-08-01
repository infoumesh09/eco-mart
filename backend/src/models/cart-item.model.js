const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cartId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'carts',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'cart_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeValidate: (item) => {
      if (item.price && item.quantity) {
        item.subtotal = parseFloat(item.price) * item.quantity;
      } else {
        item.subtotal = 0;
      }
    },
    beforeCreate: (item) => {
      if (item.price && item.quantity) {
        item.subtotal = parseFloat(item.price) * item.quantity;
      }
    },
    beforeUpdate: (item) => {
      if (item.price && item.quantity) {
        item.subtotal = parseFloat(item.price) * item.quantity;
      }
    }
  }
});

module.exports = CartItem; 