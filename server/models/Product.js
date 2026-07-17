const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  barcode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  brand: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  gst: {
    type: Number,
    required: true,
    default: 18, // default 18% GST
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  reorderLevel: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    default: null,
  },
  bin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bin',
    default: null,
  },
  image: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft'],
    default: 'Active',
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
