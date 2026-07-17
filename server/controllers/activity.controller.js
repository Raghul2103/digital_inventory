const ActivityLog = require('../models/ActivityLog');

// Helper to log user activities
const logActivity = async (userId, action, module, details, req) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '') : '';
    await ActivityLog.create({
      user: userId,
      action,
      module,
      details,
      ipAddress
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
};

// GET /api/logs
const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, user, module, action, startDate, endDate } = req.query;
    const query = {};

    if (user) query.user = user;
    if (module) query.module = module;
    if (action) query.action = new RegExp(action, 'i');

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalLogs: total,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logActivity,
  getActivityLogs
};
