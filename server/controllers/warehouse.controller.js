const Warehouse = require('../models/Warehouse');
const Bin = require('../models/Bin');
const { warehouseSchema, binSchema } = require('../validators/warehouse.validator');
const { logActivity } = require('./activity.controller');

// ==========================================
// WAREHOUSE CONTROLLERS
// ==========================================

// POST /api/warehouses
const createWarehouse = async (req, res, next) => {
  try {
    const validation = warehouseSchema.safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const warehouse = await Warehouse.create(validation.data);
    await logActivity(req.user._id, 'Create', 'Warehouses', `Created warehouse: ${warehouse.name}`, req);

    res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};

// GET /api/warehouses
const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: warehouses.length, data: warehouses });
  } catch (error) {
    next(error);
  }
};

// GET /api/warehouses/:id
const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};

// PUT /api/warehouses/:id
const updateWarehouse = async (req, res, next) => {
  try {
    const validation = warehouseSchema.partial().safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      { $set: validation.data },
      { new: true, runValidators: true }
    );

    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    await logActivity(req.user._id, 'Update', 'Warehouses', `Updated warehouse: ${warehouse.name}`, req);
    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/warehouses/:id
const deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Check if bins exist in warehouse
    const binsCount = await Bin.countDocuments({ warehouse: req.params.id });
    if (binsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete warehouse. It contains ${binsCount} bins. Delete the bins first.`
      });
    }

    await Warehouse.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'Delete', 'Warehouses', `Deleted warehouse: ${warehouse.name}`, req);

    res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// BIN CONTROLLERS
// ==========================================

// POST /api/bins
const createBin = async (req, res, next) => {
  try {
    const validation = binSchema.safeParse(req.body);
    if (!validation.success) return next(validation.error);

    // Verify warehouse exists
    const warehouse = await Warehouse.findById(validation.data.warehouse);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const bin = await Bin.create(validation.data);
    await logActivity(req.user._id, 'Create', 'Bins', `Created bin: ${bin.name} in ${warehouse.name}`, req);

    res.status(201).json({ success: true, data: bin });
  } catch (error) {
    next(error);
  }
};

// GET /api/bins
const getBins = async (req, res, next) => {
  try {
    const { warehouse } = req.query;
    const filter = {};
    if (warehouse) filter.warehouse = warehouse;

    const bins = await Bin.find(filter).populate('warehouse', 'name').sort({ name: 1 });
    res.status(200).json({ success: true, count: bins.length, data: bins });
  } catch (error) {
    next(error);
  }
};

// GET /api/bins/:id
const getBinById = async (req, res, next) => {
  try {
    const bin = await Bin.findById(req.params.id).populate('warehouse', 'name');
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }
    res.status(200).json({ success: true, data: bin });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bins/:id
const updateBin = async (req, res, next) => {
  try {
    const validation = binSchema.partial().safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const bin = await Bin.findByIdAndUpdate(
      req.params.id,
      { $set: validation.data },
      { new: true, runValidators: true }
    ).populate('warehouse', 'name');

    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    await logActivity(req.user._id, 'Update', 'Bins', `Updated bin: ${bin.name} in ${bin.warehouse.name}`, req);
    res.status(200).json({ success: true, data: bin });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bins/:id
const deleteBin = async (req, res, next) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ success: false, message: 'Bin not found' });
    }

    await Bin.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'Delete', 'Bins', `Deleted bin: ${bin.name}`, req);

    res.status(200).json({ success: true, message: 'Bin deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  createBin,
  getBins,
  getBinById,
  updateBin,
  deleteBin
};
