const Product = require('../models/Product');
const Category = require('../models/Category');
const Warehouse = require('../models/Warehouse');
const Bin = require('../models/Bin');
const Inventory = require('../models/Inventory');
const { productSchema } = require('../validators/product.validator');
const { logActivity } = require('./activity.controller');

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const validation = productSchema.safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const data = validation.data;
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    // Verify category exists
    const categoryExists = await Category.findById(data.category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Invalid category selection' });
    }

    const product = await Product.create(data);

    // If default warehouse & bin provided, initialize inventory record at 0
    if (data.warehouse && data.bin) {
      await Inventory.create({
        product: product._id,
        warehouse: data.warehouse,
        bin: data.bin,
        quantity: 0
      });
    }

    await logActivity(req.user._id, 'Create', 'Products', `Created product: ${product.name} (SKU: ${product.sku})`, req);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category, 
      warehouse, 
      status, 
      sortBy = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const query = {};

    // Global Search (Name, SKU, Barcode, Brand)
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { barcode: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') }
      ];
    }

    if (category) query.category = category;
    if (warehouse) query.warehouse = warehouse;
    if (status) query.status = status;

    const sortOption = {};
    sortOption[sortBy] = order === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('warehouse', 'name')
      .populate('bin', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalProducts: total,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('warehouse', 'name')
      .populate('bin', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get warehouse distribution levels
    const stockLevels = await Inventory.find({ product: product._id })
      .populate('warehouse', 'name location')
      .populate('bin', 'name');

    res.status(200).json({ success: true, data: product, stockLevels });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const validation = productSchema.partial().safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const data = validation.data;
    if (req.file) {
      data.image = `/uploads/${req.file.filename}`;
    }

    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check category exists if changed
    if (data.category && data.category !== product.category.toString()) {
      const categoryExists = await Category.findById(data.category);
      if (!categoryExists) {
        return res.status(400).json({ success: false, message: 'Invalid category selection' });
      }
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );

    await logActivity(req.user._id, 'Update', 'Products', `Updated product: ${product.name}`, req);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove detailed inventory records
    await Inventory.deleteMany({ product: req.params.id });

    await Product.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, 'Delete', 'Products', `Deleted product: ${product.name}`, req);

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/barcode/:barcode
const getProductByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.barcode })
      .populate('category', 'name')
      .populate('warehouse', 'name')
      .populate('bin', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found with barcode ' + req.params.barcode });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products/import-csv
const importCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    }

    const fs = require('fs');
    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    const lines = fileContent.split(/\r?\n/);
    if (lines.length <= 1) {
      return res.status(400).json({ success: false, message: 'CSV file is empty or missing headers' });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const importedProducts = [];
    const errors = [];

    // Pre-fetch Category & Warehouse to prevent multiple DB trips
    const categories = await Category.find();
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c._id]));

    const warehouses = await Warehouse.find();
    const warehouseMap = new Map(warehouses.map(w => [w.name.toLowerCase(), w._id]));

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle basic CSV quotes and commas
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));

      if (values.length < headers.length) {
        errors.push(`Line ${i + 1}: Column count mismatch`);
        continue;
      }

      // Map row values to keys
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });

      const { sku, barcode, name, brand, category, costPrice, sellingPrice, gst, reorderLevel, warehouse } = row;

      // Resolve IDs
      const categoryId = categoryMap.get(category ? category.toLowerCase() : '');
      const warehouseId = warehouseMap.get(warehouse ? warehouse.toLowerCase() : '');

      if (!sku || !barcode || !name || !brand || !costPrice || !sellingPrice) {
        errors.push(`Line ${i + 1}: Missing required fields (sku, barcode, name, brand, costPrice, sellingPrice)`);
        continue;
      }

      if (!categoryId) {
        errors.push(`Line ${i + 1}: Category '${category}' does not exist. Create it first.`);
        continue;
      }

      try {
        // Upsert product by SKU
        const productData = {
          sku,
          barcode,
          name,
          brand,
          category: categoryId,
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          gst: parseFloat(gst || 18),
          reorderLevel: parseFloat(reorderLevel || 10),
          warehouse: warehouseId || null,
          status: 'Active'
        };

        const product = await Product.findOneAndUpdate(
          { sku },
          productData,
          { upsert: true, new: true }
        );
        importedProducts.push(product);
      } catch (err) {
        errors.push(`Line ${i + 1}: DB Error - ${err.message}`);
      }
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    await logActivity(req.user._id, 'Import', 'Products', `Imported CSV. Success: ${importedProducts.length}, Errors: ${errors.length}`, req);

    res.status(200).json({
      success: true,
      message: `CSV import completed: ${importedProducts.length} successfully processed.`,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/export-csv
const exportCSV = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('warehouse', 'name')
      .populate('bin', 'name');

    let csvContent = 'sku,barcode,name,brand,category,costPrice,sellingPrice,gst,quantity,reorderLevel,warehouse,bin,status\n';

    products.forEach(p => {
      const row = [
        `"${p.sku}"`,
        `"${p.barcode}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand.replace(/"/g, '""')}"`,
        `"${p.category ? p.category.name : ''}"`,
        p.costPrice,
        p.sellingPrice,
        p.gst,
        p.quantity,
        p.reorderLevel,
        `"${p.warehouse ? p.warehouse.name : ''}"`,
        `"${p.bin ? p.bin.name : ''}"`,
        `"${p.status}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export_' + Date.now() + '.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  importCSV,
  exportCSV
};
