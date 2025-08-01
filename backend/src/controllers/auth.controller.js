const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Auth } = require('../models');
const UserProfile = require('../models/userProfile.model');

// Register new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await Auth.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'Username or email already exists'
      });
    }

    // Create auth record
    const auth = await Auth.create({
      username,
      email,
      password // Password will be hashed by the model hook
    });
    
    // Create empty user profile
    await UserProfile.create({
      authId: auth.id,
      firstName: '',
      lastName: '',
      mobileNumber: ''
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: auth.id, username: auth.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: auth.id,
        username: auth.username,
        email: auth.email
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      message: 'Error registering user',
      error: err.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const auth = await Auth.findOne({
      where: { email }
    });

    if (!auth) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify password
    const isValidPassword = await auth.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: auth.id, username: auth.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: auth.id,
        username: auth.username,
        email: auth.email
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      message: 'Error logging in',
      error: err.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const auth = await Auth.findByPk(req.user.id);

    if (!auth) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: {
        id: auth.id,
        username: auth.username,
        email: auth.email
      }
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({
      message: 'Error fetching profile',
      error: err.message
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // In a real JWT implementation, you would add the token to a blacklist or
    // use short-lived tokens with refresh tokens
    
    // For now, we'll just return a success response
    res.json({
      message: 'Logout successful'
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      message: 'Error during logout',
      error: err.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  logout
}; 