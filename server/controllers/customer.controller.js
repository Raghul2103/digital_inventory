const Customer = require('../models/Customer');
const { logActivity } = require('./activity.controller');

// POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email || !phone || !address) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const customer = await Customer.create({ name, email, phone, address });
    await logActivity(req.user._id, 'Create', 'Customers', `Created customer: ${name}`, req);

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// GET /api/customers
const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    next(error);
  }
};

// GET /api/customers/:id
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await logActivity(req.user._id, 'Update', 'Customers', `Updated customer: ${customer.name}`, req);
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/customers/:id
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'Delete', 'Customers', `Deleted customer: ${customer.name}`, req);

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
};
