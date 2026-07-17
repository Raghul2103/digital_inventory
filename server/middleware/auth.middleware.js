const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const config = require('../config/config');

const protect = async (req, res, next) => {
  let token;

  // 1. Get token from authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Token missing.'
    });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 3. Find user and populate role
    const user = await User.findById(decoded.id).populate('role');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found with this token'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated. Please contact admin.'
      });
    }

    // 4. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth check failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Token verification failed. Token may be expired or invalid.'
    });
  }
};

module.exports = { protect };
