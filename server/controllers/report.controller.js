const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const SaleItem = require('../models/SaleItem');
const PurchaseItem = require('../models/PurchaseItem');
const PDFDocument = require('pdfkit');

// GET /api/reports/sales
const getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: 'Completed' };

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    const sales = await Sale.find(query)
      .populate('customer', 'name email company')
      .sort({ saleDate: -1 });

    const totalRevenue = sales.reduce((acc, curr) => acc + curr.grandTotal, 0);
    const totalGST = sales.reduce((acc, curr) => acc + curr.gstAmount, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalOrders: sales.length,
        totalRevenue,
        totalGST
      },
      data: sales
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/purchases
const getPurchaseReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { status: 'Completed' };

    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(endDate);
    }

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name company')
      .sort({ purchaseDate: -1 });

    const totalExpense = purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalOrders: purchases.length,
        totalExpense
      },
      data: purchases
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/inventory
const getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'name')
      .populate('warehouse', 'name')
      .sort({ quantity: 1 }); // low stock at the top

    const totalQty = products.reduce((acc, curr) => acc + curr.quantity, 0);
    const totalCostValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.costPrice), 0);
    const totalRetailValue = products.reduce((acc, curr) => acc + (curr.quantity * curr.sellingPrice), 0);

    res.status(200).json({
      success: true,
      summary: {
        totalSKUs: products.length,
        totalQuantity: totalQty,
        totalCostValue,
        totalRetailValue
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/export/csv
const exportReportCSV = async (req, res, next) => {
  try {
    const { type } = req.query; // 'sales', 'purchases', 'inventory'
    let csvContent = '';
    let filename = '';

    if (type === 'sales') {
      const sales = await Sale.find({ status: 'Completed' }).populate('customer', 'name');
      filename = `sales_report_${Date.now()}.csv`;
      csvContent = 'Invoice Number,Customer,Date,Base Amount,GST Amount,Grand Total,Payment Status\n';
      sales.forEach(s => {
        csvContent += `"${s.invoiceNumber}","${s.customer ? s.customer.name : ''}","${new Date(s.saleDate).toLocaleDateString()}",${s.totalAmount},${s.gstAmount},${s.grandTotal},"${s.paymentStatus}"\n`;
      });
    } else if (type === 'purchases') {
      const purchases = await Purchase.find({ status: 'Completed' }).populate('supplier', 'name');
      filename = `purchases_report_${Date.now()}.csv`;
      csvContent = 'Purchase Number,Supplier,Date,Total Amount,Payment Status\n';
      purchases.forEach(p => {
        csvContent += `"${p.purchaseNumber}","${p.supplier ? p.supplier.name : ''}","${new Date(p.purchaseDate).toLocaleDateString()}",${p.totalAmount},"${p.paymentStatus}"\n`;
      });
    } else {
      // default: inventory
      const products = await Product.find().populate('category', 'name').populate('warehouse', 'name');
      filename = `inventory_report_${Date.now()}.csv`;
      csvContent = 'SKU,Product Name,Brand,Category,Warehouse,Cost Price,Selling Price,Stock Qty,Total Value (Cost)\n';
      products.forEach(p => {
        csvContent += `"${p.sku}","${p.name}","${p.brand}","${p.category ? p.category.name : ''}","${p.warehouse ? p.warehouse.name : ''}",${p.costPrice},${p.sellingPrice},${p.quantity},${p.quantity * p.costPrice}\n`;
      });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/export/pdf
const exportReportPDF = async (req, res, next) => {
  try {
    const { type } = req.query;
    const doc = new PDFDocument({ margin: 50 });
    let filename = `report_${type}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    doc.fontSize(20).text('InventoryFlow Executive Report', 50, 50, { bold: true });
    doc.fontSize(10).fillColor('#6B7280').text(`Generated: ${new Date().toLocaleDateString()}`).moveDown(2);

    if (type === 'sales') {
      doc.fontSize(14).fillColor('#1F2937').text('SALES SUMMARY REPORT', { underline: true });
      const sales = await Sale.find({ status: 'Completed' }).populate('customer');
      doc.moveDown();
      
      let y = doc.y;
      doc.fontSize(10).text('Invoice No', 50, y, { bold: true });
      doc.text('Customer', 150, y, { bold: true });
      doc.text('Date', 270, y, { bold: true });
      doc.text('Grand Total', 450, y, { bold: true, align: 'right' });
      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#9CA3AF');
      y += 20;

      sales.forEach(s => {
        doc.text(s.invoiceNumber, 50, y);
        doc.text(s.customer ? s.customer.name : 'Walk-in', 150, y);
        doc.text(new Date(s.saleDate).toLocaleDateString(), 270, y);
        doc.text(s.grandTotal.toFixed(2), 450, y, { align: 'right' });
        y += 18;
      });
    } else if (type === 'purchases') {
      doc.fontSize(14).fillColor('#1F2937').text('PURCHASES SUMMARY REPORT', { underline: true });
      const purchases = await Purchase.find({ status: 'Completed' }).populate('supplier');
      doc.moveDown();
      
      let y = doc.y;
      doc.fontSize(10).text('PO Number', 50, y, { bold: true });
      doc.text('Supplier', 150, y, { bold: true });
      doc.text('Date', 270, y, { bold: true });
      doc.text('Total Cost', 450, y, { bold: true, align: 'right' });
      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#9CA3AF');
      y += 20;

      purchases.forEach(p => {
        doc.text(p.purchaseNumber, 50, y);
        doc.text(p.supplier ? p.supplier.name : 'Unknown', 150, y);
        doc.text(new Date(p.purchaseDate).toLocaleDateString(), 270, y);
        doc.text(p.totalAmount.toFixed(2), 450, y, { align: 'right' });
        y += 18;
      });
    } else {
      doc.fontSize(14).fillColor('#1F2937').text('INVENTORY STOCK STATUS REPORT', { underline: true });
      const products = await Product.find().populate('category').populate('warehouse');
      doc.moveDown();
      
      let y = doc.y;
      doc.fontSize(10).text('SKU', 50, y, { bold: true });
      doc.text('Product Name', 120, y, { bold: true });
      doc.text('Warehouse', 280, y, { bold: true });
      doc.text('Cost Price', 380, y, { bold: true, align: 'right' });
      doc.text('Stock Qty', 470, y, { bold: true, align: 'right' });
      doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke('#9CA3AF');
      y += 20;

      products.forEach(p => {
        doc.text(p.sku, 50, y);
        doc.text(p.name.substring(0, 25), 120, y);
        doc.text(p.warehouse ? p.warehouse.name : 'Unassigned', 280, y);
        doc.text(p.costPrice.toFixed(2), 380, y, { align: 'right' });
        doc.text(p.quantity.toString(), 470, y, { align: 'right' });
        y += 18;
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  exportReportCSV,
  exportReportPDF
};
