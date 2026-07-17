const express = require('express');
const router = express.Router();
const {
  getSalesReport,
  getPurchaseReport,
  getInventoryReport,
  exportReportCSV,
  exportReportPDF
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);
router.use(authorize('view_reports', 'manage_reports'));

router.get('/sales', getSalesReport);
router.get('/purchases', getPurchaseReport);
router.get('/inventory', getInventoryReport);
router.get('/export/csv', exportReportCSV);
router.get('/export/pdf', exportReportPDF);

module.exports = router;
