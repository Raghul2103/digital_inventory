const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const config = require('../config/config');
const { signupSchema, loginSchema } = require('../validators/auth.validator');
const { logActivity } = require('./activity.controller');

// Helper to sign JWT Access Token
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry
  });
};

// Helper to sign JWT Refresh Token
const generateRefreshToken = (user, rememberMe = false) => {
  const expiry = rememberMe ? config.jwtRememberExpiry : config.jwtRefreshExpiry;
  return jwt.sign({ id: user._id }, config.jwtSecret, {
    expiresIn: expiry
  });
};

// POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    // 1. Validation
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      return next(validation.error);
    }
    const { name, email, password, roleName } = validation.data;

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // 3. Find or create Role
    let role = await Role.findOne({ name: roleName });
    if (!role) {
      // Create role on the fly if it doesn't exist
      const defaultPermissions = roleName === 'Admin' 
        ? ['manage_products', 'view_products', 'manage_categories', 'view_categories', 'manage_suppliers', 'view_suppliers', 'manage_customers', 'view_customers', 'manage_purchases', 'view_purchases', 'manage_sales', 'view_sales', 'manage_warehouses', 'view_warehouses', 'manage_transfers', 'view_transfers', 'manage_reports', 'view_reports', 'manage_users', 'manage_settings', 'view_logs']
        : ['view_products', 'view_categories', 'view_suppliers', 'view_customers', 'view_purchases', 'view_sales', 'view_warehouses', 'view_transfers', 'view_reports'];
      
      role = await Role.create({
        name: roleName,
        permissions: defaultPermissions
      });
    }

    // 4. Create User
    const user = await User.create({
      name,
      email,
      password,
      role: role._id,
      isStaff: roleName === 'Staff'
    });

    await logActivity(user._id, 'Sign Up', 'Authentication', `New user registered as ${roleName}`, req);

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return next(validation.error);
    }
    const { email, password, rememberMe } = validation.data;

    // 1. Find user and include role details
    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // 2. Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, rememberMe);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // 4. Set Http-only cookies
    // In production (Vercel → Render cross-domain), sameSite must be 'none' + secure: true
    // In local dev (same host), sameSite 'lax' works fine
    const isProduction = config.env === 'production';

    const accessCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    };

    const refreshCookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 days vs 7 days
    };

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    await logActivity(user._id, 'Login', 'Authentication', 'User successfully logged in', req);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken, // Also return in response body for flexibility
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
      await logActivity(req.user._id, 'Logout', 'Authentication', 'User logged out', req);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is missing'
      });
    }

    // 1. Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 2. Match in database
    const user = await User.findById(decoded.id).populate('role');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // 3. Issue new access token
    const newAccessToken = generateAccessToken(user);

    // Refresh cookies (production-aware sameSite)
    const isProd = config.env === 'production';
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('role');
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  getMe
};
