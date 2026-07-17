const Supplier = require('../models/Supplier');
const { logActivity } = require('./activity.controller');

// POST /api/suppliers
const createSupplier = async (req, res, next) => {
  try {
    const { name, email, phone, company, address } = req.body;
    if (!name || !email || !phone || !company || !address) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const supplier = await Supplier.create({ name, email, phone, company, address });
    await logActivity(req.user._id, 'Create', 'Suppliers', `Created supplier: ${name} (${company})`, req);

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// GET /api/suppliers
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    next(error);
  }
};

// GET /api/suppliers/:id
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// PUT /api/suppliers/:id
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await logActivity(req.user._id, 'Update', 'Suppliers', `Updated supplier: ${supplier.name}`, req);
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'Delete', 'Suppliers', `Deleted supplier: ${supplier.name}`, req);

    res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
};
