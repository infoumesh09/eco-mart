const validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || username.length < 3) {
    return res.status(400).json({
      message: 'Username is required and should be at least 3 characters long'
    });
  }

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      message: 'Valid email is required'
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      message: 'Password is required and should be at least 6 characters long'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({
      message: 'Valid email is required'
    });
  }

  if (!password) {
    return res.status(400).json({
      message: 'Password is required'
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin
}; 