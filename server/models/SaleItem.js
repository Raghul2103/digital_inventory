const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  gst: {
    type: Number,
    required: true,
    default: 18,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SaleItem', saleItemSchema);
