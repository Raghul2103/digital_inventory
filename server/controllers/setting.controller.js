const Setting = require('../models/Setting');
const { logActivity } = require('./activity.controller');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        companyName: 'InventoryFlow Corporation',
        currency: 'INR',
        theme: 'light'
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }

    const data = { ...req.body };
    if (req.file) {
      data.companyLogo = `/uploads/${req.file.filename}`;
    }

    Object.assign(settings, data);
    await settings.save();

    await logActivity(req.user._id, 'Update', 'Settings', 'Updated company system settings', req);

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings
};
