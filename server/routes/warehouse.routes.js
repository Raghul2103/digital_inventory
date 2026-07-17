const express = require('express');
const router = express.Router();
const {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  createBin,
  getBins,
  getBinById,
  updateBin,
  deleteBin
} = require('../controllers/warehouse.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(protect);

// Bins
router.post('/bins', authorize('manage_warehouses'), createBin);
router.get('/bins', authorize('view_warehouses'), getBins);
router.get('/bins/:id', authorize('view_warehouses'), getBinById);
router.put('/bins/:id', authorize('manage_warehouses'), updateBin);
router.delete('/bins/:id', authorize('manage_warehouses'), deleteBin);

// Warehouses
router.post('/', authorize('manage_warehouses'), createWarehouse);
router.get('/', authorize('view_warehouses'), getWarehouses);
router.get('/:id', authorize('view_warehouses'), getWarehouseById);
router.put('/:id', authorize('manage_warehouses'), updateWarehouse);
router.delete('/:id', authorize('manage_warehouses'), deleteWarehouse);

module.exports = router;
