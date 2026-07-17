const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const config = require('./config/config');
const errorHandler = require('./middleware/error.middleware');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const warehouseRoutes = require('./routes/warehouse.routes');
const supplierRoutes = require('./routes/supplier.routes');
const customerRoutes = require('./routes/customer.routes');
const purchaseRoutes = require('./routes/purchase.routes');
const saleRoutes = require('./routes/sale.routes');
const transferRoutes = require('./routes/transfer.routes');
const settingRoutes = require('./routes/setting.routes');
const activityRoutes = require('./routes/activity.routes');
const reportRoutes = require('./routes/report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const inventoryRoutes = require('./routes/inventory.routes');

// DB Seeder Function
const seedDatabase = async () => {
  try {
    const Role = require('./models/Role');
    const User = require('./models/User');
    const Setting = require('./models/Setting');
    const Category = require('./models/Category');
    const Warehouse = require('./models/Warehouse');
    const Bin = require('./models/Bin');

    // 1. Seed Roles
    const rolesCount = await Role.countDocuments();
    let adminRole, staffRole;
    if (rolesCount === 0) {
      console.log('Seeding roles...');
      adminRole = await Role.create({
        name: 'Admin',
        permissions: [
          'manage_products', 'view_products',
          'manage_categories', 'view_categories',
          'manage_suppliers', 'view_suppliers',
          'manage_customers', 'view_customers',
          'manage_purchases', 'view_purchases',
          'manage_sales', 'view_sales',
          'manage_warehouses', 'view_warehouses',
          'manage_transfers', 'view_transfers',
          'manage_reports', 'view_reports',
          'manage_users', 'manage_settings',
          'view_logs'
        ]
      });
      staffRole = await Role.create({
        name: 'Staff',
        permissions: [
          'view_products', 'view_categories',
          'view_suppliers', 'view_customers',
          'view_purchases', 'view_sales',
          'view_warehouses', 'view_transfers',
          'view_reports'
        ]
      });
    } else {
      adminRole = await Role.findOne({ name: 'Admin' });
      staffRole = await Role.findOne({ name: 'Staff' });
    }

    // 2. Seed Default Admin User
    const usersCount = await User.countDocuments();
    if (usersCount === 0 && adminRole) {
      console.log('Seeding default Admin user...');
      await User.create({
        name: 'System Admin',
        email: 'admin@inventoryflow.com',
        password: 'adminpassword123', // Will be pre-saved hashed automatically
        role: adminRole._id,
        isStaff: false
      });
      console.log('Admin account created: admin@inventoryflow.com / adminpassword123');
    }

    // 3. Seed Default Company Settings
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
      console.log('Seeding default system settings...');
      await Setting.create({
        companyName: 'InventoryFlow HQ Ltd',
        companyAddress: '100 Innovation Way, Tech Park, India',
        companyPhone: '+91 9876543210',
        companyEmail: 'support@inventoryflow.com',
        companyGST: '29ABCDE1234F1Z1',
        currency: 'INR',
        theme: 'light'
      });
    }

    // 4. Seed Default Category
    const categoryCount = await Category.countDocuments();
    let defaultCategory;
    if (categoryCount === 0) {
      console.log('Seeding default Category...');
      defaultCategory = await Category.create({
        name: 'General',
        description: 'Default category for products'
      });
    } else {
      defaultCategory = await Category.findOne();
    }

    // 5. Seed Default Warehouse and Bin
    const warehouseCount = await Warehouse.countDocuments();
    let defaultWarehouse;
    if (warehouseCount === 0) {
      console.log('Seeding default Warehouse...');
      defaultWarehouse = await Warehouse.create({
        name: 'Main Warehouse',
        location: 'Mumbai Hub A',
        capacity: 10000,
        status: 'Active'
      });
      
      console.log('Seeding default Bin in Main Warehouse...');
      await Bin.create({
        name: 'Bin A-1',
        warehouse: defaultWarehouse._id,
        capacity: 1000,
        status: 'Active'
      });
    }
  } catch (error) {
    console.error('Seeding database failed:', error.message);
  }
};

const app = express();

// Connect Database & Seed
connectDB().then(() => {
  seedDatabase();
});

// ─── CORS ──────────────────────────────────────────────────────────────────
// MUST be registered BEFORE helmet and all other middleware so that
// preflight OPTIONS requests are answered before any other handler runs.

// Build an allow-list from env: comma-separated CLIENT_URLS or fallback CLIENT_URL
const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / Postman (no Origin header)
    if (!origin) return callback(null, true);

    // Exact match in allow-list
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // Allow ALL *.vercel.app preview URLs automatically (safe for SaaS)
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // Allow localhost on any port for local development
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);

    console.warn(`[CORS] Blocked request from origin: ${origin}`);
    callback(new Error(`CORS policy: origin "${origin}" is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type']
};

// Handle preflight OPTIONS for ALL routes — must be FIRST
app.options('*', cors(corsOptions));

// Apply CORS to all subsequent requests
app.use(cors(corsOptions));

// Security & Parsing Middleware (after CORS so OPTIONS aren't blocked)
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading uploaded static assets
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Static Uploads Serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting (Security)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/logs', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route handler for testing health
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy and running' });
});

// Centralized Error Interceptor
app.use(errorHandler);

// Start listening
const server = app.listen(config.port, () => {
  console.log(`Server running in ${config.env} mode on port ${config.port}`);
});

module.exports = server; // Exported for test suites
