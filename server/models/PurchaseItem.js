const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  purchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
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
  costPrice: {
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

module.exports = mongoose.model('PurchaseItem', purchaseItemSchema);
