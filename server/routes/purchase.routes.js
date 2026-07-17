const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getPurchases,
  getPurchaseById
} = require('../controllers/purchase.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', authorize('manage_purchases'), createPurchase);
router.get('/', authorize('view_purchases'), getPurchases);
router.get('/:id', authorize('view_purchases'), getPurchaseById);

module.exports = router;
