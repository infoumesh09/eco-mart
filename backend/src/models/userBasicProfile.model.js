const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Auth = require('./auth.model');

const UserBasicProfile = sequelize.define('UserBasicProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  authId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'auth_id',
    references: {
      model: Auth,
      key: 'id'
    }
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'full_name'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'date_of_birth'
  },
  streetAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'street_address'
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pinCode: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'pin_code'
  }
}, {
  tableName: 'user_basic_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Establish relationship
Auth.hasOne(UserBasicProfile, { foreignKey: 'auth_id' });
UserBasicProfile.belongsTo(Auth, { foreignKey: 'auth_id' });

module.exports = UserBasicProfile; 