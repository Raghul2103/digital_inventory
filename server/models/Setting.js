const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    default: 'InventoryFlow Corp',
  },
  companyLogo: {
    type: String,
    default: '',
  },
  companyAddress: {
    type: String,
    default: '',
  },
  companyPhone: {
    type: String,
    default: '',
  },
  companyEmail: {
    type: String,
    default: '',
  },
  companyGST: {
    type: String,
    default: '',
  },
  currency: {
    type: String,
    default: 'INR',
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
