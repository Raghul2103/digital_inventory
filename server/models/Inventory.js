const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  bin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0, // Stock level cannot go below zero
  }
}, {
  timestamps: true
});

// A product can only have one quantity record for a given warehouse and bin
inventorySchema.index({ product: 1, warehouse: 1, bin: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
