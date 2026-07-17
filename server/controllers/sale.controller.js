const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const Warehouse = require('../models/Warehouse');
const Bin = require('../models/Bin');
const Setting = require('../models/Setting');
const { saleSchema } = require('../validators/transaction.validator');
const { logActivity } = require('./activity.controller');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// POST /api/sales
const createSale = async (req, res, next) => {
  try {
    const validation = saleSchema.safeParse(req.body);
    if (!validation.success) return next(validation.error);

    const { customer: customerId, items, notes, paymentStatus } = validation.data;

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const invoiceNumber = `INV-${Date.now()}`;
    let totalAmount = 0; // base price sum
    let gstAmount = 0;
    const processedItems = [];

    // First pass: Verify inventory availability
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      // Warehouse / Bin selection logic
      const sourceWarehouse = item.warehouse || product.warehouse;
      const sourceBin = item.bin || product.bin;

      if (!sourceWarehouse || !sourceBin) {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} must have a designated warehouse and bin for stock verification.`
        });
      }

      // Check Inventory record
      const invRecord = await Inventory.findOne({
        product: product._id,
        warehouse: sourceWarehouse,
        bin: sourceBin
      });

      if (!invRecord || invRecord.quantity < item.quantity) {
        const available = invRecord ? invRecord.quantity : 0;
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product '${product.name}' in selected warehouse/bin. Requested: ${item.quantity}, Available: ${available}`
        });
      }

      const itemGst = item.gst || product.gst;
      const itemBase = item.quantity * item.sellingPrice;
      const itemGstAmt = itemBase * (itemGst / 100);
      const itemSubtotal = itemBase + itemGstAmt;

      totalAmount += itemBase;
      gstAmount += itemGstAmt;

      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        gst: itemGst,
        subtotal: itemSubtotal,
        warehouse: sourceWarehouse,
        bin: sourceBin,
        invRecord
      });
    }

    const grandTotal = totalAmount + gstAmount;

    // Generate Invoice QR Code (containing payment/validation link)
    const qrString = `Invoice: ${invoiceNumber}\nTotal: INR ${grandTotal.toFixed(2)}\nCustomer: ${customer.name}`;
    const qrCodeBase64 = await QRCode.toDataURL(qrString);

    // Create Sale record
    const sale = await Sale.create({
      invoiceNumber,
      customer: customerId,
      totalAmount,
      gstAmount,
      grandTotal,
      status: 'Completed',
      paymentStatus,
      qrCode: qrCodeBase64,
      notes
    });

    // Second pass: Deduct stock from Inventory and Product schemas
    for (const item of processedItems) {
      await SaleItem.create({
        sale: sale._id,
        product: item.product,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        gst: item.gst,
        subtotal: item.subtotal
      });

      // Decrement Inventory location stock
      item.invRecord.quantity -= item.quantity;
      await item.invRecord.save();

      // Decrement Product aggregate stock
      await Product.findByIdAndUpdate(item.product, {
        $inc: { quantity: -item.quantity }
      });
    }

    await logActivity(req.user._id, 'Sale', 'Sales', `Created invoice ${invoiceNumber}. Grand Total: ${grandTotal.toFixed(2)}`, req);

    res.status(201).json({
      success: true,
      data: sale,
      itemsCount: processedItems.length
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales
const getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find()
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/:id
const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name email phone address');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const items = await SaleItem.find({ sale: sale._id })
      .populate('product', 'sku barcode name brand');

    res.status(200).json({ success: true, data: sale, items });
  } catch (error) {
    next(error);
  }
};

// GET /api/sales/:id/invoice-pdf
const generateInvoicePDF = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('customer');
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    const items = await SaleItem.find({ sale: sale._id }).populate('product');
    const settings = (await Setting.findOne()) || {
      companyName: 'InventoryFlow Inc',
      companyAddress: '123 Warehouse St, Bangalore, India',
      companyPhone: '+91 9999999999',
      companyEmail: 'info@inventoryflow.com',
      companyGST: '29AAAAA0000A1Z5',
      currency: 'INR'
    };

    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF directly to client response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice_${sale.invoiceNumber}.pdf`);
    doc.pipe(res);

    // Header layout
    doc.fillColor('#1F2937').fontSize(20).text(settings.companyName, 50, 50, { bold: true });
    doc.fontSize(10).fillColor('#6B7280')
       .text(`Address: ${settings.companyAddress}`)
       .text(`GSTIN: ${settings.companyGST}`)
       .text(`Phone: ${settings.companyPhone} | Email: ${settings.companyEmail}`)
       .moveDown();

    doc.moveTo(50, 115).lineTo(550, 115).stroke('#E5E7EB');

    // Invoice Meta / Customer Details
    doc.moveDown();
    const yPos = doc.y;
    doc.fillColor('#1F2937').fontSize(12).text('BILL TO:', 50, yPos, { bold: true });
    doc.fontSize(10).fillColor('#374151')
       .text(sale.customer.name)
       .text(`Address: ${sale.customer.address}`)
       .text(`Phone: ${sale.customer.phone}`)
       .text(`Email: ${sale.customer.email}`);

    doc.fillColor('#1F2937').fontSize(12).text('INVOICE DETAILS:', 350, yPos, { bold: true });
    doc.fontSize(10).fillColor('#374151')
       .text(`Invoice No: ${sale.invoiceNumber}`, 350)
       .text(`Date: ${new Date(sale.saleDate).toLocaleDateString()}`)
       .text(`Payment Status: ${sale.paymentStatus}`)
       .text(`Currency: ${settings.currency}`);

    doc.moveDown(2);

    // Table Headers
    const tableTop = doc.y;
    doc.fillColor('#1F2937').fontSize(10);
    doc.text('Product Description', 50, tableTop, { bold: true, width: 200 });
    doc.text('Qty', 250, tableTop, { bold: true, width: 40, align: 'right' });
    doc.text('Price', 300, tableTop, { bold: true, width: 70, align: 'right' });
    doc.text('GST', 380, tableTop, { bold: true, width: 50, align: 'right' });
    doc.text('Subtotal', 450, tableTop, { bold: true, width: 100, align: 'right' });

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#9CA3AF');

    let currentY = tableTop + 20;

    // Table Rows
    items.forEach(item => {
      doc.fillColor('#4B5563');
      doc.text(`${item.product.name} (${item.product.sku})`, 50, currentY, { width: 200 });
      doc.text(item.quantity.toString(), 250, currentY, { width: 40, align: 'right' });
      doc.text(item.sellingPrice.toFixed(2), 300, currentY, { width: 70, align: 'right' });
      doc.text(`${item.gst}%`, 380, currentY, { width: 50, align: 'right' });
      doc.text(item.subtotal.toFixed(2), 450, currentY, { width: 100, align: 'right' });

      currentY += 20;
    });

    doc.moveTo(50, currentY).lineTo(550, currentY).stroke('#E5E7EB');
    currentY += 10;

    // Invoice Totals & QR Code Placement
    doc.fillColor('#1F2937');
    doc.text('Base Value:', 350, currentY, { width: 100, align: 'right' });
    doc.text(`${sale.totalAmount.toFixed(2)}`, 450, currentY, { width: 100, align: 'right' });

    currentY += 15;
    doc.text('GST Amount:', 350, currentY, { width: 100, align: 'right' });
    doc.text(`${sale.gstAmount.toFixed(2)}`, 450, currentY, { width: 100, align: 'right' });

    currentY += 20;
    doc.fontSize(12).text('Grand Total:', 350, currentY, { bold: true, width: 100, align: 'right' });
    doc.text(`${sale.grandTotal.toFixed(2)}`, 450, currentY, { bold: true, width: 100, align: 'right' });

    // QR Code Drawing
    if (sale.qrCode) {
      const base64Data = sale.qrCode.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      doc.image(qrBuffer, 50, currentY - 50, { width: 80, height: 80 });
      doc.fontSize(8).fillColor('#9CA3AF').text('Scan to verify payment', 50, currentY + 35);
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  generateInvoicePDF
};
