const express = require('express');
const router = express.Router();
const {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplier.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

router.post('/', authorize('manage_suppliers'), createSupplier);
router.get('/', authorize('view_suppliers'), getSuppliers);
router.get('/:id', authorize('view_suppliers'), getSupplierById);
router.put('/:id', authorize('manage_suppliers'), updateSupplier);
router.delete('/:id', authorize('manage_suppliers'), deleteSupplier);

module.exports = router;
