const Transfer = require('../models/Transfer');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Warehouse = require('../models/Warehouse');
const Bin = require('../models/Bin');
const { transferSchema } = require('../validators/transaction.validator');
const { logActivity } = require('./activity.controller');

// POST /api/transfers
const createTransfer = async (req, res, next) => {
  try {
    const validation = transferSchema.safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const { 
      product: productId, 
      sourceWarehouse: sourceWId, 
      sourceBin: sourceBId, 
      destWarehouse: destWId, 
      destBin: destBId, 
      quantity,
      notes
    } = validation.data;

    // Prevent transferring to the same bin
    if (sourceBId === destBId) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination bins cannot be the same.'
      });
    }

    // 1. Verify existence of items
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const sourceW = await Warehouse.findById(sourceWId);
    const sourceB = await Bin.findById(sourceBId);
    const destW = await Warehouse.findById(destWId);
    const destB = await Bin.findById(destBId);

    if (!sourceW || !sourceB || !destW || !destB) {
      return res.status(404).json({ success: false, message: 'Source or destination warehouse/bin not found' });
    }

    // 2. Check source inventory
    const sourceInventory = await Inventory.findOne({
      product: productId,
      warehouse: sourceWId,
      bin: sourceBId
    });

    if (!sourceInventory || sourceInventory.quantity < quantity) {
      const available = sourceInventory ? sourceInventory.quantity : 0;
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for transfer. Available: ${available}, Requested: ${quantity}`
      });
    }

    // 3. Verify destination bin capacity
    // Sum current items inside destination bin
    const destBinInventorySum = await Inventory.aggregate([
      { $match: { warehouse: destWId, bin: destBId } },
      { $group: { _id: null, totalQty: { $sum: '$quantity' } } }
    ]);

    const currentDestQty = destBinInventorySum.length > 0 ? destBinInventorySum[0].totalQty : 0;
    if (currentDestQty + quantity > destB.capacity) {
      return res.status(400).json({
        success: false,
        message: `Destination bin capacity exceeded. Capacity: ${destB.capacity}, Current: ${currentDestQty}, Incoming: ${quantity}`
      });
    }

    // 4. Perform Transfer operations
    // Decrement source inventory
    sourceInventory.quantity -= quantity;
    await sourceInventory.save();

    // Increment destination inventory
    await Inventory.findOneAndUpdate(
      { product: productId, warehouse: destWId, bin: destBId },
      { $inc: { quantity: quantity } },
      { upsert: true, new: true }
    );

    // Generate transfer number
    const transferNumber = `TR-${Date.now()}`;

    // Create transfer log
    const transfer = await Transfer.create({
      transferNumber,
      product: productId,
      sourceWarehouse: sourceWId,
      sourceBin: sourceBId,
      destWarehouse: destWId,
      destBin: destBId,
      quantity,
      initiatedBy: req.user._id,
      notes
    });

    await logActivity(
      req.user._id, 
      'Transfer', 
      'Transfers', 
      `Transferred ${quantity} units of ${product.name} from ${sourceW.name}/${sourceB.name} to ${destW.name}/${destB.name}`, 
      req
    );

    res.status(201).json({
      success: true,
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transfers
const getTransfers = async (req, res, next) => {
  try {
    const transfers = await Transfer.find()
      .populate('product', 'name sku')
      .populate('sourceWarehouse', 'name')
      .populate('sourceBin', 'name')
      .populate('destWarehouse', 'name')
      .populate('destBin', 'name')
      .populate('initiatedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: transfers.length, data: transfers });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransfer,
  getTransfers
};
