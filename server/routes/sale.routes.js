const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  generateInvoicePDF
} = require('../controllers/sale.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', authorize('manage_sales'), createSale);
router.get('/', authorize('view_sales'), getSales);
router.get('/:id/pdf', authorize('view_sales'), generateInvoicePDF);
router.get('/:id', authorize('view_sales'), getSaleById);

module.exports = router;
