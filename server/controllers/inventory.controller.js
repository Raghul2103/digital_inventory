const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

const getInventory = async (req, res, next) => {
  try {
    const { search, warehouse, bin, page = 1, limit = 15 } = req.query;
    const filter = {};

    if (warehouse) {
      filter.warehouse = warehouse;
    }
    if (bin) {
      filter.bin = bin;
    }

    if (search) {
      const matchingProducts = await Product.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const productIds = matchingProducts.map(p => p._id);
      filter.product = { $in: productIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inventory.countDocuments(filter);

    const items = await Inventory.find(filter)
      .populate('product', 'name sku barcode cost price image')
      .populate('warehouse', 'name')
      .populate('bin', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ quantity: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
      currentPage: parseInt(page),
      data: items
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory
};
