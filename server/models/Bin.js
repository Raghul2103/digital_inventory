const mongoose = require('mongoose');

const binSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    default: 1000,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  }
}, {
  timestamps: true
});

// Compound index so bins are unique within a warehouse
binSchema.index({ name: 1, warehouse: 1 }, { unique: true });

module.exports = mongoose.model('Bin', binSchema);
