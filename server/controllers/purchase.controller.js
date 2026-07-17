const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');
const Bin = require('../models/Bin');
const { purchaseSchema } = require('../validators/transaction.validator');
const { logActivity } = require('./activity.controller');

// POST /api/purchases
const createPurchase = async (req, res, next) => {
  try {
    const validation = purchaseSchema.safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const { supplier: supplierId, items, notes, paymentStatus } = validation.data;

    // Verify supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Generate unique purchase order number
    const purchaseNumber = `PO-${Date.now()}`;
    let totalAmount = 0;
    const processedItems = [];

    // Loop through items to calculate prices and verify products
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product with ID ${item.product} not found` });
      }

      // Determine where the inventory goes: fall back to product defaults if not explicitly specified
      // (The validator allows passing warehouse and bin or default)
      const targetWarehouse = item.warehouse || product.warehouse;
      const targetBin = item.bin || product.bin;

      if (!targetWarehouse || !targetBin) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} must have a designated warehouse and bin for stock updates.`
        });
      }

      // Double-check target warehouse and bin exist
      const wExists = await Warehouse.findById(targetWarehouse);
      const bExists = await Bin.findById(targetBin);
      if (!wExists || !bExists) {
        return res.status(400).json({
          success: false,
          message: `Designated warehouse or bin does not exist for product ${product.name}.`
        });
      }

      const itemSubtotal = item.quantity * item.costPrice * (1 + (item.gst || product.gst) / 100);
      totalAmount += itemSubtotal;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        costPrice: item.costPrice,
        gst: item.gst || product.gst,
        subtotal: itemSubtotal,
        warehouse: targetWarehouse,
        bin: targetBin
      });
    }

    // Create primary purchase document
    const purchase = await Purchase.create({
      purchaseNumber,
      supplier: supplierId,
      totalAmount,
      status: 'Completed', // default directly completes stock update
      paymentStatus,
      notes
    });

    // Save purchase items and update stock levels
    for (const item of processedItems) {
      await PurchaseItem.create({
        purchase: purchase._id,
        product: item.product,
        quantity: item.quantity,
        costPrice: item.costPrice,
        gst: item.gst,
        subtotal: item.subtotal
      });

      // Update Inventory detailed table (warehouse-bin breakdown)
      await Inventory.findOneAndUpdate(
        { product: item.product, warehouse: item.warehouse, bin: item.bin },
        { $inc: { quantity: item.quantity } },
        { upsert: true, new: true }
      );

      // Increment aggregate product quantity
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: item.quantity }
      });
    }

    await logActivity(req.user._id, 'Purchase', 'Purchases', `Completed Purchase ${purchaseNumber}. Total: ${totalAmount.toFixed(2)}`, req);

    res.status(201).json({
      success: true,
      data: purchase,
      itemsCount: processedItems.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/purchases
const getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find()
      .populate('supplier', 'name company')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    next(error);
  }
};

// GET /api/purchases/:id
const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name company email phone address');
    
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }

    const items = await PurchaseItem.find({ purchase: purchase._id })
      .populate('product', 'sku barcode name brand');

    res.status(200).json({ success: true, data: purchase, items });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById
};
