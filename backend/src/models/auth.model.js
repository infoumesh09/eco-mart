const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Auth = sequelize.define('Auth', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'auths',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (auth) => {
      if (auth.password) {
        const salt = await bcrypt.genSalt(10);
        auth.password = await bcrypt.hash(auth.password, salt);
      }
    }
  }
});

// Instance method to check password
Auth.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = Auth; 