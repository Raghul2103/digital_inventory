# 📦 InventoryFlow - MERN Smart Inventory & Warehouse Management System

InventoryFlow is an enterprise-grade, responsive warehouse management system designed to track catalog balances across multiple physical warehouses and nested rack bins. It includes role-based access gates (RBAC), custom HTTP-only session cookies, automated SKU generators, profession-grade PDF tax invoices with embedded QR codes, CSV importing/exporting, and a centralized audit trail.

---

## 🌟 Core Modules & Features

1. **Dashboard & Analytics**:
   * Statistical KPI cards tracking total stock value, active products, low-stock warnings, and warehouse capacities.
   * Interactive **Recharts** visualizations displaying monthly revenue trends, procurement vs. sales expenditures, and category-wise stock allocation.

2. **Role-Based Access Control (RBAC)**:
   * **Admin Role**: Full operational and management privileges, including user creation, bin management, system settings configurations, and audit log lookups.
   * **Staff Role**: Read-only directory access and basic transaction capabilities.

3. **Products Catalog**:
   * CRUD capabilities with dynamic image uploads.
   * Automated unique SKU and barcode generation.
   * Barcode scanner simulator (instantly fetches product details by inputting UPC code).

4. **Inventory Balances (Detailed nested balances)**:
   * Track exact item counts nested under specific **Warehouses** and **Rack Bins** (e.g., *Main Warehouse -> Bin A-1*).
   * Search by name/SKU and filter by physical warehouse and bin locations.
   * Color-coded stock level badges (*Optimal*, *Low Stock*, *Out of Stock*) with alert thresholds.

5. **Procurement Wizard (Purchases)**:
   * Dynamic shopping cart to log stock-in purchases from suppliers.
   * Auto-calculates cost prices, taxes, and adds items directly into target warehouse bins.

6. **Sales & Professional Invoicing**:
   * Real-time stock availability check at checkout (blocks sales exceeding bin capacity).
   * On-the-fly streaming of professional PDF tax invoices using **PDFKit** complete with dynamic base64 verification QR codes.

7. **Stock Transfers**:
   * Moves inventory securely between different warehouses and bins.
   * Validates available quantities at the source and checks target bin weight capacities to prevent overflow.

8. **Branding & System Configuration**:
   * System settings form updating corporate metadata (registered name, address, GSTIN, currency, and hotline phone).
   * Dynamic image logo upload rendering in real-time at the header of PDF invoices.
   * Cohesive Dark/Light mode theme switcher.

---

## 📂 System Directory Structure

```
Inventoryflow/
├── package.json              # Monorepo task runner (concurrent execution)
├── .gitignore                # Production files & env excluder
├── client/                   # React Frontend App
│   ├── index.html            # Entry layout and Google fonts
│   ├── tailwind.config.js    # Tailwind configuration
│   ├── postcss.config.js    # PostCSS Tailwind plugins
│   └── src/
│       ├── main.jsx          # React entry
│       ├── App.jsx           # Root layout with providers
│       ├── context/          # AuthContext & ThemeContext
│       ├── layouts/          # DashboardLayout (Premium Sidebar)
│       ├── routes/           # AppRoutes (Protected gates, Auth Route guards)
│       └── pages/            # View Pages (Dashboard, Products, Sales, Settings)
└── server/                   # Node/Express API Server
    ├── server.js             # API bootstrapper with DB auto-seeder
    ├── config/               # Database pooler & environment variables loader
    ├── controllers/          # Business logic (Purchases, Sales, PDF Kit)
    ├── middleware/           # Protect validation gates & Multer uploads
    ├── models/               # 16 Mongoose DB Schemas
    ├── routes/               # Express endpoints routers
    ├── validators/           # Zod request validators
    └── tests/                # dbCheck.js integration test script
```

---

## ⚙️ Environment Variables Config

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/inventoryflow
JWT_SECRET=supersecretkey12345!
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_REMEMBER_EXPIRY=30d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 🚀 Installation & Local Execution

### Prerequisites
Make sure **Node.js (v18+)** and **MongoDB** are installed and running on your local machine.

### 1. Installation
In the root directory of the workspace, run the following task runner:
```bash
npm run install-all
```
*This installs packages inside the root, backend (`server/`), and frontend (`client/`) concurrently.*

### 2. Seeding default data
When you first start the server, the database auto-seeder runs to load:
* **Default Roles**: `Admin` and `Staff` mapping required permissions.
* **Admin account**: `admin@inventoryflow.com` (password: `adminpassword123`).
* **Initial setup**: Default settings parameters, category `General`, and `Main Warehouse` with `Bin A-1`.

### 3. Running concurrently in Dev mode
In the root directory, start the servers:
```bash
npm run dev
```
*This concurrently starts the backend server on `http://localhost:5000` and the Vite React app on `http://localhost:5173`.*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
* `POST /api/auth/signup` - Register a new user profile.
* `POST /api/auth/login` - Authenticate credentials and receive secure cookies.
* `POST /api/auth/logout` - Clear user JWT session.
* `GET /api/auth/me` - Get profile of the logged-in user.

### Detailed Inventory (`/api/inventory`)
* `GET /api/inventory` *(Protected, view_products)* - Retrieve detailed stock quantities nested in warehouses and bins (supports search & filters).

### Products Catalog (`/api/products`)
* `GET /api/products` *(Protected, view_products)* - List catalog (supports pagination, search).
* `POST /api/products` *(Protected, manage_products)* - Add product with automatic barcode/SKU creation.
* `GET /api/products/export` *(Protected, manage_products)* - Export products catalog to CSV.
* `POST /api/products/import` *(Protected, manage_products)* - Bulk CSV upload.
* `GET /api/products/barcode/:barcode` *(Protected, view_products)* - Scan/Retrieve product by barcode.

### Transactions & Logistics
* `POST /api/purchases` *(Protected, manage_purchases)* - Create procurement purchase order (increments stock).
* `POST /api/sales` *(Protected, manage_sales)* - Check stock availability and create sales invoice.
* `GET /api/sales/:id/pdf` *(Protected, view_sales)* - Stream professional tax invoice PDF.
* `POST /api/transfers` *(Protected, manage_transfers)* - Move items between bins (checks source stock & destination weight).
