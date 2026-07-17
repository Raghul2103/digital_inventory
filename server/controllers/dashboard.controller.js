const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const ActivityLog = require('../models/ActivityLog');

// GET /api/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Core counters
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    const totalSuppliers = await Supplier.countDocuments();

    // Low stock check (quantity <= reorderLevel)
    const lowStockProductsCount = await Product.countDocuments({
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    });

    // 2. Sales sum
    const salesAgg = await Sale.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const totalSalesAmount = salesAgg.length > 0 ? salesAgg[0].total : 0;

    // 3. Purchase sum
    const purchaseAgg = await Purchase.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalPurchasesAmount = purchaseAgg.length > 0 ? purchaseAgg[0].total : 0;

    // 4. Today's sales (from midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todaySalesAgg = await Sale.aggregate([
      { 
        $match: { 
          status: 'Completed',
          saleDate: { $gte: startOfToday }
        } 
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const todaySalesAmount = todaySalesAgg.length > 0 ? todaySalesAgg[0].total : 0;

    // 5. Current month sales (revenue)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlySalesAgg = await Sale.aggregate([
      {
        $match: {
          status: 'Completed',
          saleDate: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const monthlySalesAmount = monthlySalesAgg.length > 0 ? monthlySalesAgg[0].total : 0;

    // 6. Recent Activity logs (top 5)
    const recentLogs = await ActivityLog.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // 7. Low stock products list (top 5)
    const lowStockList = await Product.find({
      $expr: { $lte: ["$quantity", "$reorderLevel"] }
    })
      .populate('category', 'name')
      .limit(5);

    // 8. Monthly Sales Trends (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySalesTrend = await Sale.aggregate([
      {
        $match: {
          status: 'Completed',
          saleDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' }
          },
          sales: { $sum: '$grandTotal' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format trend data for frontend
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const salesTrendFormatted = monthlySalesTrend.map(item => {
      return {
        name: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        Sales: item.sales
      };
    });

    // 9. Category distribution
    const categoryDistribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $project: {
          name: '$categoryDetails.name',
          value: '$count'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalCustomers,
          totalSuppliers,
          lowStockProductsCount,
          totalSalesAmount,
          totalPurchasesAmount,
          todaySalesAmount,
          monthlySalesAmount
        },
        recentLogs,
        lowStockList,
        salesTrend: salesTrendFormatted,
        categoryDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
