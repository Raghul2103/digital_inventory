# Smart Inventory & Warehouse Management System – Master Build Prompt

> **Purpose:** This document is a comprehensive implementation prompt for building a production-style MERN Stack Inventory & Warehouse Management System.

---

# 1. Role

Act as a **Senior Full Stack MERN Engineer with 14+ years of enterprise experience**.

Build a production-ready application using industry best practices.

---

# 2. Technology Stack

- React (Vite)
- Tailwind CSS
- React Router
- Axios (`customFetch`)
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- HTTP-only Cookies
- bcrypt
- Multer
- Cloudinary (optional)
- Chart.js or Recharts
- React Hook Form
- Zod/Yup Validation

---

# 3. Architecture

Use a clean layered architecture.

```
client/
  src/
    assets/
    components/
    layouts/
    pages/
    hooks/
    services/
    context/
    utils/
    routes/
    styles/

server/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  validators/
  utils/
  uploads/
  logs/
```

---

# 4. Authentication

Implement:

- Signup
- Login
- Logout
- Refresh token
- JWT
- HTTP-only cookie
- Password hashing
- Protected routes
- Role middleware
- Token expiration
- Remember Me

---

# 5. Roles

Admin

Staff

Each permission should be middleware-based.

---

# 6. Modules

- Dashboard
- Products
- Categories
- Suppliers
- Customers
- Purchases
- Sales
- Warehouses
- Bins
- Stock Transfer
- Barcode
- Inventory
- Reports
- Analytics
- Settings
- Activity Logs

---

# 7. Product Fields

- SKU
- Barcode
- Name
- Brand
- Category
- Cost Price
- Selling Price
- GST
- Quantity
- Reorder Level
- Warehouse
- Bin
- Image
- Status

---

# 8. Warehouse

Multiple warehouses.

Each warehouse contains multiple bins.

---

# 9. Purchase Workflow

Supplier

↓

Purchase

↓

Inventory Updated

↓

Activity Log

---

# 10. Sales Workflow

Customer

↓

Invoice

↓

Inventory Reduced

↓

PDF Generated

---

# 11. Dashboard

Include

- Total Products
- Total Sales
- Total Purchases
- Total Customers
- Total Suppliers
- Low Stock
- Today's Sales
- Monthly Revenue

---

# 12. Reports

Generate

- Sales Report
- Purchase Report
- Inventory Report
- Customer Report
- Supplier Report

Export

- CSV
- PDF

---

# 13. Analytics

Charts

- Monthly Sales
- Purchases
- Stock Trend
- Revenue
- Category Distribution

---

# 14. Search

Global Search

Filters

Sorting

Pagination

---

# 15. UI

Fully Responsive

Desktop

Tablet

Mobile

Dark Mode

Reusable Components

---

# 16. Validation

Frontend

Backend

Mongo Validation

Express Validation

---

# 17. Error Handling

Centralized Error Handler

404

401

403

500

Toast Notifications

---

# 18. Security

Helmet

CORS

Rate Limit

JWT

Password Hash

Input Validation

Mongo Injection Protection

XSS Protection

---

# 19. Database Collections

Users

Roles

Products

Categories

Suppliers

Customers

Warehouses

Bins

Purchases

PurchaseItems

Sales

SaleItems

Transfers

Inventory

ActivityLogs

Settings

---

# 20. Inventory Rules

Purchase increases stock.

Sale decreases stock.

Transfer decreases source.

Transfer increases destination.

Never allow negative inventory.

---

# 21. Barcode

Generate automatically.

Print barcode.

Scan barcode.

Search by barcode.

---

# 22. Invoice

Professional PDF

Company Logo

GST

Tax Summary

Grand Total

QR Code

---

# 23. API Standards

RESTful APIs

MVC Pattern

Validation

Pagination

Filtering

Sorting

Response Format

---

# 24. Deployment

Frontend

Vercel

Backend

Render

Database

MongoDB Atlas

Environment Variables

Production Build

---

# 25. Code Quality

Reusable Components

Reusable Hooks

Reusable Services

Clean Folder Structure

No Duplicate Code

Meaningful Naming

Comments where necessary

---

# 26. Documentation

README

Installation

Environment Variables

API Documentation

Deployment Guide

Screenshots

---

# 27. Final Deliverables

- Complete MERN Project
- Responsive UI
- JWT Authentication
- CRUD for all modules
- Barcode Support
- PDF Invoice
- CSV Import
- CSV Export
- Dashboard
- Analytics
- Reports
- Role-based Access
- Production-ready Folder Structure
- Clean Git History
- README

---

# 28. Implementation Checklist

Repeat this checklist during development until every item is complete.

- Authentication
- Authorization
- CRUD
- Validation
- Inventory Logic
- Warehouse Logic
- Bin Logic
- Stock Transfer
- Reports
- Dashboard
- Charts
- Mobile Responsive
- Dark Mode
- Testing
- Deployment

---

# 29. Development Principles

- SOLID principles
- DRY
- KISS
- Proper error handling
- Modular architecture
- Consistent API responses
- Loading states
- Empty states
- Optimistic UI where appropriate
- Accessibility

---

# 30. Instruction to AI

Do not skip any module.

Generate production-quality code.

Maintain enterprise folder structure.

Keep code modular.

Always explain every created file.

Never use placeholder business logic when real logic can be implemented.

Generate complete code module by module until the entire system is finished.