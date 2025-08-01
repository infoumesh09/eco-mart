const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Auth = require('./auth.model');

const UserProfile = sequelize.define('UserProfile', {
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
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'last_name'
  },
  mobileNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'mobile_number'
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
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
  pincode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'profile_picture'
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Establish relationship
Auth.hasOne(UserProfile, { foreignKey: 'auth_id' });
UserProfile.belongsTo(Auth, { foreignKey: 'auth_id' });

module.exports = UserProfile; 