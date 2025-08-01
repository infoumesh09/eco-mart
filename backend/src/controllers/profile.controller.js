const { UserProfile, UserBasicProfile, Auth } = require('../models');

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user profile and include auth data
    const userProfile = await UserProfile.findOne({
      where: { authId: userId },
      include: [
        {
          model: Auth,
          attributes: ['username', 'email']
        }
      ]
    });
    
    if (!userProfile) {
      // If profile doesn't exist, create a new one with basic info
      const auth = await Auth.findByPk(userId);
      
      if (!auth) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      // Create new profile with empty values
      const newProfile = await UserProfile.create({
        authId: userId,
        firstName: '',
        lastName: '',
        mobileNumber: ''
      });
      
      return res.json({
        profile: {
          id: newProfile.id,
          firstName: '',
          lastName: '',
          mobileNumber: '',
          dob: null,
          streetAddress: '',
          city: '',
          state: '',
          pincode: '',
          profilePicture: null,
          username: auth.username,
          email: auth.email,
          createdAt: newProfile.created_at
        }
      });
    }
    
    // Format the response
    res.json({
      profile: {
        id: userProfile.id,
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        mobileNumber: userProfile.mobileNumber || '',
        dob: userProfile.dob || null,
        streetAddress: userProfile.streetAddress || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        pincode: userProfile.pincode || '',
        profilePicture: userProfile.profilePicture || null,
        username: userProfile.Auth.username,
        email: userProfile.Auth.email,
        createdAt: userProfile.created_at
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

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName, 
      lastName,
      mobileNumber,
      dob,
      streetAddress,
      city,
      state,
      pincode,
      profilePicture
    } = req.body;
    
    // Basic validation
    if (mobileNumber && !/^\d{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        message: 'Mobile number must be a 10-digit number'
      });
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        message: 'PIN code must be a 6-digit number'
      });
    }

    if (dob) {
      const dobDate = new Date(dob);
      if (isNaN(dobDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid date format for date of birth'
        });
      }
      
      // Check if date is realistic (not in the future, not too far in the past)
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 120); // 120 years ago
      
      if (dobDate > today) {
        return res.status(400).json({
          message: 'Date of birth cannot be in the future'
        });
      }
      
      if (dobDate < minDate) {
        return res.status(400).json({
          message: 'Date of birth is unrealistically old'
        });
      }
    }

    // Validate profile picture size if present (not too large)
    if (profilePicture && profilePicture.length > 5 * 1024 * 1024) { // 5MB in bytes
      return res.status(400).json({
        message: 'Profile picture is too large. Maximum size is 5MB'
      });
    }
    
    // Find or create the user profile
    let userProfile = await UserProfile.findOne({ where: { authId: userId } });
    
    if (!userProfile) {
      userProfile = await UserProfile.create({
        authId: userId,
        firstName: firstName || '',
        lastName: lastName || '',
        mobileNumber: mobileNumber || '',
        dob: dob || null,
        streetAddress: streetAddress || '',
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        profilePicture: profilePicture || null
      });
    } else {
      // Update the profile with validated data
      await userProfile.update({
        firstName: firstName !== undefined ? firstName : userProfile.firstName,
        lastName: lastName !== undefined ? lastName : userProfile.lastName,
        mobileNumber: mobileNumber !== undefined ? mobileNumber : userProfile.mobileNumber,
        dob: dob !== undefined ? dob : userProfile.dob,
        streetAddress: streetAddress !== undefined ? streetAddress : userProfile.streetAddress,
        city: city !== undefined ? city : userProfile.city,
        state: state !== undefined ? state : userProfile.state,
        pincode: pincode !== undefined ? pincode : userProfile.pincode,
        profilePicture: profilePicture !== undefined ? profilePicture : userProfile.profilePicture
      });
    }
    
    // Get updated profile
    const updatedProfile = await UserProfile.findOne({
      where: { authId: userId },
      include: [
        {
          model: Auth,
          attributes: ['username', 'email']
        }
      ]
    });
    
    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        firstName: updatedProfile.firstName || '',
        lastName: updatedProfile.lastName || '',
        mobileNumber: updatedProfile.mobileNumber || '',
        dob: updatedProfile.dob || null,
        streetAddress: updatedProfile.streetAddress || '',
        city: updatedProfile.city || '',
        state: updatedProfile.state || '',
        pincode: updatedProfile.pincode || '',
        profilePicture: updatedProfile.profilePicture || null,
        username: updatedProfile.Auth.username,
        email: updatedProfile.Auth.email,
        createdAt: updatedProfile.created_at
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({
      message: 'Error updating profile',
      error: err.message
    });
  }
};

// Get basic profile data for the authenticated user
const getBasicProfile = async (req, res) => {
  try {
    const userId = req.userId;
    
    // First try to find an existing basic profile
    let basicProfile = await UserBasicProfile.findOne({
      where: { authId: userId },
      include: [
        {
          model: Auth,
          attributes: ['email', 'username']
        }
      ]
    });
    
    // If no basic profile exists, check if there's a full profile to copy from
    if (!basicProfile) {
      const fullProfile = await UserProfile.findOne({
        where: { authId: userId }
      });
      
      // Get the user's email
      const authUser = await Auth.findByPk(userId);
      const userEmail = authUser ? authUser.email : '';
      
      // If full profile exists, create a basic profile from it
      if (fullProfile) {
        basicProfile = await UserBasicProfile.create({
          authId: userId,
          fullName: `${fullProfile.firstName || ''} ${fullProfile.lastName || ''}`.trim(),
          email: userEmail,
          phone: fullProfile.mobileNumber,
          dateOfBirth: fullProfile.dob,
          streetAddress: fullProfile.streetAddress,
          city: fullProfile.city,
          state: fullProfile.state,
          pinCode: fullProfile.pincode
        });
      } else {
        // If no profiles exist, create a minimal one with just email from auth
        basicProfile = await UserBasicProfile.create({
          authId: userId,
          email: userEmail
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      profile: basicProfile
    });
  } catch (error) {
    console.error('Error fetching basic profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch basic profile',
      error: error.message
    });
  }
};

// Update basic profile for the authenticated user
const updateBasicProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { fullName, email, phone, dateOfBirth, streetAddress, city, state, pinCode } = req.body;
    
    // Get user's current email
    const authUser = await Auth.findByPk(userId);
    const userEmail = authUser ? authUser.email : '';
    
    // Find or create the basic profile
    let [basicProfile, created] = await UserBasicProfile.findOrCreate({
      where: { authId: userId },
      defaults: {
        fullName: fullName || '',
        email: email || userEmail,
        phone: phone || '',
        dateOfBirth: dateOfBirth || null,
        streetAddress: streetAddress || '',
        city: city || '',
        state: state || '',
        pinCode: pinCode || ''
      }
    });
    
    // If profile existed, update it
    if (!created) {
      await basicProfile.update({
        fullName: fullName !== undefined ? fullName : basicProfile.fullName,
        email: email !== undefined ? email : basicProfile.email,
        phone: phone !== undefined ? phone : basicProfile.phone,
        dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : basicProfile.dateOfBirth,
        streetAddress: streetAddress !== undefined ? streetAddress : basicProfile.streetAddress,
        city: city !== undefined ? city : basicProfile.city,
        state: state !== undefined ? state : basicProfile.state,
        pinCode: pinCode !== undefined ? pinCode : basicProfile.pinCode
      });
      
      // Refresh profile after update
      basicProfile = await UserBasicProfile.findOne({
        where: { authId: userId }
      });
    }
    
    // Also update email in Auth if it changed
    if (email && email !== userEmail) {
      await Auth.update({ email }, { where: { id: userId } });
    }
    
    return res.status(200).json({
      success: true,
      message: created ? 'Basic profile created successfully' : 'Basic profile updated successfully',
      profile: basicProfile
    });
  } catch (error) {
    console.error('Error updating basic profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update basic profile',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getBasicProfile,
  updateBasicProfile
}; 